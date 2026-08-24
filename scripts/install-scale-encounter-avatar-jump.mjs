import { createHash } from 'node:crypto'
import {
  copyFile,
  readFile,
  rename,
  stat,
  writeFile,
} from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

import { NodeIO, PropertyType } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const CLIP_NAME = 'Jump_Land'
const EXPECTED_DURATION_SECONDS = 0.9
const PROJECT_ROOT = resolve(import.meta.dirname, '..')
const ASSET_ROOT = join(
  PROJECT_ROOT,
  'assets/candidates/scale-encounter-child-avatar',
)
const MANIFEST_PATH = join(
  ASSET_ROOT,
  'meshy-scene-avatar-packages.manifest.json',
)
const TARGETS = [
  {
    id: 'boy-land-explorer',
    version: 'v02',
    filename: 'child-avatar-v4-boy-land-explorer-review-v01.glb',
  },
  {
    id: 'girl-land-explorer',
    version: 'v02',
    filename: 'child-avatar-v4-girl-land-explorer-review-v01.glb',
  },
  {
    id: 'boy-snow-expedition',
    version: 'v01',
    filename: 'child-avatar-v4-boy-snow-expedition-review-v01.glb',
  },
  {
    id: 'girl-snow-expedition',
    version: 'v01',
    filename: 'child-avatar-v4-girl-snow-expedition-review-v01.glb',
  },
]

function argument(name) {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

const sourceDirectoryArgument = argument('source-dir')
if (!sourceDirectoryArgument) {
  throw new Error('Missing --source-dir=/absolute/path/to/blender-animation-sources')
}
const SOURCE_DIRECTORY = resolve(sourceDirectoryArgument)
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)

function targetPaths(target) {
  const runRoot = join(
    ASSET_ROOT,
    'meshy-scene-models-2026-08-18',
    target.id,
    `mv-${target.version}`,
    'run-01',
  )
  return {
    runtime: join(ASSET_ROOT, target.filename),
    normalized: join(runRoot, 'normalized', target.filename),
    runRecord: join(runRoot, 'meshy-run.json'),
    packageSummary: join(runRoot, 'validation', 'package-summary.json'),
    staged: join(ASSET_ROOT, `.${target.filename}.jump-next.glb`),
    source: join(SOURCE_DIRECTORY, `${target.id}.glb`),
  }
}

function uniqueNodesByName(document) {
  const nodes = new Map()
  for (const node of document.getRoot().listNodes()) {
    const name = node.getName()
    if (!name) continue
    if (nodes.has(name)) throw new Error(`Duplicate target node: ${name}`)
    nodes.set(name, node)
  }
  return nodes
}

function cloneAccessor(source, targetDocument, targetBuffer) {
  const sourceArray = source.getArray()
  if (!sourceArray) throw new Error(`Missing accessor data: ${source.getName()}`)
  return targetDocument
    .createAccessor(source.getName(), targetBuffer)
    .setType(source.getType())
    .setArray(sourceArray.slice())
    .setNormalized(source.getNormalized())
    .setSparse(source.getSparse())
    .setExtras({ ...source.getExtras() })
}

function animationDuration(animation) {
  let duration = 0
  for (const sampler of animation.listSamplers()) {
    const input = sampler.getInput()
    const times = input?.getArray()
    if (!times?.length) continue
    duration = Math.max(duration, Number(times[times.length - 1]))
  }
  return duration
}

function assertQuaternionAccessor(accessor, label) {
  if (accessor.getType() !== 'VEC4') {
    throw new Error(`${label} must use VEC4 quaternion values`)
  }
  const values = accessor.getArray()
  if (!values) throw new Error(`${label} has no quaternion data`)
  for (let offset = 0; offset < values.length; offset += 4) {
    const length = Math.hypot(
      Number(values[offset]),
      Number(values[offset + 1]),
      Number(values[offset + 2]),
      Number(values[offset + 3]),
    )
    if (!Number.isFinite(length) || Math.abs(length - 1) > 0.002) {
      throw new Error(`${label} has a non-normalized quaternion at ${offset / 4}`)
    }
  }
}

function assertVerticalHipsTranslationAccessor(accessor, label) {
  if (accessor.getType() !== 'VEC3') {
    throw new Error(`${label} must use VEC3 translation values`)
  }
  const values = accessor.getArray()
  if (!values || values.length < 6) {
    throw new Error(`${label} has no translation samples`)
  }
  const start = [Number(values[0]), Number(values[1]), Number(values[2])]
  const endOffset = values.length - 3
  for (let component = 0; component < 3; component += 1) {
    if (
      !Number.isFinite(start[component]) ||
      Math.abs(Number(values[endOffset + component]) - start[component]) > 0.001
    ) {
      throw new Error(`${label} must finish at its authored start translation`)
    }
  }

  let maximumHorizontalDelta = 0
  let minimumVerticalDelta = 0
  for (let offset = 0; offset < values.length; offset += 3) {
    const x = Number(values[offset])
    const y = Number(values[offset + 1])
    const z = Number(values[offset + 2])
    if (![x, y, z].every(Number.isFinite)) {
      throw new Error(`${label} contains a non-finite translation sample`)
    }
    maximumHorizontalDelta = Math.max(
      maximumHorizontalDelta,
      Math.abs(x - start[0]),
      Math.abs(z - start[2]),
    )
    minimumVerticalDelta = Math.min(minimumVerticalDelta, y - start[1])
  }
  if (maximumHorizontalDelta > 0.001) {
    throw new Error(`${label} contains horizontal root travel`)
  }
  if (minimumVerticalDelta > -8) {
    throw new Error(`${label} does not contain the authored deep crouch`)
  }
}

function maximumQuaternionExcursion(accessor) {
  const first = accessor.getElement(0, [])
  let maximum = 0
  for (let index = 0; index < accessor.getCount(); index += 1) {
    const sample = accessor.getElement(index, [])
    const dot = Math.abs(
      sample.reduce(
        (sum, component, componentIndex) =>
          sum + component * first[componentIndex],
        0,
      ),
    )
    maximum = Math.max(maximum, 2 * Math.acos(Math.min(1, dot)))
  }
  return maximum
}

function installJumpAnimation(sourceDocument, targetDocument, targetId) {
  const sourceAnimations = sourceDocument
    .getRoot()
    .listAnimations()
    .filter((animation) => animation.getName() === CLIP_NAME)
  if (sourceAnimations.length !== 1) {
    throw new Error(`${targetId} expected one ${CLIP_NAME} source clip`)
  }
  const sourceAnimation = sourceAnimations[0]
  const duration = animationDuration(sourceAnimation)
  if (Math.abs(duration - EXPECTED_DURATION_SECONDS) > 0.001) {
    throw new Error(
      `${targetId} ${CLIP_NAME} duration is ${duration}, expected ${EXPECTED_DURATION_SECONDS}`,
    )
  }

  for (const [boneName, minimumExcursion] of [
    ['LeftArm', 1.7],
    ['RightArm', 1.7],
    ['LeftForeArm', 0.45],
    ['RightForeArm', 0.45],
  ]) {
    const channel = sourceAnimation
      .listChannels()
      .find(
        (candidate) =>
          candidate.getTargetNode()?.getName() === boneName &&
          candidate.getTargetPath() === 'rotation',
      )
    const output = channel?.getSampler()?.getOutput()
    if (!output || maximumQuaternionExcursion(output) < minimumExcursion) {
      throw new Error(
        `${targetId} ${CLIP_NAME} does not contain the bent-elbow arm drive for ${boneName}`,
      )
    }
  }

  for (const animation of [...targetDocument.getRoot().listAnimations()]) {
    if (animation.getName() === CLIP_NAME) animation.dispose()
  }

  const targetNodes = uniqueNodesByName(targetDocument)
  const targetBuffer =
    targetDocument.getRoot().listBuffers()[0] ??
    targetDocument.createBuffer('scale-encounter-avatar-buffer')
  const targetAnimation = targetDocument.createAnimation(CLIP_NAME)
  const copiedSamplers = new Map()
  const animatedBoneNames = new Set()
  let hipsTranslationCount = 0

  for (const sourceChannel of sourceAnimation.listChannels()) {
    const sourceNode = sourceChannel.getTargetNode()
    const sourceSampler = sourceChannel.getSampler()
    const targetPath = sourceChannel.getTargetPath()
    if (!sourceNode || !sourceSampler) {
      throw new Error(`${targetId} has an incomplete jump channel`)
    }
    const sourceNodeName = sourceNode.getName()
    const isRotation = targetPath === 'rotation'
    const isVerticalHipsTranslation =
      targetPath === 'translation' && sourceNodeName === 'Hips'
    if (!isRotation && !isVerticalHipsTranslation) continue
    const targetNode = targetNodes.get(sourceNodeName)
    if (!targetNode) {
      throw new Error(`${targetId} cannot map jump bone ${sourceNodeName}`)
    }

    let targetSampler = copiedSamplers.get(sourceSampler)
    if (!targetSampler) {
      const input = sourceSampler.getInput()
      const output = sourceSampler.getOutput()
      if (!input || !output) throw new Error(`${targetId} has an incomplete jump sampler`)
      if (isRotation) {
        assertQuaternionAccessor(output, `${targetId}:${sourceNodeName}`)
      } else {
        assertVerticalHipsTranslationAccessor(
          output,
          `${targetId}:${sourceNodeName}:translation`,
        )
      }
      targetSampler = targetDocument
        .createAnimationSampler(sourceSampler.getName())
        .setInput(cloneAccessor(input, targetDocument, targetBuffer))
        .setOutput(cloneAccessor(output, targetDocument, targetBuffer))
        .setInterpolation(sourceSampler.getInterpolation())
      copiedSamplers.set(sourceSampler, targetSampler)
      targetAnimation.addSampler(targetSampler)
    }

    targetAnimation.addChannel(
      targetDocument
        .createAnimationChannel(sourceChannel.getName())
        .setTargetNode(targetNode)
        .setTargetPath(targetPath)
        .setSampler(targetSampler),
    )
    if (isRotation) animatedBoneNames.add(sourceNodeName)
    else hipsTranslationCount += 1
  }

  const skins = targetDocument.getRoot().listSkins()
  if (skins.length !== 1) throw new Error(`${targetId} expected one skin`)
  const jointNames = new Set(skins[0].listJoints().map((joint) => joint.getName()))
  if (
    animatedBoneNames.size !== jointNames.size ||
    [...jointNames].some((name) => !animatedBoneNames.has(name))
  ) {
    throw new Error(
      `${targetId} jump targets ${animatedBoneNames.size}/${jointNames.size} skin joints`,
    )
  }
  if (hipsTranslationCount !== 1) {
    throw new Error(
      `${targetId} jump expected one vertical Hips translation channel`,
    )
  }

  return {
    boneCount: animatedBoneNames.size,
    channelCount: targetAnimation.listChannels().length,
    duration,
    hipsTranslationCount,
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function stageTarget(target) {
  const paths = targetPaths(target)
  const [targetDocument, sourceDocument] = await Promise.all([
    io.read(paths.runtime),
    io.read(paths.source),
  ])
  const beforeClipNames = targetDocument
    .getRoot()
    .listAnimations()
    .map((animation) => animation.getName())
    .filter((name) => name !== CLIP_NAME)
  const jump = installJumpAnimation(sourceDocument, targetDocument, target.id)
  await targetDocument.transform(
    prune({
      keepAttributes: true,
      keepIndices: true,
      propertyTypes: [PropertyType.ACCESSOR],
    }),
  )
  await io.write(paths.staged, targetDocument)

  const verificationDocument = await io.read(paths.staged)
  const afterClipNames = verificationDocument
    .getRoot()
    .listAnimations()
    .map((animation) => animation.getName())
  const expectedClipNames = [...beforeClipNames, CLIP_NAME]
  if (JSON.stringify(afterClipNames) !== JSON.stringify(expectedClipNames)) {
    throw new Error(
      `${target.id} clip set changed unexpectedly: ${afterClipNames.join(', ')}`,
    )
  }
  const jumpAnimations = verificationDocument
    .getRoot()
    .listAnimations()
    .filter((animation) => animation.getName() === CLIP_NAME)
  if (
    jumpAnimations.length !== 1 ||
    jumpAnimations[0].listChannels().some(
      (channel) =>
        channel.getTargetPath() !== 'rotation' &&
        !(
          channel.getTargetPath() === 'translation' &&
          channel.getTargetNode()?.getName() === 'Hips'
        ),
    )
  ) {
    throw new Error(
      `${target.id} staged jump must contain rotations plus one vertical Hips channel`,
    )
  }

  const fileStat = await stat(paths.staged)
  return {
    target,
    paths,
    clips: expectedClipNames,
    bytes: fileStat.size,
    sha256: await sha256(paths.staged),
    jump,
  }
}

async function updateRunMetadata(result) {
  const runRecord = JSON.parse(await readFile(result.paths.runRecord, 'utf8'))
  const output = runRecord.normalization.outputFiles[0]
  output.bytes = result.bytes
  output.clips = result.clips
  output.sha256 = result.sha256
  runRecord.normalization.jumpAuthoring = {
    clip: CLIP_NAME,
    durationSeconds: result.jump.duration,
    channelPolicy: 'joint-rotation-plus-vertical-hips-no-horizontal-root-motion',
    source: `Blender 5.2 procedural keyframes authored per package (${result.jump.boneCount} joints)`,
    tools: [
      'scripts/author-scale-encounter-avatar-jump.py',
      'scripts/install-scale-encounter-avatar-jump.mjs',
    ],
  }
  runRecord.validation.poseAndMotion = 'pending-headed-browser-review-after-jump-authoring'
  await writeFile(result.paths.runRecord, `${JSON.stringify(runRecord, null, 2)}\n`)

  const packageSummary = JSON.parse(
    await readFile(result.paths.packageSummary, 'utf8'),
  )
  packageSummary.output = output
  packageSummary.jumpAuthoring = runRecord.normalization.jumpAuthoring
  await writeFile(
    result.paths.packageSummary,
    `${JSON.stringify(packageSummary, null, 2)}\n`,
  )
}

const stagedResults = []
for (const target of TARGETS) stagedResults.push(await stageTarget(target))

// Every package is fully written and re-read before any reviewed binary is
// replaced. This avoids leaving a mixed clip contract if one Blender source is
// invalid.
for (const result of stagedResults) {
  await rename(result.paths.staged, result.paths.runtime)
  await copyFile(result.paths.runtime, result.paths.normalized)
  await updateRunMetadata(result)
}

const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'))
manifest.generatedAt = new Date().toISOString()
for (const result of stagedResults) {
  const entry = manifest.packages.find((candidate) => candidate.id === result.target.id)
  if (!entry) throw new Error(`Manifest is missing ${result.target.id}`)
  entry.clips = result.clips
  entry.sha256 = result.sha256
}
manifest.runtimePolicy.jump =
  'Land packages include a Blender-authored 0.9 s Jump_Land clip with joint rotations and a vertical-only Hips crouch; the outer runtime root owns the take-off parabola and all horizontal travel.'
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)

for (const result of stagedResults) {
  console.log(
    [
      result.target.id,
      basename(result.paths.runtime),
      `${result.bytes} bytes`,
      `${result.jump.duration.toFixed(3)}s`,
      `${result.jump.channelCount} skeletal channels`,
      result.sha256,
    ].join(' | '),
  )
}
