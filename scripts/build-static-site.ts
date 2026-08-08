import { copyFile, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'vite'
import sharp from 'sharp'

import { writeLocalizedMuseumPrerenders } from './prerender-localized-museum'
import type { InitialAppState } from '../src/app-bootstrap'
import { pilotAnimalDetailIds } from '../src/content/pilot-animal-details'

const projectRoot = resolve(import.meta.dirname, '..')
const outputDirectory = resolve(projectRoot, 'dist')
const serverOutputDirectory = resolve(projectRoot, '.prerender-ssr')
const modeIndex = process.argv.indexOf('--mode')
const mode = modeIndex === -1 ? 'production' : (process.argv[modeIndex + 1] ?? 'production')

async function copyPilotDetailAssets(): Promise<void> {
  for (const animalId of pilotAnimalDetailIds) {
    const targetDirectory = resolve(outputDirectory, 'animals', animalId)
    await mkdir(targetDirectory, { recursive: true })
    const animalDirectory = resolve(
      projectRoot,
      'src/content/animals',
      animalId,
    )
    const hero = await sharp(
      resolve(animalDirectory, 'backgrounds/landscape.webp'),
    )
      .resize(1200, 675, { fit: 'cover' })
      .composite([
        { input: resolve(animalDirectory, 'images/poster.webp') },
      ])
      .webp({ effort: 5, quality: 86 })
      .toBuffer()
    const heroPortrait = await sharp(
      resolve(animalDirectory, 'backgrounds/portrait.webp'),
    )
      .resize(390, 844, { fit: 'cover' })
      .composite([
        {
          input: resolve(
            animalDirectory,
            'images/poster-portrait.webp',
          ),
        },
      ])
      .webp({ effort: 5, quality: 86 })
      .toBuffer()

    await Promise.all([
      copyFile(
        resolve(animalDirectory, 'images/thumbnail.webp'),
        resolve(targetDirectory, 'thumbnail.webp'),
      ),
      sharp(hero).toFile(resolve(targetDirectory, 'hero.webp')),
      sharp(heroPortrait).toFile(
        resolve(targetDirectory, 'hero-portrait.webp'),
      ),
      sharp(hero)
        .resize(1200, 630, { fit: 'cover' })
        .webp({ effort: 5, quality: 86 })
        .toFile(resolve(targetDirectory, 'social.webp')),
    ])
  }
}

try {
  await build({
    configFile: resolve(projectRoot, 'vite.config.ts'),
    mode,
    root: projectRoot,
  })
  await build({
    build: {
      copyPublicDir: false,
      emptyOutDir: true,
      outDir: serverOutputDirectory,
      ssr: resolve(projectRoot, 'src/entry-server.tsx'),
    },
    configFile: resolve(projectRoot, 'vite.config.ts'),
    mode,
    root: projectRoot,
  })

  const serverEntryUrl = pathToFileURL(
    resolve(serverOutputDirectory, 'entry-server.js'),
  )
  serverEntryUrl.searchParams.set('build', String(Date.now()))
  const serverEntry = (await import(serverEntryUrl.href)) as {
    readonly renderMuseumApp: (state: InitialAppState) => string
  }

  await writeLocalizedMuseumPrerenders(
    outputDirectory,
    serverEntry.renderMuseumApp,
  )
  await copyPilotDetailAssets()
} finally {
  await rm(serverOutputDirectory, { force: true, recursive: true })
}
