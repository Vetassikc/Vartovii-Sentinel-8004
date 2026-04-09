import test from "node:test";
import assert from "node:assert/strict";

import { evaluateTradeIntent, verifyTradePermit } from "../app/policy.ts";
import { buildKrakenExecutionPreview } from "../app/execution-preview.ts";
import { loadScenarioIntent } from "../app/scenarios.ts";
import { buildStatusNotes, buildStatusSummary } from "../../web/status-notes.js";

async function buildBundle(scenarioName: Parameters<typeof loadScenarioIntent>[0]) {
  const intent = await loadScenarioIntent(scenarioName);
  const evaluation = evaluateTradeIntent(intent);
  const permitVerification = verifyTradePermit({
    intent,
    signed_verdict: evaluation.signed_verdict,
  });
  const executionPreview = buildKrakenExecutionPreview(intent, evaluation);

  return {
    intent,
    evaluation,
    permit_verification: permitVerification,
    execution_preview: executionPreview,
  };
}

test("status notes stay hidden for fully executable allow scenarios", async () => {
  const bundle = await buildBundle("allow-btc-buy");
  const notes = buildStatusNotes(bundle);

  assert.deepEqual(notes, []);
  assert.equal(buildStatusSummary(bundle, notes), "");
});

test("status notes explain constrained scenarios without pretending they are fully green", async () => {
  const bundle = await buildBundle("downsize-eth-buy");
  const notes = buildStatusNotes(bundle);

  assert.ok(notes.length >= 3);
  assert.deepEqual(
    notes.map((note) => note.label),
    ["Constrained proof state", "Permit scope mismatch", "Execution preview"],
  );
  assert.match(notes[0].detail, /approved downsized permit envelope/i);
  assert.match(notes[1].detail, /exceeds the approved permit envelope/i);
  assert.match(notes[2].detail, /downsized executable order/i);
  assert.match(buildStatusSummary(bundle, notes), /bounded path/i);
});

test("status notes explain blocked scenarios with an explicit denial reason", async () => {
  const bundle = await buildBundle("deny-oversize-eth");
  const notes = buildStatusNotes(bundle);

  assert.ok(notes.length >= 3);
  assert.deepEqual(
    notes.map((note) => note.label),
    ["Blocked proof state", "Execution denied", "Execution preview"],
  );
  assert.match(notes[0].detail, /did not produce a fully executable proof path/i);
  assert.match(notes[1].detail, /signed verdict denies execution/i);
  assert.match(notes[2].detail, /does not emit an executable order/i);
  assert.match(buildStatusSummary(bundle, notes), /blocked the requested path/i);
});
