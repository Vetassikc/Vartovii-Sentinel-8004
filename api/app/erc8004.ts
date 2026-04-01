import { createHash } from "node:crypto";
import { TypedDataEncoder, Wallet, verifyTypedData } from "ethers";

import type {
  AgentIdentityBinding,
  AgentRegistrationPayload,
  SignedTradeIntentBundle,
  SignedTradeIntentVerification,
  TradeIntent,
  TypedTradeIntentData,
  TypedTradeIntentMessage,
  TradeVenue,
  ErrorResponse,
} from "../../shared/schemas/sentinel.ts";
import { evaluateTradeIntent, validateTradeIntent, verifyTradePermit } from "./policy.ts";

const DEMO_IDENTITY_SCHEMA_VERSION = "sentinel-erc8004-identity-binding-v1";
const DEMO_REGISTRATION_PAYLOAD_SCHEMA_VERSION =
  "sentinel-erc8004-agent-registration-payload-v1";
const DEMO_TYPED_SIGNATURE_SCHEME = "eip712-secp256k1-demo-v1";
const DEMO_TYPED_DOMAIN_NAME = "SentinelTradeIntent";
const DEMO_TYPED_DOMAIN_VERSION = "1";
const DEMO_REGISTRY_ADDRESS = "0x8004000000000000000000000000000000000001";
const DEFAULT_TTL_SECONDS = 5 * 60;
const DEMO_INVALID_SIGNATURE = `0x${"0".repeat(130)}`;

type DemoIdentitySeed = {
  agent_numeric_id: string;
  operator_private_key: string;
  agent_private_key: string;
  registration_payload: AgentRegistrationPayload;
};

const DEMO_IDENTITY_SEEDS: Record<string, DemoIdentitySeed> = {
  "strategy-agent-demo": {
    agent_numeric_id: "0",
    // Intentionally public demo-only keys for reproducible EIP-712 fixtures.
    // These keys must never be reused for real funds, custody, or production signing.
    operator_private_key: "0x1000000000000000000000000000000000000000000000000000000000008004",
    agent_private_key: "0x2000000000000000000000000000000000000000000000000000000000008004",
    registration_payload: {
      registration_id: "agent-reg-strategy-agent-demo-001",
      name: "StrategyAgentDemo",
      description:
        "Public-safe ERC-8004-style trading agent identity used for Sentinel judge mode.",
      capabilities: [
        "trading",
        "analysis",
        "eip712-intent-signing",
        "guardrail-verification",
      ],
      agent_uri: "ipfs://sentinel-8004-demo-agent",
      chain_id: 1,
      venue_scope: ["kraken", "demo"],
      market_scope: ["BTC/USD", "ETH/USD"],
      registered_at: "2026-03-27T08:55:00Z",
      active: true,
      schema_version: DEMO_REGISTRATION_PAYLOAD_SCHEMA_VERSION,
      demo_only: true,
    },
  },
};

type ValidationSuccess<T> = {
  ok: true;
  value: T;
};

type ValidationFailure = {
  ok: false;
  error: ErrorResponse;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isTradeVenueArray(value: unknown): value is TradeVenue[] {
  return (
    Array.isArray(value) &&
    value.every((item) => ["kraken", "aerodrome", "demo"].includes(String(item)))
  );
}

function isHexWalletAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-f0-9]{40}$/i.test(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveIntegerString(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]+$/.test(value) && Number(value) >= 0;
}

function sha256Hex(value: string): string {
  return `0x${createHash("sha256").update(value).digest("hex")}`;
}

function resolveTypedDataValueTypes(typedData: TypedTradeIntentData) {
  return {
    TradeIntent: typedData.types.TradeIntent,
  };
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

function toUsdScaled(notionalUsd: string): string {
  return String(Math.round(Number(notionalUsd) * 100));
}

function buildDeadline(submittedAt: string): string {
  return String(Math.floor(Date.parse(submittedAt) / 1000) + DEFAULT_TTL_SECONDS);
}

function hashIdentityBindingPayload(
  binding: Omit<AgentIdentityBinding, "binding_hash">,
): string {
  return sha256Hex(stableStringify(binding));
}

function hashTypedTradeIntentData(typedData: TypedTradeIntentData): string {
  return TypedDataEncoder.hash(
    typedData.domain,
    resolveTypedDataValueTypes(typedData),
    typedData.message,
  );
}

function signTypedTradeIntentData(
  typedData: TypedTradeIntentData,
  privateKey: string,
): string {
  const signingWallet = new Wallet(privateKey);
  const typedDataHash = hashTypedTradeIntentData(typedData);
  return signingWallet.signingKey.sign(typedDataHash).serialized;
}

function recoverTypedTradeIntentSigner(
  typedData: TypedTradeIntentData,
  signature: string,
): string | null {
  try {
    return verifyTypedData(
      typedData.domain,
      resolveTypedDataValueTypes(typedData),
      typedData.message,
      signature,
    );
  } catch {
    return null;
  }
}

export function resolveAgentIdentityBinding(agentId: string): AgentIdentityBinding {
  const seed = DEMO_IDENTITY_SEEDS[agentId];
  const bindingPayload: Omit<AgentIdentityBinding, "binding_hash"> = seed
    ? {
        binding_id: `identity-${agentId}-001`,
        agent_id: agentId,
        agent_numeric_id: seed.agent_numeric_id,
        operator_wallet: new Wallet(seed.operator_private_key).address,
        agent_wallet: new Wallet(seed.agent_private_key).address,
        registry_address: DEMO_REGISTRY_ADDRESS,
        registration_payload: seed.registration_payload,
        schema_version: DEMO_IDENTITY_SCHEMA_VERSION,
        demo_only: true,
      }
    : {
        binding_id: `identity-${agentId}-pending`,
        agent_id: agentId,
        agent_numeric_id: "0",
        operator_wallet: "0x0000000000000000000000000000000000000000",
        agent_wallet: "0x0000000000000000000000000000000000000000",
        registry_address: DEMO_REGISTRY_ADDRESS,
        registration_payload: {
          registration_id: `agent-reg-${agentId}-pending`,
          name: agentId,
          description: "Pending public-safe demo identity binding.",
          capabilities: [],
          agent_uri: "ipfs://sentinel-8004-pending-agent",
          chain_id: 1,
          venue_scope: [],
          market_scope: [],
          registered_at: new Date(0).toISOString(),
          active: false,
          schema_version: DEMO_REGISTRATION_PAYLOAD_SCHEMA_VERSION,
          demo_only: true,
        },
        schema_version: DEMO_IDENTITY_SCHEMA_VERSION,
        demo_only: true,
      };

  return {
    ...bindingPayload,
    binding_hash: hashIdentityBindingPayload(bindingPayload),
  };
}

export function buildTypedTradeIntentData(
  intent: TradeIntent,
  identityBinding: AgentIdentityBinding,
): TypedTradeIntentData {
  return {
    domain: {
      name: DEMO_TYPED_DOMAIN_NAME,
      version: DEMO_TYPED_DOMAIN_VERSION,
      chainId: intent.chain_id,
      verifyingContract: identityBinding.registry_address,
    },
    primaryType: "TradeIntent",
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      TradeIntent: [
        { name: "agentId", type: "uint256" },
        { name: "agentWallet", type: "address" },
        { name: "pair", type: "string" },
        { name: "action", type: "string" },
        { name: "amountUsdScaled", type: "uint256" },
        { name: "maxSlippageBps", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    message: {
      agentId: identityBinding.agent_numeric_id,
      agentWallet: identityBinding.agent_wallet,
      pair: intent.market,
      action: intent.side,
      amountUsdScaled: toUsdScaled(intent.notional_usd),
      maxSlippageBps: intent.max_slippage_bps,
      nonce: "1",
      deadline: buildDeadline(intent.submitted_at),
    },
  };
}

export function buildSignedTradeIntentBundle(intent: TradeIntent): SignedTradeIntentBundle {
  const seed = DEMO_IDENTITY_SEEDS[intent.agent_id];
  const identityBinding = resolveAgentIdentityBinding(intent.agent_id);
  const typedData = buildTypedTradeIntentData(intent, identityBinding);
  const typedDataHash = hashTypedTradeIntentData(typedData);
  const signature = seed
    ? signTypedTradeIntentData(typedData, seed.agent_private_key)
    : DEMO_INVALID_SIGNATURE;

  return {
    bundle_id: `signed-intent-${intent.intent_id}`,
    agent_id: intent.agent_id,
    identity_binding: identityBinding,
    typed_data: typedData,
    typed_data_hash: typedDataHash,
    signature,
    signer_wallet: identityBinding.agent_wallet,
    signature_scheme: DEMO_TYPED_SIGNATURE_SCHEME,
    signed_at: intent.submitted_at,
    sentinel_projection: intent,
    demo_only: true,
  };
}

function validateRegistrationPayload(input: unknown): input is AgentRegistrationPayload {
  return (
    isRecord(input) &&
    isNonEmptyString(input.registration_id) &&
    isNonEmptyString(input.name) &&
    isNonEmptyString(input.description) &&
    isStringArray(input.capabilities) &&
    isNonEmptyString(input.agent_uri) &&
    Number.isInteger(input.chain_id) &&
    Number(input.chain_id) > 0 &&
    isTradeVenueArray(input.venue_scope) &&
    isStringArray(input.market_scope) &&
    isValidIsoTimestamp(input.registered_at) &&
    typeof input.active === "boolean" &&
    isNonEmptyString(input.schema_version) &&
    typeof input.demo_only === "boolean"
  );
}

function validateIdentityBinding(input: unknown): input is AgentIdentityBinding {
  return (
    isRecord(input) &&
    isNonEmptyString(input.binding_id) &&
    isNonEmptyString(input.agent_id) &&
    isPositiveIntegerString(input.agent_numeric_id) &&
    isHexWalletAddress(input.operator_wallet) &&
    isHexWalletAddress(input.agent_wallet) &&
    isHexWalletAddress(input.registry_address) &&
    validateRegistrationPayload(input.registration_payload) &&
    isNonEmptyString(input.schema_version) &&
    typeof input.demo_only === "boolean" &&
    isNonEmptyString(input.binding_hash)
  );
}

function validateTypedTradeIntentMessage(input: unknown): input is TypedTradeIntentMessage {
  return (
    isRecord(input) &&
    isPositiveIntegerString(input.agentId) &&
    isHexWalletAddress(input.agentWallet) &&
    isNonEmptyString(input.pair) &&
    ["BUY", "SELL"].includes(String(input.action)) &&
    isPositiveIntegerString(input.amountUsdScaled) &&
    Number.isInteger(input.maxSlippageBps) &&
    Number(input.maxSlippageBps) >= 0 &&
    isPositiveIntegerString(input.nonce) &&
    isPositiveIntegerString(input.deadline)
  );
}

function validateTypedTradeIntentData(input: unknown): input is TypedTradeIntentData {
  return (
    isRecord(input) &&
    isRecord(input.domain) &&
    input.domain.name === DEMO_TYPED_DOMAIN_NAME &&
    input.domain.version === DEMO_TYPED_DOMAIN_VERSION &&
    Number.isInteger(input.domain.chainId) &&
    Number(input.domain.chainId) > 0 &&
    isHexWalletAddress(input.domain.verifyingContract) &&
    input.primaryType === "TradeIntent" &&
    isRecord(input.types) &&
    Array.isArray(input.types.EIP712Domain) &&
    Array.isArray(input.types.TradeIntent) &&
    validateTypedTradeIntentMessage(input.message)
  );
}

function isHexSignature(value: unknown): value is string {
  return typeof value === "string" && /^0x[a-f0-9]{130}$/i.test(value);
}

export function validateSignedTradeIntentBundle(
  input: unknown,
): ValidationResult<SignedTradeIntentBundle> {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: {
        error: "invalid_signed_trade_intent_bundle",
        details: ["Payload must be a JSON object."],
      },
    };
  }

  const errors: string[] = [];

  if (!isNonEmptyString(input.bundle_id)) {
    errors.push("bundle_id must be a non-empty string.");
  }
  if (!isNonEmptyString(input.agent_id)) {
    errors.push("agent_id must be a non-empty string.");
  }
  if (!validateIdentityBinding(input.identity_binding)) {
    errors.push("identity_binding must be a valid agent identity binding object.");
  }
  if (!validateTypedTradeIntentData(input.typed_data)) {
    errors.push("typed_data must be a valid EIP-712 trade intent envelope.");
  }
  if (!isNonEmptyString(input.typed_data_hash)) {
    errors.push("typed_data_hash must be a non-empty string.");
  }
  if (!isHexSignature(input.signature)) {
    errors.push("signature must be a 65-byte hex ECDSA signature.");
  }
  if (!isHexWalletAddress(input.signer_wallet)) {
    errors.push("signer_wallet must be a hex wallet address.");
  }
  if (input.signature_scheme !== DEMO_TYPED_SIGNATURE_SCHEME) {
    errors.push(`signature_scheme must be ${DEMO_TYPED_SIGNATURE_SCHEME}.`);
  }
  if (!isValidIsoTimestamp(input.signed_at)) {
    errors.push("signed_at must be a valid ISO 8601 timestamp.");
  }
  const projectionValidation = validateTradeIntent(input.sentinel_projection);
  if (!projectionValidation.ok) {
    errors.push(...projectionValidation.error.details);
  }
  if (typeof input.demo_only !== "boolean") {
    errors.push("demo_only must be a boolean.");
  }

  if (errors.length > 0 || !projectionValidation.ok) {
    return {
      ok: false,
      error: {
        error: "invalid_signed_trade_intent_bundle",
        details: errors,
      },
    };
  }

  return {
    ok: true,
    value: input as SignedTradeIntentBundle,
  };
}

export function verifySignedTradeIntentBundle(
  bundle: SignedTradeIntentBundle,
): SignedTradeIntentVerification {
  const typedDataValid = validateTypedTradeIntentData(bundle.typed_data);
  const identityBindingValid = validateIdentityBinding(bundle.identity_binding);
  const projectionValidation = validateTradeIntent(bundle.sentinel_projection);
  const projectionFieldsValid = projectionValidation.ok;

  const expectedTypedDataHash = hashTypedTradeIntentData(bundle.typed_data);
  const typedDataHashMatches = bundle.typed_data_hash === expectedTypedDataHash;
  const expectedBindingHash = hashIdentityBindingPayload({
    binding_id: bundle.identity_binding.binding_id,
    agent_id: bundle.identity_binding.agent_id,
    agent_numeric_id: bundle.identity_binding.agent_numeric_id,
    operator_wallet: bundle.identity_binding.operator_wallet,
    agent_wallet: bundle.identity_binding.agent_wallet,
    registry_address: bundle.identity_binding.registry_address,
    registration_payload: bundle.identity_binding.registration_payload,
    schema_version: bundle.identity_binding.schema_version,
    demo_only: bundle.identity_binding.demo_only,
  });
  const bindingHashMatches = bundle.identity_binding.binding_hash === expectedBindingHash;
  const signerWalletMatches =
    bundle.signer_wallet.toLowerCase() === bundle.identity_binding.agent_wallet.toLowerCase() &&
    bundle.signer_wallet.toLowerCase() ===
      bundle.typed_data.message.agentWallet.toLowerCase();
  const recoveredSignerWallet = typedDataValid
    ? recoverTypedTradeIntentSigner(bundle.typed_data, bundle.signature)
    : null;
  const recoveredSignerMatches =
    recoveredSignerWallet?.toLowerCase() === bundle.signer_wallet.toLowerCase();
  const agentIdMatches =
    bundle.agent_id === bundle.identity_binding.agent_id &&
    bundle.typed_data.message.agentId === bundle.identity_binding.agent_numeric_id;
  const projectionMatchesTypedData =
    projectionFieldsValid &&
    bundle.sentinel_projection.agent_id === bundle.agent_id &&
    bundle.sentinel_projection.chain_id === bundle.typed_data.domain.chainId &&
    bundle.sentinel_projection.market === bundle.typed_data.message.pair &&
    bundle.sentinel_projection.side === bundle.typed_data.message.action &&
    toUsdScaled(bundle.sentinel_projection.notional_usd) ===
      bundle.typed_data.message.amountUsdScaled &&
    bundle.sentinel_projection.max_slippage_bps ===
      bundle.typed_data.message.maxSlippageBps;
  const signatureSchemeMatches = bundle.signature_scheme === DEMO_TYPED_SIGNATURE_SCHEME;
  const signatureValid = Boolean(recoveredSignerWallet && recoveredSignerMatches);

  let evaluation;
  let permitVerification;
  let deadlineMatchesVerdictExpiry = false;

  if (
    typedDataValid &&
    identityBindingValid &&
    typedDataHashMatches &&
    bindingHashMatches &&
    signerWalletMatches &&
    recoveredSignerMatches &&
    agentIdMatches &&
    signatureSchemeMatches &&
    signatureValid &&
    projectionMatchesTypedData &&
    projectionFieldsValid
  ) {
    evaluation = evaluateTradeIntent(bundle.sentinel_projection);
    permitVerification = verifyTradePermit({
      intent: bundle.sentinel_projection,
      signed_verdict: evaluation.signed_verdict,
    });
    deadlineMatchesVerdictExpiry =
      bundle.typed_data.message.deadline ===
      String(Math.floor(Date.parse(evaluation.expires_at) / 1000));
  }

  const verifiedChecks = [
    typedDataValid ? "typed_data_shape_valid" : "typed_data_shape_invalid",
    typedDataHashMatches ? "typed_data_hash_matches" : "typed_data_hash_mismatch",
    identityBindingValid ? "identity_binding_shape_valid" : "identity_binding_shape_invalid",
    bindingHashMatches ? "identity_binding_hash_matches" : "identity_binding_hash_mismatch",
    signerWalletMatches ? "signer_wallet_matches_identity" : "signer_wallet_mismatch",
    recoveredSignerMatches ? "signature_recovers_agent_wallet" : "signature_recovery_mismatch",
    agentIdMatches ? "agent_id_matches_identity" : "agent_id_identity_mismatch",
    signatureSchemeMatches ? "signature_scheme_supported" : "signature_scheme_invalid",
    signatureValid ? "signature_valid" : "signature_invalid",
    projectionMatchesTypedData
      ? "sentinel_projection_matches_signed_fields"
      : "sentinel_projection_mismatch",
    deadlineMatchesVerdictExpiry
      ? "deadline_matches_verdict_expiry"
      : evaluation
        ? "deadline_verdict_expiry_mismatch"
        : "deadline_not_checked",
    evaluation ? "sentinel_evaluation_completed" : "sentinel_evaluation_skipped",
    permitVerification ? "permit_verification_completed" : "permit_verification_skipped",
  ];

  const verificationCode = !typedDataValid || !typedDataHashMatches
    ? "INVALID_TYPED_DATA"
    : !identityBindingValid || !bindingHashMatches || !agentIdMatches
      ? "IDENTITY_BINDING_INVALID"
      : !signerWalletMatches || !recoveredSignerMatches || !signatureSchemeMatches || !signatureValid
        ? "SIGNATURE_INVALID"
        : !projectionMatchesTypedData || !projectionFieldsValid
          ? "SENTINEL_PROJECTION_INVALID"
          : !deadlineMatchesVerdictExpiry
            ? "VERDICT_DEADLINE_MISMATCH"
            : "SIGNED_INTENT_VERIFIED";

  return {
    bundle_id: bundle.bundle_id,
    typed_data_hash: bundle.typed_data_hash,
    signer_wallet: bundle.signer_wallet,
    recovered_signer_wallet: recoveredSignerWallet ?? undefined,
    verification_code: verificationCode,
    typed_data_valid: typedDataValid && typedDataHashMatches,
    identity_binding_valid:
      identityBindingValid && bindingHashMatches && signerWalletMatches && agentIdMatches,
    signature_valid: signatureValid,
    sentinel_projection_valid: projectionFieldsValid && projectionMatchesTypedData,
    verified_checks: verifiedChecks,
    signed_fields: [
      "agentId",
      "agentWallet",
      "pair",
      "action",
      "amountUsdScaled",
      "maxSlippageBps",
      "nonce",
      "deadline",
    ],
    demo_only: bundle.demo_only,
    evaluation,
    permit_verification: permitVerification,
  };
}
