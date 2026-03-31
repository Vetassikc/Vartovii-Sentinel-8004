import { readFile } from "node:fs/promises";

import {
  validateSignedTradeIntentBundle,
  verifySignedTradeIntentBundle,
} from "../api/app/erc8004.ts";
import {
  loadSignedIntentBundle,
  resolveInputPath,
} from "../api/app/scenarios.ts";

const EXAMPLE_BUNDLES = ["allow-btc-buy"] as const;

function printUsage(): void {
  console.error(
    "Usage: node scripts/verify-signed-intent.ts <example-name | path-to-signed-intent-json>",
  );
  console.error(`Available examples: ${EXAMPLE_BUNDLES.join(", ")}`);
}

async function loadBundle(input: string) {
  if ((EXAMPLE_BUNDLES as readonly string[]).includes(input)) {
    return loadSignedIntentBundle(input);
  }

  const fileUrl = resolveInputPath(input);
  const content = await readFile(fileUrl, "utf8");
  return JSON.parse(content);
}

async function main(): Promise<void> {
  const input = process.argv[2];

  if (!input || input === "--help") {
    printUsage();
    process.exitCode = input ? 0 : 1;
    return;
  }

  if (input === "--list") {
    console.log(JSON.stringify(EXAMPLE_BUNDLES, null, 2));
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
