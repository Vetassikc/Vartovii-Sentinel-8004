import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSignedTradeIntentBundle,
  resolveAgentIdentityBinding,
  validateSignedTradeIntentBundle,
  verifySignedTradeIntentBundle,
} from "../app/erc8004.ts";
import { loadAgentIdentityBinding, loadExpectedVerdict, loadScenarioIntent, loadSignedIntentBundle } from "../app/scenarios.ts";

test("resolveAgentIdentityBinding matches the canonical identity fixture", async () => {
  const expectedIdentity = await loadAgentIdentityBinding("strategy-agent-demo");

  assert.deepEqual(resolveAgentIdentityBinding("strategy-agent-demo"), expectedIdentity);
});

test("buildSignedTradeIntentBundle matches the canonical signed intent fixture", async () => {
  const intent = await loadScenarioIntent("allow-btc-buy");
  const expectedBundle = await loadSignedIntentBundle("allow-btc-buy");

  assert.deepEqual(buildSignedTradeIntentBundle(intent), expectedBundle);
});

test("validateSignedTradeIntentBundle rejects invalid payloads", () => {
  const validation = validateSignedTradeIntentBundle({
    bundle_id: "broken",
    signer_wallet: "not-a-wallet",
  });

  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.error.error, "invalid_signed_trade_intent_bundle");
    assert.ok(validation.error.details.length >= 2);
  }
});

test("verifySignedTradeIntentBundle returns a fully verified allow-path proof", async () => {
  const bundle = await loadSignedIntentBundle("allow-btc-buy");
  const expectedEvaluation = await loadExpectedVerdict("allow-btc-buy");
  const verification = verifySignedTradeIntentBundle(bundle);

  assert.equal(verification.verification_code, "SIGNED_INTENT_VERIFIED");
  assert.equal(verification.typed_data_valid, true);
  assert.equal(verification.identity_binding_valid, true);
  assert.equal(verification.signature_valid, true);
  assert.equal(verification.sentinel_projection_valid, true);
  assert.deepEqual(verification.evaluation, expectedEvaluation);
  assert.equal(
    verification.permit_verification?.verification_code,
    "EXECUTION_PERMITTED",
  );
});

test("verifySignedTradeIntentBundle rejects a tampered signature", async () => {
  const bundle = await loadSignedIntentBundle("allow-btc-buy");
  const verification = verifySignedTradeIntentBundle({
    ...bundle,
    signature: "0xdeadbeef",
  });

  assert.equal(verification.verification_code, "SIGNATURE_INVALID");
  assert.equal(verification.signature_valid, false);
});
