# Collection expansion plan

Date: 2026-07-27, updated 2026-08-01
Status: M7 eighteen-animal production collection implemented and re-curated;
public Pages deployment authorized

## 1. Outcome

The approved production collection contains eighteen presentations in a
habitat-balanced loop:

1. Stegosaurus（剑龙）
2. Pteranodon（无齿翼龙）
3. Pachycephalosaurus（肿头龙）
4. ichthyosaur（鱼龙类）
5. Tyrannosaurus rex（霸王龙）
6. Rhamphorhynchus（喙嘴翼龙）
7. Triceratops（三角龙）
8. Apatosaurus（迷惑龙）
9. plesiosaur group（蛇颈龙类）
10. Gigantoraptor（巨盗龙）
11. Tupandactylus（古神翼龙）
12. woolly mammoth（长毛猛犸象）
13. Megalodon（巨齿鲨）
14. Maiasaura（慈母龙）
15. Sauropelta（胄甲龙）
16. Meganeura（巨脉蜻蜓）
17. Dilophosaurus（双冠龙）
18. Mosasaurus（沧龙）

Parasaurolophus（副栉龙）is no longer part of the collection. The available
low-poly fixture and project-authored remake both missed the visual-quality
bar, and the owner explicitly chose not to continue that slot. Gigantoraptor
and woolly mammoth were the first two approved additions. Maiasaura, the
plesiosaur-group exhibit, and Megalodon completed a further owner-reviewed
expansion on 2026-07-31.

Sauropelta, Dilophosaurus, and Mosasaurus were promoted through the atomic
onboarding workflow later on 2026-07-31. Rhamphorhynchus, Tupandactylus, and
Meganeura followed on 2026-08-01, after which the owner approved the complete
three-animal batch and requested the collection-wide habitat re-curation.

All eighteen presentations have passed the owner's current model, content,
scene, and narration review and are published through typed production packages.
Every runtime model, scene image, derived image, and MP3 has a retained
provenance record and generated public attribution.

This plan extends [PUBLIC_IMPLEMENTATION_PLAN.md](PUBLIC_IMPLEMENTATION_PLAN.md).
On 2026-07-28 the owner authorized a private GitHub repository, public GitHub
Pages, and public distribution of the reviewed runtime assets. The same
authorization and asset-review gates apply to the later owner-approved
production packages. Ignored candidates and research materials remain private.

## 2. M4 — four-animal local review

### Build order

1. Keep review-only packages and assets out of the normal production build.
2. Extend the size fact so it can distinguish body length, wingspan, and a
   group-level range; never label a wingspan as body length.
3. Add Pachycephalosaurus as the second complete presentation.
4. Add the ichthyosaur to exercise the water scene.
5. Add Pteranodon to exercise flying/static presentation.
6. Run the four-animal switching, failure, audio, responsive, and resource
   lifecycle checks.
7. Give the owner one local review route and record a separate pass/fail for
   every animal.

### Per-animal gates

| Animal | Content gate | Model gate | Scene gate | TTS gate | Human gate | Rights gate |
| --- | --- | --- | --- | --- | --- | --- |
| 剑龙 | Existing two-sentence copy and facts remain the baseline | Retain accepted head-left pose, `Idle`, framing, and all-angle lighting | Retain accepted paired backgrounds, poster, thumbnail, and ochre accent | The owner accepted the complete short Serena reading for local use; wire the reviewed MP3 without autoplay | Recheck model, audio, parent facts, phone layouts, and switching within the four-animal batch | Model, generated art, derived images, and Serena output still require an explicit public-redistribution decision |
| 肿头龙 | Review 3–4.5 m as an approximate range; show herbivore as the simple label while preserving diet uncertainty; do not present head-butting as settled fact | Use the existing normalized candidate only in review; soften eyes/material, confirm `Idle`, pose, bounds, texture budget, and 360-degree readability | Produce and review dedicated landscape/portrait woodland backgrounds, poster, thumbnail, contact shadow, and a distinct soft-plum accent | Generate the exact two-sentence package script with Serena; retain master and metrics locally; wire only the review MP3 | Owner checks dome readability, calm face, full silhouette, copy, pronunciation of “肿头龙/白垩世”, and phone framing | Re-verify source attribution, CC BY evidence, every modification, runtime hashes, generated-art records, derived-image rights, and Serena output rights |
| 鱼龙类 | Keep the group-level name; state that it is a marine reptile, not a dinosaur; do not imply that the group-wide size range is this model's individual length | Use the compact normalized candidate only in review; compare the irregular slate-grey v2 material against the rejected clean countershading pass, preserve swimming `Idle`, and confirm no floor shadow | Review the existing water-background candidates; finish underwater contrast, floating presentation, poster, thumbnail, and ocean-teal accent | Generate the exact group-level two-sentence script; check “鱼龙类/流线形”; wire only the review MP3 | Owner checks that the animal reads as calm, does not look like a modern fish or toy dolphin, stays visible through 360 degrees, and remains legible on phones | Keep the asset at group level unless genus/species evidence appears; re-verify model, material derivative, background, image, and Serena redistribution evidence |
| 无齿翼龙 | Identify it as a pterosaur, not a dinosaur or bird; show verified wingspan information rather than writing 6–8 m as body length; do not infer species or sex from the model | Use the normalized candidate as a static review exhibit; do not restore the root-travelling flight clip; confirm wing, crest, beak, bounds, and disposal | Create paired coastal-air backgrounds, a broad faint shadow below the flying pose, poster, thumbnail, and sky-blue accent | Generate the exact two-sentence script; check “无齿翼龙/白垩世”; wire only the review MP3 | Owner checks full wing clearance in all five viewports, static presentation, copy, pronunciation, and transitions to/from land and water animals | Re-verify source attribution, CC BY evidence, static derivative changes, generated/derived art rights, and Serena output rights |

### Shared M4 acceptance

M4 is complete only when:

- all four animals are selectable in the local review build, while the normal
  production build contains no review fixtures or candidate assets;
- requested-versus-ready switching remains atomic and latest-request-wins;
- switching stops and resets the old narration; no narration auto-plays;
- every animal has working loading, retry, poster fallback, reset, parent
  drawer, focus mode, and URL selection;
- land, water, and flying presentations use their declared grounding;
- unit, content, production-build, and browser tests pass at 360×640, 390×844,
  844×390, 768×1024, and 1440×900;
- repeated four-animal switching does not leave stale scenes, audio, object
  URLs, or unbounded retained GPU resources;
- the owner records model/scene/content/audio pass or actionable failure for
  each animal.

On 2026-07-27 the owner accepted all four M4 presentations locally. On
2026-07-28 their tracked provenance and runtime assets were promoted into the
nine-animal production collection.

## 3. Draft-to-published promotion

Promote one animal at a time. A package changes from `draft` to `published`
only after all of the following are true:

1. **Identity and content**
   - the package ID and taxonomic scope match the model evidence;
   - Chinese child copy, parent facts, uncertainty notes, pronunciation entries,
     and one to three authoritative source links are reviewed;
   - size semantics are correct for body length, wingspan, or group range.
2. **Model**
   - the final GLB is normalized, self-contained, within budget, validator
     clean or has a documented reviewed exception;
   - the approved pose, optional named `Idle`, full bounds, 360-degree lighting,
     reset, focus mode, and disposal pass on desktop and phone.
3. **Scene and derived images**
   - dedicated landscape and portrait backgrounds pass their safe areas;
   - poster and thumbnail show the same approved presentation;
   - accent, ground/flying/water treatment, hashes, and byte budgets pass.
4. **Narration**
   - the MP3 exactly reads the package's two sentences and passes format,
     loudness, peak, silence, and filename checks;
   - the owner has listened for wording, pronunciation, omissions, artifacts,
     and pacing;
   - a shorter-than-12-second clip may be accepted when the complete approved
     script is present, with that exception recorded.
5. **Rights and provenance**
   - every runtime asset has source, author/tool, license or rights basis,
     retained evidence, modifications, runtime hash, and attribution;
   - redistribution of the model derivative, generated backgrounds, derived
     poster/thumbnail, and TTS output has been decided separately;
   - generated notices and retained license files are complete.
6. **Release behavior**
   - production content validation, TypeScript, lint, unit tests, production
     build, E2E tests, nested-base smoke test, and production-boundary scan pass;
   - owner-phone and parent-and-child checks pass for that animal.

Only then may the package enter the production collection. A partial pass keeps
the package in `draft`; it is not bypassed with a validator exception merely to
increase the card count.

### Model-delivery budget addendum

The encoded GLB optimization target/hard ceiling is 12/20 MiB. The dependent
complete-animal-package target/hard ceiling is 14/23 MiB. Geometry, draw-call,
bone, image/audio, texture-dimension, decoded-texture-memory, collection, and
real-phone gates remain unchanged. A model strictly above 6 MiB is allowed to
proceed inside those gates, but the interface identifies its approximate
encoded size in a non-blocking switch notice. The first mobile
visit also receives a remembered data/Wi-Fi reminder.

## 4. Completed second review wave and release additions

Tyrannosaurus rex, Triceratops, and Apatosaurus completed the second review
wave. Each has:

- a typed Chinese package with two complete child-facing narration sentences,
  pronunciation entries, cautious facts, uncertainty notes, and authoritative
  museum or government sources;
- a deterministic Serena review MP3 and local generation metrics;
- tracked runtime model, backgrounds, poster, thumbnail, narration, and typed
  provenance in the production bundle.

Tyrannosaurus rex now uses Marcel Schanz's static CC BY 4.0
`Tyrant King - Tyrannosaurus` 1K GLB: 59,310 triangles, two draw calls, seven
embedded 1K textures, and a 9,778,780-byte normalized payload. Triceratops now
uses wojciechmiedziocha's static CC BY 4.0 `Triceratops dinosaur` 1K GLB:
12,560 triangles, one draw call, three embedded 1K textures, and a
4,463,224-byte normalized payload. Both are validator-clean, owner accepted,
and published with visible attribution/change records.

Apatosaurus now uses the ignored 4,559,216-byte body-only derivative of
“Apatosaurus Dinosaur” by XML-AL16_EMMILIA.. under CC BY 4.0. Blender 5.2.0
removed the presentation props and applied a reversible light silhouette
shape key. Material v2 keeps that geometry and UV unchanged while adding three
1K project-authored olive-brown texture maps, guided only by the submitted
image's palette and leathery surface character. It remains static and needs
no rig or animation; the owner accepted the current static version.
Parasaurolophus is intentionally absent from the release catalog.
The former Quaternius CC0 fixture and the project-authored static remake are
retained only as ignored archival research material; neither is suitable for
review or publication. It is no longer an active product slot.
The accepted ichthyosaur model now uses an owner-approved 1K irregular
slate-grey v2 base colour after the cleaner countershading pass looked too much
like a modern fish. The three active Serena readings passed local listening;
the withdrawn Parasaurolophus recording is archival only.

### First-release additions (2026-07-28)

Gigantoraptor and woolly mammoth are the eighth and ninth first-release
animals. Both use accepted static models, reviewed land backgrounds and
poster/thumbnail renders. Their deterministic Serena recordings are included
without autoplay. Gigantoraptor passed
listening; mammoth was regenerated with a disambiguating “身披长毛” context
after a `zhǎng/cháng` error, and the owner confirmed the corrected `cháng`
reading.

- The mammoth card uses the upstream “3D High-poly Baby Woolly Mammoth” model
  by SDPM Esare under CC BY 4.0. It does not use the submitted kenchoo
  CC BY-NC-SA derivative. The age implied by the upstream title and the
  model's long tusks remain a scientific-expression review point.
- Gigantoraptor's direct source is retained with a CC BY attribution/change
  record. Its speculative eyes/crest/colour/feather distribution, static
  presentation remain explicit scientific uncertainty notes. Phone
  loading/rotation/switching stays part of ongoing release observation.

## 5. M5–M8

### M5 — production collection

- Status: implemented as the twelve-animal milestone and subsequently expanded.
- All twelve milestone packages are `published` with tracked runtime assets.
- Endless navigation, adjacent warm-up, cross-habitat transitions, collection
  budgets, generated notices, and lifecycle tests are implemented.
- Phone landscape uses a right-side vertical card rail so complete animal
  cards remain visible after rotation.

The 2026-07-31 promotion added Maiasaura, the plesiosaur-group exhibit, and
Megalodon. Each uses the exact owner-approved GLB, responsive background pair,
poster, thumbnail, and Serena MP3 from the local review. At the M5 milestone,
the production order kept the three marine exhibits at positions 3, 7, and 11;
the M7 owner-approved re-curation supersedes that historical order.

Gate: every production-card animal is independently `published`; no draft,
fixture, candidate, or unreviewed audio enters the production catalog.
This gate is complete.

### M6 — atomic onboarding and distribution candidate

- Promote Sauropelta, Dilophosaurus, and Mosasaurus through deterministic QA,
  explicit owner approvals, and one rollback-safe batch transaction.
- Preserve package hashes and generated attribution while exposing each
  `animal.ts` only after its complete package is installed.
- Apply the owner-approved layered license boundary: open-source
  AGPL-3.0-only code, CC BY-NC-SA 4.0 original content from its respective
  rightsholders, independently protected Brand Assets, and unchanged
  third-party terms. Contributors retain copyright and grant only the matching
  outbound license; complete tracked-file/history review.
- Public rights bases are now recorded for models, generated images, derived
  images, and Qwen3-TTS Serena narration.
- Add clean-install CI, production-only build artifacts, Pages configuration,
  and the self-contained local release ZIP.
- Verify nested-path URLs, license/notice copies, and no mandatory runtime
  network dependency.

Gate: all legal and technical distribution evidence is complete. The owner
authorized replacing the earlier private repository with a clean public
single-commit repository and public Pages deployment on 2026-08-04. A custom
Cloudflare-managed domain is deferred.

### M7 — flight expansion and habitat re-curation

- Promote Rhamphorhynchus, Tupandactylus, and Meganeura from their exact
  owner-approved review hashes in one atomic transaction.
- Keep the revised large-stroke Rhamphorhynchus flight Idle, the reviewed
  Tupandactylus lower-jaw cycle, and the accepted replacement Meganeura model
  and fast flying-insect Idle.
- Re-curate all eighteen exhibits so aerial animals occupy zero-based indices
  1, 5, 10, and 15 and aquatic animals occupy 3, 8, 12, and 17.

Gate: all three packages are published, the complete collection validates, and
the explicit cyclic order is protected by automated regression tests. This gate
is complete.

### M8 — final acceptance

- Run all automated release gates and the five responsive viewports.
- Complete a ten-minute owner-phone walkthrough across the collection.
- Complete one parent-and-child co-browsing walkthrough.
- Every final narration has been listened to and approved in context.
- Record all blockers and a final pass/fail for content, comfort, performance,
  recovery, rights, and delivery.

Gate: automated and owner narration gates are complete. The parent-and-child
walkthrough is an explicitly deferred follow-up rather than a Pages blocker.
