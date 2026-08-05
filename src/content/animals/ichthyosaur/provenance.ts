import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'ichthyosaur',
      author: 'pro_alba',
      url: 'https://sketchfab.com/3d-models/ichthyosaur-dffbc77b634a408f91dd5f68df4cc94f',
      accessedOn: '2026-07-26',
      bytes: 909_272,
      sha256:
        '6df622c0a988c9fc3c7323c5c827990c12c111a0c4e5fa159df9026340d624db',
    },
    runtime: {
      bytes: 814_000,
      sha256:
        'ec57d74faea3f4de14cae1bb639dbc027d9d734bc55ea6d48ce0c72164fba0de',
    },
    modifications: [
      'Compressed geometry and animation with high-precision Meshopt and converted embedded PNG textures to lossless WebP for browser delivery.',
      'Normalized the source GLB and retained the gentle swimming Idle clip.',
      'Added the reviewed project-authored 1K irregular slate-grey material v2.',
      'Added a project-authored v3 aquatic skin surface with a subtly detailed 1K base colour, 512-pixel dermal normal map, and 512-pixel matte roughness variation; the detail uses fine irregular grain, shallow longitudinal folds, and pores without fish scales or a glossy plastic finish.',
      'Replaced the source key timing with a six-second continuous natural-swim Idle: ten tail and caudal-fin bones form a three-cycle travelling wave at 0.5 Hz, progressively increasing from approximately 1.8 to 16 degrees, while the four fins make restrained coordinated motions.',
      'Sampled the Idle at 12 frames per second with linear interpolation so the distal tail reverses direction smoothly without holding near either extreme; the longest near-static interval measured across the tail chain is approximately 0.17 seconds.',
      'Normalized the derivative to one closed-loop Idle with 24 rotation-only channels, then repacked, validator-checked, and reviewed it in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-30',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.ichthyosaur.landscape,
      runtime: {
        bytes: 140_068,
        sha256:
          '8bf2ad8aa97c77de62f077937f349c9ea46ba4594c7893051a20f9c613af29ec',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.ichthyosaur.portrait,
      runtime: {
        bytes: 170_770,
        sha256:
          '3ae5a51044ab7b19e5df36c3ed0276f70e003960bcb849a176ef50155ccc512f',
      },
    },
  },
  poster: {
    bytes: 41_064,
    sha256:
      'ae9eb1b51fa836bf8e3c0628e609a1b6b82674d38e7a4b405956f9560d131260',
  },
  posterPortrait: {
    bytes: 14_642,
    sha256:
      'dc089ed3580fc58f7811d0854840120faa981965161fbc5b69141e12753244c3',
  },
  thumbnail: {
    bytes: 17_520,
    sha256:
      '92da9f1da8c3b76a6776200255ab7ec18e486bbb0ef2b6cf20c3bd8d52e3e843',
  },
  narration: {
    generatedOn: '2026-07-27',
    script: zhCN.narration.sentences.join(''),
    bytes: 94_365,
    sha256:
      '5ab57bd9221ab75280f8020b5c01353447a345e1428d99b455bfdc71492a02a1',
  },
})
