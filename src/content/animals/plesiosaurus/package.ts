import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'plesiosaurus',
  status: 'published',
  kind: 'marine-reptile',
  habitat: 'water',
  atmosphere: 'underwater',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 2.2,
    initialYawDegrees: -90,
    landscapeHorizontalOffset: -0.04,
    landscapeVerticalOffset: 0.065,
    portraitHorizontalOffset: -0.04,
    portraitSafeAreaPadding: 0.05,
    portraitVerticalOffset: 0,
    safeAreaPadding: 0.09,
    shadow: 'none',
    toneMappingExposure: 1.3,
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
