# First development slice: implementation plan

Date: 2026-07-27

Status: approved for implementation

Scope: M0–M3 development vertical slice

## 1. Product outcome

Build a Chinese, browser-based 3D museum for a parent and preschool child to
explore together. The interface should feel calm, warm, playful, and easy to
understand without looking like a game or showing frightening content.

The first development slice proves the complete architecture with one
production-direction Stegosaurus. Do not expand to the full animal collection
until this slice has been reviewed.

## 2. Locked technical decisions

| Area | Decision |
| --- | --- |
| Application | Static B/S web application |
| Stack | React, TypeScript, Vite |
| 3D | Direct Three.js with `GLTFLoader` and `OrbitControls` |
| Backend | None |
| Local runtime | Node.js 20+ with dependency-free `server.mjs` |
| Hosted target | GitHub Pages later; do not deploy in this Goal |
| Language | Chinese UI and narration |
| Content | Typed TypeScript animal packages; no JSON Schema or CMS |
| Runtime AI | None |
| Narration | Reviewed static MP3 generated offline; never runtime TTS |
| First authoring voice | Qwen3-TTS 0.6B CustomVoice, Serena |
| Mobile | First-class responsive layout |
| Offline | Self-contained local runtime; no PWA or Service Worker |

Do not add accounts, analytics, cloud storage, a database, quizzes, badges,
combat, native apps, PWA installation, runtime TTS, or mandatory CDN assets.

## 3. Privacy boundary

This production repository must remain independently publishable.

Do not copy into Git history:

- private discussion or decision archives;
- `.wayfinder` or private assistant configuration under `.agents`; the
  explicitly reviewed project contributor skill at
  `.agents/skills/prehistoric-animal-onboarding/` is the sole public exception;
- rejected concepts, raw research, prototypes, or benchmark environments;
- original model archives or full-resolution asset masters;
- assets whose redistribution rights have not been confirmed.

Private planning and development material may remain in this local project
under `.wayfinder/`, the existing internal `docs/` subdirectories,
`assets/candidates/`, `prototypes/`, `spikes/`, and `tools/`. These directories
are available as implementation context but are not part of the publishable
product and must remain ignored unless a specific reviewed output is
deliberately promoted into a tracked production path.

The ignored `.handoff/` directory contains narrowly selected local inputs. It
may be read during implementation. Only reviewed, optimized runtime outputs
and their attribution records may be copied into tracked production paths.

Do not create a GitHub repository, remote, pull request, deployment, or release
as part of this Goal.

## 4. First-slice experience

The normal page contains:

- a large, central Stegosaurus stage;
- Chinese animal name and one short child-facing introduction;
- a compact “听它的介绍” / “暂停介绍” control;
- clear previous and next controls;
- a centered thumbnail rail whose navigation model can later grow into an
  endless loop;
- icon controls for reset and model-only focus, with Chinese accessible names
  and tooltips;
- a bottom “给家长的资料” drawer that temporarily replaces the animal rail.

The default desktop model should fill the available safe area without
requiring wheel zoom. Phone portrait and landscape are first-class layouts.

Model-only focus is an in-page full-viewport mode, not the browser Fullscreen
API. Entering it restores the initial camera and animation state, then starts
gentle auto-rotation. Only the model and a clear exit control remain. Escape
exits focus mode before it closes any other layer.

## 5. Visual direction

- Friendly semi-realism in a refined picture-book world.
- Use the approved lush prehistoric forest direction around a clear central
  model safe area.
- Use dedicated portrait and landscape images instead of applying a runtime
  tint, colour wash, CSS filter, or grey overlay.
- Future animal switches crossfade complete scene assets over roughly
  420–520 ms.
- Use a broad ambient light, a soft camera-relative fill, and a weak scene
  light so the screen-facing side remains readable through 360 degrees.
- Land animals use a soft contact shadow.
- Initial framing fits the complete silhouette with safe margins.

Use one mature outline icon set, preferably Lucide. Primary touch targets are
at least 48 × 48 CSS pixels. Icon-only controls require Chinese accessible
names and visible hover/focus tooltips.

## 6. Interaction contract

The model begins gentle auto-rotation. Pointer or touch drag rotates it.
Wheel or pinch zooms within safe limits. Interaction pauses auto-rotation and
it resumes after about four idle seconds. Reset deterministically restores the
approved camera, model orientation, and animation state.

Narration never auto-plays. A committed animal change stops and resets the old
audio. If narration is missing or undecodable, show “介绍准备中” without
blocking the model or content. Do not permanently display the narration script
in the normal child view.

Animal switching must keep two identities:

- `readyAnimalId`: the animal currently committed to the page;
- `requestedAnimalId`: the latest user request.

Every request gets a monotonically increasing token. Keep the ready model,
background, content, and narration active while another animal loads. Show a
playful loader only in the requested card; reveal “正在请它出来…” after 300 ms.
Only the latest successful request may commit the complete presentation.
Stale results are cancelled where practical or ignored and disposed. Failure
keeps the ready animal usable and offers a friendly retry.

The release slice publishes only Stegosaurus. Use deterministic test doubles
or development-only draft fixtures for at least two other IDs when testing
rapid selection, stale results, and failure. Do not show incomplete animals in
the production catalog.

## 7. Content architecture

An animal is a self-contained typed package:

```text
content/
  animals/
    stegosaurus/
      animal.ts
      content.zh-CN.ts
      provenance.ts
      model/model.glb
      images/poster.webp
      images/thumbnail.webp
      backgrounds/landscape.webp
      backgrounds/portrait.webp
      audio/narration.zh-CN.mp3
      provenance/LICENSES/
  collections/
    main.ts
  types.ts
```

`animal.ts` exports declarative data using `satisfies AnimalPackage`. It has no
side effects, timers, network requests, or animal-specific rendering code.
Use Vite static asset imports. Collection order is explicit and loops
endlessly; it never depends on filesystem order.

Required typed responsibilities include:

- stable lowercase ASCII ID;
- `draft` or `published` status;
- animal kind and habitat;
- locale-keyed Chinese content;
- runtime asset paths;
- framing, shadow, and animation presentation data;
- provenance and redistribution evidence.

The production catalog discovers packages without components importing
individual animals. Draft packages are excluded from production.

## 8. Three.js ownership

Create one long-lived viewer controller. Three.js owns the renderer, scene,
camera, lights, controls, animation mixer, frame loop, model lifetime, and GPU
resource disposal. React owns application selection, loading/error state,
visible content, drawers, focus mode, responsive UI, and URL state.

The viewer must provide:

- resize handling and a device-pixel-ratio cap;
- WebGL/context failure handling;
- GLB loading away from the committed presentation;
- full-bounds camera fitting for desktop and phone safe areas;
- explicit `Idle` clip playback when available;
- gentle rotation, bounded zoom, reset, and reduced-motion behavior;
- cleanup of geometries, materials, textures, mixers, and listeners.

Do not store Three.js scenes, mixers, or frame-by-frame values in React state.

## 9. Local handoff assets

The ignored directory `.handoff/stegosaurus/` contains:

- `model.glb`: normalized animated Stegosaurus engineering candidate;
- portrait and landscape PNG background candidates;
- source credits and provenance evidence.

The model is a modified CC BY 4.0 asset by Ferocious Industries. Preserve
attribution and modifications in the tracked package provenance and generated
third-party notices.

Before committing runtime assets:

- validate the GLB and its `Idle` clip;
- optimize only when quality remains acceptable;
- convert backgrounds to WebP within the agreed content budget;
- derive a clean poster and thumbnail from the reviewed model presentation;
- record source, license, author, changes, and output hashes.

There is no approved Stegosaurus Serena narration in `.handoff`. Implement the
audio controller and missing-audio path, but do not invent, substitute, or
commit a final narration clip. Final Serena generation, rights review, and
adult listening approval are a separate human asset gate.

## 10. Milestones

### M0 — Production foundation

- Scaffold React, TypeScript, and Vite in this repository.
- Pin Node.js 20+ and commit the npm lockfile.
- Support relative production asset paths and a simulated nested Pages base.
- Add lint, typecheck, unit-test, content-validation, and build scripts.
- Add dependency-free `server.mjs`.

Gate: an empty application shell installs cleanly, builds, runs through
`server.mjs`, and loads below a nested base path.

### M1 — Typed content

- Define the package, content, provenance, presentation, animation, and
  collection types.
- Add build-time discovery and draft/published filtering.
- Create the canonical Stegosaurus package.
- Validate required paths, file presence, license metadata, asset sizes, and
  collection consistency.
- Generate credits data and `THIRD_PARTY_NOTICES.md` from typed provenance.

Gate: a missing or renamed required asset fails compilation or validation, and
an invalid published package cannot enter the production catalog.

### M2 — Viewer

- Implement the reusable long-lived viewer controller.
- Add camera fit, lighting, controls, animation, grounding, context failure,
  and complete disposal.
- Respect reduced motion.

Gate: Stegosaurus is fully visible and legible through 360 degrees, reset is
deterministic, and repeated load/dispose tests do not show unbounded retained
resources.

### M3 — Development vertical slice

- Build the responsive storybook interface described above.
- Add the rail, previous/next, narration control, parent drawer, focus mode,
  loading, error, retry, poster fallback, and keyboard behavior.
- Implement the requested/ready latest-request-wins state.
- Add unit, component, and end-to-end coverage for normal, slow, stale, failed,
  and WebGL-unavailable paths.

Gate: automated checks and representative viewport tests pass. Human visual,
phone, child-use, final narration, and public-release approval remain explicit
follow-up gates and must not be marked complete by the Goal.

## 11. Verification

The Goal must finish with these commands passing:

```sh
npm ci
npm run lint
npm run typecheck
npm test -- --run
npm run validate:content
npm run build
npm run test:e2e
```

Check at least:

- 360 × 640 phone portrait;
- 390 × 844 phone portrait;
- 844 × 390 phone landscape;
- 768 × 1024 tablet portrait;
- 1440 × 900 desktop.

At every viewport there is no unintended horizontal page overflow, the full
default silhouette fits, primary controls do not cover the model, the rail is
reachable, and focus mode shows only the model and exit control.

## 12. Non-goals and stopping condition

Do not:

- add the other seven production animal packages;
- mass-produce models, backgrounds, or narration;
- solve Qwen/Serena licensing or run a TTS benchmark;
- create GitHub issues, remotes, pushes, Pages deployment, or release ZIPs;
- perform the owner-phone Tailscale session;
- treat human approval as an automated completion claim.

Stop when M0–M3 implementation and automated verification are complete,
tracked files have been reviewed for repository-scope compliance, and the
remaining human/asset gates are listed clearly.
