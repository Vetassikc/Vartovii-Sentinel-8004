# Sentinel-8004 Submission Asset Pack

This folder contains the smallest public-safe asset pack for hackathon
submission materials.

## Cover Asset

Use `cover/sentinel-8004-cover.png` as the default cover-ready image for:

- hackathon submission cover uploads
- slide deck title slides
- video thumbnails

## Canonical Judge Demo Screenshots

Use these two screenshots as the canonical demo shell states:

- `screenshots/judge-demo-allow-btc-buy.png`
  - default approved path
  - shows `ALLOW`, `VALIDATED`, and an executable permit
- `screenshots/judge-demo-downsize-eth-buy.png`
  - constrained path
  - shows `ALLOW_WITH_DOWNSIZE`, `CONSTRAINED`, and a non-executable
    oversized request

These screenshots are captured from the public judge demo shell and are the
recommended stills for lablab, slides, and demo videos.

The canonical slide deck source in `../slides/sentinel-8004-submission-deck-v2.html`
reuses both screenshots.

## Social And Share Card

Use `social/sentinel-8004-thread-card.png` as the public-safe share card for:

- social posts
- stream announcements
- recap threads

If you need to re-export or restyle the card, use
`social/sentinel-8004-thread-card.html` as the editable source.

## Best Reusable Proof Artifact

For judge walkthroughs, video overlays, and social callouts, the most reusable
artifact is the `Validation Artifact` payload surfaced by the judge demo shell.

It is the clearest single object for showing:

- the agent registration binding
- the decision hash binding
- the permit hash binding
- the demo-only proof status

## Safety Note

All assets in this pack are public-safe demo materials. They do not claim live
on-chain verification, broker execution, or real capital deployment.
