import { buildKrakenCliPaperSmokeArtifact } from "../api/app/kraken-cli-compat.ts";
import { buildKrakenExecutionPreview } from "../api/app/execution-preview.ts";
import { evaluateTradeIntent } from "../api/app/policy.ts";
import {
  isScenarioName,
  listScenarioNames,
  loadIntentFromFile,
  loadScenarioIntent,
  resolveInputPath,
} from "../api/app/scenarios.ts";

function printUsage(): void {
  console.error(
    "Usage: node scripts/kraken-paper-smoke.ts <scenario-name | path-to-intent-json>",
  );
  console.error(`Available scenarios: ${listScenarioNames().join(", ")}`);
}

async function main(): Promise<void> {
  const input = process.argv[2];

  if (!input || input === "--help") {
    printUsage();
    process.exitCode = input ? 0 : 1;
    return;
  }

  if (input === "--list") {
    console.log(JSON.stringify(listScenarioNames(), null, 2));
    return;
  }

  const intent = isScenarioName(input)
    ? await loadScenarioIntent(input)
    : await loadIntentFromFile(resolveInputPath(input));
  const evaluation = evaluateTradeIntent(intent);
  const executionPreview = buildKrakenExecutionPreview(intent, evaluation);
  const artifact = buildKrakenCliPaperSmokeArtifact(executionPreview);

  console.log(JSON.stringify(artifact, null, 2));
}

await main();
