import test from "node:test";
import assert from "node:assert/strict";

import { handleJudgeModeRequest } from "../app/server.ts";
import { loadExpectedVerdict, loadScenarioIntent } from "../app/scenarios.ts";

test("POST /api/demo/evaluate-intent route logic returns the canonical evaluation response", async () => {
  const intent = await loadScenarioIntent("downsize-eth-buy");
  const expectedVerdict = await loadExpectedVerdict("downsize-eth-buy");

  const response = await handleJudgeModeRequest(
    "POST",
    "/api/demo/evaluate-intent",
    JSON.stringify(intent),
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, expectedVerdict);
});

test("POST /api/demo/evaluate-intent route logic returns 400 for invalid payloads", async () => {
  const response = await handleJudgeModeRequest(
    "POST",
    "/api/demo/evaluate-intent",
    JSON.stringify({ trace_id: "broken" }),
  );

  assert.equal(response.statusCode, 400);
  assert.equal((response.payload as { error: string }).error, "invalid_trade_intent");
});

test("unknown routes return 404", async () => {
  const response = await handleJudgeModeRequest("GET", "/api/demo/unknown", "");

  assert.equal(response.statusCode, 404);
  assert.equal((response.payload as { error: string }).error, "not_found");
});
