import type {Texture} from 'three'

/** Pumped only by the existing renderer loop. A texture upload is indivisible;
 * bound work to one texture per frame rather than claiming byte preemption. */
export class ExperienceWarmup {
 readonly promise:Promise<void>
 private resolve!:()=>void
 private reject!:(error:unknown)=>void
 private generation=0
 private compiled=false
 private cursor=0
 private ended=false
 readonly textures:Texture[]
 constructor(textures:readonly Texture[],private readonly compile:()=>Promise<unknown>){
  this.textures=[...new Set(textures)]
  this.promise=new Promise<void>((resolve,reject)=>{this.resolve=resolve;this.reject=reject})
  this.restart()
 }
 restart(){
  if(this.ended)return
  const generation=++this.generation;this.compiled=false;this.cursor=0
  void Promise.resolve().then(()=>{if(!this.ended&&generation===this.generation)return this.compile()}).then(()=>{if(!this.ended&&generation===this.generation)this.compiled=true},error=>{if(generation===this.generation)this.finish(error)})
 }
 /** True means retain the last canvas frame; no completion callback is due. */
 step(upload:(texture:Texture)=>void):boolean{
  if(this.ended)return false
  if(!this.compiled)return true
  try {
   const texture=this.textures[this.cursor]
   if(texture){upload(texture);this.cursor++}
   if(this.cursor===this.textures.length)this.finish()
  }catch(error){this.finish(error)}
  return true
 }
 cancel(){this.finish(new DOMException('Experience closed','AbortError'))}
 private finish(error?:unknown){if(this.ended)return;this.ended=true;this.generation++;this.textures.length=0;if(error!==undefined)this.reject(error);else this.resolve()}
 get done(){return this.ended}
}
