# Shared Sepolia Alignment

## Purpose

This document explains how the public Sentinel-8004 repo aligns with the
organizer-provided ERC-8004 contracts on Sepolia.

The repo does not deploy alternate judging contracts.

Instead, it exposes:

- the shared contract addresses as a public-safe config surface
- minimal ABI fragments for the shared contract touchpoints in `contracts/shared-sepolia-minimal-abis.ts`
- a bounded `AgentRegistry` anchor helper
- a founder-run calldata plan for `register(...)`

## Organizer Shared Contracts

Network: `Sepolia`

Chain ID: `11155111`

- `AgentRegistry`
  - `0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3`
- `HackathonVault`
  - `0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90`
- `RiskRouter`
  - `0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC`
- `ReputationRegistry`
  - `0x423a9904e39537a9997fbaF0f220d79D7d545763`
- `ValidationRegistry`
  - `0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1`

## What This Repo Implements

### Read-Only Shared Contract Surface

The local server exposes:

- `GET /api/demo/shared-sepolia`

This returns the organizer shared addresses and network metadata as JSON.

### AgentRegistry Anchor Plan

The local server also exposes:

- `GET /api/demo/shared-sepolia/agent-registry-anchor/strategy-agent-demo`

The route returns a founder-run registration plan for the current public-safe
demo identity:

- target contract address
- function name and signature
- prepared `register(...)` arguments
- self-contained `agentURI` as a JSON data URI
- transaction calldata
- Etherscan read-only links

The same artifact can be generated from the CLI:

```bash
node scripts/prepare-agent-registry-anchor.ts strategy-agent-demo
```

## AgentRegistry Function Used

The helper aligns to the tutorial-style `AgentRegistry.register(...)` shape:

```solidity
register(
  address agentWallet,
  string name,
  string description,
  string[] capabilities,
  string agentURI
)
```

This repo only prepares calldata and metadata for that call.

It does not broadcast the transaction.

## Boundary

### Read-Only Today

- organizer shared contract config
- Etherscan inspection links
- calldata preparation
- founder-run transaction request formatting

### Founder Action Required

- connecting a funded Sepolia operator wallet
- reviewing the generated `agentURI`
- broadcasting the `register(...)` transaction
- confirming the resulting `agentId` on Etherscan

### Not Implemented Yet

- hosted wallet prompts
- transaction broadcasting from the public demo
- live on-chain lookup of an existing shared registration
- shared-contract writes from judge or operator shells

## Why This Matters

This slice moves Sentinel-8004 closer to the organizer reference architecture
without destabilizing the current public demo.

The proof story is now:

- public-safe identity binding in the repo
- real EIP-712 signing and verification in the repo
- shared-Sepolia `AgentRegistry` anchor plan for the organizer contracts

That is enough to show alignment without pretending the hosted demo already
controls real on-chain custody or contract writes.
