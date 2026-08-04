import narrationUrl from './audio/narration.zh-CN.mp3'
import landscapeUrl from './backgrounds/landscape.webp'
import portraitUrl from './backgrounds/portrait.webp'
import posterUrl from './images/poster.webp'
import thumbnailUrl from './images/thumbnail.webp'
import modelUrl from './model/model.glb?url'

import { createRuntimeAnimal } from '../../create-runtime-animal'
import { animalDefinition } from './package'

export const animal = createRuntimeAnimal(animalDefinition, {
  backgroundLandscape: landscapeUrl,
  backgroundPortrait: portraitUrl,
  model: modelUrl,
  narration: narrationUrl,
  poster: posterUrl,
  thumbnail: thumbnailUrl,
})
