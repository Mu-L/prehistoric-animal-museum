import type { CompleteDraftAnimalPackage } from '../../types'
import { reviewAssetUrl } from '../../assets'
import { zhCN } from './content.zh-CN'

export const animal = {
  id: 'tyrannosaurus-rex',
  status: 'published',
  kind: 'dinosaur',
  habitat: 'land',
  atmosphere: 'forest',
  content: {
    'zh-CN': zhCN,
  },
  presentation: {
    cameraLightScale: 1.3,
    initialYawDegrees: -90,
    safeAreaPadding: 0.12,
    shadow: 'ground',
    toneMappingExposure: 1.12,
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
    model: reviewAssetUrl('tyrannosaurus-rex', 'model.glb'),
    modelBytes: 6_298_928,
    poster: reviewAssetUrl('tyrannosaurus-rex', 'poster.webp'),
    posterPortrait: reviewAssetUrl(
      'tyrannosaurus-rex',
      'poster-portrait.webp',
    ),
    thumbnail: reviewAssetUrl('tyrannosaurus-rex', 'thumbnail.webp'),
    backgrounds: {
      landscape: reviewAssetUrl(
        'tyrannosaurus-rex',
        'background-landscape',
      ),
      portrait: reviewAssetUrl(
        'tyrannosaurus-rex',
        'background-portrait',
      ),
    },
    narration: {
      status: 'ready',
      sourcePath: 'audio/narration.zh-CN.mp3',
      mimeType: 'audio/mpeg',
      url: reviewAssetUrl('tyrannosaurus-rex', 'narration.mp3'),
    },
  },
  review: {
    badge: '待复看',
    status: '前爪连接与正常咬合 Idle 待复看',
    note:
      '保留已确认方向正确的二次提亮贴图、13 骨骼与 8 秒原地 Idle。根据近景截图，把左右前肢各两枚原本错误跟随头颈的独立指甲组件重新绑定到对应手臂，使指甲与手指全程同步。嘴部保留约 4° 以内的两段式轻缓咬合：下颌皮肤、下牙与舌头共同跟随下颌，上颚和上牙保持跟随头骨，避免再次出现牙齿与嘴分离。',
    checks: [
      '近距离完整观看至少一个循环，确认两侧前爪的四枚指甲始终贴着手指，没有漂浮、迟滞或穿插。',
      '确认两段式嘴部开合清楚，闭合时上下牙列回到自然位置，张嘴时舌头、上下牙列、嘴唇和吻部没有分离或穿模。',
      '确认两脚始终落地，头颈、短前肢和长尾的动作幅度清楚，同时腹部与髋部没有裂缝。',
      '模型约 5.9 万三角面、9.1 MiB、2 个绘制批次；检查手机首次载入、动画、旋转、连续切换和发热。',
      '把嘴唇、露齿、颜色和其他软组织明确视为一种复原，不把尚有争议的细节讲成唯一结论。',
      '旁白中的“霸王龙”“白垩世”与完整播放已通过本轮听审；只有重新生成音频时才重开该门槛。',
    ],
    accent: {
      strong: '#98602f',
      soft: '#efd5ae',
    },
    modelCredit: {
      attribution:
        '“Tyrant King - Tyrannosaurus” by Marcel Schanz, CC BY 4.0; Sketchfab 1K GLB converted, normalized, given a project-authored Body base-colour midtone lift, and rigged in Blender with repaired weights and an in-place museum Idle.',
      licenseName: 'Creative Commons Attribution 4.0 International',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceTitle: 'Tyrant King - Tyrannosaurus',
      sourceUrl:
        'https://sketchfab.com/3d-models/tyrant-king-tyrannosaurus-6465a297fa784598adc49f6e0042d449',
    },
  },
  draftNotes: [
    '本包只在 npm run review 的本地评审模式出现。',
    '评审路由直接读取当前生产模型，以复核前爪连接、正常咬合 Idle、提亮贴图、海报和缩略图。',
    '公开使用时必须展示作者、Sketchfab 来源、CC BY 4.0 链接及项目所做修改。',
  ],
} satisfies CompleteDraftAnimalPackage
