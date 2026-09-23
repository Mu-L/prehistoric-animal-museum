import { createWorldSampler, type WorldSampler } from './world'
export type FlightSpeed = 18 | 28 | 36
export type FlightHeight = 100 | 190 | 350
export type FlightView = 'near' | 'standard' | 'wide'
export type FlightStart = 'coast' | 'valley' | 'overview'
export interface FlightSettings { speed: FlightSpeed; height: FlightHeight; view: FlightView; start: FlightStart; quality: 'low' | 'balanced'; gentle: boolean; zoom?:number }
export const DEFAULT_FLIGHT_SETTINGS: FlightSettings = { speed: 28, height: 190, view: 'standard', start: 'coast', quality: 'low', gentle: false }
export function spawnState(settings: FlightSettings, world: WorldSampler = createWorldSampler()) {
  const { safeSurface, terrainAt, valleyAt } = world
  const z = settings.start === 'coast' ? 350 : settings.start === 'valley' ? -1400 : -2600
  const x = settings.start === 'coast' ? -160 : valleyAt(z) + (settings.start === 'overview' ? 150 : 0)
  // Face the evening sun from the coast while leaving the cliff in the right of frame.
  const heading = settings.start === 'coast' ? -.32 : -.12
  let y = Math.max(0, terrainAt(x, z).height) + settings.height
  // Preflight covers the dynamic wings, follow camera and six seconds of cruise.
  for (let d = -40; d <= settings.speed * 6; d += 12) for (const side of [-20, 0, 20]) {
    y = Math.max(y, safeSurface(x + Math.sin(heading) * d + Math.cos(heading) * side, z - Math.cos(heading) * d + Math.sin(heading) * side) + 50)
  }
  return { position: { x, y, z }, heading }
}
export function framingDistance(aspect: number, view: FlightView, wingspan = 7, height = 4, minimum = 10, zoom?:number): number {
  const fraction = aspect < .85 ? .5 : .34
  const multiplier = Math.max(.72,Math.min(1.7,zoom ?? (view === 'near' ? .86 : view === 'wide' ? 1.28 : 1)))
  const horizontalDistance = wingspan / (2 * Math.tan(55 * Math.PI / 360) * Math.max(.3, aspect) * fraction)
  // Bounding wing motion also needs vertical screen room, including phone landscape.
  const verticalDistance = height / (2 * Math.tan(55 * Math.PI / 360) * .46)
  return Math.max(minimum, horizontalDistance, verticalDistance) * multiplier
}
