import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: "meganeura",
  status: 'published',
  kind: "other-prehistoric-animal",
  habitat: "air",
  atmosphere: "air",
  content: { 'zh-CN': zhCN },
  presentation: {
    "cameraLightScale": 1.15,
    "initialYawDegrees": -18,
    "portraitSafeAreaPadding": 0.18,
    "preciseBounds": true,
    "safeAreaPadding": 0.1,
    "shadow": "none",
    "toneMappingExposure": 0.9
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
