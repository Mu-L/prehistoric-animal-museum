export const SCALE_ENCOUNTER_ANIMAL_IDS = [
  'stegosaurus',
  'pteranodon',
  'pachycephalosaurus',
  'ichthyosaur',
  'tyrannosaurus-rex',
  'rhamphorhynchus',
  'triceratops',
  'apatosaurus',
  'plesiosaurus',
  'gigantoraptor',
  'tupandactylus',
  'mammoth',
  'megalodon',
  'maiasaura',
  'sauropelta',
  'meganeura',
  'dilophosaurus',
  'mosasaurus',
] as const

export type ScaleEncounterAnimalId =
  (typeof SCALE_ENCOUNTER_ANIMAL_IDS)[number]

export type ScaleEncounterEnvironmentTheme =
  | 'forest'
  | 'glacier'
  | 'sky'
  | 'ocean'

export type ScaleEncounterAvatarPresentationProfile =
  | 'land-explorer'
  | 'snow-expedition'
  | 'air-wingsuit'
  | 'water-diver'

export type ScaleEncounterScaleConfidence = 'range-midpoint' | 'representative'

export type ScaleEncounterApproach = 'comfortable' | 'close'

export type ChildProfile = {
  readonly approach?: ScaleEncounterApproach
  readonly gender: 'boy' | 'girl'
  readonly heightCm: number
}

const SCALE_ENCOUNTER_ANIMAL_ID_SET: ReadonlySet<string> = new Set(
  SCALE_ENCOUNTER_ANIMAL_IDS,
)

export function isScaleEncounterAnimal(
  animalId: string,
): animalId is ScaleEncounterAnimalId {
  return SCALE_ENCOUNTER_ANIMAL_ID_SET.has(animalId)
}
