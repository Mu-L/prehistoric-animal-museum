import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'stegosaurus',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'forest',
  content: {
    'zh-CN': zhCN,
  },
  presentation: {
    initialYawDegrees: -90,
    landscapeVerticalOffset: 0.02,
    portraitVerticalOffset: 0.035,
    safeAreaPadding: 0.08,
    shadow: 'ground',
    shadowOpacity: 0.56,
    shadowScale: 0.7,
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 0.8,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance,
} satisfies PublishedAnimalDefinition
