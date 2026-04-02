# Sentinel-8004 Judge Mode

## Purpose

Judge mode is the reproducible evaluation path for the public submission.

It exists so that judges can understand the Sentinel decision model without
depending on private infrastructure or live exchange credentials.

## Design Goals

Judge mode should be:

- deterministic
- offline-friendly
- easy to inspect
- aligned with the real product thesis

## Expected Public Contract

Judge mode centers around this public evaluation path:

`POST /api/demo/evaluate-intent`

The endpoint accepts a canonical `TradeIntent` payload and returns a canonical
`SentinelEvaluationResponse` payload with nested `signed_verdict` and
`validation_artifact`.

Judge mode also exposes a narrow signed-intent verification path:

`POST /api/demo/verify-signed-intent`

The verifier accepts a `SignedTradeIntentBundle` and proves that the typed
trade intent, the identity binding, and the projected Sentinel trade all remain
aligned before the existing guardrail flow is evaluated.

Judge mode also exposes a narrow permit verification path:

`POST /api/demo/verify-permit`

The verifier accepts a `TradeIntent`, a `signed_verdict`, and an optional
execution notional override to prove that execution stays inside the signed
permit envelope.

Judge mode now also exposes a narrow operator dry-run path:

`POST /api/demo/run-pipeline`

The route accepts a `TradeIntent` and returns the same proof set exposed in the
hosted shells: signed intent bundle, signed intent verification, verdict,
validation artifact, permit verification, execution preview, and a corrected
Kraken paper smoke artifact.

For judges who need a clean hosted entrypoint, the same local server now serves
a small submission hub at:

`GET /`

The live judge demo shell remains available at:

`GET /judge`

The operator test shell is available at:

`GET /operator`

The shell uses a narrow read-only bundle route:

`GET /api/demo/scenarios/:scenario-name`

The same server also exposes the canonical signed intent fixture at:

`GET /api/demo/signed-intents/:scenario-name`

The same server also exposes the Kraken-facing execution projection at:

`GET /api/demo/execution-previews/:scenario-name`

For deployment-readiness and host health checks, the same server also exposes:

`GET /healthz`

## Local Run

Start the API:

```bash
node api/app/server.ts
```

Open the hosted submission hub:

```text
http://127.0.0.1:8787/
```

Open the demo shell directly:

```text
http://127.0.0.1:8787/judge
```

Open the operator test shell directly:

```text
http://127.0.0.1:8787/operator
```

Check service health:

```bash
curl http://127.0.0.1:8787/healthz
```

Run a scenario directly from the CLI:

```bash
node scripts/run-scenario.ts downsize-eth-buy
```

Verify a signed permit directly from the CLI:

```bash
node scripts/verify-permit.ts downsize-eth-buy 2500.00
```

Verify a signed ERC-8004-style intent bundle directly from the CLI:

```bash
node scripts/verify-signed-intent.ts allow-btc-buy
```

Generate a real EIP-712 signed intent bundle directly from the CLI:

```bash
node scripts/sign-intent.ts allow-btc-buy
```

Fetch a Kraken-facing execution preview:

```bash
curl http://127.0.0.1:8787/api/demo/execution-previews/downsize-eth-buy
```

Run the operator dry-run pipeline:

```bash
curl -X POST http://127.0.0.1:8787/api/demo/run-pipeline \
  -H "Content-Type: application/json" \
  --data @examples/intents/downsize-eth-buy.json
```

Generate a corrected Kraken paper compatibility artifact:

```bash
node scripts/kraken-paper-smoke.ts downsize-eth-buy
```

Run tests:

```bash
node --test api/tests/*.test.ts
```

## Required Judge Scenarios

The default scenario set should cover:

1. approved BTC buy
2. denied oversized ETH trade
3. approved trade with downsizing
4. fail-closed decision when a required signal is unavailable

## Why Judge Mode Matters

Judge mode solves three problems at once:

- reproducibility for judges
- safe public demo operation
- clean separation between public and private infrastructure
- one obvious local walkthrough without requiring CLI-only inspection

## Output Expectations

A judge-mode response should make it obvious:

- what the input trade was
- which operator wallet and agent wallet the typed intent was bound to
- which fields were signed in the typed intent
- what decision was returned
- why that decision was returned
- whether downsizing occurred
- whether the verdict was signed
- which agent registration the proof layer referenced
- whether the validation artifact is `VALIDATED`, `CONSTRAINED`, or `BLOCKED`
- whether the signed permit still validates
- whether the requested execution stayed within the approved envelope
- what Kraken-shaped order preview would be emitted after the permit gate
- which policy version produced the decision

The web shell presents the same information in five narrow inspection panels:

- trade intent
- verdict
- validation artifact
- permit verification
- Kraken execution preview

The operator shell adds one more narrow inspection panel:

- Kraken paper smoke artifact

The hosted root page is intentionally smaller. It exists only to route judges to
the live demo, public repository, proof notes, and reusable submission assets.

The operator shell is intentionally narrow too. It exists only to let an
operator or judge load a canonical intent, edit the JSON, and run the same
public-safe proof pipeline without turning the repo into a trading dashboard.
It now also exposes the corrected Kraken paper command template that would be
derived from the execution preview, while keeping execution itself demo-only.

The signed-intent bundle is intentionally exposed through CLI and API rather
than the current UI so the hosted `/judge` shell stays narrow and judge-first.

## Example Request

```bash
curl -X POST http://127.0.0.1:8787/api/demo/evaluate-intent \
  -H "Content-Type: application/json" \
  --data @examples/intents/allow-btc-buy.json
```

## Example Response Shape

```json
{
  "trace_id": "trace-downsize-eth-buy-001",
  "verdict": "ALLOW_WITH_DOWNSIZE",
  "risk_score": 61,
  "reason_code": "POSITION_SIZE_EXCEEDS_LIMIT",
  "reason_detail": [
    "requested_notional_above_soft_cap",
    "downsized_to_policy_cap"
  ],
  "allowed_notional_usd": "2500.00",
  "decision_hash": "0x...",
  "expires_at": "2026-03-27T09:15:00.000Z",
  "policy_version": "judge-demo-v1",
  "judge_mode": true,
  "signed_verdict": {
    "trace_id": "trace-downsize-eth-buy-001",
    "decision_hash": "0x...",
    "permit_hash": "0x...",
    "signature": "0x...",
    "signer": "sentinel-demo-signer",
    "signed_at": "2026-03-27T09:10:00Z",
    "expires_at": "2026-03-27T09:15:00.000Z",
    "schema_version": "sentinel-8004-v1",
    "permit_payload": {
      "...": "..."
    },
    "verdict_payload": {
      "...": "..."
    }
  },
  "validation_artifact": {
    "artifact_id": "validation-intent-downsize-eth-buy-001",
    "registration_id": "agent-reg-strategy-agent-demo-001",
    "proof_status": "CONSTRAINED",
    "permit_hash": "0x...",
    "artifact_hash": "0x...",
    "demo_only": true
  }
}
```

## Example Permit Verification

```bash
curl -X POST http://127.0.0.1:8787/api/demo/verify-permit \
  -H "Content-Type: application/json" \
  --data '{
    "intent": { "...": "..." },
    "signed_verdict": { "...": "..." },
    "requested_notional_usd": "2500.00"
  }'
```

The verifier returns a machine-readable gate result with:

- `permit_valid`
- `executable`
- `verification_code`
- `requested_notional_usd`
- `approved_notional_usd`
- `checks[]`

## Example Signed Intent Verification

```bash
curl -X POST http://127.0.0.1:8787/api/demo/verify-signed-intent \
  -H "Content-Type: application/json" \
  --data @examples/signed-intents/allow-btc-buy.signed-intent.json
```

The verifier returns a machine-readable proof result with:

- `verification_code`
- `typed_data_valid`
- `identity_binding_valid`
- `signature_valid`
- `sentinel_projection_valid`
- `evaluation`
- `permit_verification`

## Example Execution Preview

```bash
curl http://127.0.0.1:8787/api/demo/execution-previews/downsize-eth-buy
```

The preview returns a machine-readable Kraken-facing projection with:

- `execution_disposition`
- `requested_order`
- `executable_order`
- `requested_verification_code`
- `executable_verification_code`
- `decision_hash`
- `permit_hash`

## Demo Shell Boundary

The web demo shell is intentionally narrow:

- scenario picker only
- read-only JSON inspection
- no authentication
- no live execution
- no product dashboard claims

## Proof Boundary

The public judge-mode proof layer is intentionally demo-only.

It demonstrates:

- schema shape
- real EIP-712 typed data shape
- hash binding
- wallet-to-agent identity binding
- real secp256k1 signature generation and signer recovery
- registration linkage
- deterministic validation flow
- deterministic execution projection after the permit gate

It does not claim to demonstrate:

- live on-chain registry verification
- production signing custody
- production-safe private key handling
- private bridge logic

## Public Limitation

Judge mode is not presented as a complete production deployment.

It is the public, inspectable proof that Sentinel can evaluate trading intents,
emit machine-readable guardrail decisions, attach a public-safe validation
artifact, verify whether a requested execution still fits the signed permit
envelope, and project that bounded decision into a Kraken-facing validate-only
execution preview.
