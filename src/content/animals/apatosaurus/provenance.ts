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
      title: 'Apatosaurus',
      author: 'toro ardido modelos 3d',
      url: 'https://sketchfab.com/3d-models/apatosaurus-fecabec8e4ef42ef98b5480dbf50c57d',
      accessedOn: '2026-08-04',
      bytes: 10_558_696,
      sha256:
        '0c87a0892d859b42693c3558b8194047f4003fb164235154199ad9bdd5c07eb1',
    },
    runtime: {
      bytes: 3_513_136,
      sha256:
        '9d9f151933a33ae5824eb7532e16a7416b012b9ffff154aca2957ad37a2a540a',
    },
    modifications: [
      'Compressed geometry and animation with high-precision Meshopt and converted embedded PNG textures to lossless WebP for browser delivery.',
      'Removed the source 127-bone rig and its inert animation, then welded 792 exactly coincident vertices at a 1e-7 threshold while preserving the UV corner data.',
      'Preserved the accepted source base colour and authored new 1K ORM and tangent-space normal maps with deterministic multiscale skin relief.',
      'Normalized the animal to a 3.2-unit total length with canonical transforms, centred horizontal bounds, and all four feet resting on the ground plane.',
      'Authored one eight-second in-place morph-target Idle at 24 frames per second; all feet and lower limbs remain fixed, the loop closes exactly, and the head and open mouth move as one rigid region.',
      'Verified zero foot drift, ground penetration, seam separation, new BVH overlap, collapsed triangles, and flipped triangles, then validator-checked and reviewed the derivative in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-08-05',
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
    bytes: 35_888,
    sha256:
      '0f48f330cc86e1214dbbf61172666c7c7f0902b2572a01faaa32ed19caa3b422',
  },
  posterPortrait: {
    bytes: 10_528,
    sha256:
      'a63885f1e8ffde809a84d285e62518190d3bed699b0cbe4ad4744b9204282150',
  },
  thumbnail: {
    bytes: 13_988,
    sha256:
      '905e57b6204e47d5486e25c1862b4d9a4c1fb3786dc19743b0a12ec5f3e7dc80',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 100_605,
    sha256:
      '184993cb9bbc6a008eaf336f47314b75ffaab12da8ac2cc570cdec9d00728082',
  },
})

export const provenance = [
  ...baseProvenance,
  createReviewedEnglishNarrationProvenance('apatosaurus', en),
] as const
