import test from "node:test";
import assert from "node:assert/strict";

import { buildKrakenCliPaperSmokeArtifact } from "../app/kraken-cli-compat.ts";
import { buildKrakenExecutionPreview } from "../app/execution-preview.ts";
import { evaluateTradeIntent } from "../app/policy.ts";
import { loadExpectedKrakenCliCompatArtifact, loadScenarioIntent } from "../app/scenarios.ts";

test("buildKrakenCliPaperSmokeArtifact matches the canonical downsize fixture", async () => {
  const intent = await loadScenarioIntent("downsize-eth-buy");
  const preview = buildKrakenExecutionPreview(intent, evaluateTradeIntent(intent));
  const expectedArtifact = await loadExpectedKrakenCliCompatArtifact("downsize-eth-buy");

  assert.deepEqual(buildKrakenCliPaperSmokeArtifact(preview), expectedArtifact);
});

test("buildKrakenCliPaperSmokeArtifact follows corrected Kraken CLI guidance", async () => {
  const intent = await loadScenarioIntent("allow-btc-buy");
  const preview = buildKrakenExecutionPreview(intent, evaluateTradeIntent(intent));
  const artifact = buildKrakenCliPaperSmokeArtifact(preview);

  assert.equal(artifact.cli_binary, "kraken");
  assert.equal(artifact.mode, "paper");
  assert.equal(artifact.command_group, "order");
  assert.equal(artifact.action, "buy");
  assert.equal(artifact.ticker, "BTCUSD");
  assert.equal(artifact.output_flag, "-o json");
  assert.equal(
    artifact.paper_command_template,
    "kraken paper order buy BTCUSD <ORDER_PARAMS...> -o json",
  );
  for (const forbiddenPattern of artifact.forbidden_patterns) {
    assert.equal(artifact.paper_command_template.includes(forbiddenPattern), false);
  }
});

test("blocked Kraken CLI artifacts stay as reference templates only", async () => {
  const intent = await loadScenarioIntent("deny-oversize-eth");
  const preview = buildKrakenExecutionPreview(intent, evaluateTradeIntent(intent));
  const artifact = buildKrakenCliPaperSmokeArtifact(preview);

  assert.equal(artifact.execution_disposition, "BLOCKED");
  assert.equal(artifact.should_emit_command, false);
  assert.equal(artifact.executable_verification_code, "NOT_EMITTED");
  assert.ok(
    artifact.notes.includes(
      "When Sentinel blocks execution, keep the command as a reference template only and do not emit it downstream.",
    ),
  );
});
