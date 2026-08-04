import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: "sauropelta",
  status: 'published',
  kind: "dinosaur",
  habitat: "land",
  atmosphere: "plains",
  content: { 'zh-CN': zhCN },
  presentation: {
    "initialYawDegrees": 0,
    "portraitSafeAreaPadding": 0.14,
    "safeAreaPadding": 0.12,
    "preciseBounds": true,
    "shadow": "ground",
    "shadowOpacity": 0.32,
    "shadowScale": 0.58,
    "toneMappingExposure": 1.08
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
