import { WATER_LIGHTING_GLSL } from './water-lighting'
/** Linear radiance shared by sky, sea and atmospheric land fog. */
export const ENVIRONMENT_ATMOSPHERE_GLSL = `
${WATER_LIGHTING_GLSL}
uniform float solarWaveStrength;uniform float solarWaterTime;uniform vec2 solarWaterOrigin;
uniform float photographicSky;uniform vec3 skyLow;uniform vec3 skyMid;uniform vec3 skyUpper;
uniform float waterHighlight; uniform float skyColors; uniform vec3 skyZenith; uniform vec3 horizon; uniform vec3 sunDirection; uniform vec3 sunColor;
vec3 skyGradient(vec3 d){
 float y=max(d.y,0.);vec3 legacy=mix(horizon,skyZenith,pow(y,.55));
 vec3 c=mix(horizon,skyLow,smoothstep(0.,.055,y));
 c=mix(c,skyMid,smoothstep(.02,.18,y));
 c=mix(c,skyUpper,smoothstep(.10,.36,y));
 c=mix(c,skyZenith,smoothstep(.27,.75,y));
 // Low-angle forward scattering stays close to the horizon, not a white sky wash.
 float alignment=pow(max(0.,dot(normalize(vec3(d.x,.001,d.z)),normalize(vec3(sunDirection.x,.001,sunDirection.z)))),8.);
 float golden=1.-smoothstep(.10,.36,sunDirection.y);
 c+=vec3(1.,.68,.32)*exp(-y/ .035)*(.035+.09*alignment)*golden;
 return mix(legacy,c,photographicSky);
}
vec3 skyColor(vec3 d){
 float mu=clamp(dot(d,sunDirection),-1.,1.);
 if(skyColors>.5)return mix(vec3(1.,.12,.02),vec3(.02,.15,1.),pow(max(d.y,0.),.55));
 float angle=sqrt(max(0.,2.*(1.-mu)));
 // ~0.53 degree disc diameter; 2.5x inner halo, 9x outer aureole.
 float core=1.-smoothstep(.0038,.0052,angle);
 float inner=exp(-pow(angle/.012,2.))*.36;
 float outer=exp(-pow(angle/.045,2.))*.065;
 float legacy=pow(max(mu,0.),64.)*.08+smoothstep(.99988,.99997,mu)*3.;
 return skyGradient(d)+sunColor*mix(legacy,core*12.+inner+outer,photographicSky);
}
vec3 oceanBase(vec3 ray,vec3 n,float shallow){
 vec3 reflected=reflect(ray,n);float fresnel=.02+.98*pow(1.-max(0.,dot(-ray,n)),5.);
 vec3 body=mix(vec3(.003,.017,.027),vec3(.015,.080,.077),shallow);
 // Reflected sky provides the warm distance / cool depth relation; no painted sun stripe.
 float shallowReflection=1.-shallow*.22;
 vec3 c=mix(body,skyGradient(reflected)*.78,fresnel*shallowReflection);
 return c;
}
// Resolved metre-scale slopes also serve the distant ocean. Their phases are world
// anchored and continuous in the environment clock; no brightness noise or blinking.
vec3 solarWaveNormal(vec3 surfacePosition,vec3 n){
 vec2 p=surfacePosition.xz+solarWaterOrigin;
 vec2 slope=vec2(0.);
 for(int i=0;i<5;i++){
  float fi=float(i),k=6.2831853*(13.+fi*9.)/8192.;
  vec2 dir=normalize(vec2(.37+fi*.31,1.-fi*.27));
  // Integer wave vectors retain phase across the 8192m origin envelope.
  vec2 wave=floor(dir*k*8192./6.2831853+.5)*6.2831853/8192.;
  float phase=dot(p,wave)-solarWaterTime*(.31+fi*.13);
  float footprint=length(vec2(dFdx(phase),dFdy(phase)));
  float resolved=1.-smoothstep(.7,2.5,footprint);
  slope+=normalize(wave)*cos(phase)*(.035+fi*.009)*resolved;
 }
 return normalize(vec3(n.x-slope.x*solarWaveStrength,n.y,n.z-slope.y*solarWaveStrength));
}
vec3 oceanColor(vec3 ray,vec3 n,float shallow,vec3 surfacePosition){
 vec3 specNormal=solarWaveNormal(surfacePosition,n);
 float variance=min(.025,.35*(dot(dFdx(specNormal),dFdx(specNormal))+dot(dFdy(specNormal),dFdy(specNormal))));
 float energy=waterHighlight*.018*waterSun(specNormal,-ray,sunDirection,variance);
 // Preserve gold through tone mapping; reserve near-white for the rare peak.
 float peak=energy/(1.+energy/2.8);
 float golden=1.-smoothstep(.10,.36,sunDirection.y);
 vec3 gold=mix(vec3(1.,.34,.055),vec3(1.,.72,.30),smoothstep(.08,1.8,peak));
 vec3 highlight=mix(sunColor, gold, golden*.85)*peak;
 return oceanBase(ray,n,shallow)+highlight;
}
vec3 fogRadiance(vec3 ray){if(ray.y>=0.)return skyGradient(ray);return mix(oceanBase(ray,vec3(0.,1.,0.),0.),skyGradient(vec3(ray.x,0.,ray.z)),1.-smoothstep(0.,.012,-ray.y));}
vec3 distantColor(vec3 ray){if(ray.y>=0.)return skyColor(ray);
 vec3 ocean=oceanColor(ray,vec3(0.,1.,0.),0.,cameraPosition+ray*(max(cameraPosition.y+.7,1.)/max(-ray.y,.0001)));return mix(ocean,skyGradient(vec3(ray.x,0.,ray.z)),1.-smoothstep(0.,.012,-ray.y));}
`
