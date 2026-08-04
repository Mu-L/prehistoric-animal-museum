import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'PBR Pachycephalasaurus Animated',
      author: 'Ferocious Industries',
      url: 'https://sketchfab.com/3d-models/pbr-pachycephalasaurus-animated-6eea5cee4afa4730bf75c6329a43e56d',
      accessedOn: '2026-07-26',
      bytes: 14_237_440,
      sha256:
        '4ded387365fb9005dc07516658b982001e6e5c2794d5211bd9885dd12d6ddefd',
    },
    runtime: {
      bytes: 8_310_424,
      sha256:
        'ce3990fd6260a1743bccf0768a74c6f4aa79a41309f11fb1285635dbd0a88c92',
    },
    modifications: [
      'Converted legacy material data to metallic/roughness.',
      'Cleared zero-weight joint indices and retained the presentation-safe Idle clip.',
      'Deduplicated, pruned, repacked, validated, and reviewed the derivative.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-29',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.pachycephalosaurus.landscape,
      runtime: {
        bytes: 367_396,
        sha256:
          'd75b12b1689c68ff0c878ea1c8f2c561f26bdbcc5b51f2c0898d9713a2a161f6',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.pachycephalosaurus.portrait,
      runtime: {
        bytes: 264_054,
        sha256:
          '21e18496811c876627a68d4335caac671e920a1300604050e80786a3ccfab6d2',
      },
    },
  },
  poster: {
    bytes: 103_818,
    sha256:
      '8af0f8ff4ec557084ea0427af5000683eee3f46c3ee232ef14d68a31456a5dec',
  },
  thumbnail: {
    bytes: 22_934,
    sha256:
      'ef29131bb29b87321ab742f816f3f67c9e53cbb3905f4ebbfb786ec2cc7792d8',
  },
  narration: {
    generatedOn: '2026-07-27',
    script: zhCN.narration.sentences.join(''),
    bytes: 101_325,
    sha256:
      'dbf97da7d938cf41f28e060f3d7cffe898e0be2ffd3883af1211a4b878171de2',
  },
})
