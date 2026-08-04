import {
  createPublishedAssetProvenance,
  reviewedBackgroundSources,
} from '../../provenance-helpers'
import { zhCN } from './content.zh-CN'

export const provenance = createPublishedAssetProvenance({
  animalName: zhCN.name,
  model: {
    source: {
      title: 'Tyrant King - Tyrannosaurus',
      author: 'Marcel Schanz',
      url: 'https://sketchfab.com/3d-models/tyrant-king-tyrannosaurus-6465a297fa784598adc49f6e0042d449',
      accessedOn: '2026-07-28',
      bytes: 9_556_672,
      sha256:
        '6d2dee6ffe15e8ea30a87d71a466c14db68220c97f1bed6a8800532196a64705',
    },
    runtime: {
      bytes: 9_538_404,
      sha256:
        'd98e26321f43323f3d38603d432357cb51e18054688c0d191ab1c06e586117a8',
    },
    modifications: [
      'Normalized and repacked the self-contained 1K-texture GLB.',
      'Lifted the Body base-colour texture midtones with a 0.80 luminance gamma and a maximum 1.50 channel scale after a second owner review; mouth, normal, roughness, and other PBR textures were left unchanged.',
      'Re-encoded the adjusted 1K Body base-colour texture as high-quality 4:4:4 JPEG.',
      'Built a project-authored 13-bone Blender armature and deterministic skin weights, with stationary root and leg bones to keep both feet planted.',
      'Reassigned both detached fingernail components on each forelimb to the same arm bone as their corresponding fingers after close-up owner review.',
      'Authored an eight-second in-place Idle with visible spine, neck, head, arm, and four-bone tail motion plus a controlled two-pulse bite whose lower-jaw opening remains at or below approximately 4 degrees.',
      'Separated lower-jaw skin, teeth, and tongue membership from the upper palate after close-up owner review so the skin and teeth follow their respective jaw surfaces throughout both opening-and-closing pulses.',
      'Normalized the Blender export to one closed-loop Idle clip with ten rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.',
    ],
  },
  derivedImagesGeneratedOn: '2026-07-30',
  backgrounds: {
    landscape: {
      source: reviewedBackgroundSources.tyrannosaurusRex.landscape,
      runtime: {
        bytes: 442_240,
        sha256:
          'cec9d34c53add94b69722070e6c6770e0c895b74e3b5b7c5baaa44594651a07f',
      },
    },
    portrait: {
      source: reviewedBackgroundSources.tyrannosaurusRex.portrait,
      runtime: {
        bytes: 375_250,
        sha256:
          '22401aa059bc68043519cd28237267231ebcb5dd2ba3cc6f3c8dab3e18cf22d8',
      },
    },
  },
  poster: {
    bytes: 133_788,
    sha256:
      '2195ab73f3e711eece9c8e114a1ce15da266941ba748e7faa8ef43280111dde9',
  },
  thumbnail: {
    bytes: 46_364,
    sha256:
      'a41c9c5790795248bb18bce769a70a65e6ef4d27623578718d0cbd4d443989b5',
  },
  narration: {
    generatedOn: '2026-07-28',
    script: zhCN.narration.sentences.join(''),
    bytes: 106_605,
    sha256:
      '8453b238e6fdcf98fb1e592032c494c324c9b4a3ebc58085ea661e9aba5e4c8c',
  },
})
