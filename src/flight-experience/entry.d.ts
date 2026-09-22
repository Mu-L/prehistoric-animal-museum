/* eslint-disable @typescript-eslint/consistent-type-imports -- Ambient virtual module uses a relative type query. */
declare module 'virtual:flight-experience-entry' {
  const loadFlightExperience: (() => Promise<typeof import('./FlightExperience')>) | null
  const flightCapabilities: readonly import('./species/profiles').FlightSpeciesProfile[]
  const flightPreviewUrl:string
  const prefetchFlightExperience:(()=>void)|null
  export { loadFlightExperience, flightCapabilities, flightPreviewUrl, prefetchFlightExperience }
}
