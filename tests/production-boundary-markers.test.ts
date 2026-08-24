import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  findForbiddenProductionMarkers,
  scaleEncounterChildReviewVariantIds,
} from '../scripts/production-boundary-markers'

const privateScaleEncounterMutations = [
  ...(['land', 'water', 'snow'] as const).map((theme) => ({
    expectedMarker: `surface-${theme}-`,
    injected: `surface-${theme}-albedo-2048.webp`,
  })),
  { expectedMarker: 'avatar-review-candidate', injected: 'avatar-review-candidate' },
  {
    expectedMarker: 'environment-review-candidate',
    injected: 'environment-review-candidate',
  },
  {
    expectedMarker: 'child-avatar-v3-',
    injected: 'child-avatar-v3-boy-land-normal.glb',
  },
  {
    expectedMarker: 'child-avatar-review-candidates',
    injected: 'child-avatar-review-candidates.glb',
  },
  ...scaleEncounterChildReviewVariantIds.flatMap((variantId) => [
    {
      expectedMarker: `child-avatar-v4-${variantId}-review-v01`,
      injected: `child-avatar-v4-${variantId}-review-v01.glb`,
    },
    {
      expectedMarker: `scale-encounter-child-${variantId}-review-candidate`,
      injected: `scale-encounter-child-${variantId}-review-candidate`,
    },
  ]),
] as const

describe('production boundary private scale-encounter markers', () => {
  it.each(privateScaleEncounterMutations)(
    'detects $injected when a safe distribution fixture is mutated',
    async ({ expectedMarker, injected }) => {
      const fixtureRoot = await mkdtemp(
        join(tmpdir(), 'museum-production-boundary-'),
      )
      try {
        const assetDirectory = join(fixtureRoot, 'assets')
        const bundlePath = join(assetDirectory, 'app.js')
        await mkdir(assetDirectory)
        await writeFile(bundlePath, 'console.log("production-safe")')
        await expect(
          findForbiddenProductionMarkers(fixtureRoot),
        ).resolves.toEqual([])

        await writeFile(
          bundlePath,
          `console.log("production-safe", ${JSON.stringify(injected)})`,
        )
        const findings = await findForbiddenProductionMarkers(fixtureRoot)
        expect(findings).toContainEqual({
          distributionPath: 'assets/app.js',
          marker: expectedMarker,
        })
      } finally {
        await rm(fixtureRoot, { force: true, recursive: true })
      }
    },
  )
})
