# M0–M7 development progress

- Date: 2026-07-27
- M0–M3 branch: `feat/stegosaurus-vertical-slice`
- M4 branch: `codex/m4-collection-review`
- UI/UX polish branch: `codex/ui-ux-polish`
- Research-comparison addendum: 2026-07-28
- Model-delivery policy addendum: 2026-07-28
- Nine-animal production and Pages authorization: 2026-07-28
- Per-exhibit scene differentiation addendum: 2026-07-29
- Twelve-animal production promotion: 2026-07-31
- Fifteen-animal automated onboarding promotion: 2026-07-31
- Eighteen-animal flight expansion and habitat-balanced re-curation: 2026-08-01
- Scope: production collection and public Pages candidate

## Status

| Milestone | Status | Delivered |
| --- | --- | --- |
| M0 — production foundation | Complete | React, TypeScript, Vite, Node 20.19+ pin, official-registry lockfile, lint/typecheck/unit/content/build/E2E scripts, relative asset URLs, nested-base verification, and dependency-free `server.mjs` |
| M1 — typed content | Complete | `satisfies`-checked animal packages, explicit collection order, draft/published filtering, Stegosaurus package, asset/path/hash/size/license/GLB validation, generated application credits, and generated notices |
| M2 — Three.js viewer | Complete | Direct Three.js controller, GLTF staging, camera fit, deterministic head-left reset/animation pose, `Idle`, orbit/zoom/reset, camera-relative key/fill lighting, corrected grayscale contact shadow, reduced motion, two-phase hidden-camera model transition, WebGL/context failure recovery, and complete resource disposal |
| M3 — development vertical slice | Complete | Responsive picture-book story view, locally bundled Chinese font pairing, compact animal dock, adjacent narration/parent actions, minimum-duration initial-stage loader, parent drawer and transcript, in-page focus mode with tap-to-return, failure/retry-only poster path, and atomic latest-request-wins presentation commits |
| M4 — first four-animal local review | Complete and promoted | Stegosaurus, Pachycephalosaurus, ichthyosaur group, and Pteranodon passed owner review and now use tracked production packages |
| M4B — second local review wave | Complete and promoted | Tyrannosaurus rex and Triceratops static CC BY replacements plus the body-only CC BY Apatosaurus light-restyle/material v2 are published; Parasaurolophus was withdrawn and removed from the product decision |
| M4R — two additional candidates | Complete and promoted | Gigantoraptor and woolly mammoth models, content, scenes, and narrations were accepted and promoted as the eighth and ninth first-release animals |
| M4C — three-animal collection expansion | Complete and promoted | Maiasaura, the plesiosaur-group exhibit, and Megalodon passed model, animation, responsive composition, narration, parent-content, and owner review |
| M5 — twelve-animal production collection | Complete | Twelve typed published packages, tracked runtime assets, public provenance, reviewed narration, generated notices, dispersed marine exhibits, vertical phone-landscape navigation, and split production JavaScript chunks |
| M6 — atomic animal onboarding | Complete and promoted | Deterministic QA, Blender Idle and conditional mouth templates, pinned Qwen Serena audio, five-viewport evidence, explicit approval recording, generated production packages, rollback-safe batch promotion, and three newly published animals |
| M7 — flight expansion and collection re-curation | Complete and promoted | Rhamphorhynchus, Tupandactylus, and Meganeura production packages, owner-approved motion and narration, exact promotion hashes, and an eighteen-animal loop with aerial and aquatic exhibits distributed among terrestrial animals |

All eighteen production packages are `published`. The slow, fast, and retry
animals remain E2E-only fixtures. Parasaurolophus is not part of the release;
its rejected local research material remains ignored.

The mammoth package uses the upstream SDPM Esare CC BY 4.0 model rather than
the submitted kenchoo CC BY-NC-SA derivative. Mammoth was regenerated with
“身披长毛的猛犸象”, and the owner confirmed `cháng máo`. Gigantoraptor and
mammoth are now normal first-release cards rather than research comparisons.
All eighteen narrations are click-to-play and owner approved.

The 2026-07-31 promotion adds the exact reviewed Maiasaura, plesiosaur-group,
and Megalodon runtime assets to tracked production packages. Maiasaura uses
animated skinned bounds and a foot-group contact shadow; the plesiosaur has
independent four-flipper and neck motion; Megalodon uses a tail-driven swim
with a stable head. All three include dedicated responsive backgrounds,
derived poster/thumbnail pairs, Serena MP3s, complete public provenance, and
owner-approved parent facts.

The automated onboarding promotion initially added Sauropelta, Dilophosaurus,
and Mosasaurus at collection indices 12–14. The owner explicitly approved all
human-only gates on 2026-07-31. A single batch transaction verified the three
manifests and 28,753,746 bytes of runtime/generated package inputs, staged and
installed all three packages, exposed their `animal.ts` entries last, updated
the collection once, regenerated credits/notices, and passed content
validation. A second real invocation reported all three targets `identical`
and installed zero files, providing an idempotency regression. At that M6
milestone, the original twelve-animal ordered prefix and
Maiasaura/Plesiosaurus/Megalodon golden hashes remained unchanged.

The 2026-08-01 flight batch promoted Rhamphorhynchus, Tupandactylus, and
Meganeura from the exact owner-approved review hashes. The atomic transaction
validated 17,037,755 bytes of runtime/generated inputs, installed all three
complete packages, updated the collection once, regenerated credits and public
notices, and passed content validation. Rhamphorhynchus carries its revised
large-stroke flight Idle; Tupandactylus carries the reviewed lower-jaw cycle;
Meganeura uses the accepted replacement model and fast flying-insect Idle.
After promotion, the owner explicitly requested a full collection re-curation.
The final zero-based aerial positions are 1, 5, 10, and 15, while aquatic
positions are 3, 8, 12, and 17; the ten terrestrial exhibits fill the intervals
without placing the three new animals together at the end.

Official Qwen3-TTS sources identify the code and 0.6B CustomVoice checkpoint
as Apache-2.0 and explicitly list Serena among nine open-sourced timbres. The
owner approved public MP3 distribution. The retained residual risk is that
Qwen does not separately publish Serena's underlying voice/personality-rights
chain; public notices disclose AI synthesis and do not imply endorsement.

The encoded GLB optimization target/hard ceiling is now 12/20 MiB instead of
8/12 MiB. The dependent complete-package target/ceiling moves from 10/15 MiB
to 14/23 MiB so the GLB policy is usable; all per-image/audio, geometry,
draw-call, texture dimension/decoded-memory, bone, collection, and real-phone
gates remain unchanged. Production and review packages expose exact typed
`assets.modelBytes` values. Narrow coarse-pointer layouts show a locally
remembered first-visit data/Wi-Fi reminder, then only show a non-blocking size
toast when selecting a GLB strictly above 8 MiB. The behavior
uses no runtime network probing and honors reduced motion.

The current UI/UX pass also removes the normal-switch poster flash and the
oversized outgoing-model frame. The old model now fades completely under its
own camera before the shared camera is fitted to the new animal; the new model
then fades in from a fully framed pose. Desktop information material is
smaller and more translucent, mobile copy wraps in full, phone stage controls
form one shallow toolbar, narration shows a four-bar playing waveform, and the
parent drawer exposes local review notes only in explicit review mode.
Phone landscape now places animal switching in a scrollable right-side
vertical rail with complete cards and reserves that width in the model's
composition-safe frame.

The 2026-07-29 scene pass replaces the remaining shared land art with separate
landscape and portrait compositions for Pteranodon, Pachycephalosaurus,
Tyrannosaurus rex, Apatosaurus, Gigantoraptor, and the woolly mammoth.
The ichthyosaur backgrounds remain byte-for-byte unchanged. All eighteen
exhibits now have distinct background pairs. The six dependent fallback
posters and collection thumbnails were recaptured from the real WebGL
presentation so they no longer show the retired shared scene.

A follow-up horizon pass uses the actual centred model placement as the
composition reference. Tyrannosaurus rex, Triceratops, and Apatosaurus now
bring continuous terrain into the middle staging band; Stegosaurus receives a
smaller correction that preserves its accepted forest composition. Both
orientations and the four dependent poster/thumbnail pairs were recaptured and
reviewed at 1440 × 900 and 768 × 1600, removing the earlier impression that
the feet floated above a low distant horizon.

A second device-screenshot grounding pass adds bounded per-orientation
vertical composition offsets and per-animal contact-shadow tuning.
Stegosaurus, Pachycephalosaurus, and Apatosaurus now sit lower against their
actual ground planes instead of relying on the background horizon alone.
The Tyrannosaurus model remains unchanged; its central floodplain ground was
brightened and cooled toward pale gray-taupe, while the mid-forest was
desaturated toward sage and misty blue-green, giving the dark-brown skin a
clearer silhouette in both orientations. All four dependent fallback posters
and thumbnails were recaptured from the corrected runtime presentation.

The typed `atmosphere` field dispatches five bounded, decorative CSS layers:
air (cloud wisps, sun flare, streamlines, and two distant silhouettes), ice
(nine crystals, cold light, and low haze), forest (two sunbeams, twelve light
motes, and four leaves), plains (ten seeds and two low air bands), and the
existing underwater currents and bubbles. Reduced-motion mode removes every
travelling particle and freezes the broad light/haze layers. Forest and
Morrison compositions use tall conifers and tree ferns to communicate plant
scale, while the arid Gobi and Pleistocene steppe remain appropriately open;
the scene pass does not treat elevated atmospheric oxygen as a universal
condition across all prehistoric periods.

Addendum verification:

| Command | Result |
| --- | --- |
| `npm run lint` | Passed with zero warnings |
| `npm run typecheck` | Passed |
| `npm test -- --run` | Passed: 14 files, 112 tests |
| `npm run validate:content` | Passed: 12 packages, 0 errors, the existing reviewed Pteranodon bone-count warning, 0 manual gates |
| `npm run build` | Passed: 12 production packages, 185 artifacts, 12 GLBs, 12 MP3s, 0 source maps, and 0 private review markers |
| `npm run test:e2e` | Passed: 24 Chromium tests across atmosphere switching, reduced motion, and all required responsive viewports |

M6 automated-onboarding verification:

| Command / evidence | Result |
| --- | --- |
| Approved `promote-batch --dry-run` | Passed code 0 for Sauropelta, Dilophosaurus, and Mosasaurus; 28,753,746 bytes and every tracked target listed before installation |
| Real `promote-batch --collection main` | Passed; three complete staged packages installed, `animal.ts` exposed last, collection updated once, credits/notices regenerated, content validated |
| Idempotent real rerun | Passed; all three targets reported `identical`, zero packages installed |
| `promote verify` | Passed independently for all three package manifests and collection indices |
| `npm run lint` / `npm run typecheck` | Passed with zero lint warnings and zero type errors |
| `npm test -- --run` | Passed: 15 files, 129 tests |
| onboarding tool tests | Passed: 15 TypeScript tests and five Blender motion profiles |
| `npm run validate:content` | Passed: 15 packages, 0 errors, only the existing reviewed Pteranodon optimization warning |
| `npm run test:review` | Passed: one 15-animal Chromium flow; narration remains user-triggered |
| `npm run build` | Passed: 203 production artifacts, 15 GLBs, 15 MP3s, 0 source maps, 0 private-review markers |
| `npm run test:e2e` | Passed: 24 Chromium tests |
| baseline / golden regression (M6 snapshot) | Passed: production directories equal the 15-animal collection, original 12-animal prefix preserved, three golden hashes unchanged |

M7 flight-expansion and collection re-curation verification:

| Command / evidence | Result |
| --- | --- |
| Approved `promote-batch --dry-run` | Passed code 0 for Rhamphorhynchus, Tupandactylus, and Meganeura; 17,037,755 bytes and every tracked target listed before installation |
| Real `promote-batch --collection main` | Passed atomically; three complete staged packages installed, `animal.ts` exposed last, collection updated once, credits/notices regenerated, and content validated |
| `promote verify` | Passed independently for all three final manifests, approvals, hashes, and re-curated collection positions |
| Habitat-order regression | Passed: aerial indices 1/5/10/15, aquatic indices 3/8/12/17, and all 18 published IDs in the explicit cyclic order |
| `npm run lint` / `npm run typecheck` | Passed with zero lint warnings and zero type errors |
| `npm test -- --run` | Passed: 15 files, 129 tests |
| onboarding tool tests | Passed: 15 TypeScript tests and six Blender motion profiles |
| `npm run validate:content` | Passed: 18 packages, 0 errors, 0 manual gates, and only the existing reviewed Pteranodon optimization warning |
| `npm run validate:review` | Passed: 108 exact routes, 119,078,201 bytes, 0 missing |
| `npm run test:review` | Passed: one 18-animal Chromium flow; narration remains user-triggered |
| `npm run build` | Passed: 221 production artifacts, 18 GLBs, 18 MP3s, 0 source maps, and 0 private-review markers |
| `npm run test:e2e` | Passed: 24 Chromium tests |
| baseline / golden regression | Passed: production directories equal the 18-animal collection, all immutable baseline animals remain present, and three golden hashes remain unchanged |

## Reproducible verification

Verification runs from the repository root with Node `v26.5.0` and npm
`11.17.0`; `.nvmrc` and `package.json` define the supported floor as Node
20.19.0. The historical table below records the 2026-07-28 nine-animal
production state; the 2026-07-31 twelve-animal release verification is recorded
in the addendum table above.

| Command | Result |
| --- | --- |
| `npm ci` | Passed; 256 packages installed from the clean lockfile |
| `npm run lint` | Passed with zero warnings |
| `npm run typecheck` | Passed |
| `npm test -- --run` | Passed: 11 files, 95 tests |
| `npm run validate:content` | Passed: 9 packages, 0 errors, 1 reviewed optimization warning (Pteranodon has 125 bones against the 120 target but remains below the 200 ceiling), 0 manual gates |
| `npm run validate:review` | Passed: 54 exact routes, 91,378,677 bytes, 0 missing; GLB self-containment, image dimensions/signatures, MP3 headers and review budgets checked |
| `npm run test:review` | Passed: 1 nine-animal Chromium review flow, including user-triggered audio for every animal, switch/reset behavior, parent review facts, ranged MP3 responses, and direct-private-path denial |
| `vite build --mode review` | Rejected by design before bundling; local review is serve-only |
| `npm run build` | Passed; relative production bundle built successfully |
| `npm run test:e2e` | Passed: 22 Chromium tests, including first-visit data/Wi-Fi and large-model-size notices |
| `npm run validate:production-boundary` | Passed: 9 GLBs, 9 reviewed MP3s, 0 source maps, and 0 private review markers |
| `node server.mjs dist --port 4187 --base /prehistoric-animal-museum/` | Started successfully; nested root returned HTTP 200 and relative JS/CSS URLs |
| Production JavaScript split | Passed; app, React, icons, and Three.js are split, with the largest minified JavaScript chunk below 350 kB |

Playwright covers the normal path, the distinct first-animal stage loader,
300 ms delayed loading copy, uncancellable stale result, decoded-background
crossfade cleanup with stable outgoing DOM identity, the poster-free normal
switch, failed selection, retry, initial model failure, WebGL unavailable,
reduced-motion startup and recovery, focus-mode tap/drag separation and
approximately four-second idle recovery, narration waveform playback, drawer
scroll cue/review-note isolation, orientation change, navigation tooltips,
tablet narration-popover bounds, and nested-base paths.
The full-viewport renderer also observes its separate composition-safe frame,
so story-copy or font-driven layout changes trigger a fresh camera fit even
when the browser viewport itself has not resized.
The initial failure case returns a real HTTP 503 for the first GLB request,
then retries the real GLB. The WebGL-heavy suite is capped at three local
workers (two in CI) to avoid browser context exhaustion. Component/unit tests
additionally cover exact initial-loading timing, context loss during an
in-flight model load, viewer remount with a continuing monotonic token,
stale-value disposal, audio races, corner-projected camera fitting at every
required stage aspect ratio, deterministic animation reset, camera-relative
lighting geometry across eight viewing angles, shared GPU resources, skeleton
disposal, decoded image-source closure, and 24 repeated resource-tree disposal
cycles. This is deterministic lifecycle evidence, not a browser
memory-profiler claim.

The five required CSS viewports passed automated DOM/layout checks for
overflow, minimum 48 px targets, stage bounds, accessible/scrollable rail,
fully opaque in-bounds tooltips, inert drawer background, focus-only controls
(including a hidden gesture hint), and orientation preservation.
Separately, camera-fit unit tests project all eight corners of a deep,
measured-proportion Stegosaurus bounds box and keep them inside the configured
safe fraction at the five observed stage aspect ratios:

| Viewport | Result |
| --- | --- |
| 360 × 640 | Layout/E2E passed; compact retry state remained legible; projected bounds inside safe area |
| 390 × 844 | Layout/E2E passed; complete child copy wraps beside the compact title; projected bounds inside safe area |
| 844 × 390 | Layout/E2E passed; both adjacent action targets remain at least 48 px; projected bounds inside safe area |
| 768 × 1024 | Layout/E2E passed; tablet story bar and compact dock stay clear of the model; projected bounds inside safe area |
| 1440 × 900 | Layout/E2E passed; model-first desktop composition and floating dock stay clear of the model; projected bounds inside safe area |

The revised build was visually inspected at all five required sizes. The
dedicated portrait and landscape compositions rendered as intended; the
complete animal remained inside its stage; the phone story card used its
former empty top-right area for compact metadata and displayed the complete
observation prompt; the reset/focus controls formed one shallow horizontal
toolbar instead of occupying a vertical strip of model space; and the
selected/focused rail card scrolled into view without cancelling a pointer
click. The drawer trapped focus and made story, stage, and rail inert, and
focus mode exposed only the canvas, return hint, and exit control. Desktop
focus-mode captures also checked broadside, front three-quarter, and rear
three-quarter views: the screen-facing surfaces remained readable throughout
rotation. These are developer visual checks, not the outstanding human product
approval.

## Key implementation decisions

- Vite uses `base: './'`, so hashed assets work at both the root and a future
  GitHub Pages-style subpath without deploying in this Goal.
- The production catalog discovers typed animal modules and filters drafts.
  It does not import animal-specific rendering components.
- Deterministic fixture IDs, copy, facts, and failures are removed from the
  production bundle; only the dedicated E2E-mode build contains them.
- React owns visible application state. A long-lived `ViewerController` owns
  Three.js scene, camera, renderer, controls, mixers, frame loop, staging, and
  disposal; no per-frame or Three.js object is stored in React state.
- Each non-deduplicated animal request receives a globally continuing token.
  `readyAnimalId` remains committed while `requestedAnimalId` loads. Only the
  newest result can synchronously commit model, text, backgrounds, and audio;
  stale staged scenes are disposed.
- A committed scene change keeps the existing background node fully visible
  until the incoming orientation-specific image has loaded and decoded, then
  crossfades it for 480–520 ms. The outgoing node keeps its stable animal key,
  so changing its phase does not restart it from an unpainted image. Reduced
  motion shortens the transition to 80 ms and disables auto-rotation; returning
  to normal motion restores it.
- Model replacement has two phases: the old model fades completely under its
  original camera, both models stay hidden while the camera fits the new
  bounds, and only then does the already framed new model fade in. This avoids
  any one-frame giant or hard rectangular model viewport during a switch.
- The foreground follows the model-first picture-book direction: a light
  translucent story card, compact museum wordmark, Stegosaurus ochre accent,
  local ZCOOL KuaiLe/Noto Sans SC font pairing, and a compact floating animal
  dock. The parent action sits beside narration because both lead to bottom
  context rather than collection navigation.
- Initial loading uses a stage-level fossil/footprint treatment immediately,
  remains visible for at least 900 ms in normal motion (180 ms for reduced
  motion), and reveals `正在请第一位朋友出来……` after exactly 300 ms. During
  that interval the current scene and the next animal's selected background
  and poster are warmed. Later animal changes keep their loading state local
  to the requested card. Portrait phones also receive a 760 ms arrival
  greeting unless reduced motion is requested.
- The initial live pose, reset pose, focus-mode pose, fallback poster, and
  collection thumbnail now all face head-left. The thumbnail uses a close
  head-and-plates crop rather than the earlier blurred letterbox.
- The URL replaces its `animal` query value only after a successful commit,
  while retaining unrelated query parameters. Keyboard-focused cards defer
  their centering scroll until after the focus event so pointer clicks are not
  cancelled by layout movement.
- WebGL context loss aborts the coordinator immediately. Retry remounts the
  renderer/controller and reloads the still-active animal, preventing an
  in-flight result from reviving a stopped canvas.
- GPU cleanup deduplicates and releases geometry, materials, textures,
  skeletons, renderer lists, mixers, listeners, loops, and GLTF ImageBitmap
  sources.
- The parent drawer is a modal portal with focus trapping/restoration. The
  story, complete stage, and navigation become inert behind it. Formal mode
  hides local review/debug notes; review mode keeps them collapsed by default.
  A bottom fade and dynamic scroll cue disappear when the reader reaches the
  end. Model canvas labels follow the committed animal.
- Narration never auto-plays. Production still exposes the rights-gated
  `介绍准备中` state. Active playback adds a four-bar sound waveform. The local
  review catalog substitutes exact ignored MP3 URLs, so the owner can play,
  pause, and reset each candidate in context without moving it into Git history
  or the production bundle.
- Local review assets are served through a read-only 60-route allowlist.
  Vite directly denies ignored handoff, candidate, prototype, research,
  specification, spike, and tool paths, including `/@fs/` access, so exposing
  the review server for a later phone check does not expose the rest of the
  local project material. Review mode is serve-only and cannot be bundled.
- M4 adds optional per-animal tone-mapping exposure and camera-light scaling.
  Defaults preserve the accepted Stegosaurus appearance; the static
  Pteranodon candidate receives a bounded front-light boost while still using
  the camera-relative all-angle light rig.

## Runtime assets and licensing

| Runtime asset | Bytes | SHA-256 | Rights record |
| --- | ---: | --- | --- |
| `model/model.glb` | 6,819,152 | `514e673525173134279604efe592e9c5079e916e8e2be0d729701bbb650adae1` | “PBR Stegasaurus (Animated)” by Ferocious Industries, CC BY 4.0; modifications recorded |
| `backgrounds/landscape.webp` | 332,594 | `b5997c428486eb477b31adc42f69259b91d842d3897b6383861af1f58bb5f80a` | Project-specific OpenAI ImageGen output; prompt/source record retained |
| `backgrounds/portrait.webp` | 318,736 | `8802ce0aad6090541df3d962ffa74c15f2095074ba76d28e2f63719ad701a1c2` | Separate project-specific OpenAI ImageGen composition; prompt/source record retained |
| `images/poster.webp` | 114,254 | `6357c8dfbe97f7768474f096028e9ce1163965e97785bc4a623aeeb4f6ebf2db` | Derived from the attributed model and project background; mirrored to match the revised head-left presentation |
| `images/thumbnail.webp` | 22,430 | `306b93b614891034bfd0645f399840197c97e08d47411530c651353d1f8d2f65` | Close readable crop derived from the revised poster |

The optimized GLB has 19,839 triangles, three draw meshes, two materials, six
embedded 1K textures, 53 joints, and exactly one 1.25-second animation named
`Idle`. Validation reports zero normalized errors. Full source, license,
modification, hashes, and generated-image evidence live beside the animal
package. `THIRD_PARTY_NOTICES.md` is generated from those typed records. The
model attribution and license links are also visible in the parent drawer.
ZCOOL KuaiLe and Noto Sans SC are bundled from Fontsource under the SIL Open
Font License 1.1; their notices and the tracked OFL text are included. React,
React DOM, Scheduler, Three.js, and Lucide React also have versioned notices
and tracked license texts. The production build copies the generated notice
and all linked runtime license files into `dist/`.

An ignored local Serena candidate was generated at
`.handoff/stegosaurus/audio-candidates/stegosaurus-serena-preview.mp3`.
It is deterministic Qwen3-TTS 0.6B CustomVoice output using the two-sentence
Stegosaurus script. The MP3 is 48 kHz mono, 80 kbps, 8.505 seconds,
-18.47 LUFS, and -1.72 dBTP. The owner has completed the listen-through and
accepted the complete 8.51-second reading as a duration exception. It is wired
into the tracked production package with its public rights record.

M4 generated three additional deterministic Serena review MP3s under the
ignored `.handoff/collection-review/audio/` directory. Two byte-identical raw
runs, a normalized 48 kHz mono master, review MP3, per-item metrics, exact
script hash, and a shared manifest are retained locally:

| Animal | Duration | Integrated loudness | True peak | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| 肿头龙 | 10.073 s | -18.53 LUFS | -1.80 dBTP | 101,325 | `dbf97da7d938cf41f28e060f3d7cffe898e0be2ffd3883af1211a4b878171de2` |
| 鱼龙类 | 9.383625 s | -18.56 LUFS | -1.28 dBTP | 94,365 | `5ab57bd9221ab75280f8020b5c01353447a345e1428d99b455bfdc71492a02a1` |
| 无齿翼龙 | 9.470583 s | -18.55 LUFS | -1.29 dBTP | 95,325 | `e8fa6768126c25200fb3f1eb5aefb708e4fbf6b8636eacb1acc3a47425499d74` |

All three decode without errors and exactly match their typed two-sentence
scripts. The owner has now accepted these complete readings in context for
public use. The reviewed MP3s are tracked production assets.

M4B generated four more deterministic Serena review MP3s with the same
retained two-run, normalized-master, MP3, metrics, and script-hash evidence:

| Animal | Duration | Integrated loudness | True peak | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| 霸王龙 | 10.607167 s | -18.88 LUFS | -1.44 dBTP | 106,605 | `8453b238e6fdcf98fb1e592032c494c324c9b4a3ebc58085ea661e9aba5e4c8c` |
| 三角龙 | 9.491375 s | -18.82 LUFS | -1.49 dBTP | 95,565 | `2b4c55c486e1050dc28a0d715d88b8b6d7f78ce9215ca9fe8b6451ea2a92a25f` |
| 迷惑龙 | 10.002 s | -18.54 LUFS | -1.39 dBTP | 100,605 | `184993cb9bbc6a008eaf336f47314b75ffaab12da8ac2cc570cdec9d00728082` |

The raw pairs are byte-identical, every MP3 is 48 kHz mono and decodes
successfully, and each recorded script exactly matches the two typed
sentences. The owner has accepted the three active readings for local use; the
withdrawn Parasaurolophus recording remains archival only.

M4R generated two more deterministic Serena review MP3s after the owner
accepted the Gigantoraptor and mammoth models:

| Animal | Duration | Integrated loudness | True peak | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | ---: | --- |
| 巨盗龙 | 11.039333 s | -18.43 LUFS | -1.95 dBTP | 110,925 | `a341f9f162f939127d2fa30e3a505b8f40eac08b7850ac485838aab58215a405` |
| 长毛猛犸象 | 11.625917 s | -18.42 LUFS | -2.57 dBTP | 116,925 | `a771ac8784719d2e1629742f303f6c6c808c88b2a02bfb0b2122b9b96ece52a6` |

Both use the exact typed two-sentence scripts, are 48 kHz mono, decode
successfully, and have byte-identical seeded raw runs. Gigantoraptor passed
local listening. Mammoth was regenerated after “长毛” was heard as `zhǎng máo`;
the new script uses “身披长毛的猛犸象” to force the intended `cháng máo` context
and the owner confirmed the corrected reading. Both are tracked first-release
narration assets.

The ignored review renders were captured from the actual 1440×900 WebGL
presentation after framing review and encoded as 960×540 posters plus 320×320
thumbnails. Pachycephalosaurus resets head-left at -90°, the ichthyosaur
resets head-left at 180°, and Pteranodon uses a -20° three-quarter approach
with tighter framing. The new ichthyosaur v2 texture uses irregular,
low-contrast stone-slate mottling instead of a clean dolphin-like
countershading line. Its landscape composition is shifted slightly left; the
phone layout has separate extra breathing room and a small left nudge so the
tail no longer clips.
Tyrannosaurus rex and Triceratops
use their accepted static CC BY replacements at -90°, with bounded per-animal
light and exposure adjustments. Apatosaurus now resets broadside at 0° using
the body-only light-restyle v1 with its owner-accepted olive-brown material
v2. Its current landscape composition is centred for both desktop and phone
landscape. Parasaurolophus has been withdrawn
from the active catalog after the project-authored static remake did not meet
the visual bar. Every
poster/thumbnail visibly
contains the actual complete model rather than a background-only placeholder.
The local manifest records candidate/fixture status, crop method, byte counts,
and hashes.

## Outstanding human and release gates

The following are deliberately deferred rather than Pages blockers:

- a parent-and-child usability and comfort walkthrough;
- a full ten-minute owner-phone walkthrough across all eighteen animals;
- an optional custom domain managed through Cloudflare after the Pages URL has
  settled;
- optional written confirmation from Qwen if the project owner later separately
  licenses narration for a commercial product;
- further dedicated-scene or material polish where the owner wants more visual
  variety.

Parasaurolophus is not an outstanding slot: the owner removed it from the
release. All eighteen final narrations have been heard and approved. Model,
generated-background, derived-image, and narration distribution bases are
recorded. The public repository uses open-source AGPL-3.0-only code,
CC BY-NC-SA 4.0 original museum content from its respective rightsholders,
independently protected Brand Assets, and unchanged third-party licenses.
Contributors retain copyright; code and original-content contributions use the
matching outbound license without a default copyright transfer or unilateral
relicensing grant to the project owner.

## Tracked-file review

The tracked tree is checked for repository scope, secrets, absolute local
paths, private planning material, symlinks, and asset/provenance consistency.
The owner authorized a private GitHub repository with a public GitHub Pages
artifact. The file list below is the earlier M0–M4 snapshot; Git and the
production boundary scan are authoritative for the expanded M7 tree.

<!-- TRACKED_FILES_START -->

```text
.gitignore
.nvmrc
COLLECTION_EXPANSION_PLAN.md
LICENSES/Lucide-ISC.txt
LICENSES/OFL-1.1.txt
LICENSES/React-MIT.txt
LICENSES/Three.js-MIT.txt
PUBLIC_IMPLEMENTATION_PLAN.md
README.md
THIRD_PARTY_NOTICES.md
docs/development-progress.md
e2e/museum.spec.ts
eslint.config.js
index.html
package-lock.json
package.json
playwright.config.ts
playwright.review.config.ts
review-e2e/local-review.spec.ts
scripts/content-data.ts
scripts/content-validation.ts
scripts/credits.ts
scripts/generate-credits.ts
scripts/review-assets.ts
scripts/review-server-security.ts
scripts/validate-content.ts
scripts/validate-production-boundary.ts
scripts/validate-review-assets.ts
server.mjs
src/App.tsx
src/audio/index.ts
src/audio/narration-controller.ts
src/components/IconButton.tsx
src/components/ParentDrawer.tsx
src/components/UnderwaterAtmosphere.tsx
src/components/ViewerStage.tsx
src/content/animals/stegosaurus/animal.ts
src/content/animals/stegosaurus/backgrounds/landscape.webp
src/content/animals/stegosaurus/backgrounds/portrait.webp
src/content/animals/stegosaurus/content.zh-CN.ts
src/content/animals/stegosaurus/images/poster.webp
src/content/animals/stegosaurus/images/thumbnail.webp
src/content/animals/stegosaurus/model/model.glb
src/content/animals/stegosaurus/package.ts
src/content/animals/stegosaurus/provenance.ts
src/content/animals/stegosaurus/provenance/LICENSES/background-generation.txt
src/content/animals/stegosaurus/provenance/LICENSES/derived-images.txt
src/content/animals/stegosaurus/provenance/LICENSES/model-license.txt
src/content/animals/stegosaurus/provenance/LICENSES/model-source.txt
src/content/catalog.ts
src/content/collections/main.ts
src/content/credits.generated.ts
src/content/types.ts
src/main.tsx
src/model-policy.ts
src/review/animals/apatosaurus/content.zh-CN.ts
src/review/animals/apatosaurus/package.ts
src/review/animals/gigantoraptor/content.zh-CN.ts
src/review/animals/gigantoraptor/package.ts
src/review/animals/ichthyosaur/content.zh-CN.ts
src/review/animals/ichthyosaur/package.ts
src/review/animals/mammoth/content.zh-CN.ts
src/review/animals/mammoth/package.ts
src/review/animals/pachycephalosaurus/content.zh-CN.ts
src/review/animals/pachycephalosaurus/package.ts
src/review/animals/pteranodon/content.zh-CN.ts
src/review/animals/pteranodon/package.ts
src/review/animals/triceratops/content.zh-CN.ts
src/review/animals/triceratops/package.ts
src/review/animals/tyrannosaurus-rex/content.zh-CN.ts
src/review/animals/tyrannosaurus-rex/package.ts
src/review/assets.ts
src/review/catalog.ts
src/review/empty-catalog.ts
src/review/local-review-catalog.d.ts
src/review/types.ts
src/state/animal-load-coordinator.ts
src/state/index.ts
src/styles.css
src/viewer/ViewerController.ts
src/viewer/camera-fit.ts
src/viewer/dispose.ts
tests/App.test.tsx
tests/UnderwaterAtmosphere.test.tsx
tests/content-validation.test.ts
tests/content.test.ts
tests/loading-state.test.ts
tests/model-policy.test.ts
tests/narration-controller.test.ts
tests/review-catalog.test.ts
tests/review-server-security.test.ts
tests/setup.ts
tests/viewer.test.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
```

<!-- TRACKED_FILES_END -->
