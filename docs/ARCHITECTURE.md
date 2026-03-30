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
  -> Verdict Signer
  -> Audit JSON Trace
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

Transforms the risk decision into a machine-readable signed artifact that the
execution layer can verify.

### Audit Trace

Preserves the decision context so that a judge or operator can inspect what
happened and why.

### Execution Gate

Allows execution only when a valid verdict exists and remains within the
approved decision envelope.

## Public Interface Contract

The public scaffold uses these core types:

- `TradeIntent`
- `RiskVerdict`
- `SignedVerdict`
- `SentinelEvaluationResponse`

See [../shared/schemas/sentinel.ts](../shared/schemas/sentinel.ts).

The local judge-mode surface exposes:

- `POST /api/demo/evaluate-intent`
- `node scripts/run-scenario.ts <scenario-name>`

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

## Public Boundary

This document describes the public submission surface only.

Private internal orchestration, confidential implementation details, and
production-only infrastructure remain outside this repository.
