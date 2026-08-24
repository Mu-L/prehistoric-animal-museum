import { Texture } from 'three'
import {
  SCALE_ENCOUNTER_ENVIRONMENT_THEMES,
  scaleEncounterEnvironmentThemePlanFor,
} from '../src/scale-encounter/environment-theme-registry'
import { SCALE_ENCOUNTER_ANIMAL_IDS } from '../src/scale-encounter/types'
import {
  disposeScaleEncounterEnvironment,
  createScaleEncounterEnvironment,
} from '../src/viewer/scale-encounter-environment'
import { SCALE_ENCOUNTER_DEFINITIONS } from '../src/viewer/scale-encounter'

describe('scale encounter reusable environment theme registry', () => {
  it.each([
    [
      'gigantoraptor',
      'gobi',
      '戈壁',
      [
        'procedural-sky',
        'procedural-terrain',
        'procedural-surface',
        'procedural-ecology',
      ],
    ],
    [
      'dilophosaurus',
      'floodplain',
      '洪泛平原',
      [
        'procedural-sky',
        'procedural-terrain',
        'procedural-surface',
        'procedural-ecology',
        'procedural-water',
      ],
    ],
    [
      'meganeura',
      'carboniferous-wetland-forest',
      '石炭纪湿地森林',
      [
        'procedural-sky',
        'procedural-terrain',
        'procedural-surface',
        'procedural-ecology',
        'procedural-water',
      ],
    ],
  ] as const)(
    'keeps %s registered against %s while the reviewed forest is restored',
    (animalId, expectedThemeId, expectedLabel, expectedContract) => {
      const plan = scaleEncounterEnvironmentThemePlanFor(
        animalId,
        SCALE_ENCOUNTER_DEFINITIONS[animalId].environmentTheme,
      )

      expect(plan.target).toMatchObject({
        id: expectedThemeId,
        labels: { zhCN: expectedLabel },
        assetStatus: 'awaiting-baseline-assets',
        fallbackThemeId: 'cretaceous-forest',
        loadPolicy: 'selected-theme-only',
        revealPolicy: 'keep-current-scene-until-baseline-ready',
        runtimePanoramaTheme: null,
        runtimeKind: 'procedural-biome',
      })
      expect(plan.target.baselineAssetContract).toEqual(expectedContract)
      expect(plan.runtime).toMatchObject({
        id: 'cretaceous-forest',
        assetStatus: 'active',
        runtimeKind: 'panorama-pbr',
        runtimePanoramaTheme: 'land-cretaceous',
      })
      expect(plan.usingCompatibilityFallback).toBe(true)
    },
  )

  it('keeps every existing animal resolvable through one reusable theme contract', () => {
    for (const animalId of SCALE_ENCOUNTER_ANIMAL_IDS) {
      const definition = SCALE_ENCOUNTER_DEFINITIONS[animalId]
      const plan = scaleEncounterEnvironmentThemePlanFor(
        animalId,
        definition.environmentTheme,
      )
      expect(plan.target.rendererFamily).toBe(definition.environmentTheme)
      expect(plan.runtime.assetStatus).toBe('active')
      if (plan.runtime.runtimeKind === 'panorama-pbr') {
        expect(plan.runtime.runtimePanoramaTheme).not.toBeNull()
      } else {
        expect(plan.runtime.runtimePanoramaTheme).toBeNull()
      }
      expect(plan.target.loadPolicy).toBe('selected-theme-only')
    }
    expect(Object.keys(SCALE_ENCOUNTER_ENVIRONMENT_THEMES)).toHaveLength(7)
  })

  it('publishes the dormant target and restored forest runtime on the scene graph', () => {
    const panorama = new Texture()
    const environment = createScaleEncounterEnvironment(
      'land',
      'production-slice',
      panorama,
      { animalId: 'gigantoraptor' },
    )

    expect(environment?.root.userData).toMatchObject({
      scaleEncounterEnvironmentAssetStatus: 'awaiting-baseline-assets',
      scaleEncounterEnvironmentLoadPolicy: 'selected-theme-only',
      scaleEncounterEnvironmentRevealPolicy:
        'keep-current-scene-until-baseline-ready',
      scaleEncounterEnvironmentRuntimeTheme: 'cretaceous-forest',
      scaleEncounterEnvironmentTargetTheme: 'gobi',
      scaleEncounterEnvironmentUsingCompatibilityFallback: true,
    })
    expect(
      environment?.root.getObjectByName(
        'scale-encounter-accepted-forested-mountain-basin',
      ),
    ).toBeTruthy()
    expect(environment?.sceneCandidateSemantic).toBeNull()
    disposeScaleEncounterEnvironment(environment)
    panorama.dispose()
  })
})
