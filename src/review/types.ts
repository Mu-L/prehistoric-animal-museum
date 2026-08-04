import type {
  AnimalStatus,
  DraftAnimalPackage,
  PublishedAnimalAssets,
  PublishedAnimalPackage,
} from '../content/types'

export interface LocalReviewInfo {
  readonly badge: string
  readonly status: string
  readonly note: string
  readonly checks: readonly [string, ...string[]]
  readonly accent: {
    readonly strong: string
    readonly soft: string
  }
  readonly modelCredit?: {
    readonly attribution: string
    readonly licenseName: string
    readonly licenseUrl: string
    readonly sourceTitle: string
    readonly sourceUrl: string
  }
}

export type CompleteDraftAnimalPackage = Omit<
  DraftAnimalPackage,
  'assets' | 'status'
> & {
  readonly status: AnimalStatus
  readonly assets: PublishedAnimalAssets
  readonly review: LocalReviewInfo
}

export type DisplayableAnimalPackage =
  | (PublishedAnimalPackage & { readonly review?: LocalReviewInfo })
  | CompleteDraftAnimalPackage
