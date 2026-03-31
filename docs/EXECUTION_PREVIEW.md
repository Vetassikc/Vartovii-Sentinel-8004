# Kraken Execution Preview

## Purpose

This document describes the thin Kraken-facing execution preview layer exposed
by the public Sentinel-8004 repo.

It exists to show how a Sentinel verdict and permit could gate a Kraken-first
execution rail without claiming live trading, private credentials, or hosted
exchange access.

## Boundary

Sentinel stops at:

- `SentinelEvaluationResponse`
- `SignedVerdict`
- `ExecutionPermit`
- `PermitVerificationResponse`

The execution preview begins after that boundary.

It projects the signed decision into a demo-only Kraken-shaped
`validate-only` order request.

## Preview Model

The public repo exposes:

- `KrakenExecutionPreview`
- `KrakenOrderValidatePreview`

The preview uses Kraken-facing field names inspired by Kraken's add-order
surface:

Reference:

- https://docs.kraken.com/api/docs/websocket-v2/add_order/

- `symbol`
- `side`
- `order_type`
- `order_qty`
- `cash_order_qty`
- `validate`

In this repo, `validate: true` is intentional. It signals request-shape
projection only, not a live order submission.

## Execution Dispositions

The preview maps the Sentinel outcome into one of three execution dispositions:

- `BLOCKED`
  - no executable Kraken order is emitted
- `ALLOWED_AS_REQUESTED`
  - the requested order stays inside the signed permit envelope
- `ALLOWED_WITH_DOWNSIZE`
  - the requested order is too large, but a smaller executable order can still
    fit the permit envelope

## What Is Real

The public repo does provide:

- deterministic projection from intent to execution preview
- deterministic linkage to the signed verdict and permit hash
- deterministic downsize math for executable size and notional
- local tests and canonical example fixtures

## What Remains Demo-Only

The public repo does not claim:

- live Kraken authentication
- hosted secrets
- order submission
- websocket session tokens
- private key custody

This is a public-safe execution gate preview, not a live trading integration.

## Canonical Examples

The repo includes canonical examples under:

- `examples/execution-previews/allow-btc-buy.execution-preview.json`
- `examples/execution-previews/downsize-eth-buy.execution-preview.json`
- `examples/execution-previews/deny-oversize-eth.execution-preview.json`

The live API exposes the same projection at:

- `GET /api/demo/execution-previews/:scenario-name`

The judge demo shell also surfaces the preview directly in the hosted
walkthrough.
