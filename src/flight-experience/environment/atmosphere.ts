import { WATER_LIGHTING_GLSL } from './water-lighting'
/** Linear radiance shared by sky, sea and atmospheric land fog. */
export const ENVIRONMENT_ATMOSPHERE_GLSL = `
${WATER_LIGHTING_GLSL}
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
 vec3 c=mix(body,skyGradient(reflected)*.78,fresnel);
 return c;
}
vec3 oceanColor(vec3 ray,vec3 n,float shallow){
 float seaDistance=max(cameraPosition.y+.7,1.)/max(-ray.y,.0001);
 // Unresolved wave slopes retain variance offshore; a flat far mesh must never become a mirror.
 float unresolved=.012*smoothstep(1800.,4000.,seaDistance);
 float variance=min(.08,unresolved+.5*(dot(dFdx(n),dFdx(n))+dot(dFdy(n),dFdy(n))));
 return oceanBase(ray,n,shallow)+waterHighlight*sunColor*.012*waterSun(n,-ray,sunDirection,variance);
}
vec3 fogRadiance(vec3 ray){if(ray.y>=0.)return skyGradient(ray);return mix(oceanBase(ray,vec3(0.,1.,0.),0.),skyGradient(vec3(ray.x,0.,ray.z)),1.-smoothstep(0.,.012,-ray.y));}
vec3 distantColor(vec3 ray){if(ray.y>=0.)return skyColor(ray);
 vec3 ocean=oceanColor(ray,vec3(0.,1.,0.),0.);return mix(ocean,skyGradient(vec3(ray.x,0.,ray.z)),1.-smoothstep(0.,.012,-ray.y));}
`
