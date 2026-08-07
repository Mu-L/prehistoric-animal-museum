---
name: prehistoric-animal-onboarding
description: Run the prehistoric-animal-museum candidate intake, rights scoring, Blender normalization, visibly verified body and conditional mouth Idle templates, pinned Qwen3-TTS Serena narration, measured initial head orientation and land grounding, deterministic GLB and responsive-browser QA, evidence reporting, local review preparation, explicit owner-approval recording, and atomic draft-to-production promotion. Use when adding, evaluating, rejecting, repairing, reviewing, approving, or promoting a prehistoric animal, including complaints that the initial view faces the wrong way, motion is invisible, an eligible open mouth should relax naturally, narration sounds like system TTS, or a land animal appears to float; never convert an automated pass into owner approval.
---

# Prehistoric Animal Onboarding

Use the project’s deterministic tools to turn a licensed candidate into an
evidenced local review draft. Keep source archives, generated media, Blender
files and reports in the ignored local incubation directories. Do not add a new
candidate to the production collection without a new explicit owner approval.

## Start here

Work from the `prehistoric-animal-museum` repository root. Read:

1. `docs/specification/animal-onboarding-standard.md`;
2. the candidate `profile.json`;
3. `references/workflow-contract.md` for command order and report semantics.

Before candidate work, run:

```sh
node --import tsx tools/animal-onboarding/src/cli.ts baseline verify
node --import tsx tools/animal-onboarding/src/cli.ts golden regress
```

Treat the original 12 production animals as an immutable ordered prefix. The
collection may grow only through an explicitly approved promotion transaction;
the baseline verifier requires the production directories and current
collection to agree. Treat `maiasaura`, `plesiosaurus`, and `megalodon` as
read-only golden samples.

## Workflow

1. Record at least eight unique candidates in an intake JSON. Do not infer a
   missing author, upstream chain, license or redistribution right.
2. Score with `intake score`. A high score never overrides a hard failure.
3. For an advancing candidate, archive both the chosen GLB and source download,
   create `profile.json`, and keep every human approval false unless the owner
   explicitly supplied it.
4. Run Blender headlessly with `normalize_animal.py`. Preserve its normalization
   log, landmarks, neutral renders, three fixed-camera motion renders, `.blend`,
   and runtime GLB. Do not accept clip-name/duration metadata alone: the
   fixed-camera renders and the real viewer must both show measurable pixel
   change. Declare `presentation.initialHeadSide`; QA must project the measured
   head and tail through the initial yaw and reject the wrong side or an
   ambiguous near-frontal view. Inspect an open-mouth source before choosing
   `model.mouthMotion`: visible teeth, tongue and mouth interior are necessary
   but not sufficient. Prefer `source-rig` only when a unique weighted jaw and
   declared tongue chain can be measured. Use `curated-components` only with a
   per-model hinge, exact connected-component/vertex counts and a bounded soft
   tissue mask. Otherwise record `disabled`; never move a broad guessed head
   region just to manufacture mouth motion.
5. Generate both localized narrations with `audio/generate_narration.py` in the
   pinned Qwen3-TTS environment. Require the 0.6B CustomVoice checkpoint, the
   pinned model revision and two byte-identical seeded raw runs for each
   locale. The approved voice matrix is Serena / Chinese for `zh-CN` and
   Serena / English for `en`. Keep the scripts, MP3s, metrics and listening
   decisions independent; never substitute one locale for the other or use
   macOS `say`, Tingting, or another system TTS.
6. Run `qa ... --model-only --autofix`. In this command, safe autofix is
   deliberately limited to refreshing QA reports, recorded hashes and the
   draft manifest. Regenerate Blender output, backgrounds or review derivatives
   only with their explicit stage commands. No command may decide scientific
   identity, anatomy, aesthetic quality, motion naturalness, narration quality,
   or production approval.
7. Add the complete package only to the explicit local-review allowlist. Do not
   create `src/content/animals/<id>/animal.ts` or edit the production collection.
8. Run `composition <profile.json>` for the five required real browser
   viewports. Use its paired canvas-visible/hidden evidence, screenshots and
   contact sheet. Require the viewer's actual runtime initial yaw to match the
   profile in every viewport. For land animals, rotate measured contacts by that
   yaw, require the contact shadow to cover the resulting foot cluster and place
   the feet over a continuous, visually readable ground patch in every viewport.
   For every animated draft, use the review-only
   animation clock to freeze the same camera at exactly 0 and 2 seconds; require
   the recorded paused/time state and pixel difference to show a visible Idle
   instead of merely finding an `Idle` clip or relying on screenshot timing.
   When mouth motion is enabled, additionally require fixed Blender mouth
   close-ups at 0/4/8 seconds and exact browser states at 0/4 seconds. Treat
   tooth clearance, tongue following, mouth-corner/soft-tissue continuity and
   child comfort as human-only even after the pixel and loop gates pass.
9. Run `review prepare <profile.json>`, then
   `promote <profile.json> --dry-run`. A code `3` after otherwise-valid inputs
   is the expected result while owner production approval is absent.
10. Only after the owner explicitly accepts every human-only category,
    including both localized content records and complete listening of both
    narrations, plus production/public distribution, record the decision with `approval record
    <profile.json...> --by <owner> --on <YYYY-MM-DD>`. This command requires an
    already-passed complete local draft, updates the profile review statuses,
    and writes a hashed `approval-record.json`; never run it from inference.
11. Remove pending wording from both approved localized editorial records, rerun
    `review prepare`, then run one approved batch dry-run. For real promotion,
    use `promote-batch <profile.json...> --collection main`. The tool validates
    every animal before writing, assembles canonical packages under each run’s
    `promotion-staging/`, installs all non-catalog files first, exposes
    `animal.ts` last, updates the collection once, regenerates credits/notices,
    validates content, and rolls back the whole batch on failure. The local
    review catalog treats the production collection as authoritative and
    automatically replaces the same-ID private draft assets after promotion;
    do not maintain a second manual “promoted” list. Same-hash
    reruns must report every target as `identical`; differing or partial
    targets hard-fail.
12. Run `promote verify <profile.json>` for every installed animal, golden
    regression, and the repository’s complete verification suite. Confirm the
    production count equals the current collection and that all original 12
    entries and three golden samples remain unchanged.

## Repair loop

When QA reports a hard failure, make only the smallest deterministic repair
supported by the profile and rerun the failed stage:

- source/evidence failure: stop and find a verifiable source;
- validator, clip or budget failure: rerun the Blender or GLB stage and retain
  the new log;
- invisible Idle: strengthen the relevant motion template, rerun Blender, then
  rerun browser composition; never waive the pixel-change hard gate;
- invalid mouth Idle: first fix source-object vertex correspondence, bone/weight
  selection or the exact curated mask; use only a slow partial close. If teeth,
  tongue and soft tissue cannot remain coherent, set the profile to `disabled`
  with evidence or send the asset for manual rigging—never widen the mask or
  waive the 0/4/8-second evidence gate;
- narration engine failure: regenerate the affected locale with the pinned
  Qwen3-TTS Serena / declared-language pair; a technically valid system-TTS
  MP3, cross-language fallback or copied narration is still a hard failure;
- floating land animal: move the animal onto a continuous readable ground patch,
  then correct the yaw-rotated, contact-derived shadow center/depth/opacity and
  rerun all five browser viewports; mathematical shadow coverage does not
  replace the contact-sheet review;
- wrong initial head side: correct `initialYawDegrees`, move any asymmetric
  shadow offset with the rotated contacts, then rerun composition; never change
  `initialHeadSide` merely to make a wrong view pass;
- landmarks or composition failure: correct profile orientation/presentation,
  rerun Blender if landmarks changed, then rerun all five viewports;
- missing derivative or hash mismatch: regenerate from the reviewed source;
- science, anatomy, material, background, natural motion, Simplified Chinese or
  English copy, either locale's complete audio listening, or publication
  decision: leave it pending for a human.

Never repair a rights or science failure by weakening a threshold or changing a
gate category.

## Handoff

Report, for every draft:

- automated pass/fail and exact evidence paths;
- declared mouth-motion mode, measured affected region and, when enabled, both
  Blender 0/4/8-second and browser 0/4-second evidence;
- warnings;
- all still-pending human-only decisions, listed separately for `zh-CN` and
  `en` content and narration where applicable;
- promotion dry-run and, when authorized, `promotion-result.json` plus the
  exact tracked-file list;
- proof that production directories equal the current collection, the original
  12-animal prefix is preserved, and all golden hashes still pass.

Say “automated pass” or “local review draft ready”; never say “approved” unless
the corresponding owner approval is explicitly present.
