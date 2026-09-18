import { Color } from 'three'
export type SolarLayout = 'legacy' | 'sunset-bay'
export type SolarPreset = 'morning' | 'noon' | 'afternoon' | 'evening'
export type LinearRGB = readonly [number, number, number]
/** Colours are linear working RGB; intensities are artistic multipliers, positions/metres. */
export interface EnvironmentFrame {
  readonly revision: number
  readonly motionSeconds: number
  readonly solarDayProgress: number
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
const solarAngles = { morning: [2.55,20], noon: [1.05,78], afternoon: [-.2,38], evening: [-.59,8] } as const
const presets: readonly SolarPreset[] = ['morning','noon','afternoon','evening']
export function solarProgress(preset: SolarPreset) { return looks[preset].p }
export function sampleEnvironment(selection: SolarPreset | number = 'afternoon', presentationSeconds = 0, layout: SolarLayout = 'legacy', revision = 0): EnvironmentFrame {
  const progress = typeof selection === 'number' ? Math.max(.08,Math.min(.94,Number.isFinite(selection)?selection:.68)) : looks[selection].p
  const upper = presets.findIndex(p => looks[p].p >= progress)
  const a = presets[Math.max(0,upper-1)]!, b = presets[Math.max(0,upper)]!
  const first = looks[a], last = looks[b]
  const t = first.p === last.p ? 0 : (progress-first.p)/(last.p-first.p)
  const mix = (a:number,b:number) => a+(b-a)*t
  const color = (a:string,b:string):LinearRGB => {const x=rgb(a),y=rgb(b);return x.map((v,i)=>mix(v,y[i]!)) as [number,number,number]}
  // Unwrapped artistic azimuth, in one world coordinate system for every observer.
  const heading=mix(solarAngles[a][0],solarAngles[b][0]),elevation=mix(solarAngles[a][1],solarAngles[b][1])*Math.PI/180
  const sun = layout === 'legacy' ? first.sun.map((n,i)=>mix(n,last.sun[i]!)) : [Math.sin(heading)*Math.cos(elevation),Math.sin(elevation),-Math.cos(heading)*Math.cos(elevation)]
  const length=Math.hypot(...sun),motion=Number.isFinite(presentationSeconds)?Math.max(0,presentationSeconds):0
  return Object.freeze({ revision,motionSeconds:motion,solarDayProgress:progress,presentationSeconds:motion,dayProgress:progress,
    sunDirectionWorld:sun.map(n=>n/length) as [number,number,number],sunColor:color(first.color,last.color),sunIntensity:mix(first.intensity,last.intensity),
    skyZenith:color(first.sky,last.sky),horizon:color(first.horizon,last.horizon),groundFill:rgb('#aaa58e'),fillIntensity:1.65,
    windWorld:[.91,.41] as const,waveStrength:1,visibility:10000,cloudCoverage:0,cloudBase:1400,cloudThickness:300,rainRate:0,wetness:0 })
}

export function sampleSky(frame: EnvironmentFrame, direction: readonly [number,number,number]): LinearRGB {
  const length=Math.hypot(...direction)||1, y=Math.max(0,direction[1]/length), t=Math.pow(y,.55)
  return frame.horizon.map((v,i)=>v+(frame.skyZenith[i]!-v)*t) as [number,number,number]
}
