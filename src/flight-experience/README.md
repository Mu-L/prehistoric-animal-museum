# Take Flight

A local-review candidate for Pteranodon exploration. The normal production build
keeps this feature disabled until its art, animation, comfort and device reviews
are complete. Flight has no sound, tracking, account, score or failure penalty.

## Run

```sh
npm run dev -- --host 0.0.0.0 --port 4286 --strictPort
```

Open `/zh-CN/?animal=pteranodon&experience=flight` or the English equivalent.
A direct link opens a stationary preview; flying requires pressing Start.
Arrow keys/WASD steer and change height. Space pauses when a semantic control
is not focused. Escape first closes settings, then exits. Touch users hold the
four direction buttons. Settings offer gentle movement and low/balanced scenery.

For a separately audited static candidate:

```sh
npm run build:flight
node server.mjs dist --host 0.0.0.0 --port 4288 --base /museum/
```

`/museum/zh-CN/animals/pteranodon/?experience=flight` works under this nested base.
A Tailscale peer can use the host's active Tailscale IP with the same port/path,
subject to the existing tailnet ACL and host firewall. This does not require
Tailscale Funnel, a public deployment, or changes to access controls.

## Verify and reproduce

```sh
npm run test:flight
npm run typecheck
npm run lint
npm test -- --run
npm run build
node scripts/flight/validate-build.mjs dist
npm run build:flight
```

Do not run the repository's default headless Playwright configuration for local
visual review. Use an available headed browser and record actual device limits.

`node scripts/flight/inspect-model.mjs` checks the original GLB and regenerates
the Glide candidate and its manifest. `npm run validate:flight` verifies hashes.
See assets/PROVENANCE.md for license and derivative details.

## Ownership and budgets

The viewer lends its renderer through `acquireExternalExperience`. Runtime owns
its Scene/Camera, model parse, terrain, scenery and Worker. It releases all owned
resources before returning the lease. ModelCache remains byte-only. Never move
`modelRoot` out of the staged presentation group without changing disposal.

The world generator has no Three.js or browser dependency. Worker replies carry
session, request, world, configuration, address and LOD identities. Installation
checks typed-array contracts and demand freshness. All queues, residency and
frame-time samples have fixed bounds. Diagnostics appear only in local DOM data
attributes; they are not network telemetry or accurate physical VRAM measurements.

## Rollback

Use ordinary `npm run build` with MUSEUM_FLIGHT unset. Verify the disabled build
with `scripts/flight/validate-build.mjs`. It removes the entry, flight module,
Worker and unapproved Glide data while retaining the existing exhibits and
comparison feature. Do not delete assets or weaken production checks to roll back.
