import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'megalodon',
  status: 'published',
  kind: 'other-prehistoric-animal',
  habitat: 'water',
  atmosphere: 'underwater',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 2.1,
    initialYawDegrees: -90,
    landscapeHorizontalOffset: 0,
    landscapeVerticalOffset: 0.04,
    portraitHorizontalOffset: 0,
    portraitSafeAreaPadding: 0.16,
    portraitVerticalOffset: 0.04,
    safeAreaPadding: 0.12,
    preciseBounds: true,
    shadow: 'none',
    toneMappingExposure: 1.34,
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 1,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance,
} satisfies PublishedAnimalDefinition
