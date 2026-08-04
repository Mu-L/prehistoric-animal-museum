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
    initialYawDegrees: 180,
    landscapeHorizontalOffset: -0.12,
    portraitHorizontalOffset: -0.1,
    portraitSafeAreaPadding: 0.36,
    safeAreaPadding: 0.18,
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
