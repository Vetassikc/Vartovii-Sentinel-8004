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
  -> TradeIntent
  -> Intent Normalizer + Validator
  -> Policy Engine
  -> Risk Verdict
  -> Verdict Signer + Permit Envelope
  -> Validation Artifact Builder
  -> Audit JSON Trace
  -> Judge-Mode Permit Verifier
  -> Judge-Mode Execution Gate
```

## Public Components

### Strategy Agent

Produces a `TradeIntent`. In the public repo this may be represented by fixture
payloads, judge-mode scenarios, the local CLI runner, or a lightweight demo
shell.

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

### Audit Trace

Preserves the decision context so that a judge or operator can inspect what
happened and why.

### Execution Gate

Allows execution only when a valid signed permit exists, remains unexpired, and
the execution request stays within the approved decision envelope.

## Public Interface Contract

The public scaffold uses these core types:

- `TradeIntent`
- `AgentRegistration`
- `RiskVerdict`
- `ExecutionPermit`
- `SignedVerdict`
- `ValidationArtifact`
- `SentinelEvaluationResponse`
- `PermitVerificationResponse`

See [../shared/schemas/sentinel.ts](../shared/schemas/sentinel.ts).

The local judge-mode surface exposes:

- `GET /`
- `GET /healthz`
- `GET /api/demo/scenarios`
- `GET /api/demo/scenarios/:scenario-name`
- `POST /api/demo/evaluate-intent`
- `POST /api/demo/verify-permit`
- `node scripts/run-scenario.ts <scenario-name>`
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
- permit verification that fails closed when the signed envelope no longer matches execution scope
- demo-only registrations and validation artifacts that stay public-safe

## Public Boundary

This document describes the public submission surface only.

Private internal orchestration, confidential implementation details, and
production-only infrastructure remain outside this repository.
