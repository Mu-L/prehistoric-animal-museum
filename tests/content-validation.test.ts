/// <reference types="node" />

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { animal } from '../src/content/animals/stegosaurus/animal'
import { animalDefinition } from '../src/content/animals/stegosaurus/package'
import { provenance } from '../src/content/animals/stegosaurus/provenance'
import { MEBIBYTE_BYTES } from '../src/model-policy'
import {
  inspectGlb,
  inspectWebp,
  sha256,
  validateCollection,
  validateRecordedAsset,
} from '../scripts/content-validation'

const packageRoot = join(
  process.cwd(),
  'src/content/animals/stegosaurus',
)

describe('content asset validation utilities', () => {
  it('reads the production GLB and finds the explicitly declared Idle clip', async () => {
    const model = await readFile(join(packageRoot, 'model/model.glb'))
    const inspection = inspectGlb(model)

    expect(animal.assets.modelBytes).toBe(model.byteLength)
    expect(inspection.version).toBe(2)
    expect(inspection.declaredBytes).toBe(model.byteLength)
    expect(inspection.animationNames).toContain('Idle')
    expect(inspection.cubicSplineRotationTracks).toBe(0)
    expect(inspection.externalUris).toEqual([])
    expect(inspection.triangles).toBe(19_839)
    expect(inspection.drawCalls).toBeLessThanOrEqual(24)
  })

  it('keeps the meshopt-compressed ichthyosaur Idle on safe linear rotation tracks', async () => {
    const model = await readFile(
      join(
        process.cwd(),
        'src/content/animals/ichthyosaur/model/model.glb',
      ),
    )
    const inspection = inspectGlb(model)

    expect(inspection.meshoptCompressed).toBe(true)
    expect(inspection.animationNames).toEqual(['Idle'])
    expect(inspection.cubicSplineRotationTracks).toBe(0)
  })

  it('reads exact WebP dimensions for both authored orientations', async () => {
    const landscape = inspectWebp(
      await readFile(join(packageRoot, 'backgrounds/landscape.webp')),
    )
    const portrait = inspectWebp(
      await readFile(join(packageRoot, 'backgrounds/portrait.webp')),
    )

    expect(landscape).toEqual({ width: 1672, height: 941 })
    expect(portrait).toEqual({ width: 941, height: 1672 })
  })

  it('reports concrete hash and byte mismatches', async () => {
    const modelRecord = provenance[0]
    const model = await readFile(join(packageRoot, modelRecord.assetPath))
    expect(
      validateRecordedAsset(
        modelRecord,
        model.byteLength,
        sha256(model),
        'stegosaurus',
      ),
    ).toEqual([])

    expect(
      validateRecordedAsset(
        modelRecord,
        model.byteLength - 1,
        '0'.repeat(64),
        'stegosaurus',
      ).map(({ code }) => code),
    ).toEqual(
      expect.arrayContaining(['ASSET_HASH_MISMATCH', 'ASSET_SIZE_MISMATCH']),
    )
  })

  it('warns above 12 MiB and blocks only above the 20 MiB GLB ceiling', () => {
    const modelRecord = provenance[0]
    const recordedHash = 'a'.repeat(64)
    const issuesAt13MiB = validateRecordedAsset(
      {
        ...modelRecord,
        runtime: {
          bytes: 13 * MEBIBYTE_BYTES,
          sha256: recordedHash,
        },
      },
      13 * MEBIBYTE_BYTES,
      recordedHash,
      'test-animal',
    )
    const issuesAt21MiB = validateRecordedAsset(
      {
        ...modelRecord,
        runtime: {
          bytes: 21 * MEBIBYTE_BYTES,
          sha256: recordedHash,
        },
      },
      21 * MEBIBYTE_BYTES,
      recordedHash,
      'test-animal',
    )

    expect(issuesAt13MiB.map(({ code }) => code)).toContain(
      'ASSET_TARGET_EXCEEDED',
    )
    expect(issuesAt13MiB.map(({ code }) => code)).not.toContain(
      'ASSET_HARD_CEILING',
    )
    expect(issuesAt21MiB.map(({ code }) => code)).toContain(
      'ASSET_HARD_CEILING',
    )
  })
})

describe('collection validation utility', () => {
  it('accepts the one-item looping published collection', () => {
    expect(
      validateCollection(
        {
          id: 'main',
          animalIds: ['stegosaurus'],
          defaultAnimalId: 'stegosaurus',
          loop: true,
        },
        [animalDefinition],
      ),
    ).toEqual([])
  })

  it('reports duplicates, unknown IDs, a missing default, and non-looping order', () => {
    const issues = validateCollection(
      {
        id: 'broken',
        animalIds: ['stegosaurus', 'stegosaurus', 'unknown'],
        defaultAnimalId: 'missing',
        loop: false,
      },
      [animalDefinition],
    )
    const codes = issues.map(({ code }) => code)

    expect(codes).toEqual(
      expect.arrayContaining([
        'COLLECTION_DUPLICATE',
        'COLLECTION_UNKNOWN_ID',
        'COLLECTION_DEFAULT_MISSING',
        'MAIN_COLLECTION_NOT_LOOPING',
      ]),
    )
  })
})
