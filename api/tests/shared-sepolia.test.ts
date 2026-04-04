import test from "node:test";
import assert from "node:assert/strict";
import { getAddress } from "ethers";

import { resolveAgentIdentityBinding } from "../app/erc8004.ts";
import {
  AGENT_REGISTRY_INTERFACE,
  AGENT_REGISTRY_REGISTER_SIGNATURE,
  buildAgentRegistryAnchorPlan,
  getSharedSepoliaContracts,
} from "../app/shared-sepolia.ts";

test("getSharedSepoliaContracts matches the organizer shared Sepolia addresses", () => {
  assert.deepEqual(getSharedSepoliaContracts(), {
    network: "sepolia",
    chain_id: 11155111,
    agent_registry: "0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3",
    hackathon_vault: "0x0E7CD8ef9743FEcf94f9103033a044caBD45fC90",
    risk_router: "0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC",
    reputation_registry: "0x423a9904e39537a9997fbaF0f220d79D7d545763",
    validation_registry: "0x92bF63E5C7Ac6980f237a164Ab413BE226187F1",
    explorer_base_url: "https://sepolia.etherscan.io",
    source: "organizer-shared-contracts",
    read_only: true,
  });
});

test("buildAgentRegistryAnchorPlan generates organizer-aligned register calldata", () => {
  const identityBinding = resolveAgentIdentityBinding("strategy-agent-demo");
  const plan = buildAgentRegistryAnchorPlan("strategy-agent-demo");
  const decoded = AGENT_REGISTRY_INTERFACE.decodeFunctionData("register", plan.calldata);
  const decodedAgentUri = String(decoded[4]);
  const metadataBuffer = Buffer.from(
    decodedAgentUri.replace("data:application/json;base64,", ""),
    "base64",
  );
  const metadata = JSON.parse(metadataBuffer.toString("utf8")) as Record<string, unknown>;

  assert.equal(plan.function_signature, AGENT_REGISTRY_REGISTER_SIGNATURE);
  assert.equal(plan.contract_address, "0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3");
  assert.equal(plan.transaction_request.to, plan.contract_address);
  assert.equal(plan.transaction_request.value, "0x0");
  assert.equal(plan.transaction_request.chainId, 11155111);
  assert.equal(getAddress(String(decoded[0])), identityBinding.agent_wallet);
  assert.equal(decoded[1], identityBinding.registration_payload.name);
  assert.equal(decoded[2], identityBinding.registration_payload.description);
  assert.deepEqual(
    Array.from(decoded[3] as Iterable<string>),
    identityBinding.registration_payload.capabilities,
  );
  assert.equal(decodedAgentUri, plan.recommended_agent_uri);
  assert.equal(metadata.agent_id, "strategy-agent-demo");
  assert.equal(metadata.agent_wallet, identityBinding.agent_wallet);
  assert.equal(metadata.operator_wallet, identityBinding.operator_wallet);
  assert.equal(plan.founder_action_required, true);
  assert.equal(plan.read_only_links.length, 4);
});

test("buildAgentRegistryAnchorPlan rejects unsupported agent ids", () => {
  assert.throws(
    () => buildAgentRegistryAnchorPlan("unknown-agent"),
    /No supported shared-Sepolia anchor plan/,
  );
});
