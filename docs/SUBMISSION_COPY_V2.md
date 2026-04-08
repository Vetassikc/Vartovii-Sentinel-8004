# Sentinel-8004 — Submission Copy v2

> Prepared for the AI Trading Agents hackathon (March 30 – April 12, 2026).

---

## Short Description (≤ 200 chars)

Signed trade-permit guardrail for autonomous trading agents. Real EIP-712 proof, bounded execution permits, and organizer-aligned shared Sepolia anchors.

---

## Long Description

**Sentinel-8004** is a trust and control layer for autonomous trading agents, built for the ERC-8004 challenge and aligned with the organizer-provided shared Sepolia contracts.

### The Problem

AI trading agents operate as ghosts — no identity, no accountability, no guardrails. When an agent goes rogue, there's no pre-execution checkpoint and no auditable trace. The industry needs a control point *before* capital moves, not forensics *after* it's gone.

### The Solution

A dual-guardrail architecture that evaluates every trade intent **before execution**:

1. **Off-chain Sentinel** — A policy-rich risk engine that scores each trade intent 0–100. Trades below 40 pass through. Trades between 40–70 are downsized to a bounded scope. Trades above 70 are blocked entirely. This layer catches risky trades before they waste gas on-chain.

2. **On-chain RiskRouter** — Enforces hard limits via EIP-712 signed TradeIntents on the shared Sepolia contracts. The agent's identity is bound to an ERC-721 token in the AgentRegistry. Signed intents are recovered and verified cryptographically via recovered-signer matching, with an organizer-aligned shared Sepolia anchor path for registration and checkpointing.

Every decision is cryptographically signed, producing a machine-readable verdict with a bounded execution permit envelope. Judges can inspect the full proof chain: Trade Intent → Signed Verdict → Validation Artifact → Permit Verification → Execution Gate.

### What's Real

- **Real EIP-712 typed data signing** with recovered signer wallet verification (not mocked signatures)
- **Shared Sepolia contracts** — AgentRegistry, RiskRouter, ValidationRegistry (organizer-provided, not self-deployed)
- **Agent identity path** on the shared AgentRegistry ERC-721, with founder-run registration and approved transactions inspectable on [Sepolia Etherscan](https://sepolia.etherscan.io)
- **Kraken paper-compatible execution previews** with `validate: true` request shape
- **As of April 8, 2026:** the founder-run companion log contains **130** recorded cycles, including **83** on-chain-approved shared-Sepolia RiskRouter actions, with transaction links available for inspection
- **Full audit trail** — every decision, verdict, and permit logged as structured JSON

### What Is Still Demo-Only

- **Demo fixture signing keys** are public/demo-only — committed intentionally for judge inspection, not production custody keys.
- **Hosted app does not hold production keys** — no real capital is at risk on the deployed surface.
- **Kraken path is paper-compatible only** — all execution previews use `validate: true` (validate-only mode). No live orders are placed.
- **Shared Sepolia registration** — broadcasting to organizer contracts still requires founder wallet action; the demo uses pre-registered state.

### Reference Execution Companion (Founder-Run Supporting Proof)

A private, founder-run companion agent in the separate `sentinel-8004-agent-demo` repository demonstrates *why* the guardrail matters. This is supporting proof, not a second primary submission.

- **Live Kraken market data** — real BTC/USD and ETH/USD prices via Kraken REST API
- **Gemini 2.5 Flash AI strategy** — analyzes market momentum and proposes trades with confidence scores
- **Dual guardrail in action** — as of April 8, 2026, the founder-run companion log shows **130** cycles: **50** allow decisions, **49** downsized decisions, and **26** denied decisions; **83** approved actions also reached the shared Sepolia RiskRouter
- **Real-time monitoring dashboard** — PnL tracking, win rate, max drawdown (0.3%), risk score distribution, and Etherscan transaction links

The reference agent is not the primary product. It is a founder-run execution surface that validates the control layer thesis.

### Judge Surfaces

| Surface | URL | Purpose |
|---------|-----|---------|
| Submission Hub | `/` | Entrypoint with navigation to all demo surfaces |
| Judge Demo | `/judge` | Canonical scenario walkthrough with full proof artifacts |
| Operator Dry-Run | `/operator` | Load, edit, and submit intents through the full pipeline |

---

## Submission Form Fields

### Categories (select up to 3)

1. **Finance** — primary: trading agent risk management
2. **Security** — cryptographic verification, fail-closed design
3. **Developer Tools** — SDK-like guardrail layer for agent builders

### Event Tracks

- ✅ **ERC-8004** — agent identity binding, on-chain registration, reputation
- ✅ **Kraken** — paper-compatible execution previews, market data feed

### Technologies Used

1. TypeScript
2. Node.js
3. ethers.js (v6)
4. EIP-712 (typed data signing)
5. Sepolia (testnet)
6. ERC-8004 (agent identity standard)
7. Kraken REST API (market data + paper execution shape)
8. Gemini 2.5 Flash (AI strategy in reference agent)

### Team Size

1 person

### Links

| Field | Value |
|-------|-------|
| GitHub Repo | <https://github.com/Vetassikc/Vartovii-Sentinel-8004> |
| Deployed App | <https://sentinel-8004-judge-demo.onrender.com> |
| Surge Registration | (add link from early.surge.xyz team profile) |

### Social Media Links

> **Guidance:** Only submit real, published links. Leave blank until public posts exist.
> Do not create placeholder social accounts just for the submission.

| Field | Value |
|-------|-------|
| Twitter/X | _(leave blank unless a real post exists)_ |
| LinkedIn | _(leave blank unless a real post exists)_ |
| YouTube (demo video) | _(add after recording the 2-min submission video)_ |

---

## Video Script (2 min target)

### 0:00–0:15 — Hook

> "AI agents can trade faster than humans. But speed without guardrails creates failure modes you can't audit after the fact. We built Sentinel-8004 — the last safe checkpoint before execution."

*Visual: Cover art + problem headline.*

### 0:15–0:45 — Judge Demo (Allow Path)

> "Let's see it in action. This is the judge demo. We select the allow-btc-buy scenario. Sentinel evaluates the trade intent, returns an ALLOW verdict with risk score 25, and produces a signed permit envelope. The validation artifact shows VALIDATED status — the trade is within all policy bounds."

*Visual: Navigate `/judge`, select scenario, show proof artifacts.*

### 0:45–1:05 — Downsize + Deny Paths

> "Now the constrained path. This ETH buy requests $5,000 — above the policy limit. Sentinel returns ALLOW_WITH_DOWNSIZE, constraining it to $2,500. And here's a blocked path — DENY with risk score 85. No permit is issued."

*Visual: Show downsize scenario, then deny scenario results.*

### 1:05–1:25 — Operator Dry-Run

> "The operator shell lets you edit and submit live trade intents. Edit the JSON, hit submit, and watch the full pipeline execute — from typed intent through risk evaluation to permit verification."

*Visual: Navigate `/operator`, edit intent JSON, submit, show pipeline response.*

### 1:25–1:45 — Reference Agent (Founder-Run Supporting Proof)

> "To prove the guardrail works in practice, we run a private, founder-operated reference agent. It pulls live Kraken prices, generates AI trade decisions via Gemini 2.5, and submits every intent through Sentinel first. As of April 8, 2026, the companion log contains 130 cycles: 50 allowed, 49 downsized, and 26 denied, with 83 approved actions also anchored through the shared Sepolia flow. Max drawdown: 0.3%."

*Visual: Dashboard with market price, dual guardrail status, PnL panel, checkpoint feed.*

### 1:45–1:55 — On-Chain Proof

> "Every decision is verifiable through a cryptographic proof chain with an organizer-aligned shared Sepolia anchor. The agent is registered on the AgentRegistry ERC-721, and you can trace the linked transactions on Sepolia Etherscan."

*Visual: Etherscan showing transaction, or the validation artifact with tx hash.*

### 1:55–2:00 — Close

> "Sentinel-8004 by Vartovii. Trust and control infrastructure for autonomous capital."

*Visual: Cover art + links.*

---

## Surge Registration Note

The team must have a registered project at `early.surge.xyz` to be eligible for the prize pool. Ensure:
- Project is registered under the correct hackathon
- GitHub repo link is added
- Team profile is complete
