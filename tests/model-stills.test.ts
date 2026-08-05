/// <reference types="node" />

import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import sharp from 'sharp'
import {
  MODEL_PREVIEW_CONTRACT_VERSION,
  MODEL_PREVIEW_MANIFEST_FILE,
  modelPreviewProfiles,
  type ModelPreviewManifest,
} from '../src/viewer/model-preview-profiles'

describe('transparent model stills', () => {
  it('keeps every generated preview transparent and bound to its manifest', async () => {
    const animalRoot = resolve('src/content/animals')
    const animalIds = (await readdir(animalRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)

    expect(animalIds).toHaveLength(18)

    for (const animalId of animalIds) {
      const imageDirectory = resolve(animalRoot, animalId, 'images')
      const manifest = JSON.parse(
        await readFile(
          resolve(imageDirectory, MODEL_PREVIEW_MANIFEST_FILE),
          'utf8',
        ),
      ) as ModelPreviewManifest
      expect(manifest.animalId).toBe(animalId)
      expect(manifest.contractVersion).toBe(MODEL_PREVIEW_CONTRACT_VERSION)
      expect(manifest.target).toBe('production')

      for (const profile of modelPreviewProfiles) {
        const previewPath = resolve(imageDirectory, profile.fileName)
        const preview = await readFile(previewPath)
        const image = sharp(preview)
        const metadata = await image.metadata()
        const alpha = await image.ensureAlpha().extractChannel('alpha').stats()
        const alphaChannel = alpha.channels[0]!

        expect(metadata.width, `${animalId}/${profile.fileName}`).toBe(
          profile.width,
        )
        expect(metadata.height, `${animalId}/${profile.fileName}`).toBe(
          profile.height,
        )
        expect(metadata.hasAlpha, `${animalId}/${profile.fileName}`).toBe(true)
        expect(alphaChannel.min, `${animalId}/${profile.fileName}`).toBe(0)
        expect(
          alphaChannel.max,
          `${animalId}/${profile.fileName}`,
        ).toBeGreaterThan(100)
        expect(
          alphaChannel.mean,
          `${animalId}/${profile.fileName}`,
        ).toBeLessThan(120)
        expect(manifest.profiles[profile.key]).toMatchObject({
          bytes: preview.byteLength,
          fileName: profile.fileName,
          height: profile.height,
          sha256: createHash('sha256').update(preview).digest('hex'),
          width: profile.width,
        })
      }
    }
  })
})
