import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import type { LocalReviewAnimalId } from '../src/review/assets'

export const localReviewAssetPrefix = '/__museum-review-assets'

function repositoryFile(relativePath: string): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', relativePath)
}

function productionAnimalAsset(
  animalId: LocalReviewAnimalId,
  relativePath: string,
): string {
  return repositoryFile(`src/content/animals/${animalId}/${relativePath}`)
}

const ichthyosaurBackgrounds = {
  landscape: repositoryFile(
    'prototypes/background-art-directions/assets/production-ichthyosaur-landscape.png',
  ),
  portrait: repositoryFile(
    'prototypes/background-art-directions/assets/production-ichthyosaur-portrait.png',
  ),
}

interface ReviewAnimalFiles {
  readonly model: string
  readonly backgroundLandscape: string
  readonly backgroundPortrait: string
  readonly narration?: string
  readonly poster: string
  readonly thumbnail: string
}

const reviewAnimalFiles: Readonly<
  Record<LocalReviewAnimalId, ReviewAnimalFiles>
> = {
  stegosaurus: {
    model: repositoryFile(
      'src/content/animals/stegosaurus/model/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'src/content/animals/stegosaurus/backgrounds/landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'src/content/animals/stegosaurus/backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/stegosaurus/audio-candidates/stegosaurus-serena-preview.mp3',
    ),
    poster: repositoryFile(
      'src/content/animals/stegosaurus/images/poster.webp',
    ),
    thumbnail: repositoryFile(
      'src/content/animals/stegosaurus/images/thumbnail.webp',
    ),
  },
  pachycephalosaurus: {
    model: repositoryFile(
      'assets/candidates/second-pass-sketchfab/normalized-glb/pachycephalosaurus.glb',
    ),
    backgroundLandscape: productionAnimalAsset(
      'pachycephalosaurus',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'pachycephalosaurus',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/pachycephalosaurus.mp3',
    ),
    poster: productionAnimalAsset(
      'pachycephalosaurus',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'pachycephalosaurus',
      'images/thumbnail.webp',
    ),
  },
  ichthyosaur: {
    model: repositoryFile(
      'assets/candidates/ichthyosaur-sketchfab-julian-2026-08-04/output/model-review.glb',
    ),
    backgroundLandscape: ichthyosaurBackgrounds.landscape,
    backgroundPortrait: ichthyosaurBackgrounds.portrait,
    narration: repositoryFile(
      '.handoff/collection-review/audio/ichthyosaur.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/ichthyosaur-sketchfab-julian-2026-08-04/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/ichthyosaur-sketchfab-julian-2026-08-04/output/thumbnail.webp',
    ),
  },
  pteranodon: {
    model: productionAnimalAsset('pteranodon', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'pteranodon',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'pteranodon',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/pteranodon.mp3',
    ),
    poster: productionAnimalAsset(
      'pteranodon',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'pteranodon',
      'images/thumbnail.webp',
    ),
  },
  'tyrannosaurus-rex': {
    model: productionAnimalAsset('tyrannosaurus-rex', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'tyrannosaurus-rex',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'tyrannosaurus-rex',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/tyrannosaurus-rex.mp3',
    ),
    poster: productionAnimalAsset(
      'tyrannosaurus-rex',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'tyrannosaurus-rex',
      'images/thumbnail.webp',
    ),
  },
  triceratops: {
    model: productionAnimalAsset('triceratops', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'triceratops',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'triceratops',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/triceratops.mp3',
    ),
    poster: productionAnimalAsset(
      'triceratops',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'triceratops',
      'images/thumbnail.webp',
    ),
  },
  apatosaurus: {
    model: repositoryFile(
      'assets/candidates/apatosaurus-sketchfab-fecabec8-2026-08/revision-v1/output/apatosaurus-review.glb',
    ),
    backgroundLandscape: productionAnimalAsset(
      'apatosaurus',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'apatosaurus',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/apatosaurus.mp3',
    ),
    poster: productionAnimalAsset(
      'apatosaurus',
      'images/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/apatosaurus-sketchfab-fecabec8-2026-08/revision-v1/output/thumbnail.webp',
    ),
  },
  gigantoraptor: {
    model: productionAnimalAsset('gigantoraptor', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'gigantoraptor',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'gigantoraptor',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/gigantoraptor.mp3',
    ),
    poster: productionAnimalAsset(
      'gigantoraptor',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'gigantoraptor',
      'images/thumbnail.webp',
    ),
  },
  mammoth: {
    model: productionAnimalAsset('mammoth', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'mammoth',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'mammoth',
      'backgrounds/portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/collection-review/audio/mammoth.mp3',
    ),
    poster: productionAnimalAsset(
      'mammoth',
      'images/poster.webp',
    ),
    thumbnail: productionAnimalAsset(
      'mammoth',
      'images/thumbnail.webp',
    ),
  },
  maiasaura: {
    model: productionAnimalAsset('maiasaura', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'maiasaura',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'maiasaura',
      'backgrounds/portrait.webp',
    ),
    narration: productionAnimalAsset(
      'maiasaura',
      'audio/narration.zh-CN.mp3',
    ),
    poster: productionAnimalAsset('maiasaura', 'images/poster.webp'),
    thumbnail: productionAnimalAsset('maiasaura', 'images/thumbnail.webp'),
  },
  plesiosaurus: {
    model: productionAnimalAsset('plesiosaurus', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'plesiosaurus',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'plesiosaurus',
      'backgrounds/portrait.webp',
    ),
    narration: productionAnimalAsset(
      'plesiosaurus',
      'audio/narration.zh-CN.mp3',
    ),
    poster: productionAnimalAsset('plesiosaurus', 'images/poster.webp'),
    thumbnail: productionAnimalAsset(
      'plesiosaurus',
      'images/thumbnail.webp',
    ),
  },
  megalodon: {
    model: productionAnimalAsset('megalodon', 'model/model.glb'),
    backgroundLandscape: productionAnimalAsset(
      'megalodon',
      'backgrounds/landscape.webp',
    ),
    backgroundPortrait: productionAnimalAsset(
      'megalodon',
      'backgrounds/portrait.webp',
    ),
    narration: productionAnimalAsset(
      'megalodon',
      'audio/narration.zh-CN.mp3',
    ),
    poster: productionAnimalAsset('megalodon', 'images/poster.webp'),
    thumbnail: productionAnimalAsset('megalodon', 'images/thumbnail.webp'),
  },
  sauropelta: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/sauropelta/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/sauropelta/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/sauropelta/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-07-31-batch/sauropelta/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/sauropelta/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/sauropelta/output/thumbnail.webp',
    ),
  },
  dilophosaurus: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/dilophosaurus/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/dilophosaurus/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/dilophosaurus/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-07-31-batch/dilophosaurus/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/dilophosaurus/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/dilophosaurus/output/thumbnail.webp',
    ),
  },
  mosasaurus: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/mosasaurus/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/mosasaurus/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/mosasaurus/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-07-31-batch/mosasaurus/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/mosasaurus/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/mosasaurus/output/thumbnail.webp',
    ),
  },
  rhamphorhynchus: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/rhamphorhynchus/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/rhamphorhynchus/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/rhamphorhynchus/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-07-31-rhamphorhynchus/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/rhamphorhynchus/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-07-31/rhamphorhynchus/output/thumbnail.webp',
    ),
  },
  tupandactylus: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/tupandactylus/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/tupandactylus/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/tupandactylus/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-08-01-tupandactylus/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/tupandactylus/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/tupandactylus/output/thumbnail.webp',
    ),
  },
  meganeura: {
    model: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/meganeura/output/model.glb',
    ),
    backgroundLandscape: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/meganeura/output/background-landscape.webp',
    ),
    backgroundPortrait: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/meganeura/output/background-portrait.webp',
    ),
    narration: repositoryFile(
      '.handoff/animal-onboarding-runs/2026-08-01-meganeura/narration.mp3',
    ),
    poster: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/meganeura/output/poster.webp',
    ),
    thumbnail: repositoryFile(
      'assets/candidates/animal-onboarding-2026-08-01/meganeura/output/thumbnail.webp',
    ),
  },
}

const routeFilePairs = Object.entries(reviewAnimalFiles).flatMap(
  ([animalId, files]) => {
    const filePairs = [
      ['model.glb', files.model],
      ['background-landscape', files.backgroundLandscape],
      ['background-portrait', files.backgroundPortrait],
      ['poster.webp', files.poster],
      ['thumbnail.webp', files.thumbnail],
      ...(files.narration === undefined
        ? []
        : ([['narration.mp3', files.narration]] as const)),
    ] satisfies readonly (readonly [string, string])[]

    return filePairs.map(
      ([fileName, absolutePath]) =>
        [
          `${localReviewAssetPrefix}/${animalId}/${fileName}`,
          absolutePath,
        ] as const,
    )
  },
)

export const localReviewAssetFiles: ReadonlyMap<string, string> = new Map(
  routeFilePairs,
)
