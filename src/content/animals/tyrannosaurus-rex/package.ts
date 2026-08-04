import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'tyrannosaurus-rex',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'forest',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 1.3,
    initialYawDegrees: -90,
    safeAreaPadding: 0.12,
    shadow: 'ground',
    toneMappingExposure: 1.12,
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
