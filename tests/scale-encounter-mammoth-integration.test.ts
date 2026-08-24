import { Group } from 'three'

import {
  createScaleEncounterEnvironment,
  disposeScaleEncounterEnvironment,
} from '../src/viewer/scale-encounter-environment'
import {
  MAMMOTH_PALAEOENVIRONMENT_PRODUCTION_CANDIDATE_ID,
} from '../src/scale-encounter/environments/glacier'
import {
  defaultScaleEncounterSceneCandidateVariant,
  parseScaleEncounterSceneCandidateVariant,
  sceneCandidateSemanticName,
} from '../src/scale-encounter/environments/scene-candidate'

describe('mammoth palaeoenvironment main-runtime registration', () => {
  it('keeps the candidate opt-in and rejects invalid URL values', () => {
    expect(parseScaleEncounterSceneCandidateVariant(null)).toBe('off')
    expect(parseScaleEncounterSceneCandidateVariant('production')).toBe('off')
    expect(parseScaleEncounterSceneCandidateVariant('C')).toBe('C')
    expect(parseScaleEncounterSceneCandidateVariant('D', 'mammoth')).toBe('C')
    expect(parseScaleEncounterSceneCandidateVariant('D', 'mosasaurus')).toBe('D')
    expect(sceneCandidateSemanticName('mammoth')).toBe(
      'mammoth-palaeoenvironment',
    )
  })

  it('locks the four owner-accepted local scene defaults', () => {
    expect(defaultScaleEncounterSceneCandidateVariant('mammoth')).toBe('E')
    expect(
      defaultScaleEncounterSceneCandidateVariant('tyrannosaurus-rex'),
    ).toBe('off')
    expect(defaultScaleEncounterSceneCandidateVariant('pteranodon')).toBe('D')
    expect(defaultScaleEncounterSceneCandidateVariant('mosasaurus')).toBe('D')
  })

  it('registers C on the legacy glacier key without presenting bare ice as support', () => {
    const environment = createScaleEncounterEnvironment(
      'land',
      'baseline',
      null,
      {
        animalId: 'mammoth',
        forestProps: new Group(),
        sceneCandidateVariant: 'C',
      },
    )
    expect(environment).not.toBeNull()
    expect(environment?.sceneCandidateSemantic).toBe(
      'mammoth-palaeoenvironment',
    )
    expect(environment?.sceneCandidateVariant).toBe('C')
    expect(environment?.root.getObjectByName(
      'glacier-ground-surface-unglaciated-land',
    )).toBeTruthy()
    expect(environment?.root.getObjectByName(
      'glacier-far-ice-mass-direction-reference',
    )).toBeTruthy()
    expect(environment?.root.getObjectByName('glacier-crevasse')).toBeFalsy()
    expect(environment?.root.userData.scaleEncounterSceneCandidate).toMatchObject({
      buildSource: MAMMOTH_PALAEOENVIRONMENT_PRODUCTION_CANDIDATE_ID,
      defaultCandidate: false,
      legacyTechnicalKey: 'glacier',
      productionApproved: false,
      semanticName: 'mammoth-palaeoenvironment',
      variant: 'C',
    })
    disposeScaleEncounterEnvironment(environment)
  })
})
