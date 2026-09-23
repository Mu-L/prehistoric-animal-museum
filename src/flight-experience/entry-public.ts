// Public eligibility is deliberately narrower than the local candidate build.
// An approved profile is a separate release decision; adding a candidate alone
// cannot create a public route, entry, prefetch target, or picker option.
import {availableFlightSpecies} from './species/profiles'
export {flightPreviewUrl,loadFlightExperience,prefetchFlightExperience} from './entry-enabled'
export const flightCapabilities=availableFlightSpecies('public')
