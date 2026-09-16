import { Group, PerspectiveCamera, type Scene } from 'three'
import { EnvironmentScene } from './environment/environment-scene'
import type { SolarPreset } from './environment/environment-state'
import { PropStream } from './props/prop-stream'
import { createWorldSampler, type Address } from './world'
/** Scene resources belong to this flight session; no renderer or independent clock. */
export class FlightScenery {
  readonly root = new Group()
  readonly environment: EnvironmentScene
  readonly props: PropStream
  readonly review = { hideProps: false, flatWater: false, freezeWater: false, oceanEdges: false, skyColors: false, shadows: true }
  preset: SolarPreset = 'noon'
  private origin: Address = {x:0,z:0}
  private disposed = false
  private readonly fallbackCamera = new PerspectiveCamera(55,1,.5,6000)
  constructor(scene: Scene, wake: () => void, surface: (x: number,z: number)=>number = (x,z)=>createWorldSampler().terrainAt(x,z).height, world = createWorldSampler()) {
    scene.add(this.root)
    this.environment = new EnvironmentScene(scene, surface)
    this.props = new PropStream(this.root, wake, surface, world, material => this.environment.fog.decorate(material))
  }
  get sky() { return this.environment.sky }
  get metrics() { return this.props.metrics }
  get busy() { return this.props.busy || this.environment.busy }
  update(x:number,y:number,z:number,time:number,quality:'low'|'balanced',camera?:PerspectiveCamera) {
    this.fallbackCamera.position.set(x-this.origin.x,y,z-this.origin.z)
    Object.assign(this.environment.review,{flatWater:this.review.flatWater,freezeWater:this.review.freezeWater,oceanEdges:this.review.oceanEdges,skyColors:this.review.skyColors,shadows:this.review.shadows})
    this.environment.sun.castShadow=this.review.shadows
    this.environment.update(camera ?? this.fallbackCamera,this.origin,time,quality,this.preset)
    this.props.visible=!this.review.hideProps
    this.props.update(x,y,z,quality)
  }
  relocate(origin:Address) { this.origin={...origin};this.props.relocate(origin) }
  dispose() { if(this.disposed)return;this.disposed=true;this.props.dispose();this.environment.dispose();this.root.removeFromParent() }
}
