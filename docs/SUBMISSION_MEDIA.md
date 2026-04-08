# Submission Media

## Goal

Prepare the smallest public-safe media package required for hackathon
submission.

This repo now includes:

- a judge-friendly slide deck source
- a tracked upload-ready PDF artifact
- a reproducible PDF export path for refreshes
- clear reuse of existing public screenshots and cover art

## Slide Deck Source

The canonical slide source is:

- `slides/sentinel-8004-submission-deck-v2.html`

The deck stays intentionally narrow and covers:

1. problem
2. thesis
3. product flow
4. proof artifacts
5. live demo surface
6. why this matters for autonomous trading agents

## PDF Export

Export the upload-ready slide PDF with:

```bash
npm run slides:pdf
```

The generated upload-ready PDF path is:

- `slides/sentinel-8004-submission-deck-v2.pdf`

The export script uses a local Chrome-compatible browser in headless mode and
does not require private infrastructure.

## Asset Reuse

The slide deck reuses these public-safe assets:

- `assets/cover/sentinel-8004-cover.png`
- `assets/social/sentinel-8004-thread-card.png`
- `assets/screenshots/judge-demo-allow-btc-buy.png`
- `assets/screenshots/judge-demo-downsize-eth-buy.png`

See `assets/README.md` for the broader asset pack.

## Local Verification

Recommended local verification flow:

1. Regenerate the PDF with `npm run slides:pdf`.
2. Confirm the PDF exists at `slides/sentinel-8004-submission-deck-v2.pdf`.
3. Run `node --test api/tests/*.test.ts`.

## Video Boundary

This repo does not include the final recorded presentation video.

The next manual step is to record a short walkthrough that follows
`docs/DEMO_SCRIPT.md` and uses this deck as the opening and closing visual
structure.
