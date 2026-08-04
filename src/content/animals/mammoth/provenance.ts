import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: '3D High-poly Baby Woolly Mammoth',
      author: 'SDPM Esare',
      url: 'https://sketchfab.com/3d-models/3d-high-poly-baby-woolly-mammoth-fce1c86ccedf47a5b9627098be6719d5',
      accessedOn: '2026-07-28',
      bytes: 2_987_840,
      sha256:
        '8f46db6e2ba44c109fdc115506e1048212a876b51060930d0e20a8bd9f472aea',
    },
    runtime: {
      bytes: 3_251_408,
      sha256:
        '35e2dba618e3b915f73abd6a965243c4cec6c60ba753be65af816debb48adb01',
    },
    modifications: [
      'Used the original creator’s CC BY 4.0 source rather than the submitted CC BY-NC-SA derivative.',
      'Normalized and repacked the self-contained 1K-texture GLB.',
      'Built a project-authored 8-bone Blender armature with deterministic head, body, four-leg, and two-bone tail weights.',
      'Matched the head and body blend across the disconnected neck surfaces and held the tail root stationary after close-up owner review, preventing either junction from opening during motion.',
      'Authored an eight-second in-place Idle with an approximately 7-degree head pitch and 4-degree turn so the long tusks move clearly, plus a larger distal tail swing.',
      'Normalized the Blender export to one closed-loop Idle clip with two rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-30',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.mammoth.landscape,
      runtime: {
        bytes: 307_886,
        sha256:
          'd456a3b0f0cfedfcd6dc518199eb8e75cbe8ef043dfade64109299e0255a925f',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.mammoth.portrait,
      runtime: {
        bytes: 212_660,
        sha256:
          'dc2df002c5dab82c95534a93dcc0e91b2436dcb01be24667453533e6cd917c34',
      },
    },
  },
  poster: {
    bytes: 95_872,
    sha256:
      '62e8e71e1fd1b981ba5b7b4a2ac9f7a4f7c64dbd5f190428482010901c300094',
  },
  thumbnail: {
    bytes: 29_822,
    sha256:
      '808ccebb327c45ec80fbd0b76c324a1bb42e8a3b03d391e89a3d0f80d42edb56',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 116_925,
    sha256:
      'a771ac8784719d2e1629742f303f6c6c808c88b2a02bfb0b2122b9b96ece52a6',
  },
})
