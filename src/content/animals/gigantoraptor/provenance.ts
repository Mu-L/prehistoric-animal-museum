import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Gigantoraptor',
      author: 'seth the yutyrannus',
      url: 'https://sketchfab.com/3d-models/gigantoraptor-e51509d66d464104aef1b72c298a40cf',
      accessedOn: '2026-07-28',
      bytes: 4_608_244,
      sha256:
        '3ad3b375aecc4646fe776bd83f7cd916e4cadad7dd0f7a4e2a6aac4f1a76f531',
    },
    runtime: {
      bytes: 4_246_968,
      sha256:
        '44804b2c7ce75ffe7e24809ced163c48bde972c8be1026ee4d00f2321239356c',
    },
    modifications: [
      'Cleared zero-weight joint indices, deduplicated, pruned, and repacked the GLB.',
      'Authored a 6.5-second in-place museum Idle in Blender 5.2 using the existing 79-bone rig; after two local visual reviews, retained body, tail, and jaw motion at 225% of the authored base while increasing head and neck motion to 450% and both arms to 500%.',
      'Injected 29 rotation-only channels for the torso, neck, head, jaw, arms, and tail into the normalized base GLB while preserving its original mesh and skin hierarchy.',
      'Kept the root, hips, and legs stationary to avoid foot sliding.',
      'Validated and reviewed the self-contained derivative.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-29',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.gigantoraptor.landscape,
      runtime: {
        bytes: 233_822,
        sha256:
          'bab0d551f20990e1230c0655cd6fe417e2fe6dd76a83e91f52d1b24ec220d054',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.gigantoraptor.portrait,
      runtime: {
        bytes: 202_316,
        sha256:
          '6bc8a4fce35567552a3fc232ccd21f366f112f3a9ea69d3bb9f3e0198d783964',
      },
    },
  },
  poster: {
    bytes: 72_796,
    sha256:
      '3bc4fdd9bc7c51a245d587c49b3aa5ef484a84aaa7d6636e8a457c622876ff18',
  },
  thumbnail: {
    bytes: 17_634,
    sha256:
      'db670ed5f8df366f4c42b0f65524fdff6ca915449a05ad82b037e157f1ae5003',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 110_925,
    sha256:
      'a341f9f162f939127d2fa30e3a505b8f40eac08b7850ac485838aab58215a405',
  },
})
