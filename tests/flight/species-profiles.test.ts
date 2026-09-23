import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {expect,it} from 'vitest'
import {FLIGHT_SPECIES,availableFlightSpecies,flightSpecies} from '../../src/flight-experience/species/profiles'
import {orbitPose} from '../../src/flight-experience/camera-rig'
it('binds each candidate to the actual source and preserves the unsupported boundary',()=>{
 for(const profile of FLIGHT_SPECIES){
  const bytes=readFileSync(`src/content/animals/${profile.id}/model/model.glb`)
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(profile.sourceAssetHash)
  expect(profile.publicState).toBe('candidate')
 }
 for(const id of ['archaeopteryx','meganeura','unknown'])expect(flightSpecies(id)).toBeUndefined()
})
it('keeps future candidates out of the approved public set',()=>{
 const profiles=[...FLIGHT_SPECIES,{...FLIGHT_SPECIES[0]!,id:'future-candidate'},{...FLIGHT_SPECIES[0]!,id:'approved',publicState:'approved' as const}]
 expect(availableFlightSpecies('candidate',profiles).map(p=>p.id)).toContain('future-candidate')
 expect(availableFlightSpecies('public',profiles).map(p=>p.id)).toEqual(['approved'])
})
it('uses the authored wing axis for new species, separately from long body and tail',()=>{
 expect(flightSpecies('tupandactylus')).toMatchObject({spanMeters:2.7,spanAxis:'z',animationKind:'morph',derivedAnimations:false})
 expect(flightSpecies('rhamphorhynchus')).toMatchObject({spanMeters:1.4,spanAxis:'z',animationKind:'morph',derivedAnimations:false})
 for(const profile of FLIGHT_SPECIES)for(const aspect of [320/844,844/390,16/9])for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
  const pose=orbitPose({x:0,y:190,z:0},0,{yaw,pitch:0},aspect,'near',profile.camera)
  expect(pose.position.distanceTo({x:0,y:190,z:0})).toBeGreaterThan(profile.camera.radius)
 }
})
