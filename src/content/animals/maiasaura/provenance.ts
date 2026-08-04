import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Maiasaura With Rig',
      author: 'Dino Dan',
      url: 'https://sketchfab.com/3d-models/maiasaura-with-rig-3da9f211ae304bd0afd1d15a290eabbd',
      accessedOn: '2026-07-26',
      bytes: 2_290_700,
      sha256:
        'd9d33b82d3dbfb2b813dcd09f63644bae7d28523e16a0ae8d867638a84a1dfa5',
    },
    runtime: {
      bytes: 2_379_688,
      sha256:
        '160336c4d22f9ff8ea3b2885664862817dab28da21a10db390c46ec663fc1e1b',
    },
    modifications: [
      'Normalized and repacked the self-contained GLB while retaining the source 87-bone rig.',
      'Replaced the cyan-orange toy-like colour treatment with a project-authored warm brown back, pale underside, dark dorsal markings, multiscale mottling, higher roughness, and a clearer skin normal surface.',
      'Authored an eight-second in-place Idle at 24 frames per second with visibly increased torso, head, neck, forelimb, and full-tail motion while retaining stable four-foot contact.',
      'Exported a single closed-loop Idle, validator-checked the result, and reviewed the animated skinned bounds in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-31',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.maiasaura.landscape,
      runtime: {
        bytes: 336_442,
        sha256:
          '57da28e0040da8a8dcc53779a1fa1d43f68a76930ef75cdb6ea57a07b013b4d3',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.maiasaura.portrait,
      runtime: {
        bytes: 265_958,
        sha256:
          'd615b288525fc0d144b5a3a0bb17a17439fa81f68323861e9378fd206105fd58',
      },
    },
  },
  poster: {
    bytes: 137_848,
    sha256:
      'c42118866446377c1aa7b7f8e913c610fa2ecd90fc2bfad60e3d7906d08793fa',
  },
  thumbnail: {
    bytes: 39_876,
    sha256:
      '3ef34141efde41bd3b1afce81942662b125fbbec22073b7c6cd5bb18e71cc908',
  },
  narration: {
    generatedOn: '2026-07-30',
    script: zhCN.narration.sentences.join(''),
    bytes: 120_525,
    sha256:
      'c5d2a33d9dab17e968e5e87e40b4f2ff7d0d2e82ee0da3b8d46091da0c1dc970',
  },
})
