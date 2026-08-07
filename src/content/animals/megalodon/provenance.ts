import {
  createPublishedAssetProvenance,
  createReviewedEnglishNarrationProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { en } from './content.en'
import { zhCN } from './content.zh-CN'

const baseProvenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Otodus Megalodon updated animations',
      author: 'CanYuTsai',
      url: 'https://sketchfab.com/3d-models/otodus-megalodon-updated-animations-7e65b8c51251440e9aca8385f286714f',
      accessedOn: '2026-07-30',
      bytes: 553_956,
      sha256:
        'e578fe3b1589464526077f33fba1570cf2fc101c354082235f0aaa68dd8cdff4',
    },
    runtime: {
      bytes: 129_936,
      sha256:
        '2ac86e4a499a10d02e6ded5667a69a06c70f5371d624a31bef3abcb64dd53253',
    },
    modifications: [
      'Compressed geometry and animation with high-precision Meshopt and converted embedded PNG textures to lossless WebP for browser delivery.',
      'Retained the source skinned hierarchy, repacked the GLB, and applied a desaturated non-metallic matte aquatic material treatment.',
      'Replaced the source mouth-focused action with a project-authored eight-second in-place full-body swimming Idle at 24 frames per second.',
      'Kept the four head-chain joints nearly stable at approximately 0.15–0.30 degrees while increasing the travelling propulsion wave from roughly 1.2 degrees at the tail root to 8.5 degrees at the tail tip.',
      'Added restrained paired-fin pose changes, exported one closed-loop Idle, validator-checked the result, and reviewed the animated skinned bounds in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-31',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.megalodon.landscape,
      runtime: {
        bytes: 72_840,
        sha256:
          'aa657ffb445db3e9a8994575191f4c1f1f4d0d780ee75b52d3d340c2114cfb77',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.megalodon.portrait,
      runtime: {
        bytes: 43_944,
        sha256:
          '55cd036d199a4acf6fdda4094da805bc948a6e0207b33a121f8434374e0169e6',
      },
    },
  },
  poster: {
    bytes: 39_262,
    sha256:
      '0f0c4cfd1ec6c6ee6f2f0b43afd7f98361932d6c6cdcf1b7edf80fec34b08ca1',
  },
  posterPortrait: {
    bytes: 10_740,
    sha256:
      '94db35be0a98cedecec69515a6f000634fccaf8d3c15ed07a4a2b6b4dc6719e7',
  },
  thumbnail: {
    bytes: 12_814,
    sha256:
      '9efcf57cc6d727740093ab74a8380a6e4d4d87fae1478f467d2634a9d09c7fff',
  },
  narration: {
    generatedOn: '2026-07-30',
    script: zhCN.narration.sentences.join(''),
    bytes: 115_965,
    sha256:
      '84596b867a973ed2416dcff06096a1710984ea9073de22abcb30d2e1950880af',
  },
})

export const provenance = [
  ...baseProvenance,
  createReviewedEnglishNarrationProvenance('megalodon', en),
] as const
