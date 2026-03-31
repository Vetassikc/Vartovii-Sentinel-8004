import type {
  KrakenExecutionPreview,
  KrakenOrderValidatePreview,
  SentinelEvaluationResponse,
  TradeIntent,
} from "../../shared/schemas/sentinel.ts";
import { verifyTradePermit } from "./policy.ts";

const EXECUTION_PREVIEW_SCHEMA_VERSION = "sentinel-8004-kraken-execution-preview-v1";

function formatUsd(value: number): string {
  return value.toFixed(2);
}

function formatBaseSize(value: number, template: string): string {
  const decimals = template.includes(".") ? template.split(".")[1].length : 0;
  return value.toFixed(decimals);
}

function buildZeroBaseSize(template: string): string {
  return formatBaseSize(0, template);
}

function buildKrakenOrderPreview(
  intent: TradeIntent,
  orderQty: string,
  cashOrderQty: string,
): KrakenOrderValidatePreview {
  return {
    symbol: intent.market,
    side: intent.side.toLowerCase() as KrakenOrderValidatePreview["side"],
    order_type: intent.order_type.toLowerCase() as KrakenOrderValidatePreview["order_type"],
    order_qty: orderQty,
    cash_order_qty: cashOrderQty,
    validate: true,
  };
}

export function buildKrakenExecutionPreview(
  intent: TradeIntent,
  evaluation: SentinelEvaluationResponse,
): KrakenExecutionPreview {
  const requestedVerification = verifyTradePermit({
    intent,
    signed_verdict: evaluation.signed_verdict,
  });
  const requestedNotionalUsd = formatUsd(Number(intent.notional_usd));
  const approvedNotionalUsd = evaluation.signed_verdict.permit_payload.approved_notional_usd;
  const zeroBaseSize = buildZeroBaseSize(intent.size_base);
  const requestedOrder = buildKrakenOrderPreview(
    intent,
    intent.size_base,
    requestedNotionalUsd,
  );

  let executionDisposition: KrakenExecutionPreview["execution_disposition"] = "BLOCKED";
  let executableOrder: KrakenExecutionPreview["executable_order"];
  let executableNotionalUsd = formatUsd(0);
  let executableSizeBase = zeroBaseSize;
  let executableVerificationCode = "NOT_EMITTED";
  const previewChecks = [
    "kraken_validate_only_preview",
    intent.venue === "kraken" ? "source_venue_is_kraken" : "source_venue_not_kraken",
    "requested_order_projected_from_trade_intent",
  ];

  if (intent.venue === "kraken" && evaluation.verdict === "ALLOW" && requestedVerification.executable) {
    executionDisposition = "ALLOWED_AS_REQUESTED";
    executableOrder = requestedOrder;
    executableNotionalUsd = requestedNotionalUsd;
    executableSizeBase = intent.size_base;
    executableVerificationCode = requestedVerification.verification_code;
    previewChecks.push(
      "sentinel_verdict_allows_requested_order",
      "requested_order_matches_executable_order",
    );
  } else if (intent.venue === "kraken" && evaluation.verdict === "ALLOW_WITH_DOWNSIZE") {
    const approvedRatio = Number(approvedNotionalUsd) / Number(intent.notional_usd);
    const downsizedBaseSize = formatBaseSize(Number(intent.size_base) * approvedRatio, intent.size_base);
    const executableVerification = verifyTradePermit({
      intent,
      signed_verdict: evaluation.signed_verdict,
      requested_notional_usd: approvedNotionalUsd,
    });

    executionDisposition = "ALLOWED_WITH_DOWNSIZE";
    executableOrder = buildKrakenOrderPreview(
      intent,
      downsizedBaseSize,
      approvedNotionalUsd,
    );
    executableNotionalUsd = approvedNotionalUsd;
    executableSizeBase = downsizedBaseSize;
    executableVerificationCode = executableVerification.verification_code;
    previewChecks.push(
      "sentinel_verdict_requires_downsize",
      "executable_order_uses_permit_notional",
      "executable_order_uses_downsized_base_size",
    );
  } else {
    previewChecks.push(
      intent.venue === "kraken"
        ? "sentinel_verdict_blocks_kraken_execution"
        : "kraken_preview_not_emitted_for_non_kraken_source",
      "no_executable_order_emitted",
    );
  }

  return {
    preview_id: `execution-preview-${intent.intent_id}`,
    trace_id: intent.trace_id,
    intent_id: intent.intent_id,
    agent_id: intent.agent_id,
    source_venue: intent.venue,
    execution_rail: "kraken_ws_v2_add_order",
    execution_disposition: executionDisposition,
    requested_order: requestedOrder,
    ...(executableOrder ? { executable_order: executableOrder } : {}),
    requested_notional_usd: requestedNotionalUsd,
    executable_notional_usd: executableNotionalUsd,
    requested_size_base: intent.size_base,
    executable_size_base: executableSizeBase,
    requested_verification_code: requestedVerification.verification_code,
    executable_verification_code: executableVerificationCode,
    reason_code: evaluation.reason_code,
    preview_checks: previewChecks,
    decision_hash: evaluation.decision_hash,
    permit_hash: evaluation.signed_verdict.permit_hash,
    expires_at: evaluation.expires_at,
    schema_version: EXECUTION_PREVIEW_SCHEMA_VERSION,
    demo_only: true,
  };
}
