import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Triceratops dinosaur',
      author: 'wojciechmiedziocha',
      url: 'https://sketchfab.com/3d-models/triceratops-dinosaur-87527079bad44917ab1b98a456b46c7e',
      accessedOn: '2026-07-28',
      bytes: 4_463_796,
      sha256:
        '4ba06e329788e30c166b22edb1a92f68c6220aafa891d7fbdaca577e34c49460',
    },
    runtime: {
      bytes: 4_433_888,
      sha256:
        'b41ec3c7a48a0c40376280bdb972b7a78f3f54545839909276ee81fdf54218a1',
    },
    modifications: [
      'Normalized and repacked the self-contained 1K-texture GLB.',
      'Built a project-authored 10-bone Blender armature and deterministic skin weights, including stationary four-leg bones.',
      'Authored an eight-second in-place Idle with an approximately 11-degree side-to-side head turn, a subtle nod, and a progressive distal tail wave while the tail root remains stationary over the hips.',
      'Repaired the rear-leg and tail-root junction after close-up owner review by extending the stationary pelvis weights through the disconnected skin overlap.',
      'Normalized the Blender export to one closed-loop Idle clip with four rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-30',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.triceratops.landscape,
      runtime: {
        bytes: 275_156,
        sha256:
          'bcccc2b41059d1a9b93c7f76193ff5d83c7fa0627c1945bd3c2c30c4a7b6a051',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.triceratops.portrait,
      runtime: {
        bytes: 195_746,
        sha256:
          '1c79aacc9a55f44e630965168b88e15c2f662092ff503210157eb348588598c1',
      },
    },
  },
  poster: {
    bytes: 94_028,
    sha256:
      'cdac7674892c94f6e5d24fe500b030c7bbae712f2d0de644e446a19d68f2a9da',
  },
  thumbnail: {
    bytes: 22_452,
    sha256:
      'cbcafa5f695ab674197261316c51052d093ae021f8f2df90725cf0625e92c34c',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 95_565,
    sha256:
      '2b4c55c486e1050dc28a0d715d88b8b6d7f78ce9215ca9fe8b6451ea2a92a25f',
  },
})
