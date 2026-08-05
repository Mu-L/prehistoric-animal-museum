import type {
  PublishedAnimalPackage,
  PublishedAnimalDefinition,
} from './types'

export interface PublishedAnimalAssetUrls {
  readonly backgroundLandscape: string
  readonly backgroundPortrait: string
  readonly model: string
  readonly narration: string
  readonly poster: string
  readonly posterPortrait: string
  readonly thumbnail: string
}

export function createRuntimeAnimal(
  definition: PublishedAnimalDefinition,
  urls: PublishedAnimalAssetUrls,
): PublishedAnimalPackage {
  const modelRecord = definition.provenance.find(
    (record) => record.assetPath === 'model/model.glb',
  )
  if (!modelRecord) {
    throw new Error(`动物 “${definition.id}” 缺少模型来源记录。`)
  }

  return {
    ...definition,
    assets: {
      model: urls.model,
      modelBytes: modelRecord.runtime.bytes,
      poster: urls.poster,
      posterPortrait: urls.posterPortrait,
      thumbnail: urls.thumbnail,
      backgrounds: {
        landscape: urls.backgroundLandscape,
        portrait: urls.backgroundPortrait,
      },
      narration: {
        status: 'ready',
        sourcePath: 'audio/narration.zh-CN.mp3',
        mimeType: 'audio/mpeg',
        url: urls.narration,
      },
    },
  }
}
