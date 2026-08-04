import { animal as stegosaurus } from '../src/content/animals/stegosaurus/animal'
import {
  discoverAnimalPackages,
  filterPublishedAnimals,
  getCollectionAnimals,
  productionAnimals,
} from '../src/content/catalog'
import {
  mainCollection,
  nextAnimalId,
  previousAnimalId,
  stepCollection,
  wrapCollectionIndex,
} from '../src/content/collections/main'
import type {
  AnimalModule,
  DraftAnimalPackage,
  PublishedAnimalPackage,
} from '../src/content/types'

function publishedAnimal(id: string): PublishedAnimalPackage {
  return {
    ...stegosaurus,
    id,
  }
}

function draftAnimal(id: string): DraftAnimalPackage {
  return {
    id,
    status: 'draft',
    kind: 'dinosaur',
    habitat: 'land',
    atmosphere: 'forest',
    content: stegosaurus.content,
    presentation: stegosaurus.presentation,
    animation: stegosaurus.animation,
    narration: stegosaurus.narration,
    provenance: [],
    assets: {},
    draftNotes: ['测试用开发草稿。'],
  }
}

describe('animal package discovery', () => {
  const publishedA = publishedAnimal('published-a')
  const publishedB = publishedAnimal('published-b')
  const draft = draftAnimal('draft-a')
  const modules: Record<string, AnimalModule> = {
    './animals/z/animal.ts': { animal: publishedB },
    './animals/b/animal.ts': { animal: draft },
    './animals/a/animal.ts': { animal: publishedA },
  }

  it('discovers deterministically and excludes drafts in production', () => {
    expect(
      discoverAnimalPackages(modules, { includeDrafts: false }).map(
        ({ id }) => id,
      ),
    ).toEqual(['published-a', 'published-b'])
    expect(
      discoverAnimalPackages(modules, { includeDrafts: true }).map(
        ({ id }) => id,
      ),
    ).toEqual(['published-a', 'draft-a', 'published-b'])
    expect(filterPublishedAnimals([draft, publishedA])).toEqual([publishedA])
  })

  it('rejects duplicate IDs discovered at different module paths', () => {
    expect(() =>
      discoverAnimalPackages(
        {
          './animals/a/animal.ts': { animal: publishedA },
          './animals/b/animal.ts': {
            animal: publishedAnimal(publishedA.id),
          },
        },
        { includeDrafts: true },
      ),
    ).toThrow(/重复动物 ID/)
  })
})

describe('explicit looping collection', () => {
  it('preserves manifest order rather than discovery order', () => {
    const publishedA = publishedAnimal('published-a')
    const publishedB = publishedAnimal('published-b')
    const collection = {
      id: 'ordered',
      animalIds: ['published-b', 'published-a'],
      defaultAnimalId: 'published-b',
      loop: true,
    } as const

    expect(
      getCollectionAnimals(collection, [publishedA, publishedB]).map(
        ({ id }) => id,
      ),
    ).toEqual(['published-b', 'published-a'])
  })

  it('wraps positive and negative indices at both ends', () => {
    expect(wrapCollectionIndex(-1, 3)).toBe(2)
    expect(wrapCollectionIndex(3, 3)).toBe(0)
    expect(wrapCollectionIndex(7, 3)).toBe(1)
  })

  it('loops the eighteen-animal production collection in its explicit order', () => {
    expect(previousAnimalId(mainCollection, 'stegosaurus')).toBe('mosasaurus')
    expect(nextAnimalId(mainCollection, 'stegosaurus')).toBe(
      'pteranodon',
    )
    expect(stepCollection(mainCollection, 'stegosaurus', 1_001)).toBe('mammoth')
  })
})

describe('authored exhibit scenes', () => {
  it('uses a distinct responsive background pair for every production animal', () => {
    const backgroundPairs = productionAnimals.map((animal) => {
      const landscape = animal.provenance.find(
        ({ assetPath }) => assetPath === 'backgrounds/landscape.webp',
      )
      const portrait = animal.provenance.find(
        ({ assetPath }) => assetPath === 'backgrounds/portrait.webp',
      )

      return `${landscape?.runtime.sha256}:${portrait?.runtime.sha256}`
    })

    expect(new Set(backgroundPairs).size).toBe(productionAnimals.length)
  })
})
