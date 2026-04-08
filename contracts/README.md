# Shared Contract Artifacts

This directory contains the smallest public-safe contract artifacts needed to
understand how Sentinel-8004 aligns with the organizer-provided shared Sepolia
contracts.

## Included Here

- `shared-sepolia-minimal-abis.ts`
  - human-readable ABI fragments for the exact shared contract touchpoints
    referenced by the public demo and supporting proof surfaces

## Why This Exists

The public Sentinel repo does not ship private operator code or alternate
contract deployments.

Instead, it keeps a narrow, judge-friendly artifact set:

- organizer shared contract addresses
- minimal ABI fragments
- read-only JSON config
- founder-run calldata preparation for `AgentRegistry.register(...)`

For the broader explanation, read `../docs/SHARED_SEPOLIA.md`.
