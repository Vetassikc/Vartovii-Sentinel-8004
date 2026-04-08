export const AGENT_REGISTRY_MINIMAL_ABI = [
  "function register(address agentWallet, string name, string description, string[] capabilities, string agentURI) external returns (uint256 agentId)",
  "function isRegistered(uint256 agentId) external view returns (bool)",
  "function getAgent(uint256 agentId) external view returns (tuple(address operatorWallet, address agentWallet, string name, string description, string[] capabilities, uint256 registeredAt, bool active))",
  "function getSigningNonce(uint256 agentId) external view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address operatorWallet, address agentWallet, string name)",
] as const;

export const HACKATHON_VAULT_MINIMAL_ABI = [
  "function claimAllocation(uint256 agentId) external",
  "function getBalance(uint256 agentId) external view returns (uint256)",
  "function hasClaimed(uint256 agentId) external view returns (bool)",
  "function allocationPerTeam() external view returns (uint256)",
] as const;

export const RISK_ROUTER_MINIMAL_ABI = [
  "function submitTradeIntent(tuple(uint256 agentId, address agentWallet, string pair, string action, uint256 amountUsdScaled, uint256 maxSlippageBps, uint256 nonce, uint256 deadline) intent, bytes signature) external",
  "function simulateIntent(tuple(uint256 agentId, address agentWallet, string pair, string action, uint256 amountUsdScaled, uint256 maxSlippageBps, uint256 nonce, uint256 deadline) intent) external view returns (bool valid, string memory reason)",
  "function getIntentNonce(uint256 agentId) external view returns (uint256)",
  "event TradeApproved(uint256 indexed agentId, bytes32 intentHash, uint256 amountUsdScaled)",
  "event TradeRejected(uint256 indexed agentId, bytes32 intentHash, string reason)",
] as const;

export const VALIDATION_REGISTRY_MINIMAL_ABI = [
  "function postEIP712Attestation(uint256 agentId, bytes32 checkpointHash, uint8 score, string notes) external",
  "function getAverageValidationScore(uint256 agentId) external view returns (uint256)",
] as const;

export const REPUTATION_REGISTRY_MINIMAL_ABI = [
  "function submitFeedback(uint256 agentId, uint8 score, bytes32 outcomeRef, string comment, uint8 feedbackType) external",
  "function getAverageScore(uint256 agentId) external view returns (uint256)",
] as const;

export const SHARED_SEPOLIA_MINIMAL_ABIS = {
  AgentRegistry: AGENT_REGISTRY_MINIMAL_ABI,
  HackathonVault: HACKATHON_VAULT_MINIMAL_ABI,
  RiskRouter: RISK_ROUTER_MINIMAL_ABI,
  ValidationRegistry: VALIDATION_REGISTRY_MINIMAL_ABI,
  ReputationRegistry: REPUTATION_REGISTRY_MINIMAL_ABI,
} as const;
