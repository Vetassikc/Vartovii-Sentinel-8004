import test from "node:test";
import assert from "node:assert/strict";

import { evaluateTradeIntent, validateTradeIntent } from "../app/policy.ts";
import { listScenarioNames, loadExpectedVerdict, loadScenarioIntent } from "../app/scenarios.ts";

for (const scenarioName of listScenarioNames()) {
  test(`evaluateTradeIntent matches fixture for ${scenarioName}`, async () => {
    const intent = await loadScenarioIntent(scenarioName);
    const expectedVerdict = await loadExpectedVerdict(scenarioName);

    assert.deepEqual(evaluateTradeIntent(intent), expectedVerdict);
  });
}

test("validateTradeIntent rejects invalid payloads", () => {
  const validation = validateTradeIntent({
    trace_id: "",
    venue: "kraken",
  });

  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.error.error, "invalid_trade_intent");
    assert.ok(validation.error.details.length > 1);
  }
});
