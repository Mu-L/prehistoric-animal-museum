import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'maiasaura',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'plains',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 1.4,
    initialYawDegrees: -90,
    landscapeVerticalOffset: 0.04,
    portraitVerticalOffset: 0.04,
    portraitSafeAreaPadding: 0.12,
    safeAreaPadding: 0.14,
    preciseBounds: true,
    shadow: 'ground',
    shadowOpacity: 0.38,
    shadowScale: 0.32,
    shadowDepthScale: 0.8,
    shadowHorizontalOffset: -0.98,
    shadowYOffset: -0.04,
    toneMappingExposure: 1.08,
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
