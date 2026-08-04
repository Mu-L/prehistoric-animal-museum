import type { AssetProvenance } from '../../types'

export const provenance = [
  {
    "assetPath": "model/model.glb",
    "kind": "model",
    "source": {
      "type": "third-party",
      "title": "Meganeura Dinoraul but it is a bit accurate",
      "author": "Nobilis the Palaeovespa (@nobilishornet)",
      "url": "https://sketchfab.com/3d-models/meganeura-dinoraul-but-it-is-a-bit-accurate-1aaab4a72fbc42b4901d5f1dde12a281",
      "accessedOn": "2026-08-01",
      "sha256": "b67cdb48e1ebe0f569aa45ec00144b452be699202bb3f9bdcb88ab4ce7b478f0",
      "bytes": 4623164
    },
    "license": {
      "spdx": "CC-BY-4.0",
      "name": "Creative Commons Attribution 4.0 International",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "runtime": {
      "bytes": 5695048,
      "sha256": "4fbebc819c8d5d9429ea4286f69b43e642b63e549a74bade2513253da8ca4ac3"
    },
    "modifications": [
      "Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.",
      "Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.",
      "Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.",
      "Authored and validator-checked one closed eight-second flying-insect Idle for the shared museum viewer."
    ],
    "attribution": "“Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum.",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/model-license.txt",
      "provenance/LICENSES/model-source.txt"
    ]
  },
  {
    "assetPath": "backgrounds/landscape.webp",
    "kind": "background",
    "source": {
      "type": "generated",
      "title": "巨脉蜻蜓 reviewed habitat — landscape",
      "tool": "OpenAI built-in image_gen",
      "generatedOn": "2026-08-01",
      "prompt": "Wide Late Carboniferous wetland forest and river channel with an open teal mist corridor, no animals or text.",
      "sha256": "43733871df7ba0b7cd9a7b2077c307e6800b07aeed12e7c7aa0d4e7c320ca60e",
      "bytes": 2702978
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned ImageGen output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 265692,
      "sha256": "b1ff0024c5ca7632ea2b982692005f77dac6f9f9b99c6d970204ed27b7b9dbb4"
    },
    "modifications": [
      "Sharp deterministic cover resize and WebP encoding",
      "Removed ancillary metadata without applying a runtime tint or filter."
    ],
    "attribution": "Project-generated 巨脉蜻蜓 landscape background created with OpenAI ImageGen.",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/background-generation.txt"
    ]
  },
  {
    "assetPath": "backgrounds/portrait.webp",
    "kind": "background",
    "source": {
      "type": "generated",
      "title": "巨脉蜻蜓 reviewed habitat — portrait",
      "tool": "OpenAI built-in image_gen",
      "generatedOn": "2026-08-01",
      "prompt": "Portrait Late Carboniferous swamp channel framed by scale trees with a central teal mist opening, no animals or text.",
      "sha256": "506c06c952c2164428eac32cab6d11e3ecf6cdc7114d980574bacd31d9c33a19",
      "bytes": 2873491
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned ImageGen output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 232732,
      "sha256": "a95452b38ad10c79e0b0ee9b181bc5a382ed8b952d09df0d20ccbac89a7de27f"
    },
    "modifications": [
      "Sharp deterministic cover resize and WebP encoding",
      "Removed ancillary metadata without applying a runtime tint or filter."
    ],
    "attribution": "Project-generated 巨脉蜻蜓 portrait background created with OpenAI ImageGen.",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/background-generation.txt"
    ]
  },
  {
    "assetPath": "images/poster.webp",
    "kind": "poster",
    "source": {
      "type": "derived",
      "title": "巨脉蜻蜓 model fallback poster",
      "generatedOn": "2026-08-01",
      "inputAssetPaths": [
        "model/model.glb",
        "backgrounds/landscape.webp"
      ],
      "method": "Deterministic crop from the accepted desktop review screenshot and measured model bounds."
    },
    "license": {
      "spdx": "CC-BY-4.0",
      "name": "Creative Commons Attribution 4.0 International",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "runtime": {
      "bytes": 66864,
      "sha256": "52e522500a266872b912082e5d58bf3d4eca0fb6fba2e55b67ec6d0bff0b06a1"
    },
    "modifications": [
      "Composited the accepted runtime model presentation with the reviewed landscape.",
      "Exported without text, controls, labels, logos, or watermarks."
    ],
    "attribution": "“Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/model-license.txt",
      "provenance/LICENSES/model-source.txt",
      "provenance/LICENSES/derived-images.txt"
    ]
  },
  {
    "assetPath": "images/thumbnail.webp",
    "kind": "thumbnail",
    "source": {
      "type": "derived",
      "title": "巨脉蜻蜓 collection thumbnail",
      "generatedOn": "2026-08-01",
      "inputAssetPaths": [
        "images/poster.webp"
      ],
      "method": "Cropped the reviewed poster to a readable 320 × 320 WebP collection image."
    },
    "license": {
      "spdx": "CC-BY-4.0",
      "name": "Creative Commons Attribution 4.0 International",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "runtime": {
      "bytes": 14272,
      "sha256": "11a5f70e4bd148d1eac6f1a2644ea1df8872e3b080768f93bb2328983f35ccde"
    },
    "modifications": [
      "Selected a card-size crop that keeps the animal readable.",
      "Exported without embedded text, controls, labels, logos, or watermarks."
    ],
    "attribution": "“Meganeura Dinoraul but it is a bit accurate” by Nobilis the Palaeovespa (@nobilishornet), CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/model-license.txt",
      "provenance/LICENSES/model-source.txt",
      "provenance/LICENSES/derived-images.txt"
    ]
  },
  {
    "assetPath": "audio/narration.zh-CN.mp3",
    "kind": "narration",
    "source": {
      "type": "generated",
      "title": "巨脉蜻蜓 Mandarin narration",
      "tool": "Qwen3-TTS CustomVoice",
      "model": "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
      "revision": "85e237c12c027371202489a0ec509ded67b5e4b5; Serena built-in voice",
      "generatedOn": "2026-08-01",
      "prompt": "这是巨脉蜻蜓，它生活在约三亿年前的晚石炭世，是现代蜻蜓的远亲。看看它四片布满翅脉的翅膀、六条腿和一双大大的复眼。",
      "sha256": "18724a1f72f6dc6e3843646b4c84bc375d6291b0eba97a0fb94ff6c0d4e23446",
      "bytes": 123645
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned Qwen3-TTS output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 123645,
      "sha256": "18724a1f72f6dc6e3843646b4c84bc375d6291b0eba97a0fb94ff6c0d4e23446"
    },
    "modifications": [
      "Generated offline from the exact reviewed two-sentence script with the pinned Serena voice.",
      "Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis."
    ],
    "attribution": "Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).",
    "redistributionAllowed": true,
    "evidencePaths": [
      "provenance/LICENSES/narration-rights.txt"
    ]
  }
] as const satisfies readonly [AssetProvenance, ...AssetProvenance[]]
