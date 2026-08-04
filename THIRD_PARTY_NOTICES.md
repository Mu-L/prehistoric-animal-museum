# Third-party notices

This file is generated from the typed animal-package provenance records by
`npm run generate:credits`. Do not edit it independently. Code, original
content, contributions, and Brand Assets follow the separate scopes in
[LICENSING.md](LICENSING.md).

## Bundled runtime libraries

- **React 19.2.8**, **React DOM 19.2.8**, and **Scheduler 0.27.0** —
  Copyright (c) Meta Platforms, Inc. and affiliates.
  Distributed under the [MIT License](LICENSES/React-MIT.txt).
- **Three.js 0.185.1** — Copyright (c) 2010-2026 three.js authors.
  Distributed under the [MIT License](LICENSES/Three.js-MIT.txt).
- **Lucide React 1.27.0** — Copyright (c) 2026 Lucide Contributors.
  Distributed under the [ISC License](LICENSES/Lucide-ISC.txt); portions
  derived from Feather are retained under the MIT License in the same file.

## Bundled fonts

- **ZCOOL KuaiLe** — Copyright 2018 The ZCOOL KuaiLe Project Authors.
  Bundled from `@fontsource/zcool-kuaile@5.3.0` under the
  [SIL Open Font License 1.1](LICENSES/OFL-1.1.txt).
- **Noto Sans SC** — Copyright Google Inc.
  Bundled from `@fontsource-variable/noto-sans-sc@5.3.0` under the
  [SIL Open Font License 1.1](LICENSES/OFL-1.1.txt).

## 迷惑龙 (`apatosaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 迷惑龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-28
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `184993cb9bbc6a008eaf336f47314b75ffaab12da8ac2cc570cdec9d00728082`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Apatosaurus Morrison floodplain — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 迷惑龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `1235b6d22d73e032caccb3b52eea06a0e5388dacde020d53f4bb0c346635867f`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Apatosaurus Morrison floodplain — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 迷惑龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `6338039f9ec99739328af1e6095d90f9fe0178e5a28e0d4c80530f84e52feecf`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 迷惑龙 model fallback poster, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Apatosaurus Dinosaur” by XML-AL16_EMMILIA.., CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `d2f4a44be36d2b09f7f51ac050f905081a59aad5d4add0fd0715d8197c5db252`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 迷惑龙 collection thumbnail, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Apatosaurus Dinosaur” by XML-AL16_EMMILIA.., CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `e053e50ea967fe692bac12372861d41044428d6039c14af4303a12012494d784`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Apatosaurus Dinosaur](https://sketchfab.com/3d-models/apatosaurus-dinosaur-9c63e4fd2a9842e9882f21b015a8e4a9) by XML-AL16_EMMILIA..
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Apatosaurus Dinosaur” by XML-AL16_EMMILIA.., CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `a3eac8a5b16f0175dc5a994550caf89d41f58feaf4be34a49c9fa37e5fbc2e74`
- Modifications:
  - Removed the presentation ground and stone rim.
  - Applied the reviewed reversible light silhouette restyle v1.
  - Added the reviewed project-authored olive-brown material v2 while preserving geometry and UVs.
  - Desaturated the green cast and shifted the existing 1K body base colour toward a dusty grey-brown olive while preserving mottling, roughness, normal detail, geometry, and UVs.
  - Added paired project-authored amber-brown eyes with dark pupils and restrained catchlights.
  - Built a project-authored 15-bone Blender armature with shoulder and hip transition weights repaired to keep the body closed during the full motion.
  - Repaired the front-leg and mid-belly junction after close-up owner review by matching the upper-leg weights to the stationary shoulder bridge before the neck begins to bend.
  - Layered irregular broad folds, broken secondary wrinkles, fine pebbled grain, and pores over the retained authored normal map, with restrained matching base-colour relief so the skin detail remains visible in museum lighting.
  - Authored an eight-second in-place feeding Idle that raises and lowers the head through four neck bones while the distal tail responds vertically and with a small lateral sway; the spine and tail root remain stationary to protect the skin junctions.
  - Normalized the Blender export to one closed-loop Idle clip with eight rotation-only channels, then repacked, validator-checked, and reviewed the derivative in the shared museum viewer.
## 双冠龙 (`dilophosaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 双冠龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `0b8c7f4b55d947beb9e5df4728289362f7447dc68d3cd751091462c5ed80f7ee`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 双冠龙 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 双冠龙 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `776459c11a6281b2cd93c5870a8b05beec9379d7d57435a37f457fcbacb2d1c3`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 双冠龙 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 双冠龙 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `c785dc8534908407e1afb19814f4980a406859b54c2afab195701ab28638c61f`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 双冠龙 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Dilophosaurus” by Marcel Schanz, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `084d1a5a4e6e2dbd3d3029920bee8aa850059c7cf48ae8964d12d66ba60be28e`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 双冠龙 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Dilophosaurus” by Marcel Schanz, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `95e16ff8d185a39dc1e3ab469e2a003d7f864bb68af669a6e0ca88bb864a5ebd`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Dilophosaurus](https://sketchfab.com/3d-models/dilophosaurus-d09b3aa874db4e1cbf29a14797ca351f) by Marcel Schanz
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Dilophosaurus” by Marcel Schanz, CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `f11121b6be84e11fb39ad77ff32d5a445c8d626548b09c50a2c4633f66a2e7a7`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second land-breathe-tail Idle for the shared museum viewer.
  - Included the human-reviewed curated-components partial mouth relaxation in the same Idle loop.
## 巨盗龙 (`gigantoraptor`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 巨盗龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-28
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `a341f9f162f939127d2fa30e3a505b8f40eac08b7850ac485838aab58215a405`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Gigantoraptor Gobi alluvial plain — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨盗龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `bab0d551f20990e1230c0655cd6fe417e2fe6dd76a83e91f52d1b24ec220d054`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Gigantoraptor Gobi alluvial plain — portrait, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨盗龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `6bc8a4fce35567552a3fc232ccd21f366f112f3a9ea69d3bb9f3e0198d783964`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 巨盗龙 model fallback poster, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Gigantoraptor” by seth the yutyrannus, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `3bc4fdd9bc7c51a245d587c49b3aa5ef484a84aaa7d6636e8a457c622876ff18`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 巨盗龙 collection thumbnail, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Gigantoraptor” by seth the yutyrannus, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `db670ed5f8df366f4c42b0f65524fdff6ca915449a05ad82b037e157f1ae5003`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Gigantoraptor](https://sketchfab.com/3d-models/gigantoraptor-e51509d66d464104aef1b72c298a40cf) by seth the yutyrannus
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Gigantoraptor” by seth the yutyrannus, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `44804b2c7ce75ffe7e24809ced163c48bde972c8be1026ee4d00f2321239356c`
- Modifications:
  - Cleared zero-weight joint indices, deduplicated, pruned, and repacked the GLB.
  - Authored a 6.5-second in-place museum Idle in Blender 5.2 using the existing 79-bone rig; after two local visual reviews, retained body, tail, and jaw motion at 225% of the authored base while increasing head and neck motion to 450% and both arms to 500%.
  - Injected 29 rotation-only channels for the torso, neck, head, jaw, arms, and tail into the normalized base GLB while preserving its original mesh and skin hierarchy.
  - Kept the root, hips, and legs stationary to avoid foot sliding.
  - Validated and reviewed the self-contained derivative.
## 鱼龙类 (`ichthyosaur`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 鱼龙类 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-27
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `5ab57bd9221ab75280f8020b5c01353447a345e1428d99b455bfdc71492a02a1`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Ichthyosaur ancient shallow sea — landscape, generated with OpenAI built-in image_gen on 2026-07-26
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 鱼龙类 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `8bf2ad8aa97c77de62f077937f349c9ea46ba4594c7893051a20f9c613af29ec`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Ichthyosaur ancient shallow sea — portrait, generated with OpenAI built-in image_gen on 2026-07-26
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 鱼龙类 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `3ae5a51044ab7b19e5df36c3ed0276f70e003960bcb849a176ef50155ccc512f`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 鱼龙类 model fallback poster, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “ichthyosaur” by pro_alba, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `c2eb3d165f7049a37e346b6fbb76469ba1139cfd4168e183019b93c5fc87b7bf`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 鱼龙类 collection thumbnail, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “ichthyosaur” by pro_alba, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `92da9f1da8c3b76a6776200255ab7ec18e486bbb0ef2b6cf20c3bd8d52e3e843`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [ichthyosaur](https://sketchfab.com/3d-models/ichthyosaur-dffbc77b634a408f91dd5f68df4cc94f) by pro_alba
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “ichthyosaur” by pro_alba, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `7aa203b310bbfd5a9a1cc6db0ebeb57514923e664a63c10c94820ecebbb45485`
- Modifications:
  - Normalized the source GLB and retained the gentle swimming Idle clip.
  - Added the reviewed project-authored 1K irregular slate-grey material v2.
  - Added a project-authored v3 aquatic skin surface with a subtly detailed 1K base colour, 512-pixel dermal normal map, and 512-pixel matte roughness variation; the detail uses fine irregular grain, shallow longitudinal folds, and pores without fish scales or a glossy plastic finish.
  - Replaced the source key timing with a six-second continuous natural-swim Idle: ten tail and caudal-fin bones form a three-cycle travelling wave at 0.5 Hz, progressively increasing from approximately 1.8 to 16 degrees, while the four fins make restrained coordinated motions.
  - Sampled the Idle at 12 frames per second with linear interpolation so the distal tail reverses direction smoothly without holding near either extreme; the longest near-static interval measured across the tail chain is approximately 0.17 seconds.
  - Normalized the derivative to one closed-loop Idle with 24 rotation-only channels, then repacked, validator-checked, and reviewed it in the shared museum viewer.
## 慈母龙 (`maiasaura`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 慈母龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `c5d2a33d9dab17e968e5e87e40b4f2ff7d0d2e82ee0da3b8d46091da0c1dc970`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Maiasaura Late Cretaceous floodplain — landscape, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 慈母龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `57da28e0040da8a8dcc53779a1fa1d43f68a76930ef75cdb6ea57a07b013b4d3`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Maiasaura Late Cretaceous floodplain — portrait, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 慈母龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `d615b288525fc0d144b5a3a0bb17a17439fa81f68323861e9378fd206105fd58`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 慈母龙 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Maiasaura With Rig” by Dino Dan, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `c42118866446377c1aa7b7f8e913c610fa2ecd90fc2bfad60e3d7906d08793fa`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 慈母龙 collection thumbnail, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Maiasaura With Rig” by Dino Dan, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `3ef34141efde41bd3b1afce81942662b125fbbec22073b7c6cd5bb18e71cc908`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Maiasaura With Rig](https://sketchfab.com/3d-models/maiasaura-with-rig-3da9f211ae304bd0afd1d15a290eabbd) by Dino Dan
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Maiasaura With Rig” by Dino Dan, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `160336c4d22f9ff8ea3b2885664862817dab28da21a10db390c46ec663fc1e1b`
- Modifications:
  - Normalized and repacked the self-contained GLB while retaining the source 87-bone rig.
  - Replaced the cyan-orange toy-like colour treatment with a project-authored warm brown back, pale underside, dark dorsal markings, multiscale mottling, higher roughness, and a clearer skin normal surface.
  - Authored an eight-second in-place Idle at 24 frames per second with visibly increased torso, head, neck, forelimb, and full-tail motion while retaining stable four-foot contact.
  - Exported a single closed-loop Idle, validator-checked the result, and reviewed the animated skinned bounds in the shared museum viewer.
## 长毛猛犸象 (`mammoth`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 长毛猛犸象 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-28
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `a771ac8784719d2e1629742f303f6c6c808c88b2a02bfb0b2122b9b96ece52a6`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Woolly mammoth steppe-tundra — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 长毛猛犸象 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `d456a3b0f0cfedfcd6dc518199eb8e75cbe8ef043dfade64109299e0255a925f`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Woolly mammoth steppe-tundra — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 长毛猛犸象 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `dc2df002c5dab82c95534a93dcc0e91b2436dcb01be24667453533e6cd917c34`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 长毛猛犸象 model fallback poster, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “3D High-poly Baby Woolly Mammoth” by SDPM Esare, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `62e8e71e1fd1b981ba5b7b4a2ac9f7a4f7c64dbd5f190428482010901c300094`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 长毛猛犸象 collection thumbnail, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “3D High-poly Baby Woolly Mammoth” by SDPM Esare, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `808ccebb327c45ec80fbd0b76c324a1bb42e8a3b03d391e89a3d0f80d42edb56`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [3D High-poly Baby Woolly Mammoth](https://sketchfab.com/3d-models/3d-high-poly-baby-woolly-mammoth-fce1c86ccedf47a5b9627098be6719d5) by SDPM Esare
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “3D High-poly Baby Woolly Mammoth” by SDPM Esare, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `35e2dba618e3b915f73abd6a965243c4cec6c60ba753be65af816debb48adb01`
- Modifications:
  - Used the original creator’s CC BY 4.0 source rather than the submitted CC BY-NC-SA derivative.
  - Normalized and repacked the self-contained 1K-texture GLB.
  - Built a project-authored 8-bone Blender armature with deterministic head, body, four-leg, and two-bone tail weights.
  - Matched the head and body blend across the disconnected neck surfaces and held the tail root stationary after close-up owner review, preventing either junction from opening during motion.
  - Authored an eight-second in-place Idle with an approximately 7-degree head pitch and 4-degree turn so the long tusks move clearly, plus a larger distal tail swing.
  - Normalized the Blender export to one closed-loop Idle clip with two rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.
## 巨齿鲨 (`megalodon`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 巨齿鲨 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `84596b867a973ed2416dcff06096a1710984ea9073de22abcb30d2e1950880af`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Megalodon Neogene continental shelf — landscape, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨齿鲨 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `aa657ffb445db3e9a8994575191f4c1f1f4d0d780ee75b52d3d340c2114cfb77`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Megalodon Neogene continental shelf — portrait, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨齿鲨 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `55cd036d199a4acf6fdda4094da805bc948a6e0207b33a121f8434374e0169e6`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 巨齿鲨 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Otodus Megalodon updated animations” by CanYuTsai, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `bdec8c589eaaf437e8ac734e54cfb576443ae2bb1d5d4f26b3753989f7696993`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 巨齿鲨 collection thumbnail, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Otodus Megalodon updated animations” by CanYuTsai, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `9efcf57cc6d727740093ab74a8380a6e4d4d87fae1478f467d2634a9d09c7fff`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Otodus Megalodon updated animations](https://sketchfab.com/3d-models/otodus-megalodon-updated-animations-7e65b8c51251440e9aca8385f286714f) by CanYuTsai
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Otodus Megalodon updated animations” by CanYuTsai, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `b6a5957240770e61f91022189a8e95c65a0548313f59ecaba0b431c31e47dffa`
- Modifications:
  - Retained the source skinned hierarchy, repacked the GLB, and applied a desaturated non-metallic matte aquatic material treatment.
  - Replaced the source mouth-focused action with a project-authored eight-second in-place full-body swimming Idle at 24 frames per second.
  - Kept the four head-chain joints nearly stable at approximately 0.15–0.30 degrees while increasing the travelling propulsion wave from roughly 1.2 degrees at the tail root to 8.5 degrees at the tail tip.
  - Added restrained paired-fin pose changes, exported one closed-loop Idle, validator-checked the result, and reviewed the animated skinned bounds in the shared museum viewer.
## 巨脉蜻蜓 (`meganeura`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 巨脉蜻蜓 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `18724a1f72f6dc6e3843646b4c84bc375d6291b0eba97a0fb94ff6c0d4e23446`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 巨脉蜻蜓 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨脉蜻蜓 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `b1ff0024c5ca7632ea2b982692005f77dac6f9f9b99c6d970204ed27b7b9dbb4`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 巨脉蜻蜓 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 巨脉蜻蜓 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `a95452b38ad10c79e0b0ee9b181bc5a382ed8b952d09df0d20ccbac89a7de27f`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 巨脉蜻蜓 model fallback poster, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `52e522500a266872b912082e5d58bf3d4eca0fb6fba2e55b67ec6d0bff0b06a1`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 巨脉蜻蜓 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `11a5f70e4bd148d1eac6f1a2644ea1df8872e3b080768f93bb2328983f35ccde`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Meganeura Dinoraul but it is a bit accurate](https://sketchfab.com/3d-models/meganeura-dinoraul-but-it-is-a-bit-accurate-1aaab4a72fbc42b4901d5f1dde12a281) by Nobilis the Palaeovespa (@nobilishornet)
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `4fbebc819c8d5d9429ea4286f69b43e642b63e549a74bade2513253da8ca4ac3`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second flying-insect Idle for the shared museum viewer.
## 沧龙 (`mosasaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 沧龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `417548bc44f44d906ab32ba9008fc164cda38c6583f519b4e01e68d993c5b6e9`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 沧龙 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 沧龙 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `3cd7a9a2c81a8ba67da79731de3bdc050f33ba1d6d9e8d1dce9ecb077a5c7a7a`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 沧龙 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 沧龙 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `bd3d2bd66c8163e5fcb6520ca1560fd44870ef8ea644bb1585e6cf214ed2141a`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 沧龙 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `8bc662cfa62c0badfcbd88076cbf5063daf8e0316ec9eef57d9d9004a13f2d68`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 沧龙 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `34edf4c3cbac664a85bcc4bfc9c85d1b310148e78a10d26aad806290287895d0`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Mosasaurus](https://sketchfab.com/3d-models/mosasaurus-fe0c25c4ed4e4d4aa05312121e2f68df) by Lukiethewesly13
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `f83f490f0244fb4dcc9e0860b54216f26ab9144900ef19e3adb8692e769bed68`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second marine-tail Idle for the shared museum viewer.
  - Included the human-reviewed source-rig partial mouth relaxation in the same Idle loop.
## 肿头龙 (`pachycephalosaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 肿头龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-27
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `dbf97da7d938cf41f28e060f3d7cffe898e0be2ffd3883af1211a4b878171de2`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Pachycephalosaurus fern forest — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 肿头龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `d75b12b1689c68ff0c878ea1c8f2c561f26bdbcc5b51f2c0898d9713a2a161f6`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Pachycephalosaurus fern forest — portrait, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 肿头龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `21e18496811c876627a68d4335caac671e920a1300604050e80786a3ccfab6d2`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 肿头龙 model fallback poster, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “PBR Pachycephalasaurus Animated” by Ferocious Industries, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `8af0f8ff4ec557084ea0427af5000683eee3f46c3ee232ef14d68a31456a5dec`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 肿头龙 collection thumbnail, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “PBR Pachycephalasaurus Animated” by Ferocious Industries, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `ef29131bb29b87321ab742f816f3f67c9e53cbb3905f4ebbfb786ec2cc7792d8`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [PBR Pachycephalasaurus Animated](https://sketchfab.com/3d-models/pbr-pachycephalasaurus-animated-6eea5cee4afa4730bf75c6329a43e56d) by Ferocious Industries
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “PBR Pachycephalasaurus Animated” by Ferocious Industries, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `ce3990fd6260a1743bccf0768a74c6f4aa79a41309f11fb1285635dbd0a88c92`
- Modifications:
  - Converted legacy material data to metallic/roughness.
  - Cleared zero-weight joint indices and retained the presentation-safe Idle clip.
  - Deduplicated, pruned, repacked, validated, and reviewed the derivative.
## 蛇颈龙类 (`plesiosaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 蛇颈龙类 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `7f09a3074e675a5e0b5c30b7880af8e2b80acb20308e32356998169630dc9557`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Plesiosaur Jurassic shallow sea — landscape, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 蛇颈龙类 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `36cc7edcf6f34366420c7fe98ed064656cd265377fb18829e385124d53c3db9f`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Plesiosaur Jurassic shallow sea — portrait, generated with OpenAI built-in image_gen on 2026-07-30
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 蛇颈龙类 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `a36bdf51a3f4ccb72f6c9f97bf13fef2de1c62af6ebd531b0567667fc001986e`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 蛇颈龙类 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Plesiosaure” by leo kerjean, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `59b0fa88da7566904db1fbc5ceb2424fcbbcc26b79fce9310e09ce90d2f7b307`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 蛇颈龙类 collection thumbnail, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Plesiosaure” by leo kerjean, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `d3a8a78427341bd74fd0957aa98704f9b0c12d1a994c54e039a688f2fb67b32e`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Plesiosaure](https://sketchfab.com/3d-models/plesiosaure-2f59d503e0754c9d9e157a90ed415c38) by leo kerjean
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Plesiosaure” by leo kerjean, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `3273d197a1119a0b9c12acdf53435b166b45ab1c4341709eaebd3dd0cbf9cce6`
- Modifications:
  - Retained the source hierarchy and display scale while repacking the model as a self-contained runtime GLB.
  - Applied a desaturated matte aquatic material treatment and added restrained eye sockets, amber irises, dark pupils, and small catchlights to the existing texture atlas.
  - Authored four project morph targets that relax the permanently up-curved neck, add a head-to-shoulder elliptical neck motion, and move all four flippers independently.
  - Built a single eight-second Idle at 24 frames per second with two complete swimming cycles, smooth phase transitions, and no locomotion.
  - Validator-checked the result and reviewed the full neck, tail, eye, and flipper silhouettes in the shared museum viewer.
## 无齿翼龙 (`pteranodon`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 无齿翼龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-27
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `e8fa6768126c25200fb3f1eb5aefb708e4fbf6b8636eacb1acc3a47425499d74`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Pteranodon inland-sea cliffs — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 无齿翼龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `c5c6d6b3cf886f229b3048af4da27f09abef8b28ef413d343fad9cb57817f902`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Pteranodon inland-sea cliffs — portrait, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 无齿翼龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `6badc6d22b404f6c11f6e4ff4bef8cdb28104a538d91d0d6124fe7d144c93e75`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 无齿翼龙 model fallback poster, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Pteranodon (Animated)” by Chistodrako._. / Oscar López Riviello, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `ccf0761ae4106bd6d69f28e2777ef01aecb4789cff2b1296e81cd017efa7b67f`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 无齿翼龙 collection thumbnail, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Pteranodon (Animated)” by Chistodrako._. / Oscar López Riviello, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `5fac69df7fbd6377d4f454080b3717de7b64f645054c4808725589e1a5f106ac`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Pteranodon (Animated)](https://sketchfab.com/3d-models/pteranodon-animated-7d7683df41d1405283f160e81a5dff1b) by Chistodrako._. / Oscar López Riviello
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Pteranodon (Animated)” by Chistodrako._. / Oscar López Riviello, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `086892bd31143e06329a4d21f8d675c799412b164d37f86327ba3c391fa04594`
- Modifications:
  - Converted legacy material data and cleared zero-weight joint indices.
  - Used Blender 5.2 to transfer the source flying action onto the normalized runtime rig, rebase the root to the museum rest origin, and reduce its translation to 3.5%.
  - Retained the repaired in-place flight loop as the single Idle clip.
  - Deduplicated, pruned, repacked, validated, and reviewed the derivative.
## 喙嘴翼龙 (`rhamphorhynchus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 喙嘴翼龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `11dc961e14dfd934f1577ec041d5704e23d235524500d7cbb9b18cef4f18750b`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 喙嘴翼龙 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 喙嘴翼龙 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `418379f31b603ab69ed302f025c200d7f33ec1547d726369fc029fcc7a846d2b`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 喙嘴翼龙 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 喙嘴翼龙 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `4f761bca9892888876cef2dd8220484c755ac6804dc5d67277775c10c51de9f2`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 喙嘴翼龙 model fallback poster, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Low-poly Rhamphorhynchus idle” by Robear (@xiaorobear), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `07b0336ff6542d4a061555f4ad5fd36f64f8050f3970912cef30dd277ee05691`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 喙嘴翼龙 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Low-poly Rhamphorhynchus idle” by Robear (@xiaorobear), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `f5d34e955c8401fdb2708ff7c94ac99e35950de22d77ab8a57fe4a66990d5a64`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Low-poly Rhamphorhynchus idle](https://sketchfab.com/3d-models/low-poly-rhamphorhynchus-idle-c1e35c7ac4374c778f78025717694675) by Robear (@xiaorobear)
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Low-poly Rhamphorhynchus idle” by Robear (@xiaorobear), CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `4c2ded260f523f559afc188808c9cfc095e82e4172ea1d794b3367b3f7e4287a`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second flying-wing Idle for the shared museum viewer.
## 胄甲龙 (`sauropelta`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 胄甲龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `baee6b0e3d30264dab55b2dda1396715ed3757281feab3ee19106b98f98bdc28`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 胄甲龙 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 胄甲龙 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `03c2e212e57c9c6a6e246c3af723fa150d3d1a22ff4091e008ccb271d4ffec1d`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 胄甲龙 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 胄甲龙 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `7b524977921b8dcee435ce597c022051fed7f76ac77bbf597b6f0660d8d3fabc`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 胄甲龙 model fallback poster, derived on 2026-07-31
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Animated Sauropelta (Free)” by Anees Animates, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `16c89c8e1c8304cbe8a6565de6d4a0ca12367ffe71568be8b76a0be95c5d239a`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 胄甲龙 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Animated Sauropelta (Free)” by Anees Animates, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `120cfba9e90c7701e140616c24c651e43a2f727f79340db9549e1143aba73f9d`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Animated Sauropelta (Free)](https://sketchfab.com/3d-models/animated-sauropelta-free-c6373f12f3954facb8d5fe48055c9161) by Anees Animates
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Animated Sauropelta (Free)” by Anees Animates, CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `5cf59610b1a98189c28e737833817adb1c3f6b7ed9338045b0ddbc515954dcdf`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second land-breathe-tail Idle for the shared museum viewer.
## 剑龙 (`stegosaurus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: Stegosaurus Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-27
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `675f68b9f019f5b913089a864803ddc69676c505deee289f4b6ea7641cde6464`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Stegosaurus prehistoric forest — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Stegosaurus landscape created with OpenAI ImageGen.
- Runtime SHA-256: `9a1990a3f554b0e237b57298a8495cf4ba7f7db450c1d4795cd9d6a4221e64e4`
- Modifications:
  - Converted the selected 1672 × 941 PNG candidate to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint, filter, or colour overlay.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Stegosaurus prehistoric forest — portrait, generated with OpenAI built-in image_gen on 2026-07-31
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Stegosaurus portrait created with OpenAI ImageGen.
- Runtime SHA-256: `7b432f99dab96bb76bc4563776c7b84b03766d128eb0afcc024a10be7a4894ed`
- Modifications:
  - Converted the selected 941 × 1672 PNG candidate to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint, filter, or colour overlay.
### `images/poster.webp`

- Asset type: poster
- Source: Stegosaurus model fallback poster, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: Poster includes “PBR Stegasaurus (Animated)” by Ferocious Industries, CC BY 4.0; scene art generated for this project.
- Runtime SHA-256: `f578ce537cd857c008b34262287663fc306f1bd68f5df46700cba74e8f8977bb`
- Modifications:
  - Composited the accepted runtime model presentation with the project-generated landscape.
  - Exported a 960 × 540 WebP fallback without text, controls, or labels.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: Stegosaurus collection thumbnail, derived on 2026-07-29
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: Thumbnail includes “PBR Stegasaurus (Animated)” by Ferocious Industries, CC BY 4.0; scene art generated for this project.
- Runtime SHA-256: `a5535eca0d5dc26a4017fa786bbf4d77c91bc78c00017dd6664f1c51913df423`
- Modifications:
  - Replaced the letterboxed overview with a closer crop that keeps the head and back plates readable at card size.
  - Exported a 320 × 320 WebP without embedded text, controls, or labels.
### `model/model.glb`

- Asset type: model
- Source: [PBR Stegasaurus (Animated)](https://sketchfab.com/3d-models/pbr-stegasaurus-animated-ec254ea1554941fe8a131f62db0faf3d) by Ferocious Industries
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “PBR Stegasaurus (Animated)” by Ferocious Industries, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `514e673525173134279604efe592e9c5079e916e8e2be0d729701bbb650adae1`
- Modifications:
  - Downloaded as the converted GLB with 1K textures.
  - Converted legacy specular/glossiness materials to metallic/roughness.
  - Cleared zero-weight joint indices.
  - Retained IdleA only, renamed it Idle, pruned unused data, and repacked the GLB.
  - Corrected the project-facing animal name from “Stegasaurus” to “Stegosaurus”.
## 三角龙 (`triceratops`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 三角龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-28
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `2b4c55c486e1050dc28a0d715d88b8b6d7f78ce9215ca9fe8b6451ea2a92a25f`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Triceratops sage meadow — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 三角龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `bcccc2b41059d1a9b93c7f76193ff5d83c7fa0627c1945bd3c2c30c4a7b6a051`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Triceratops sage meadow — portrait, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 三角龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `1c79aacc9a55f44e630965168b88e15c2f662092ff503210157eb348588598c1`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 三角龙 model fallback poster, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Triceratops dinosaur” by wojciechmiedziocha, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `cdac7674892c94f6e5d24fe500b030c7bbae712f2d0de644e446a19d68f2a9da`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 三角龙 collection thumbnail, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Triceratops dinosaur” by wojciechmiedziocha, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `cbcafa5f695ab674197261316c51052d093ae021f8f2df90725cf0625e92c34c`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Triceratops dinosaur](https://sketchfab.com/3d-models/triceratops-dinosaur-87527079bad44917ab1b98a456b46c7e) by wojciechmiedziocha
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Triceratops dinosaur” by wojciechmiedziocha, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `b41ec3c7a48a0c40376280bdb972b7a78f3f54545839909276ee81fdf54218a1`
- Modifications:
  - Normalized and repacked the self-contained 1K-texture GLB.
  - Built a project-authored 10-bone Blender armature and deterministic skin weights, including stationary four-leg bones.
  - Authored an eight-second in-place Idle with an approximately 11-degree side-to-side head turn, a subtle nod, and a progressive distal tail wave while the tail root remains stationary over the hips.
  - Repaired the rear-leg and tail-root junction after close-up owner review by extending the stationary pelvis weights through the disconnected skin overlap.
  - Normalized the Blender export to one closed-loop Idle clip with four rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.
## 古神翼龙 (`tupandactylus`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 古神翼龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `f63c87174b47b6d7c3bc3cf41c3deea32006658566aa41215939b2aefb722f06`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: 古神翼龙 reviewed habitat — landscape, generated with OpenAI built-in image_gen on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 古神翼龙 landscape background created with OpenAI ImageGen.
- Runtime SHA-256: `8315cf166e68d330585c1eb39dc51e0664e2fea9f99c6d9842d420b68e70fa73`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: 古神翼龙 reviewed habitat — portrait, generated with OpenAI built-in image_gen on 2026-08-01
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 古神翼龙 portrait background created with OpenAI ImageGen.
- Runtime SHA-256: `3c1062e441dbff5da00332d4c06c91fc4a4cc15dd7acf27dbf5f888f1c8d1ebc`
- Modifications:
  - Sharp deterministic cover resize and WebP encoding
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 古神翼龙 model fallback poster, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tupandactylus” by Paleo Modelist (@victory_), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `b1d5c735eef8e2a07181ac7a9bda674e722ae7fcfd55807db4681aabc14b2aba`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 古神翼龙 collection thumbnail, derived on 2026-08-01
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tupandactylus” by Paleo Modelist (@victory_), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `796339e52ff9e78a99ae38788bc9207102f5142918809b1bad157fb02023d652`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Tupandactylus](https://sketchfab.com/3d-models/tupandactylus-4ea8f4466c2c4e61bc57c12af296d43a) by Paleo Modelist (@victory_)
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tupandactylus” by Paleo Modelist (@victory_), CC-BY-4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `bbd3af05a14b4bfc29a4e2226244951362c406b433d5ee93a752d0412b3efbc5`
- Modifications:
  - Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.
  - Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.
  - Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.
  - Authored and validator-checked one closed eight-second flying-wing Idle for the shared museum viewer.
  - Included the human-reviewed curated-components partial mouth relaxation in the same Idle loop.
## 霸王龙 (`tyrannosaurus-rex`)

### `audio/narration.zh-CN.mp3`

- Asset type: narration
- Source: 霸王龙 Mandarin narration, generated with Qwen3-TTS CustomVoice on 2026-07-28
- License: [CC BY-NC-SA 4.0 project-owned Qwen3-TTS output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).
- Runtime SHA-256: `8453b238e6fdcf98fb1e592032c494c324c9b4a3ebc58085ea661e9aba5e4c8c`
- Modifications:
  - Generated offline from the exact reviewed two-sentence script.
  - Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.
### `backgrounds/landscape.webp`

- Asset type: background
- Source: Tyrannosaurus wooded floodplain — landscape, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 霸王龙 landscape created with OpenAI ImageGen.
- Runtime SHA-256: `cec9d34c53add94b69722070e6c6770e0c895b74e3b5b7c5baaa44594651a07f`
- Modifications:
  - Converted the reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `backgrounds/portrait.webp`

- Asset type: background
- Source: Tyrannosaurus wooded floodplain — portrait, generated with OpenAI built-in image_gen on 2026-07-29
- License: [CC BY-NC-SA 4.0 project-owned ImageGen output](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- Attribution: Project-generated 霸王龙 portrait created with OpenAI ImageGen.
- Runtime SHA-256: `22401aa059bc68043519cd28237267231ebcb5dd2ba3cc6f3c8dab3e18cf22d8`
- Modifications:
  - Converted the separately composed reviewed PNG to lossy WebP at quality 82.
  - Removed ancillary metadata without applying a runtime tint or filter.
### `images/poster.webp`

- Asset type: poster
- Source: 霸王龙 model fallback poster, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tyrant King - Tyrannosaurus” by Marcel Schanz, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `2195ab73f3e711eece9c8e114a1ce15da266941ba748e7faa8ef43280111dde9`
- Modifications:
  - Composited the accepted runtime model presentation with the reviewed landscape.
  - Exported without text, controls, labels, logos, or watermarks.
### `images/thumbnail.webp`

- Asset type: thumbnail
- Source: 霸王龙 collection thumbnail, derived on 2026-07-30
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tyrant King - Tyrannosaurus” by Marcel Schanz, CC BY 4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.
- Runtime SHA-256: `a41c9c5790795248bb18bce769a70a65e6ef4d27623578718d0cbd4d443989b5`
- Modifications:
  - Selected a card-size crop that keeps the animal readable.
  - Exported without embedded text, controls, labels, logos, or watermarks.
### `model/model.glb`

- Asset type: model
- Source: [Tyrant King - Tyrannosaurus](https://sketchfab.com/3d-models/tyrant-king-tyrannosaurus-6465a297fa784598adc49f6e0042d449) by Marcel Schanz
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/)
- Attribution: “Tyrant King - Tyrannosaurus” by Marcel Schanz, CC BY 4.0; modified for the Prehistoric Animal Museum.
- Runtime SHA-256: `d98e26321f43323f3d38603d432357cb51e18054688c0d191ab1c06e586117a8`
- Modifications:
  - Normalized and repacked the self-contained 1K-texture GLB.
  - Lifted the Body base-colour texture midtones with a 0.80 luminance gamma and a maximum 1.50 channel scale after a second owner review; mouth, normal, roughness, and other PBR textures were left unchanged.
  - Re-encoded the adjusted 1K Body base-colour texture as high-quality 4:4:4 JPEG.
  - Built a project-authored 13-bone Blender armature and deterministic skin weights, with stationary root and leg bones to keep both feet planted.
  - Reassigned both detached fingernail components on each forelimb to the same arm bone as their corresponding fingers after close-up owner review.
  - Authored an eight-second in-place Idle with visible spine, neck, head, arm, and four-bone tail motion plus a controlled two-pulse bite whose lower-jaw opening remains at or below approximately 4 degrees.
  - Separated lower-jaw skin, teeth, and tongue membership from the upper palate after close-up owner review so the skin and teeth follow their respective jaw surfaces throughout both opening-and-closing pulses.
  - Normalized the Blender export to one closed-loop Idle clip with ten rotation-only channels, then validator-checked and reviewed the derivative in the shared museum viewer.
