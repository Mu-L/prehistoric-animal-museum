import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'pteranodon',
  status: 'published',
  kind: 'pterosaur',
  habitat: 'air',
  atmosphere: 'air',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 1.5,
    initialYawDegrees: -20,
    safeAreaPadding: 0.05,
    shadow: 'none',
    toneMappingExposure: 1.35,
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 0.7,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance,
} satisfies PublishedAnimalDefinition
