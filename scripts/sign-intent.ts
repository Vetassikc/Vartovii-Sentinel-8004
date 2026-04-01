import { buildSignedTradeIntentBundle } from "../api/app/erc8004.ts";
import { validateTradeIntent } from "../api/app/policy.ts";
import {
  isScenarioName,
  listScenarioNames,
  loadIntentFromFile,
  loadScenarioIntent,
  resolveInputPath,
} from "../api/app/scenarios.ts";

function printUsage(): void {
  console.error("Usage: node scripts/sign-intent.ts <scenario-name | path-to-intent-json>");
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

  const validation = validateTradeIntent(intent);
  if (!validation.ok) {
    console.error(JSON.stringify(validation.error, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(buildSignedTradeIntentBundle(validation.value), null, 2));
}

await main();
