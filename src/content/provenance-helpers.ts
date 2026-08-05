import type {
  AssetProvenance,
  IsoDate,
  Sha256,
} from './types'

interface RuntimeFile {
  readonly bytes: number
  readonly sha256: Sha256
}

interface SourceFile extends RuntimeFile {
  readonly title: string
}

interface ModelSource extends SourceFile {
  readonly accessedOn: IsoDate
  readonly author: string
  readonly url: `https://${string}`
}

interface BackgroundSource extends SourceFile {
  readonly generatedOn: IsoDate
  readonly prompt: string
}

const sharedBackgroundPrompt =
  'Refined layered paper-cut picture-book art with soft gouache texture; an empty calm prehistoric habitat behind a full-body 3D animal; quiet central safe area; no animal, person, text, UI, logo, or watermark.'

const habitatBackgroundPrompt =
  'Refined layered paper-cut picture-book art with soft gouache texture, tactile matte paper, and shallow soft shadows; an empty scientifically era-appropriate habitat behind a full-body 3D animal; quiet central safe area; no animal, person, text, UI, logo, watermark, photorealism, or baked-in particles because CSS supplies the atmosphere.'

export const reviewedBackgroundSources = {
  apatosaurus: {
    landscape: {
      title: 'Apatosaurus Morrison floodplain — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Preserve the accepted Late-Jurassic Morrison alluvial plain, but raise the distant horizon to about 42% of the 16:9 frame and recompose the terrain so the central sauropod staging band is continuous solid ground.`,
      bytes: 2_599_138,
      sha256:
        '347e585b06cf58292c1a56c9150e5325a51b8fe43bd6125d3a313fb3c1c0b111',
    },
    portrait: {
      title: 'Apatosaurus Morrison floodplain — portrait',
      generatedOn: '2026-07-31',
      prompt: `${habitatBackgroundPrompt} Precise portrait edit: change only the scene depth; move the distant horizon and start of the open valley ground upward about 7–9% of the image height so the central dirt path reaches farther into the distance and remains continuous beneath an Apatosaurus whose feet sit around 57% image height. Preserve the accepted 9:16 Morrison valley, sky, border trees, palms, cliffs, foreground plants, rocks, palette, lighting, texture, and perspective; no platform, ledge, hard seam, or new focal object.`,
      bytes: 2_601_546,
      sha256:
        '82c6fe696b2bb1993241d95be0902906200790522a902901b570cea6c4a316a6',
    },
  },
  gigantoraptor: {
    landscape: {
      title: 'Gigantoraptor Gobi alluvial plain — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Late-Cretaceous Inner Mongolian Gobi gravel plain with muted-red badlands, dry braided channels, distant dunes, stones, and sparse arid scrub; open wind-shaped true 16:9 landscape composition.`,
      bytes: 2_624_644,
      sha256:
        '406757106acc93a47e3994e9b3caae8e3ac06ef4afe7bda2b2366087d74ec578',
    },
    portrait: {
      title: 'Gigantoraptor Gobi alluvial plain — portrait',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Separately composed 9:16 late-Cretaceous Inner Mongolian Gobi plain beneath a tall pale-blue sky, with layered badland towers, dry channels, stones, and sparse low plants; explicitly not a lush swamp forest.`,
      bytes: 2_537_524,
      sha256:
        '2de6012b3a98f2c537b6cd23edf8b180fdd36cfdd491d499bd9d81a0717bebd6',
    },
  },
  mammoth: {
    landscape: {
      title: 'Woolly mammoth steppe-tundra — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Ice Age mammoth-steppe with tawny sedges and shrubs through light snow, a distant glacier valley, rounded snow mountains, and sparse conifers; dry open true 16:9 ground rather than deep snow.`,
      bytes: 2_879_403,
      sha256:
        'b8047f909d465bc47d66232b79a4f8dd47d953c53dcb3a7d5529b1d105f8c9e8',
    },
    portrait: {
      title: 'Woolly mammoth steppe-tundra — portrait',
      generatedOn: '2026-07-31',
      prompt: `${habitatBackgroundPrompt} Precise portrait edit: change only the scene depth; move the distant horizon and beginning of the open tundra ground upward about 8–10% of the image height so the valley floor extends behind a woolly mammoth whose feet sit around 59% image height. Preserve the accepted 9:16 sky, clouds, mountains, glacier, right-side pine grove, foreground rocks and grasses, palette, lighting, paper texture, and perspective; keep the glacier distant and continue a broad snow-dusted walkable ground plane through the centre with no ice shelf, ledge, hard seam, or new focal object.`,
      bytes: 2_526_208,
      sha256:
        '9508399ee924f9dfae784d7af0e10951c834bf514a6371a6bdf87b5df231a28a',
    },
  },
  maiasaura: {
    landscape: {
      title: 'Maiasaura Late Cretaceous floodplain — landscape',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。晚白垩世北美河漫滩与疏林，温暖自然、半写实高品质自然史绘本风格，金棕色草地、低矮蕨类、远处针叶林与轻薄云层，柔和清晨散射光。横向 16:9 构图；明确把地平线抬高到画面顶部向下约 43% 的位置；画面中央约 60% 宽度必须是一整片连续、平整、可供居中 3D 陆生动物落脚的地面，脚下区域不要有沟、石块或高草，透视与地面接触关系清晰；重要景物只放在两侧和远景。不要出现任何动物、人物、骨骼、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 2_975_870,
      sha256:
        'e846a70132530a19e00f3024b447f96d1df9c72f1f05c55bfd9f489c2b3b70ff',
    },
    portrait: {
      title: 'Maiasaura Late Cretaceous floodplain — portrait',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。晚白垩世北美河漫滩与疏林，温暖自然、半写实高品质自然史绘本风格，金棕色草地、低矮蕨类、远处针叶林与轻薄云层，柔和清晨散射光。竖向 9:16 构图；明确把远处林线和地平线放在画面顶部向下约 52% 的位置；画面中央约 78% 宽度从地平线到底部必须是一整片连续、平整、可供居中 3D 陆生动物落脚的地面，脚下区域不要有沟、石块或高草，透视与地面接触关系清晰；高树和重要景物只放在两侧边缘和远景，不遮挡中央。不要出现任何动物、人物、骨骼、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 2_711_111,
      sha256:
        '08188ebe1a8fe68e3c667b2ee5344a9d744922b48579ecc991c539d034a664f9',
    },
  },
  megalodon: {
    landscape: {
      title: 'Megalodon Neogene continental shelf — landscape',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。新近纪开放大陆架海域，广阔而沉静的深蓝海水，半写实高品质自然史绘本风格；水面与明亮波纹仅占画面顶部约 16%，柔和斜射光束制造巨大尺度感，远方水体渐变为较深的蓝色，沙质海床和低矮岩脊只在底部约 82% 以下隐约出现。横向 16:9 构图；画面中央约 70% 宽度和 60% 高度必须是开阔、低对比、无遮挡的游动空间，适合居中叠加一只巨型史前鲨鱼 3D 模型；两侧可有极少量远处水下地形作为尺度线索，但不可以有鱼群或其他动物。气氛壮阔但不恐怖，不要血腥。不要出现任何动物、鱼、人物、潜水员、船、骨骼、牙齿、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 1_784_569,
      sha256:
        'b0275ed9c9990046d6aaa394ea71cec2aacbc36c2b7bb40e3d4dd28d80333664',
    },
    portrait: {
      title: 'Megalodon Neogene continental shelf — portrait',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。新近纪开放大陆架海域，广阔而沉静的深蓝海水，半写实高品质自然史绘本风格；水面与明亮波纹仅占画面顶部约 12%，柔和斜射光束制造巨大尺度感，远方水体渐变为较深的蓝色，沙质海床与低矮岩脊只在底部约 84% 以下隐约出现。竖向 9:16 构图；画面中央约 80% 宽度从顶部 16% 到底部 80% 必须是开阔、低对比、无遮挡的游动空间，适合居中叠加一只巨型史前鲨鱼 3D 模型；两侧和底部可有极少量远处水下地形作为尺度线索，但不可以有鱼群或其他动物。气氛壮阔但不恐怖，不要血腥。不要出现任何动物、鱼、人物、潜水员、船、骨骼、牙齿、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 1_553_752,
      sha256:
        '47382f7aaa07e1cccfbcfc3a70572b239bba857777e3fa812a355c7bcb0821a2',
    },
  },
  pachycephalosaurus: {
    landscape: {
      title: 'Pachycephalosaurus fern forest — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Intimate humid late-Cretaceous North American conifer-and-fern woodland, with tall trunks, cycads, mossy logs, layered ferns, a high canopy opening, and an oval central clearing; true 16:9 landscape composition.`,
      bytes: 3_088_444,
      sha256:
        '5162f97e99025e3744f5cdf3d12405b1150b8be9d16f9e1453fa1184aa2606b5',
    },
    portrait: {
      title: 'Pachycephalosaurus fern forest — portrait',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Separately composed 9:16 humid late-Cretaceous forest with towering conifer trunks, tree-fern crowns, mossy logs, layered ferns, a high canopy opening, and a clear path-like centre.`,
      bytes: 2_692_184,
      sha256:
        '6c1eb3b4810efc3009e0a6dbc5f111aa275f1014ecd7e2f17a021de8aca13984',
    },
  },
  plesiosaurus: {
    landscape: {
      title: 'Plesiosaur Jurassic shallow sea — landscape',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。侏罗纪温暖浅海与外海交界，半写实高品质自然史绘本风格，清澈蓝绿色海水，水面光带位于画面顶部约 15%，微弱阳光束，下方约 78% 处才出现低矮沙质海床与少量远处海草、菊石壳和岩礁作为时代线索。横向 16:9 构图；画面中央约 65% 宽度和 55% 高度必须保持开阔、安静、低对比的可游动水域，适合居中叠加一只长颈海生爬行动物的 3D 模型；不要让海草、岩石、气泡群或光束切过动物轮廓。色彩柔和但有层次，环境可信、亲子友好。不要出现任何动物、鱼、人物、潜水员、船、骨骼、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 1_540_514,
      sha256:
        '4b8d6632120bb2d79a4361e6b2e4b3b3bc99980de24f6e07d26f599a04f97dd4',
    },
    portrait: {
      title: 'Plesiosaur Jurassic shallow sea — portrait',
      generatedOn: '2026-07-30',
      prompt:
        '为中文亲子史前动物博物馆生成一张纯环境背景图。侏罗纪温暖浅海与外海交界，半写实高品质自然史绘本风格，清澈蓝绿色海水，水面光带位于画面顶部约 12%，微弱阳光束，沙质海床只在画面底部约 82% 以下出现，边缘有少量远处海草、菊石壳与低矮岩礁作为时代线索。竖向 9:16 构图；画面中央约 78% 宽度从顶部 18% 到底部 78% 必须保持开阔、安静、低对比的可游动水域，适合居中叠加一只长颈海生爬行动物的 3D 模型；不要让海草、岩石、气泡群或强光束切过动物轮廓。色彩柔和但有层次，环境可信、亲子友好。不要出现任何动物、鱼、人物、潜水员、船、骨骼、文字、标志、展柜、UI 或水印。背景本身，不要画边框。',
      bytes: 1_727_512,
      sha256:
        'd6336b8c329a4191b2f4d4e21c87ca894083673d7a30f33f374f941efe51e97f',
    },
  },
  pteranodon: {
    landscape: {
      title: 'Pteranodon inland-sea cliffs — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Late-Cretaceous chalk and limestone coastal cliffs around an immense pale-blue sky and distant calm inland sea, with sparse ledge plants, a low horizon, and open airborne centre; true 16:9 landscape composition.`,
      bytes: 2_170_121,
      sha256:
        '0af35c7711306719b18c9ba8612a2dd28545782004251929985e9abc1655ec60',
    },
    portrait: {
      title: 'Pteranodon inland-sea cliffs — portrait',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Separately composed 9:16 late-Cretaceous cliff-and-inland-sea scene with a very large open vertical sky, low horizon, and narrow limestone side framing to create a strong sense of altitude.`,
      bytes: 2_233_292,
      sha256:
        '9c1fc047d7fb26461f83ebd5c9f45592ede469e782661414f670a068c33e2351',
    },
  },
  ichthyosaur: {
    landscape: {
      title: 'Ichthyosaur ancient shallow sea — landscape',
      generatedOn: '2026-07-26',
      prompt: `${sharedBackgroundPrompt} Ancient shallow sea with rock shelves and sparse edge plants, true 16:9 landscape composition.`,
      bytes: 2_221_760,
      sha256:
        'f65f777996b711eb5ec07b9634593aba5b7ac7ad85e2ae5e97ba943194f3cdb3',
    },
    portrait: {
      title: 'Ichthyosaur ancient shallow sea — portrait',
      generatedOn: '2026-07-26',
      prompt: `${sharedBackgroundPrompt} Ancient shallow sea, separately composed 9:16 portrait counterpart.`,
      bytes: 2_492_307,
      sha256:
        '560ccd0c595ca1aa13bae01ef58f06fb696d295dded3641e4261785516e4e501',
    },
  },
  triceratops: {
    landscape: {
      title: 'Triceratops sage meadow — landscape',
      generatedOn: '2026-07-29',
      prompt: `${sharedBackgroundPrompt} Preserve the accepted broad sage meadow, but raise the horizon to about 43% of the 16:9 frame and extend level central ground beneath a centred Triceratops.`,
      bytes: 2_779_171,
      sha256:
        'd4c30c73854217caf6a81992ba0c09ac25d5d7c2d37616fc09f087a44bf0cbc7',
    },
    portrait: {
      title: 'Triceratops sage meadow — portrait',
      generatedOn: '2026-07-29',
      prompt: `${sharedBackgroundPrompt} Preserve the accepted 9:16 sage meadow, but raise the beginning of the open ground to the central staging band so a centred Triceratops stands firmly on level terrain.`,
      bytes: 2_581_499,
      sha256:
        'b5f6c6747f4da60682e5de591d287170be2befeee28b109f3268d6761eadaee3',
    },
  },
  tyrannosaurusRex: {
    landscape: {
      title: 'Tyrannosaurus wooded floodplain — landscape',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Precisely preserve the accepted raised-horizon late-Cretaceous wooded floodplain composition while brightening the central staging band by about 20–25%, shifting muddy brown ground toward pale cool sandy taupe, and softening the mid-forest to desaturated sage and misty blue-green so a dark-brown Tyrannosaurus remains clearly separated.`,
      bytes: 3_413_758,
      sha256:
        '6a0974c6ca3eedf4ad7eec4419284bdd8b261cdf037d40728b04d577b565e003',
    },
    portrait: {
      title: 'Tyrannosaurus wooded floodplain — portrait',
      generatedOn: '2026-07-29',
      prompt: `${habitatBackgroundPrompt} Precisely preserve the accepted 9:16 raised-horizon wooded floodplain composition while brightening the central model corridor by about 20–25%, replacing muddy brown with pale cool gray-taupe ground, and desaturating the mid-forest toward sage and misty blue-green for stronger separation from a dark-brown Tyrannosaurus.`,
      bytes: 3_301_976,
      sha256:
        '63fd5fb62ca7ed1b413a569aab3682a59c16abd70af3b1a11a7fd1913895cb7a',
    },
  },
} as const satisfies Readonly<
  Record<
    string,
    {
      readonly landscape: BackgroundSource
      readonly portrait: BackgroundSource
    }
  >
>

export interface PublishedAssetProvenanceInput {
  readonly animalName: string
  readonly model: {
    readonly source: ModelSource
    readonly runtime: RuntimeFile
    readonly modifications: readonly [string, ...string[]]
  }
  readonly backgrounds: {
    readonly landscape: {
      readonly source: BackgroundSource
      readonly runtime: RuntimeFile
    }
    readonly portrait: {
      readonly source: BackgroundSource
      readonly runtime: RuntimeFile
    }
  }
  readonly poster: RuntimeFile
  readonly posterPortrait: RuntimeFile
  readonly thumbnail: RuntimeFile
  readonly derivedImagesGeneratedOn?: IsoDate
  readonly narration: RuntimeFile & {
    readonly generatedOn: IsoDate
    readonly script: string
  }
}

const modelLicense = {
  spdx: 'CC-BY-4.0',
  name: 'Creative Commons Attribution 4.0 International',
  url: 'https://creativecommons.org/licenses/by/4.0/',
} as const

const generatedImageLicense = {
  spdx: 'CC-BY-NC-SA-4.0',
  name: 'CC BY-NC-SA 4.0 project-owned ImageGen output',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
} as const

const qwenOutputLicense = {
  spdx: 'CC-BY-NC-SA-4.0',
  name: 'CC BY-NC-SA 4.0 project-owned Qwen3-TTS output',
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
} as const

export function createPublishedAssetProvenance(
  input: PublishedAssetProvenanceInput,
): readonly [AssetProvenance, ...AssetProvenance[]] {
  const modelAttribution = `“${input.model.source.title}” by ${input.model.source.author}, CC BY 4.0; modified for the Prehistoric Animal Museum.`
  const modelEvidence = [
    'provenance/LICENSES/model-license.txt',
    'provenance/LICENSES/model-source.txt',
  ] as const

  return [
    {
      assetPath: 'model/model.glb',
      kind: 'model',
      source: {
        type: 'third-party',
        title: input.model.source.title,
        author: input.model.source.author,
        url: input.model.source.url,
        accessedOn: input.model.source.accessedOn,
        sha256: input.model.source.sha256,
        bytes: input.model.source.bytes,
      },
      license: modelLicense,
      runtime: input.model.runtime,
      modifications: input.model.modifications,
      attribution: modelAttribution,
      redistributionAllowed: true,
      evidencePaths: modelEvidence,
    },
    {
      assetPath: 'backgrounds/landscape.webp',
      kind: 'background',
      source: {
        type: 'generated',
        title: input.backgrounds.landscape.source.title,
        tool: 'OpenAI built-in image_gen',
        generatedOn: input.backgrounds.landscape.source.generatedOn,
        prompt: input.backgrounds.landscape.source.prompt,
        sha256: input.backgrounds.landscape.source.sha256,
        bytes: input.backgrounds.landscape.source.bytes,
      },
      license: generatedImageLicense,
      runtime: input.backgrounds.landscape.runtime,
      modifications: [
        'Converted the reviewed PNG to lossy WebP at quality 82.',
        'Removed ancillary metadata without applying a runtime tint or filter.',
      ],
      attribution: `Project-generated ${input.animalName} landscape created with OpenAI ImageGen.`,
      redistributionAllowed: true,
      evidencePaths: ['provenance/LICENSES/background-generation.txt'],
    },
    {
      assetPath: 'backgrounds/portrait.webp',
      kind: 'background',
      source: {
        type: 'generated',
        title: input.backgrounds.portrait.source.title,
        tool: 'OpenAI built-in image_gen',
        generatedOn: input.backgrounds.portrait.source.generatedOn,
        prompt: input.backgrounds.portrait.source.prompt,
        sha256: input.backgrounds.portrait.source.sha256,
        bytes: input.backgrounds.portrait.source.bytes,
      },
      license: generatedImageLicense,
      runtime: input.backgrounds.portrait.runtime,
      modifications: [
        'Converted the separately composed reviewed PNG to lossy WebP at quality 82.',
        'Removed ancillary metadata without applying a runtime tint or filter.',
      ],
      attribution: `Project-generated ${input.animalName} portrait created with OpenAI ImageGen.`,
      redistributionAllowed: true,
      evidencePaths: ['provenance/LICENSES/background-generation.txt'],
    },
    {
      assetPath: 'images/poster.webp',
      kind: 'poster',
      source: {
        type: 'derived',
        title: `${input.animalName} transparent model still`,
        generatedOn: '2026-08-05',
        inputAssetPaths: ['model/model.glb'],
        method:
          'Rendered the deterministic first animation frame at the normal 1200 × 675 landscape runtime camera, composition, size, pose, and lighting; preserved transparent pixels outside the model and contact shadow.',
      },
      license: modelLicense,
      runtime: input.poster,
      modifications: [
        'Removed the habitat composite and all interface chrome; kept only the model and contact shadow on a transparent background.',
        'Encoded as lossless WebP without text, controls, labels, logos, or watermarks.',
      ],
      attribution: modelAttribution,
      redistributionAllowed: true,
      evidencePaths: [
        ...modelEvidence,
        'provenance/LICENSES/derived-images.txt',
      ],
    },
    {
      assetPath: 'images/poster-portrait.webp',
      kind: 'poster',
      source: {
        type: 'derived',
        title: `${input.animalName} transparent portrait model still`,
        generatedOn: '2026-08-05',
        inputAssetPaths: ['model/model.glb'],
        method:
          'Rendered the deterministic first animation frame at the normal 390 × 844 portrait runtime camera, composition, size, pose, and lighting; preserved transparent pixels outside the model and contact shadow.',
      },
      license: modelLicense,
      runtime: input.posterPortrait,
      modifications: [
        'Removed the habitat composite and all interface chrome; kept only the model and contact shadow on a transparent background.',
        'Encoded as exact lossless WebP without text, controls, labels, logos, or watermarks.',
      ],
      attribution: modelAttribution,
      redistributionAllowed: true,
      evidencePaths: [
        ...modelEvidence,
        'provenance/LICENSES/derived-images.txt',
      ],
    },
    {
      assetPath: 'images/thumbnail.webp',
      kind: 'thumbnail',
      source: {
        type: 'derived',
        title: `${input.animalName} collection thumbnail`,
        generatedOn: input.derivedImagesGeneratedOn ?? '2026-07-28',
        inputAssetPaths: [
          'model/model.glb',
          'backgrounds/landscape.webp',
        ],
        method:
          'Deterministic square crop from the accepted desktop review presentation after hiding all interface chrome.',
      },
      license: modelLicense,
      runtime: input.thumbnail,
      modifications: [
        'Selected a card-size crop that keeps the animal readable.',
        'Exported without embedded text, controls, labels, logos, or watermarks.',
      ],
      attribution: `${modelAttribution} Scene art generated for this project.`,
      redistributionAllowed: true,
      evidencePaths: [
        ...modelEvidence,
        'provenance/LICENSES/derived-images.txt',
      ],
    },
    {
      assetPath: 'audio/narration.zh-CN.mp3',
      kind: 'narration',
      source: {
        type: 'generated',
        title: `${input.animalName} Mandarin narration`,
        tool: 'Qwen3-TTS CustomVoice',
        model: 'Qwen3-TTS-12Hz-0.6B-CustomVoice',
        revision: 'Serena built-in voice; deterministic local generation',
        generatedOn: input.narration.generatedOn,
        prompt: input.narration.script,
        sha256: input.narration.sha256,
        bytes: input.narration.bytes,
      },
      license: qwenOutputLicense,
      runtime: {
        bytes: input.narration.bytes,
        sha256: input.narration.sha256,
      },
      modifications: [
        'Generated offline from the exact reviewed two-sentence script.',
        'Normalized to a reviewed 48 kHz mono MP3 without runtime synthesis.',
      ],
      attribution:
        'Project-generated Mandarin narration produced locally with Qwen3-TTS 0.6B CustomVoice (Serena).',
      redistributionAllowed: true,
      evidencePaths: ['provenance/LICENSES/narration-rights.txt'],
    },
  ]
}
