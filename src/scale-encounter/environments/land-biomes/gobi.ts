import type { ScaleEncounterPreparedLandBiome } from './types'

/**
 * Gigantoraptor lived in the Iren Dabasu Formation. Sedimentology supports a
 * broad vegetated floodplain crossed by braided channels and temporary ponds,
 * so this is an open, dry Gobi basin rather than a modern dune desert.
 */
const GOBI_BIOME = {
  assets: {
    groundAlbedoSourceUrl: new URL(
      '../../assets/environments/surface-gobi-gravel-albedo-v1.webp',
      import.meta.url,
    ).href,
    groundPhysicalWidthMeters: 2,
    panoramaLowSourceUrl: new URL(
      '../../assets/environments/panorama-gobi-irendabas-photoreal-v1-2048.webp',
      import.meta.url,
    ).href,
    panoramaLowWidth: 2048,
    panoramaSourceUrl: new URL(
      '../../assets/environments/panorama-gobi-irendabas-photoreal-v1-4096.webp',
      import.meta.url,
    ).href,
    panoramaWidth: 4096,
    panoramaYawRadians: -Math.PI / 2,
    scannedPropProfile: 'dry-basin',
  },
  atmosphere: {
    exposure: 1.22,
    fogFarMeters: 500,
    fogNearMeters: 190,
    hemisphereGround: '#8e633f',
    hemisphereIntensity: 2.05,
    hemisphereSky: '#b8d7dc',
    sunIntensity: 3.1,
    sunPosition: [-72, 118, 54],
  },
  ecology: {
    calamites: 0,
    distantLandforms: 0,
    ferns: 0,
    gravel: 620,
    lycopsids: 0,
    riparianPlants: 0,
    shrubs: 112,
    treeFerns: 0,
  },
  palette: {
    fog: '#b88f62',
    groundDark: '#6d4429',
    groundLight: '#c69358',
    groundMid: '#9a6337',
    horizon: '#d3b27f',
    skyTop: '#5e9eaf',
    sun: '#ffe1a2',
    water: null,
  },
  profile: 'gobi-braided-basin',
  revision: 'gobi-irendabas-world-space-v8',
  scientificBasis: [
    'https://www.sciencedirect.com/science/article/pii/S0195667105000662',
  ],
  seed: 0x6f6269,
  themeId: 'gobi',
} as const satisfies ScaleEncounterPreparedLandBiome

export default GOBI_BIOME
