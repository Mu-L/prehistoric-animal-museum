import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'ichthyosaur',
  status: 'published',
  kind: 'marine-reptile',
  habitat: 'water',
  atmosphere: 'underwater',
  content: { 'zh-CN': zhCN },
  presentation: {
    initialYawDegrees: 0,
    landscapeHorizontalOffset: 0,
    portraitHorizontalOffset: 0,
    portraitSafeAreaPadding: 0.1,
    preciseBounds: true,
    safeAreaPadding: 0.1,
    shadow: 'none',
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 0.95,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance,
} satisfies PublishedAnimalDefinition
