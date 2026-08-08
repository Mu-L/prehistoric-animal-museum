export const pilotAnimalDetailIds = [
  'stegosaurus',
  'tyrannosaurus-rex',
  'mosasaurus',
] as const

export type PilotAnimalDetailId = (typeof pilotAnimalDetailIds)[number]
