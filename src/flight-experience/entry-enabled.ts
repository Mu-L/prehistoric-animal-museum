import './entry-card.css'
import flightPreviewUrl from './assets/entry/coast-preview.webp?url'
export {flightPreviewUrl}
export const loadFlightExperience = () => import('./FlightExperience')

import {availableFlightSpecies} from './species/profiles'
export const flightCapabilities=availableFlightSpecies('candidate')

export function prefetchFlightExperience(){
 const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection
 if(document.hidden||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType??''))return
 void loadFlightExperience().catch(()=>{})
}
