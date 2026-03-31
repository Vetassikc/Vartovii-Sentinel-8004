# ERC-8004 Proof Layer

## Purpose

This document describes the additive ERC-8004-facing proof layer exposed by the
public Sentinel-8004 repository.

It exists so that judges can inspect a public-safe identity and typed-intent
flow without requiring private infrastructure, a testnet deployment, or live
execution credentials.

## Tutorial Alignment

The reference tutorial flow introduces four ideas:

- agent identity
- typed trade intent
- validation or action proof
- execution approval

The public Sentinel MVP now maps those ideas to these public-safe objects:

- tutorial agent identity
  - `AgentIdentityBinding`
  - contains `operator_wallet`, `agent_wallet`, and the embedded
    `registration_payload`
- tutorial typed trade intent
  - `TypedTradeIntentData`
  - an EIP-712-compatible typed data shape for trade evaluation
- tutorial signed action proof
  - `SignedTradeIntentBundle`
  - binds the identity, typed data, signature envelope, and projected
    `TradeIntent`
- tutorial validation output
  - `ValidationArtifact`
  - binds registration linkage, decision hash, permit hash, and proof status
- Sentinel execution approval
  - `SignedVerdict` plus `ExecutionPermit`
  - remains the explicit execution gate in judge mode

See [../shared/schemas/sentinel.ts](../shared/schemas/sentinel.ts).

## End-To-End Flow

The public repo now exposes this additive proof path:

`AgentIdentityBinding -> TypedTradeIntentData -> SignedTradeIntentBundle -> SentinelEvaluationResponse -> ValidationArtifact -> SignedVerdict -> ExecutionPermit`

That path stays aligned with the Sentinel thesis:

`proposed trade -> guardrail decision -> bounded execution permit`

## What Is Signed

The canonical typed message signs these fields:

- `agentId`
- `agentWallet`
- `pair`
- `action`
- `amountUsdScaled`
- `maxSlippageBps`
- `nonce`
- `deadline`

Those fields live inside `TypedTradeIntentData.message`.

The bundle also includes:

- the `AgentIdentityBinding`
- the `typed_data_hash`
- a demo-only deterministic signature envelope
- the projected `TradeIntent` used by Sentinel policy evaluation

## What Is Verified

The signed-intent verifier checks:

- typed data shape and hash parity
- identity binding shape and binding hash parity
- signer wallet matches the bound agent wallet
- typed trade intent fields match the projected Sentinel `TradeIntent`
- the resulting Sentinel verdict expiry matches the typed intent deadline
- the resulting permit still passes the existing permit verifier

Verification is available through:

- `node scripts/verify-signed-intent.ts allow-btc-buy`
- `POST /api/demo/verify-signed-intent`

## Example Payloads

Public-safe examples are included under:

- `examples/agent-registrations/`
- `examples/agent-identities/`
- `examples/signed-intents/`
- `examples/validation-artifacts/`

The canonical allow-path typed bundle is:

- `examples/signed-intents/allow-btc-buy.signed-intent.json`

## How It Fits Judge Mode

Judge mode is still the reproducible public evaluation path.

The additive proof layer does not replace the guardrail story. It extends it.

The scenario bundle route now shows:

- the original `TradeIntent`
- the `SignedTradeIntentBundle`
- the signed-intent verification result
- the `SentinelEvaluationResponse`
- the final permit verification result

This makes the mapping explicit:

- signed typed intent proves what the agent asked for
- validation artifact proves how Sentinel classified it
- signed verdict and permit prove what execution is still allowed to do

## Demo-Only Boundary

This proof layer is intentionally public-safe and judge-friendly.

It should be understood as:

- a schema proof
- a flow proof
- a deterministic verification proof

It should not be interpreted as:

- a live on-chain registry lookup
- a live ERC-8004 contract deployment
- a production custody or signing system
- a legal or compliance certification

## What Is Real In This Public Repo

The public repo does provide:

- deterministic schemas
- deterministic hashes
- reproducible fixtures
- explicit typed-data verification
- parity tests between fixtures and runtime outputs

## What Remains Demo-Only

The public repo does not claim to provide:

- live ERC-8004 registry verification
- wallet signature recovery against a public network
- production key management
- private bridge or adapter logic

That boundary is surfaced directly in the payloads through `demo_only: true`
and the signature scheme label `demo-eip712-compatible-v1`.
