import {
  MODEL_PREVIEW_CONTRACT_VERSION,
  MODEL_PREVIEW_MANIFEST_FILE,
  modelPreviewProfiles,
  selectModelPreviewProfile,
} from '../src/viewer/model-preview-profiles'

// Keep Vitest focused on the fast, in-memory contract. The production build
// runs scripts/validate-model-previews.ts for the full 108-image decode,
// transparency, dimension, source-signature, and manifest audit.
describe('model preview contract', () => {
  it('keeps the shared profile catalog stable and unambiguous', () => {
    expect(MODEL_PREVIEW_CONTRACT_VERSION).toBe(1)
    expect(MODEL_PREVIEW_MANIFEST_FILE).toBe(
      'model-preview.manifest.json',
    )
    expect(modelPreviewProfiles).toHaveLength(6)
    expect(new Set(modelPreviewProfiles.map(({ key }) => key)).size).toBe(
      modelPreviewProfiles.length,
    )
    expect(
      new Set(modelPreviewProfiles.map(({ fileName }) => fileName)).size,
    ).toBe(modelPreviewProfiles.length)

    for (const profile of modelPreviewProfiles) {
      expect(profile.fileName).toMatch(/^preview-[a-z-]+\.webp$/)
      expect(profile.width).toBeGreaterThan(0)
      expect(profile.height).toBeGreaterThan(0)
      expect(profile.referenceWidth).toBeGreaterThan(0)
      expect(profile.referenceHeight).toBeGreaterThan(0)
    }
  })

  it('selects the first matching profile and uses desktop standard as fallback', () => {
    const phoneTall = selectModelPreviewProfile(
      (media) => media === modelPreviewProfiles[3].media,
    )
    expect(phoneTall.key).toBe('phonePortraitTall')

    const firstOfSeveralMatches = selectModelPreviewProfile(
      (media) =>
        media === modelPreviewProfiles[0].media ||
        media === modelPreviewProfiles[5].media,
    )
    expect(firstOfSeveralMatches.key).toBe('landscapeCompact')

    expect(selectModelPreviewProfile(() => false).key).toBe(
      'desktopStandard',
    )
  })
})
