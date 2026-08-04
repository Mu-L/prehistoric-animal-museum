import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Pteranodon (Animated)',
      author: 'Chistodrako._. / Oscar López Riviello',
      url: 'https://sketchfab.com/3d-models/pteranodon-animated-7d7683df41d1405283f160e81a5dff1b',
      accessedOn: '2026-07-26',
      bytes: 7_485_240,
      sha256:
        '2a28d2d47b2fd85d5beffdee24c44a58541edefa40f5edc439270e55e38c44bf',
    },
    runtime: {
      bytes: 5_972_396,
      sha256:
        '086892bd31143e06329a4d21f8d675c799412b164d37f86327ba3c391fa04594',
    },
    modifications: [
      'Converted legacy material data and cleared zero-weight joint indices.',
      'Used Blender 5.2 to transfer the source flying action onto the normalized runtime rig, rebase the root to the museum rest origin, and reduce its translation to 3.5%.',
      'Retained the repaired in-place flight loop as the single Idle clip.',
      'Deduplicated, pruned, repacked, validated, and reviewed the derivative.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-29',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.pteranodon.landscape,
      runtime: {
        bytes: 103_742,
        sha256:
          'c5c6d6b3cf886f229b3048af4da27f09abef8b28ef413d343fad9cb57817f902',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.pteranodon.portrait,
      runtime: {
        bytes: 105_390,
        sha256:
          '6badc6d22b404f6c11f6e4ff4bef8cdb28104a538d91d0d6124fe7d144c93e75',
      },
    },
  },
  poster: {
    bytes: 10_198,
    sha256:
      'ccf0761ae4106bd6d69f28e2777ef01aecb4789cff2b1296e81cd017efa7b67f',
  },
  thumbnail: {
    bytes: 3_056,
    sha256:
      '5fac69df7fbd6377d4f454080b3717de7b64f645054c4808725589e1a5f106ac',
  },
  narration: {
    generatedOn: '2026-07-27',
    script: zhCN.narration.sentences.join(''),
    bytes: 95_325,
    sha256:
      'e8fa6768126c25200fb3f1eb5aefb708e4fbf6b8636eacb1acc3a47425499d74',
  },
})
