# Animal package authoring guide

This guide is the maintainer workflow for adding or replacing one public
prehistoric-animal presentation. Work on one animal at a time. A package is
not published merely because it renders locally.

## 1. Package layout

Copy an existing package with similar presentation needs and keep this
canonical layout:

```text
src/content/animals/<animal-id>/
  animal.ts
  content.zh-CN.ts
  package.ts
  provenance.ts
  model/model.glb
  images/poster.webp
  images/poster-portrait.webp
  images/thumbnail.webp
  images/preview-*.webp
  images/model-preview.manifest.json
  backgrounds/landscape.webp
  backgrounds/portrait.webp
  audio/narration.zh-CN.mp3
  provenance/LICENSES/
    model-license.txt
    model-source.txt
    background-generation.txt
    derived-images.txt
    narration-rights.txt
```

Use a stable lowercase ASCII kebab-case ID. The directory name, package ID,
collection entry, local asset records, and URLs must agree.

## 2. Intake before editing

Retain private source material outside tracked runtime paths:

- original model archive and untouched source GLB;
- source page/API evidence, author, URL, access date, license, and download
  variant;
- original generated images and prompt records;
- Blender or material workspaces and processing reports;
- narration masters, exact script, generation settings, metrics, and listening
  decision.

These belong in the ignored project work areas such as `assets/candidates`,
`.handoff`, `prototypes`, or `spikes`. Never use `git add -f` to publish them.

Reject an input when its direct source, author, license, or modification chain
cannot be explained. Prefer CC0, CC BY 4.0, public-domain material, or
project-authored/generated work with a retained rights basis.

## 3. Model preparation

The runtime model must be a self-contained glTF 2.0 GLB. Preserve the original
file, then normalize a derivative:

```sh
cd tools/model-pipeline
npm ci
node normalize-glb.mjs \
  ../../assets/candidates/<source>/original.glb \
  ../../assets/candidates/<source>/normalized.glb \
  --clip Idle
node validate-glb.mjs \
  ../../assets/candidates/<source>/normalized.glb
```

Use `--clip none` for a static exhibit. Do not retain root-travelling or
frightening animation merely to make the model animated.

Current delivery gates:

- encoded GLB target/hard ceiling: 12/20 MiB;
- complete animal package target/hard ceiling: 14/23 MiB;
- triangles target/hard ceiling: 100,000/250,000;
- draw calls target/hard ceiling: 12/24;
- bones target/hard ceiling: 120/200;
- no external buffers or textures;
- textures normally at or below 2K, with decoded-memory review on a real phone.

Record every transformation: removed animations or props, material conversion,
texture resizing, geometry or pose changes, and the final byte count and hash.

## 4. Content and presentation

`content.zh-CN.ts` contains two child-facing narration sentences, a visible
feature, cautious parent facts, pronunciation entries, uncertainty notes, and
one to three authoritative sources. Do not infer species, sex, colour, diet,
sound, or behaviour from a model.

Choose the correct size semantic:

- `body-length`;
- `wingspan`;
- `shoulder-height`;
- `group-range`, with a note that it is not the displayed individual's size.

`package.ts` declares framing and behavior. Start conservatively:

```ts
presentation: {
  initialYawDegrees: -90,
  safeAreaPadding: 0.12,
  shadow: 'ground',
}
```

Water and flying exhibits usually use `shadow: 'none'`. Add exposure,
camera-light, offset, or portrait padding only after checking all five required
viewports.

## 5. Scene, generated model previews, poster, and thumbnail

Landscape and portrait backgrounds are separate compositions, not runtime
crops. Keep the central model area quiet and do not bake animals, text, UI,
logos, or watermarks into the scene.

Capture the poster from the accepted runtime presentation, then derive a
readable square thumbnail. Current ceilings are:

- poster: 500 KiB;
- thumbnail: 120 KiB.

The poster and thumbnail must show the same model, material, pose direction,
and scene as the published package.

The transparent images used while WebGL loads are generated artifacts, not
animal-authored layout. After the GLB and `presentation` values are final, run:

```sh
npm run generate:model-previews -- <animal-id>
npm run validate:model-previews
```

The generator automatically produces every shared landscape and portrait
profile plus a manifest containing the source-model hash and presentation
signature. Do not add per-animal media queries, CSS offsets, or hand-cropped
loading images. A model or presentation change intentionally makes the build
fail until this command is rerun. For owner-only candidates, use
`npm run generate:review-model-previews -- <animal-id>` instead.

## 6. Narration

Narration never autoplays. Generate the exact two approved sentences offline,
normalize to a compact 48 kHz mono MP3, and listen to the complete result.
Check names, geological periods, polyphonic characters, omissions, duplicated
words, artifacts, silence, loudness, and pacing.

The current public voice is Qwen3-TTS 0.6B CustomVoice with the built-in Serena
speaker. Public notices must say that the Chinese script was written and
reviewed by humans and synthesized offline with AI. Retain the model/license
links, script hash, output hash, and listening decision.

## 7. Provenance and publication

`provenance.ts` must record every runtime asset:

- `model/model.glb`;
- both backgrounds;
- poster and thumbnail;
- narration MP3.

For each record, include source, author/tool, direct URL where applicable,
license, original and runtime hashes/bytes, modifications, attribution,
redistribution decision, and evidence paths. Run:

```sh
npm run generate:credits
npm run validate:content
```

For candidates managed by the project onboarding profile, do not copy the
review files or hand-edit provenance. Prepare and dry-run the manifest first:

```sh
node --import tsx tools/animal-onboarding/src/cli.ts review prepare <profile.json>
node --import tsx tools/animal-onboarding/src/cli.ts promote <profile.json> --dry-run
```

Only after the owner explicitly approves science, visuals, motion, complete
listening, public redistribution, and production, record that decision and
regenerate the manifest:

```sh
node --import tsx tools/animal-onboarding/src/cli.ts approval record \
  <profile.json...> --by <owner> --on <YYYY-MM-DD>
node --import tsx tools/animal-onboarding/src/cli.ts review prepare <profile.json>
```

Remove any “review pending” wording from the approved Chinese content, run an
approved batch dry-run, then promote the entire approved order in one
transaction:

```sh
node --import tsx tools/animal-onboarding/src/cli.ts promote-batch \
  <profile.json...> --dry-run --collection main --out <dry-run.json>
node --import tsx tools/animal-onboarding/src/cli.ts promote-batch \
  <profile.json...> --collection main --out <promotion-result.json>
```

The transaction copies only manifest-hashed reviewed outputs, generates typed
production definitions and license records, stages complete packages, exposes
`animal.ts` last, updates the collection once, regenerates credits/notices,
validates content, and rolls back on failure. Same-hash reruns are idempotent;
different or partial targets hard-fail. Run `promote verify <profile.json>` for
each installed animal. Never run `approval record` from an automated pass or
an inferred owner preference.

For packages outside that workflow, only set `status: 'published'` and add the
ID to `src/content/collections/main.ts` after content, model, scene, narration,
rights, responsive, and owner checks pass. The collection order is explicit
and loops.

## 8. Complete verification

From the repository root:

```sh
npm ci
npm run lint
npm run typecheck
npm test -- --run
npm run validate:content
npm run validate:model-previews
npm run build
npm run test:e2e
```

Check 360×640, 390×844, 844×390, 768×1024, and 1440×900. Confirm:

- the full animal remains inside the composition-safe frame;
- phone-landscape navigation shows complete cards in the vertical rail;
- touch targets remain at least 48×48 CSS pixels;
- switching is latest-request-wins and stops old narration;
- loading, failure, retry, reset, focus mode, drawer, and URL selection work;
- repeated switching does not retain stale audio, scenes, or GPU resources;
- the production boundary contains only declared public assets.

## 9. Troubleshooting

- **`CANONICAL_PATH_MISSING`** — restore the exact canonical filename.
- **`ASSET_HASH_MISMATCH` / `ASSET_SIZE_MISMATCH`** — update provenance only
  after confirming the new file is the intended reviewed runtime output.
- **`PROVENANCE_MISSING`** — add a record; do not weaken validation.
- **`REDISTRIBUTION_NOT_ALLOWED`** — resolve the rights basis or keep the
  package out of production.
- **`GLB_EXTERNAL_URI`** — repack textures and buffers into the GLB.
- **missing `Idle`** — correct the declared clip or publish as a reviewed
  static exhibit.
- **animal clipped on phones** — increase safe-area padding before adding a
  small orientation-specific offset.
- **static model looks stuck** — improve the scene/pose and copy; do not add a
  bad animation.
- **build contains private paths** — remove the import and rerun the production
  boundary scan.

When a quality, scientific, rights, or real-phone check fails, keep the
existing public package usable and fix the candidate outside tracked runtime
paths.
