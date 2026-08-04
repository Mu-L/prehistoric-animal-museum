import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: 'apatosaurus',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'plains',
  content: { 'zh-CN': zhCN },
  presentation: {
    cameraLightScale: 1.3,
    initialYawDegrees: 0,
    landscapeHorizontalOffset: -0.08,
    landscapeVerticalOffset: 0.025,
    portraitVerticalOffset: 0.04,
    safeAreaPadding: 0.12,
    shadow: 'ground',
    shadowOpacity: 0.54,
    shadowScale: 0.7,
    toneMappingExposure: 1.35,
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
