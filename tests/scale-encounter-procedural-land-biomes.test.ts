import {
  InstancedMesh,
  Mesh,
  Texture,
  TextureLoader,
  type Material,
  type MeshStandardMaterial,
} from 'three'
import {
  acquireProceduralLandBiomeEnvironmentLease,
  loadPreparedScaleEncounterLandBiome,
} from '../src/scale-encounter/environments/land-biomes/load'
import { resetScaleEncounterLandBiomeArtCacheForTests } from '../src/scale-encounter/environments/land-biomes/assets'
import type { ScaleEncounterProceduralLandBiomeThemeId } from '../src/scale-encounter/environments/land-biomes/types'
import {
  createScaleEncounterEnvironment,
  disposeScaleEncounterEnvironment,
  updateScaleEncounterEnvironment,
} from '../src/viewer/scale-encounter-environment'
import { createScaleEncounterProceduralLandBiome } from '../src/viewer/scale-encounter-procedural-land-biome'
import type { ScaleEncounterAnimalId } from '../src/viewer/scale-encounter'

const THEME_CASES = [
  {
    animalId: 'gigantoraptor',
    absentMarkers: ['seasonal-channel-water', 'swamp-pool', 'distant-mesa-batch'],
    markers: ['terrain', 'drought-shrub-batch', 'gravel-batch'],
    panoramaFile: 'panorama-gobi-irendabas-photoreal-v1-4096.webp',
    profile: 'gobi-braided-basin',
    themeId: 'gobi',
    groundFile: 'surface-gobi-gravel-albedo-v1.webp',
  },
  {
    animalId: 'dilophosaurus',
    absentMarkers: ['lycopsid', 'calamites'],
    markers: [
      'terrain',
      'seasonal-channel-water',
      'overbank-sediment-bars',
      'riparian-stem-batch',
      'fern-frond-batch',
    ],
    panoramaFile: 'panorama-floodplain-kayenta-photoreal-v1-4096.webp',
    profile: 'kayenta-seasonal-floodplain',
    themeId: 'floodplain',
    groundFile: 'surface-floodplain-red-silt-albedo-v1.webp',
  },
  {
    animalId: 'meganeura',
    absentMarkers: ['drought-shrub', 'distant-mesa', 'seasonal-channel-water'],
    markers: [
      'terrain',
      'swamp-pool',
      'lycopsid-sigillaria-trunks',
      'lycopsid-terminal-crowns',
      'calamites-segmented-stems',
      'calamites-joint-rings',
      'calamites-leaf-sprays',
      'fern-frond-batch',
    ],
    panoramaFile:
      'panorama-carboniferous-wetland-photoreal-v1-4096.webp',
    profile: 'carboniferous-coal-swamp',
    themeId: 'carboniferous-wetland-forest',
    groundFile: 'surface-carboniferous-peat-albedo-v1.webp',
  },
] as const satisfies readonly {
  readonly absentMarkers: readonly string[]
  readonly animalId: ScaleEncounterAnimalId
  readonly markers: readonly string[]
  readonly groundFile: string
  readonly panoramaFile: string
  readonly profile: string
  readonly themeId: ScaleEncounterProceduralLandBiomeThemeId
}[]

function sceneNames(root: { traverse(callback: (object: { name: string }) => void): void }): string[] {
  const names: string[] = []
  root.traverse((object) => names.push(object.name))
  return names
}

describe('scale encounter procedural land biomes', () => {
  afterEach(() => {
    resetScaleEncounterLandBiomeArtCacheForTests()
    vi.restoreAllMocks()
  })

  it.each(THEME_CASES)(
    'loads only the exact approved $themeId ground and far-field package',
    async ({ groundFile, panoramaFile, profile, themeId }) => {
      const textureLoad = vi
        .spyOn(TextureLoader.prototype, 'loadAsync')
        .mockImplementation(() => Promise.resolve(new Texture()))
      const lease = await acquireProceduralLandBiomeEnvironmentLease(themeId)

      expect(textureLoad).toHaveBeenCalledTimes(
        themeId === 'gobi' ? 4 : 5,
      )
      const requestedUrls = textureLoad.mock.calls.map(([sourceUrl]) =>
        String(sourceUrl),
      )
      expect(requestedUrls.some((url) => url.includes(panoramaFile))).toBe(true)
      expect(requestedUrls.some((url) => url.includes(groundFile))).toBe(true)
      const unrelatedThemeFiles = THEME_CASES
        .filter((theme) => theme.themeId !== themeId)
        .map((theme) => theme.groundFile)
      unrelatedThemeFiles.forEach((fileName) => {
        expect(requestedUrls.some((url) => url.includes(fileName))).toBe(false)
      })
      expect(lease.texture).toBeInstanceOf(Texture)
      expect(lease.panoramaWidth).toBe(4096)
      expect(lease.sourceUrl).toContain(panoramaFile)
      expect(lease.surfaceTextures).toMatchObject({
        physicalWidthMeters: 2,
      })
      expect(lease.preparedLandBiome).toMatchObject({
        profile,
        themeId,
      })
      expect(lease.matureTreeAtlas instanceof Texture).toBe(
        themeId === 'floodplain',
      )
      expect(
        lease.surfaceTextures?.landBiomeFrondAtlas instanceof Texture,
      ).toBe(themeId === 'carboniferous-wetland-forest')
      await expect(lease.startPanoramaUpgrade()).resolves.toBeNull()
      lease.release()
    },
  )

  it('installs the prepared panorama and PBR ground without transferring cache ownership', async () => {
    const preparedLandBiome = await loadPreparedScaleEncounterLandBiome('gobi')
    const panorama = new Texture()
    const albedo = new Texture()
    const normal = new Texture()
    const roughness = new Texture()
    const environment = createScaleEncounterProceduralLandBiome(
      preparedLandBiome,
      'production-slice',
      {
        animalId: 'gigantoraptor',
        surfaceTextures: {
          albedo,
          normal,
          physicalWidthMeters: 2,
          roughness,
        },
      },
      panorama,
    )
    if (!environment) throw new Error('Expected photoreal Gobi environment.')

    expect(environment.panoramaTexture).toBe(panorama)
    expect(environment.skyDome.name).toContain('licensed-pure-sky-dome')
    expect(environment.borrowedTextures).toEqual(
      new Set([panorama, albedo, normal, roughness]),
    )
    const terrain = environment.root.getObjectByName(
      'scale-encounter-gobi-terrain',
    )
    if (!(terrain instanceof Mesh)) throw new Error('Expected terrain mesh.')
    expect((terrain.material as MeshStandardMaterial).map).toBe(albedo)
    expect(
      (terrain.material as MeshStandardMaterial).userData
        .scaleEncounterLandBiomeGroundMaterial,
    ).toBe('land-biome-stochastic-pbr-v1')
    const disposePanorama = vi.spyOn(panorama, 'dispose')
    const disposeAlbedo = vi.spyOn(albedo, 'dispose')
    disposeScaleEncounterEnvironment(environment)
    expect(disposePanorama).not.toHaveBeenCalled()
    expect(disposeAlbedo).not.toHaveBeenCalled()
  })

  it('uses the same Gobi composition at 2K only for a constrained connection', async () => {
    const textureLoad = vi
      .spyOn(TextureLoader.prototype, 'loadAsync')
      .mockImplementation(() => Promise.resolve(new Texture()))
    const lease = await acquireProceduralLandBiomeEnvironmentLease(
      'gobi',
      8192,
      { saveData: true },
    )

    expect(lease.quality).toBe('low')
    expect(lease.panoramaWidth).toBe(2048)
    expect(lease.sourceUrl).toContain(
      'panorama-gobi-irendabas-photoreal-v1-2048.webp',
    )
    expect(
      textureLoad.mock.calls.some(([sourceUrl]) =>
        String(sourceUrl).includes(
          'panorama-gobi-irendabas-photoreal-v1-4096.webp',
        ),
      ),
    ).toBe(false)
    lease.release()
  })

  it.each(THEME_CASES)(
    'builds a complete and ecologically distinct $themeId world from the shared factory',
    async ({ absentMarkers, animalId, markers, profile, themeId }) => {
      const preparedLandBiome = await loadPreparedScaleEncounterLandBiome(themeId)
      const environment = createScaleEncounterProceduralLandBiome(
        preparedLandBiome,
        'production-slice',
        {
          animalId,
          ecologyDensity: 'current',
        },
      )
      if (!environment) throw new Error(`Expected the ${themeId} environment.`)

      expect(environment.sceneCandidateSemantic).toBe('land-biome')
      expect(environment.ownsLighting).toBe(true)
      expect(environment.panoramaTexture).toBeNull()
      expect(environment.borrowedTextures.size).toBe(0)
      expect(environment.groundHeightAtWorld?.(0, 0)).toBeCloseTo(0, 6)
      expect(environment.root.userData).toMatchObject({
        scaleEncounterEnvironmentBaselineReady: true,
        scaleEncounterEnvironmentRuntimeKind: 'procedural-biome',
        scaleEncounterEnvironmentRuntimeTheme: themeId,
        scaleEncounterEnvironmentTargetTheme: themeId,
        scaleEncounterEnvironmentUsingCompatibilityFallback: false,
        scaleEncounterLandBiomeProfile: profile,
      })

      const names = sceneNames(environment.root)
      markers.forEach((marker) => {
        expect(names.some((name) => name.includes(marker))).toBe(true)
      })
      absentMarkers.forEach((marker) => {
        expect(names.some((name) => name.includes(marker))).toBe(false)
      })
      if (themeId === 'carboniferous-wetland-forest') {
        expect(
          names.some((name) =>
            /(flower|broadleaf|palm|rainforest)/i.test(name),
          ),
        ).toBe(false)
      }

      const terrain = environment.root.getObjectByName(
        `scale-encounter-${themeId}-terrain`,
      )
      if (!(terrain instanceof Mesh)) throw new Error('Expected terrain mesh.')
      const disposeGeometry = vi.spyOn(terrain.geometry, 'dispose')
      const terrainMaterial = terrain.material as Material
      const disposeMaterial = vi.spyOn(terrainMaterial, 'dispose')
      disposeScaleEncounterEnvironment(environment)
      expect(disposeGeometry).toHaveBeenCalledOnce()
      expect(disposeMaterial).toHaveBeenCalledOnce()
    },
  )

  it('uses the approved selected biome on the public environment route', async () => {
    const preparedLandBiome = await loadPreparedScaleEncounterLandBiome('gobi')
    const panorama = new Texture()
    const environment = createScaleEncounterEnvironment(
      'land',
      'production-slice',
      panorama,
      {
        animalId: 'gigantoraptor',
        preparedLandBiome,
      },
    )

    expect(environment?.root.userData).toMatchObject({
      scaleEncounterEnvironmentRuntimeTheme: 'gobi',
      scaleEncounterEnvironmentTargetTheme: 'gobi',
      scaleEncounterEnvironmentUsingCompatibilityFallback: false,
    })
    expect(
      environment?.root.getObjectByName('scale-encounter-gobi-terrain'),
    ).toBeTruthy()
    expect(
      environment?.root.getObjectByName(
        'scale-encounter-accepted-forested-mountain-basin',
      ),
    ).toBeFalsy()
    disposeScaleEncounterEnvironment(environment)
    panorama.dispose()
  })

  it('scales shared ecology batches with the existing density control and animates real water geometry', async () => {
    const preparedLandBiome = await loadPreparedScaleEncounterLandBiome('floodplain')
    const current = createScaleEncounterProceduralLandBiome(
      preparedLandBiome,
      'production-slice',
      {
        animalId: 'dilophosaurus',
        ecologyDensity: 'current',
      },
    )
    const dense = createScaleEncounterProceduralLandBiome(
      preparedLandBiome,
      'production-slice',
      {
        animalId: 'dilophosaurus',
        ecologyDensity: '1.5x',
      },
    )
    if (!current || !dense) throw new Error('Expected floodplain environments.')

    const currentPopulation = current.root.userData
      .scaleEncounterLandBiomePopulation as Record<string, number>
    const densePopulation = dense.root.userData
      .scaleEncounterLandBiomePopulation as Record<string, number>
    expect(densePopulation.ferns).toBeGreaterThan(currentPopulation.ferns!)
    expect(densePopulation.riparianPlants).toBeGreaterThan(
      currentPopulation.riparianPlants!,
    )

    const water = current.root.getObjectByName(
      'scale-encounter-floodplain-seasonal-channel-water',
    )
    if (!(water instanceof Mesh)) throw new Error('Expected channel water.')
    const before = water.position.y
    updateScaleEncounterEnvironment(current, 3, false)
    expect(water.position.y).not.toBe(before)

    const riparian = dense.root.getObjectByName(
      'scale-encounter-floodplain-riparian-stem-batch',
    )
    expect(riparian).toBeInstanceOf(InstancedMesh)
    expect((riparian as InstancedMesh).count).toBe(densePopulation.riparianPlants)

    disposeScaleEncounterEnvironment(current)
    disposeScaleEncounterEnvironment(dense)
  })
})
