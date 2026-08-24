import {
  DataTexture,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  LinearFilter,
  MathUtils,
  Points,
  PointsMaterial,
  RGBAFormat,
  UnsignedByteType,
  type BufferGeometry,
  type PerspectiveCamera,
} from 'three'
import { BufferGeometry as ThreeBufferGeometry } from 'three'
import type { ScaleEncounterHabitat } from './scale-encounter'

const WATER_BUBBLE_COUNT = 42
const WATER_STREAM_COUNT = 14
const AIR_STREAM_COUNT = 20
const FLOW_NEAR_Z = -0.28
const FLOW_FAR_Z = -8.5

interface StreamField {
  readonly geometry: BufferGeometry
  readonly line: LineSegments
  readonly material: LineBasicMaterial
  readonly phase: Float32Array
  readonly speed: Float32Array
  readonly x: Float32Array
  readonly y: Float32Array
  readonly z: Float32Array
}

interface BubbleField {
  readonly geometry: BufferGeometry
  readonly material: PointsMaterial
  readonly points: Points
  readonly rise: Float32Array
  readonly speed: Float32Array
  readonly texture: DataTexture
  readonly x: Float32Array
  readonly y: Float32Array
  readonly z: Float32Array
}

export interface ScaleEncounterBoostFlowEffect {
  readonly habitat: 'air' | 'water'
  readonly root: Group
  dispose(): void
  setIntensity(intensity: number): void
  update(
    deltaSeconds: number,
    camera: PerspectiveCamera,
    reducedMotion: boolean,
  ): void
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

function randomRange(random: () => number, minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * random()
}

function createBubbleTexture(): DataTexture {
  const size = 32
  const pixels = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = (x + 0.5) / size * 2 - 1
      const ny = (y + 0.5) / size * 2 - 1
      const radius = Math.hypot(nx, ny)
      const ring = Math.exp(-Math.pow((radius - 0.72) / 0.105, 2))
      const highlight = Math.exp(
        -(
          Math.pow((nx + 0.34) / 0.18, 2) +
          Math.pow((ny - 0.31) / 0.18, 2)
        ),
      )
      const edgeFade = 1 - MathUtils.smoothstep(radius, 0.82, 1)
      const alpha = MathUtils.clamp(
        (ring * 0.82 + highlight * 0.74) * edgeFade,
        0,
        1,
      )
      const offset = (y * size + x) * 4
      pixels[offset] = 218
      pixels[offset + 1] = 246
      pixels[offset + 2] = 255
      pixels[offset + 3] = Math.round(alpha * 255)
    }
  }
  const texture = new DataTexture(
    pixels,
    size,
    size,
    RGBAFormat,
    UnsignedByteType,
  )
  texture.name = 'scale-encounter-water-bubble-texture'
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

function createBubbleField(random: () => number): BubbleField {
  const x = new Float32Array(WATER_BUBBLE_COUNT)
  const y = new Float32Array(WATER_BUBBLE_COUNT)
  const z = new Float32Array(WATER_BUBBLE_COUNT)
  const speed = new Float32Array(WATER_BUBBLE_COUNT)
  const rise = new Float32Array(WATER_BUBBLE_COUNT)
  const positions = new Float32Array(WATER_BUBBLE_COUNT * 3)
  for (let index = 0; index < WATER_BUBBLE_COUNT; index += 1) {
    x[index] = randomRange(random, -2.2, 2.2)
    y[index] = randomRange(random, -1.15, 1.25)
    z[index] = randomRange(random, FLOW_FAR_Z, -0.55)
    speed[index] = randomRange(random, 0.76, 1.28)
    rise[index] = randomRange(random, 0.035, 0.12)
    positions[index * 3] = x[index]!
    positions[index * 3 + 1] = y[index]!
    positions[index * 3 + 2] = z[index]!
  }

  const geometry = new ThreeBufferGeometry()
  geometry.name = 'scale-encounter-water-bubbles-geometry'
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const texture = createBubbleTexture()
  const material = new PointsMaterial({
    color: 0xdaf7ff,
    depthWrite: false,
    map: texture,
    opacity: 0,
    size: 0.085,
    sizeAttenuation: true,
    transparent: true,
  })
  material.name = 'scale-encounter-water-bubbles-material'
  material.toneMapped = false
  const points = new Points(geometry, material)
  points.name = 'scale-encounter-water-boost-bubbles'
  points.frustumCulled = false
  points.renderOrder = 18
  points.userData.scaleEncounterBoostParticleCount = WATER_BUBBLE_COUNT
  return { geometry, material, points, rise, speed, texture, x, y, z }
}

function createStreamField(
  habitat: 'air' | 'water',
  random: () => number,
): StreamField {
  const count = habitat === 'air' ? AIR_STREAM_COUNT : WATER_STREAM_COUNT
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  const speed = new Float32Array(count)
  const phase = new Float32Array(count)
  const positions = new Float32Array(count * 2 * 3)
  for (let index = 0; index < count; index += 1) {
    x[index] = randomRange(random, -2.65, 2.65)
    y[index] = randomRange(random, -1.5, 1.5)
    z[index] = randomRange(random, FLOW_FAR_Z, -0.6)
    speed[index] = randomRange(random, 0.78, 1.22)
    phase[index] = randomRange(random, 0, Math.PI * 2)
  }
  const geometry = new ThreeBufferGeometry()
  geometry.name = `scale-encounter-${habitat}-stream-geometry`
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const material = new LineBasicMaterial({
    color: habitat === 'water' ? 0xbcefff : 0xe8f5ff,
    depthWrite: false,
    opacity: 0,
    transparent: true,
  })
  material.name = `scale-encounter-${habitat}-stream-material`
  material.toneMapped = false
  const line = new LineSegments(geometry, material)
  line.name = `scale-encounter-${habitat}-boost-streams`
  line.frustumCulled = false
  line.renderOrder = 17
  line.userData.scaleEncounterBoostStreamCount = count
  return { geometry, line, material, phase, speed, x, y, z }
}

function updateStreamField(
  field: StreamField,
  habitat: 'air' | 'water',
  deltaSeconds: number,
  intensity: number,
  elapsedSeconds: number,
) {
  const positions = field.geometry.getAttribute('position')
  const count = field.z.length
  const baseTravel = habitat === 'air' ? 0.75 : 0.46
  const boostTravel = habitat === 'air' ? 10.4 : 7.1
  const streakLength = habitat === 'air' ? 0.34 + intensity * 1.05 : 0.2 + intensity * 0.62
  for (let index = 0; index < count; index += 1) {
    field.z[index] =
      field.z[index]! +
      deltaSeconds * (baseTravel + boostTravel * intensity) * field.speed[index]!
    if (field.z[index]! > FLOW_NEAR_Z) {
      field.z[index] = FLOW_FAR_Z - (index / count) * 1.4
    }
    const drift = Math.sin(elapsedSeconds * 0.7 + field.phase[index]!) * 0.025
    const offset = index * 6
    positions.array[offset] = field.x[index]! + drift
    positions.array[offset + 1] = field.y[index]!
    positions.array[offset + 2] = field.z[index]!
    positions.array[offset + 3] = field.x[index]! - drift
    positions.array[offset + 4] = field.y[index]! + (habitat === 'water' ? 0.025 : 0)
    positions.array[offset + 5] = field.z[index]! - streakLength * field.speed[index]!
  }
  positions.needsUpdate = true
}

function updateBubbleField(
  field: BubbleField,
  deltaSeconds: number,
  intensity: number,
) {
  const positions = field.geometry.getAttribute('position')
  for (let index = 0; index < field.z.length; index += 1) {
    field.z[index] =
      field.z[index]! +
      deltaSeconds * (0.34 + 6.2 * intensity) * field.speed[index]!
    field.y[index] = field.y[index]! + deltaSeconds * field.rise[index]!
    if (field.z[index]! > FLOW_NEAR_Z || field.y[index]! > 1.7) {
      field.z[index] = FLOW_FAR_Z - (index / field.z.length) * 1.6
      field.y[index] = -1.35 + (index % 9) * 0.31
    }
    const offset = index * 3
    positions.array[offset] = field.x[index]!
    positions.array[offset + 1] = field.y[index]!
    positions.array[offset + 2] = field.z[index]!
  }
  positions.needsUpdate = true
}

export function createScaleEncounterBoostFlowEffect(
  habitat: ScaleEncounterHabitat,
): ScaleEncounterBoostFlowEffect | null {
  if (habitat === 'land') return null

  const random = createSeededRandom(habitat === 'water' ? 0x5ea2026 : 0xa172026)
  const root = new Group()
  root.name = `scale-encounter-${habitat}-boost-flow`
  root.visible = false
  root.userData.scaleEncounterBoostFlow = habitat
  const streams = createStreamField(habitat, random)
  root.add(streams.line)
  const bubbles = habitat === 'water' ? createBubbleField(random) : null
  if (bubbles) root.add(bubbles.points)

  let disposed = false
  let elapsedSeconds = 0
  let intensity = 0

  const cameraPosition = root.position.clone()
  const cameraQuaternion = root.quaternion.clone()

  return {
    habitat,
    root,
    dispose: () => {
      if (disposed) return
      disposed = true
      root.removeFromParent()
      streams.geometry.dispose()
      streams.material.dispose()
      if (bubbles) {
        bubbles.geometry.dispose()
        bubbles.material.dispose()
        bubbles.texture.dispose()
      }
      root.clear()
    },
    setIntensity: (nextIntensity) => {
      intensity = MathUtils.clamp(
        Number.isFinite(nextIntensity) ? nextIntensity : 0,
        0,
        1,
      )
      root.userData.scaleEncounterBoostIntensity = intensity
    },
    update: (deltaSeconds, camera, reducedMotion) => {
      if (disposed) return
      const renderedIntensity = reducedMotion ? 0 : intensity
      root.visible = renderedIntensity > 0.012
      streams.material.opacity =
        renderedIntensity * (habitat === 'air' ? 0.19 : 0.13)
      if (bubbles) bubbles.material.opacity = renderedIntensity * 0.72
      if (!root.visible) return

      elapsedSeconds += Math.max(0, deltaSeconds)
      camera.getWorldPosition(cameraPosition)
      camera.getWorldQuaternion(cameraQuaternion)
      root.position.copy(cameraPosition)
      root.quaternion.copy(cameraQuaternion)
      updateStreamField(
        streams,
        habitat,
        Math.max(0, deltaSeconds),
        renderedIntensity,
        elapsedSeconds,
      )
      if (bubbles) {
        updateBubbleField(
          bubbles,
          Math.max(0, deltaSeconds),
          renderedIntensity,
        )
      }
    },
  }
}
