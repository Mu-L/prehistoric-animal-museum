import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Plesiosaure',
      author: 'leo kerjean',
      url: 'https://sketchfab.com/3d-models/plesiosaure-2f59d503e0754c9d9e157a90ed415c38',
      accessedOn: '2026-07-30',
      bytes: 5_663_868,
      sha256:
        '56fe092e5b769fde877805e484fc4f077ac1e51ab31f6d0b34b0560857e5f94d',
    },
    runtime: {
      bytes: 9_255_684,
      sha256:
        '3273d197a1119a0b9c12acdf53435b166b45ab1c4341709eaebd3dd0cbf9cce6',
    },
    modifications: [
      'Retained the source hierarchy and display scale while repacking the model as a self-contained runtime GLB.',
      'Applied a desaturated matte aquatic material treatment and added restrained eye sockets, amber irises, dark pupils, and small catchlights to the existing texture atlas.',
      'Authored four project morph targets that relax the permanently up-curved neck, add a head-to-shoulder elliptical neck motion, and move all four flippers independently.',
      'Built a single eight-second Idle at 24 frames per second with two complete swimming cycles, smooth phase transitions, and no locomotion.',
      'Validator-checked the result and reviewed the full neck, tail, eye, and flipper silhouettes in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-31',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.plesiosaurus.landscape,
      runtime: {
        bytes: 42_220,
        sha256:
          '36cc7edcf6f34366420c7fe98ed064656cd265377fb18829e385124d53c3db9f',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.plesiosaurus.portrait,
      runtime: {
        bytes: 62_060,
        sha256:
          'a36bdf51a3f4ccb72f6c9f97bf13fef2de1c62af6ebd531b0567667fc001986e',
      },
    },
  },
  poster: {
    bytes: 37_610,
    sha256:
      '59b0fa88da7566904db1fbc5ceb2424fcbbcc26b79fce9310e09ce90d2f7b307',
  },
  thumbnail: {
    bytes: 10_240,
    sha256:
      'd3a8a78427341bd74fd0957aa98704f9b0c12d1a994c54e039a688f2fb67b32e',
  },
  narration: {
    generatedOn: '2026-07-30',
    script: zhCN.narration.sentences.join(''),
    bytes: 137_325,
    sha256:
      '7f09a3074e675a5e0b5c30b7880af8e2b80acb20308e32356998169630dc9557',
  },
})
