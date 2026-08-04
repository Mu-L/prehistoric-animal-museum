import type { PublishedAnimalDefinition } from '../../types'
import { zhCN } from './content.zh-CN'
import { provenance } from './provenance'

export const animalDefinition = {
  id: "mosasaurus",
  status: 'published',
  kind: "marine-reptile",
  habitat: "water",
  atmosphere: "underwater",
  content: { 'zh-CN': zhCN },
  presentation: {
    "initialYawDegrees": 0,
    "portraitSafeAreaPadding": 0.14,
    "safeAreaPadding": 0.1,
    "preciseBounds": true,
    "shadow": "none",
    "toneMappingExposure": 1.16
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
