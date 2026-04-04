# Founder Paper Smoke Rehearsal

## Goal

This runbook helps a founder or operator rehearse the closest public-safe path
to real usage without switching into live trading.

The rehearsal stays inside three boundaries:

- Sentinel still decides whether execution should continue
- Kraken remains paper-only and local to the operator machine
- no live credentials, private keys, or hosted secrets are required

## What This Rehearsal Proves

The point is not to prove alpha or strategy quality.

The point is to prove that the operator flow is coherent:

`compose intent -> run Sentinel -> inspect signed proof -> inspect permit -> inspect execution preview -> inspect corrected Kraken paper command`

## Recommended Scenario

Start with:

- `downsize-eth-buy`

It is the best rehearsal scenario because it shows:

- a valid signed intent
- a constrained verdict
- a permit that blocks the original request
- a smaller executable path
- a corrected Kraken paper command template derived from the downsized path

## Step 1: Start The Local Server

```bash
npm run start
```

Open:

- `http://127.0.0.1:8787/operator`

## Step 2: Run The Operator Dry-Run Flow

In `/operator`:

1. load `downsize-eth-buy`
2. keep the canonical intent as-is for the first pass
3. click `Run Sentinel Pipeline`

Confirm that the shell shows:

- `ALLOW_WITH_DOWNSIZE`
- constrained proof status
- a blocked original permit outcome
- a downsized execution preview
- a Kraken paper smoke artifact

## Step 3: Reproduce The Signed Intent Locally

Generate the typed signed intent:

```bash
node scripts/sign-intent.ts downsize-eth-buy
```

Verify the same signed bundle:

```bash
node scripts/verify-signed-intent.ts downsize-eth-buy
```

You should see a verified signed-intent result with signer recovery.

## Step 4: Reproduce The Full Pipeline From The CLI

Submit the canonical intent through the aggregate operator route:

```bash
curl -X POST http://127.0.0.1:8787/api/demo/run-pipeline \
  -H "Content-Type: application/json" \
  --data @examples/intents/downsize-eth-buy.json
```

Inspect these fields in the response:

- `signed_intent_bundle`
- `signed_intent_verification`
- `evaluation.verdict`
- `evaluation.validation_artifact.proof_status`
- `permit_verification.verification_code`
- `execution_preview.execution_disposition`
- `kraken_cli_paper_artifact.paper_command_template`
- `kraken_cli_paper_artifact.should_emit_command`

## Step 5: Generate The Corrected Kraken Paper Artifact Directly

```bash
node scripts/kraken-paper-smoke.ts downsize-eth-buy
```

Confirm:

- `execution_disposition` is `ALLOWED_WITH_DOWNSIZE`
- `ticker` is `ETHUSD`
- `paper_command_template` uses `kraken paper buy ETHUSD ... -o json`
- `mcp_transport` is `stdio`
- the forbidden patterns list still blocks outdated organizer-invalid syntax

## Step 6: Optional Local Kraken CLI Paper Rehearsal

Only do this on your own machine if Kraken CLI is already installed locally.

This repo does not automate these commands and does not claim live integration.

If you want to rehearse the command model manually, use the corrected syntax:

```bash
kraken paper init --balance 10000 --currency USD
kraken paper buy ETHUSD 0.001
kraken paper balance
kraken paper history
```

Keep this boundary explicit:

- Sentinel decides the allowed shape
- the smoke artifact shows the corrected command path
- the operator still owns the final local paper command execution

## What Counts As A Good Rehearsal

A good rehearsal proves:

- the operator can start from a canonical intent
- Sentinel produces signed, inspectable proof
- the original oversized request does not remain executable
- the downsized path stays consistent across proof, permit, and execution preview
- the Kraken paper command model stays aligned with the corrected organizer syntax

## What This Still Does Not Prove

This rehearsal does not prove:

- live exchange execution
- profitable trading
- production custody
- live on-chain settlement

It proves a much narrower thing:

`Sentinel can stand in front of an execution rail and constrain what would be allowed to continue.`
