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

`agent proposes trade -> Sentinel evaluates -> signed verdict + permit envelope + validation artifact -> auditable trace -> execution continues only if the permit remains valid`

The public ERC-8004-facing slice adds an explicit tutorial-style proof path in
front of that flow:

`agent identity binding -> EIP-712-compatible typed trade intent -> signed intent bundle -> Sentinel evaluation -> validation artifact + signed permit`

## Current Repository Status

This public repository now includes a runnable judge-mode foundation.

Current public assets include:

- public architecture notes
- judge-mode operating model
- a hosted submission hub at the root URL
- a narrow web demo shell for judges
- demo script
- a submission asset pack with a cover image, canonical screenshots, and a social card
- a small submission slide deck source plus a reproducible PDF export path
- public schema definitions
- sample intent, verdict, registration, identity-binding, signed-intent, and validation-artifact payloads
- a local `POST /api/demo/evaluate-intent` endpoint
- a local `POST /api/demo/verify-signed-intent` endpoint
- a local `POST /api/demo/verify-permit` endpoint
- a local `GET /api/demo/scenarios/:scenario-name` bundle route for the demo shell
- a local `GET /api/demo/signed-intents/:scenario-name` route for the canonical typed bundle
- a deployment-friendly `GET /healthz` endpoint
- a CLI scenario runner for the canonical demo fixtures
- a CLI signed-intent verifier for the canonical typed bundle
- a CLI permit verifier for the signed execution envelope
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
3. Read [docs/ERC8004_PROOF.md](./docs/ERC8004_PROOF.md)
4. Read [docs/DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)
5. Read [docs/SUBMISSION_MEDIA.md](./docs/SUBMISSION_MEDIA.md)
6. Inspect [assets/README.md](./assets/README.md)
7. Inspect [shared/schemas/sentinel.ts](./shared/schemas/sentinel.ts)
8. Inspect the example payloads under [examples/](./examples/)

## Local Judge Mode

The public judge-mode runtime uses Node 22+ and ships without private
dependencies.

Start the local API:

```bash
npm run start
```

Start the same server in production-style mode:

```bash
npm run start:prod
```

Open the hosted submission hub:

```text
http://127.0.0.1:8787/
```

Open the judge demo shell:

```text
http://127.0.0.1:8787/judge
```

Check the health endpoint:

```bash
curl http://127.0.0.1:8787/healthz
```

Run a fixture directly:

```bash
node scripts/run-scenario.ts allow-btc-buy
```

Verify the signed execution envelope:

```bash
node scripts/verify-permit.ts downsize-eth-buy 2500.00
```

Verify the signed ERC-8004-style intent bundle:

```bash
node scripts/verify-signed-intent.ts allow-btc-buy
```

Fetch the same bundle used by the web shell:

```bash
curl http://127.0.0.1:8787/api/demo/scenarios/allow-btc-buy
```

Fetch the canonical signed intent bundle:

```bash
curl http://127.0.0.1:8787/api/demo/signed-intents/allow-btc-buy
```

Run the local tests:

```bash
node --test api/tests/*.test.ts
```

Export the submission slides PDF:

```bash
npm run slides:pdf
```

## Deployment Target

The smallest prepared hosting path is Render.

Deployment-oriented notes are in [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md).

The intended hosted entrypoint is now:

- root URL
  - hosted submission hub
- `/judge`
  - live judge demo shell

## Submission Assets

The curated asset pack lives in [assets/README.md](./assets/README.md).

Use these paths for submission materials:

- cover image: `assets/cover/sentinel-8004-cover.png`
- canonical judge screenshots:
  - `assets/screenshots/judge-demo-allow-btc-buy.png`
  - `assets/screenshots/judge-demo-downsize-eth-buy.png`
- social/share card: `assets/social/sentinel-8004-thread-card.png`

For demo videos and judge callouts, the most reusable single proof object is the
`Validation Artifact` panel shown in the judge demo shell.

## Submission Media

The slide deck workflow lives in [docs/SUBMISSION_MEDIA.md](./docs/SUBMISSION_MEDIA.md).

Use these paths for upload-ready slides:

- slide deck source: `slides/sentinel-8004-submission-deck-v1.html`
- slide PDF: `output/pdf/sentinel-8004-submission-slides-v1.pdf`

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
