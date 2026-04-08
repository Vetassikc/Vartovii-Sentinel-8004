# Sentinel-8004 Submission Form Final

Updated for the `AI Trading Agents` hackathon page as reviewed on **April 8, 2026**.

Use this file as the manual source of truth when filling the lablab.ai submission form.

## Basic Information

### Project Title

`Vartovii Sentinel-8004`

### Short Description

Signed trade-permit guardrail for autonomous trading agents with real EIP-712 verification, bounded execution permits, and judge-friendly proof artifacts aligned with shared Sepolia ERC-8004 infrastructure.

### Long Description

`Vartovii Sentinel-8004` is a trust and control layer for autonomous trading agents. Instead of building another trading bot, we focused on the checkpoint that should exist before capital moves.

Each trade starts as a canonical `TradeIntent`. Sentinel evaluates that intent against deterministic risk policy and returns one of three machine-readable outcomes: `ALLOW`, `DENY`, or `ALLOW_WITH_DOWNSIZE`. Every decision produces a signed verdict, validation artifact, permit verification result, and Kraken-shaped execution preview so judges can inspect the full proof chain end to end.

The public repo implements real EIP-712 typed-data signing and verification, ERC-8004-style identity binding, organizer-aligned shared Sepolia contract configuration, and a hosted judge-first walkthrough with four canonical scenarios. The main demo surface is intentionally narrow: judges can open `/judge` for the proof story or `/operator` for a dry-run pipeline without needing private infrastructure, exchange credentials, or hidden services.

This is the primary judged product surface. A separate founder-run companion repository exists only as supporting proof that the guardrail also matters in a live-market loop. As of April 8, 2026, that founder-run companion log contains 130 recorded cycles, including 83 approved shared-Sepolia RiskRouter actions. The public submission does not depend on that companion surface to run.

Sentinel-8004 fits the hackathon thesis because it combines AI-agent execution intent, cryptographic verification, risk controls, and transparent auditability into one reusable control layer. The long-term product path is a deployable guardrail module or micro-SaaS for autonomous trading systems, treasury agents, and policy-constrained execution workflows.

## Categories

Recommended selections:

- `Finance`
- `Security`
- `Developer Tools`

## Event Tracks

Recommended selections:

- `ERC-8004`
- `Kraken - Trading Performance (PnL)`
- `Kraken - Social Engagement`

## Technologies Used

Prefer product and protocol tags over coding-assistant tags.

Recommended entries:

- `TypeScript`
- `Node.js`
- `ethers.js`
- `EIP-712`
- `ERC-8004`
- `Sepolia`
- `Kraken CLI`
- `Gemini 2.5 Flash`

If the form exposes only broader preset tags, choose the closest equivalents and keep the stack protocol-heavy rather than tool-brand-heavy.

## App Hosting & Repository

### Public GitHub Repository

`https://github.com/Vetassikc/Vartovii-Sentinel-8004`

### Demo Application Platform

`OTHER`

### Demo Application URL

`https://sentinel-8004-judge-demo.onrender.com/`

## Additional Information

Sentinel-8004 is a browser-based public demo centered on a signed trade-permit guardrail for autonomous trading agents. The hosted root URL is a submission hub, the canonical judge walkthrough is exposed at `/judge`, and the operator dry-run flow is exposed at `/operator`.

The public repo is aligned to the organizer's shared Sepolia contracts rather than custom judging alternates. It exposes real EIP-712 signing and verification, public-safe proof artifacts, permit verification, and a Kraken-compatible execution preview that remains validate-only and does not place live orders.

The companion founder-run execution loop lives in a separate repository and should be described as supporting proof only, not as the primary judged product. Judges can fully evaluate this submission without access to the companion repo or any private infrastructure.

As of April 8, 2026, the founder-run companion log contains 130 recorded cycles, including 83 approved shared-Sepolia RiskRouter actions. Those numbers are useful as supporting context, but the main claim of this submission is narrower: Sentinel-8004 is the control layer in front of the agent.

## Social Links

Only submit real published links.

Current guidance:

- keep `LinkedIn` if the post is already public
- keep `Twitter/X` only if the linked post is public and intentional
- leave unused social fields blank

## Manual Checklist

- Replace technology tags that currently name coding assistants with the stack above.
- Keep the repo topology clear: main public repo first, companion repo second.
- Do not expose API secrets or anything stronger than the read-only Kraken key requested by the hackathon.
- If you mention metrics in the form, keep them date-qualified as of `April 8, 2026`.
