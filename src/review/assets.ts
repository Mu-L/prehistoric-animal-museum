export type LocalReviewAnimalId =
  | 'stegosaurus'
  | 'pachycephalosaurus'
  | 'ichthyosaur'
  | 'pteranodon'
  | 'tyrannosaurus-rex'
  | 'triceratops'
  | 'apatosaurus'
  | 'gigantoraptor'
  | 'mammoth'
  | 'maiasaura'
  | 'plesiosaurus'
  | 'megalodon'
  | 'sauropelta'
  | 'dilophosaurus'
  | 'mosasaurus'
  | 'rhamphorhynchus'
  | 'tupandactylus'
  | 'meganeura'

export function reviewAssetUrl(
  animalId: LocalReviewAnimalId,
  fileName:
    | 'model.glb'
    | 'background-landscape'
    | 'background-portrait'
    | 'narration.mp3'
    | 'poster.webp'
    | 'thumbnail.webp',
): string {
  return `/__museum-review-assets/${animalId}/${fileName}`
}
