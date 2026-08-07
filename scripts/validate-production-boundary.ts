import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

import { mainCollection } from '../src/content/collections/main'
import { supportedLocales } from '../src/i18n/locale'
import { localReviewAssetPrefix } from './review-assets'
import { unprefixedRouteMarker } from './review-server-security'

const distributionRoot = join(process.cwd(), 'dist')
const forbiddenMarkers = [
  unprefixedRouteMarker(localReviewAssetPrefix),
  '.handoff/collection-review',
  'assets/candidates',
  'parasaurolophus',
  '副栉龙',
] as const

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)))
    } else if (entry.isFile()) {
      files.push(absolutePath)
    }
  }

  return files
}

const findings: string[] = []
const files = await collectFiles(distributionRoot)

for (const absolutePath of files) {
  const source = await readFile(absolutePath)
  const distributionPath = relative(distributionRoot, absolutePath)
  for (const marker of forbiddenMarkers) {
    if (
      distributionPath.includes(marker) ||
      source.includes(Buffer.from(marker))
    ) {
      findings.push(`${distributionPath}: ${marker}`)
    }
  }
}

const glbFiles = files.filter((file) => extname(file) === '.glb')
const mp3Files = files.filter((file) => extname(file) === '.mp3')
const sourceMaps = files.filter((file) => extname(file) === '.map')
const expectedAnimalAssetCount = mainCollection.animalIds.length
const expectedNarrationAssetCount =
  expectedAnimalAssetCount * supportedLocales.length
if (glbFiles.length !== expectedAnimalAssetCount) {
  findings.push(
    `expected exactly ${expectedAnimalAssetCount} production GLBs; found ${glbFiles.length}`,
  )
}
if (mp3Files.length !== expectedNarrationAssetCount) {
  findings.push(
    `expected exactly ${expectedNarrationAssetCount} reviewed locale MP3s; found ${mp3Files.length}`,
  )
}
if (sourceMaps.length !== 0) {
  findings.push(`expected 0 production source maps; found ${sourceMaps.length}`)
}

if (findings.length > 0) {
  console.error(
    'Production distribution contains local-review animal or asset material:',
  )
  for (const finding of findings) {
    console.error(`- ${finding}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `Production boundary: ${files.length} artifact(s) scanned, ${glbFiles.length} GLBs, ${mp3Files.length} MP3s, 0 source maps, 0 private review marker(s).`,
  )
}
