# Take Flight

A local-review candidate for Pteranodon, Tupandactylus and Rhamphorhynchus exploration. The normal production build
keeps this feature disabled until its art, animation, comfort and device reviews
are complete. Flight has no tracking, account, score or failure penalty; natural sound requires an explicit gesture.

## Run

```sh
npm run dev -- --host 0.0.0.0 --port 4286 --strictPort
```

Open `/zh-CN/?animal=pteranodon&experience=flight` or the English equivalent.
A direct link opens a stationary preview; flying requires pressing Start.
Arrow keys/WASD steer and change height. Space pauses when a semantic control
is not focused. Escape first closes settings, then exits. Touch users hold the
four direction buttons. Settings offer gentle movement, low/balanced scenery and three speeds.
Drag the scene to orbit above or below the animal; the wheel and distance slider
zoom continuously. A press outside settings closes the panel without consuming
the same gesture, so Resume and scene dragging remain available.
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

Cloud shadows and rain are included in the weather system below; the living coast
candidate adds opt-in same-species companions. Default production still excludes flight and all landscape candidates.

### W1 cloud and weather candidate

Weather defaults to clear and fixed. The existing 600-active-second daylight and
an independent 480-active-second weather schedule share the EnvironmentClock
admission and availability policy. Manual targets transition from the displayed
state; paused requests wait for active scenery. Restart keeps resolved weather,
phase and wetness while cancelling automatic weather and pending targets. Defaults
returns to clear/dry. Nothing persists across a new visit.

One linear 512² periodic density map supplies sky clouds, receiver-to-sun absorption
and water reflection. The cloud layer is at 2400 m, above the unchanged 1400 m flight
ceiling. Oblique sun queries use a world-space ray intersection without a local
shadow-cache clamp. Only direct PBR terms and solar rim/specular contributions are
attenuated; environment fill and haze have separate weather parameters. Rain uses
512/1536 stable GPU instances at low/balanced quality and three fixed world curtains
in a second draw. Zero-opacity first renders warm their programs. Wetness is a
history value (45-second wetting / 180-second drying reference rates), applied to
existing material weights and exposure; water geometry and collision do not change.

Review-only controls provide independent water/cloud/weather/sun freezes, explicit
static weather capture, a W1-off comparison, same-frame PBR PNG plus metadata, and
segmented real-time cycle recording. These controls and local evidence endpoints
are excluded from production. A missing cloud image marks simplified weather and
cannot block terrain preparation. The feature remains opt-in; physical-device
performance validation is separate from local tests and desktop visual review.

### Living coast candidate

The scenery panel groups light, weather and three independent controls, all off on entry: vegetation breeze,
brief same-species companions, and explicitly enabled natural sound. Restart
retains the two visual choices but requires a fresh sound gesture; Defaults clears
all three. The existing host update and admitted environment frame drive motion.
Wind and sound do not steer the player or change the 600/480-second schedules.

The four sound loops are original offline synthetic candidates, with no animal
calls, speech or music. One owned AudioContext mixes at most four sources; decoded
PCM is measured from actual AudioBuffers and capped at 12 MiB. Museum narration
has priority. Pause, visibility/focus loss and context failure mute the mix.

Near companions reuse the original Idle rig; the distant derivative retains the
original animation samples and borrows source textures. Tupandactylus and
Rhamphorhynchus use the shared articulated motion described below, including their
distant companions. Low quality admits one near and three distant actors;
balanced admits two and six. Per-species triangle counts are recorded in
`species/profiles.ts`. A quality downgrade allows the old cohort six active seconds to depart.
NPCs predict terrain along their integrated path. Companions cruise slightly faster than the player, with bounded acceleration, turning and predictive yielding; ordinary proximity does not trigger disappearance. These groups are
artistic scenes, not claims about Pteranodon social behaviour.

The panel has scenery, viewpoints and flight preferences. Observation notes are collapsed under viewpoints. The three prompts appear only when requested, pause scenery and mute
sound, and remain paused when closed. Postcards copy the completed host frame into
one temporary 2D canvas, then encode asynchronously. Output is at most 1280 pixels
on its longest side, with three local previews and explicit download. A persistent camera button captures the scene; the same canvas briefly floats into a thumbnail pocket while flight continues. Encoding and presentation share a bounded canvas lease. Reduced motion skips the travel animation, and resize, backgrounding or exit safely release it. Closing the gallery preserves flight; previews must be downloaded before leaving. Nothing is
uploaded. Candidate asset provenance and deterministic validators accompany the
source; subjective sound, movement and physical-device acceptance remain separate
from automated checks. Flight remains disabled in the normal build.

## Observation camera

The orbit target stays centered on the animal across rear, front and side views,
avoiding a pitch jump when passing through the rear position. Species profiles
set framing and clearance. Viewing `rear/front/left/right/custom` is separate
from continuous distance; `near/standard/wide` remain internal framing presets.
The screen represents the viewing position; flight does not import an avatar.
Front steering continues to use the animal's left and right.

`camera-rig.ts` owns requested and resolved angles. Presets use an accelerated,
bounded shortest arc (front candidate 165°, maximum 2.1 rad/s). The reduced-motion
path sweeps the same arc for safety before presenting its target frame. The
Runtime remains the only camera writer and uses the existing host lease/loop.
Paused camera presentation does not tick simulation or environment time.
`camera-safety.ts` separates swept near-plane clearance, the animation envelope,
companion separation and terrain line of sight. Unknown coverage retains the last
resolved angle; camera requests never steer the animal.

The original Idle envelope can be reproduced with
`node --import tsx scripts/flight/inspect-camera-envelope.mjs`. It samples 121
phases, preserves the source GLB, and checks four aspect ratios, three distances
and six directions. Pass a supported species ID to inspect another source model.
This audit measures the original source animation; it does not cover every
retargeted runtime pose or continuous zoom value, and is not GPU or comfort signoff.

Scene-only pointer capture is independent of flight button pointers. Presets,
click nudges and focused arrow keys offer alternatives to dragging. Releasing a
drag keeps its last displayed angle. Fixed viewpoints turn in place; returning
checks and restores the complete travel camera bookmark and remains paused.
Photos retain actual completed-frame camera metadata only in the local session.

Camera direction changes reprioritize the existing terrain window at a 15°
threshold. Current and requested view cones supplement, rather than replace,
the travel heading and missing-coverage priority. No window radius, renderer,
model, texture, reflection pass or source animation is added.

Local DEV review controls save six-view PBR comparisons, a camera-transition
video and an original-flap video through the existing private evidence endpoint.
`flightCamera=off` restores the rear-only interaction for comparison.
`flightCold=model` and `flightCold=materials` explicitly delay cold assembly and
exercise real WebGL context loss/restoration; these probes are DEV-only.
The default production build still excludes flight. G5 comfort/understanding,
physical-phone endurance and release approval remain separate human checks.

## Shared motion and flight lighting

The two originally morph-animated species receive a 16-joint runtime rig shared
with the museum viewer. Coordinated Pteranodon source motion is retargeted to
their proportions, with species cadence, head balance, restrained jaw opening and
tail response. Pteranodon keeps its original cruise and uses a periodic large
source wingbeat for sustained climb. Original model files remain unchanged;
`assets/PROVENANCE.md` records motion attribution and adaptations.

Small moving animals do not receive the coarse 384 m landscape shadow map,
which otherwise produces brightness pulses across their thin surfaces. The hero
still casts onto the landscape, and sunlight, sky fill, cloud attenuation and rim
lighting remain active. Fine self-shadows and occluder shadows on animals are
omitted; a dedicated close-range shadow solution is outside this candidate.

Initial preparation loads the model and materials concurrently with cancellation
and late-result disposal. The existing host renderer warms textures and shaders
before the first completed preview frame. Visible active-stage and total budgets
bound preparation; failures expose retry and exit. Slow-network prefetch respects
Save-Data and 2G connections. Flight remains an explicitly enabled build capability.
