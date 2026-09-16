/** Shared linear radiance for sky, finite sea, far sea, and terrain fog. */
export const ENVIRONMENT_ATMOSPHERE_GLSL = `
uniform float skyColors; uniform vec3 skyZenith; uniform vec3 horizon; uniform vec3 sunDirection; uniform vec3 sunColor;
vec3 skyColor(vec3 d){float h=pow(max(d.y,0.),.55); vec3 c=mix(horizon,skyZenith,h);
float mu=max(0.,dot(d,sunDirection));if(skyColors>.5)return mix(vec3(1.,.12,.02),vec3(.02,.15,1.),h);return c+sunColor*(pow(mu,64.)*.08+smoothstep(.99988,.99997,mu)*3.);}
vec3 oceanColor(vec3 ray,vec3 n,float shallow){vec3 reflected=reflect(ray,n);
float fresnel=.025+.975*pow(1.-max(0.,dot(-ray,n)),5.);
vec3 body=mix(vec3(.013,.073,.094),vec3(.038,.19,.17),shallow);
// Rough water reflects the broad sky, never the razor-sharp solar disc.
vec3 reflectedSky=mix(horizon,skyZenith,pow(max(reflected.y,0.),.55));
vec3 c=mix(body,reflectedSky,fresnel);
float glint=pow(max(0.,dot(reflected,sunDirection)),65.);return c+sunColor*glint*.025;}
vec3 distantColor(vec3 ray){if(ray.y>=0.)return skyColor(ray);
vec3 ocean=oceanColor(ray,vec3(0.,1.,0.),0.);return mix(ocean,horizon,1.-smoothstep(0.,.012,-ray.y));}
`
