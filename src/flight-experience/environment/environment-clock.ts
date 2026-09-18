/** E1a owns environment time only. FlightSimulation and its mixer retain their clock. */
export type EnvironmentActivity = 'flying' | 'viewpoint' | 'paused' | 'viewpoint-preparing' | 'return-preparing' | 'hidden' | 'context-lost' | 'closed'
export interface ClockPolicy {
  readonly advanceMovement: boolean
  readonly advanceEnvironmentMotion: boolean
  readonly advanceAutomaticSun: false
  readonly allowExplicitSolarPreview: boolean
  readonly allowBudgetedPreparation: boolean
}
export function clockPolicy(activity: EnvironmentActivity, sceneryPaused = false, scrubbing = false): ClockPolicy {
  const active = activity === 'flying' || activity === 'viewpoint'
  const suspended = activity === 'hidden' || activity === 'context-lost' || activity === 'closed'
  return {
    advanceMovement: activity === 'flying' && !scrubbing,
    advanceEnvironmentMotion: active && !sceneryPaused,
    advanceAutomaticSun: false,
    allowExplicitSolarPreview: active || activity === 'paused',
    allowBudgetedPreparation: !suspended,
  }
}
/** Match the existing simulation's four fixed steps; never catch up after suspension. */
export const MAX_ENVIRONMENT_DELTA = 4 / 60
export function admittedEnvironmentDelta(delta: number): number {
  return Number.isFinite(delta) ? Math.min(MAX_ENVIRONMENT_DELTA, Math.max(0, delta)) : 0
}
export class EnvironmentClock {
  private motion = 0
  private solar = .68
  get motionSeconds() { return this.motion }
  get solarDayProgress() { return this.solar }
  get solarMode(): 'fixed' { return 'fixed' }
  tick(delta: number, policy: ClockPolicy) {
    if (policy.advanceEnvironmentMotion) this.motion += admittedEnvironmentDelta(delta)
  }
  /** Invalid input keeps the last selection. Valid values clamp to daylight endpoints. */
  setSolarDayProgress(value: number) {
    if (Number.isFinite(value)) this.solar = Math.max(0, Math.min(1, value))
  }
  /** Explicit DEV capture restoration, never called by a solar control. */
  restoreCaptureMotion(value: number) {
    if (Number.isFinite(value) && value >= 0) this.motion = value
  }
}
