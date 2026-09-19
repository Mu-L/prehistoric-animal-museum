/** One density/phase contract for visible sky, receiver shadows and water reflection. */
export const CLOUD_GLSL=`
uniform sampler2D cloudDensityMap;
uniform vec2 cloudOrigin;uniform vec2 cloudPhase;
uniform float cloudCoverage;uniform float cloudThickness;uniform float cloudReady;
uniform float weatherHaze;uniform float rainWetness;
vec3 flightWorldPoint(vec3 viewPoint){return cameraPosition+transpose(mat3(viewMatrix))*viewPoint;}
float cloudDensity(vec2 p){
 vec2 uv=(p+cloudOrigin-cloudPhase)/65536.;
 vec2 density=texture2D(cloudDensityMap,uv*4.).rg;
 float threshold=mix(.78,.22,cloudCoverage);
 float shape=density.r+.10*(density.g-.5);
 float thickness=.32+.95*clamp((shape-threshold+.07)/max(.18,.82-threshold),0.,1.);
 return smoothstep(threshold-.07,threshold+.09,shape)*thickness*smoothstep(0.,.12,cloudCoverage)*cloudReady;
}
float cloudOptical(vec3 p,vec3 d){
 if(d.y<=.00001||p.y>=2400.||cloudCoverage<=0.)return 0.;
 vec2 q=p.xz+d.xz*((2400.-p.y)/d.y);
 return cloudDensity(q)*cloudThickness;
}
float cloudTransmission(vec3 p,vec3 d){return exp(-cloudOptical(p,d)*min(3.,.7/max(.08,d.y)));}
vec3 cloudSky(vec3 p,vec3 d,vec3 base,vec3 ambient,vec3 solar,vec3 sun){
 float optical=cloudOptical(p,d),alpha=(1.-exp(-optical*1.7))*smoothstep(.005,.05,d.y);
 float body=exp(-optical*.95);
 vec3 c=mix(ambient*.65+vec3(.10,.12,.15),ambient*1.3+vec3(.28,.30,.32),body)*mix(1.,.82,weatherHaze);
 float edge=exp(-optical*1.8)*pow(max(0.,dot(d,sun)),5.);
 c+=solar*(.035+.16*edge+body*.055);
 return mix(base,c,alpha);
}
`
