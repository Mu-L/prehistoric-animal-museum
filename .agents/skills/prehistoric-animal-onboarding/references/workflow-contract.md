# Workflow contract

Run from the repository root.

## Commands

```sh
# Baseline and read-only regression
node --import tsx tools/animal-onboarding/src/cli.ts baseline verify
node --import tsx tools/animal-onboarding/src/cli.ts golden regress

# One-time initialization only; this hard-fails rather than overwriting an
# existing golden baseline.
node --import tsx tools/animal-onboarding/src/cli.ts golden capture

# Candidate batch
node --import tsx tools/animal-onboarding/src/cli.ts intake score \
  <candidates.json> --out <candidate-ranking.json>

# Candidate model and review
/opt/homebrew/bin/blender --background --factory-startup \
  --python tools/animal-onboarding/blender/normalize_animal.py -- \
  --profile <profile.json>
/private/tmp/animal-onboarding-qwen3/bin/python \
  tools/animal-onboarding/audio/generate_narration.py <profile.json...>
node --import tsx tools/animal-onboarding/src/cli.ts qa \
  <profile.json> --model-only --autofix
node --import tsx tools/animal-onboarding/src/cli.ts composition <profile.json>
node --import tsx tools/animal-onboarding/src/cli.ts review prepare <profile.json>
node --import tsx tools/animal-onboarding/src/cli.ts promote \
  <profile.json> --dry-run
node --import tsx tools/animal-onboarding/src/cli.ts promote-batch \
  <profile.json...> --dry-run --out <result.json>

# Only after explicit owner approval of all human-only categories
node --import tsx tools/animal-onboarding/src/cli.ts approval record \
  <profile.json...> --by <owner> --on <YYYY-MM-DD>
node --import tsx tools/animal-onboarding/src/cli.ts review prepare \
  <profile.json>
node --import tsx tools/animal-onboarding/src/cli.ts promote-batch \
  <profile.json...> --collection main --out <promotion-result.json>
node --import tsx tools/animal-onboarding/src/cli.ts promote verify \
  <profile.json>
```

## Repository verification

```sh
npm run lint
npm run typecheck
npm test -- --run
npm run validate:content
npm run test:review
npm run build
npm run test:e2e
```

## Exit codes

| Code | Meaning |
| ---: | --- |
| 0 | Requested deterministic operation passed |
| 1 | One or more automated hard gates failed |
| 2 | Invocation or profile is invalid |
| 3 | Required human-only production approval is absent |
| 4 | Production baseline, golden sample, or promotion target changed |

## Interpretation

- `automatedPass=true`: deterministic engineering checks pass.
- An `Idle` clip name and eight-second duration are insufficient. Blender must
  retain three fixed-camera motion renders. The reduced-motion browser must use
  the review-only clock to record paused frames at exactly 0 and 2 seconds and
  must change at least 3% of the measured model pixels; wall-clock screenshot
  delays are not evidence.
- `model.mouthMotion` is mandatory. Use `disabled` with a reason unless the
  source has a deterministic jaw path and complete reviewable teeth/tongue/
  interior. `source-rig` requires one declared weighted jaw and measured tongue
  bones; `curated-components` requires a per-model hinge plus exact component,
  vertex and soft-mask counts. Enabled motion uses one slow partial close in the
  same eight-second `Idle`; Blender proves 0/4/8-second open/close/open close-ups
  and the browser proves paused 0/4-second states. Pixel gates do not approve
  tooth clearance, tongue following, soft tissue or child comfort.
- Narration must identify the pinned `qwen-tts` 0.1.1 / Qwen3-TTS 0.6B
  CustomVoice revision and two identical seeded raw runs independently for
  each locale. The approved pairs are Serena / Chinese for `zh-CN` and Serena /
  English for `en`. System TTS and cross-language fallback have no fallback
  status and hard-fail.
- A land contact shadow must have visible opacity and cover at least two
  measured foot contacts after the initial yaw is applied; `shadow: ground`
  alone is insufficient. The five-
  viewport contact sheet must also place the feet on a continuous, visually
  readable ground patch rather than sky, distant scenery, vegetation edges, or
  a strong light/dark discontinuity.
- `presentation.initialHeadSide` is required. The deterministic gate projects
  measured `head` and `tailTip` landmarks through `initialYawDegrees`, rejects
  the wrong side and any near-frontal projection below 35% separation, and the
  browser evidence must prove that the runtime package uses the same yaw.
- `localDraftReady=true`: complete local review media and five-viewport evidence
  also pass.
- `ownerApproved=false`: expected until the owner explicitly approves every
  relevant human-only decision and records both approver and ISO date.
- A mixed candidate intake normally returns code `1` when rejected candidates
  have hard failures. Continue with entries marked `advance`; retain the
  generated decision report for every `hold` and `reject`.
- Promotion dry-run code `3` with otherwise-valid deterministic inputs is the
  correct pre-approval result; no install is authorized.
- `approval record` may run only against an explicit owner decision covering
  both localized editorial records and complete listening of both narrations.
  After recording it, rerun `review prepare` so the manifest hashes the
  approval and both approved editorial sources.
- Real `promote-batch` validates the whole batch before installation, stages
  complete packages, exposes `animal.ts` last, updates the collection once,
  regenerates credits/notices, validates content, and rolls back on failure.
  A repeat run with identical packages must pass without replacing files.
- Warning and human-only rows must remain visible in Markdown/HTML summaries.

The detection algorithms and thresholds live in
`tools/animal-onboarding/src/`; do not copy them into this Skill.
