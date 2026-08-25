import {
  BackSide,
  Box3,
  Box3Helper,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  DataUtils,
  DirectionalLight,
  DoubleSide,
  FrontSide,
  Group,
  HalfFloatType,
  HemisphereLight,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  LineSegments,
  Mesh,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Camera,
  type LineBasicMaterial,
  type Material,
  type Object3D,
  type PerspectiveCamera,
  type Texture,
} from 'three'
import {
  SKY_HEIGHT_BANDS,
  SKY_REFERENCE_Y_METERS,
  SKY_SCENE_CONTRACT_REVISION,
  skyLayersForVariant,
  type SkyAssetLeaseIdentity,
  type SkyCameraState,
  type SkyEnvironmentVariant,
  type SkyLayerId,
  type SkyRendererCapabilities,
} from './sky-contract'
import {
  boundsAltitudeRange,
  estimateGeometryResources,
  estimateTransparentOverdraw,
  inspectSkyClouds,
  projectWorldBounds,
  serializeBox3,
  serializeVector3,
  worldBoundsFor,
  type GeometryResourceEstimate,
  type SerializedBox3,
  type SkyCloudDiagnostic,
  type SkyCloudDiagnosticInput,
  type TransparentOverdrawEstimate,
} from './sky-diagnostics'

export interface SkyEnvironmentCandidateInput {
  readonly assetLease: SkyAssetLeaseIdentity
  readonly avatarBounds: Readonly<Box3>
  readonly cameraState: SkyCameraState
  readonly cameraSweepBounds: Readonly<Box3>
  readonly corridorBounds: Readonly<Box3>
  readonly rendererCapabilities: SkyRendererCapabilities
  readonly subjectBounds: Readonly<Box3>
  readonly variant: SkyEnvironmentVariant
}

export interface SkyLayerState {
  readonly id: SkyLayerId
  readonly visible: boolean
}

export interface SkyAlphaDiagnostic {
  readonly alphaMode: 'opaque' | 'premultiplied-blend'
  readonly alphaTextureCount: number
  readonly cloudMaterialsPremultiplied: boolean
  readonly cloudMaterialsUseMipmaps: false
  readonly cloudMaterialsDepthWriteDisabled: boolean
  readonly edgeRgbPolicy: string
}

export interface SkyEnvironmentDiagnostics {
  readonly alpha: SkyAlphaDiagnostic
  readonly assetLease: SkyAssetLeaseIdentity
  readonly avatarOcclusionEvaluated: boolean
  readonly avatarBounds: SerializedBox3
  readonly camera: {
    readonly aspect: number
    readonly far: number
    readonly fieldOfViewDegrees: number
    readonly near: number
    readonly position: ReturnType<typeof serializeVector3>
    readonly stage: SkyCameraState['stage']
    readonly target: ReturnType<typeof serializeVector3>
  }
  readonly cameraSweepBounds: SerializedBox3
  readonly cloudCount: number
  readonly cloudDiagnostics: readonly SkyCloudDiagnostic[]
  readonly corridorBounds: SerializedBox3
  readonly corridorOverlapCount: number
  readonly heightBands: typeof SKY_HEIGHT_BANDS
  readonly layerStates: readonly SkyLayerState[]
  readonly referenceY: number
  readonly rendererCapabilities: SkyRendererCapabilities
  readonly resources: GeometryResourceEstimate & {
    readonly activeMaterialCount: number
    readonly proceduralTextureBytes: number
    readonly transparentDrawEstimate: number
  }
  readonly sceneContractRevision: typeof SKY_SCENE_CONTRACT_REVISION
  readonly subjectBounds: SerializedBox3
  readonly subjectOcclusionMaximumFraction: number
  readonly transparentOverdraw: TransparentOverdrawEstimate
  readonly variant: SkyEnvironmentVariant
}

export interface SkyDiagnosticMode {
  readonly backgroundTone?: 'normal' | 'dark'
  readonly isolateLayers?: readonly SkyLayerId[] | null
  readonly showFlightVolumes?: boolean
  readonly showOverdraw?: boolean
}

export interface SkyEnvironmentCandidate {
  readonly radianceTexture: DataTexture
  readonly root: Group
  dispose(): void
  getDiagnostics(
    camera: PerspectiveCamera,
    cameraState: SkyCameraState,
    subjectBounds: Readonly<Box3>,
    avatarBounds: Readonly<Box3>,
  ): SkyEnvironmentDiagnostics
  setCorridorBounds(
    corridorBounds: Readonly<Box3>,
    cameraSweepBounds: Readonly<Box3>,
  ): void
  setDiagnosticMode(mode: SkyDiagnosticMode): void
  setVariant(variant: SkyEnvironmentVariant): void
  update(
    elapsedSeconds: number,
    reducedMotion: boolean,
    camera: Camera,
  ): void
}

type CloudLayer = Extract<
  SkyLayerId,
  'near-air' | 'mid-cloud' | 'far-cloud'
>

interface CloudLobeSpec {
  readonly offset: readonly [number, number, number]
  readonly scale: readonly [number, number, number]
}

interface CloudClusterSpec {
  readonly id: string
  readonly layer: CloudLayer
  readonly lobes: readonly CloudLobeSpec[]
  readonly opacity: number
  readonly position: readonly [number, number, number]
  readonly tint: string
  readonly yawDegrees: number
}

interface CloudEntry extends SkyCloudDiagnosticInput {
  readonly material: ShaderMaterial
}

const SUN_DIRECTION = new Vector3(-0.42, 0.78, -0.46).normalize()
const BACKGROUND_RADIUS_METERS = 215

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const normalised = clamp01((value - edge0) / (edge1 - edge0))
  return normalised * normalised * (3 - 2 * normalised)
}

function mixNumber(a: number, b: number, amount: number): number {
  return a + (b - a) * amount
}

/**
 * D preserves the accepted C composition, but bakes the static atmospheric
 * radiance once so the visible sky, sea reflection and subject PMREM can all
 * sample one tone-mapping-free linear HDR source.
 */
function createSkyRadianceLut(): DataTexture {
  const width = 512
  const height = 256
  const data = new Uint16Array(width * height * 4)
  const direction = new Vector3()
  const horizon = [0.56, 0.76, 0.84] as const
  const upper = [0.075, 0.3, 0.55] as const
  const sun = [1.0, 0.77, 0.48] as const

  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height
    const elevationAngle = (v - 0.5) * Math.PI
    const directionY = Math.sin(elevationAngle)
    const horizontalLength = Math.cos(elevationAngle)
    const heightMix = clamp01(directionY * 0.5 + 0.5)
    const zenith = smoothstep(0.22, 0.96, heightMix)
    const horizonGlow = 1 - smoothstep(0, 0.22, Math.abs(directionY))

    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width
      const azimuth = (u - 0.5) * Math.PI * 2
      direction.set(
        Math.cos(azimuth) * horizontalLength,
        directionY,
        Math.sin(azimuth) * horizontalLength,
      )
      const colour: [number, number, number] = [
        mixNumber(horizon[0], upper[0], zenith) + 0.055 * horizonGlow,
        mixNumber(horizon[1], upper[1], zenith) + 0.042 * horizonGlow,
        mixNumber(horizon[2], upper[2], zenith) + 0.025 * horizonGlow,
      ]

      // Visible clouds stay in the accepted C geometry layers. Baking their
      // old direction-space field into an equirectangular LUT produced tall,
      // curtain-like streaks because nearby elevation rows shared almost the
      // same horizontal sample. The LUT now carries lighting only.

      const sunDot = Math.max(0, direction.dot(SUN_DIRECTION))
      // The overview camera keeps the sun just outside the right edge of the
      // frame. Any broad halo therefore projects as a tall pale curtain and
      // reads like a vertically stretched cloud. Direct lighting already owns
      // the solar key, so the radiance map keeps only a tiny visible disc.
      const sunHalo = 0
      const sunDisc = smoothstep(0.99994, 0.999985, sunDot) * 0.42
      const sunAmount = sunHalo + sunDisc
      const offset = (y * width + x) * 4
      data[offset] = DataUtils.toHalfFloat(colour[0] + sun[0] * sunAmount)
      data[offset + 1] = DataUtils.toHalfFloat(
        colour[1] + sun[1] * sunAmount,
      )
      data[offset + 2] = DataUtils.toHalfFloat(
        colour[2] + sun[2] * sunAmount,
      )
      data[offset + 3] = DataUtils.toHalfFloat(1)
    }
  }

  const texture = new DataTexture(
    data,
    width,
    height,
    RGBAFormat,
    HalfFloatType,
  )
  texture.name = 'sky-coherent-radiance-linear-hdr-v3'
  texture.colorSpace = LinearSRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true
  return texture
}

const CLOUD_LAYER_SCALE: Readonly<Record<CloudLayer, number>> = {
  'near-air': 0.42,
  'mid-cloud': 0.78,
  'far-cloud': 1.15,
}

const CLOUD_CLUSTERS: readonly CloudClusterSpec[] = [
  {
    id: 'near-air-west-wisp',
    layer: 'near-air',
    // Two sparse high clusters sit beyond the Pteranodon instead of at the
    // sides of the review frustum. They remain outside the child-to-animal
    // flight corridor, but are now legible in both the rear-establishing and
    // first-person cameras.
    position: [-24, 22, -58],
    yawDegrees: 18,
    opacity: 0.52,
    tint: '#f7fbff',
    lobes: [
      { offset: [-3.8, 0, 0], scale: [7.8, 1.45, 3.1] },
      { offset: [1.8, 0.5, 0.6], scale: [9.2, 2.1, 4.2] },
      { offset: [6.2, -0.15, -0.4], scale: [5.8, 1.35, 2.6] },
    ],
  },
  {
    id: 'near-air-east-thread',
    layer: 'near-air',
    position: [27, 19, -74],
    yawDegrees: -24,
    opacity: 0.48,
    tint: '#edf7ff',
    lobes: [
      { offset: [-4.5, 0, 0.2], scale: [7, 1.2, 2.5] },
      { offset: [0.8, 0.45, 0], scale: [8.6, 1.8, 3.4] },
      { offset: [6.1, -0.2, 0.4], scale: [5.2, 1.1, 2.2] },
    ],
  },
  {
    id: 'mid-cloud-south-break',
    layer: 'mid-cloud',
    position: [-62, -10, -82],
    yawDegrees: -9,
    opacity: 0.56,
    tint: '#e9f3fa',
    lobes: [
      { offset: [-7.2, -0.4, 0], scale: [10.5, 2.3, 5.2] },
      { offset: [0, 0.8, -0.5], scale: [13.8, 3.3, 6.8] },
      { offset: [9.5, -0.1, 0.7], scale: [8.8, 2.2, 4.9] },
    ],
  },
  {
    id: 'mid-cloud-north-island',
    layer: 'mid-cloud',
    position: [-58, -14, 104],
    yawDegrees: 31,
    opacity: 0.52,
    tint: '#f4f8fb',
    lobes: [
      { offset: [-6.4, 0, 0.5], scale: [9.4, 2, 4.5] },
      { offset: [0, 0.9, -0.4], scale: [12.2, 3.1, 6.1] },
      { offset: [8.5, 0.1, 1], scale: [7.2, 1.8, 4] },
    ],
  },
  {
    id: 'mid-cloud-east-ribbon',
    layer: 'mid-cloud',
    position: [76, -19, 16],
    yawDegrees: -37,
    opacity: 0.32,
    tint: '#e6f0f7',
    lobes: [
      { offset: [-8, 0, 0], scale: [11.2, 1.6, 4.3] },
      { offset: [1, 0.5, 0.5], scale: [14.8, 2.4, 5.5] },
      { offset: [11, -0.2, -0.4], scale: [7.6, 1.4, 3.8] },
    ],
  },
  {
    id: 'far-cloud-coast-a',
    layer: 'far-cloud',
    position: [-112, -34, -118],
    yawDegrees: 14,
    opacity: 0.58,
    tint: '#dcebf4',
    lobes: [
      { offset: [-11, 0, 0], scale: [16, 2.8, 7] },
      { offset: [1, 1.1, -0.8], scale: [20, 4.1, 9.5] },
      { offset: [15, -0.2, 0.8], scale: [12, 2.5, 6] },
    ],
  },
  {
    id: 'far-cloud-coast-b',
    layer: 'far-cloud',
    position: [-88, -38, 132],
    yawDegrees: -21,
    opacity: 0.54,
    tint: '#e7f1f6',
    lobes: [
      { offset: [-12, 0.1, 0.6], scale: [17, 2.5, 7.5] },
      { offset: [0, 0.9, 0], scale: [21, 3.8, 10] },
      { offset: [16, -0.4, -0.7], scale: [12.5, 2.1, 6.2] },
    ],
  },
  {
    id: 'far-cloud-open-water',
    layer: 'far-cloud',
    position: [118, -31, 30],
    yawDegrees: 8,
    opacity: 0.4,
    tint: '#d9e9f3',
    lobes: [
      { offset: [-10, -0.2, 0], scale: [15, 2.2, 6.5] },
      { offset: [2, 0.7, 0.5], scale: [19, 3.5, 9] },
      { offset: [15, -0.3, -0.5], scale: [11.5, 2, 5.7] },
    ],
  },
] as const

const backgroundVertexShader = /* glsl */ `
  varying vec3 vDirection;

  void main() {
    vDirection = normalize(position);
    vec4 clipPosition = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = clipPosition.xyww;
  }
`

const backgroundFragmentShader = /* glsl */ `
  uniform sampler2D uSkyRadiance;
  uniform vec3 uSunDirection;
  uniform float uDarkDiagnostic;
  uniform float uUseSkyRadiance;
  varying vec3 vDirection;

  vec2 skyDirectionToEquirectUv(vec3 direction) {
    direction = normalize(direction);
    return vec2(
      atan(direction.z, direction.x) * 0.15915494309189535 + 0.5,
      asin(clamp(direction.y, -1.0, 1.0)) * 0.3183098861837907 + 0.5
    );
  }

  float hash31(vec3 point) {
    point = fract(point * 0.1031);
    point += dot(point, point.yzx + 33.33);
    return fract((point.x + point.y) * point.z);
  }

  float valueNoise(vec3 point) {
    vec3 cell = floor(point);
    vec3 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    float n000 = hash31(cell + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(cell + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(cell + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(cell + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(cell + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(cell + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(cell + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(cell + vec3(1.0, 1.0, 1.0));
    float lower = mix(mix(n000, n100, local.x), mix(n010, n110, local.x), local.y);
    float upper = mix(mix(n001, n101, local.x), mix(n011, n111, local.x), local.y);
    return mix(lower, upper, local.z);
  }

  float fBm(vec3 point) {
    float value = 0.0;
    float amplitude = 0.56;
    mat3 rotation = mat3(
      0.00, 0.80, 0.60,
      -0.80, 0.36, -0.48,
      -0.60, -0.48, 0.64
    );
    for (int octave = 0; octave < 4; octave += 1) {
      value += valueNoise(point) * amplitude;
      point = rotation * point * 2.03 + vec3(7.3, 2.1, 4.7);
      amplitude *= 0.49;
    }
    return value;
  }

  void main() {
    vec3 direction = normalize(vDirection);
    if (uUseSkyRadiance > 0.5) {
      vec3 cachedSky = texture2D(
        uSkyRadiance,
        skyDirectionToEquirectUv(direction)
      ).rgb;
      // Keep the accepted C cloud coverage in D, but evaluate it directly
      // from the view direction. Baking this field into the equirectangular
      // radiance LUT created vertically stretched streaks on mobile GPUs.
      vec3 cloudSample = direction * vec3(4.2, 9.5, 4.2) + vec3(1.7, 4.1, -2.8);
      float cloudField = fBm(cloudSample);
      float cloudDetail = fBm(cloudSample * 1.83 + vec3(-3.0, 5.0, 1.0));
      float cloudMask = smoothstep(0.52, 0.69, cloudField * 0.72 + cloudDetail * 0.28);
      float cloudBand = smoothstep(0.02, 0.14, direction.y) *
        (1.0 - smoothstep(0.46, 0.72, direction.y));
      float backgroundCloud = cloudMask * cloudBand * 0.27;
      cachedSky = mix(cachedSky, vec3(0.88, 0.94, 0.965), backgroundCloud);
      float cachedHeight = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
      vec3 diagnosticColour = mix(
        vec3(0.018, 0.028, 0.052),
        vec3(0.075, 0.105, 0.14),
        cachedHeight
      );
      gl_FragColor = vec4(
        mix(cachedSky, diagnosticColour, uDarkDiagnostic),
        1.0
      );
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      return;
    }
    float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
    float zenith = smoothstep(0.22, 0.96, height);
    vec3 horizonColour = vec3(0.56, 0.76, 0.84);
    vec3 upperColour = vec3(0.075, 0.30, 0.55);
    vec3 skyColour = mix(horizonColour, upperColour, zenith);
    float horizonGlow = 1.0 - smoothstep(0.0, 0.22, abs(direction.y));
    skyColour += vec3(0.055, 0.042, 0.025) * horizonGlow;

    vec3 cloudSample = direction * vec3(4.2, 9.5, 4.2) + vec3(1.7, 4.1, -2.8);
    float cloudField = fBm(cloudSample);
    float cloudDetail = fBm(cloudSample * 1.83 + vec3(-3.0, 5.0, 1.0));
    float cloudMask = smoothstep(0.52, 0.69, cloudField * 0.72 + cloudDetail * 0.28);
    float cloudBand = smoothstep(0.02, 0.14, direction.y) *
      (1.0 - smoothstep(0.46, 0.72, direction.y));
    float backgroundCloud = cloudMask * cloudBand * 0.27;
    skyColour = mix(skyColour, vec3(0.88, 0.94, 0.965), backgroundCloud);

    float sunDot = max(dot(direction, normalize(uSunDirection)), 0.0);
    float sunHalo = pow(sunDot, 90.0) * 0.15;
    float sunDisc = smoothstep(0.99955, 0.99986, sunDot);
    skyColour += vec3(1.0, 0.77, 0.48) * sunHalo;
    skyColour = mix(skyColour, vec3(1.0, 0.94, 0.76), sunDisc * 0.68);

    vec3 diagnosticColour = mix(
      vec3(0.018, 0.028, 0.052),
      vec3(0.075, 0.105, 0.14),
      height
    );
    gl_FragColor = vec4(mix(skyColour, diagnosticColour, uDarkDiagnostic), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const seaVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCameraPosition;
  varying vec3 vWorldPosition;
  varying float vWave;

  float waveHeight(vec2 point, float time) {
    return sin(point.x * 0.055 + time * 0.22) * 0.32 +
      sin(point.y * 0.041 - time * 0.17 + 1.7) * 0.24 +
      sin((point.x + point.y) * 0.021 + time * 0.11) * 0.18;
  }

  void main() {
    vec3 transformed = position;
    vec4 flatWorldPosition = modelMatrix * vec4(position, 1.0);
    float horizontalDistance = length(
      flatWorldPosition.xz - uCameraPosition.xz
    );
    // The old moving outer edge met the 240 m far plane as a visibly
    // piecewise-linear skyline. Flatten the swell before it reaches the
    // atmospheric horizon; foreground water keeps all of its movement.
    float scaleEncounterHorizonWaveFade = 1.0 - smoothstep(
      145.0,
      215.0,
      horizontalDistance
    );
    vWave = waveHeight(position.xy, uTime) * scaleEncounterHorizonWaveFade;
    transformed.z += vWave;
    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const seaFragmentShader = /* glsl */ `
  uniform vec3 uCameraPosition;
  uniform sampler2D uSkyRadiance;
  uniform vec3 uSunDirection;
  uniform float uTime;
  uniform float uUseSkyRadiance;
  varying vec3 vWorldPosition;
  varying float vWave;

  vec2 seaDirectionToEquirectUv(vec3 direction) {
    direction = normalize(direction);
    return vec2(
      atan(direction.z, direction.x) * 0.15915494309189535 + 0.5,
      asin(clamp(direction.y, -1.0, 1.0)) * 0.3183098861837907 + 0.5
    );
  }

  vec3 skyColourBehindSea(vec3 direction) {
    direction = normalize(direction);
    if (uUseSkyRadiance > 0.5) {
      return texture2D(
        uSkyRadiance,
        seaDirectionToEquirectUv(direction)
      ).rgb;
    }
    float height = clamp(direction.y * 0.5 + 0.5, 0.0, 1.0);
    float zenith = smoothstep(0.22, 0.96, height);
    vec3 horizonColour = vec3(0.56, 0.76, 0.84);
    vec3 upperColour = vec3(0.075, 0.30, 0.55);
    vec3 colour = mix(horizonColour, upperColour, zenith);
    float horizonGlow = 1.0 - smoothstep(0.0, 0.22, abs(direction.y));
    colour += vec3(0.055, 0.042, 0.025) * horizonGlow;
    float sunDot = max(dot(direction, normalize(uSunDirection)), 0.0);
    float sunHalo = pow(sunDot, 90.0) * 0.15;
    float sunDisc = smoothstep(0.99955, 0.99986, sunDot);
    colour += vec3(1.0, 0.77, 0.48) * sunHalo;
    return mix(colour, vec3(1.0, 0.94, 0.76), sunDisc * 0.68);
  }

  void main() {
    vec2 point = vWorldPosition.xz;
    vec3 normal = normalize(vec3(
      -0.022 * cos(point.x * 0.055 + uTime * 0.22) -
        0.011 * cos((point.x + point.y) * 0.021 + uTime * 0.11),
      1.0,
      -0.010 * cos(point.y * 0.041 - uTime * 0.17 + 1.7) -
        0.011 * cos((point.x + point.y) * 0.021 + uTime * 0.11)
    ));
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.2);
    vec3 deepWater = vec3(0.018, 0.16, 0.25);
    vec3 openWater = vec3(0.038, 0.28, 0.41);
    vec3 skyReflection = vec3(0.31, 0.57, 0.69);
    if (uUseSkyRadiance > 0.5) {
      vec3 reflectedDirection = reflect(-viewDirection, normal);
      skyReflection = texture2D(
        uSkyRadiance,
        seaDirectionToEquirectUv(reflectedDirection)
      ).rgb;
    }
    // Keep enough blue-green body colour beneath the reflected sky for the
    // sea to read as a plane rather than a continuation of the atmosphere.
    vec3 colour = mix(openWater, skyReflection, fresnel * 0.58);
    colour = mix(colour, deepWater, smoothstep(-0.55, 0.3, vWave) * 0.12);
    float longSwell = 0.5 + 0.5 * sin(
      point.x * 0.072 + point.y * 0.026 + uTime * 0.24 +
      sin(point.y * 0.019 - uTime * 0.09) * 1.35
    );
    float crossSwell = 0.5 + 0.5 * sin(
      point.x * -0.031 + point.y * 0.086 - uTime * 0.19
    );
    float softCrest = smoothstep(0.78, 0.98, longSwell * 0.74 + crossSwell * 0.26);
    colour += vec3(0.10, 0.17, 0.19) * softCrest * (0.16 + fresnel * 0.2);
    vec3 reflectedSun = reflect(-normalize(uSunDirection), normal);
    float glint = pow(max(dot(reflectedSun, viewDirection), 0.0), 92.0);
    colour += vec3(1.0, 0.84, 0.59) * glint * 0.76;
    float cameraDistance = length(vWorldPosition.xz - uCameraPosition.xz);
    float distanceHaze = smoothstep(95.0, 190.0, cameraDistance);
    colour = mix(colour, vec3(0.37, 0.61, 0.71), distanceHaze * 0.48);
    // A broad, low-contrast teal band preserves an unmistakable sea level in
    // high overview angles. It fades again before the finite surface reaches
    // the far clip, so it cannot turn into a hard polygonal skyline.
    float scaleEncounterSeaLevelDefinition =
      smoothstep(132.0, 184.0, cameraDistance) *
      (1.0 - smoothstep(205.0, 232.0, cameraDistance));
    colour = mix(
      colour,
      vec3(0.16, 0.40, 0.52),
      scaleEncounterSeaLevelDefinition * 0.24
    );
    // Match the exact background colour only in the final few metres before
    // the far clip. Most of the distant water therefore retains its identity.
    float scaleEncounterSeamlessHorizon = smoothstep(
      214.0,
      238.0,
      cameraDistance
    );
    vec3 backgroundDirection = normalize(vWorldPosition - uCameraPosition);
    colour = mix(
      colour,
      skyColourBehindSea(backgroundDirection),
      scaleEncounterSeamlessHorizon
    );
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const horizonHazeVertexShader = /* glsl */ `
  varying float vScaleEncounterHazeHeight;

  void main() {
    vScaleEncounterHazeHeight = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const horizonHazeFragmentShader = /* glsl */ `
  uniform vec3 uHazeColour;
  varying float vScaleEncounterHazeHeight;

  void main() {
    // Feather both cylinder rims. The previous opaque 64-sided rim was the
    // source of the long straight segments visible across the sea/sky join.
    float lowerFeather = smoothstep(
      0.0,
      0.22,
      vScaleEncounterHazeHeight
    );
    float upperFeather = 1.0 - smoothstep(
      0.52,
      1.0,
      vScaleEncounterHazeHeight
    );
    float alpha = 0.055 * lowerFeather * upperFeather;
    gl_FragColor = vec4(uHazeColour, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const cloudVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;

  void main() {
    vLocalPosition = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const cloudFragmentShader = /* glsl */ `
  uniform vec3 uCloudColour;
  uniform vec3 uSunDirection;
  uniform float uOpacity;
  uniform float uOverdrawDiagnostic;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vLocalPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = clamp(dot(normalize(vWorldNormal), viewDirection), 0.0, 1.0);
    float broadStructure = 0.5 + 0.5 * sin(
      vLocalPosition.x * 0.31 -
      vLocalPosition.y * 0.47 +
      vLocalPosition.z * 0.23
    );
    float fineStructure = 0.5 + 0.5 * sin(
      vLocalPosition.x * 0.79 +
      vLocalPosition.y * 1.17 -
      vLocalPosition.z * 0.61 +
      broadStructure * 2.1
    );
    float edgeBreakup = (broadStructure * 0.62 + fineStructure * 0.38 - 0.5) * 0.16;
    // Two fades are deliberate: the first guarantees a transparent geometric
    // silhouette, while the noisy second fade breaks up the old hard white
    // cutout without alpha clipping or a texture matte.
    float silhouetteFade = smoothstep(0.01, 0.58, facing);
    float billowFade = smoothstep(0.04, 0.78, facing + edgeBreakup);
    float structure = 0.78 + 0.22 * (broadStructure * 0.55 + fineStructure * 0.45);
    float alpha = clamp(
      uOpacity * 0.42 * silhouetteFade * billowFade * structure,
      0.0,
      0.36
    );
    vec3 normal = normalize(vWorldNormal);
    float diffuse = max(dot(normal, normalize(uSunDirection)), 0.0);
    float underside = smoothstep(-0.58, 0.55, normal.y);
    vec3 coolShadow = uCloudColour * vec3(0.66, 0.76, 0.84);
    vec3 warmLight = mix(uCloudColour, vec3(1.0, 0.985, 0.94), 0.34);
    vec3 shadedColour = mix(coolShadow, warmLight, 0.28 + diffuse * 0.5 + underside * 0.22);
    float silverLining = pow(1.0 - facing, 3.0) * pow(max(dot(viewDirection, normalize(uSunDirection)), 0.0), 7.0);
    shadedColour += vec3(1.0, 0.92, 0.72) * silverLining * 0.22;
    vec3 outputColour = mix(
      shadedColour,
      vec3(1.0, 0.18, 0.02),
      uOverdrawDiagnostic
    );
    alpha = mix(alpha, 0.22, uOverdrawDiagnostic);
    gl_FragColor = vec4(outputColour, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb *= gl_FragColor.a;
  }
`

function createBackgroundLayer(radianceTexture: DataTexture): {
  readonly flightFill: DirectionalLight
  readonly group: Group
  readonly hemisphere: HemisphereLight
  readonly material: ShaderMaterial
  readonly sky: Mesh
  readonly sun: DirectionalLight
} {
  const group = new Group()
  group.name = 'sky-background-atmosphere'
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    fragmentShader: backgroundFragmentShader,
    side: BackSide,
    toneMapped: true,
    uniforms: {
      uDarkDiagnostic: { value: 0 },
      uSkyRadiance: { value: radianceTexture },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uUseSkyRadiance: { value: 0 },
    },
    vertexShader: backgroundVertexShader,
  })
  const sky = new Mesh(
    new SphereGeometry(BACKGROUND_RADIUS_METERS, 64, 32),
    material,
  )
  sky.name = 'seam-safe-analytic-sky-background'
  sky.frustumCulled = false
  sky.renderOrder = -1_000
  group.add(sky)

  const hemisphere = new HemisphereLight('#d8eff9', '#718e9d', 1.68)
  hemisphere.name = 'sky-candidate-hemisphere'
  const sun = new DirectionalLight('#ffe3b5', 2.12)
  sun.name = 'sky-candidate-world-sun'
  sun.position.copy(SUN_DIRECTION).multiplyScalar(95)
  sun.target.position.set(0, 4.8, 0)
  sun.castShadow = false
  // The authored sun remains visible ahead of the family, so its key light
  // naturally falls behind the subjects during the child-eye view. A broad,
  // cool flight fill from the rear/upper camera hemisphere restores the
  // colours of skin, clothing and wing membranes without flattening the
  // warmer sun-facing side.
  const flightFill = new DirectionalLight('#e3f4ff', 1.85)
  flightFill.name = 'sky-candidate-rear-upper-flight-fill'
  flightFill.position.set(8, 38, 76)
  flightFill.target.position.set(0, 4.8, 0)
  flightFill.castShadow = false
  group.add(
    hemisphere,
    sun,
    sun.target,
    flightFill,
    flightFill.target,
  )
  return { flightFill, group, hemisphere, material, sky, sun }
}

interface AerialIslandSpec {
  readonly centre: readonly [number, number]
  readonly coastlinePhase: number
  readonly name: string
  readonly radius: readonly [number, number]
  readonly reliefMeters: number
  readonly ridgeShift: readonly [number, number]
  readonly rotationRadians: number
}

// The three authored sea waves can add at most 0.74 m. The former islets were
// flat transparent fans only 0.17 m above mean water, so the animated opaque
// sea repeatedly won the depth test and made the whole island blink out.
const SKY_MAXIMUM_WAVE_DISPLACEMENT_METERS = 0.32 + 0.24 + 0.18
const AERIAL_ISLAND_SEGMENTS = 64
const AERIAL_ISLAND_RADIAL_RINGS = 8
const AERIAL_ISLAND_ATLAS_TEXTURE_URL = new URL(
  '../../assets/environments/sky/aerial-island-atlas-v1.webp',
  import.meta.url,
).href

// The camera looks steeply down from roughly 65 m above the water, so its sea
// footprint—not the world origin—is the useful placement reference. These
// Small landforms sit beyond that footprint and retain 70 m or more of slant
// distance. Their staggered X positions prevent a wide viewport from
// compressing the whole archipelago into one horizontal band.
const AERIAL_ARCHIPELAGO_LANDSCAPE: readonly AerialIslandSpec[] = [
  {
    centre: [-36, -18],
    coastlinePhase: 0.3,
    name: 'windward-main-island',
    radius: [1.95, 1.12],
    reliefMeters: 0.52,
    ridgeShift: [-0.34, 0.18],
    rotationRadians: 0.36,
  },
  {
    centre: [-27, -5],
    coastlinePhase: 1.7,
    name: 'windward-north-cay',
    radius: [0.92, 0.58],
    reliefMeters: 0.32,
    ridgeShift: [0.16, -0.08],
    rotationRadians: 0.08,
  },
  {
    centre: [-33, 10],
    coastlinePhase: 3.2,
    name: 'outer-ridge-island',
    radius: [1.58, 1],
    reliefMeters: 0.48,
    ridgeShift: [-0.26, -0.15],
    rotationRadians: -0.42,
  },
  {
    centre: [-19, 22],
    coastlinePhase: 4.6,
    name: 'sheltered-islet',
    radius: [1.2, 0.74],
    reliefMeters: 0.38,
    ridgeShift: [0.15, 0.1],
    rotationRadians: 0.62,
  },
  {
    centre: [-22, -30],
    coastlinePhase: 5.8,
    name: 'southern-island',
    radius: [1.36, 0.82],
    reliefMeters: 0.42,
    ridgeShift: [0.22, -0.12],
    rotationRadians: -0.54,
  },
  {
    centre: [-25, 16],
    coastlinePhase: 2.4,
    name: 'inner-chain-islet',
    radius: [0.7, 0.46],
    reliefMeters: 0.28,
    ridgeShift: [-0.1, 0.07],
    rotationRadians: -0.2,
  },
] as const

function portraitIslandSpec(
  source: AerialIslandSpec,
  centre: readonly [number, number],
): AerialIslandSpec {
  return {
    ...source,
    centre,
    radius: [source.radius[0] * 0.72, source.radius[1] * 0.72],
  }
}

// Air encounters rotate their overview axis by 90 degrees when the subjects
// stack below the 1.2 aspect breakpoint. The landscape archipelago therefore
// leaves a phone's narrow horizontal frustum even though it remains in the
// world. This companion layout keeps the same six islands and atlas cells,
// but places their centres inside the portrait sea footprint and staggers
// them from the upper to lower background. Smaller radii preserve the same
// remote apparent scale under the much narrower portrait horizontal FOV.
const AERIAL_ARCHIPELAGO_PORTRAIT: readonly AerialIslandSpec[] = [
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[0]!, [-8, -30]),
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[1]!, [4, -24]),
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[2]!, [-2, -16]),
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[3]!, [8, -8]),
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[4]!, [-6, 0]),
  portraitIslandSpec(AERIAL_ARCHIPELAGO_LANDSCAPE[5]!, [2, 8]),
] as const

const AERIAL_ISLAND_LANDSCAPE_MINIMUM_ASPECT = 1.2

function aerialIslandColour(
  normalisedRadius: number,
  worldX: number,
  worldZ: number,
  phase: number,
): Color {
  const base =
    normalisedRadius > 0.88
      ? '#596d5d'
      : normalisedRadius > 0.66
        ? '#496a52'
        : normalisedRadius > 0.34
          ? '#355943'
          : '#284735'
  const distance = Math.hypot(worldX, worldZ)
  const atmosphericFade = smoothstep(34, 92, distance) * 0.34
  const variation =
    0.94 +
    0.055 * Math.sin(worldX * 0.71 + phase * 2.3) +
    0.035 * Math.sin(worldZ * 1.13 - phase * 1.7)
  return new Color(base)
    .multiplyScalar(variation)
    .lerp(new Color('#708f91'), atmosphericFade)
}

function aerialIslandCoastlineScale(
  island: AerialIslandSpec,
  phase: number,
  normalisedRadius: number,
): number {
  const detailStrength = 0.22 + Math.pow(normalisedRadius, 1.7) * 0.78
  const coastline =
    0.052 * Math.cos(phase + island.coastlinePhase) +
    0.095 * Math.sin(phase * 3 + island.coastlinePhase) +
    0.052 * Math.sin(phase * 5 - island.coastlinePhase * 1.4) +
    0.026 * Math.sin(phase * 9 + island.coastlinePhase * 2.1)
  return 1 + coastline * detailStrength
}

function aerialIslandTerrainNoise(
  worldX: number,
  worldZ: number,
  phase: number,
): number {
  return (
    Math.sin(worldX * 0.63 + phase * 1.9) * 0.52 +
    Math.sin(worldZ * 0.91 - phase * 1.3) * 0.3 +
    Math.sin((worldX + worldZ) * 1.37 + phase) * 0.18
  )
}

function aerialIslandClearanceMeters(
  island: AerialIslandSpec,
  normalisedRadius: number,
  worldX: number,
  worldZ: number,
  phase: number,
): number {
  const stableRise =
    (SKY_MAXIMUM_WAVE_DISPLACEMENT_METERS + 0.22) *
    (1 - smoothstep(0.88, 0.995, normalisedRadius))
  const relief =
    island.reliefMeters * Math.pow(1 - normalisedRadius, 1.35)
  const surfaceVariation =
    aerialIslandTerrainNoise(worldX, worldZ, phase) *
    0.045 *
    (1 - normalisedRadius)
  return -0.16 + stableRise + relief + surfaceVariation
}

const aerialIslandVertexShader = /* glsl */ `
  attribute float aTerrainRadius;
  attribute vec3 color;
  varying float vTerrainRadius;
  varying vec3 vTerrainColour;
  varying vec3 vTerrainNormal;
  varying vec2 vTerrainUv;
  varying vec3 vTerrainWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vTerrainRadius = aTerrainRadius;
    vTerrainColour = color;
    vTerrainNormal = normalize(mat3(modelMatrix) * normal);
    vTerrainUv = uv;
    vTerrainWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const aerialIslandFragmentShader = /* glsl */ `
  uniform vec3 uSunDirection;
  uniform sampler2D uIslandAtlas;
  varying float vTerrainRadius;
  varying vec3 vTerrainColour;
  varying vec3 vTerrainNormal;
  varying vec2 vTerrainUv;
  varying vec3 vTerrainWorldPosition;

  float terrainHash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float terrainNoise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(terrainHash(cell), terrainHash(cell + vec2(1.0, 0.0)), local.x),
      mix(
        terrainHash(cell + vec2(0.0, 1.0)),
        terrainHash(cell + vec2(1.0, 1.0)),
        local.x
      ),
      local.y
    );
  }

  float terrainFbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.56;
    for (int octave = 0; octave < 4; octave += 1) {
      value += terrainNoise(point) * amplitude;
      point = mat2(0.80, 0.60, -0.60, 0.80) * point * 2.03 + 7.1;
      amplitude *= 0.48;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vTerrainNormal);
    float slope = 1.0 - clamp(normal.y, 0.0, 1.0);
    float broadCover = terrainFbm(vTerrainWorldPosition.xz * 0.13);
    float groundDetail = terrainFbm(
      vTerrainWorldPosition.xz * 0.47 + vec2(19.0, -11.0)
    );
    vec2 atlasTexel = vec2(1.0 / 1152.0, 1.0 / 768.0) * 1.35;
    vec4 islandSample = texture2D(uIslandAtlas, vTerrainUv, 0.9) * 0.44;
    islandSample += texture2D(
      uIslandAtlas,
      vTerrainUv + vec2(atlasTexel.x, 0.0),
      0.9
    ) * 0.14;
    islandSample += texture2D(
      uIslandAtlas,
      vTerrainUv - vec2(atlasTexel.x, 0.0),
      0.9
    ) * 0.14;
    islandSample += texture2D(
      uIslandAtlas,
      vTerrainUv + vec2(0.0, atlasTexel.y),
      0.9
    ) * 0.14;
    islandSample += texture2D(
      uIslandAtlas,
      vTerrainUv - vec2(0.0, atlasTexel.y),
      0.9
    ) * 0.14;
    if (islandSample.a < 0.14) discard;
    vec3 photographedSurface = islandSample.rgb;
    photographedSurface *= mix(0.92, 1.05, broadCover);
    vec3 colour = mix(photographedSurface, vTerrainColour, 0.14);
    colour *= mix(0.92, 1.06, groundDetail);
    float exposedRock =
      smoothstep(0.12, 0.46, slope) * (0.32 + groundDetail * 0.68);
    colour = mix(colour, vec3(0.29, 0.37, 0.32), exposedRock * 0.24);
    float denserCover =
      smoothstep(0.62, 0.82, broadCover) *
      (1.0 - smoothstep(0.2, 0.48, slope));
    colour = mix(colour, vec3(0.07, 0.19, 0.11), denserCover * 0.18);
    float weatheredShore = smoothstep(0.84, 0.98, vTerrainRadius);
    colour = mix(colour, vec3(0.24, 0.30, 0.25), weatheredShore * 0.22);
    float sunlight = max(dot(normal, normalize(uSunDirection)), 0.0);
    colour *= 0.76 + sunlight * 0.24;
    float distanceHaze = smoothstep(
      60.0,
      120.0,
      length(cameraPosition - vTerrainWorldPosition)
    );
    colour = mix(colour, vec3(0.34, 0.51, 0.53), distanceHaze * 0.28);
    gl_FragColor = vec4(colour, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`

function createAerialIslandAtlasTexture(): Texture {
  const texture = new TextureLoader().load(AERIAL_ISLAND_ATLAS_TEXTURE_URL)
  texture.name = 'aerial-island-cutout-atlas-photoreal-v1'
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 1
  return texture
}

function aerialIslandAtlasUv(
  islandIndex: number,
  localU: number,
  localV: number,
): readonly [number, number] {
  const column = islandIndex % 3
  const rowFromTop = Math.floor(islandIndex / 3)
  return [
    (column + localU) / 3,
    1 - (rowFromTop + localV) / 2,
  ]
}

function createAerialArchipelagoGeometry(
  islands: readonly AerialIslandSpec[],
): {
  readonly geometry: BufferGeometry
  readonly minimumStableCoreClearanceMeters: number
} {
  const colours: number[] = []
  const indices: number[] = []
  const positions: number[] = []
  const terrainRadii: number[] = []
  const textureUvs: number[] = []
  let minimumStableCoreClearanceMeters = Number.POSITIVE_INFINITY

  const pushVertex = (
    worldX: number,
    clearanceMeters: number,
    worldZ: number,
    colour: Color,
    normalisedRadius: number,
    textureUv: readonly [number, number],
    stableCore: boolean,
  ): number => {
    const index = positions.length / 3
    positions.push(
      worldX,
      SKY_REFERENCE_Y_METERS + clearanceMeters,
      worldZ,
    )
    colours.push(colour.r, colour.g, colour.b)
    terrainRadii.push(normalisedRadius)
    textureUvs.push(textureUv[0], textureUv[1])
    if (stableCore) {
      minimumStableCoreClearanceMeters = Math.min(
        minimumStableCoreClearanceMeters,
        clearanceMeters,
      )
    }
    return index
  }

  for (const [islandIndex, island] of islands.entries()) {
    const centreX = island.centre[0] + island.ridgeShift[0]
    const centreZ = island.centre[1] + island.ridgeShift[1]
    const centreClearance = aerialIslandClearanceMeters(
      island,
      0,
      centreX,
      centreZ,
      island.coastlinePhase,
    )
    const centreVertex = pushVertex(
      centreX,
      centreClearance,
      centreZ,
      aerialIslandColour(0, centreX, centreZ, island.coastlinePhase),
      0,
      aerialIslandAtlasUv(islandIndex, 0.5, 0.5),
      true,
    )
    const rings: number[][] = []
    for (let ringIndex = 1; ringIndex <= AERIAL_ISLAND_RADIAL_RINGS; ringIndex += 1) {
      const normalisedRadius = ringIndex / AERIAL_ISLAND_RADIAL_RINGS
      const ringVertices: number[] = []
      for (let segment = 0; segment < AERIAL_ISLAND_SEGMENTS; segment += 1) {
        const phase = (segment / AERIAL_ISLAND_SEGMENTS) * Math.PI * 2
        const shapedRadius =
          normalisedRadius *
          aerialIslandCoastlineScale(island, phase, normalisedRadius)
        const atlasLocalU = 0.5 + Math.cos(phase) * shapedRadius * 0.42
        const atlasLocalV = 0.5 + Math.sin(phase) * shapedRadius * 0.42
        const localX = Math.cos(phase) * island.radius[0] * shapedRadius
        const localZ = Math.sin(phase) * island.radius[1] * shapedRadius
        const rotatedX =
          localX * Math.cos(island.rotationRadians) -
          localZ * Math.sin(island.rotationRadians)
        const rotatedZ =
          localX * Math.sin(island.rotationRadians) +
          localZ * Math.cos(island.rotationRadians)
        const worldX =
          island.centre[0] +
          rotatedX +
          island.ridgeShift[0] * (1 - Math.pow(normalisedRadius, 1.3))
        const worldZ =
          island.centre[1] +
          rotatedZ +
          island.ridgeShift[1] * (1 - Math.pow(normalisedRadius, 1.3))
        const clearanceMeters = aerialIslandClearanceMeters(
          island,
          normalisedRadius,
          worldX,
          worldZ,
          phase + island.coastlinePhase,
        )
        ringVertices.push(
          pushVertex(
            worldX,
            clearanceMeters,
            worldZ,
            aerialIslandColour(
              normalisedRadius,
              worldX,
              worldZ,
              phase + island.coastlinePhase,
            ),
            normalisedRadius,
            aerialIslandAtlasUv(
              islandIndex,
              atlasLocalU,
              atlasLocalV,
            ),
            normalisedRadius <= 0.75,
          ),
        )
      }
      rings.push(ringVertices)
    }

    for (let segment = 0; segment < AERIAL_ISLAND_SEGMENTS; segment += 1) {
      const next = (segment + 1) % AERIAL_ISLAND_SEGMENTS
      // Clockwise winding in the XZ plane produces upward-facing terrain.
      indices.push(centreVertex, rings[0]![next]!, rings[0]![segment]!)
      for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
        const innerRing = rings[ringIndex]!
        const outerRing = rings[ringIndex + 1]!
        indices.push(
          innerRing[segment]!,
          innerRing[next]!,
          outerRing[segment]!,
          innerRing[next]!,
          outerRing[next]!,
          outerRing[segment]!,
        )
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  )
  geometry.setAttribute(
    'color',
    new BufferAttribute(new Float32Array(colours), 3),
  )
  geometry.setAttribute(
    'aTerrainRadius',
    new BufferAttribute(new Float32Array(terrainRadii), 1),
  )
  geometry.setAttribute(
    'uv',
    new BufferAttribute(new Float32Array(textureUvs), 2),
  )
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return { geometry, minimumStableCoreClearanceMeters }
}

function createDistantIslandLayer(initialAspect: number): {
  readonly group: Group
  readonly setResponsiveLayout: (aspect: number) => void
  readonly surfaceTexture: Texture
} {
  const group = new Group()
  group.name = 'distant-haze-islands'
  const surfaceTexture = createAerialIslandAtlasTexture()
  const material = new ShaderMaterial({
    depthTest: true,
    depthWrite: true,
    dithering: true,
    fragmentShader: aerialIslandFragmentShader,
    side: FrontSide,
    toneMapped: true,
    uniforms: {
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uIslandAtlas: { value: surfaceTexture },
    },
    vertexShader: aerialIslandVertexShader,
  })
  const createArchipelago = (
    islands: readonly AerialIslandSpec[],
    layout: 'landscape' | 'portrait',
  ): Mesh<BufferGeometry, ShaderMaterial> => {
    const archipelagoGeometry = createAerialArchipelagoGeometry(islands)
    const archipelago = new Mesh(archipelagoGeometry.geometry, material)
    archipelago.name =
      layout === 'landscape'
        ? 'aerial-archipelago-terrain'
        : 'aerial-archipelago-terrain-portrait'
    archipelago.castShadow = false
    archipelago.receiveShadow = false
    archipelago.frustumCulled = false
    archipelago.renderOrder = 7
    archipelago.userData.aerialIslandCount = islands.length
    archipelago.userData.islandCentres = islands.map((island) => [
      ...island.centre,
    ])
    archipelago.userData.islandNames = islands.map((island) => island.name)
    archipelago.userData.maximumSeaWaveDisplacementMeters =
      SKY_MAXIMUM_WAVE_DISPLACEMENT_METERS
    archipelago.userData.minimumStableCoreClearanceMeters =
      archipelagoGeometry.minimumStableCoreClearanceMeters
    archipelago.userData.nearestIslandCentreDistanceMeters = Math.min(
      ...islands.map((island) => Math.hypot(...island.centre)),
    )
    archipelago.userData.furthestIslandCentreDistanceMeters = Math.max(
      ...islands.map((island) => Math.hypot(...island.centre)),
    )
    archipelago.userData.atlasAnisotropy = 1
    archipelago.userData.atlasBlurTapCount = 5
    archipelago.userData.atlasSampleMipBias = 0.9
    archipelago.userData.distribution =
      layout === 'landscape'
        ? 'staggered-landscape-depth-bands'
        : 'portrait-sea-footprint-depth-bands'
    archipelago.userData.presentation =
      'distant-phototextured-topographic-archipelago'
    archipelago.userData.responsiveLayout = layout
    archipelago.userData.shoreline =
      'photoreal-rock-and-cove-cutout-over-submerged-coast'
    archipelago.userData.surface =
      'six-distinct-softened-photoreal-aerial-islands-and-distance-haze'
    archipelago.userData.topology =
      'atlas-cutout-over-dense-radial-world-space-topography'
    return archipelago
  }
  const landscapeArchipelago = createArchipelago(
    AERIAL_ARCHIPELAGO_LANDSCAPE,
    'landscape',
  )
  const portraitArchipelago = createArchipelago(
    AERIAL_ARCHIPELAGO_PORTRAIT,
    'portrait',
  )
  const setResponsiveLayout = (aspect: number) => {
    const useLandscape = aspect >= AERIAL_ISLAND_LANDSCAPE_MINIMUM_ASPECT
    landscapeArchipelago.visible = useLandscape
    portraitArchipelago.visible = !useLandscape
    group.userData.activeResponsiveLayout = useLandscape
      ? 'landscape'
      : 'portrait'
  }
  group.add(landscapeArchipelago, portraitArchipelago)
  setResponsiveLayout(initialAspect)
  return { group, setResponsiveLayout, surfaceTexture }
}

function createFlightLayer(
  radianceTexture: DataTexture,
  initialAspect: number,
): {
  readonly group: Group
  readonly islandSurfaceTexture: Texture
  readonly seaMaterial: ShaderMaterial
  readonly setResponsiveIslandLayout: (aspect: number) => void
} {
  const group = new Group()
  group.name = 'sky-flight-volume-and-sea'
  const seaMaterial = new ShaderMaterial({
    depthTest: true,
    depthWrite: true,
    fragmentShader: seaFragmentShader,
    side: DoubleSide,
    toneMapped: true,
    uniforms: {
      uCameraPosition: { value: new Vector3() },
      uSkyRadiance: { value: radianceTexture },
      uSunDirection: { value: SUN_DIRECTION.clone() },
      uTime: { value: 0 },
      uUseSkyRadiance: { value: 0 },
    },
    vertexShader: seaVertexShader,
  })
  const sea = new Mesh(new PlaneGeometry(520, 520, 96, 96), seaMaterial)
  sea.name = 'world-space-open-sea'
  sea.position.y = SKY_REFERENCE_Y_METERS
  sea.rotation.x = -Math.PI / 2
  sea.receiveShadow = false
  const islands = createDistantIslandLayer(initialAspect)
  group.add(sea, islands.group)
  return {
    group,
    islandSurfaceTexture: islands.surfaceTexture,
    seaMaterial,
    setResponsiveIslandLayout: islands.setResponsiveLayout,
  }
}

function cloudGeometry(spec: CloudClusterSpec): BufferGeometry {
  const geometry = new SphereGeometry(1, 48, 28)
  const position = geometry.getAttribute('position') as BufferAttribute
  const direction = new Vector3()
  const shapePhase = spec.id.length * 0.37
  for (let index = 0; index < position.count; index += 1) {
    direction
      .set(position.getX(index), position.getY(index), position.getZ(index))
      .normalize()
    let radialDistance = 0
    for (const lobe of spec.lobes) {
      const offset = new Vector3(...lobe.offset)
      const scale = new Vector3(...lobe.scale)
      const scaledDirection = direction.clone().divide(scale)
      const scaledOffset = offset.clone().divide(scale)
      const a = scaledDirection.lengthSq()
      const b = -2 * scaledDirection.dot(scaledOffset)
      const c = scaledOffset.lengthSq() - 1
      const discriminant = b * b - 4 * a * c
      if (discriminant < 0) continue
      const distance = (-b + Math.sqrt(discriminant)) / (2 * a)
      radialDistance = Math.max(radialDistance, distance)
    }
    const azimuth = Math.atan2(direction.z, direction.x)
    const equator = 1 - Math.abs(direction.y)
    const horizontalRipple =
      1 +
      equator *
        (0.045 * Math.sin(azimuth * 3 + shapePhase) +
          0.022 * Math.sin(azimuth * 7 - shapePhase * 0.7))
    const verticalRipple =
      1 + 0.035 * Math.sin(azimuth * 4 + direction.y * 2.5 + shapePhase)
    const ripple = horizontalRipple * verticalRipple
    position.setXYZ(
      index,
      direction.x * radialDistance * ripple,
      direction.y * radialDistance * ripple,
      direction.z * radialDistance * ripple,
    )
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function createCloudEntry(spec: CloudClusterSpec): CloudEntry {
  const material = new ShaderMaterial({
    depthTest: true,
    depthWrite: false,
    fragmentShader: cloudFragmentShader,
    premultipliedAlpha: true,
    side: FrontSide,
    toneMapped: true,
    transparent: true,
    uniforms: {
      uCloudColour: { value: new Color(spec.tint) },
      uOpacity: { value: spec.opacity },
      uOverdrawDiagnostic: { value: 0 },
      uSunDirection: { value: SUN_DIRECTION.clone() },
    },
    vertexShader: cloudVertexShader,
  })
  const object = new Mesh(cloudGeometry(spec), material)
  object.name = spec.id
  object.position.set(...spec.position)
  object.rotation.y = (spec.yawDegrees * Math.PI) / 180
  object.scale.setScalar(CLOUD_LAYER_SCALE[spec.layer])
  object.renderOrder =
    spec.layer === 'far-cloud' ? 20 : spec.layer === 'mid-cloud' ? 30 : 40
  object.castShadow = false
  object.receiveShadow = false
  return { id: spec.id, layer: spec.layer, material, object }
}

function createCloudLayers(): {
  readonly entries: readonly CloudEntry[]
  readonly far: Group
  readonly mid: Group
  readonly near: Group
} {
  const near = new Group()
  const mid = new Group()
  const far = new Group()
  near.name = 'sky-near-air'
  mid.name = 'sky-mid-cloud'
  far.name = 'sky-far-cloud'
  const groups: Record<CloudLayer, Group> = {
    'near-air': near,
    'mid-cloud': mid,
    'far-cloud': far,
  }
  const entries = CLOUD_CLUSTERS.map((spec) => createCloudEntry(spec))
  entries.forEach((entry) => groups[entry.layer].add(entry.object))

  const horizonHaze = new Mesh(
    new CylinderGeometry(205, 205, 58, 192, 1, true),
    new ShaderMaterial({
      depthWrite: false,
      fragmentShader: horizonHazeFragmentShader,
      side: BackSide,
      toneMapped: true,
      transparent: true,
      uniforms: {
        uHazeColour: { value: new Color('#bed6df') },
      },
      vertexShader: horizonHazeVertexShader,
    }),
  )
  horizonHaze.name = 'necessary-horizon-atmosphere-depth'
  horizonHaze.position.y = SKY_REFERENCE_Y_METERS + 29
  horizonHaze.renderOrder = 80
  far.add(horizonHaze)
  return { entries, far, mid, near }
}

function createBandHelper(
  minimumAltitudeMeters: number,
  maximumAltitudeMeters: number,
  colour: string,
): Group {
  const group = new Group()
  const minimumY = SKY_REFERENCE_Y_METERS + minimumAltitudeMeters
  const maximumY = SKY_REFERENCE_Y_METERS + maximumAltitudeMeters
  const bounds = new Box3(
    new Vector3(-118, minimumY, -118),
    new Vector3(118, maximumY, 118),
  )
  const helper = new Box3Helper(bounds, colour)
  const helperMaterial = helper.material as LineBasicMaterial
  helperMaterial.transparent = true
  helperMaterial.opacity = 0.5
  group.add(helper)
  return group
}

function createFlightVolumeDebug(): Group {
  const group = new Group()
  group.name = 'sky-review-flight-volume-debug'
  const colours = {
    'subject-flight': '#ffbf4a',
    'near-air': '#ff7a59',
    'mid-cloud': '#7dd3fc',
    'far-cloud': '#60a5fa',
  } as const
  for (const band of SKY_HEIGHT_BANDS) {
    const helper = createBandHelper(
      band.minimumAltitudeMeters,
      band.maximumAltitudeMeters,
      colours[band.id],
    )
    helper.name = `height-band-${band.id}`
    group.add(helper)
  }
  group.visible = false
  return group
}

interface RenderableResources {
  readonly geometry: BufferGeometry
  readonly material: Material | Material[]
}

function renderableResources(object: Object3D): RenderableResources | null {
  if (!(object instanceof Mesh) && !(object instanceof LineSegments)) {
    return null
  }
  return object
}

function materialList(root: Group, visibleOnly: boolean): Material[] {
  const materials: Material[] = []
  root.traverseVisible((object) => {
    if (visibleOnly && !object.visible) return
    const resources = renderableResources(object)
    if (!resources) return
    if (Array.isArray(resources.material)) {
      materials.push(...resources.material)
    } else {
      materials.push(resources.material)
    }
  })
  return [...new Set(materials)]
}

function geometryList(root: Group): BufferGeometry[] {
  const geometries: BufferGeometry[] = []
  root.traverseVisible((object) => {
    const resources = renderableResources(object)
    if (resources) geometries.push(resources.geometry)
  })
  return geometries
}

function isTransparentMaterial(material: Material): boolean {
  return material.transparent === true && material.opacity > 0
}

function disposeMaterial(material: Material): void {
  material.dispose()
}

function disposeGroup(root: Group): void {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  root.traverse((object) => {
    const resources = renderableResources(object)
    if (resources) {
      geometries.add(resources.geometry)
      if (Array.isArray(resources.material)) {
        resources.material.forEach((material) => materials.add(material))
      } else {
        materials.add(resources.material)
      }
    }
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach(disposeMaterial)
  root.clear()
}

export function createSkyEnvironmentCandidate(
  input: SkyEnvironmentCandidateInput,
): SkyEnvironmentCandidate {
  const root = new Group()
  root.name = 'scale-encounter-sky-review-candidate'
  const radianceTexture = createSkyRadianceLut()
  const background = createBackgroundLayer(radianceTexture)
  const flight = createFlightLayer(radianceTexture, input.cameraState.aspect)
  const clouds = createCloudLayers()
  const debug = createFlightVolumeDebug()
  const layerGroups: Readonly<Record<Exclude<SkyLayerId, 'subject'>, Group>> = {
    'background-atmosphere': background.group,
    'flight-volume': flight.group,
    'near-air': clouds.near,
    'mid-cloud': clouds.mid,
    'far-cloud': clouds.far,
  }
  root.add(
    background.group,
    flight.group,
    clouds.near,
    clouds.mid,
    clouds.far,
    debug,
  )

  let variant = input.variant
  let corridorBounds = input.corridorBounds.clone()
  let cameraSweepBounds = input.cameraSweepBounds.clone()
  let diagnosticMode: SkyDiagnosticMode = {}

  const applyLayerVisibility = () => {
    const variantLayers = new Set(skyLayersForVariant(variant))
    const isolation = diagnosticMode.isolateLayers
      ? new Set(diagnosticMode.isolateLayers)
      : null
    for (const [layer, group] of Object.entries(layerGroups) as Array<
      [Exclude<SkyLayerId, 'subject'>, Group]
    >) {
      group.visible =
        variantLayers.has(layer) && (isolation === null || isolation.has(layer))
    }
    debug.visible = diagnosticMode.showFlightVolumes === true
    background.material.uniforms.uDarkDiagnostic!.value =
      diagnosticMode.backgroundTone === 'dark' ? 1 : 0
    for (const cloud of clouds.entries) {
      cloud.material.uniforms.uOverdrawDiagnostic!.value =
        diagnosticMode.showOverdraw === true ? 1 : 0
    }
    const coherentRadiance = variant === 'D'
    background.material.uniforms.uUseSkyRadiance!.value =
      coherentRadiance ? 1 : 0
    flight.seaMaterial.uniforms.uUseSkyRadiance!.value =
      coherentRadiance ? 1 : 0
    // PMREM supplies the broad sky fill in D, so the three direct lights can
    // become accents instead of a separate studio-lighting rig.
    background.hemisphere.intensity = coherentRadiance ? 1.02 : 1.68
    background.sun.intensity = coherentRadiance ? 1.96 : 2.12
    background.flightFill.intensity = coherentRadiance ? 1.08 : 1.85
  }

  applyLayerVisibility()

  return {
    radianceTexture,
    root,
    dispose: () => {
      root.removeFromParent()
      disposeGroup(root)
      flight.islandSurfaceTexture.dispose()
      radianceTexture.dispose()
    },
    getDiagnostics: (
      camera,
      cameraState,
      subjectBounds,
      avatarBounds,
    ) => {
      root.updateMatrixWorld(true)
      const activeClouds = clouds.entries.filter(
        (entry) => entry.object.visible && entry.object.parent?.visible,
      )
      const avatarOcclusionEvaluated =
        cameraState.stage !== 'eye-entry' && cameraState.stage !== 'pov'
      const cloudDiagnostics = inspectSkyClouds(
        activeClouds,
        corridorBounds,
        subjectBounds,
        camera,
        cameraState.viewportWidth,
        cameraState.viewportHeight,
        avatarOcclusionEvaluated ? [avatarBounds] : [],
      )
      const projectedClouds = activeClouds.map((entry) =>
        projectWorldBounds(
          worldBoundsFor(entry.object),
          camera,
          cameraState.viewportWidth,
          cameraState.viewportHeight,
        ),
      )
      const materials = materialList(root, true)
      const transparentMaterials = materials.filter(isTransparentMaterial)
      const resourceEstimate = estimateGeometryResources(geometryList(root))
      return {
        alpha: {
          alphaMode:
            activeClouds.length > 0 ? 'premultiplied-blend' : 'opaque',
          alphaTextureCount: 0,
          cloudMaterialsPremultiplied: clouds.entries.every(
            (entry) => entry.material.premultipliedAlpha,
          ),
          cloudMaterialsUseMipmaps: false,
          cloudMaterialsDepthWriteDisabled: clouds.entries.every(
            (entry) => entry.material.depthWrite === false,
          ),
          edgeRgbPolicy:
            'Analytic cloud RGB is authored in-shader before alpha; no cutout texture or transparent-pixel matte exists.',
        },
        assetLease: input.assetLease,
        avatarOcclusionEvaluated,
        avatarBounds: serializeBox3(avatarBounds),
        camera: {
          aspect: cameraState.aspect,
          far: cameraState.far,
          fieldOfViewDegrees: cameraState.fieldOfViewDegrees,
          near: cameraState.near,
          position: serializeVector3(cameraState.position),
          stage: cameraState.stage,
          target: serializeVector3(cameraState.target),
        },
        cameraSweepBounds: serializeBox3(cameraSweepBounds),
        cloudCount: activeClouds.length,
        cloudDiagnostics,
        corridorBounds: serializeBox3(corridorBounds),
        corridorOverlapCount: cloudDiagnostics.filter(
          (diagnostic) => diagnostic.corridorOverlap,
        ).length,
        heightBands: SKY_HEIGHT_BANDS,
        layerStates: [
          { id: 'subject', visible: true },
          ...(
            Object.entries(layerGroups) as Array<
              [Exclude<SkyLayerId, 'subject'>, Group]
            >
          ).map(([id, group]) => ({ id, visible: group.visible })),
        ],
        referenceY: SKY_REFERENCE_Y_METERS,
        rendererCapabilities: input.rendererCapabilities,
        resources: {
          ...resourceEstimate,
          activeMaterialCount: materials.length,
          proceduralTextureBytes:
            variant === 'D' ? 512 * 256 * 4 * 2 : 0,
          transparentDrawEstimate: transparentMaterials.length,
        },
        sceneContractRevision: SKY_SCENE_CONTRACT_REVISION,
        subjectBounds: serializeBox3(subjectBounds),
        subjectOcclusionMaximumFraction: Math.max(
          0,
          ...cloudDiagnostics.map(
            (diagnostic) => diagnostic.subjectOcclusionFraction,
          ),
        ),
        transparentOverdraw: estimateTransparentOverdraw(
          projectedClouds,
          cameraState.viewportWidth,
          cameraState.viewportHeight,
        ),
        variant,
      }
    },
    setCorridorBounds: (nextCorridorBounds, nextCameraSweepBounds) => {
      corridorBounds = nextCorridorBounds.clone()
      cameraSweepBounds = nextCameraSweepBounds.clone()
    },
    setDiagnosticMode: (mode) => {
      diagnosticMode = { ...diagnosticMode, ...mode }
      applyLayerVisibility()
    },
    setVariant: (nextVariant) => {
      variant = nextVariant
      applyLayerVisibility()
    },
    update: (elapsedSeconds, reducedMotion, camera) => {
      background.sky.position.copy(camera.position)
      const responsiveAspect = (camera as PerspectiveCamera).aspect
      if (Number.isFinite(responsiveAspect)) {
        flight.setResponsiveIslandLayout(responsiveAspect)
      }
      const time = reducedMotion ? 0 : elapsedSeconds
      flight.seaMaterial.uniforms.uTime!.value = time
      const cameraPositionUniform = flight.seaMaterial.uniforms
        .uCameraPosition as { value: Vector3 }
      cameraPositionUniform.value.copy(camera.position)
    },
  }
}

export const SKY_CANDIDATE_ART_DIRECTION = {
  coast:
    'No foreground or enclosing coast. One active set of six compact, low-relief landforms sits roughly 65 metres below the subjects, with separate landscape and portrait sea-footprint arrangements following the corresponding overview camera axes; smaller portrait radii, dense coast geometry, six distinct photoreal top-down prehistoric island cutouts, restrained distance haze, and narrow submerged shore slopes make them read as remote aerial geography rather than nearby paper cutouts or floating rocks.',
  seaLevelY: SKY_REFERENCE_Y_METERS,
  sunDirection: SUN_DIRECTION.toArray(),
  sunDirectionStatus: 'owner-approved-2026-08-24',
} as const

export function inspectSkyCandidateAltitudeContract(
  candidate: SkyEnvironmentCandidate,
  camera: PerspectiveCamera,
  cameraState: SkyCameraState,
  subjectBounds: Readonly<Box3>,
  avatarBounds: Readonly<Box3>,
): {
  readonly avatar: ReturnType<typeof boundsAltitudeRange>
  readonly environment: SkyEnvironmentDiagnostics
  readonly subject: ReturnType<typeof boundsAltitudeRange>
} {
  return {
    avatar: boundsAltitudeRange(avatarBounds),
    environment: candidate.getDiagnostics(
      camera,
      cameraState,
      subjectBounds,
      avatarBounds,
    ),
    subject: boundsAltitudeRange(subjectBounds),
  }
}
