export type VerdictAction = "ALLOW" | "DENY" | "ALLOW_WITH_DOWNSIZE";
export type TradeVenue = "kraken" | "aerodrome" | "demo";
export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type RegistrationStatus = "ACTIVE" | "PENDING" | "REVOKED";
export type ProofStatus = "VALIDATED" | "CONSTRAINED" | "BLOCKED";
export type ExecutionPreviewDisposition =
  | "BLOCKED"
  | "ALLOWED_AS_REQUESTED"
  | "ALLOWED_WITH_DOWNSIZE";

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

export interface AgentRegistrationPayload {
  registration_id: string;
  name: string;
  description: string;
  capabilities: string[];
  agent_uri: string;
  chain_id: number;
  venue_scope: TradeVenue[];
  market_scope: string[];
  registered_at: string;
  active: boolean;
  schema_version: string;
  demo_only: boolean;
}

export interface AgentIdentityBinding {
  binding_id: string;
  agent_id: string;
  agent_numeric_id: string;
  operator_wallet: string;
  agent_wallet: string;
  registry_address: string;
  registration_payload: AgentRegistrationPayload;
  schema_version: string;
  demo_only: boolean;
  binding_hash: string;
}

export interface Eip712TypeField {
  name: string;
  type: string;
}

export interface TypedTradeIntentMessage {
  agentId: string;
  agentWallet: string;
  pair: string;
  action: OrderSide;
  amountUsdScaled: string;
  maxSlippageBps: number;
  nonce: string;
  deadline: string;
}

export interface TypedTradeIntentData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: "TradeIntent";
  types: {
    EIP712Domain: Eip712TypeField[];
    TradeIntent: Eip712TypeField[];
  };
  message: TypedTradeIntentMessage;
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

export interface SignedTradeIntentBundle {
  bundle_id: string;
  agent_id: string;
  identity_binding: AgentIdentityBinding;
  typed_data: TypedTradeIntentData;
  typed_data_hash: string;
  signature: string;
  signer_wallet: string;
  signature_scheme: string;
  signed_at: string;
  sentinel_projection: TradeIntent;
  demo_only: boolean;
}

export interface SignedTradeIntentVerification {
  bundle_id: string;
  typed_data_hash: string;
  signer_wallet: string;
  recovered_signer_wallet?: string;
  verification_code: string;
  typed_data_valid: boolean;
  identity_binding_valid: boolean;
  signature_valid: boolean;
  sentinel_projection_valid: boolean;
  verified_checks: string[];
  signed_fields: string[];
  demo_only: boolean;
  evaluation?: SentinelEvaluationResponse;
  permit_verification?: PermitVerificationResponse;
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

export interface KrakenOrderValidatePreview {
  symbol: string;
  side: "buy" | "sell";
  order_type: "market" | "limit";
  order_qty: string;
  cash_order_qty: string;
  validate: true;
}

export interface KrakenExecutionPreview {
  preview_id: string;
  trace_id: string;
  intent_id: string;
  agent_id: string;
  source_venue: TradeVenue;
  execution_rail: "kraken_ws_v2_add_order";
  execution_disposition: ExecutionPreviewDisposition;
  requested_order: KrakenOrderValidatePreview;
  executable_order?: KrakenOrderValidatePreview;
  requested_notional_usd: string;
  executable_notional_usd: string;
  requested_size_base: string;
  executable_size_base: string;
  requested_verification_code: string;
  executable_verification_code: string;
  reason_code: string;
  preview_checks: string[];
  decision_hash: string;
  permit_hash: string;
  expires_at: string;
  schema_version: string;
  demo_only: boolean;
}

export interface KrakenCliPaperSmokeArtifact {
  artifact_id: string;
  trace_id: string;
  intent_id: string;
  execution_disposition: ExecutionPreviewDisposition;
  cli_binary: "kraken";
  mode: "paper";
  command_group: "order";
  action: "buy" | "sell";
  ticker: string;
  output_flag: "-o json";
  paper_command_template: string;
  order_parameters_placeholder: "<ORDER_PARAMS...>";
  should_emit_command: boolean;
  requested_size_base: string;
  executable_size_base: string;
  requested_notional_usd: string;
  executable_notional_usd: string;
  requested_verification_code: string;
  executable_verification_code: string;
  mcp_transport: "stdio";
  forbidden_patterns: string[];
  reason_code: string;
  notes: string[];
  demo_only: boolean;
}

export interface JudgeScenarioBundle {
  scenario_name: string;
  bundle_label: string;
  intent: TradeIntent;
  signed_intent_bundle: SignedTradeIntentBundle;
  signed_intent_verification: SignedTradeIntentVerification;
  evaluation: SentinelEvaluationResponse;
  permit_verification: PermitVerificationResponse;
  execution_preview: KrakenExecutionPreview;
  kraken_cli_paper_artifact: KrakenCliPaperSmokeArtifact;
}

export interface OperatorPipelineBundle {
  bundle_label: string;
  intent: TradeIntent;
  signed_intent_bundle: SignedTradeIntentBundle;
  signed_intent_verification: SignedTradeIntentVerification;
  evaluation: SentinelEvaluationResponse;
  permit_verification: PermitVerificationResponse;
  execution_preview: KrakenExecutionPreview;
  kraken_cli_paper_artifact: KrakenCliPaperSmokeArtifact;
}

export interface ErrorResponse {
  error: string;
  details: string[];
}
