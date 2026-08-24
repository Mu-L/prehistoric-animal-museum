import type { ChildProfile } from './types'

export const SCALE_ENCOUNTER_PROFILE_STORAGE_KEY =
  'museum.scaleEncounterProfile.v1'

interface StoredScaleEncounterProfile {
  readonly profile: ChildProfile
  readonly version: 1
}

function isChildProfile(value: unknown): value is ChildProfile {
  if (value === null || typeof value !== 'object') return false
  const candidate = value as Partial<ChildProfile>
  return (
    (candidate.gender === 'boy' || candidate.gender === 'girl') &&
    Number.isInteger(candidate.heightCm) &&
    candidate.heightCm !== undefined &&
    candidate.heightCm >= 90 &&
    candidate.heightCm <= 130 &&
    candidate.heightCm % 5 === 0 &&
    (candidate.approach === undefined ||
      candidate.approach === 'comfortable' ||
      candidate.approach === 'close')
  )
}

export function parseScaleEncounterProfile(
  serialized: string | null,
): ChildProfile | null {
  if (!serialized) return null
  try {
    const payload: unknown = JSON.parse(serialized)
    if (payload === null || typeof payload !== 'object') return null
    const candidate = payload as Partial<StoredScaleEncounterProfile>
    return candidate.version === 1 && isChildProfile(candidate.profile)
      ? candidate.profile
      : null
  } catch {
    return null
  }
}

export function readScaleEncounterProfile(
  storage: Pick<Storage, 'getItem'> | null =
    typeof window === 'undefined' ? null : window.sessionStorage,
): ChildProfile | null {
  if (!storage) return null
  try {
    return parseScaleEncounterProfile(
      storage.getItem(SCALE_ENCOUNTER_PROFILE_STORAGE_KEY),
    )
  } catch {
    return null
  }
}

export function writeScaleEncounterProfile(
  profile: ChildProfile | null,
  storage: Pick<Storage, 'removeItem' | 'setItem'> | null =
    typeof window === 'undefined' ? null : window.sessionStorage,
): void {
  if (!storage) return
  try {
    if (profile === null) {
      storage.removeItem(SCALE_ENCOUNTER_PROFILE_STORAGE_KEY)
      return
    }
    storage.setItem(
      SCALE_ENCOUNTER_PROFILE_STORAGE_KEY,
      JSON.stringify({ profile, version: 1 } satisfies StoredScaleEncounterProfile),
    )
  } catch {
    // Storage can be disabled or full. The encounter still works for the
    // current page when persistence is unavailable.
  }
}
