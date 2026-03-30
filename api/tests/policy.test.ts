import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateTradeIntent,
  validatePermitVerificationRequest,
  validateTradeIntent,
  verifyTradePermit,
} from "../app/policy.ts";
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

test("verifyTradePermit blocks the original downsize request but allows the downsized envelope", async () => {
  const intent = await loadScenarioIntent("downsize-eth-buy");
  const evaluation = evaluateTradeIntent(intent);

  const blockedAttempt = verifyTradePermit({
    intent,
    signed_verdict: evaluation.signed_verdict,
  });
  const allowedAttempt = verifyTradePermit({
    intent,
    signed_verdict: evaluation.signed_verdict,
    requested_notional_usd: "2500.00",
  });

  assert.equal(blockedAttempt.permit_valid, true);
  assert.equal(blockedAttempt.executable, false);
  assert.equal(blockedAttempt.verification_code, "REQUEST_EXCEEDS_APPROVED_NOTIONAL");

  assert.equal(allowedAttempt.permit_valid, true);
  assert.equal(allowedAttempt.executable, true);
  assert.equal(allowedAttempt.verification_code, "EXECUTION_PERMITTED");
});

test("verifyTradePermit rejects tampered signatures", async () => {
  const intent = await loadScenarioIntent("allow-btc-buy");
  const evaluation = evaluateTradeIntent(intent);

  const verification = verifyTradePermit({
    intent,
    signed_verdict: {
      ...evaluation.signed_verdict,
      signature: "0xdeadbeef",
    },
  });

  assert.equal(verification.permit_valid, false);
  assert.equal(verification.executable, false);
  assert.equal(verification.verification_code, "SIGNATURE_INVALID");
});

test("validatePermitVerificationRequest rejects invalid payloads", () => {
  const validation = validatePermitVerificationRequest({
    intent: {
      trace_id: "trace-1",
    },
    signed_verdict: {
      trace_id: "trace-1",
    },
  });

  assert.equal(validation.ok, false);
  if (!validation.ok) {
    assert.equal(validation.error.error, "invalid_permit_verification_request");
    assert.ok(validation.error.details.length >= 2);
  }
});
