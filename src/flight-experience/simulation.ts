import { clamp, safeSurface, type Position } from './world'
export interface FlightInput { turn: number; climb: number }
export const ZERO_INPUT: FlightInput = Object.freeze({ turn: 0, climb: 0 })
export const FLIGHT_STEP = 1 / 60
export class FlightSimulation {
  readonly position: Position = { x: -160, y: 125, z: 350 }
  heading = .22
  turnRate = 0
  climbRate = 0
  speed = 18
  time = 0
  droppedSeconds = 0
  gentle = false
  assisted = false
  safetyStop = false
  private accumulator = 0
  constructor(private readonly surface: (x: number, z: number) => number = safeSurface) {}
  clearAccumulator() { this.accumulator = 0 }
  advance(delta: number, input: FlightInput): number {
    const accepted = clamp(Number.isFinite(delta) ? delta : 0, 0, FLIGHT_STEP * 4)
    this.droppedSeconds += Math.max(0, delta - accepted)
    this.accumulator += accepted
    let steps = 0
    while (this.accumulator + 1e-10 >= FLIGHT_STEP && steps < 4 && !this.safetyStop) {
      this.step(input)
      this.accumulator -= FLIGHT_STEP
      steps++
    }
    return steps * FLIGHT_STEP
  }
  private step(input: FlightInput) {
    const dt = FLIGHT_STEP
    const manual = Math.abs(input.turn) + Math.abs(input.climb) > .08
    if (manual) this.assisted = false
    let turn = clamp(input.turn, -1, 1), climb = clamp(input.climb, -1, 1)
    const clearance = this.gentle ? 60 : 40
    const normalSpeed = this.gentle ? 10 : 18
    const maxClimb = this.gentle ? 3 : 6
    if (this.assisted) {
      const ahead = this.heading
      const left = this.surface(this.position.x + Math.sin(ahead - .4) * 160, this.position.z - Math.cos(ahead - .4) * 160)
      const right = this.surface(this.position.x + Math.sin(ahead + .4) * 160, this.position.z - Math.cos(ahead + .4) * 160)
      turn = clamp((left - right) / 90, -.6, .6)
      climb = clamp((this.surface(this.position.x, this.position.z) + 115 - this.position.y) / 45, -.5, .8)
    }
    let targetSpeed = normalSpeed
    let requiredClimb = climb * (climb >= 0 ? maxClimb : this.gentle ? 2 : 4)
    const forwardX = Math.sin(this.heading), forwardZ = -Math.cos(this.heading)
    // Predict both wings and future camera corridor. Never teleport vertically.
    for (const seconds of [1, 2, 4, 6]) for (const lateral of [-12, 0, 12]) {
      const x = this.position.x + forwardX * this.speed * seconds + Math.cos(this.heading) * lateral
      const z = this.position.z + forwardZ * this.speed * seconds + Math.sin(this.heading) * lateral
      const necessary = (this.surface(x, z) + clearance - this.position.y) / seconds
      requiredClimb = Math.max(requiredClimb, necessary)
      if (necessary > maxClimb * .8) targetSpeed = normalSpeed * .4
    }
    if (requiredClimb > maxClimb) {
      const left = this.surface(this.position.x + Math.sin(this.heading - .6) * 50, this.position.z - Math.cos(this.heading - .6) * 50)
      const right = this.surface(this.position.x + Math.sin(this.heading + .6) * 50, this.position.z - Math.cos(this.heading + .6) * 50)
      turn = left < right ? -.7 : .7
    }
    const blend = 1 - Math.exp(-dt * 3)
    this.turnRate += (turn * (this.gentle ? .22 : .4) - this.turnRate) * blend
    this.climbRate += (clamp(requiredClimb, -4, maxClimb) - this.climbRate) * blend
    this.speed += (targetSpeed - this.speed) * blend
    const heading = this.heading + this.turnRate * dt
    const next = { x: this.position.x + Math.sin(heading) * this.speed * dt,
      y: clamp(this.position.y + this.climbRate * dt, 45, 1400), z: this.position.z - Math.cos(heading) * this.speed * dt }
    for (const lateral of [-12, 0, 12]) {
      if (next.y < this.surface(next.x + Math.cos(heading) * lateral, next.z + Math.sin(heading) * lateral) + 25) {
        this.safetyStop = true
        return
      }
    }
    Object.assign(this.position, next)
    this.heading = Math.atan2(Math.sin(heading), Math.cos(heading))
    this.time += dt
  }
}
