import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: "rhamphorhynchus",
  status: 'published',
  kind: "pterosaur",
  habitat: "air",
  atmosphere: "air",
  content: { 'zh-CN': zhCN },
  presentation: {
    "cameraLightScale": 1.45,
    "initialYawDegrees": -15,
    "portraitSafeAreaPadding": 0.12,
    "preciseBounds": true,
    "safeAreaPadding": 0.08,
    "shadow": "none",
    "toneMappingExposure": 1.15
  },
  animation: {
    "clip": "Idle",
    "loop": "repeat",
    "speed": 1
  },
  narration: {
    "status": "ready",
    "sourcePath": "audio/narration.zh-CN.mp3",
    "mimeType": "audio/mpeg"
  },
  provenance,
} satisfies PublishedAnimalDefinition
