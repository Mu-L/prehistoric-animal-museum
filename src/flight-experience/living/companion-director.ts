import {DEFAULT_FLIGHT_SPECIES,type FlightSpeciesProfile} from '../species/profiles'
import { Group, Mesh, Vector3, type AnimationClip, type BufferGeometry, type Material, type Object3D } from 'three'
import type { WorldSampler } from '../world'
import type { LivingContext } from './living-context'
import { createCompanion, loadFarCompanionTemplate, type CompanionInstance, type FarCompanionTemplate } from './companion-assets'

type Point = Readonly<{ x: number; y: number; z: number }>
type MutablePoint = {x:number;y:number;z:number}
const clamp=(value:number,minimum:number,maximum:number)=>Math.max(minimum,Math.min(maximum,value))
const smooth=(value:number)=>{const t=clamp(value,0,1);return t*t*(3-2*t)}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)
const wrapAngle=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle))
const magnitude=(point:Point)=>Math.hypot(point.x,point.y,point.z)
const limited=(point:Point,maximum:number):MutablePoint=>{const ratio=Math.min(1,maximum/Math.max(.000001,magnitude(point)));return{x:point.x*ratio,y:point.y*ratio,z:point.z*ratio}}
export interface CompanionRoute { readonly id:number;readonly near:boolean;readonly start:Point;readonly heading:number;readonly side:number;readonly duration:number;readonly speed:number;readonly encounter?:boolean;readonly initialSide?:number;readonly observation?:boolean }
/** Guide curve only. Actors reach it through bounded velocity integration. */
export function routePoint(route:CompanionRoute,age:number):Point {
  const t=clamp(age,0,route.duration),depart=Math.max(0,t-route.duration*.68)
  const side=route.encounter?((36-(route.initialSide??84))*smooth(t/28)):0
  const lateral=route.side*(side+depart*depart*.065)
  return{x:route.start.x+Math.sin(route.heading)*route.speed*t+Math.cos(route.heading)*lateral,
    y:route.start.y,z:route.start.z-Math.cos(route.heading)*route.speed*t+Math.sin(route.heading)*lateral}
}
export function segmentDistance(a:Point,b:Point,p:Point):number {
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=dx*dx+dy*dy+dz*dz
  const t=length===0?0:clamp(((p.x-a.x)*dx+(p.y-a.y)*dy+(p.z-a.z)*dz)/length,0,1)
  return distance({x:a.x+dx*t,y:a.y+dy*t,z:a.z+dz*t},p)
}
export function closestApproach(position:Point,velocity:Point,other:Point,otherVelocity:Point,horizon=3) {
  const r={x:position.x-other.x,y:position.y-other.y,z:position.z-other.z},v={x:velocity.x-otherVelocity.x,y:velocity.y-otherVelocity.y,z:velocity.z-otherVelocity.z}
  const dot=r.x*v.x+r.y*v.y+r.z*v.z, square=v.x*v.x+v.y*v.y+v.z*v.z
  const time=square>.0001?clamp(-dot/square,0,horizon):0
  return{distance:Math.hypot(r.x+v.x*time,r.y+v.y*time,r.z+v.z*time),time,closing:dot<-.5,relativeSpeed:Math.sqrt(square)}
}
export function planCompanionRoute(id:number,near:boolean,context:LivingContext,surface:(x:number,z:number)=>number,travelSpeed=28):CompanionRoute|null {
  const observation=distance(context.camera,context.player)>100||travelSpeed<5
  const encounter=near&&!observation,side=id%2===0?1:-1,spread=encounter?84+(id%2)*6:near?36:90+(id%3)*18
  const forward=encounter?-24:near?150:260+(id%3)*22,anchor=observation?context.camera:context.player
  const start={x:anchor.x+Math.sin(context.heading)*forward+Math.cos(context.heading)*spread*side,y:anchor.y+(near?-12:-3)+(id%3)*2,z:anchor.z-Math.cos(context.heading)*forward+Math.sin(context.heading)*spread*side}
  const route:CompanionRoute={id,near,start,heading:context.heading,side,duration:encounter?88:68,speed:observation?18:clamp(travelSpeed,14,36)*1.07,encounter,initialSide:spread,observation}
  // Birth and the first twelve seconds are known. Future ground is checked on
  // the actor's actual integrated turn, not just this original guide curve.
  let floor=start.y
  const samples=Math.ceil(route.speed*12/10)
  for(let i=0;i<=samples;i++){const p=routePoint(route,12*i/samples),height=surface(p.x,p.z);if(!Number.isFinite(height))return null;floor=Math.max(floor,height+18)}
  start.y=floor
  if(distance(start,context.camera)<75||distance(start,context.player)<75)return null
  return route
}
export interface CompanionMotion {
  position:MutablePoint;velocity:MutablePoint;acceleration:MutablePoint;cruiseSpeed:number;heading:number;turnRate:number
  avoiding:boolean;avoidSide:number;avoidUntil:number;avoidWeight:number;clearance:number;predictedClearance:number;terrainClimb:number
}
export function createCompanionMotion(route:CompanionRoute):CompanionMotion {
  return{position:{...route.start},velocity:{x:Math.sin(route.heading)*route.speed,y:0,z:-Math.cos(route.heading)*route.speed},acceleration:{x:0,y:0,z:0},cruiseSpeed:route.speed,heading:route.heading,turnRate:0,avoiding:false,avoidSide:route.side,avoidUntil:0,avoidWeight:0,clearance:Infinity,predictedClearance:Infinity,terrainClimb:0}
}
interface MotionInput {route:CompanionRoute;age:number;now:number;player:Point;playerVelocity:Point;departing:boolean;forecast?:boolean;cruiseTarget?:number}
/** Choose the side once, using bounded acceleration rather than an instant velocity ray. */
function chooseAvoidSide(state:CompanionMotion,input:MotionInput,preferred:number):number {
  const score=(side:number)=>{
    const copy:CompanionMotion={...state,position:{...state.position},velocity:{...state.velocity},acceleration:{...state.acceleration},avoiding:true,avoidSide:side,avoidUntil:Infinity}
    let minimum=Infinity
    for(let time=0;time<6;time+=.1){
      const player={x:input.player.x+input.playerVelocity.x*time,y:input.player.y+input.playerVelocity.y*time,z:input.player.z+input.playerVelocity.z*time}
      advanceCompanionMotion(copy,{...input,age:input.age+time,now:input.now+time,player},.1)
      minimum=Math.min(minimum,distance(copy.position,player))
    }
    return minimum
  }
  const chosen=score(preferred),opposite=score(-preferred)
  return opposite>chosen+2?-preferred:preferred
}
/** No radial offsets: position, speed and heading all follow this one integrator. */
export function advanceCompanionMotion(state:CompanionMotion,input:MotionInput,delta:number) {
  const steps=Math.max(1,Math.ceil(clamp(delta,0,.1)*30)),dt=clamp(delta,0,.1)/steps
  if(dt===0)return
  const playerSpeed=Math.hypot(input.playerVelocity.x,input.playerVelocity.z)
  const guide=routePoint(input.route,input.age),ahead=routePoint(input.route,input.age+1)
  const tangent=Math.atan2(ahead.x-guide.x,-(ahead.z-guide.z))
  const routeCos=Math.cos(input.route.heading),routeSin=Math.sin(input.route.heading)
  const weightBlend=1-Math.exp(-dt/1.1),cruiseBlend=1-Math.exp(-dt/6)
  for(let step=0;step<steps;step++){
    state.cruiseSpeed+=((input.cruiseTarget??input.route.speed)-state.cruiseSpeed)*cruiseBlend
    const relativeSpeed=distance(state.velocity,input.playerVelocity)
    // A fast opposing crossing needs earlier notice than a slow overtake.
    const horizon=relativeSpeed>40||playerSpeed>Math.hypot(state.velocity.x,state.velocity.z)*1.15?6:3
    const approach=closestApproach(state.position,state.velocity,input.player,input.playerVelocity,horizon)
    state.clearance=distance(state.position,input.player);state.predictedClearance=approach.distance
    const entering=approach.closing&&((state.clearance<70&&approach.distance<60)||(approach.distance<38&&approach.time>0))
    if(!state.avoiding&&entering){state.avoiding=true;state.avoidUntil=input.now+3
      const side=(state.position.x-input.player.x)*routeCos+(state.position.z-input.player.z)*routeSin
      const preferred=Math.abs(side)>3?Math.sign(side):input.route.side
      state.avoidSide=input.forecast?preferred:chooseAvoidSide(state,input,preferred)
    }
    if(state.avoiding&&input.now>=state.avoidUntil&&state.clearance>85&&approach.distance>75)state.avoiding=false
    const wantedWeight=state.avoiding?Math.max(.2,smooth((70-approach.distance)/45)):0
    state.avoidWeight+=(wantedWeight-state.avoidWeight)*weightBlend
    const lateral=(guide.x-state.position.x)*routeCos+(guide.z-state.position.z)*routeSin
    const returnTurn=clamp(lateral/150,-.24,.24)*(1-state.avoidWeight)
    const outward=state.avoidSide*state.avoidWeight*.52+(input.departing?input.route.side*.32:0)
    const desiredHeading=tangent+returnTurn+outward
    const yieldingSpeed=Math.max(state.cruiseSpeed*1.095,Math.min(42.48,playerSpeed*1.12))
    const desiredSpeed=state.cruiseSpeed+(yieldingSpeed-state.cruiseSpeed)*state.avoidWeight
    const desired={x:Math.sin(desiredHeading)*desiredSpeed,y:state.terrainClimb,z:-Math.cos(desiredHeading)*desiredSpeed}
    // Ordinary acceleration <=2 m/s². An already tight opposing approach has a
    // bounded, jerk-smoothed safety allowance; it does not teleport or vanish.
    const urgency=approach.closing?smooth((3.5-approach.time)/2)*smooth((40-approach.distance)/30):0
    const maximumAcceleration=2+2.5*urgency
    const target=limited({x:(desired.x-state.velocity.x)/1.3,y:(desired.y-state.velocity.y)/1.3,z:(desired.z-state.velocity.z)/1.3},maximumAcceleration)
    const change=limited({x:target.x-state.acceleration.x,y:target.y-state.acceleration.y,z:target.z-state.acceleration.z},(3+urgency)*dt)
    state.acceleration.x+=change.x;state.acceleration.y+=change.y;state.acceleration.z+=change.z
    state.velocity.x+=state.acceleration.x*dt;state.velocity.y+=state.acceleration.y*dt;state.velocity.z+=state.acceleration.z*dt
    const speed=Math.hypot(state.velocity.x,state.velocity.z),candidate=Math.atan2(state.velocity.x,-state.velocity.z)
    const turn=clamp(wrapAngle(candidate-state.heading),-Math.PI/18*dt,Math.PI/18*dt)
    state.heading=wrapAngle(state.heading+turn);state.turnRate=turn/dt
    state.velocity.x=Math.sin(state.heading)*speed;state.velocity.z=-Math.cos(state.heading)*speed
    state.position.x+=state.velocity.x*dt;state.position.y+=state.velocity.y*dt;state.position.z+=state.velocity.z*dt
  }
}
/** Only an exactly settled straight patrol qualifies; turns and crossings rehearse fully. */
export function hasStraightCompanionForecast(state:CompanionMotion,input:MotionInput):boolean {
  return !input.route.encounter&&!input.departing&&!state.avoiding&&state.avoidWeight<1e-8&&
    Math.abs(state.cruiseSpeed-(input.cruiseTarget??input.route.speed))<1e-8&&
    input.age+3<input.route.duration*.68&&state.terrainClimb===0&&magnitude(state.acceleration)<1e-8&&
    Math.abs(state.velocity.y)<1e-8&&Math.abs(Math.hypot(state.velocity.x,state.velocity.z)-state.cruiseSpeed)<1e-8&&
    Math.abs(wrapAngle(state.heading-input.route.heading))<1e-8&&
    Math.abs((state.position.x-input.route.start.x)*Math.cos(input.route.heading)+(state.position.z-input.route.start.z)*Math.sin(input.route.heading))<1e-7&&
    closestApproach(state.position,state.velocity,input.player,input.playerVelocity,6).distance>85
}
/** Rehearse actual steering with <=10m samples. A settled straight path is analytic. */
export function terrainAhead(state:CompanionMotion,input:MotionInput,surface:(x:number,z:number)=>number) {
  const straight=hasStraightCompanionForecast(state,input)
  const projected:CompanionMotion={...state,position:{...state.position},velocity:{...state.velocity},acceleration:{...state.acceleration}}
  const player={...input.player},forecast:MotionInput={...input,player,forecast:true}
  let climb=0,travelled=Infinity,lastX=projected.position.x,lastY=projected.position.y,lastZ=projected.position.z
  for(let elapsed=0;elapsed<=3.001;elapsed+=.1){
    travelled+=Math.hypot(projected.position.x-lastX,projected.position.y-lastY,projected.position.z-lastZ)
    lastX=projected.position.x;lastY=projected.position.y;lastZ=projected.position.z
    if(travelled>=7||travelled+magnitude(projected.velocity)*.1+.03>10||elapsed>=2.99){
      travelled=0
      const ground=surface(projected.position.x,projected.position.z)
      if(!Number.isFinite(ground))return{time:elapsed,climb}
      if(ground+12>projected.position.y)return{time:elapsed,climb:Math.max(climb,6)}
      if(ground+22>projected.position.y)climb=Math.max(climb,3)
    }
    if(straight){
      projected.position.x+=state.velocity.x*.1;projected.position.y+=state.velocity.y*.1;projected.position.z+=state.velocity.z*.1
    }else{
      forecast.age=input.age+elapsed;forecast.now=input.now+elapsed
      player.x=input.player.x+input.playerVelocity.x*elapsed;player.y=input.player.y+input.playerVelocity.y*elapsed;player.z=input.player.z+input.playerVelocity.z*elapsed
      advanceCompanionMotion(projected,forecast,.1)
    }
  }
  return{time:Infinity,climb}
}
export function companionGeometryLod(nearCohort:boolean,distanceMetres:number,previous:'source'|'far',farAvailable:boolean):'source'|'far' {
  if(!farAvailable)return 'source'
  if(!nearCohort)return 'far'
  // Fraction of vertical screen span at the runtime's 55-degree camera FOV.
  // Hysteresis prevents repeated geometry swaps as flight oscillates at a boundary.
  const projectedHeight=7/(2*Math.max(1,distanceMetres)*Math.tan(55*Math.PI/360))
  return previous==='source'?(projectedHeight<.052?'far':'source'):(projectedHeight>.072?'source':'far')
}
/** Retain each ID's phase after slow frames; scheduling from `now + .1` coalesces actors. */
export function nextCompanionTerrainTime(now:number,id:number):number {
  const phase=((id*.618033988749895)%1)*.1
  return (Math.floor((now-phase)/.1+1e-9)+1)*.1+phase
}
interface Bird { lod:'source'|'far'; route:CompanionRoute;born:number;motion:CompanionMotion;departure:number|null;safetyExpiry:number;nextTerrain:number;visual:CompanionInstance;wrapper:Group }
export class CompanionDirector {
  readonly root = new Group()
  private readonly birds: Bird[] = []
  private far: FarCompanionTemplate | null = null
  private loading = false
  private loadFailed = false
  private quality: LivingContext['quality'] = 'low'
  private revision = 0
  private disposed = false
  private enabled = false
  private generation: number | null = null
  private nextSpawn = 0
  private serial = 0
  private localTime = 0
  private lastMotion: number | null = null
  private readonly material: Material | Material[] | null
  private readonly modelScale: number
  private readonly surface: (x:number,z:number)=>number
  private rejected = 0
  private travelSpeed = 28
  private previousPlayer: Point | null = null
  private previousCamera: Point | null = null
  constructor(scene: Object3D, private readonly world: WorldSampler, private readonly heroRoot: Object3D, private readonly clip: AnimationClip, safeSurface?: (x:number,z:number)=>number,private readonly species:FlightSpeciesProfile=DEFAULT_FLIGHT_SPECIES) {
    scene.add(this.root); this.root.name='Living companions'
    this.surface=safeSurface??world.safeSurface
    // Match the hero correction group exactly; retain its source-space center.
    this.modelScale=heroRoot.parent?heroRoot.getWorldScale(new Vector3()).x/heroRoot.scale.x:7/1.01251906
    let material: Material | Material[] | null=null
    heroRoot.traverse(object=>{if(material===null&&object instanceof Mesh)material=(object as Mesh<BufferGeometry,Material|Material[]>).material})
    this.material=material
  }
  get metrics() {
    const near=this.birds.filter(b=>b.route.near).length,far=this.birds.length-near
    const budgetTransition=this.quality==='low'&&(near>1||far>3)
    return {near,far,loading:this.loading,status:!this.enabled?'off':this.loadFailed?'degraded':this.loading?'loading':'ready',
      triangles:this.birds.reduce((sum,bird)=>sum+(bird.lod==='source'?this.species.companionTriangles.near:this.species.companionTriangles.far),0),sourceLod:this.birds.filter(bird=>bird.lod==='source').length,budgetTransition,budgetTransitionMaxEffectiveSeconds:6,
      rejectedRoutes:this.rejected,resourceReferences:this.far?.references??0,
      actors:this.birds.map(bird=>({id:bird.route.id,phase:bird.departure!==null?'departing':bird.motion.avoiding?'yielding':'patrol',distance:bird.motion.clearance,predictedDistance:bird.motion.predictedClearance,speed:magnitude(bird.motion.velocity),cruiseSpeed:bird.motion.cruiseSpeed,acceleration:magnitude(bird.motion.acceleration),turnDegreesPerSecond:bird.motion.turnRate*180/Math.PI,avoidWeight:bird.motion.avoidWeight}))}
  }
  cameraSpheres() { return this.birds.map(bird=>({position:{...bird.motion.position},radius:16})) }
  private clearBirds() { for(const bird of this.birds) { bird.visual.dispose(); bird.wrapper.removeFromParent() } this.birds.length=0 }
  private stop() {
    this.revision++;this.loading=false;this.loadFailed=false;this.clearBirds();this.far?.dispose();this.far=null
  }
  private load() {
    if(this.loading||this.loadFailed||this.far||this.material===null)return
    this.loading=true;const revision=this.revision
    void loadFarCompanionTemplate(this.material,this.species.id,this.heroRoot).then(library=>{
      if(this.disposed||!this.enabled||revision!==this.revision){library.dispose();return}
      this.loading=false;this.far=library
    },()=>{if(revision===this.revision){this.loading=false;this.loadFailed=true}})
  }
  update(context: LivingContext, origin: Readonly<{x:number;z:number}>) {
    if(this.disposed)return
    this.quality=context.quality
    if(this.generation!==context.generation){this.stop();this.generation=context.generation;this.nextSpawn=this.localTime+3;this.lastMotion=null}
    if(this.enabled!==context.intent.companions){
      this.enabled=context.intent.companions;this.revision++;this.loading=false;this.loadFailed=false;this.nextSpawn=this.localTime+3
      if(!this.enabled)for(const bird of this.birds)bird.departure??=this.localTime
    }
    if(!this.enabled&&!context.active)this.stop()
    if(!this.enabled&&this.birds.length===0){this.far?.dispose();this.far=null;return}
    if(this.enabled)this.load()
    const dt=context.active?Math.max(0,Math.min(context.delta,.1)):0
    const playerSpeed=context.playerVelocity??(this.previousPlayer&&dt>0?{
      x:(context.player.x-this.previousPlayer.x)/dt,y:(context.player.y-this.previousPlayer.y)/dt,z:(context.player.z-this.previousPlayer.z)/dt,
    }:{x:0,y:0,z:0})
    // Authoritative simulation velocity is unaffected by render interpolation.
    // Birth estimates and existing patrols each smooth changes independently.
    if(context.active&&context.delta>0){
      const measured=Math.hypot(playerSpeed.x,playerSpeed.z)
      if(measured<50)this.travelSpeed+=(measured-this.travelSpeed)*(1-Math.exp(-context.delta/1.5))
    }
    if(context.active){this.localTime+=Math.max(0,Math.min(context.delta,.1));this.lastMotion=context.motionSeconds}
    const now=this.localTime
    if(context.active&&this.enabled&&now>=this.nextSpawn&&context.weather.resolved.rain<.08){this.spawn(context);this.nextSpawn=now+82}
    let near=0,far=0
    for(const bird of this.birds){
      const over=context.quality==='low'&&(bird.route.near?++near>1:++far>3)
      if(over||context.weather.resolved.rain>=.08)bird.departure??=now
    }
    const teleported=this.previousCamera!==null&&distance(context.camera,this.previousCamera)>100
    if(teleported){for(const bird of this.birds)bird.departure??=now;this.nextSpawn=now+7}
    for(let i=this.birds.length-1;i>=0;i--){
      const bird=this.birds[i]!,age=now-bird.born
      const observedSpeed=Math.hypot(playerSpeed.x,playerSpeed.z)
      const cruiseTarget=bird.route.observation?18:observedSpeed>2?clamp(observedSpeed,14,36)*1.07:bird.motion.cruiseSpeed
      const input:MotionInput={route:bird.route,age,now,player:context.player,playerVelocity:playerSpeed,departing:bird.departure!==null,cruiseTarget}
      // Checks are phase-spread by stable ID. Their rehearsal follows the same
      // turn/acceleration integrator as the live actor, including its avoidance.
      if(dt>0&&now>=bird.nextTerrain){
        bird.nextTerrain=nextCompanionTerrainTime(now,bird.route.id)
        const safety=terrainAhead(bird.motion,input,this.surface)
        bird.motion.terrainClimb=safety.climb
        if(Number.isFinite(safety.time)){
          bird.departure??=now
          bird.safetyExpiry=Math.min(bird.safetyExpiry,now+Math.max(0,safety.time-.2))
        }
      }
      const old={...bird.motion.position}
      advanceCompanionMotion(bird.motion,input,dt)
      const current=bird.motion.position
      const cameraClearance=segmentDistance(old,current,context.camera)
      // Camera clearance is a lens constraint, not the player's comfort zone.
      // Only a camera teleport/actual imminent overlap is an emergency exit.
      const emergency=(teleported&&cameraClearance<25)||cameraClearance<12
      const departureAge=bird.departure===null?0:now-bird.departure
      if(age>=bird.route.duration||departureAge>=6||now>=bird.safetyExpiry||emergency||distance(current,context.camera)>2200){bird.visual.dispose();bird.wrapper.removeFromParent();this.birds.splice(i,1);continue}
      const lod=companionGeometryLod(bird.route.near,distance(current,context.camera),bird.lod,this.far!==null)
      if(lod!==bird.lod){
        const replacement=this.makeVisual(lod,bird.route.id)
        if(replacement){bird.wrapper.add(replacement.root);bird.visual.dispose();bird.visual=replacement;bird.lod=lod}
      }
      bird.wrapper.position.set(current.x-origin.x,current.y,current.z-origin.z)
      bird.wrapper.rotation.y=(this.species.id==='pteranodon'?bird.motion.heading:-bird.motion.heading)+this.species.yaw
      const bank=clamp(-bird.motion.turnRate*1.2,context.gentle?-.1:-.2,context.gentle?.1:.2)
      bird.wrapper.rotation.z+=(bank-bird.wrapper.rotation.z)*(1-Math.exp(-dt/1.2))
      bird.visual.setOpacity(Math.min(1,age/4,(bird.route.duration-age)/6,1-departureAge/6,Number.isFinite(bird.safetyExpiry)?Math.max(0,(bird.safetyExpiry-now)/1.5):1))
      bird.visual.setMotionSeconds((this.lastMotion??context.motionSeconds)*.7)
    }
    this.previousPlayer={...context.player};this.previousCamera={...context.camera}
  }
  private spawn(context: LivingContext) {
    const nearLimit=context.quality==='low'?1:2,farLimit=context.quality==='low'?3:6
    // Existing birds finish their routes across quality/weather changes. A new
    // cohort never exceeds the requested quality's available slots.
    const existingNear=this.birds.filter(b=>b.route.near).length, existingFar=this.birds.length-existingNear
    for(let i=0;i<nearLimit+farLimit;i++){
      const near=i<nearLimit
      if(near?i<existingNear:i-nearLimit<existingFar)continue
      if(!near&&!this.far)continue
      const id=this.serial++ + (this.world.config.seed%101),route=planCompanionRoute(id,near,context,this.surface,this.travelSpeed)
      if(!route){this.rejected++;continue}
      const lod=companionGeometryLod(near,distance(route.start,context.camera),'source',this.far!==null)
      const visual=this.makeVisual(lod,id)
      if(!visual)continue
      const wrapper=new Group();wrapper.scale.setScalar(this.modelScale);wrapper.rotation.y=(this.species.id==='pteranodon'?route.heading:-route.heading)+this.species.yaw;wrapper.add(visual.root);this.root.add(wrapper)
      visual.setOpacity(0)
      this.birds.push({lod,route,born:this.localTime,motion:createCompanionMotion(route),departure:null,safetyExpiry:Infinity,nextTerrain:nextCompanionTerrainTime(this.localTime,id),visual,wrapper})
    }
  }
  private makeVisual(lod:'source'|'far',id:number):CompanionInstance|null {
    const options={phase:id*.73,independentMaterials:true}
    const visual=lod==='source'?createCompanion(this.heroRoot,this.clip,options):this.far?.create(options)
    if(!visual)return null
    visual.root.position.copy(this.heroRoot.position);visual.root.rotation.copy(this.heroRoot.rotation);visual.root.scale.copy(this.heroRoot.scale)
    return visual
  }
  dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.stop();this.root.removeFromParent()}
}
