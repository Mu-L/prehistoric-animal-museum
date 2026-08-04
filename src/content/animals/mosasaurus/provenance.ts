import type { AssetProvenance } from '../../types'

export const provenance = [
  {
    "assetPath": "model/model.glb",
    "kind": "model",
    "source": {
      "type": "third-party",
      "title": "Mosasaurus",
      "author": "Lukiethewesly13",
      "url": "https://sketchfab.com/3d-models/mosasaurus-fe0c25c4ed4e4d4aa05312121e2f68df",
      "accessedOn": "2026-07-31",
      "sha256": "03f67116c7c171e9a89192805b79724faa81b35097587edb386185dfd8cb51ce",
      "bytes": 5018936
    },
    "license": {
      "spdx": "CC-BY-4.0",
      "name": "Creative Commons Attribution 4.0 International",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "runtime": {
      "bytes": 5525476,
      "sha256": "f83f490f0244fb4dcc9e0860b54216f26ab9144900ef19e3adb8692e769bed68"
    },
    "modifications": [
      "Freeze the reviewed source pose and, when eligible, a source-rig partial mouth-close target before making morph animation deterministic. Operation: bake-and-join.",
      "Align length to X, center the visible bounds, and apply habitat grounding. Operation: canonical-transform.",
      "Export one traceable, closed-loop, in-place project Idle. Operation: replace-runtime-animation.",
      "Authored and validator-checked one closed eight-second marine-tail Idle for the shared museum viewer.",
      "Included the human-reviewed source-rig partial mouth relaxation in the same Idle loop."
    ],
    "attribution": "“Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum.",
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
      "title": "沧龙 reviewed habitat — landscape",
      "tool": "OpenAI built-in image_gen",
      "generatedOn": "2026-07-31",
      "prompt": "Empty Late Cretaceous Western Interior Seaway open water, true 16:9, clear central swimming stage, no animals or text.",
      "sha256": "e1b6c794a72a807cd250fa4572b24ac999e2a2ea7b5cdab35236ca1b3b94b0b8",
      "bytes": 2239942
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned ImageGen output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 116250,
      "sha256": "3cd7a9a2c81a8ba67da79731de3bdc050f33ba1d6d9e8d1dce9ecb077a5c7a7a"
    },
    "modifications": [
      "Sharp deterministic cover resize and WebP encoding",
      "Removed ancillary metadata without applying a runtime tint or filter."
    ],
    "attribution": "Project-generated 沧龙 landscape background created with OpenAI ImageGen.",
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
      "title": "沧龙 reviewed habitat — portrait",
      "tool": "OpenAI built-in image_gen",
      "generatedOn": "2026-07-31",
      "prompt": "Portrait companion of the same open-sea scene, true 9:16, clear central swimming stage, no animals or text.",
      "sha256": "454e28016318e0ccdb492e8832895d182a08f219a9b8908d352e1e674cb33e4e",
      "bytes": 2020976
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned ImageGen output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 84494,
      "sha256": "bd3d2bd66c8163e5fcb6520ca1560fd44870ef8ea644bb1585e6cf214ed2141a"
    },
    "modifications": [
      "Sharp deterministic cover resize and WebP encoding",
      "Removed ancillary metadata without applying a runtime tint or filter."
    ],
    "attribution": "Project-generated 沧龙 portrait background created with OpenAI ImageGen.",
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
      "title": "沧龙 model fallback poster",
      "generatedOn": "2026-07-31",
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
      "bytes": 18390,
      "sha256": "8bc662cfa62c0badfcbd88076cbf5063daf8e0316ec9eef57d9d9004a13f2d68"
    },
    "modifications": [
      "Composited the accepted runtime model presentation with the reviewed landscape.",
      "Exported without text, controls, labels, logos, or watermarks."
    ],
    "attribution": "“Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.",
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
      "title": "沧龙 collection thumbnail",
      "generatedOn": "2026-08-01",
      "inputAssetPaths": [
        "model/model.glb",
        "backgrounds/landscape.webp"
      ],
      "method": "Deterministic square crop from the accepted desktop review presentation after hiding all interface chrome."
    },
    "license": {
      "spdx": "CC-BY-4.0",
      "name": "Creative Commons Attribution 4.0 International",
      "url": "https://creativecommons.org/licenses/by/4.0/"
    },
    "runtime": {
      "bytes": 11094,
      "sha256": "34edf4c3cbac664a85bcc4bfc9c85d1b310148e78a10d26aad806290287895d0"
    },
    "modifications": [
      "Selected a card-size crop that keeps the animal readable.",
      "Exported without embedded text, controls, labels, logos, or watermarks."
    ],
    "attribution": "“Mosasaurus” by Lukiethewesly13, CC-BY-4.0; modified for the Prehistoric Animal Museum. Scene art generated for this project.",
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
      "title": "沧龙 Mandarin narration",
      "tool": "Qwen3-TTS CustomVoice",
      "model": "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice",
      "revision": "85e237c12c027371202489a0ec509ded67b5e4b5; Serena built-in voice",
      "generatedOn": "2026-07-31",
      "prompt": "这是沧龙，一种生活在晚白垩世海洋里的大型有鳞类爬行动物，它并不是恐龙。看看它的鳍状肢和有力的尾部，你能想象它怎样在海水中向前游吗？",
      "sha256": "417548bc44f44d906ab32ba9008fc164cda38c6583f519b4e01e68d993c5b6e9",
      "bytes": 140685
    },
    "license": {
      "spdx": "CC-BY-NC-SA-4.0",
      "name": "CC BY-NC-SA 4.0 project-owned Qwen3-TTS output",
      "url": "https://creativecommons.org/licenses/by-nc-sa/4.0/"
    },
    "runtime": {
      "bytes": 140685,
      "sha256": "417548bc44f44d906ab32ba9008fc164cda38c6583f519b4e01e68d993c5b6e9"
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
