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
  derivedImagesGeneratedOn: '2026-08-09',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.apatosaurus.landscape,
      runtime: {
        bytes: 288_162,
        sha256:
          '127911897c463d68930bf410859f1f5266a6f48a9ecd0f9fbfae5603cd719530',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.apatosaurus.portrait,
      runtime: {
        bytes: 243_128,
        sha256:
          'ccf6b54755a41c91fc2ea37301f5fae8e1a2336e7299e2da23901b3de6a4cb90',
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
    bytes: 21_368,
    sha256:
      'b49df1bfc7837a8b9a14c1054d9b5e898734e9ef9caae59541c37f3bc91d63cf',
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
