/** DEV-only review automation uses the host's completed frames, never a second RAF. */
import type { FlightRuntime } from './FlightRuntime'
import {saveWeatherCapture} from './weather-review-capture'
import {recordFlightReview} from './review-recording'
const wait=(ms:number)=>new Promise<void>(resolve=>setTimeout(resolve,ms))
async function settle(runtime:FlightRuntime){
  for(let n=0;n<100;n++){
    await wait(100)
    if(!runtime.canObserveCamera)throw new Error('Camera unavailable; review stopped')
    if(runtime.activeCameraRig.rejection)throw new Error(runtime.activeCameraRig.rejection)
    if(!runtime.activeCameraRig.moving)return
  }
  throw new Error('Camera transition timed out')
}
export async function captureCameraCandidates(runtime:FlightRuntime){
  runtime.pause('user')
  const saved=runtime.cameraRig.snapshot(),files:string[]=[]
  try {
    for(const yaw of [0,150,165,180,-90,90]){
      runtime.selectPerspective('rear');await settle(runtime)
      if(yaw!==0){runtime.orbitCamera(yaw*Math.PI/180,0);await settle(runtime)}
      files.push(await saveWeatherCapture(runtime))
    }
  } finally {runtime.restoreCameraRig(saved)}
  return files.join(', ')
}
export async function recordCameraTransitions(runtime:FlightRuntime){
  runtime.pause('user');runtime.selectPerspective('rear');await settle(runtime)
  const video=recordFlightReview(16)
  for(const preset of ['front','rear','left','right','rear'] as const){runtime.selectPerspective(preset);await settle(runtime);await wait(500)}
  return video
}
export async function recordCameraFlight(runtime:FlightRuntime){
  runtime.pause('user');runtime.selectPerspective('front');await settle(runtime)
  runtime.trace.start();const video=recordFlightReview(20);runtime.start()
  const filename=await video;runtime.pause('user');runtime.trace.stop()
  await fetch('/__flight-review/trace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(runtime.traceEvidence())})
  await saveWeatherCapture(runtime)
  return filename
}
