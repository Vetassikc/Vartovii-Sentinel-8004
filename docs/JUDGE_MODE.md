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
`SentinelEvaluationResponse` payload with nested `signed_verdict`.

## Local Run

Start the API:

```bash
node api/app/server.ts
```

Run a scenario directly from the CLI:

```bash
node scripts/run-scenario.ts downsize-eth-buy
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

## Output Expectations

A judge-mode response should make it obvious:

- what the input trade was
- what decision was returned
- why that decision was returned
- whether downsizing occurred
- whether the verdict was signed
- which policy version produced the decision

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
    "signature": "0x...",
    "signer": "sentinel-demo-signer",
    "signed_at": "2026-03-27T09:10:00Z",
    "expires_at": "2026-03-27T09:15:00.000Z",
    "schema_version": "sentinel-8004-v1",
    "verdict_payload": {
      "...": "..."
    }
  }
}
```

## Public Limitation

Judge mode is not presented as a complete production deployment.

It is the public, inspectable proof that Sentinel can evaluate trading intents
and emit machine-readable guardrail decisions in a reliable format.
