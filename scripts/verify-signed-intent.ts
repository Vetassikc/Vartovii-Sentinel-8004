import { readFile } from "node:fs/promises";

import { buildSignedTradeIntentBundle } from "../api/app/erc8004.ts";
import {
  validateSignedTradeIntentBundle,
  verifySignedTradeIntentBundle,
} from "../api/app/erc8004.ts";
import {
  isScenarioName,
  listScenarioNames,
  loadIntentFromFile,
  loadScenarioIntent,
  loadSignedIntentBundle,
  resolveInputPath,
} from "../api/app/scenarios.ts";

const FIXTURE_BUNDLES = ["allow-btc-buy"] as const;

function printUsage(): void {
  console.error(
    "Usage: node scripts/verify-signed-intent.ts <scenario-name | fixture-name | path-to-signed-intent-json>",
  );
  console.error(`Available scenarios: ${listScenarioNames().join(", ")}`);
  console.error(`Available fixture bundles: ${FIXTURE_BUNDLES.join(", ")}`);
}

async function loadBundle(input: string) {
  if (isScenarioName(input)) {
    return buildSignedTradeIntentBundle(await loadScenarioIntent(input));
  }

  if ((FIXTURE_BUNDLES as readonly string[]).includes(input)) {
    return loadSignedIntentBundle(input);
  }

  if (input.endsWith(".json")) {
    const fileUrl = resolveInputPath(input);
    const content = await readFile(fileUrl, "utf8");
    return JSON.parse(content);
  }

  return buildSignedTradeIntentBundle(await loadIntentFromFile(resolveInputPath(input)));
}

async function printList(): Promise<void> {
  console.log(
    JSON.stringify(
      {
        scenarios: listScenarioNames(),
        fixture_bundles: FIXTURE_BUNDLES,
      },
      null,
      2,
    ),
  );
}

async function main(): Promise<void> {
  const input = process.argv[2];

  if (!input || input === "--help") {
    printUsage();
    process.exitCode = input ? 0 : 1;
    return;
  }

  if (input === "--list") {
    await printList();
    return;
  }

  const bundle = await loadBundle(input);
  const validation = validateSignedTradeIntentBundle(bundle);
  if (!validation.ok) {
    console.error(JSON.stringify(validation.error, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(verifySignedTradeIntentBundle(validation.value), null, 2));
}

await main();
