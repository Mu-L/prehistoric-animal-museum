import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'mammoth',
  status: 'published',
  kind: 'other-prehistoric-animal',
  habitat: 'land',
  atmosphere: 'ice',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 2.2,
    initialYawDegrees: -35,
    safeAreaPadding: 0.12,
    shadow: 'ground',
    toneMappingExposure: 1.75,
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 0.9,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance,
} satisfies PublishedAnimalDefinition
