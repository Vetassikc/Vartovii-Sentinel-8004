# Vartovii Sentinel-8004

Vartovii Sentinel-8004 is a signed trade-permit guardrail for autonomous
trading agents.

This repository is the public hackathon submission surface for the
`AI Trading Agents with ERC-8004 Hackathon`. It is intentionally narrow,
judge-friendly, and safe to share publicly.

## Product Thesis

Sentinel-8004 is not another trading bot.

It evaluates proposed trades before execution and returns a machine-readable
decision:

- `ALLOW`
- `DENY`
- `ALLOW_WITH_DOWNSIZE`

The core flow is:

`agent proposes trade -> Sentinel evaluates -> signed verdict -> auditable trace -> execution continues only if verdict is valid`

## Current Repository Status

This public repository now includes a runnable judge-mode foundation.

Current public assets include:

- public architecture notes
- judge-mode operating model
- demo script
- public schema definitions
- sample intent and verdict payloads
- a local `POST /api/demo/evaluate-intent` endpoint
- a CLI scenario runner for the canonical demo fixtures
- Node test coverage for fixture and endpoint parity

## Why This Repo Exists Separately

The private `Vartovii` repository remains the internal workspace for strategy,
private core logic, and sensitive implementation details.

This public repository exists to provide:

- a clean submission surface for judges
- a reproducible judge-mode demo path
- public-safe documentation and examples
- screenshots, diagrams, and video assets

## Public Scope

The public submission focuses on:

- guardrail evaluation
- signed verdicts
- auditable decision traces
- judge-mode reproducibility
- narrow trading-agent risk control

Out of scope for this repository:

- broad Vartovii platform internals
- confidential infrastructure
- private prompts
- unrelated product surfaces

## Repository Layout

```text
.
├── README.md
├── LICENSE
├── package.json
├── docs/
├── web/
├── api/
├── shared/
├── examples/
├── assets/
├── scripts/
└── contracts/
```

## Start Here

1. Read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
2. Read [docs/JUDGE_MODE.md](./docs/JUDGE_MODE.md)
3. Read [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)
4. Inspect [shared/schemas/sentinel.ts](./shared/schemas/sentinel.ts)
5. Inspect the example payloads under [examples/](./examples/)

## Local Judge Mode

The public judge-mode runtime uses Node 22+ and ships without private
dependencies.

Start the local API:

```bash
node api/app/server.ts
```

Run a fixture directly:

```bash
node scripts/run-scenario.ts allow-btc-buy
```

Run the local tests:

```bash
node --test api/tests/*.test.ts
```

## Demo Scenarios

The runnable public demo path targets four core scenarios:

- safe BTC buy approved
- unsafe oversized ETH trade denied
- trade approved with downsizing
- fail-closed behavior when a required signal is unavailable

## Safety Note

This repository demonstrates a validation and control layer based on configured
policies and available inputs. It does not provide legal, compliance, or
investment advice.

## License

This repository is released under the MIT License.
