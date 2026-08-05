export const animalIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const sha256Pattern = /^[a-f0-9]{64}$/
export const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

export type AnimalStatus = 'draft' | 'published'
export type AnimalKind =
  | 'dinosaur'
  | 'pterosaur'
  | 'marine-reptile'
  | 'other-prehistoric-animal'
export type Habitat = 'land' | 'air' | 'water'
export type AtmosphereKind =
  | 'air'
  | 'forest'
  | 'ice'
  | 'plains'
  | 'underwater'
export type Diet = 'herbivore' | 'carnivore' | 'omnivore' | 'unknown'
export type Locale = 'zh-CN'
export type Sha256 = string
export type IsoDate = string

export type AnimalSizeFact =
  | {
      readonly kind: 'body-length' | 'shoulder-height' | 'wingspan'
      readonly minMeters: number
      readonly maxMeters: number
    }
  | {
      readonly kind: 'group-range'
      readonly minMeters: number
      readonly maxMeters: number
      readonly note: string
    }

export interface PronunciationEntry {
  readonly text: string
  readonly reading: string
  readonly note?: string
}

export interface ScientificSource {
  readonly title: string
  readonly url: `https://${string}`
  readonly accessedOn: IsoDate
}

export interface AnimalContentZhCN {
  readonly name: string
  readonly classificationLabel: string
  readonly visibleFeature: string
  readonly narration: {
    readonly sentences: readonly [string, string]
    readonly pronunciation: readonly [
      PronunciationEntry,
      ...PronunciationEntry[],
    ]
  }
  readonly facts: {
    readonly period: string
    readonly discoveryRegions: readonly [string, ...string[]]
    readonly size: AnimalSizeFact
    readonly diet: Diet
  }
  readonly parentClassificationNote: string
  readonly sources: readonly [ScientificSource, ...ScientificSource[]]
  readonly editorial: {
    readonly uncertaintyNotes: readonly string[]
    readonly editedBy: string
    readonly reviewedBy: string
    readonly reviewedOn: IsoDate
  }
}

export interface AnimalPresentation {
  readonly cameraLightScale?: number
  readonly initialYawDegrees: number
  /**
   * Moves the fitted model inside the desktop/landscape composition frame.
   * Negative values move it toward audience-left.
   */
  readonly landscapeHorizontalOffset?: number
  /**
   * Moves the fitted model vertically inside the desktop/landscape
   * composition frame. Positive values move it toward the ground.
   */
  readonly landscapeVerticalOffset?: number
  /**
   * Optional equivalent nudge for portrait layouts. Omit to keep the fitted
   * bounds geometrically centred.
   */
  readonly portraitHorizontalOffset?: number
  /**
   * Portrait equivalent of landscapeVerticalOffset.
   * Positive values move the model toward the bottom of the stage.
   */
  readonly portraitVerticalOffset?: number
  /**
   * Adds portrait-only breathing room for unusually wide silhouettes.
   * Falls back to safeAreaPadding when omitted.
   */
  readonly portraitSafeAreaPadding?: number
  readonly safeAreaPadding: number
  /**
   * Fits and grounds against the animated skin at the first frame instead of
   * relying on a mesh's bind-space bounding box.
   */
  readonly preciseBounds?: boolean
  readonly shadow: 'ground' | 'none'
  readonly shadowOpacity?: number
  readonly shadowScale?: number
  /** Optional footprint-depth scale, independent of the silhouette length. */
  readonly shadowDepthScale?: number
  /** Moves the shadow along the animal's initial left/right stage axis. */
  readonly shadowHorizontalOffset?: number
  /** Moves the shadow toward or away from the initial camera. */
  readonly shadowDepthOffset?: number
  /**
   * Small vertical adjustment from the fitted visible foot-contact plane.
   */
  readonly shadowYOffset?: number
  readonly toneMappingExposure?: number
}

export interface AnimalAnimation {
  readonly clip: string
  readonly loop: 'repeat' | 'once'
  readonly speed: number
}

export type CanonicalRuntimeAssetPath =
  | 'model/model.glb'
  | 'images/poster.webp'
  | 'images/poster-portrait.webp'
  | 'images/thumbnail.webp'
  | 'backgrounds/landscape.webp'
  | 'backgrounds/portrait.webp'
  | 'audio/narration.zh-CN.mp3'

export type AssetKind =
  | 'model'
  | 'embedded-textures'
  | 'background'
  | 'poster'
  | 'thumbnail'
  | 'narration'

export type LicenseIdentifier =
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-NC-SA-4.0'
  | 'LicenseRef-Public-Domain'
  | 'LicenseRef-OpenAI-Output'
  | 'MIT'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'Apache-2.0'

export interface AssetLicense {
  readonly spdx: LicenseIdentifier
  readonly name: string
  readonly url: `https://${string}`
}

export interface ThirdPartyAssetSource {
  readonly type: 'third-party'
  readonly title: string
  readonly author: string
  readonly url: `https://${string}`
  readonly accessedOn: IsoDate
  readonly sha256: Sha256
  readonly bytes: number
}

export interface GeneratedAssetSource {
  readonly type: 'generated'
  readonly title: string
  readonly tool: string
  readonly model?: string
  readonly revision?: string
  readonly generatedOn: IsoDate
  readonly prompt: string
  readonly sha256: Sha256
  readonly bytes: number
}

export interface DerivedAssetSource {
  readonly type: 'derived'
  readonly title: string
  readonly generatedOn: IsoDate
  readonly inputAssetPaths: readonly [
    CanonicalRuntimeAssetPath,
    ...CanonicalRuntimeAssetPath[],
  ]
  readonly method: string
}

export type AssetSource =
  | ThirdPartyAssetSource
  | GeneratedAssetSource
  | DerivedAssetSource

export interface AssetProvenance {
  readonly assetPath: CanonicalRuntimeAssetPath
  readonly kind: AssetKind
  readonly source: AssetSource
  readonly license: AssetLicense
  readonly runtime: {
    readonly sha256: Sha256
    readonly bytes: number
  }
  readonly modifications: readonly [string, ...string[]]
  readonly attribution: string
  readonly redistributionAllowed: boolean
  readonly evidencePaths: readonly [string, ...string[]]
}

export interface ReadyNarrationPlan {
  readonly status: 'ready'
  readonly sourcePath: 'audio/narration.zh-CN.mp3'
  readonly mimeType: 'audio/mpeg'
}

export interface PendingNarrationPlan {
  readonly status: 'pending-review'
  readonly expectedPath: 'audio/narration.zh-CN.mp3'
  readonly message: '介绍准备中'
  readonly gate: {
    readonly id: 'final-serena-narration'
    readonly reason: string
  }
}

export type NarrationPlan = ReadyNarrationPlan | PendingNarrationPlan

export interface ReadyNarrationAsset extends ReadyNarrationPlan {
  readonly url: string
}

export type NarrationAsset = ReadyNarrationAsset | PendingNarrationPlan

export interface PublishedAnimalAssets {
  readonly model: string
  /** Exact encoded byte length of the runtime GLB at `model`. */
  readonly modelBytes: number
  readonly poster: string
  readonly posterPortrait?: string
  readonly thumbnail: string
  readonly backgrounds: {
    readonly landscape: string
    readonly portrait: string
  }
  readonly narration: NarrationAsset
}

export interface DraftAnimalAssets {
  readonly model?: string
  /** Exact encoded byte length of the runtime GLB at `model`, when present. */
  readonly modelBytes?: number
  readonly poster?: string
  readonly thumbnail?: string
  readonly backgrounds?: {
    readonly landscape?: string
    readonly portrait?: string
  }
  readonly narration?: NarrationAsset
}

interface AnimalPackageCommon {
  readonly id: string
  readonly kind: AnimalKind
  readonly habitat: Habitat
  readonly atmosphere: AtmosphereKind
  readonly content: {
    readonly 'zh-CN': AnimalContentZhCN
  }
  readonly presentation: AnimalPresentation
  readonly animation?: AnimalAnimation
  readonly narration: NarrationPlan
  readonly provenance: readonly AssetProvenance[]
}

export interface PublishedAnimalPackage extends AnimalPackageCommon {
  readonly status: 'published'
  readonly assets: PublishedAnimalAssets
  readonly provenance: readonly [
    AssetProvenance,
    ...AssetProvenance[],
  ]
}

export interface DraftAnimalPackage extends AnimalPackageCommon {
  readonly status: 'draft'
  readonly assets: DraftAnimalAssets
  readonly draftNotes: readonly [string, ...string[]]
}

export type AnimalPackage = PublishedAnimalPackage | DraftAnimalPackage

export type PublishedAnimalDefinition = Omit<PublishedAnimalPackage, 'assets'>
export type DraftAnimalDefinition = Omit<DraftAnimalPackage, 'assets'>
export type AnimalPackageDefinition =
  | PublishedAnimalDefinition
  | DraftAnimalDefinition

export interface AnimalModule {
  readonly animal: AnimalPackage
}

export interface AnimalDefinitionModule {
  readonly animalDefinition: AnimalPackageDefinition
}

export interface AnimalCollection<AnimalId extends string = string> {
  readonly id: string
  readonly animalIds: readonly [AnimalId, ...AnimalId[]]
  readonly defaultAnimalId: AnimalId
  readonly loop: boolean
}

export interface CreditEntry {
  readonly id: string
  readonly animalId: string
  readonly assetPath: CanonicalRuntimeAssetPath
  readonly assetKind: AssetKind
  readonly sourceTitle: string
  readonly author: string
  readonly licenseName: string
  readonly licenseUrl: string
  readonly sourceUrl?: string
  readonly attribution: string
  readonly modifications: readonly string[]
}
