# Sentinel-8004 Demo Script

## Demo Goal

Show that Sentinel-8004 is a risk guardrail for autonomous trading agents, not
another trading bot.

## Recommended Live Sequence

### 1. Open With The Thesis

Use a one-sentence framing:

`Sentinel-8004 is a signed trade-permit guardrail for autonomous trading agents.`

### 2. Show The Core Flow

Explain the narrow flow:

`agent identity binds to a typed trade intent -> Sentinel evaluates -> allow / deny / downsize -> signed verdict + validation artifact -> auditable trace`

### 3. Show The Signed Intent Bundle

Before jumping into the live scenarios, show the canonical typed bundle:

```bash
node scripts/verify-signed-intent.ts allow-btc-buy
```

Point out:

- the operator wallet and agent wallet binding
- the EIP-712-compatible typed fields
- the fact that the verifier recomputes the Sentinel evaluation and permit check

### 4. Walk Through Four Scenarios

If you are using the hosted app root, open `http://127.0.0.1:8787/` first and
use the primary CTA to enter the live judge demo.

If you are using the demo shell directly, open
`http://127.0.0.1:8787/judge` and keep the browser on the single scenario
picker throughout the walkthrough.

#### Scenario A: Safe Trade Approved

Show the approved BTC example.

#### Scenario B: Unsafe Trade Denied

Show a trade denied because it violates the configured risk envelope.

#### Scenario C: Trade Downsized

Show that the system can preserve intent while reducing exposure, then verify
that only the downsized execution envelope is permitted.

#### Scenario D: Fail-Closed

Show that missing critical inputs lead to a blocked execution path.

### 5. Show The Signed Verdict Shape

Highlight fields such as:

- `trace_id`
- `verdict`
- `allowed_notional_usd`
- `reason_code`
- `expires_at`
- `decision_hash`
- `signed_verdict.permit_hash`
- `signed_verdict.permit_payload.approved_notional_usd`
- `signed_verdict.signature`

### 6. Show The Validation Artifact

Point out fields such as:

- `validation_artifact.registration_id`
- `validation_artifact.proof_status`
- `validation_artifact.permit_hash`
- `validation_artifact.demo_only`

Explain that this is the public-safe ERC-8004-facing proof layer for the demo,
not a claim of live on-chain registry verification.

### 7. Show Permit Verification

Run the permit verifier on the downsized ETH scenario and point out:

- the original request no longer fits the approved envelope
- the downsized request becomes executable
- the signed artifact binds execution scope to the agent and market context

### 8. Close With The Positioning

End with:

`We do not build bots for capital deployment. We build guardrails for bots that move capital.`

## Reusable Submission Assets

Use the asset pack in `../assets/README.md` for submission materials.

Recommended mapping:

- cover image
  - `../assets/cover/sentinel-8004-cover.png`
- default demo screenshot
  - `../assets/screenshots/judge-demo-allow-btc-buy.png`
- constrained demo screenshot
  - `../assets/screenshots/judge-demo-downsize-eth-buy.png`
- social/share card
  - `../assets/social/sentinel-8004-thread-card.png`

For video overlays and narration, the `Validation Artifact` payload is the best
single proof object to keep on screen because it ties the agent registration,
decision hash, permit hash, and demo-only proof status together.

If you want one command-line proof cutaway before the browser segment, use the
signed intent verifier output. It is the most explicit way to show what was
signed, what was verified, and how that bundle maps into the existing Sentinel
guardrail flow.

## Demo Rule

Prefer a clean, reproducible judge-mode flow over a fragile live integration.
