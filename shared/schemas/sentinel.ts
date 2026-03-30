export type VerdictAction = "ALLOW" | "DENY" | "ALLOW_WITH_DOWNSIZE";
export type TradeVenue = "kraken" | "aerodrome" | "demo";
export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type RegistrationStatus = "ACTIVE" | "PENDING" | "REVOKED";
export type ProofStatus = "VALIDATED" | "CONSTRAINED" | "BLOCKED";

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

export interface ExecutionPermit {
  trace_id: string;
  agent_id: string;
  intent_id: string;
  venue: TradeVenue;
  chain_id: number;
  market: string;
  side: OrderSide;
  order_type: OrderType;
  approved_notional_usd: string;
  max_slippage_bps: number;
  decision_hash: string;
  expires_at: string;
}

export interface AgentRegistration {
  registration_id: string;
  agent_id: string;
  chain_id: number;
  venue_scope: TradeVenue[];
  market_scope: string[];
  status: RegistrationStatus;
  registry: string;
  registered_at: string;
  schema_version: string;
  demo_only: boolean;
  registration_hash: string;
}

export interface SignedVerdict {
  trace_id: string;
  decision_hash: string;
  permit_hash: string;
  signature: string;
  signer: string;
  signed_at: string;
  expires_at: string;
  schema_version: string;
  verdict_payload: RiskVerdict;
  permit_payload: ExecutionPermit;
}

export interface ValidationArtifact {
  artifact_id: string;
  trace_id: string;
  intent_id: string;
  agent_id: string;
  registration_id: string;
  registration_status: RegistrationStatus;
  registration_hash: string;
  verdict: VerdictAction;
  allowed_notional_usd: string;
  decision_hash: string;
  permit_hash: string;
  proof_status: ProofStatus;
  proof_checks: string[];
  created_at: string;
  expires_at: string;
  schema_version: string;
  demo_only: boolean;
  artifact_hash: string;
}

export interface SentinelEvaluationResponse extends RiskVerdict {
  signed_verdict: SignedVerdict;
  validation_artifact: ValidationArtifact;
}

export interface PermitVerificationRequest {
  intent: TradeIntent;
  signed_verdict: SignedVerdict;
  requested_notional_usd?: string;
  verified_at?: string;
}

export interface PermitCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface PermitVerificationResponse {
  trace_id: string;
  permit_valid: boolean;
  executable: boolean;
  verification_code: string;
  requested_notional_usd: string;
  approved_notional_usd: string;
  decision_hash: string;
  permit_hash: string;
  verified_at: string;
  judge_mode: boolean;
  checks: PermitCheck[];
}

export interface JudgeScenarioBundle {
  scenario_name: string;
  intent: TradeIntent;
  evaluation: SentinelEvaluationResponse;
  permit_verification: PermitVerificationResponse;
}

export interface ErrorResponse {
  error: string;
  details: string[];
}
