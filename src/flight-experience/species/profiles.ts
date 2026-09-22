export interface FlightSpeciesProfile {
 id:string;revision:string;publicState:'candidate'|'approved'|'deferred';name:{en:string;'zh-CN':string}
 sourceAssetHash:string;sourceClip:'Idle';animationKind:'skeletal'|'morph'|'hybrid'
 spanMeters:number;spanAxis:'legacy-max-xz'|'z';yaw:number
 camera:{span:number;height:number;radius:number;minDistance:number;offsetHeight:number;targetAhead:number;targetBelow:number;near:number}
 derivedAnimations:boolean;companions:boolean;companionTriangles:{near:number;far:number};provenanceRefs:readonly string[]
}
const reference=(id:string)=>[`src/content/animals/${id}/provenance.ts`,`src/content/animals/${id}/content.zh-CN.ts`]
// Candidate capability is separate from public approval. The disabled virtual
// entry exports no capabilities; G6/release approval remains a human decision.
export const FLIGHT_SPECIES:readonly FlightSpeciesProfile[]=[
 {id:'pteranodon',revision:'r1-1',publicState:'candidate',name:{en:'Pteranodon','zh-CN':'无齿翼龙'},sourceAssetHash:'abcde65b2ea29c6ae86d8232a5e1a604b05099deb34cebfb30495aff53f61af1',sourceClip:'Idle',animationKind:'skeletal',spanMeters:7,spanAxis:'legacy-max-xz',yaw:Math.PI,camera:{span:7,height:4,radius:5.5,minDistance:10,offsetHeight:5,targetAhead:20,targetBelow:5,near:.5},derivedAnimations:true,companions:true,companionTriangles:{near:13494,far:4048},provenanceRefs:reference('pteranodon')},
 {id:'tupandactylus',revision:'r1-1',publicState:'candidate',name:{en:'Tupandactylus','zh-CN':'古神翼龙'},sourceAssetHash:'e2c232534c909899d266fb75e1787117d7e17396d677a82e1a63a0872f2f385e',sourceClip:'Idle',animationKind:'morph',spanMeters:2.7,spanAxis:'z',yaw:-Math.PI/2,camera:{span:2.7,height:1.6,radius:2.1,minDistance:4,offsetHeight:1.8,targetAhead:4,targetBelow:.8,near:.2},derivedAnimations:false,companions:true,companionTriangles:{near:23280,far:7828},provenanceRefs:reference('tupandactylus')},
 {id:'rhamphorhynchus',revision:'r1-1',publicState:'candidate',name:{en:'Rhamphorhynchus','zh-CN':'喙嘴翼龙'},sourceAssetHash:'16b5ab37ac44e177c3e12c229e6f0b27fab669c3d6e74e5b5bdf54ed3a68a935',sourceClip:'Idle',animationKind:'morph',spanMeters:1.4,spanAxis:'z',yaw:-Math.PI/2,camera:{span:1.4,height:.8,radius:1.1,minDistance:2.5,offsetHeight:.9,targetAhead:2,targetBelow:.4,near:.1},derivedAnimations:false,companions:true,companionTriangles:{near:15744,far:6536},provenanceRefs:reference('rhamphorhynchus')},
]
export const DEFAULT_FLIGHT_SPECIES=FLIGHT_SPECIES[0]!
export function flightSpecies(id:string){return FLIGHT_SPECIES.find(profile=>profile.id===id&&profile.publicState!=='deferred')}
export const DEFERRED_FLIGHT_SPECIES=['archaeopteryx','meganeura'] as const
