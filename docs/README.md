# Sentinel-8004 Public Docs

This folder contains the public-safe documentation for the
`Vartovii Sentinel-8004` hackathon submission.

## Documents

- `ARCHITECTURE.md`
  - public architecture overview
- `JUDGE_MODE.md`
  - local and offline-friendly evaluation model
- `ERC8004_PROOF.md`
  - public-safe explanation of agent identity binding, typed trade intent, and proof flow alignment
- `EXECUTION_PREVIEW.md`
  - public-safe explanation of the Kraken-facing execution preview layer
- `SHARED_SEPOLIA.md`
  - organizer-aligned shared contract notes and AgentRegistry anchor plan
- `KRAKEN_CLI_COMPAT.md`
  - corrected Kraken CLI paper-command compatibility guidance
- `PAPER_SMOKE_REHEARSAL.md`
  - founder-side dry-run rehearsal path for the corrected paper flow
- `DEPLOYMENT.md`
  - minimal deployment preparation for a simple public host
- `DEMO_SCRIPT.md`
  - recommended live demo sequence for judges and streams
- `SUBMISSION_MEDIA.md`
  - slide deck and PDF export workflow for submission media

## Related Asset Pack

Submission-ready visual assets live outside this folder in `../assets/README.md`.

Use that index to find:

- the default cover image
- the canonical judge demo screenshots
- the public-safe social/share card

## Documentation Boundary

These docs are public-safe by design.

They should explain:

- what the submission does
- how judges can inspect it
- how the demo is structured
- how the typed signed-intent layer maps to the judge-mode flow
- how real EIP-712 signing is used with demo-only fixture keys
- how the Kraken execution preview begins only after Sentinel emits a permit
- how the corrected Kraken CLI paper syntax maps from the execution preview
- how a founder can rehearse the closest paper-only testing path without live credentials
- how the operator dry-run shell reuses the same public-safe proof pipeline
- how the operator shell also exposes a corrected Kraken paper smoke artifact
- how the repo aligns to organizer shared Sepolia contracts without self-deploying alternates
- why the hosted root URL is a submission hub
- how the demo shell is launched locally

They should not expose:

- private prompts
- private infrastructure details
- secrets or environment configuration
- legal or compliance overclaims
