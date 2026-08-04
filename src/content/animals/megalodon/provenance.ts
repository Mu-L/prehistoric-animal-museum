import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
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
      bytes: 248_844,
      sha256:
        'b6a5957240770e61f91022189a8e95c65a0548313f59ecaba0b431c31e47dffa',
    },
    modifications: [
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
    bytes: 44_034,
    sha256:
      'bdec8c589eaaf437e8ac734e54cfb576443ae2bb1d5d4f26b3753989f7696993',
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
