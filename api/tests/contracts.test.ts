import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AGENT_REGISTRY_MINIMAL_ABI,
  RISK_ROUTER_MINIMAL_ABI,
  SHARED_SEPOLIA_MINIMAL_ABIS,
  VALIDATION_REGISTRY_MINIMAL_ABI,
} from "../../contracts/shared-sepolia-minimal-abis.ts";

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(TEST_DIR, "../..");

test("shared contract artifact files exist", () => {
  assert.equal(existsSync(resolve(ROOT_DIR, "contracts/README.md")), true);
  assert.equal(existsSync(resolve(ROOT_DIR, "contracts/shared-sepolia-minimal-abis.ts")), true);
});

test("shared contract ABI fragments cover the judge-facing touchpoints", () => {
  assert.match(AGENT_REGISTRY_MINIMAL_ABI[0], /register\(address agentWallet/);
  assert.match(RISK_ROUTER_MINIMAL_ABI[2], /getIntentNonce/);
  assert.match(VALIDATION_REGISTRY_MINIMAL_ABI[0], /postEIP712Attestation/);
  assert.deepEqual(Object.keys(SHARED_SEPOLIA_MINIMAL_ABIS), [
    "AgentRegistry",
    "HackathonVault",
    "RiskRouter",
    "ValidationRegistry",
    "ReputationRegistry",
  ]);
});
