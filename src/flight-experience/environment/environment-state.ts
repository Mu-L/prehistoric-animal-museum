import { Color } from 'three'
export type SolarPreset = 'morning' | 'noon' | 'afternoon' | 'evening'
export type LinearRGB = readonly [number, number, number]
/** Colours are linear working RGB; intensities are artistic multipliers, positions/metres. */
export interface EnvironmentFrame {
  readonly presentationSeconds: number
  readonly dayProgress: number
  readonly sunDirectionWorld: readonly [number, number, number]
  readonly sunColor: LinearRGB
  readonly sunIntensity: number
  readonly skyZenith: LinearRGB
  readonly horizon: LinearRGB
  readonly groundFill: LinearRGB
  readonly fillIntensity: number
  readonly windWorld: readonly [number, number]
  readonly waveStrength: number
  readonly visibility: number
  readonly cloudCoverage: number
  readonly cloudBase: number
  readonly cloudThickness: number
  readonly rainRate: number
  readonly wetness: number
}
const rgb = (hex: string): LinearRGB => { const c = new Color(hex); return [c.r,c.g,c.b] }
const looks = {
  morning: { p: .08, sun: [-.88,.29,-.36], color: '#ffddb0', sky: '#649bbf', horizon: '#c6cbd0', intensity: 2.2 },
  noon: { p: .42, sun: [-.25,.94,-.23], color: '#fff6de', sky: '#609fc7', horizon: '#c4d6dd', intensity: 2.8 },
  afternoon: { p: .68, sun: [.63,.65,-.43], color: '#ffe4ba', sky: '#689cbd', horizon: '#cbd3d3', intensity: 2.6 },
  evening: { p: .94, sun: [.91,.18,-.37], color: '#ffc894', sky: '#718baf', horizon: '#dbc5b5', intensity: 1.8 },
} as const
export function sampleEnvironment(preset: SolarPreset = 'afternoon', presentationSeconds = 0): EnvironmentFrame {
  const l = looks[preset], length = Math.hypot(...l.sun)
  return Object.freeze({ presentationSeconds, dayProgress:l.p, sunDirectionWorld: l.sun.map(n=>n/length) as [number,number,number],
    sunColor:rgb(l.color),sunIntensity:l.intensity,skyZenith:rgb(l.sky),horizon:rgb(l.horizon),groundFill:rgb('#aaa58e'),fillIntensity:1.65,
    windWorld:[.91,.41] as const,waveStrength:1,visibility:10000,cloudCoverage:0,cloudBase:1400,cloudThickness:300,rainRate:0,wetness:0 })
}
export function sampleSky(frame: EnvironmentFrame, direction: readonly [number,number,number]): LinearRGB {
  const length=Math.hypot(...direction)||1, y=Math.max(0,direction[1]/length), t=Math.pow(y,.55)
  return frame.horizon.map((v,i)=>v+(frame.skyZenith[i]!-v)*t) as [number,number,number]
}
