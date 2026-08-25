import {
  BackSide,
  BufferGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  DodecahedronGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  InstancedMesh,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  PMREMGenerator,
  RedFormat,
  RepeatWrapping,
  RGBADepthPacking,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  UnsignedByteType,
  Vector2,
  type Material,
  type Texture,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from 'three'

import { alpineDemUrl } from 'virtual:scale-encounter-glacier-assets'
import {
  createMammothPalaeoenvironmentCandidate,
  type MammothPalaeoenvironmentCandidate,
} from './mammoth-palaeoenvironment-candidate'

export const MAMMOTH_ACCEPTED_SNOW_ENVIRONMENT_ID =
  'mammoth-real-dem-snow-valley-accepted-v1'

const ANIMAL_X = 1.8
const ANIMAL_Z = 0

export interface MammothAcceptedSnowEnvironment {
  readonly candidate: MammothPalaeoenvironmentCandidate
  readonly environmentIntensity: number
  readonly environmentMap: Texture | null
  readonly fog: Fog
  readonly groundHeightAtWorld: (x: number, z: number) => number
  readonly root: Group
  readonly skyDome: Mesh
  dispose(): void
  update(elapsedSeconds: number): void
}

/**
 * The owner-approved mammoth landscape promoted from the Snowflow comparison.
 * The near field stays procedural and walkable; a real Mapzen Terrarium DEM
 * supplies only elevation for the distant Three.js mountain basin. No modern
 * photograph, road, building or dam is present in the rendered environment.
 */
export function createMammothAcceptedSnowEnvironment(
  renderer?: WebGLRenderer,
): MammothAcceptedSnowEnvironment {
  const candidate = createMammothPalaeoenvironmentCandidate('C', 'balanced')
  hideSupersededCandidateLayers(candidate)
  tightenHeroShadow(candidate.root)

  const heroZone = createHeroZone()
  const terrain = createAuthenticAlpineTerrain()
  const sky = createAlpineSkyDome()
  candidate.root.add(heroZone.root, terrain.mesh, sky.mesh)
  candidate.root.userData.scaleEncounterAcceptedEnvironment = {
    defaultCandidate: true,
    id: MAMMOTH_ACCEPTED_SNOW_ENVIRONMENT_ID,
    elevationSource: 'mapzen-terrarium-z12-2139-1449',
    modernPhotography: false,
    ownerVisualApproval: '2026-08-19',
    productionApproved: true,
  }

  const environmentTarget = renderer
    ? createSnowEnvironmentMap(renderer)
    : null

  return {
    candidate,
    environmentIntensity: 0.76,
    environmentMap: environmentTarget?.texture ?? null,
    fog: new Fog('#bdd8e4', 520, 1_950),
    groundHeightAtWorld: mammothAcceptedGroundHeightAtWorld,
    root: candidate.root,
    skyDome: sky.mesh,
    dispose: () => {
      candidate.dispose()
      terrain.heightMap.dispose()
      sky.cloudMap.dispose()
      environmentTarget?.dispose()
    },
    update: (elapsedSeconds) => candidate.update(elapsedSeconds),
  }
}

function hideSupersededCandidateLayers(
  candidate: MammothPalaeoenvironmentCandidate,
): void {
  candidate.layers.groundSurface.visible = false
  candidate.layers.snowLayer.visible = false
  candidate.layers.nearGround.visible = false
  candidate.layers.midSteppe.visible = false
  candidate.layers.farIceMass.visible = false
  candidate.layers.farLandform.visible = false
  candidate.layers.atmosphere.visible = false

  const hiddenBackgroundObjects = new Set([
    'glacier-background-atmosphere-sky',
    'glacier-rear-snow-peak-range',
    'glacier-far-rock-ridge',
    'glacier-front-moraine-ridge',
    'glacier-background-horizon-haze',
  ])
  candidate.layers.background.traverse((object) => {
    if (hiddenBackgroundObjects.has(object.name)) object.visible = false
  })
}

function createHeroZone(): { readonly root: Group } {
  const root = new Group()
  root.name = 'scale-encounter-mammoth-accepted-hero-zone'

  const geometry = new PlaneGeometry(144, 144, 240, 240)
  const material = createHeroSnowMaterial()
  const ground = new Mesh(geometry, material)
  ground.name = 'scale-encounter-mammoth-multiscale-snow-ground'
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.035
  ground.receiveShadow = true
  ground.customDepthMaterial = createHeroSnowDepthMaterial()
  root.add(ground)

  const rockGeometry = new DodecahedronGeometry(0.42, 1)
  const rocks = new InstancedMesh(
    rockGeometry,
    new MeshStandardMaterial({
      color: '#56534b',
      metalness: 0,
      roughness: 0.86,
    }),
    34,
  )
  rocks.name = 'scale-encounter-mammoth-near-rocks'
  rocks.castShadow = true
  rocks.receiveShadow = true

  const tufts = new InstancedMesh(
    createTaperedTuftGeometry(),
    new MeshStandardMaterial({
      color: '#766b4d',
      roughness: 0.96,
      side: DoubleSide,
    }),
    88,
  )
  tufts.name = 'scale-encounter-mammoth-sparse-sedge'
  tufts.receiveShadow = true

  const helper = new Object3D()
  const random = seededRandom(0x5a10_f10f)
  let rockIndex = 0
  let tuftIndex = 0
  for (
    let attempt = 0;
    attempt < 1_400 && (rockIndex < rocks.count || tuftIndex < tufts.count);
    attempt += 1
  ) {
    const angle = random() * Math.PI * 2
    const radius = 24 + Math.sqrt(random()) * 34
    const x = ANIMAL_X + Math.cos(angle) * radius
    const z = ANIMAL_Z + Math.sin(angle) * radius
    const snow = heroSnowCoverageAt(x, -z)
    const y = mammothAcceptedGroundHeightAtWorld(x, z) + 0.015

    if (rockIndex < rocks.count && random() > 0.88) {
      const scale = 0.28 + random() * 0.86
      helper.position.set(x, y + scale * 0.18, z)
      helper.rotation.set(random() * 0.42, random() * Math.PI, random() * 0.28)
      helper.scale.set(
        scale * (0.9 + random() * 0.65),
        scale,
        scale * (0.7 + random() * 0.45),
      )
      helper.updateMatrix()
      rocks.setMatrixAt(rockIndex, helper.matrix)
      rockIndex += 1
      continue
    }

    if (tuftIndex < tufts.count && snow < 0.68 && random() > 0.42) {
      const scale = 0.46 + random() * 0.68
      helper.position.set(x, y, z)
      helper.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.12)
      helper.scale.set(scale * (0.7 + random() * 0.55), scale, scale)
      helper.updateMatrix()
      tufts.setMatrixAt(tuftIndex, helper.matrix)
      tuftIndex += 1
    }
  }
  rocks.count = rockIndex
  rocks.instanceMatrix.needsUpdate = true
  tufts.count = tuftIndex
  tufts.instanceMatrix.needsUpdate = true
  root.add(rocks, tufts)

  return { root }
}

function createTaperedTuftGeometry(): BufferGeometry {
  const vertices: number[] = []
  const halfWidth = 0.055
  const height = 0.56
  for (const angle of [0, Math.PI / 3, (Math.PI * 2) / 3]) {
    const sideX = Math.cos(angle) * halfWidth
    const sideZ = Math.sin(angle) * halfWidth
    const bendX = -Math.sin(angle) * 0.075
    const bendZ = Math.cos(angle) * 0.075
    vertices.push(
      -sideX, 0, -sideZ,
      sideX, 0, sideZ,
      bendX, height, bendZ,
    )
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.computeVertexNormals()
  return geometry
}

function createHeroSnowMaterial(): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    alphaTest: 0.015,
    color: '#ffffff',
    depthWrite: true,
    metalness: 0,
    roughness: 0.68,
    transparent: true,
  })
  material.name = 'scale-encounter-mammoth-accepted-snow-pbr'
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = injectHeroSnowVertex(shader.vertexShader)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vHeroSnowWorld;

float heroHash(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
vec3 heroDx = dFdx(vHeroSnowWorld);
vec3 heroDy = dFdy(vHeroSnowWorld);
vec3 heroGeoNormal = normalize(cross(heroDx, heroDy));
if (heroGeoNormal.y < 0.0) heroGeoNormal *= -1.0;
float heroFineDx =
  cos(vHeroSnowWorld.x * 3.8 + vHeroSnowWorld.z * 0.32) * 0.095 +
  cos(vHeroSnowWorld.x * 8.7 - vHeroSnowWorld.z * 0.81 + 1.7) * 0.035;
float heroFineDz =
  cos(vHeroSnowWorld.z * 2.1 - vHeroSnowWorld.x * 0.17) * 0.045 -
  cos(vHeroSnowWorld.x * 8.7 - vHeroSnowWorld.z * 0.81 + 1.7) * 0.0033;
vec3 heroWorldNormal = normalize(heroGeoNormal + vec3(-heroFineDx, 0.0, -heroFineDz));
normal = normalize((viewMatrix * vec4(heroWorldNormal, 0.0)).xyz);`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
float heroMacro =
  sin(vHeroSnowWorld.x * 0.17 + vHeroSnowWorld.z * 0.07) * 0.46 +
  sin(vHeroSnowWorld.x * -0.08 + vHeroSnowWorld.z * 0.21 + 1.9) * 0.31 +
  sin(vHeroSnowWorld.x * 0.51 - vHeroSnowWorld.z * 0.13 - 0.6) * 0.16;
float heroWind = sin(vHeroSnowWorld.x * 1.55 + vHeroSnowWorld.z * 0.19 + heroMacro) * 0.16;
float heroSnowCoverage = smoothstep(-0.30, 0.36, heroMacro + heroWind + 0.16);
float heroRail = 1.0 - smoothstep(0.28, 1.05, abs(vHeroSnowWorld.z));
heroRail *= 1.0 - smoothstep(10.0, 15.5, abs(vHeroSnowWorld.x + 4.0));
float heroCompression = heroRail * 0.22;
vec3 heroSoil = vec3(0.285, 0.27, 0.225);
vec3 heroFrost = vec3(0.49, 0.51, 0.48);
vec3 heroSnow = vec3(0.76, 0.83, 0.9);
float heroGranule = heroHash(floor(vHeroSnowWorld.xz * 10.0));
vec3 heroSurface = mix(heroSoil, heroFrost, smoothstep(0.06, 0.62, heroSnowCoverage));
heroSurface = mix(heroSurface, heroSnow, smoothstep(0.38, 0.82, heroSnowCoverage));
heroSurface *= 0.94 + heroGranule * 0.075;
heroSurface = mix(heroSurface, vec3(0.56, 0.64, 0.75), heroCompression);
diffuseColor.rgb *= heroSurface;`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.91, 0.57, heroSnowCoverage);
roughnessFactor = mix(roughnessFactor, 0.38, heroCompression);`,
      )
      .replace(
        '#include <opaque_fragment>',
        `float heroViewGrazing = pow(1.0 - saturate(dot(normal, geometryViewDir)), 2.2);
float heroCrystal = smoothstep(
  0.992,
  0.999,
  heroHash(floor(vHeroSnowWorld.xz * 29.0) + floor(geometryViewDir.xz * 19.0))
);
float heroGlint = heroCrystal * heroViewGrazing * heroSnowCoverage * 0.38;
outgoingLight += vec3(0.68, 0.79, 1.0) * heroGlint;
outgoingLight += vec3(0.025, 0.038, 0.06) * heroSnowCoverage * (1.0 - saturate(normal.y));
float heroTerrainDistance = length(
  vHeroSnowWorld.xz - vec2(${ANIMAL_X.toFixed(1)}, ${ANIMAL_Z.toFixed(1)})
);
float heroTerrainBlend = 1.0 - smoothstep(52.0, 68.0, heroTerrainDistance);
diffuseColor.a *= heroTerrainBlend;
if (diffuseColor.a < 0.015) discard;
#include <opaque_fragment>`,
      )
  }
  material.customProgramCacheKey = () =>
    'scale-encounter-mammoth-accepted-snow-pbr-v1'
  return material
}

function createHeroSnowDepthMaterial(): MeshDepthMaterial {
  const material = new MeshDepthMaterial({ depthPacking: RGBADepthPacking })
  material.name = 'scale-encounter-mammoth-accepted-snow-depth'
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = injectHeroSnowVertex(shader.vertexShader)
  }
  material.customProgramCacheKey = () =>
    'scale-encounter-mammoth-accepted-snow-depth-v1'
  return material
}

function injectHeroSnowVertex(source: string): string {
  return source
    .replace(
      '#include <common>',
      `#include <common>
varying vec3 vHeroSnowWorld;

float heroSnowSupportMask(vec2 point) {
  float railSegment = 1.0 - smoothstep(10.0, 15.0, abs(point.x + 4.0));
  float rail = smoothstep(0.65, 2.15, abs(point.y));
  rail = mix(1.0, rail, railSegment);
  vec2 animalDelta = (point - vec2(${ANIMAL_X.toFixed(1)}, ${ANIMAL_Z.toFixed(1)})) / vec2(4.1, 2.0);
  float animal = smoothstep(0.78, 1.25, length(animalDelta));
  return min(rail, animal);
}

float heroSnowHeight(vec2 point) {
  float broad =
    sin(point.x * 0.23 + point.y * 0.08) * 0.075 +
    sin(point.x * -0.11 + point.y * 0.31 + 1.6) * 0.046;
  float ripple =
    sin(point.x * 1.55 + point.y * 0.19 + sin(point.y * 0.22)) * 0.017 +
    sin(point.x * 3.8 + point.y * 0.32) * 0.006;
  return (broad + ripple) * heroSnowSupportMask(point);
}`,
    )
    .replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
transformed.z += heroSnowHeight(transformed.xy);
vHeroSnowWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
    )
}

function createAlpineSkyDome(): {
  readonly cloudMap: DataTexture
  readonly mesh: Mesh<SphereGeometry, ShaderMaterial>
} {
  const cloudMap = createCloudMaskTexture()
  const material = new ShaderMaterial({
    depthWrite: false,
    fog: false,
    side: BackSide,
    toneMapped: false,
    uniforms: {
      cloudColour: { value: new Color('#f8fbfc') },
      cloudMap: { value: cloudMap },
      horizonColour: { value: new Color('#c2e0ed') },
      middleColour: { value: new Color('#79b9dc') },
      zenithColour: { value: new Color('#438fc2') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vSkyDirection;
      varying vec2 vSkyUv;
      void main() {
        vSkyDirection = normalize(position);
        vSkyUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 cloudColour;
      uniform sampler2D cloudMap;
      uniform vec3 horizonColour;
      uniform vec3 middleColour;
      uniform vec3 zenithColour;
      varying vec3 vSkyDirection;
      varying vec2 vSkyUv;
      void main() {
        vec3 direction = normalize(vSkyDirection);
        float height = direction.y;
        vec3 sky = mix(
          horizonColour,
          middleColour,
          smoothstep(-0.04, 0.42, height)
        );
        sky = mix(sky, zenithColour, smoothstep(0.38, 0.92, height));
        float cloudBand = smoothstep(0.03, 0.13, height) *
          (1.0 - smoothstep(0.62, 0.82, height));
        float cloud = texture2D(cloudMap, vSkyUv).r * cloudBand;
        float cloudLight = 0.82 + max(direction.y, 0.0) * 0.18;
        sky = mix(sky, cloudColour * cloudLight, cloud * 0.52);
        gl_FragColor = vec4(sky, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })
  material.name = 'scale-encounter-mammoth-clear-blue-sky'
  const mesh = new Mesh(new SphereGeometry(2_300, 64, 32), material)
  mesh.name = 'scale-encounter-mammoth-accepted-sky-dome'
  mesh.frustumCulled = false
  mesh.renderOrder = -100
  return { cloudMap, mesh }
}

function createCloudMaskTexture(): DataTexture {
  const width = 512
  const height = 256
  const data = new Uint8Array(width * height)
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width
      const broad = periodicValueNoise(u * 6, v * 3, 6, 3, 0x29d3)
      const middle = periodicValueNoise(u * 13, v * 7, 13, 7, 0x51a7)
      const detail = periodicValueNoise(u * 29, v * 15, 29, 15, 0x7f4d)
      const field = broad * 0.56 + middle * 0.3 + detail * 0.14
      data[y * width + x] = Math.round(smoothstep(0.59, 0.73, field) * 255)
    }
  }
  const texture = new DataTexture(
    data,
    width,
    height,
    RedFormat,
    UnsignedByteType,
  )
  texture.name = 'scale-encounter-mammoth-seamless-cloud-mask'
  texture.wrapS = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

function periodicValueNoise(
  x: number,
  y: number,
  periodX: number,
  periodY: number,
  seed: number,
): number {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const blendX = smoothstep(0, 1, x - x0)
  const blendY = smoothstep(0, 1, y - y0)
  const a = periodicCloudHash(x0, y0, periodX, periodY, seed)
  const b = periodicCloudHash(x0 + 1, y0, periodX, periodY, seed)
  const c = periodicCloudHash(x0, y0 + 1, periodX, periodY, seed)
  const d = periodicCloudHash(x0 + 1, y0 + 1, periodX, periodY, seed)
  return mix(mix(a, b, blendX), mix(c, d, blendX), blendY)
}

function periodicCloudHash(
  x: number,
  y: number,
  periodX: number,
  periodY: number,
  seed: number,
): number {
  const wrappedX = ((x % periodX) + periodX) % periodX
  const wrappedY = ((y % periodY) + periodY) % periodY
  let value = seed ^ Math.imul(wrappedX + 1, 0x45d9f3b)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value ^= Math.imul(wrappedY + 1, 0x27d4eb2d)
  value = Math.imul(value ^ (value >>> 15), 0x85ebca6b)
  return ((value ^ (value >>> 16)) >>> 0) / 4_294_967_295
}

function createAuthenticAlpineTerrain(): {
  readonly heightMap: Texture
  readonly mesh: Mesh<PlaneGeometry, MeshStandardMaterial>
} {
  const terrainSize = 6_740
  const terrainOriginUv = new Vector2(176.5 / 256, 1 - 80.5 / 256)
  const terrainOriginLocal = new Vector2(
    (terrainOriginUv.x - 0.5) * terrainSize,
    (terrainOriginUv.y - 0.5) * terrainSize,
  )
  const heightMap = new TextureLoader().load(alpineDemUrl)
  heightMap.name = 'scale-encounter-mapzen-alpine-elevation'
  heightMap.generateMipmaps = false
  heightMap.magFilter = LinearFilter
  heightMap.minFilter = LinearFilter

  const geometry = new PlaneGeometry(terrainSize, terrainSize, 255, 255)
  const material = new MeshStandardMaterial({
    color: '#ffffff',
    envMapIntensity: 0.62,
    metalness: 0,
    roughness: 0.9,
  })
  material.name = 'scale-encounter-real-dem-snow-mountain-material'
  material.onBeforeCompile = (shader) => {
    shader.uniforms.alpineHeightMap = { value: heightMap }
    shader.uniforms.alpineOriginLocal = { value: terrainOriginLocal }
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
uniform sampler2D alpineHeightMap;
uniform vec2 alpineOriginLocal;
varying float vAlpineRelief;
varying vec3 vAlpineWorld;
varying vec3 vAlpineWorldNormal;

float alpineElevationAt(vec2 sampleUv) {
  vec3 encoded = texture2D(alpineHeightMap, sampleUv).rgb;
  return encoded.r * 65280.0 + encoded.g * 255.0 + encoded.b * 0.99609375 - 32768.0;
}

float alpineReliefAt(vec2 sampleUv, vec2 localPosition) {
  float relativeElevation = (alpineElevationAt(sampleUv) - 2537.59375) * 0.44;
  float localRadius = length(localPosition - alpineOriginLocal);
  return relativeElevation * smoothstep(62.0, 420.0, localRadius);
}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
const vec2 alpineTexel = vec2(1.0 / 256.0);
const float alpineCellSize = 26.328125;
vAlpineRelief = alpineReliefAt(uv, position.xy);
transformed.z += vAlpineRelief;
float alpineLeft = alpineReliefAt(
  uv - vec2(alpineTexel.x, 0.0),
  position.xy - vec2(alpineCellSize, 0.0)
);
float alpineRight = alpineReliefAt(
  uv + vec2(alpineTexel.x, 0.0),
  position.xy + vec2(alpineCellSize, 0.0)
);
float alpineDown = alpineReliefAt(
  uv - vec2(0.0, alpineTexel.y),
  position.xy - vec2(0.0, alpineCellSize)
);
float alpineUp = alpineReliefAt(
  uv + vec2(0.0, alpineTexel.y),
  position.xy + vec2(0.0, alpineCellSize)
);
vec3 alpineLocalNormal = normalize(vec3(
  -(alpineRight - alpineLeft) / (alpineCellSize * 2.0),
  -(alpineUp - alpineDown) / (alpineCellSize * 2.0),
  1.0
));
vAlpineWorldNormal = normalize(mat3(modelMatrix) * alpineLocalNormal);
vAlpineWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying float vAlpineRelief;
varying vec3 vAlpineWorld;
varying vec3 vAlpineWorldNormal;

float alpineHash(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

float alpineValueNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 blend = fract(point);
  blend = blend * blend * (3.0 - 2.0 * blend);
  float a = alpineHash(cell);
  float b = alpineHash(cell + vec2(1.0, 0.0));
  float c = alpineHash(cell + vec2(0.0, 1.0));
  float d = alpineHash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
vec3 alpineWorldNormal = normalize(vAlpineWorldNormal);
float alpineUpward = smoothstep(0.34, 0.82, alpineWorldNormal.y);
float alpineAltitude = smoothstep(40.0, 430.0, vAlpineRelief);
float alpineMacro = alpineValueNoise(vAlpineWorld.xz * 0.0045);
float alpineDetail = alpineValueNoise(vAlpineWorld.xz * 0.035);
float alpineSnowCoverage = clamp(
  alpineUpward * 0.72 + alpineAltitude * 0.42 +
  (alpineMacro - 0.5) * 0.22 + (alpineDetail - 0.5) * 0.08,
  0.0,
  1.0
);
vec3 alpineRock = mix(
  vec3(0.115, 0.135, 0.155),
  vec3(0.255, 0.285, 0.31),
  alpineMacro
);
vec3 alpineSnow = mix(
  vec3(0.54, 0.62, 0.68),
  vec3(0.77, 0.84, 0.9),
  alpineDetail * 0.42 + 0.46
);
vec3 alpineSurface = mix(
  alpineRock,
  alpineSnow,
  smoothstep(0.22, 0.82, alpineSnowCoverage)
);
diffuseColor.rgb *= alpineSurface;`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
normal = normalize((viewMatrix * vec4(alpineWorldNormal, 0.0)).xyz);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(0.82, 0.96, alpineSnowCoverage);`,
      )
  }
  material.customProgramCacheKey = () =>
    'scale-encounter-real-dem-alpine-terrain-v1'

  const mesh = new Mesh(geometry, material)
  mesh.name = 'scale-encounter-real-dem-continuous-alpine-terrain'
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(
    ANIMAL_X - terrainOriginLocal.x,
    -0.08,
    ANIMAL_Z + terrainOriginLocal.y,
  )
  mesh.receiveShadow = true
  return { heightMap, mesh }
}

function createSnowEnvironmentMap(
  renderer: WebGLRenderer,
): WebGLRenderTarget {
  const environmentScene = new Scene()
  const dome = new Mesh(
    new SphereGeometry(24, 48, 24),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      uniforms: {
        horizon: { value: new Color('#cbdde5').convertSRGBToLinear() },
        zenith: { value: new Color('#6591ad').convertSRGBToLinear() },
        ground: { value: new Color('#8a938e').convertSRGBToLinear() },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vDirection;
        uniform vec3 horizon;
        uniform vec3 zenith;
        uniform vec3 ground;
        void main() {
          float up = smoothstep(-0.02, 0.88, vDirection.y);
          vec3 colour = mix(ground, horizon, smoothstep(-0.55, 0.08, vDirection.y));
          colour = mix(colour, zenith, up);
          gl_FragColor = vec4(colour, 1.0);
        }
      `,
    }),
  )
  environmentScene.add(dome)
  const generator = new PMREMGenerator(renderer)
  const target = generator.fromScene(environmentScene, 0.04, 0.1, 60)
  generator.dispose()
  dome.geometry.dispose()
  ;(dome.material as Material).dispose()
  return target
}

function tightenHeroShadow(root: Group): void {
  root.traverse((object) => {
    if (
      !(object instanceof DirectionalLight) ||
      object.name !== 'glacier-world-sun'
    ) {
      return
    }
    object.shadow.mapSize.set(2048, 2048)
    object.shadow.camera.left = -15
    object.shadow.camera.right = 15
    object.shadow.camera.top = 13
    object.shadow.camera.bottom = -13
    object.shadow.camera.near = 28
    object.shadow.camera.far = 142
    object.shadow.bias = -0.00012
    object.shadow.normalBias = 0.012
    object.shadow.camera.updateProjectionMatrix()
  })
}

export function mammothAcceptedGroundHeightAtWorld(
  x: number,
  z: number,
): number {
  return heroSnowHeightAt(x, -z)
}

function heroSnowHeightAt(x: number, z: number): number {
  const broad =
    Math.sin(x * 0.23 + z * 0.08) * 0.075 +
    Math.sin(x * -0.11 + z * 0.31 + 1.6) * 0.046
  const ripple =
    Math.sin(x * 1.55 + z * 0.19 + Math.sin(z * 0.22)) * 0.017 +
    Math.sin(x * 3.8 + z * 0.32) * 0.006
  return (broad + ripple) * heroSnowSupportMaskAt(x, z) - 0.035
}

function heroSnowSupportMaskAt(x: number, z: number): number {
  const railSegment = 1 - smoothstep(10, 15, Math.abs(x + 4))
  const rail = mix(1, smoothstep(0.65, 2.15, Math.abs(z)), railSegment)
  const animal = smoothstep(
    0.78,
    1.25,
    Math.hypot((x - ANIMAL_X) / 4.1, (z - ANIMAL_Z) / 2),
  )
  return Math.min(rail, animal)
}

function heroSnowCoverageAt(x: number, z: number): number {
  const macro =
    Math.sin(x * 0.17 + z * 0.07) * 0.46 +
    Math.sin(x * -0.08 + z * 0.21 + 1.9) * 0.31 +
    Math.sin(x * 0.51 - z * 0.13 - 0.6) * 0.16
  const wind = Math.sin(x * 1.55 + z * 0.19 + macro) * 0.16
  return smoothstep(-0.3, 0.36, macro + wind + 0.16)
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function smoothstep(start: number, end: number, value: number): number {
  const amount = Math.min(1, Math.max(0, (value - start) / (end - start)))
  return amount * amount * (3 - 2 * amount)
}

function mix(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}
