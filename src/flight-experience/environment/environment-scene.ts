import { BackSide, DataTexture, DirectionalLight, Group, HemisphereLight, Mesh, NearestFilter, PlaneGeometry, RGBAFormat, ShaderMaterial, SphereGeometry, Vector2, Vector3, Vector4, type PerspectiveCamera, type Scene } from 'three'
import { SEA_LEVEL, type Address } from '../world'
import { BathymetryField, DEPTH_SIZE, DEPTH_STEP } from './bathymetry'
import { sampleEnvironment, type SolarPreset, type EnvironmentFrame } from './environment-state'
import { envelopeOrigin, waveComponents } from './ocean-waves'
import { ENVIRONMENT_ATMOSPHERE_GLSL as atmosphere } from './atmosphere'
import { createEnvironmentFog } from './environment-fog'

const skyVertex=`varying vec3 direction;void main(){direction=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`
const skyFragment=`varying vec3 direction;${atmosphere}
void main(){gl_FragColor=vec4(distantColor(normalize(direction)),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
const waterVertex=`varying vec3 worldPosition;void main(){worldPosition=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(worldPosition,1.);}`
const waterFragment=`varying vec3 worldPosition;uniform vec4 waves[6];uniform vec2 envelopeOrigin;uniform sampler2D depthField;uniform vec2 depthOrigin;uniform float hasDepth;uniform float flatWater;uniform float edges;
${atmosphere}
// Periodic 8192m value noise with analytic derivatives; bounded origin coordinates.
float oceanHash(vec2 p){p=mod(p,64.);return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 oceanNoise(vec2 p){vec2 cell=floor(p),f=fract(p),u=f*f*(3.-2.*f),du=6.*f*(1.-f);
float a=oceanHash(cell),b=oceanHash(cell+vec2(1.,0.)),c=oceanHash(cell+vec2(0.,1.)),d=oceanHash(cell+1.);
return vec3(mix(mix(a,b,u.x),mix(c,d,u.x),u.y),mix(b-a,d-c,u.y)*du.x,mix(c-a,d-b,u.x)*du.y);}
float ground(vec2 pixel){vec2 rg=texture2D(depthField,(pixel+.5)/130.).rg*255.;return -128.+(rg.x*256.+rg.y)/65535.*1024.;}
void main(){vec3 ray=normalize(worldPosition-cameraPosition);float distanceToEye=length(worldPosition-cameraPosition);vec2 gradient=vec2(0.);
vec2 envelopePosition=(worldPosition.xz+envelopeOrigin)/128.;
for(int i=0;i<6;i++){
vec3 warp=oceanNoise(envelopePosition+vec2(float(i)*7.3,float(i)*11.9));
vec3 envelope=oceanNoise(envelopePosition+vec2(float(i)*17.7+31.,float(i)*5.1+19.));
float phase=dot(worldPosition.xz,waves[i].xy)+waves[i].w+warp.x*6.;
vec2 phaseGradient=waves[i].xy+warp.yz*(6./128.);
float amplitude=.25+.55*envelope.x;
float footprint=length(vec2(dFdx(phase),dFdy(phase)));
float aa=1.-smoothstep(.45,1.8,footprint);
// Short waves contribute only close to the eye; the offshore field is broad swell.
float reach=i<2?1300.:(i<4?650.:240.);
float fade=1.-smoothstep(reach*.2,reach,distanceToEye);
gradient+=(cos(phase)*phaseGradient*amplitude+sin(phase)*envelope.yz*(.55/128.))*waves[i].z*aa*fade*.42;
}
vec3 n=normalize(vec3(-gradient.x*(1.-flatWater),1.,-gradient.y*(1.-flatWater)));
vec2 p=(worldPosition.xz-depthOrigin)/${DEPTH_STEP}.;vec2 cell=floor(p),f=fract(p);
float height=mix(mix(ground(cell),ground(cell+vec2(1.,0.)),f.x),mix(ground(cell+vec2(0.,1.)),ground(cell+1.),f.x),f.y);
float valid=step(1.,p.x)*step(1.,p.y)*step(p.x,128.)*step(p.y,128.)*hasDepth;
float shallow=(1.-smoothstep(1.,24.,${SEA_LEVEL}-height))*valid;
vec3 c=oceanColor(ray,n,shallow);float farMix=smoothstep(1600.,2600.,distanceToEye);c=mix(c,distantColor(ray),farMix);
if(edges>.5){float border=step(4750.,max(abs(worldPosition.x-cameraPosition.x),abs(worldPosition.z-cameraPosition.z)));c=mix(c,vec3(1.,0.,0.),border);}
gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
/** Owns only environment resources. Renderer/shadow state is leased by the runtime. */
export class EnvironmentScene {
  readonly root=new Group()
  readonly review={flatWater:false,freezeWater:false,oceanEdges:false,skyColors:false,shadows:true}
  readonly metrics={bathymetrySamples:0,textureBytes:DEPTH_SIZE*DEPTH_SIZE*4,shadowMapSize:0,shadowExtent:384,bathymetryRevision:0,bathymetryMs:0,peakBathymetryMs:0}
  private currentFrame=sampleEnvironment()
  get frame():EnvironmentFrame{return this.currentFrame}
  readonly sun=new DirectionalLight(0xffffff,2.6)
  readonly fill=new HemisphereLight(0xffffff,0xffffff,1.15)
  private readonly field=new BathymetryField()
  private readonly texture=new DataTexture(this.field.data,DEPTH_SIZE,DEPTH_SIZE,RGBAFormat)
  readonly fog=createEnvironmentFog(this.currentFrame)
  private readonly uniforms=this.fog.uniforms
  private readonly waterUniforms={...this.uniforms,envelopeOrigin:{value:new Vector2()},waves:{value:Array.from({length:6},()=>new Vector4())},depthField:{value:this.texture},depthOrigin:{value:new Vector2()},hasDepth:{value:0},flatWater:{value:0},edges:{value:0}}
  readonly sky=new Mesh(new SphereGeometry(1,24,12),new ShaderMaterial({vertexShader:skyVertex,fragmentShader:skyFragment,uniforms:this.uniforms,side:BackSide,depthWrite:false,depthTest:false}))
  readonly water=new Mesh(new PlaneGeometry(10000,10000),new ShaderMaterial({vertexShader:waterVertex,fragmentShader:waterFragment,uniforms:this.waterUniforms}))
  private lastWaterTime=0
  get busy(){return this.field.busy}
  constructor(scene:Scene,private readonly surface:(x:number,z:number)=>number){
    this.texture.minFilter=NearestFilter;this.texture.magFilter=NearestFilter;this.texture.generateMipmaps=false
    this.sky.frustumCulled=false;this.sky.renderOrder=-10
    this.water.rotation.x=-Math.PI/2;this.water.position.y=SEA_LEVEL;this.water.frustumCulled=false
    this.sun.castShadow=true;this.sun.shadow.camera.left=-192;this.sun.shadow.camera.right=192;this.sun.shadow.camera.top=192;this.sun.shadow.camera.bottom=-192
    this.sun.shadow.camera.near=1;this.sun.shadow.camera.far=1400;this.sun.shadow.bias=-.0003;this.sun.shadow.normalBias=.8
    this.root.add(this.sky,this.water,this.sun,this.sun.target,this.fill);scene.add(this.root)
  }
  update(camera:PerspectiveCamera,origin:Address,time:number,quality:'low'|'balanced',preset:SolarPreset='afternoon'){
    const f=this.currentFrame=sampleEnvironment(preset,time)
    this.fog.update(f)
    this.uniforms.skyColors.value=Number(this.review.skyColors);this.sun.castShadow=this.review.shadows
    this.sun.color.setRGB(...f.sunColor);this.sun.intensity=f.sunIntensity
    this.fill.color.setRGB(...f.skyZenith);this.fill.groundColor.setRGB(...f.groundFill);this.fill.intensity=f.fillIntensity
    this.sky.position.copy(camera.position);this.water.position.set(camera.position.x,SEA_LEVEL,camera.position.z)
    const size=quality==='low'?1024:2048
    if(this.sun.shadow.mapSize.x!==size){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;this.sun.shadow.mapSize.set(size,size)}
    this.metrics.shadowMapSize=size
    // Snap in the sun's tangent plane in logical coordinates; origin shifts never rotate the light.
    const dir=new Vector3(...f.sunDirectionWorld),right=new Vector3().crossVectors(dir,new Vector3(0,1,0)).normalize(),up=new Vector3().crossVectors(right,dir).normalize()
    const focus=new Vector3(camera.position.x+origin.x,camera.position.y-60,camera.position.z+origin.z),texel=384/size
    focus.addScaledVector(right,Math.round(focus.dot(right)/texel)*texel-focus.dot(right))
    focus.addScaledVector(up,Math.round(focus.dot(up)/texel)*texel-focus.dot(up))
    focus.x-=origin.x;focus.z-=origin.z;this.sun.target.position.copy(focus);this.sun.position.copy(focus).addScaledVector(dir,700)
    if(!this.review.freezeWater)this.lastWaterTime=time
    this.waterUniforms.envelopeOrigin.value.set(...envelopeOrigin(origin))
    waveComponents(f.windWorld,origin,this.lastWaterTime).forEach((w,i)=>this.waterUniforms.waves.value[i]!.set(w.x,w.z,w.amplitude*f.waveStrength,w.phase))
    this.waterUniforms.flatWater.value=Number(this.review.flatWater);this.waterUniforms.edges.value=Number(this.review.oceanEdges)
    const revision=this.field.revision,started=performance.now()
    this.metrics.bathymetrySamples=this.field.update(camera.position.x+origin.x,camera.position.z+origin.z,this.surface)
    this.metrics.bathymetryMs=performance.now()-started
    this.metrics.peakBathymetryMs=Math.max(this.metrics.peakBathymetryMs,this.metrics.bathymetryMs)
    if(revision!==this.field.revision)this.texture.needsUpdate=true
    this.metrics.bathymetryRevision=this.field.revision
    this.waterUniforms.hasDepth.value=Number(this.field.revision>0);this.waterUniforms.depthOrigin.value.set(Number.isFinite(this.field.startX)?this.field.startX-origin.x:0,Number.isFinite(this.field.startZ)?this.field.startZ-origin.z:0)
  }
  dispose(){this.root.removeFromParent();this.sky.geometry.dispose();this.sky.material.dispose();this.water.geometry.dispose();this.water.material.dispose();this.texture.dispose();this.sun.dispose();this.fill.dispose();this.root.clear()}
}
