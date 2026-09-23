/** Fixed wavelengths: weather changes amplitudes, never the active phase wavelength. */
export const OCEAN_WAVES = Object.freeze([
  { length:137, angle:-.44, amplitude:.56, speed:.57 }, { length:83,angle:.82,amplitude:.37,speed:.71 },
  { length:41,angle:.12,amplitude:.19,speed:.95 }, { length:23,angle:1.13,amplitude:.095,speed:1.17 },
  { length:9.7,angle:-.61,amplitude:.04,speed:1.61 }, { length:4.3,angle:.55,amplitude:.016,speed:2.14 },
])
export const wrapPhase = (value:number) => ((value % (Math.PI*2))+Math.PI*2)%(Math.PI*2)
export function waveComponents(wind:readonly [number,number],origin:{x:number;z:number},time:number) {
  const base=Math.atan2(wind[1],wind[0])
  return OCEAN_WAVES.map(w=>{const k=Math.PI*2/w.length, x=Math.cos(base+w.angle)*k,z=Math.sin(base+w.angle)*k
    return {x,z,amplitude:w.amplitude,phase:wrapPhase(origin.x*x+origin.z*z-time*w.speed)} })
}

/** Period is aligned with the periodic 64-cell / 128m envelope lattice in the shader. */
export function envelopeOrigin(origin:{x:number;z:number}):[number,number] {
  const bound=(n:number)=>((n%8192)+8192)%8192
  return [bound(origin.x),bound(origin.z)]
}
