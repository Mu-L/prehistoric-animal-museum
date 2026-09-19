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
four direction buttons. Settings offer gentle movement, low/balanced scenery, three speeds and camera distances.
Starting place and height are applied only with an explicit restart. Touch inputs
combine independently by pointer ID. Assisted cruise follows a short coast-to-valley
route; any direction input immediately returns control to the visitor.

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

## Visual diagnosis in development

The development-only Visual diagnostics panel isolates legacy tiling, detail,
strata, gray geometry, normals, patch boundaries, frozen LOD, props, water,
sea edges, shadowing and sky colour. Fixed capture anchors and three actual world
seeds can be selected; metadata records camera, daylight, viewport and browser/GPU. It is absent from
the candidate production UI. Compare the same stationary view, seed, DPR and
quality before interpreting artifacts. Keep real-device, art and motion review
separate from numeric regression results.

## Static landscape candidate

WorldConfig is shared by collision, scattering and workers. The default seed keeps
the original height recipe; three seeds have distinct deterministic output.
Generation tiles remain 512m. The closest four fine tiles have 128m render groups
and spatially staggered morphs; all LODs share true 8m perimeter samples. Displayed
height and shadow depth use the same morph weights. Full tile installs are still
atomic: the 2ms CPU allocation is a measured soft budget, not a hard GPU guarantee.

Props use 128m ownership cells and shared instance pools. Near/mid meshes and far
cutouts share a source and physical dimensions. Two bounded cliff landmarks have
matching collision envelopes. No camera-following landmark or density-dependent
collision is used. Asset approvals remain pending.

One linear-colour environment frame drives sun, sky, fog and water. The finite near
water blends with an analytic directional far ocean; six wind-aligned bands use
bounded world phases and derivative filtering. Packed terrain depth avoids float
texture filtering requirements; full fields publish atomically after budgeted
sampling. This introduces a bounded refresh delay during terrain morphs.

The daylight control defaults to a fixed time. Explicit automatic daylight continues
from the current progress at a constant rate over 0.08–0.94: a complete day takes
600 admitted environment seconds. Frames admit at most 4/60 seconds; very low frame
rates take longer in wall time. Sunset holds until an explicit replay from morning.
Manual sunlight controls switch back to fixed without resetting waves or travel.

The existing host loop ticks environment time before sampling one environment frame.
Uniforms use each frame's exact progress; automatic UI progress updates at most about
four times per second. There is no separate sun timer or animation loop. Visibility,
focus, graphics context and fatal errors gate preparation and presentation together.
Observation preparation has a 20-second active budget that excludes unavailable time.
Restoring availability resumes necessary preparation, with scenery and travel paused.
A fatal error stops the loop, invalidates the observation generation and exposes retry
and museum exit. Returning to travel requires explicit resume; Restart preserves the
selected time in a new fixed-mode session, while Defaults restores the original time.

Cloud shadows, rain and wildlife are later stages. Default production still excludes
flight and all landscape candidates.
