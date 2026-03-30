import {
  evaluateTradeIntent,
  validateTradeIntent,
  verifyTradePermit,
} from "../api/app/policy.ts";
import {
  isScenarioName,
  listScenarioNames,
  loadIntentFromFile,
  loadScenarioIntent,
  resolveInputPath,
} from "../api/app/scenarios.ts";

function printUsage(): void {
  console.error(
    "Usage: node scripts/verify-permit.ts <scenario-name | path-to-intent-json> [requested-notional-usd] [verified-at]",
  );
  console.error(`Available scenarios: ${listScenarioNames().join(", ")}`);
}

async function main(): Promise<void> {
  const input = process.argv[2];
  const requestedNotionalUsd = process.argv[3];
  const verifiedAt = process.argv[4];

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

  const evaluation = evaluateTradeIntent(validation.value);
  const verification = verifyTradePermit({
    intent: validation.value,
    signed_verdict: evaluation.signed_verdict,
    requested_notional_usd: requestedNotionalUsd,
    verified_at: verifiedAt,
  });

  console.log(JSON.stringify(verification, null, 2));
}

await main();
