import { createHash } from "node:crypto";

import type {
  ExecutionPermit,
  ErrorResponse,
  PermitCheck,
  PermitVerificationRequest,
  PermitVerificationResponse,
  RiskVerdict,
  SentinelEvaluationResponse,
  SignedVerdict,
  TradeIntent,
  TradeVenue,
  VerdictAction,
  OrderSide,
  OrderType,
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

type PermitVerificationValidationSuccess = {
  ok: true;
  value: PermitVerificationRequest;
};

type PermitVerificationValidationFailure = {
  ok: false;
  error: ErrorResponse;
};

export type PermitVerificationValidationResult =
  | PermitVerificationValidationSuccess
  | PermitVerificationValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveNumericString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number(value) > 0;
}

function isNonNegativeNumericString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && Number(value) >= 0;
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isVerdictAction(value: unknown): value is VerdictAction {
  return ["ALLOW", "DENY", "ALLOW_WITH_DOWNSIZE"].includes(String(value));
}

function isTradeVenue(value: unknown): value is TradeVenue {
  return ["kraken", "aerodrome", "demo"].includes(String(value));
}

function isOrderSide(value: unknown): value is OrderSide {
  return ["BUY", "SELL"].includes(String(value));
}

function isOrderType(value: unknown): value is OrderType {
  return ["MARKET", "LIMIT"].includes(String(value));
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

function buildPermitCheck(name: string, ok: boolean, detail: string): PermitCheck {
  return {
    name,
    ok,
    detail,
  };
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
  if (!isTradeVenue(input.venue)) {
    errors.push("venue must be one of kraken, aerodrome, or demo.");
  }
  if (!Number.isInteger(input.chain_id) || Number(input.chain_id) <= 0) {
    errors.push("chain_id must be a positive integer.");
  }
  if (typeof input.market !== "string" || input.market.trim().length === 0) {
    errors.push("market must be a non-empty string.");
  }
  if (!isOrderSide(input.side)) {
    errors.push("side must be BUY or SELL.");
  }
  if (!isOrderType(input.order_type)) {
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

function validateRiskVerdict(input: unknown): input is RiskVerdict {
  return (
    isRecord(input) &&
    typeof input.trace_id === "string" &&
    isVerdictAction(input.verdict) &&
    Number.isInteger(input.risk_score) &&
    Number(input.risk_score) >= 0 &&
    typeof input.reason_code === "string" &&
    isStringArray(input.reason_detail) &&
    isNonNegativeNumericString(input.allowed_notional_usd) &&
    typeof input.decision_hash === "string" &&
    isValidIsoTimestamp(input.expires_at) &&
    typeof input.policy_version === "string" &&
    typeof input.judge_mode === "boolean"
  );
}

function validateExecutionPermit(input: unknown): input is ExecutionPermit {
  return (
    isRecord(input) &&
    typeof input.trace_id === "string" &&
    typeof input.agent_id === "string" &&
    typeof input.intent_id === "string" &&
    isTradeVenue(input.venue) &&
    Number.isInteger(input.chain_id) &&
    Number(input.chain_id) > 0 &&
    typeof input.market === "string" &&
    isOrderSide(input.side) &&
    isOrderType(input.order_type) &&
    isNonNegativeNumericString(input.approved_notional_usd) &&
    Number.isInteger(input.max_slippage_bps) &&
    Number(input.max_slippage_bps) >= 0 &&
    typeof input.decision_hash === "string" &&
    isValidIsoTimestamp(input.expires_at)
  );
}

function validateSignedVerdict(input: unknown): input is SignedVerdict {
  return (
    isRecord(input) &&
    typeof input.trace_id === "string" &&
    typeof input.decision_hash === "string" &&
    typeof input.permit_hash === "string" &&
    typeof input.signature === "string" &&
    typeof input.signer === "string" &&
    isValidIsoTimestamp(input.signed_at) &&
    isValidIsoTimestamp(input.expires_at) &&
    typeof input.schema_version === "string" &&
    validateRiskVerdict(input.verdict_payload) &&
    validateExecutionPermit(input.permit_payload)
  );
}

export function validatePermitVerificationRequest(
  input: unknown,
): PermitVerificationValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: {
        error: "invalid_permit_verification_request",
        details: ["Payload must be a JSON object."],
      },
    };
  }

  const intentValidation = validateTradeIntent(input.intent);
  const errors = intentValidation.ok ? [] : [...intentValidation.error.details];

  if (!validateSignedVerdict(input.signed_verdict)) {
    errors.push("signed_verdict must be a valid signed verdict object.");
  }
  if (
    input.requested_notional_usd !== undefined &&
    !isPositiveNumericString(input.requested_notional_usd)
  ) {
    errors.push("requested_notional_usd must be a positive numeric string when provided.");
  }
  if (input.verified_at !== undefined && !isValidIsoTimestamp(input.verified_at)) {
    errors.push("verified_at must be a valid ISO 8601 timestamp when provided.");
  }

  if (errors.length > 0 || !intentValidation.ok) {
    return {
      ok: false,
      error: {
        error: "invalid_permit_verification_request",
        details: errors,
      },
    };
  }

  return {
    ok: true,
    value: {
      intent: intentValidation.value,
      signed_verdict: input.signed_verdict,
      requested_notional_usd: input.requested_notional_usd,
      verified_at: input.verified_at,
    },
  };
}

function hashRiskVerdictPayload(verdict: Omit<RiskVerdict, "decision_hash">): string {
  return sha256Hex(stableStringify(verdict));
}

function buildExecutionPermit(
  intent: TradeIntent,
  verdict: RiskVerdict,
): ExecutionPermit {
  return {
    trace_id: intent.trace_id,
    agent_id: intent.agent_id,
    intent_id: intent.intent_id,
    venue: intent.venue,
    chain_id: intent.chain_id,
    market: intent.market,
    side: intent.side,
    order_type: intent.order_type,
    approved_notional_usd: verdict.allowed_notional_usd,
    max_slippage_bps: intent.max_slippage_bps,
    decision_hash: verdict.decision_hash,
    expires_at: verdict.expires_at,
  };
}

function hashExecutionPermit(permit: ExecutionPermit): string {
  return sha256Hex(stableStringify(permit));
}

function buildVerdictSignature(
  decisionHash: string,
  permitHash: string,
  signedAt: string,
): string {
  return sha256Hex(
    `${DEMO_SIGNER}:${decisionHash}:${permitHash}:${signedAt}:${SCHEMA_VERSION}`,
  );
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
    decision_hash: hashRiskVerdictPayload(verdictPayload),
  };
}

function signVerdict(intent: TradeIntent, verdict: RiskVerdict): SignedVerdict {
  const permitPayload = buildExecutionPermit(intent, verdict);
  const permitHash = hashExecutionPermit(permitPayload);

  return {
    trace_id: verdict.trace_id,
    decision_hash: verdict.decision_hash,
    permit_hash: permitHash,
    signature: buildVerdictSignature(
      verdict.decision_hash,
      permitHash,
      intent.submitted_at,
    ),
    signer: DEMO_SIGNER,
    signed_at: intent.submitted_at,
    expires_at: verdict.expires_at,
    schema_version: SCHEMA_VERSION,
    verdict_payload: verdict,
    permit_payload: permitPayload,
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
    signed_verdict: signVerdict(intent, verdict),
  };
}

export function verifyTradePermit(
  request: PermitVerificationRequest,
): PermitVerificationResponse {
  const { intent, signed_verdict: signedVerdict } = request;
  const requestedNotionalUsd = request.requested_notional_usd ?? intent.notional_usd;
  const verifiedAt = request.verified_at ?? signedVerdict.signed_at;
  const canonicalPermit = buildExecutionPermit(intent, signedVerdict.verdict_payload);
  const canonicalPermitHash = hashExecutionPermit(canonicalPermit);
  const canonicalDecisionHash = hashRiskVerdictPayload({
    trace_id: signedVerdict.verdict_payload.trace_id,
    verdict: signedVerdict.verdict_payload.verdict,
    risk_score: signedVerdict.verdict_payload.risk_score,
    reason_code: signedVerdict.verdict_payload.reason_code,
    reason_detail: signedVerdict.verdict_payload.reason_detail,
    allowed_notional_usd: signedVerdict.verdict_payload.allowed_notional_usd,
    expires_at: signedVerdict.verdict_payload.expires_at,
    policy_version: signedVerdict.verdict_payload.policy_version,
    judge_mode: signedVerdict.verdict_payload.judge_mode,
  });
  const expectedSignature = buildVerdictSignature(
    canonicalDecisionHash,
    canonicalPermitHash,
    signedVerdict.signed_at,
  );

  const traceMatches =
    signedVerdict.trace_id === intent.trace_id &&
    signedVerdict.trace_id === signedVerdict.verdict_payload.trace_id &&
    signedVerdict.trace_id === signedVerdict.permit_payload.trace_id;
  const decisionHashMatches =
    signedVerdict.decision_hash === signedVerdict.verdict_payload.decision_hash &&
    signedVerdict.decision_hash === canonicalDecisionHash;
  const permitScopeMatches =
    stableStringify(signedVerdict.permit_payload) === stableStringify(canonicalPermit);
  const permitHashMatches = signedVerdict.permit_hash === canonicalPermitHash;
  const signerMatches = signedVerdict.signer === DEMO_SIGNER;
  const signatureMatches = signedVerdict.signature === expectedSignature;
  const schemaMatches = signedVerdict.schema_version === SCHEMA_VERSION;
  const expiryMatches =
    signedVerdict.expires_at === signedVerdict.verdict_payload.expires_at &&
    signedVerdict.expires_at === signedVerdict.permit_payload.expires_at;
  const notExpired =
    Date.parse(verifiedAt) <= Date.parse(signedVerdict.expires_at);
  const verdictAllows =
    signedVerdict.verdict_payload.verdict === "ALLOW" ||
    signedVerdict.verdict_payload.verdict === "ALLOW_WITH_DOWNSIZE";
  const requestedWithinApproved =
    Number(requestedNotionalUsd) <=
    Number(signedVerdict.permit_payload.approved_notional_usd);

  const checks = [
    buildPermitCheck(
      "trace_id_matches",
      traceMatches,
      traceMatches
        ? "Trace identifiers stay aligned across the intent and signed permit envelope."
        : "Trace identifiers are not aligned across the intent and signed permit envelope.",
    ),
    buildPermitCheck(
      "decision_hash_matches",
      decisionHashMatches,
      decisionHashMatches
        ? "Signed decision hash matches the canonical verdict payload."
        : "Signed decision hash does not match the canonical verdict payload.",
    ),
    buildPermitCheck(
      "permit_scope_matches",
      permitScopeMatches,
      permitScopeMatches
        ? "Permit payload matches the submitted execution intent envelope."
        : "Permit payload does not match the submitted execution intent envelope.",
    ),
    buildPermitCheck(
      "permit_hash_matches",
      permitHashMatches,
      permitHashMatches
        ? "Permit hash matches the canonical permit payload."
        : "Permit hash does not match the canonical permit payload.",
    ),
    buildPermitCheck(
      "signer_matches",
      signerMatches,
      signerMatches
        ? "Signer matches the deterministic judge-mode demo signer."
        : "Signer does not match the deterministic judge-mode demo signer.",
    ),
    buildPermitCheck(
      "signature_matches",
      signatureMatches,
      signatureMatches
        ? "Signature matches the canonical demo signing envelope."
        : "Signature does not match the canonical demo signing envelope.",
    ),
    buildPermitCheck(
      "schema_version_supported",
      schemaMatches,
      schemaMatches
        ? "Schema version is supported by the judge-mode verifier."
        : "Schema version is not supported by the judge-mode verifier.",
    ),
    buildPermitCheck(
      "expiry_matches",
      expiryMatches,
      expiryMatches
        ? "Top-level, verdict, and permit expiry fields are aligned."
        : "Expiry fields are not aligned across the signed verdict envelope.",
    ),
    buildPermitCheck(
      "permit_not_expired",
      notExpired,
      notExpired
        ? "Permit was verified within the allowed TTL window."
        : "Permit has expired and is no longer executable.",
    ),
    buildPermitCheck(
      "verdict_allows_execution",
      verdictAllows,
      verdictAllows
        ? "Verdict action allows execution when the request stays within scope."
        : "Verdict action denies execution.",
    ),
    buildPermitCheck(
      "requested_notional_within_approved",
      requestedWithinApproved,
      requestedWithinApproved
        ? "Requested execution notional stays within the approved permit envelope."
        : "Requested execution notional exceeds the approved permit envelope.",
    ),
  ];

  const permitValid =
    traceMatches &&
    decisionHashMatches &&
    permitScopeMatches &&
    permitHashMatches &&
    signerMatches &&
    signatureMatches &&
    schemaMatches &&
    expiryMatches &&
    notExpired;
  const executable = permitValid && verdictAllows && requestedWithinApproved;

  let verificationCode = "EXECUTION_PERMITTED";
  if (!traceMatches || !decisionHashMatches || !permitScopeMatches || !permitHashMatches) {
    verificationCode = "PERMIT_SCOPE_MISMATCH";
  } else if (!signerMatches || !signatureMatches) {
    verificationCode = "SIGNATURE_INVALID";
  } else if (!schemaMatches) {
    verificationCode = "SCHEMA_VERSION_UNSUPPORTED";
  } else if (!expiryMatches || !notExpired) {
    verificationCode = "VERDICT_EXPIRED";
  } else if (!verdictAllows) {
    verificationCode = "VERDICT_DENIES_EXECUTION";
  } else if (!requestedWithinApproved) {
    verificationCode = "REQUEST_EXCEEDS_APPROVED_NOTIONAL";
  }

  return {
    trace_id: intent.trace_id,
    permit_valid: permitValid,
    executable,
    verification_code: verificationCode,
    requested_notional_usd: formatUsd(Number(requestedNotionalUsd)),
    approved_notional_usd: signedVerdict.permit_payload.approved_notional_usd,
    decision_hash: signedVerdict.decision_hash,
    permit_hash: signedVerdict.permit_hash,
    verified_at: verifiedAt,
    judge_mode: signedVerdict.verdict_payload.judge_mode,
    checks,
  };
}
