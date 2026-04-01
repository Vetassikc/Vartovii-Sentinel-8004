# Sentinel-8004 Architecture Overview

## Narrow System Goal

Sentinel-8004 acts as a validation layer in front of an autonomous trading
agent.

Instead of optimizing for raw trading alpha, the system optimizes for
controlled execution:

- validate intent
- apply risk policy
- return a signed decision
- keep an auditable trace

## Core Flow

```text
Strategy Agent / Fixture Runner
  -> Agent Identity Binding
  -> EIP-712-Compatible Typed Trade Intent
  -> Signed Intent Bundle
  -> TradeIntent
  -> Intent Normalizer + Validator
  -> Policy Engine
  -> Risk Verdict
  -> Verdict Signer + Permit Envelope
  -> Validation Artifact Builder
  -> Audit JSON Trace
  -> Judge-Mode Permit Verifier
  -> Kraken Execution Preview Builder
  -> Judge-Mode Execution Gate
```

## Public Components

### Strategy Agent

Produces a `TradeIntent`. In the public repo this may be represented by fixture
payloads, judge-mode scenarios, the local CLI runner, or a lightweight demo
shell.

### Agent Identity Binding

Provides the public-safe bridge between the tutorial-style ERC-8004 identity
model and the Sentinel demo flow.

The binding carries:

- operator wallet
- agent wallet
- public registration payload
- deterministic binding hash

### Typed Trade Intent

Captures the trade request as a real EIP-712 typed data envelope before
it is evaluated by Sentinel policy.

### Signed Intent Bundle

Binds the typed trade intent, the identity binding, the signer wallet, and the
projected Sentinel `TradeIntent` into one public-safe bundle that can be
verified locally.

### Intent Normalizer

Converts incoming trade proposals into a stable schema that can be evaluated
consistently.

### Policy Engine

Applies deterministic checks such as:

- asset allowlist
- size limits
- signal availability
- scenario-level safety rules

### Verdict Signer

Transforms the risk decision into a machine-readable signed artifact with a
bounded execution permit envelope that the execution layer can verify.

### Execution Permit

Binds the signed artifact to the public demo execution scope:

- agent identity handle
- venue and chain context
- market and side
- approved notional envelope
- expiry boundary

### Agent Registration

Provides a public-safe demo registration record for the agent identity handle
used in judge mode.

### Validation Artifact

Binds the agent registration, decision hash, permit hash, and proof status into
one inspectable payload that can be surfaced alongside the signed verdict.

### Judge Demo Shell

Provides a read-only local browser view over the canonical scenario bundle so a
judge can inspect the public-safe JSON objects without using the CLI directly.

### Operator Test Shell

Provides a narrow browser-based dry-run surface for loading one canonical
intent, editing the JSON, and submitting it through the same public-safe
pipeline used by the hosted judge surfaces.

### Audit Trace

Preserves the decision context so that a judge or operator can inspect what
happened and why.

### Execution Gate

Allows execution only when a valid signed permit exists, remains unexpired, and
the execution request stays within the approved decision envelope.

### Kraken Execution Preview

Projects the signed verdict into a Kraken-facing `validate-only` request shape
so judges can see what a downstream execution rail would receive after Sentinel
finishes its part of the flow.

## Public Interface Contract

The public scaffold uses these core types:

- `TradeIntent`
- `AgentRegistration`
- `AgentIdentityBinding`
- `TypedTradeIntentData`
- `SignedTradeIntentBundle`
- `SignedTradeIntentVerification`
- `RiskVerdict`
- `ExecutionPermit`
- `KrakenExecutionPreview`
- `SignedVerdict`
- `ValidationArtifact`
- `SentinelEvaluationResponse`
- `PermitVerificationResponse`

See [../shared/schemas/sentinel.ts](../shared/schemas/sentinel.ts).

The local judge-mode surface exposes:

- `GET /`
- `GET /operator`
- `POST /api/demo/run-pipeline`
- `GET /healthz`
- `GET /api/demo/scenarios`
- `GET /api/demo/scenarios/:scenario-name`
- `GET /api/demo/signed-intents/:scenario-name`
- `GET /api/demo/execution-previews/:scenario-name`
- `POST /api/demo/evaluate-intent`
- `POST /api/demo/verify-signed-intent`
- `POST /api/demo/verify-permit`
- `node scripts/run-scenario.ts <scenario-name>`
- `node scripts/verify-signed-intent.ts <scenario-name>`
- `node scripts/verify-permit.ts <scenario-name> [requested-notional-usd]`

## Decision Outcomes

Supported decision actions:

- `ALLOW`
- `DENY`
- `ALLOW_WITH_DOWNSIZE`

## Minimum Demo Profile

The minimum demo profile is intentionally conservative:

- BTC/USD and ETH/USD only
- low-frequency scenarios
- emphasis on low drawdown and controlled approvals
- fail-closed behavior when required inputs are missing
- fixed `judge-demo-v1` policy version and deterministic demo signatures
- real EIP-712 typed trade intents signed with demo-only fixture keys
- permit verification that fails closed when the signed envelope no longer matches execution scope
- Kraken-facing `validate-only` execution previews that do not submit live orders
- demo-only registrations and validation artifacts that stay public-safe

## Public Boundary

This document describes the public submission surface only.

Private internal orchestration, confidential implementation details, and
production-only infrastructure remain outside this repository.
