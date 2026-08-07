import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import sharp from 'sharp'

import { loadAnimalDefinitions } from './content-data'
import { createViewerModelDescriptor } from '../src/viewer/create-viewer-model-descriptor'
import { createModelPreviewPresentationSignature } from '../src/viewer/model-preview-contract'
import {
  MODEL_PREVIEW_CONTRACT_VERSION,
  MODEL_PREVIEW_MANIFEST_FILE,
  modelPreviewProfiles,
  type ModelPreviewManifest,
} from '../src/viewer/model-preview-profiles'
import {
  fileFingerprint,
  modelPreviewOutputDirectory,
  modelPreviewSourceModel,
  parseModelPreviewTarget,
  requestedAnimalIds,
  resolveRequestedAnimalIds,
  sha256,
} from './model-preview-assets'

const arguments_ = process.argv.slice(2)
const target = parseModelPreviewTarget(arguments_)
const animalIds = await resolveRequestedAnimalIds(
  target,
  requestedAnimalIds(arguments_),
)
const errors: string[] = []
const expectedProductionSignatures = new Map<string, string>()

if (target === 'production') {
  for (const { definition } of await loadAnimalDefinitions()) {
    if (definition.status !== 'published') {
      continue
    }
    const descriptor = createViewerModelDescriptor(
      definition,
      definition.content['zh-CN'].name,
      'model.glb',
    )
    expectedProductionSignatures.set(
      definition.id,
      createModelPreviewPresentationSignature(descriptor),
    )
  }
}

for (const animalId of animalIds) {
  const outputDirectory = modelPreviewOutputDirectory(target, animalId)
  const manifestPath = resolve(
    outputDirectory,
    MODEL_PREVIEW_MANIFEST_FILE,
  )
  let manifest: ModelPreviewManifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ModelPreviewManifest
  } catch (error) {
    errors.push(
      `${animalId}: cannot read ${MODEL_PREVIEW_MANIFEST_FILE} (${error instanceof Error ? error.message : 'unknown error'}).`,
    )
    continue
  }

  if (manifest.animalId !== animalId) {
    errors.push(`${animalId}: manifest animalId is ${manifest.animalId}.`)
  }
  if (manifest.target !== target) {
    errors.push(`${animalId}: manifest target is ${manifest.target}.`)
  }
  if (manifest.contractVersion !== MODEL_PREVIEW_CONTRACT_VERSION) {
    errors.push(
      `${animalId}: preview contract ${manifest.contractVersion} is stale; expected ${MODEL_PREVIEW_CONTRACT_VERSION}.`,
    )
  }
  try {
    const signature = JSON.parse(manifest.presentationSignature) as {
      readonly contractVersion?: number
    }
    if (signature.contractVersion !== MODEL_PREVIEW_CONTRACT_VERSION) {
      errors.push(`${animalId}: presentation signature uses a stale contract.`)
    }
  } catch {
    errors.push(`${animalId}: presentation signature is not valid JSON.`)
  }
  const expectedSignature = expectedProductionSignatures.get(animalId)
  if (
    expectedSignature !== undefined &&
    manifest.presentationSignature !== expectedSignature
  ) {
    errors.push(
      `${animalId}: presentation changed after preview generation; regenerate model previews.`,
    )
  }

  try {
    const source = await fileFingerprint(
      modelPreviewSourceModel(target, animalId),
    )
    if (
      source.bytes !== manifest.sourceModel?.bytes ||
      source.sha256 !== manifest.sourceModel?.sha256
    ) {
      errors.push(
        `${animalId}: source model changed after preview generation; regenerate model previews.`,
      )
    }
  } catch (error) {
    errors.push(
      `${animalId}: cannot inspect source model (${error instanceof Error ? error.message : 'unknown error'}).`,
    )
  }

  for (const profile of modelPreviewProfiles) {
    const record = manifest.profiles?.[profile.key]
    if (!record) {
      errors.push(`${animalId}: manifest is missing ${profile.key}.`)
      continue
    }
    if (
      record.fileName !== profile.fileName ||
      record.width !== profile.width ||
      record.height !== profile.height
    ) {
      errors.push(`${animalId}/${profile.fileName}: manifest profile is stale.`)
    }
    const previewPath = resolve(outputDirectory, profile.fileName)
    try {
      const buffer = await readFile(previewPath)
      const metadata = await sharp(buffer).metadata()
      const alpha = await sharp(buffer)
        .ensureAlpha()
        .extractChannel('alpha')
        .stats()
      const alphaChannel = alpha.channels[0]
      if (
        metadata.width !== profile.width ||
        metadata.height !== profile.height
      ) {
        errors.push(
          `${animalId}/${profile.fileName}: expected ${profile.width}x${profile.height}, got ${metadata.width}x${metadata.height}.`,
        )
      }
      if (
        !metadata.hasAlpha ||
        !alphaChannel ||
        alphaChannel.min !== 0 ||
        alphaChannel.max <= 100 ||
        alphaChannel.mean >= 120
      ) {
        errors.push(
          `${animalId}/${profile.fileName}: transparent model silhouette is invalid.`,
        )
      }
      if (
        record.bytes !== buffer.byteLength ||
        record.sha256 !== sha256(buffer)
      ) {
        errors.push(
          `${animalId}/${profile.fileName}: file does not match its manifest.`,
        )
      }
    } catch (error) {
      errors.push(
        `${animalId}/${profile.fileName}: cannot inspect preview (${error instanceof Error ? error.message : 'unknown error'}).`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error(`Invalid ${target} model previews:`)
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `${target} model previews: ${animalIds.length} animal(s), ${modelPreviewProfiles.length} shared profile(s), source and presentation signatures current.`,
  )
}
