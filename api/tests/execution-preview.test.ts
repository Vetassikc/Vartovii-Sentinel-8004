import test from "node:test";
import assert from "node:assert/strict";

import { buildKrakenExecutionPreview } from "../app/execution-preview.ts";
import { evaluateTradeIntent } from "../app/policy.ts";
import { loadExpectedExecutionPreview, loadScenarioIntent } from "../app/scenarios.ts";

for (const scenarioName of ["allow-btc-buy", "downsize-eth-buy", "deny-oversize-eth"] as const) {
  test(`buildKrakenExecutionPreview matches fixture for ${scenarioName}`, async () => {
    const intent = await loadScenarioIntent(scenarioName);
    const expectedPreview = await loadExpectedExecutionPreview(scenarioName);

    assert.deepEqual(
      buildKrakenExecutionPreview(intent, evaluateTradeIntent(intent)),
      expectedPreview,
    );
  });
}

test("buildKrakenExecutionPreview blocks fail-closed scenarios before a Kraken order is emitted", async () => {
  const intent = await loadScenarioIntent("fail-closed-oracle");
  const preview = buildKrakenExecutionPreview(intent, evaluateTradeIntent(intent));

  assert.equal(preview.execution_disposition, "BLOCKED");
  assert.equal(preview.source_venue, "demo");
  assert.equal(preview.requested_verification_code, "VERDICT_DENIES_EXECUTION");
  assert.equal(preview.executable_verification_code, "NOT_EMITTED");
  assert.equal(preview.executable_order, undefined);
  assert.ok(preview.preview_checks.includes("kraken_preview_not_emitted_for_non_kraken_source"));
});
