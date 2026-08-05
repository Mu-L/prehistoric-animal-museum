import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Apatosaurus Dinosaur',
      author: 'XML-AL16_EMMILIA..',
      url: 'https://sketchfab.com/3d-models/apatosaurus-dinosaur-9c63e4fd2a9842e9882f21b015a8e4a9',
      accessedOn: '2026-07-28',
      bytes: 6_274_036,
      sha256:
        '11c34610b39fd9d0e8a7faa5a8c135e86f0cf68798cb4a32efa26e72f66f4c90',
    },
    runtime: {
      bytes: 2_942_260,
      sha256:
        'ee2e53ec8a6d375388d7674cea0396536937cc024d1b24790ba7cefd0d87d010',
    },
    modifications: [
      'Compressed geometry and animation with high-precision Meshopt and converted embedded PNG textures to lossless WebP for browser delivery.',
      'Removed the presentation ground and stone rim.',
      'Applied the reviewed reversible light silhouette restyle v1.',
      'Added the reviewed project-authored olive-brown material v2 while preserving geometry and UVs.',
      'Desaturated the green cast and shifted the existing 1K body base colour toward a dusty grey-brown olive while preserving mottling, roughness, normal detail, geometry, and UVs.',
      'Added paired project-authored amber-brown eyes with dark pupils and restrained catchlights.',
      'Built a project-authored 15-bone Blender armature with shoulder and hip transition weights repaired to keep the body closed during the full motion.',
      'Repaired the front-leg and mid-belly junction after close-up owner review by matching the upper-leg weights to the stationary shoulder bridge before the neck begins to bend.',
      'Layered irregular broad folds, broken secondary wrinkles, fine pebbled grain, and pores over the retained authored normal map, with restrained matching base-colour relief so the skin detail remains visible in museum lighting.',
      'Authored an eight-second in-place feeding Idle that raises and lowers the head through four neck bones while the distal tail responds vertically and with a small lateral sway; the spine and tail root remain stationary to protect the skin junctions.',
      'Normalized the Blender export to one closed-loop Idle clip with eight rotation-only channels, then repacked, validator-checked, and reviewed the derivative in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-30',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.apatosaurus.landscape,
      runtime: {
        bytes: 245_350,
        sha256:
          '1235b6d22d73e032caccb3b52eea06a0e5388dacde020d53f4bb0c346635867f',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.apatosaurus.portrait,
      runtime: {
        bytes: 238_436,
        sha256:
          '6338039f9ec99739328af1e6095d90f9fe0178e5a28e0d4c80530f84e52feecf',
      },
    },
  },
  poster: {
    bytes: 34_178,
    sha256:
      'ee877b1e83278f1fae323cd9367f11e3d15a19062228391b20a26a61a222f9ac',
  },
  posterPortrait: {
    bytes: 10_390,
    sha256:
      'aac7fd266e93e474de94487d86ed8716d5f95ab76efaa2f4a114ec37b4713f8e',
  },
  thumbnail: {
    bytes: 29_026,
    sha256:
      'e053e50ea967fe692bac12372861d41044428d6039c14af4303a12012494d784',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 100_605,
    sha256:
      '184993cb9bbc6a008eaf336f47314b75ffaab12da8ac2cc570cdec9d00728082',
  },
})
