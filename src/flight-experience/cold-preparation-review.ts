/** Explicit localhost DEV probe; real WebGL loss while model/material assembly is delayed. */
export async function coldPreparationReview(stage:'model'|'materials',alive:()=>boolean) {
  if(new URLSearchParams(location.search).get('flightCold')!==stage)return null
  const canvas=document.querySelector<HTMLCanvasElement>('canvas[data-experience="flight"]')
  const extension=canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')
  if(!canvas||!extension)return {stage,available:false,lost:false,restored:false}
  const result={stage,available:true,lost:false,restored:false}
  const lost=()=>{result.lost=true},restored=()=>{result.restored=true}
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored)
  try {
    await new Promise<void>(resolve=>setTimeout(resolve,250))
    if(alive())extension.loseContext()
    await new Promise<void>(resolve=>setTimeout(resolve,750))
    if(alive())extension.restoreContext()
    await new Promise<void>(resolve=>setTimeout(resolve,1500))
  } finally {canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored)}
  return result
}
