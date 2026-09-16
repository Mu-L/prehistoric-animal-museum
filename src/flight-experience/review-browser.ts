/** Browser-only diagnostics. Imported by the development control panel. */
export function captureBrowserMetadata() {
  const canvas=document.querySelector<HTMLCanvasElement>('canvas[data-experience="flight"]')
  const gl=canvas?.getContext('webgl2'),extension=gl?.getExtension('WEBGL_debug_renderer_info')
  return {viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},browser:navigator.userAgent,
    gpu:extension?String(gl?.getParameter(extension.UNMASKED_RENDERER_WEBGL) as unknown):'unavailable',
    gpuTimerAvailable:Boolean(gl?.getExtension('EXT_disjoint_timer_query_webgl2')),
    originalScreenshotParameters:'unknown; anchors approximate compositions'}
}
export function reviewContextRecovery() {
  const canvas=document.querySelector<HTMLCanvasElement>('canvas[data-experience="flight"]')
  const extension=canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')
  if(!extension)return false
  extension.loseContext()
  window.setTimeout(()=>{if(canvas?.isConnected)extension.restoreContext()},750)
  return true
}
