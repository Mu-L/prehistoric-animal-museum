import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, type Material } from 'three'
/** Finite material trial only. Metre UVs, four independently rotated and offset neighbours,
 * slope/height/moisture blending; normal directions rotate with their textures. */
export function sampleHeight(x:number,z:number){
 const hill=18*Math.exp(-((x+25)**2/350+(z+9)**2/700))
 return hill+4*Math.exp(-((x-24)**2/650+(z+16)**2/650))+2.3*Math.sin(x/21)*Math.cos(z/27)+.045*(18-z)+.5
}
export function makeMaterialTerrain(library:MeshStandardMaterial[],decorate:(m:Material)=>void){
 const geometry=new BufferGeometry(),positions:number[]=[],uv:number[]=[],indices:number[]=[],n=65,size=104
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=x/(n-1)*size-size/2,wz=z/(n-1)*size-size/2;positions.push(wx,sampleHeight(wx,wz),wz);uv.push(wx/24,wz/24);if(z<n-1&&x<n-1){const a=z*n+x;indices.push(a,a+n,a+1,a+1,a+n,a+n+1)}}
 geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);geometry.computeVertexNormals()
 const material=new MeshStandardMaterial({map:library[0]!.map,normalMap:library[0]!.normalMap,roughness:1})
 decorate(material);const compile=material.onBeforeCompile.bind(material)
 material.onBeforeCompile=(s,r)=>{
  compile.call(material,s,r)
  library.forEach((m,i)=>{s.uniforms[`trialAlbedo${i}`]={value:m.map};s.uniforms[`trialNormal${i}`]={value:m.normalMap};s.uniforms[`trialARM${i}`]={value:m.roughnessMap}})
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 trialPosition; varying vec3 trialNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\ntrialPosition=position;trialNormal=normal;')
  const declaration=library.map((_,i)=>`uniform sampler2D trialAlbedo${i}; uniform sampler2D trialNormal${i}; uniform sampler2D trialARM${i};`).join('\n')
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
${declaration}
varying vec3 trialPosition; varying vec3 trialNormal;
float trialHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 trialCell(sampler2D tex,vec2 p,vec2 cell,bool bump){float a=trialHash(cell)*6.2831853;float c=cos(a),s=sin(a);vec2 uv=mat2(c,s,-s,c)*p+vec2(trialHash(cell+23.7),trialHash(cell+71.3))*17.0;vec4 sampleValue=texture2D(tex,uv);if(bump){vec3 n=sampleValue.xyz*2.0-1.0;n.xy=vec2(c*n.x+s*n.y,-s*n.x+c*n.y);return vec4(n,1.0);}return sampleValue;}
vec4 trialSample(sampler2D tex,vec2 p,bool bump){vec2 q=trialPosition.xz/12.0,cell=floor(q),f=fract(q);f=f*f*(3.0-2.0*f);return mix(mix(trialCell(tex,p,cell,bump),trialCell(tex,p,cell+vec2(1.0,0.0),bump),f.x),mix(trialCell(tex,p,cell+vec2(0.0,1.0),bump),trialCell(tex,p,cell+vec2(1.0),bump),f.x),f.y);}
vec4 trialTexture(sampler2D tex,vec2 p){return trialSample(tex,p,false);}
vec3 trialBump(sampler2D tex,vec2 p){return normalize(trialSample(tex,p,true).xyz);}
vec4 trialWeights(){float slope=1.0-normalize(trialNormal).y;float rock=max(smoothstep(.035,.22,slope),smoothstep(6.0,11.0,trialPosition.y)*(1.0-smoothstep(-10.0,2.0,trialPosition.x)));float sand=1.0-smoothstep(.15,2.1,trialPosition.y);float floorWeight=smoothstep(-7.0,18.0,trialPosition.x)*smoothstep(1.2,3.0,trialPosition.y);vec4 w=vec4(rock,(1.0-floorWeight)*(1.0-sand),sand,floorWeight*(1.0-sand));w.yzw*=1.0-rock;return w/max(.001,dot(w,vec4(1.0)));}
`)
  const scales=[1.5,2.5,2,2]
  const sum=(channel:string,normal=false)=>library.map((_,i)=>`${normal?'trialBump':'trialTexture'}(trial${channel}${i},trialPosition.xz/${scales[i]!.toFixed(1)})*tw.${'xyzw'[i]}`).join('+')
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 tw=trialWeights(); diffuseColor*=(${sum('Albedo')});`)
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`float roughnessFactor=roughness*(${sum('ARM')}).g;`)
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`vec3 trialN=normalize(${sum('Normal',true)});trialN.xy*=.65;normal=normalize(getTangentFrame(-vViewPosition,normal,trialPosition.xz)*trialN);`)
  // AO remains independent of daylight and is applied once in the indirect-light stage.
  s.fragmentShader=s.fragmentShader.replace('#include <aomap_fragment>',`reflectedLight.indirectDiffuse*=mix(.45,1.0,(${sum('ARM')}).r);`)
 }
 material.customProgramCacheKey=()=> 'finite-terrain-material-trial-r5'
 const mesh=new Mesh(geometry,material);mesh.receiveShadow=true
 return mesh
}
