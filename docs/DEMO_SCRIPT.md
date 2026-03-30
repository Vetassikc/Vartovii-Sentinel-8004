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

`agent proposes trade -> Sentinel evaluates -> allow / deny / downsize -> signed verdict + permit envelope -> auditable trace`

### 3. Walk Through Four Scenarios

#### Scenario A: Safe Trade Approved

Show the approved BTC example.

#### Scenario B: Unsafe Trade Denied

Show a trade denied because it violates the configured risk envelope.

#### Scenario C: Trade Downsized

Show that the system can preserve intent while reducing exposure, then verify
that only the downsized execution envelope is permitted.

#### Scenario D: Fail-Closed

Show that missing critical inputs lead to a blocked execution path.

### 4. Show The Signed Verdict Shape

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

### 5. Show Permit Verification

Run the permit verifier on the downsized ETH scenario and point out:

- the original request no longer fits the approved envelope
- the downsized request becomes executable
- the signed artifact binds execution scope to the agent and market context

### 6. Close With The Positioning

End with:

`We do not build bots for capital deployment. We build guardrails for bots that move capital.`

## Demo Rule

Prefer a clean, reproducible judge-mode flow over a fragile live integration.
