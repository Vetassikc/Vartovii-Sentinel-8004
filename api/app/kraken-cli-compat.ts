import type {
  KrakenCliPaperSmokeArtifact,
  KrakenExecutionPreview,
} from "../../shared/schemas/sentinel.ts";

function toKrakenTicker(symbol: string): string {
  return symbol.replaceAll("/", "");
}

export function buildKrakenCliPaperSmokeArtifact(
  preview: KrakenExecutionPreview,
): KrakenCliPaperSmokeArtifact {
  const action = preview.requested_order.side;
  const ticker = toKrakenTicker(preview.requested_order.symbol);
  const shouldEmitCommand = preview.execution_disposition !== "BLOCKED";
  const notes = [
    "Use paper subcommands instead of sandbox flags or sandbox environment variables.",
    "Use ticker symbols in BTCUSD style, not slash-delimited market names.",
    "Use order buy or order sell, never order add.",
    "Use -o json for smoke output.",
    "Use Kraken MCP over stdio, not an HTTP serve mode on port 8080.",
  ];

  if (preview.execution_disposition === "ALLOWED_WITH_DOWNSIZE") {
    notes.push(
      "Use executable_size_base and executable_notional_usd from Sentinel, not the original requested size.",
    );
  } else if (preview.execution_disposition === "BLOCKED") {
    notes.push(
      "When Sentinel blocks execution, keep the command as a reference template only and do not emit it downstream.",
    );
  } else {
    notes.push(
      "When Sentinel allows the request as submitted, requested and executable values stay aligned.",
    );
  }

  return {
    artifact_id: `kraken-cli-paper-${preview.intent_id}`,
    trace_id: preview.trace_id,
    intent_id: preview.intent_id,
    execution_disposition: preview.execution_disposition,
    cli_binary: "kraken",
    mode: "paper",
    command_group: "order",
    action,
    ticker,
    output_flag: "-o json",
    paper_command_template: `kraken paper order ${action} ${ticker} <ORDER_PARAMS...> -o json`,
    order_parameters_placeholder: "<ORDER_PARAMS...>",
    should_emit_command: shouldEmitCommand,
    requested_size_base: preview.requested_size_base,
    executable_size_base: preview.executable_size_base,
    requested_notional_usd: preview.requested_notional_usd,
    executable_notional_usd: preview.executable_notional_usd,
    requested_verification_code: preview.requested_verification_code,
    executable_verification_code: preview.executable_verification_code,
    mcp_transport: "stdio",
    forbidden_patterns: [
      "KRAKEN_SANDBOX",
      "--sandbox",
      "order add",
      "BTC/USD",
      "http://127.0.0.1:8080",
      "serve --port 8080",
    ],
    reason_code: preview.reason_code,
    notes,
    demo_only: true,
  };
}
