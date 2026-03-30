import test from "node:test";
import assert from "node:assert/strict";

import { handleJudgeModeRequest } from "../app/server.ts";
import { evaluateTradeIntent, verifyTradePermit } from "../app/policy.ts";
import { loadExpectedVerdict, loadScenarioIntent } from "../app/scenarios.ts";

test("GET / returns the judge demo shell HTML", async () => {
  const response = await handleJudgeModeRequest("GET", "/", "");

  assert.equal(response.statusCode, 200);
  assert.equal(response.contentType, "text/html; charset=utf-8");
  assert.match(response.payload as string, /Sentinel-8004 public proof walkthrough/);
});

test("GET /api/demo/scenarios returns the canonical scenario names", async () => {
  const response = await handleJudgeModeRequest("GET", "/api/demo/scenarios", "");

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, {
    scenarios: [
      "allow-btc-buy",
      "deny-oversize-eth",
      "downsize-eth-buy",
      "fail-closed-oracle",
    ],
  });
});

test("GET /api/demo/scenarios/:name returns the scenario bundle for the web shell", async () => {
  const intent = await loadScenarioIntent("allow-btc-buy");
  const evaluation = evaluateTradeIntent(intent);
  const response = await handleJudgeModeRequest(
    "GET",
    "/api/demo/scenarios/allow-btc-buy",
    "",
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, {
    scenario_name: "allow-btc-buy",
    intent,
    evaluation,
    permit_verification: verifyTradePermit({
      intent,
      signed_verdict: evaluation.signed_verdict,
    }),
  });
});

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

test("POST /api/demo/verify-permit route logic returns an executable gate result", async () => {
  const intent = await loadScenarioIntent("downsize-eth-buy");
  const evaluation = evaluateTradeIntent(intent);

  const response = await handleJudgeModeRequest(
    "POST",
    "/api/demo/verify-permit",
    JSON.stringify({
      intent,
      signed_verdict: evaluation.signed_verdict,
      requested_notional_usd: "2500.00",
    }),
  );

  assert.equal(response.statusCode, 200);
  assert.equal((response.payload as { executable: boolean }).executable, true);
  assert.equal(
    (response.payload as { verification_code: string }).verification_code,
    "EXECUTION_PERMITTED",
  );
});

test("POST /api/demo/verify-permit route logic returns 400 for invalid payloads", async () => {
  const response = await handleJudgeModeRequest(
    "POST",
    "/api/demo/verify-permit",
    JSON.stringify({
      intent: { trace_id: "broken" },
      signed_verdict: { trace_id: "broken" },
    }),
  );

  assert.equal(response.statusCode, 400);
  assert.equal(
    (response.payload as { error: string }).error,
    "invalid_permit_verification_request",
  );
});

test("unknown routes return 404", async () => {
  const response = await handleJudgeModeRequest("GET", "/api/demo/unknown", "");

  assert.equal(response.statusCode, 404);
  assert.equal((response.payload as { error: string }).error, "not_found");
});
