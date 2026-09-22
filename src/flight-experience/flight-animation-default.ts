/** Blend flight effort without restarting the animation clocks. */
export function animationWeights(mode:'auto'|'source'|'powered'|'glide',effort=0,descent=0){
 if(mode==='auto'){const powered=Math.max(0,Math.min(1,effort)),glide=Math.max(0,Math.min(1,descent))*(1-powered);return {source:1-powered-glide,powered,glide}}
 return {source:mode==='source'?1:0,powered:mode==='powered'?1:0,glide:mode==='glide'?1:0}
}
