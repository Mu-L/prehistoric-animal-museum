import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

export const scaleEncounterChildReviewVariantIds = [
  'boy-land-explorer',
  'girl-land-explorer',
  'boy-snow-expedition',
  'girl-snow-expedition',
  'boy-air-wingsuit',
  'girl-air-wingsuit',
  'boy-water-diver',
  'girl-water-diver',
] as const

export const scaleEncounterPrivateReviewMarkers = [
  'surface-land-',
  'surface-water-',
  'surface-snow-',
  'avatar-review-candidate',
  'environment-review-candidate',
  'child-avatar-v3-',
  'child-avatar-review-candidates',
  ...scaleEncounterChildReviewVariantIds.flatMap((variantId) => [
    `child-avatar-v4-${variantId}-review-v01`,
    `scale-encounter-child-${variantId}-review-candidate`,
  ]),
] as const

export interface ForbiddenProductionMarkerFinding {
  readonly distributionPath: string
  readonly marker: string
}

export async function collectProductionFiles(
  directory: string,
): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectProductionFiles(absolutePath)))
    } else if (entry.isFile()) {
      files.push(absolutePath)
    }
  }

  return files
}

export async function findForbiddenProductionMarkers(
  distributionRoot: string,
  markers: readonly string[] = scaleEncounterPrivateReviewMarkers,
  files?: readonly string[],
): Promise<ForbiddenProductionMarkerFinding[]> {
  const distributionFiles = files ?? (await collectProductionFiles(distributionRoot))
  const findings: ForbiddenProductionMarkerFinding[] = []

  for (const absolutePath of distributionFiles) {
    const source = await readFile(absolutePath)
    const distributionPath = relative(distributionRoot, absolutePath)
    for (const marker of markers) {
      if (
        distributionPath.includes(marker) ||
        source.includes(Buffer.from(marker))
      ) {
        findings.push({ distributionPath, marker })
      }
    }
  }

  return findings
}
