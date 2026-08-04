import { access, readFile, stat } from 'node:fs/promises'

import { inspectGlb, inspectWebp } from './content-validation'
import { localReviewAssetFiles } from './review-assets'

const errors: string[] = []
let totalBytes = 0

for (const [route, absolutePath] of localReviewAssetFiles) {
  try {
    await access(absolutePath)
    const fileStat = await stat(absolutePath)
    totalBytes += fileStat.size
    if (!fileStat.isFile() || fileStat.size === 0) {
      errors.push(`${route} 不是非空普通文件。`)
      continue
    }

    const buffer = await readFile(absolutePath)
    if (route.endsWith('/model.glb')) {
      const inspection = inspectGlb(buffer)
      if (inspection.externalUris.length > 0) {
        errors.push(`${route} 仍引用外部 GLTF 资源。`)
      }
    } else if (route.endsWith('/poster.webp')) {
      const dimensions = inspectWebp(buffer)
      if (dimensions.width !== 960 || dimensions.height !== 540) {
        errors.push(
          `${route} 应为 960×540，实际为 ${dimensions.width}×${dimensions.height}。`,
        )
      }
    } else if (route.endsWith('/thumbnail.webp')) {
      const dimensions = inspectWebp(buffer)
      if (dimensions.width !== 320 || dimensions.height !== 320) {
        errors.push(
          `${route} 应为 320×320，实际为 ${dimensions.width}×${dimensions.height}。`,
        )
      }
    } else if (route.endsWith('/narration.mp3')) {
      const startsWithId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3'
      const startsWithFrameSync =
        buffer.length >= 2 &&
        buffer[0] === 0xff &&
        (buffer[1] ?? 0) >>> 5 === 0b111
      if (!startsWithId3 && !startsWithFrameSync) {
        errors.push(`${route} 没有可识别的 MP3 文件头。`)
      }
      if (fileStat.size > 300 * 1024) {
        errors.push(`${route} 超过 300 KiB 本地评审上限。`)
      }
    } else if (absolutePath.endsWith('.png')) {
      const pngSignature = '89504e470d0a1a0a'
      if (buffer.subarray(0, 8).toString('hex') !== pngSignature) {
        errors.push(`${route} 没有有效的 PNG 文件头。`)
      }
    } else if (absolutePath.endsWith('.webp')) {
      inspectWebp(buffer)
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : '未知文件读取错误'
    errors.push(`${route} → ${absolutePath}（${message}）`)
  }
}

if (errors.length > 0) {
  console.error('Local review assets are incomplete:')
  for (const entry of errors) {
    console.error(`- ${entry}`)
  }
  process.exitCode = 1
} else {
  console.log(
    `Local review assets: ${localReviewAssetFiles.size} route(s), ${totalBytes} byte(s), 0 missing.`,
  )
}
