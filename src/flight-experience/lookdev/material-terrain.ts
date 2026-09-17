import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, type Material, type Texture, type Vector2 } from 'three'
export type MaterialTrial = {method:'histogram'|'triangle'|'four'|'tiled';channel:'pbr'|'albedo'|'normal'|'roughness'|'weights';scale:number;layers:2|4}
/** Finite trial: compare source tiling, old four-cell averaging and triangular statistics. */
export function sampleHeight(x:number,z:number){
 const hill=18*Math.exp(-((x+25)**2/350+(z+9)**2/700))
 return hill+4*Math.exp(-((x-24)**2/650+(z+16)**2/650))+2.3*Math.sin(x/21)*Math.cos(z/27)+.045*(18-z)+.5
}
export function makeMaterialTerrain(library:MeshStandardMaterial[],decorate:(m:Material)=>void,trial:MaterialTrial){
 const geometry=new BufferGeometry(),positions:number[]=[],uv:number[]=[],indices:number[]=[],n=65,size=104
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=x/(n-1)*size-size/2,wz=z/(n-1)*size-size/2;positions.push(wx,sampleHeight(wx,wz),wz);uv.push(wx/24,wz/24);if(z<n-1&&x<n-1){const a=z*n+x;indices.push(a,a+n,a+1,a+1,a+n,a+n+1)}}
 geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);geometry.computeVertexNormals()
 const material=new MeshStandardMaterial({map:library[0]!.map,normalMap:library[0]!.normalMap,roughness:1})
 decorate(material);decorateMaterialTerrain(material,library,trial)
 const mesh=new Mesh(geometry,material);mesh.receiveShadow=true
 return mesh
}

/** Shared by the finite art trial and every streamed terrain LOD. */
export function decorateMaterialTerrain(material:MeshStandardMaterial,library:MeshStandardMaterial[],trial:MaterialTrial,origin?:{value:Vector2}){
 material.map=library[0]!.map;material.normalMap=library[0]!.normalMap
 const baseKey=material.customProgramCacheKey()
 const compile=material.onBeforeCompile.bind(material)
 material.onBeforeCompile=(s,r)=>{
  compile.call(material,s,r)
  library.forEach((m,i)=>{const data=m.userData.stochastic as {gaussian:Texture;inverse:Texture;metresPerRepeat:number};s.uniforms[`trialAlbedo${i}`]={value:trial.method==='histogram'?data.gaussian:m.map};s.uniforms.trialInverse={value:data.inverse};s.uniforms[`trialScale${i}`]={value:data.metresPerRepeat*trial.scale};s.uniforms[`trialNormal${i}`]={value:m.normalMap};s.uniforms[`trialARM${i}`]={value:m.roughnessMap}})
  if(origin)s.uniforms.trialOrigin=origin
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 trialPosition; varying vec3 trialNormal;').replace('#include <worldpos_vertex>',`#include <worldpos_vertex>\ntrialPosition=${origin?'(modelMatrix*vec4(transformed,1.)).xyz+vec3(trialOrigin.x,0.,trialOrigin.y)':'position'};trialNormal=objectNormal;`)
  if(origin)s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform vec2 trialOrigin;')
  const declaration=library.map((_,i)=>`uniform sampler2D trialAlbedo${i};  uniform float trialScale${i}; uniform sampler2D trialNormal${i}; uniform sampler2D trialARM${i};`).join('\n')
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
${declaration}
uniform sampler2D trialInverse;
#define TRIAL_METHOD ${['tiled','four','triangle','histogram'].indexOf(trial.method)}
varying vec3 trialPosition; varying vec3 trialNormal;
float trialHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 trialCell(sampler2D tex,vec2 p,vec2 dx,vec2 dy,vec2 cell,bool bump,bool directional){float a=directional?0.0:trialHash(cell)*6.2831853;float c=cos(a),s=sin(a);mat2 rotation=mat2(c,s,-s,c);vec2 uv=rotation*p+vec2(trialHash(cell+23.7),trialHash(cell+71.3))*17.0;vec4 sampleValue=textureGrad(tex,uv,rotation*dx,rotation*dy);if(bump){vec3 n=sampleValue.xyz*2.0-1.0;n.xy=transpose(rotation)*n.xy;return vec4(n,1.0);}return sampleValue;}
vec4 trialSample(sampler2D tex,vec2 p,vec2 dx,vec2 dy,bool bump,bool gaussian,bool directional){
 #if TRIAL_METHOD == 0
 vec4 direct=textureGrad(tex,p,dx,dy);return bump?vec4(direct.xyz*2.-1.,1.):direct;
 #elif TRIAL_METHOD == 1
 vec2 base=floor(trialPosition.xz/12.),f=smoothstep(vec2(0),vec2(1),fract(trialPosition.xz/12.));
 return mix(mix(trialCell(tex,p,dx,dy,base,bump,directional),trialCell(tex,p,dx,dy,base+vec2(1,0),bump,directional),f.x),mix(trialCell(tex,p,dx,dy,base+vec2(0,1),bump,directional),trialCell(tex,p,dx,dy,base+vec2(1,1),bump,directional),f.x),f.y);
 #else
 vec2 q=mat2(1.0,0.0,-.577350269,1.154700538)*p,cell=floor(q),f=fract(q);
 vec2 a=cell,b,c;vec3 w;
 if(f.x+f.y<1.0){b=cell+vec2(1,0);c=cell+vec2(0,1);w=vec3(1.0-f.x-f.y,f.x,f.y);}else{a=cell+1.;b=cell+vec2(0,1);c=cell+vec2(1,0);w=vec3(f.x+f.y-1.,1.-f.x,1.-f.y);}
 vec4 value=trialCell(tex,p,dx,dy,a,bump,directional)*w.x+trialCell(tex,p,dx,dy,b,bump,directional)*w.y+trialCell(tex,p,dx,dy,c,bump,directional)*w.z;
 if(gaussian)value.rgb=(value.rgb-.5)/sqrt(dot(w,w))+.5;
 return value;
 #endif
}
vec3 trialColor(sampler2D tex,sampler2D inverse,vec2 p,vec2 dx,vec2 dy,bool directional,float layer){
 #if TRIAL_METHOD != 3
 return trialSample(tex,p,dx,dy,false,false,directional).rgb;
 #else
 vec3 g=clamp(trialSample(tex,p,dx,dy,false,true,directional).rgb,0.,1.);
 float level=clamp(log2(max(length(dx),length(dy))*512.),0.,9.);
 vec3 srgb=vec3(texture2D(inverse,vec2(g.r,1.-(level+.5+layer*10.)/40.)).r,texture2D(inverse,vec2(g.g,1.-(level+.5+layer*10.)/40.)).g,texture2D(inverse,vec2(g.b,1.-(level+.5+layer*10.)/40.)).b);
 return mix(srgb/12.92,pow((srgb+.055)/1.055,vec3(2.4)),step(vec3(.04045),srgb));
 #endif
}
vec4 trialWeights(){float slope=1.0-normalize(trialNormal).y;float rock=max(smoothstep(.035,.22,slope),smoothstep(6.0,11.0,trialPosition.y)*(1.0-smoothstep(-10.0,2.0,trialPosition.x)));float sand=1.0-smoothstep(.15,2.1,trialPosition.y);float floorWeight=smoothstep(-7.0,18.0,trialPosition.x)*smoothstep(1.2,3.0,trialPosition.y);vec4 w=vec4(rock,(1.0-floorWeight)*(1.0-sand),sand,floorWeight*(1.0-sand));w.yzw*=1.0-rock;return w/max(.001,dot(w,vec4(1.0)));}
`)
  if(origin)s.fragmentShader=s.fragmentShader.replace(/vec4 trialWeights\(\)\{[^}]+\}/,`vec4 trialWeights(){float slope=1.-clamp(normalize(trialNormal).y,0.,1.);float rock=smoothstep(.09,.38,slope);float sand=1.-smoothstep(2.,14.,trialPosition.y);float forest=smoothstep(8.,32.,trialPosition.y)*(.65+.15*sin(trialPosition.x/173.)*cos(trialPosition.z/211.));vec4 w=vec4(rock,(1.-sand)*(1.-forest),sand,(1.-sand)*forest);w.yzw*=1.-rock;return w/max(.001,dot(w,vec4(1.)));}`)
  const layers=library.map((_,i)=>`if(tw.${'xyzw'[i]}>.001){vec2 p=trialUV/trialScale${i},dx=trialDx/trialScale${i},dy=trialDy/trialScale${i};float weight=tw.${'xyzw'[i]};trialC+=trialColor(trialAlbedo${i},trialInverse,p,dx,dy,${i===0||i===2?'true':'false'},${i}.0)*weight;trialA+=trialSample(trialARM${i},p,dx,dy,false,false,${i===0||i===2?'true':'false'}).rgb*weight;trialN+=trialSample(trialNormal${i},p,dx,dy,true,false,${i===0||i===2?'true':'false'}).xyz*weight;}`).join('\n')
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 tn=normalize(trialNormal);vec2 trialUV=abs(tn.y)>=max(abs(tn.x),abs(tn.z))?trialPosition.xz:(abs(tn.x)>abs(tn.z)?trialPosition.zy:trialPosition.xy);vec2 trialDx=dFdx(trialUV),trialDy=dFdy(trialUV);vec4 tw=trialWeights();${trial.layers===2?'tw=vec4(tw.x,1.-tw.x,0.,0.);':''}vec3 trialC=vec3(0),trialA=vec3(0),trialN=vec3(0);${layers}diffuseColor.rgb*=trialC;`)
  if(origin)s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','')
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','float roughnessFactor=roughness*trialA.g;')
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','trialN=normalize(trialN);trialN.xy*=.65;normal=normalize(getTangentFrame(-vViewPosition,normal,trialUV)*trialN);')
  const diagnostic=trial.channel==='albedo'?'pow(max(trialC,vec3(0)),vec3(1./2.2))':trial.channel==='normal'?'trialN*.5+.5':trial.channel==='roughness'?'vec3(trialA.g)':trial.channel==='weights'?'tw.xyz+tw.w*vec3(.6,.2,.7)':null
  if(diagnostic)s.fragmentShader=s.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>\ngl_FragColor=vec4(${diagnostic},1.);`)
  s.fragmentShader=s.fragmentShader.replace('#include <aomap_fragment>','reflectedLight.indirectDiffuse*=mix(.45,1.0,trialA.r);')
 }
 material.customProgramCacheKey=()=> `${baseKey}-terrain-material-v4-${Boolean(origin)}-${JSON.stringify(trial)}`
 material.needsUpdate=true
}
