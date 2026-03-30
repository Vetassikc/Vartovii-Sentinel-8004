import { createHash } from "node:crypto";

import type {
  ErrorResponse,
  RiskVerdict,
  SentinelEvaluationResponse,
  SignedVerdict,
  TradeIntent,
  VerdictAction,
} from "../../shared/schemas/sentinel.ts";

const ALLOWED_MARKETS = new Set(["BTC/USD", "ETH/USD"]);
const SOFT_NOTIONAL_CAP_USD = 2500;
const HARD_NOTIONAL_CAP_USD = 5000;
const DEFAULT_TTL_MS = 5 * 60 * 1000;
const POLICY_VERSION = "judge-demo-v1";
const SCHEMA_VERSION = "sentinel-8004-v1";
const DEMO_SIGNER = "sentinel-demo-signer";

type ValidationSuccess = {
  ok: true;
  value: TradeIntent;
};

type ValidationFailure = {
  ok: false;
  error: ErrorResponse;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveNumericString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number(value) > 0;
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function formatUsd(value: number): string {
  return value.toFixed(2);
}

function sha256Hex(value: string): string {
  return `0x${createHash("sha256").update(value).digest("hex")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function extractUnavailableSignals(
  strategyContext: Record<string, unknown>,
): string[] {
  const requiredSignals = strategyContext.required_signals;
  if (!isRecord(requiredSignals)) {
    return [];
  }

  return Object.entries(requiredSignals)
    .filter(([, status]) => status !== "available")
    .map(([signalName]) => signalName);
}

export function validateTradeIntent(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: {
        error: "invalid_trade_intent",
        details: ["Payload must be a JSON object."],
      },
    };
  }

  const errors: string[] = [];

  if (typeof input.trace_id !== "string" || input.trace_id.trim().length === 0) {
    errors.push("trace_id must be a non-empty string.");
  }
  if (typeof input.agent_id !== "string" || input.agent_id.trim().length === 0) {
    errors.push("agent_id must be a non-empty string.");
  }
  if (typeof input.intent_id !== "string" || input.intent_id.trim().length === 0) {
    errors.push("intent_id must be a non-empty string.");
  }
  if (!["kraken", "aerodrome", "demo"].includes(String(input.venue))) {
    errors.push("venue must be one of kraken, aerodrome, or demo.");
  }
  if (!Number.isInteger(input.chain_id) || Number(input.chain_id) <= 0) {
    errors.push("chain_id must be a positive integer.");
  }
  if (typeof input.market !== "string" || input.market.trim().length === 0) {
    errors.push("market must be a non-empty string.");
  }
  if (!["BUY", "SELL"].includes(String(input.side))) {
    errors.push("side must be BUY or SELL.");
  }
  if (!["MARKET", "LIMIT"].includes(String(input.order_type))) {
    errors.push("order_type must be MARKET or LIMIT.");
  }
  if (!isPositiveNumericString(input.size_base)) {
    errors.push("size_base must be a positive numeric string.");
  }
  if (!isPositiveNumericString(input.notional_usd)) {
    errors.push("notional_usd must be a positive numeric string.");
  }
  if (
    !Number.isInteger(input.max_slippage_bps) ||
    Number(input.max_slippage_bps) < 0
  ) {
    errors.push("max_slippage_bps must be a non-negative integer.");
  }
  if (!isRecord(input.strategy_context)) {
    errors.push("strategy_context must be an object.");
  }
  if (!isValidIsoTimestamp(input.submitted_at)) {
    errors.push("submitted_at must be a valid ISO 8601 timestamp.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: {
        error: "invalid_trade_intent",
        details: errors,
      },
    };
  }

  return {
    ok: true,
    value: input as TradeIntent,
  };
}

function buildRiskVerdict(
  intent: TradeIntent,
  verdict: VerdictAction,
  riskScore: number,
  reasonCode: string,
  reasonDetail: string[],
  allowedNotionalUsd: string,
  expiresAt: string,
): RiskVerdict {
  const verdictPayload: Omit<RiskVerdict, "decision_hash"> = {
    trace_id: intent.trace_id,
    verdict,
    risk_score: Math.min(100, riskScore),
    reason_code: reasonCode,
    reason_detail: reasonDetail,
    allowed_notional_usd: allowedNotionalUsd,
    expires_at: expiresAt,
    policy_version: POLICY_VERSION,
    judge_mode: true,
  };

  return {
    ...verdictPayload,
    decision_hash: sha256Hex(stableStringify(verdictPayload)),
  };
}

function signVerdict(verdict: RiskVerdict, submittedAt: string): SignedVerdict {
  return {
    trace_id: verdict.trace_id,
    decision_hash: verdict.decision_hash,
    signature: sha256Hex(
      `${DEMO_SIGNER}:${verdict.decision_hash}:${submittedAt}:${SCHEMA_VERSION}`,
    ),
    signer: DEMO_SIGNER,
    signed_at: submittedAt,
    expires_at: verdict.expires_at,
    schema_version: SCHEMA_VERSION,
    verdict_payload: verdict,
  };
}

export function evaluateTradeIntent(intent: TradeIntent): SentinelEvaluationResponse {
  const notionalUsd = Number(intent.notional_usd);
  const submittedAt = new Date(intent.submitted_at);
  const expiresAt = new Date(submittedAt.getTime() + DEFAULT_TTL_MS).toISOString();
  const unavailableSignals = extractUnavailableSignals(intent.strategy_context);

  let riskScore = 20;
  if (intent.market === "ETH/USD") {
    riskScore += 8;
  }
  if (notionalUsd > SOFT_NOTIONAL_CAP_USD) {
    riskScore += 33;
  }
  if (notionalUsd > HARD_NOTIONAL_CAP_USD) {
    riskScore += 25;
  }
  if (unavailableSignals.length > 0) {
    riskScore += 60;
  }
  if (intent.max_slippage_bps > 50) {
    riskScore += 5;
  }

  let verdict: RiskVerdict;
  if (unavailableSignals.length > 0) {
    verdict = buildRiskVerdict(
      intent,
      "DENY",
      riskScore,
      "ORACLE_UNAVAILABLE",
      unavailableSignals.map((signal) => `required_signal_unavailable:${signal}`).concat(
        "fail_closed_policy_triggered",
      ),
      formatUsd(0),
      expiresAt,
    );
  } else if (!ALLOWED_MARKETS.has(intent.market)) {
    verdict = buildRiskVerdict(
      intent,
      "DENY",
      riskScore + 20,
      "MARKET_NOT_WHITELISTED",
      ["market_not_in_demo_allowlist", "execution_blocked"],
      formatUsd(0),
      expiresAt,
    );
  } else if (notionalUsd > HARD_NOTIONAL_CAP_USD) {
    verdict = buildRiskVerdict(
      intent,
      "DENY",
      riskScore,
      "POSITION_SIZE_EXCEEDS_LIMIT",
      ["requested_notional_above_hard_cap", "execution_blocked"],
      formatUsd(0),
      expiresAt,
    );
  } else if (notionalUsd > SOFT_NOTIONAL_CAP_USD) {
    verdict = buildRiskVerdict(
      intent,
      "ALLOW_WITH_DOWNSIZE",
      riskScore,
      "POSITION_SIZE_EXCEEDS_LIMIT",
      ["requested_notional_above_soft_cap", "downsized_to_policy_cap"],
      formatUsd(SOFT_NOTIONAL_CAP_USD),
      expiresAt,
    );
  } else {
    verdict = buildRiskVerdict(
      intent,
      "ALLOW",
      riskScore,
      "RISK_WITHIN_POLICY",
      ["market_allowlisted", "requested_notional_within_policy_cap", "required_signals_available"],
      formatUsd(notionalUsd),
      expiresAt,
    );
  }

  return {
    ...verdict,
    signed_verdict: signVerdict(verdict, intent.submitted_at),
  };
}
