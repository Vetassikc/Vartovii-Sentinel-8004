# Kraken CLI Compatibility

## Purpose

This document captures the public-safe Kraken CLI compatibility slice for
Sentinel-8004.

It does not claim live execution. It shows how the existing Sentinel execution
preview can be mapped into the corrected Kraken CLI paper command model shared
by the organizers.

## Corrected Guidance Used Here

Use only these conventions in this repo:

- no `KRAKEN_SANDBOX`
- no `--sandbox`
- use `paper` subcommands
- use `-o json`
- use `BTCUSD` style tickers
- use `order buy` and `order sell`
- do not use `order add`
- use Kraken MCP over `stdio`, not an HTTP serve process on port `8080`

## Public-Safe Command Shape

The canonical command template emitted by this repo is:

```bash
kraken paper buy BTCUSD <ORDER_PARAMS...> -o json
```

Or for sells:

```bash
kraken paper sell BTCUSD <ORDER_PARAMS...> -o json
```

`<ORDER_PARAMS...>` is intentionally left as a placeholder in this repo.

This keeps the compatibility story honest:

- we show the corrected command path
- we keep the output format explicit
- we avoid claiming a full CLI wrapper or live auth flow

## How It Maps From Sentinel

The mapping is:

- Sentinel verdict and permit
  - determine whether a paper command should be emitted at all
- Kraken execution preview
  - determines `buy` or `sell`, ticker style, and executable values
- Kraken CLI smoke artifact
  - turns that into a corrected paper command template plus guardrail notes

## Reproducible Smoke Path

Generate the compatibility artifact from a canonical scenario:

```bash
node scripts/kraken-paper-smoke.ts downsize-eth-buy
```

Or:

```bash
npm run judge:kraken-paper -- downsize-eth-buy
```

The canonical fixture-backed example is:

- `examples/kraken-cli-compat/downsize-eth-buy.kraken-paper.json`

## Demo-Only Boundary

This repo does not provide:

- live Kraken credentials
- paper account provisioning
- hosted secrets
- real order submission
- a fake HTTP MCP server

It provides only a corrected command-reference and smoke artifact that stays
aligned with the current Sentinel execution preview.
