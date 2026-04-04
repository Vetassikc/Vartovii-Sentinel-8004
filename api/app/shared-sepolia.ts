import { Interface, ZeroAddress } from "ethers";

import { ORGANIZER_SHARED_SEPOLIA_CONTRACTS } from "../../shared/config/shared-sepolia.ts";
import type {
  AgentRegistryAnchorPlan,
  SharedSepoliaContracts,
} from "../../shared/schemas/sentinel.ts";
import { resolveAgentIdentityBinding } from "./erc8004.ts";

const SUPPORTED_AGENT_IDS = ["strategy-agent-demo"] as const;

export const AGENT_REGISTRY_REGISTER_SIGNATURE =
  "register(address,string,string,string[],string)";
export const AGENT_REGISTRY_INTERFACE = new Interface([
  `function ${AGENT_REGISTRY_REGISTER_SIGNATURE} returns (uint256 agentId)`,
]);

function buildAgentTokenMetadata(agentId: string) {
  const identityBinding = resolveAgentIdentityBinding(agentId);
  const payload = identityBinding.registration_payload;

  return {
    name: payload.name,
    description: payload.description,
    agent_id: identityBinding.agent_id,
    operator_wallet: identityBinding.operator_wallet,
    agent_wallet: identityBinding.agent_wallet,
    capabilities: payload.capabilities,
    chain_id: payload.chain_id,
    venue_scope: payload.venue_scope,
    market_scope: payload.market_scope,
    registered_at: payload.registered_at,
    schema_version: payload.schema_version,
    demo_only: payload.demo_only,
    binding_hash: identityBinding.binding_hash,
  };
}

function encodeJsonDataUri(value: unknown): string {
  const json = JSON.stringify(value);
  return `data:application/json;base64,${Buffer.from(json, "utf8").toString("base64")}`;
}

export function getSharedSepoliaContracts(): SharedSepoliaContracts {
  return {
    ...ORGANIZER_SHARED_SEPOLIA_CONTRACTS,
    read_only: true,
  };
}

export function listSupportedAgentRegistryAnchors(): string[] {
  return [...SUPPORTED_AGENT_IDS];
}

export function isSupportedAgentRegistryAnchor(agentId: string): boolean {
  return (SUPPORTED_AGENT_IDS as readonly string[]).includes(agentId);
}

export function buildAgentRegistryAnchorPlan(agentId: string): AgentRegistryAnchorPlan {
  if (!isSupportedAgentRegistryAnchor(agentId)) {
    throw new Error(`No supported shared-Sepolia anchor plan for agent: ${agentId}`);
  }

  const identityBinding = resolveAgentIdentityBinding(agentId);
  const payload = identityBinding.registration_payload;

  if (!payload.active || identityBinding.agent_wallet === ZeroAddress) {
    throw new Error(`Agent identity is not anchor-ready: ${agentId}`);
  }

  const metadata_preview = buildAgentTokenMetadata(agentId);
  const recommended_agent_uri = encodeJsonDataUri(metadata_preview);
  const registration_args = {
    agentWallet: identityBinding.agent_wallet,
    name: payload.name,
    description: payload.description,
    capabilities: payload.capabilities,
    agentURI: recommended_agent_uri,
  };
  const calldata = AGENT_REGISTRY_INTERFACE.encodeFunctionData("register", [
    registration_args.agentWallet,
    registration_args.name,
    registration_args.description,
    registration_args.capabilities,
    registration_args.agentURI,
  ]);

  return {
    anchor_id: `shared-sepolia-agent-registry-anchor-${agentId}`,
    agent_id: agentId,
    network: ORGANIZER_SHARED_SEPOLIA_CONTRACTS.network,
    chain_id: ORGANIZER_SHARED_SEPOLIA_CONTRACTS.chain_id,
    contract_name: "AgentRegistry",
    contract_address: ORGANIZER_SHARED_SEPOLIA_CONTRACTS.agent_registry,
    function_name: "register",
    function_signature: AGENT_REGISTRY_REGISTER_SIGNATURE,
    operator_wallet: identityBinding.operator_wallet,
    agent_wallet: identityBinding.agent_wallet,
    registration_payload: payload,
    registration_args,
    metadata_preview,
    recommended_agent_uri,
    recommended_agent_uri_kind: "data_uri_json",
    calldata,
    transaction_request: {
      to: ORGANIZER_SHARED_SEPOLIA_CONTRACTS.agent_registry,
      data: calldata,
      value: "0x0",
      chainId: ORGANIZER_SHARED_SEPOLIA_CONTRACTS.chain_id,
    },
    read_only_links: [
      {
        label: "AgentRegistry contract",
        url: `${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.explorer_base_url}/address/${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.agent_registry}`,
      },
      {
        label: "AgentRegistry events",
        url: `${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.explorer_base_url}/address/${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.agent_registry}#events`,
      },
      {
        label: "Operator wallet on Etherscan",
        url: `${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.explorer_base_url}/address/${identityBinding.operator_wallet}`,
      },
      {
        label: "Agent wallet on Etherscan",
        url: `${ORGANIZER_SHARED_SEPOLIA_CONTRACTS.explorer_base_url}/address/${identityBinding.agent_wallet}`,
      },
    ],
    founder_action_required: true,
    implemented_scope: [
      "shared_sepolia_contract_config",
      "agent_registry_registration_payload_preparation",
      "agent_registry_register_calldata_generation",
    ],
    not_implemented: [
      "transaction_broadcast",
      "wallet_prompting_in_hosted_demo",
      "live_onchain_registration_lookup",
      "shared_contract_state_mutation_from_public_server",
    ],
    demo_only: true,
  };
}
