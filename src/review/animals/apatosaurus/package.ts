import type { CompleteDraftAnimalPackage } from '../../types'
import { reviewAssetUrl } from '../../assets'
import { zhCN } from './content.zh-CN'

export const animal = {
  id: 'apatosaurus',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'plains',
  content: {
    'zh-CN': zhCN,
  },
  presentation: {
    cameraLightScale: 1.3,
    initialYawDegrees: 0,
    landscapeHorizontalOffset: 0.01,
    landscapeVerticalOffset: 0.025,
    portraitVerticalOffset: 0.04,
    safeAreaPadding: 0.12,
    shadow: 'ground',
    shadowOpacity: 0.54,
    shadowScale: 0.7,
    toneMappingExposure: 1.35,
  },
  animation: {
    clip: 'Idle',
    loop: 'repeat',
    speed: 0.9,
  },
  narration: {
    status: 'ready',
    sourcePath: 'audio/narration.zh-CN.mp3',
    mimeType: 'audio/mpeg',
  },
  provenance: [],
  assets: {
    model: reviewAssetUrl('apatosaurus', 'model.glb'),
    modelBytes: 6_222_396,
    poster: reviewAssetUrl('apatosaurus', 'poster.webp'),
    thumbnail: reviewAssetUrl('apatosaurus', 'thumbnail.webp'),
    backgrounds: {
      landscape: reviewAssetUrl('apatosaurus', 'background-landscape'),
      portrait: reviewAssetUrl('apatosaurus', 'background-portrait'),
    },
    narration: {
      status: 'ready',
      sourcePath: 'audio/narration.zh-CN.mp3',
      mimeType: 'audio/mpeg',
      url: reviewAssetUrl('apatosaurus', 'narration.mp3'),
    },
  },
  review: {
    badge: '已验收',
    status: '新迷惑龙模型、Idle 与小图已通过本地评审',
    note:
      '负责人已选定新的迷惑龙派生模型，并要求恢复候选的原始颜色与原有展台亮度；模型保留新的真实法线微表面和 8 秒原地 Idle。四脚与下肢固定，缩放中心、接地、闭环、接缝分离和新增穿模均已通过专项检查。2026-08-04 负责人已完成模型验收，小图也已由新模型在实际平原展厅中的画面重新生成。来源与公开再分发链仍未验证，因此这里只作为本地 review 版本，不代表 production-approved。',
    checks: [
      '确认浏览器场景中的完整轮廓、初始缩放中心和滚轮或双指缩放行为。',
      '观看完整 8 秒 Idle，确认四脚固定、身体连接连续，尾部与颈部动作自然。',
      '确认原始配色已经恢复，皮肤皱褶和微表面在原有展台亮度下自然，不出现规则条纹或塑料感。',
      '确认保持张嘴但不做嘴部动画可以接受。',
    ],
    accent: {
      strong: '#477b76',
      soft: '#d2e5df',
    },
    modelCredit: {
      attribution:
        '“Apatosaurus” by toro ardido modelos 3d; locally rebuilt with welded duplicate vertices, project-authored PBR skin maps, canonical transforms, and an eight-second morph-target Idle. Originality and redistribution rights remain unverified.',
      licenseName: 'Source and redistribution chain unverified',
      licenseUrl:
        'https://sketchfab.com/3d-models/apatosaurus-fecabec8e4ef42ef98b5480dbf50c57d',
      sourceTitle: 'Apatosaurus',
      sourceUrl:
        'https://sketchfab.com/3d-models/apatosaurus-fecabec8e4ef42ef98b5480dbf50c57d',
    },
  },
  draftNotes: [
    '本包只在 npm run review 的本地评审模式出现。',
    '新模型、材质源、Blender 工作文件和离线检查图保留在忽略的本地候选区；没有替换生产目录中的旧迷惑龙。',
    '产品负责人已接受新候选的造型、皮肤和 Idle；来源及公开再分发门禁仍未通过。',
  ],
} satisfies CompleteDraftAnimalPackage
