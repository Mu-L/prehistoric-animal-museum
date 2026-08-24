import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  Box3,
  Mesh,
  PerspectiveCamera,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type CylinderGeometry,
  type Group,
  type Texture,
} from 'three'
import {
  SKY_HEIGHT_BANDS,
  SKY_LOCKED_AVATAR_BASES,
  SKY_LOCKED_CAMERA,
  SKY_LOCKED_SUBJECT,
  SKY_REFERENCE_Y_METERS,
  SKY_RUNTIME_AVATAR_PRESENTATION,
  SKY_VARIANTS,
  createSkyEnvironmentCandidate,
  skyAltitudeMeters,
  skyBandForAltitude,
  skyLayersForVariant,
} from '../src/scale-encounter/environments/sky'
import {
  createScaleEncounterEnvironment,
  disposeScaleEncounterEnvironment,
} from '../src/viewer/scale-encounter-environment'
import {
  SCALE_ENCOUNTER_DEFINITIONS,
  scaleEncounterSubjectLayoutForAspect,
} from '../src/viewer/scale-encounter'

const skyReviewManifestPath = resolve(
  process.cwd(),
  'assets/candidates/scale-encounter-environments/sky/sky-review-candidate.manifest.json',
)
const testPrivateSkyReviewManifest = existsSync(skyReviewManifestPath)
  ? it
  : it.skip
const privateSkyReviewManifestTestTitle =
  'records D as the Leon-accepted local default without claiming production promotion'

describe('scale encounter sky phase-two contract', () => {
  it('locks the existing Pteranodon scale and camera without copying forest values', () => {
    const shared = SCALE_ENCOUNTER_DEFINITIONS.pteranodon
    expect(SKY_LOCKED_SUBJECT).toMatchObject({
      animalId: 'pteranodon',
      calibratedModelSha256: shared.calibratedModelSha256,
      displayedWingspanMeters: shared.displayedMeters,
      support: shared.support,
    })
    expect(SKY_LOCKED_CAMERA).toMatchObject({
      defaultDistanceMeters: shared.defaultDistance,
      minimumDistanceMeters: shared.minimumDistance,
      maximumDistanceMeters: shared.maximumDistance,
      overviewFieldOfViewDegrees: shared.overviewFieldOfView,
      povFieldOfViewDegrees: shared.povFieldOfView,
      transitionDurationMs: shared.guidedTransitionDurationMs,
    })
    expect(SKY_LOCKED_CAMERA.overviewDirection.distanceTo(shared.overviewDirection)).toBeLessThan(
      1e-12,
    )
    expect(SKY_LOCKED_CAMERA.overviewUp.distanceTo(shared.overviewUp)).toBeLessThan(
      1e-12,
    )
  })

  it('keeps A, B, C and coherent-radiance D isolated by the handoff layer boundary', () => {
    expect(skyLayersForVariant('A')).toEqual([
      'subject',
      'background-atmosphere',
    ])
    expect(skyLayersForVariant('B')).toEqual([
      'subject',
      'background-atmosphere',
      'flight-volume',
    ])
    expect(skyLayersForVariant('C')).toEqual([
      'subject',
      'background-atmosphere',
      'flight-volume',
      'near-air',
      'mid-cloud',
      'far-cloud',
    ])
    expect(skyLayersForVariant('D')).toEqual(skyLayersForVariant('C'))
    expect(Object.keys(SKY_VARIANTS)).toEqual(['A', 'B', 'C', 'D'])
  })

  it('uses one explicit world reference and named non-overlapping cloud bands', () => {
    expect(SKY_REFERENCE_Y_METERS).toBe(-60)
    expect(skyAltitudeMeters(4.8)).toBeCloseTo(64.8, 10)
    expect(SKY_HEIGHT_BANDS.map((band) => band.id)).toEqual([
      'subject-flight',
      'near-air',
      'mid-cloud',
      'far-cloud',
    ])
    expect(skyBandForAltitude(64.8)?.id).toBe('subject-flight')
    expect(skyBandForAltitude(88)?.id).toBe('near-air')
    expect(skyBandForAltitude(48)?.id).toBe('mid-cloud')
    expect(skyBandForAltitude(24)?.id).toBe('far-cloud')
  })

  it('keeps the historical base lock and marks new wingsuit bounds for re-review', () => {
    expect(SKY_LOCKED_AVATAR_BASES).toMatchObject({
      animation: 'Idle_Land',
      authoredHeightMeters: 1.15,
      equipmentRigId: 'child-base-v3-meshy-24',
      neutralPose: 'neutral-bind-idle-v2',
      outfitSafetyBounds: null,
    })
    expect(SKY_LOCKED_AVATAR_BASES.boy.filename).not.toContain('wingsuit')
    expect(SKY_LOCKED_AVATAR_BASES.girl.filename).not.toContain('wingsuit')
    expect(SKY_RUNTIME_AVATAR_PRESENTATION).toMatchObject({
      bodyOrientation: 'prone',
      environmentEvidenceReusable: false,
      equipment: 'helmeted-wingsuit-and-parachute',
      outfitSafetyBounds: 'pending-dynamic-bounds-review',
      pose: 'prone-wingsuit-glide',
      profile: 'air-wingsuit',
      status: 'implementation-candidate',
    })
  })

  testPrivateSkyReviewManifest(privateSkyReviewManifestTestTitle, () => {
    const manifest = JSON.parse(
      readFileSync(skyReviewManifestPath, 'utf8'),
    ) as {
      readonly defaultCandidate: boolean
      readonly leonApproved: boolean
      readonly mainIntegration: {
        readonly naturalnessGate: string
      }
      readonly latestOwnerRequestedRevision: {
        readonly aerialIslandCount: number
        readonly atlasBlurTapCount: number
        readonly atlasSampleMipBias: number
        readonly historicalBaseApprovalPreserved: boolean
        readonly landscapeDistribution: string
        readonly maximumSeaWaveDisplacementMeters: number
        readonly minimumStableCoreClearanceMeters: number
        readonly portraitDistribution: string
        readonly portraitIslandCount: number
        readonly responsiveLayoutCount: number
        readonly surfaceTexture: {
          readonly dimensions: readonly [number, number]
          readonly mode: string
          readonly path: string
          readonly sha256: string
        }
        readonly visualReviewStatus: string
      }
      readonly productionApproved: boolean
      readonly runtimeIntegrated: boolean
      readonly sceneContract: {
        readonly coastRendered: boolean
        readonly distantIslandSilhouettes: boolean
        readonly aerialIslandTerrainCount: number
      }
      readonly status: string
      readonly lockedInputs: {
        readonly outfitSafetyBounds: unknown
      }
    }
    expect(manifest.status).toBe('review-candidate')
    expect(manifest.runtimeIntegrated).toBe(true)
    expect(manifest.defaultCandidate).toBe(true)
    expect(manifest.leonApproved).toBe(true)
    expect(manifest.productionApproved).toBe(false)
    expect(manifest.mainIntegration.naturalnessGate).toBe(
      'owner-requested-visual-review-pending',
    )
    expect(manifest.latestOwnerRequestedRevision).toMatchObject({
      aerialIslandCount: 6,
      historicalBaseApprovalPreserved: true,
      maximumSeaWaveDisplacementMeters: 0.74,
      minimumStableCoreClearanceMeters: 0.84,
      atlasBlurTapCount: 5,
      atlasSampleMipBias: 0.9,
      landscapeDistribution: 'staggered-landscape-depth-bands',
      portraitDistribution: 'portrait-sea-footprint-depth-bands',
      portraitIslandCount: 6,
      responsiveLayoutCount: 2,
      visualReviewStatus:
        'landscape-headed-browser-and-portrait-frustum-contract-reviewed-user-confirmation-pending',
    })
    expect(manifest.latestOwnerRequestedRevision.surfaceTexture).toMatchObject({
      dimensions: [1152, 768],
      mode: 'built-in-imagegen',
      path: 'aerial-island-atlas-v1.webp',
      sha256: '58a30f61f76d163a4289d1d1adc31d4c920db2763594588d90f3c9bb8ae69195',
    })
    expect(manifest.sceneContract.coastRendered).toBe(false)
    expect(manifest.sceneContract.distantIslandSilhouettes).toBe(false)
    expect(manifest.sceneContract.aerialIslandTerrainCount).toBe(6)
    expect(manifest.lockedInputs.outfitSafetyBounds).toBeNull()
  })

  it('switches the pteranodon comparison axis without changing either subject scale', () => {
    expect(scaleEncounterSubjectLayoutForAspect('pteranodon', 1440 / 900)).toBe(
      'side-by-side',
    )
    expect(scaleEncounterSubjectLayoutForAspect('pteranodon', 1)).toBe(
      'stacked',
    )
    expect(scaleEncounterSubjectLayoutForAspect('pteranodon', 390 / 844)).toBe(
      'stacked',
    )
    expect(scaleEncounterSubjectLayoutForAspect('pteranodon', 360 / 640)).toBe(
      'stacked',
    )
    expect(scaleEncounterSubjectLayoutForAspect('mammoth', 390 / 844)).toBe(
      'authored',
    )
  })
})

describe('scale encounter sky candidate layer runtime', () => {
  function fixture(variant: 'A' | 'B' | 'C' | 'D') {
    const camera = new PerspectiveCamera(29, 1440 / 900, 0.03, 240)
    camera.position.set(18, 36, 0)
    camera.lookAt(0, 5, 6)
    camera.updateProjectionMatrix()
    const subjectBounds = new Box3(
      new Vector3(-4, 3.2, -1),
      new Vector3(4, 6.2, 16),
    )
    const avatarBounds = new Box3(
      new Vector3(-0.4, 4.2, 14.7),
      new Vector3(0.4, 5.35, 15.3),
    )
    const cameraSweepBounds = new Box3(
      new Vector3(-1, 4, -1),
      new Vector3(24, 39, 22),
    )
    const corridorBounds = subjectBounds
      .clone()
      .union(cameraSweepBounds)
      .expandByScalar(1)
    const cameraState = {
      aspect: camera.aspect,
      far: camera.far,
      fieldOfViewDegrees: camera.fov,
      near: camera.near,
      position: camera.position,
      stage: 'overview' as const,
      target: new Vector3(0, 5, 6),
      viewportHeight: 900,
      viewportWidth: 1440,
    }
    const candidate = createSkyEnvironmentCandidate({
      assetLease: {
        assetId: 'scale-encounter-sky-coastal-v1',
        manifestSha256: 'fixture',
        productionApproved: false,
        status: 'review-candidate',
      },
      avatarBounds,
      cameraState,
      cameraSweepBounds,
      corridorBounds,
      rendererCapabilities: {
        isWebGl2: true,
        maxAnisotropy: 16,
        maxTextureSize: 16384,
        pixelRatio: 2,
        renderer: 'ANGLE Metal Renderer: Apple fixture',
        vendor: 'Google Inc. (Apple)',
      },
      subjectBounds,
      variant,
    })
    return {
      avatarBounds,
      camera,
      cameraState,
      candidate,
      subjectBounds,
    }
  }

  it.each([
    ['A', 0, ['background-atmosphere']],
    ['B', 0, ['background-atmosphere', 'flight-volume']],
    [
      'C',
      8,
      [
        'background-atmosphere',
        'flight-volume',
        'near-air',
        'mid-cloud',
        'far-cloud',
      ],
    ],
    [
      'D',
      8,
      [
        'background-atmosphere',
        'flight-volume',
        'near-air',
        'mid-cloud',
        'far-cloud',
      ],
    ],
  ] as const)(
    'activates only declared layers for variant %s',
    (variant, cloudCount, visibleLayers) => {
      const fixtureValue = fixture(variant)
      const diagnostic = fixtureValue.candidate.getDiagnostics(
        fixtureValue.camera,
        fixtureValue.cameraState,
        fixtureValue.subjectBounds,
        fixtureValue.avatarBounds,
      )
      expect(diagnostic.cloudCount).toBe(cloudCount)
      expect(
        diagnostic.layerStates
          .filter((layer) => layer.visible && layer.id !== 'subject')
          .map((layer) => layer.id),
      ).toEqual(visibleLayers)
      fixtureValue.candidate.dispose()
    },
  )

  it('keeps every C cloud world AABB outside the legal subject and camera corridor', () => {
    const fixtureValue = fixture('C')
    const diagnostic = fixtureValue.candidate.getDiagnostics(
      fixtureValue.camera,
      fixtureValue.cameraState,
      fixtureValue.subjectBounds,
      fixtureValue.avatarBounds,
    )
    expect(diagnostic.cloudDiagnostics).toHaveLength(8)
    expect(diagnostic.corridorOverlapCount).toBe(0)
    expect(
      diagnostic.cloudDiagnostics.every(
        (cloud) => cloud.corridorOverlap === false,
      ),
    ).toBe(true)
    expect(diagnostic.alpha).toMatchObject({
      alphaMode: 'premultiplied-blend',
      alphaTextureCount: 0,
      cloudMaterialsPremultiplied: true,
      cloudMaterialsUseMipmaps: false,
      cloudMaterialsDepthWriteDisabled: true,
    })
    fixtureValue.candidate.dispose()
  })

  it('feathers the finite sea and horizon haze before their geometry can form polygonal skyline segments', () => {
    const fixtureValue = fixture('C')
    const sea = fixtureValue.candidate.root.getObjectByName(
      'world-space-open-sea',
    ) as Mesh
    const seaMaterial = sea.material as ShaderMaterial
    expect(seaMaterial.vertexShader).toContain(
      'scaleEncounterHorizonWaveFade',
    )
    expect(seaMaterial.vertexShader).toContain('145.0')
    expect(seaMaterial.fragmentShader).toContain(
      'scaleEncounterSeamlessHorizon',
    )
    expect(seaMaterial.fragmentShader).toContain(
      'scaleEncounterSeaLevelDefinition',
    )
    expect(seaMaterial.fragmentShader).toContain('skyColourBehindSea')
    expect(seaMaterial.fragmentShader).toContain(
      'vWorldPosition.xz - uCameraPosition.xz',
    )

    const horizonHaze = fixtureValue.candidate.root.getObjectByName(
      'necessary-horizon-atmosphere-depth',
    ) as Mesh<CylinderGeometry, ShaderMaterial>
    expect(horizonHaze.geometry.parameters.radialSegments).toBe(192)
    expect(horizonHaze.material.transparent).toBe(true)
    expect(horizonHaze.material.fragmentShader).toContain('lowerFeather')
    expect(horizonHaze.material.fragmentShader).toContain('upperFeather')

    const islands = fixtureValue.candidate.root.getObjectByName(
      'distant-haze-islands',
    ) as Group
    expect(islands.children).toHaveLength(2)
    expect(
      islands.children.every((island) => island.frustumCulled === false),
    ).toBe(true)
    expect(
      islands.children.every(
        (island) => Math.hypot(island.position.x, island.position.z) < 175,
      ),
    ).toBe(true)
    expect(
      islands.children.some((island) =>
        island.name.startsWith('distant-island-'),
      ),
    ).toBe(false)
    const archipelago = islands.getObjectByName(
      'aerial-archipelago-terrain',
    ) as Mesh<BufferGeometry, ShaderMaterial>
    const portraitArchipelago = islands.getObjectByName(
      'aerial-archipelago-terrain-portrait',
    ) as Mesh<BufferGeometry, ShaderMaterial>
    expect(archipelago).toBeInstanceOf(Mesh)
    expect(portraitArchipelago).toBeInstanceOf(Mesh)
    expect(archipelago.visible).toBe(true)
    expect(portraitArchipelago.visible).toBe(false)
    expect(islands.userData.activeResponsiveLayout).toBe('landscape')
    expect(archipelago.material).toBeInstanceOf(ShaderMaterial)
    expect(archipelago.material.transparent).toBe(false)
    expect(archipelago.material.depthTest).toBe(true)
    expect(archipelago.material.depthWrite).toBe(true)
    expect(archipelago.material.fragmentShader).toContain('terrainFbm')
    expect(archipelago.material.fragmentShader).toContain('uIslandAtlas')
    expect(archipelago.material.fragmentShader).toContain(
      'photographedSurface',
    )
    expect(archipelago.material.fragmentShader).toContain(
      'islandSample.a < 0.14',
    )
    expect(archipelago.material.fragmentShader).toContain('atlasTexel')
    expect(archipelago.material.fragmentShader).toContain(
      'vTerrainUv, 0.9',
    )
    expect(archipelago.material.fragmentShader).toContain('distanceHaze')
    const terrainSurface = archipelago.material.uniforms.uIslandAtlas!
      .value as Texture
    expect(terrainSurface.name).toBe(
      'aerial-island-cutout-atlas-photoreal-v1',
    )
    expect(terrainSurface.colorSpace).toBe(SRGBColorSpace)
    expect(terrainSurface.wrapS).toBe(RepeatWrapping)
    expect(terrainSurface.wrapT).toBe(RepeatWrapping)
    const archipelagoMetadata = archipelago.userData as {
      readonly furthestIslandCentreDistanceMeters: number
      readonly islandNames: readonly string[]
      readonly atlasAnisotropy: number
      readonly atlasBlurTapCount: number
      readonly atlasSampleMipBias: number
      readonly distribution: string
      readonly maximumSeaWaveDisplacementMeters: number
      readonly minimumStableCoreClearanceMeters: number
      readonly nearestIslandCentreDistanceMeters: number
    }
    expect(archipelagoMetadata).toMatchObject({
      aerialIslandCount: 6,
      atlasAnisotropy: 1,
      atlasBlurTapCount: 5,
      atlasSampleMipBias: 0.9,
      distribution: 'staggered-landscape-depth-bands',
      maximumSeaWaveDisplacementMeters: 0.74,
      presentation: 'distant-phototextured-topographic-archipelago',
      shoreline: 'photoreal-rock-and-cove-cutout-over-submerged-coast',
      surface:
        'six-distinct-softened-photoreal-aerial-islands-and-distance-haze',
      topology: 'atlas-cutout-over-dense-radial-world-space-topography',
      responsiveLayout: 'landscape',
    })
    expect(archipelagoMetadata.islandNames).toHaveLength(6)
    expect(
      archipelagoMetadata.nearestIslandCentreDistanceMeters,
    ).toBeGreaterThan(27)
    expect(
      archipelagoMetadata.furthestIslandCentreDistanceMeters,
    ).toBeGreaterThan(40)
    expect(
      archipelagoMetadata.minimumStableCoreClearanceMeters,
    ).toBeGreaterThan(
      archipelagoMetadata.maximumSeaWaveDisplacementMeters,
    )
    const terrainPositions = archipelago.geometry.getAttribute('position')
    expect(terrainPositions.count).toBe(6 * (64 * 8 + 1))
    expect(archipelago.geometry.getAttribute('color').count).toBe(
      terrainPositions.count,
    )
    expect(archipelago.geometry.getAttribute('aTerrainRadius').count).toBe(
      terrainPositions.count,
    )
    expect(archipelago.geometry.getAttribute('uv').count).toBe(
      terrainPositions.count,
    )
    expect(archipelago.geometry.getAttribute('normal').count).toBe(
      terrainPositions.count,
    )
    expect(archipelago.geometry.getAttribute('aIsletEdge')).toBeUndefined()
    archipelago.geometry.computeBoundingBox()
    expect(archipelago.geometry.boundingBox?.max.x).toBeLessThan(-17)
    expect(archipelago.geometry.boundingBox?.min.y).toBeLessThan(
      SKY_REFERENCE_Y_METERS,
    )
    expect(archipelago.geometry.boundingBox?.max.y).toBeGreaterThan(
      SKY_REFERENCE_Y_METERS + 1.3,
    )

    const portraitMetadata = portraitArchipelago.userData as {
      readonly distribution: string
      readonly islandCentres: readonly (readonly [number, number])[]
      readonly islandNames: readonly string[]
      readonly minimumStableCoreClearanceMeters: number
      readonly responsiveLayout: string
    }
    expect(portraitMetadata).toMatchObject({
      aerialIslandCount: 6,
      distribution: 'portrait-sea-footprint-depth-bands',
      responsiveLayout: 'portrait',
    })
    expect(portraitMetadata.islandCentres).toEqual([
      [-8, -30],
      [4, -24],
      [-2, -16],
      [8, -8],
      [-6, 0],
      [2, 8],
    ])
    expect(portraitMetadata.islandNames).toEqual(
      archipelagoMetadata.islandNames,
    )
    expect(portraitMetadata.minimumStableCoreClearanceMeters).toBeGreaterThan(
      archipelagoMetadata.maximumSeaWaveDisplacementMeters,
    )
    portraitArchipelago.geometry.computeBoundingBox()
    expect(portraitArchipelago.geometry.boundingBox?.min.x).toBeGreaterThan(-10)
    expect(portraitArchipelago.geometry.boundingBox?.max.x).toBeLessThan(10)
    expect(portraitArchipelago.geometry.boundingBox?.min.z).toBeLessThan(-30)
    expect(portraitArchipelago.geometry.boundingBox?.max.z).toBeGreaterThan(8)

    const portraitCamera = new PerspectiveCamera(29, 390 / 844, 0.03, 240)
    const portraitTarget = new Vector3(0, 4.7, 7.5)
    const portraitElevation = (70 * Math.PI) / 180
    portraitCamera.position
      .copy(portraitTarget)
      .add(
        new Vector3(
          0,
          Math.sin(portraitElevation),
          Math.cos(portraitElevation),
        ).multiplyScalar(70),
      )
    portraitCamera.up.set(
      0,
      Math.cos(portraitElevation),
      -Math.sin(portraitElevation),
    )
    portraitCamera.lookAt(portraitTarget)
    portraitCamera.updateProjectionMatrix()
    portraitCamera.updateMatrixWorld(true)
    const projectedPortraitCentres = portraitMetadata.islandCentres.map(
      ([worldX, worldZ]) =>
        new Vector3(
          worldX,
          SKY_REFERENCE_Y_METERS + 1,
          worldZ,
        ).project(portraitCamera),
    )
    expect(
      projectedPortraitCentres.every(
        (centre) =>
          Math.abs(centre.x) < 0.62 &&
          Math.abs(centre.y) < 0.8 &&
          centre.z > -1 &&
          centre.z < 1,
      ),
    ).toBe(true)
    fixtureValue.candidate.update(0, true, portraitCamera)
    expect(archipelago.visible).toBe(false)
    expect(portraitArchipelago.visible).toBe(true)
    expect(islands.userData.activeResponsiveLayout).toBe('portrait')
    fixtureValue.candidate.dispose()
  })

  it('registers C through the shared environment factory with actual camera and bounds', () => {
    const camera = new PerspectiveCamera(29, 1440 / 900, 0.03, 240)
    camera.position.set(18, 36, 0)
    const animalBounds = new Box3(
      new Vector3(-3.6, 3.6, -0.8),
      new Vector3(3.6, 6, 0.8),
    )
    const avatarBounds = new Box3(
      new Vector3(-0.55, 4.1, 14.2),
      new Vector3(0.55, 5.6, 15.8),
    )
    const environment = createScaleEncounterEnvironment(
      'air',
      'baseline',
      null,
      {
        animalBounds,
        animalId: 'pteranodon',
        avatarBounds,
        camera,
        sceneCandidateVariant: 'C',
      },
    )
    expect(environment?.sceneCandidateSemantic).toBe('sky')
    expect(environment?.sceneCandidateVariant).toBe('C')
    expect(environment?.root.getObjectByName('world-space-open-sea')).toBeTruthy()
    expect(environment?.root.getObjectByName(
      'distant-directional-coast-proxy',
    )).toBeFalsy()
    expect(environment?.root.getObjectByName('distant-haze-islands')).toBeTruthy()
    expect(
      environment?.root.getObjectByName(
        'sky-candidate-rear-upper-flight-fill',
      ),
    ).toBeTruthy()
    expect(environment?.root.userData.scaleEncounterSceneCandidate).toMatchObject({
      buildSource: 'sky-production-review-2026-08-17-v2',
      defaultCandidate: false,
      leonApproved: true,
      naturalnessGate: 'owner-requested-visual-review-pending',
      naturalnessRevision:
        'responsive-portrait-and-landscape-aerial-island-atlas-subject-fill-v11',
      productionApproved: false,
      semanticName: 'sky',
    })
    disposeScaleEncounterEnvironment(environment)
  })
})
