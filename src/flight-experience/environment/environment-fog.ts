import { Color, ShaderChunk, Vector3, type Material } from 'three'
import { ENVIRONMENT_ATMOSPHERE_GLSL } from './atmosphere'
import type { EnvironmentFrame } from './environment-state'

/** Retains Three's exact fog density/distance, replacing only its endpoint colour.
 * Fog executes AFTER tone mapping and output conversion in Three 0.185.1, so the
 * radiance endpoint is passed through those same transforms before the blend.
 */
export const ENVIRONMENT_FOG_FRAGMENT = ShaderChunk.fog_fragment.replace(
  'gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
  `vec3 flightFogRadiance=fogRadiance(inverseTransformDirection(flightFogView,viewMatrix));
  #if defined(TONE_MAPPING)
    flightFogRadiance=toneMapping(flightFogRadiance);
  #endif
  vec3 flightFogOutput=linearToOutputTexel(vec4(flightFogRadiance,1.)).rgb;
  gl_FragColor.rgb=mix(gl_FragColor.rgb,flightFogOutput,fogFactor);`,
)
export function createEnvironmentFog(initialFrame:EnvironmentFrame){
  const uniforms={waterHighlight:{value:1},skyColors:{value:0},skyZenith:{value:new Color()},horizon:{value:new Color()},sunDirection:{value:new Vector3()},sunColor:{value:new Color()}}
  const decorated=new WeakSet<Material>()
  function update(frame:EnvironmentFrame){
    uniforms.skyZenith.value.setRGB(...frame.skyZenith);uniforms.horizon.value.setRGB(...frame.horizon)
    uniforms.sunDirection.value.set(...frame.sunDirectionWorld);uniforms.sunColor.value.setRGB(...frame.sunColor).multiplyScalar(frame.sunIntensity)
  }
  update(initialFrame)
  return {uniforms,update,
    /** Invoke after the material's own hook assignment; chains shadow/morph hooks. */
    decorate(material:Material){
      if(decorated.has(material))return
      decorated.add(material)
      const compile=material.onBeforeCompile.bind(material),cacheKey=material.customProgramCacheKey.bind(material)
      material.onBeforeCompile=function(shader,renderer){
        compile(shader,renderer)
        if(!shader.fragmentShader.includes('#include <fog_fragment>'))return
        Object.assign(shader.uniforms,uniforms)
        // mvPosition already includes skinning, morph, batching, instances and camera transform.
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 flightFogView;')
          .replace('#include <project_vertex>','#include <project_vertex>\nflightFogView=mvPosition.xyz;')
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 flightFogView;\n${ENVIRONMENT_ATMOSPHERE_GLSL}`)
          .replace('#include <fog_fragment>',ENVIRONMENT_FOG_FRAGMENT)
      }
      material.customProgramCacheKey=()=>`${cacheKey()}:flight-directional-fog-v1`
      material.needsUpdate=true
    },
  }
}
