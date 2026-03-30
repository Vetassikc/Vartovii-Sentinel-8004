# ERC-8004 Proof Layer

## Purpose

This document describes the additive ERC-8004-facing proof layer exposed by the
public Sentinel-8004 repository.

It exists so that judges can inspect a public-safe validation artifact without
requiring access to private bridges, private registries, or live execution
rails.

## Public Proof Objects

The public repo now exposes two explicit proof objects:

- `AgentRegistration`
  - a public-safe demo registration record for an agent identity handle
- `ValidationArtifact`
  - a machine-readable artifact that binds the evaluated intent to:
    - the agent registration
    - the signed verdict
    - the permit hash
    - the proof status returned in judge mode

See [../shared/schemas/sentinel.ts](../shared/schemas/sentinel.ts).

## How It Fits Judge Mode

Judge mode is still the reproducible public evaluation path.

The additive proof layer does not replace the guardrail story.

It extends it:

`TradeIntent -> RiskVerdict -> SignedVerdict -> ValidationArtifact -> Judge-Mode Inspection`

The validation artifact is surfaced in the same judge-mode response so judges
can see:

- which agent registration was used
- whether the proof is `VALIDATED`, `CONSTRAINED`, or `BLOCKED`
- which hashes were bound into the artifact
- whether the artifact is explicitly marked as demo-only

## Example Payloads

Public-safe examples are included under:

- `examples/agent-registrations/`
- `examples/validation-artifacts/`

These are deterministic demo payloads designed for inspection and local tests.

## Demo-Only Boundary

This proof layer is intentionally public-safe and judge-friendly.

It should be understood as:

- a schema proof
- a flow proof
- a deterministic artifact proof

It should not be interpreted as:

- a live on-chain registry lookup
- a production attestation network
- a final trust guarantee
- a legal or compliance certification

## What Is Real In This Public Repo

The public repo does provide:

- deterministic schemas
- deterministic hashes
- reproducible fixtures
- a consistent judge-mode response shape
- local tests that verify example parity

## What Remains Demo-Only

The public repo does not claim to provide:

- live ERC-8004 registry verification
- production key management
- live settlement guarantees
- private bridge or adapter logic

That boundary is surfaced directly in the payloads through `demo_only: true`.
