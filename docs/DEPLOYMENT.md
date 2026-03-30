# Deployment Notes

## Goal

Prepare the public judge demo for a simple hosted application URL without
expanding the repository beyond its narrow demo scope.

## Concrete Target

This repo is prepared for a small Node web service deployment on Render.

The minimal deployment packaging is:

- `render.yaml`
- `npm run start:prod`
- `GET /healthz`

## Local Production-Style Run

Start the server the same way a simple host would:

```bash
npm run start:prod
```

The hosted submission hub will be available at:

```text
http://127.0.0.1:8787/
```

The live judge demo shell will be available at:

```text
http://127.0.0.1:8787/judge
```

The health endpoint will be available at:

```text
http://127.0.0.1:8787/healthz
```

## Render Path

1. Push the public repo to a Git provider that Render can access.
2. Create a new Render Blueprint or Web Service from this repository.
3. Let Render read `render.yaml`.
4. Confirm the service uses:
   - `npm install`
   - `npm run start:prod`
   - `/healthz`
5. After the service is live, use the root URL as the hosted submission hub.
6. Use `/judge` as the stable path for the live judge demo shell.

## Explicit Boundary

This document prepares the app for hosting.

It does not claim that the app is already deployed, publicly reachable, or
backed by live trading infrastructure.
