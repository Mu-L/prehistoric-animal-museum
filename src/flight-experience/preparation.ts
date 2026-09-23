export type PreparationPhase='assets'|'world'|'warmup'|'preview'|'ready'|'detail'|'error'
/** Session-local milestones and active work budgets. Values are milliseconds,
 * not a fabricated percentage or a GPU-memory measurement. */
export class FlightPreparation {
 readonly startedAt:number
 readonly milestones:Partial<Record<PreparationPhase,number>>={}
 phase:PreparationPhase='assets'
 activeElapsed=0
 phaseElapsed=0
 private previous:number
 private available=true
 constructor(now:number){this.startedAt=this.previous=now}
 mark(phase:PreparationPhase,now:number){this.tick(now);if(this.phase!==phase)this.phaseElapsed=0;this.phase=phase;this.milestones[phase]??=now-this.startedAt}
 /** Settle the old permission through the event boundary before changing it. */
 setAvailable(now:number,available:boolean){const expired=this.tick(now,this.available);this.available=available;return expired}
 tick(now:number,active=this.available){
  const delta=Math.max(0,now-this.previous);this.previous=now
  if(active){this.activeElapsed+=delta;this.phaseElapsed+=delta}
  return this.phaseElapsed>20000||this.activeElapsed>60000
 }
 snapshot(){return {phase:this.phase,activeElapsed:this.activeElapsed,phaseElapsed:this.phaseElapsed,milestones:{...this.milestones}}}
}
