import narrationUrl from './audio/narration.zh-CN.mp3'
import landscapeUrl from './backgrounds/landscape.webp'
import portraitUrl from './backgrounds/portrait.webp'
import posterUrl from './images/poster.webp'
import posterPortraitUrl from './images/poster-portrait.webp'
import thumbnailUrl from './images/thumbnail.webp'
import modelUrl from './model/model.glb?url'

import type { AnimalPackage } from '../../types'
import { animalDefinition } from './package'

export const animal = {
  ...animalDefinition,
  assets: {
    model: modelUrl,
    modelBytes: animalDefinition.provenance[0].runtime.bytes,
    poster: posterUrl,
    posterPortrait: posterPortraitUrl,
    thumbnail: thumbnailUrl,
    backgrounds: {
      landscape: landscapeUrl,
      portrait: portraitUrl,
    },
    narration: {
      ...animalDefinition.narration,
      url: narrationUrl,
    },
  },
} satisfies AnimalPackage
