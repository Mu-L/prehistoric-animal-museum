# 比一比运行时资产来源

## 审批状态

本目录只保存已经选定并用于生产构建的运行时交付文件。Leon 于
2026-08-24 明确批准将这些旁白、儿童角色和环境文件纳入当前分支并公开分发。
生成过程中的源图、脚本、原始模型、被淘汰版本和本地评审证据仍留在 Git
忽略目录，不随应用发布。

## 儿童角色

八个 GLB 和两张设置页肖像来自 Leon 的 Meshy Pro 私有生成任务；肖像以
384×576 WebP 运行时缩略图发布，避免设置页下载约 3.6 MB 的原始 PNG。Leon
确认参考输入权利，并确认项目拥有使用、修改及随应用分发这些交付文件的权限。
生成任务未发布到 Meshy 社区。完整授权声明和条款链接见 `approval.json`。

## 环境

- 森林、海床和雪地 PBR 扫描，以及森林蕨、岩石、倒木和树木代理，来自
  [Poly Haven](https://polyhaven.com/) 的 CC0 资源。具体来源包括 Forest
  Slope、Kloppenheim 03 Pure Sky、Passendorf Snow、Forest Ground 03、
  Coast Sand 02、Snow 02、Fern 02、Rock 07、Dead Tree Trunk，以及用于树木
  LOD 的 Poly Haven 幼树资源。运行时文件是项目压缩、降采样或合并后的衍生物。
- 白垩纪森林远景、戈壁／洪泛平原／石炭纪湿地远景及地表色彩图、天空岛屿
  atlas、猛犸象远景／地表／莎草贴图和水下远景由 Leon做了个项目通过内置
  ImageGen、Blender 或确定性图像处理制作。它们是教学场景用的视觉复原，
  不是化石地点照片或单一地点的科学实景声明。
- 猛犸象山地使用 Mapzen Terrain Tiles 公共数据集的一块 Terrarium 高程瓦片
  `z12/2139/1449`。瓦片只提供高程，不包含可见的道路、建筑、标签或摄影纹理。
  数据集记录见 [AWS Open Data Registry](https://registry.opendata.aws/terrain-tiles/)。
- 代码内保留了各环境的时代、地点、生态代理和生成边界。所有发布二进制的
  SHA-256 固定在 `SHA256SUMS`，构建测试会逐文件验证。

## 旁白

比一比与静态场馆使用相同的 `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`
模型、固定 revision `85e237c12c027371202489a0ec509ded67b5e4b5` 和内置
`Serena` 声线。比一比的独立脚本先按动物和语言生成连续母带，再切成引导阶段；
整条母带统一提速 1.04 倍，不变调。逐文件脚本、时长、母带证据与 SHA-256
记录在 `../audio/narration-candidates.json`。
