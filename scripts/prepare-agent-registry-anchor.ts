import {
  buildAgentRegistryAnchorPlan,
  listSupportedAgentRegistryAnchors,
} from "../api/app/shared-sepolia.ts";

function printUsage(): void {
  console.error("Usage: node scripts/prepare-agent-registry-anchor.ts <agent-id>");
  console.error(`Supported agent ids: ${listSupportedAgentRegistryAnchors().join(", ")}`);
}

async function main(): Promise<void> {
  const input = process.argv[2];

  if (!input || input === "--help") {
    printUsage();
    process.exitCode = input ? 0 : 1;
    return;
  }

  if (input === "--list") {
    console.log(JSON.stringify(listSupportedAgentRegistryAnchors(), null, 2));
    return;
  }

  console.log(JSON.stringify(buildAgentRegistryAnchorPlan(input), null, 2));
}

await main();
