export type VerdictAction = "ALLOW" | "DENY" | "ALLOW_WITH_DOWNSIZE";
export type TradeVenue = "kraken" | "aerodrome" | "demo";
export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";

export interface TradeIntent {
  trace_id: string;
  agent_id: string;
  intent_id: string;
  venue: TradeVenue;
  chain_id: number;
  market: string;
  side: OrderSide;
  order_type: OrderType;
  size_base: string;
  notional_usd: string;
  max_slippage_bps: number;
  strategy_context: Record<string, unknown>;
  submitted_at: string;
}

export interface RiskVerdict {
  trace_id: string;
  verdict: VerdictAction;
  risk_score: number;
  reason_code: string;
  reason_detail: string[];
  allowed_notional_usd: string;
  decision_hash: string;
  expires_at: string;
  policy_version: string;
  judge_mode: boolean;
}

export interface SignedVerdict {
  trace_id: string;
  decision_hash: string;
  signature: string;
  signer: string;
  signed_at: string;
  expires_at: string;
  schema_version: string;
  verdict_payload: RiskVerdict;
}

export interface SentinelEvaluationResponse extends RiskVerdict {
  signed_verdict: SignedVerdict;
}

export interface ErrorResponse {
  error: string;
  details: string[];
}
