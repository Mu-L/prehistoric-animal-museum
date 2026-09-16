/** RG stores signed terrain height in [-128,896]m; B/A reserved. No float filtering dependency. */
export const DEPTH_MIN=-128, DEPTH_RANGE=1024, DEPTH_SIZE=130, DEPTH_STEP=16
export function encodeHeight(height:number): readonly [number,number] {
  const code=Math.round(Math.max(0,Math.min(1,(height-DEPTH_MIN)/DEPTH_RANGE))*65535)
  return [Math.floor(code/256),code%256]
}
export function decodeHeight(r:number,g:number) { return DEPTH_MIN+(r*256+g)/65535*DEPTH_RANGE }
/** Explicit nearest texels + shader bilinear interpolation avoid interpolation of packed bytes. */
export class BathymetryField {
  readonly data=new Uint8Array(DEPTH_SIZE*DEPTH_SIZE*4)
  startX=Infinity; startZ=Infinity; revision=0
  private cursor=0
  private pendingX=0; private pendingZ=0
  private readonly pending=new Uint8Array(this.data.length)
  private building=false
  private idleFrames=0
  get busy(){return this.building || this.revision===0}
  update(x:number,z:number,surface:(x:number,z:number)=>number,budgetMs=1):number {
    const sx=Math.floor(x/256)*256-1024,sz=Math.floor(z/256)*256-1024
    if(!this.building && (sx!==this.startX||sz!==this.startZ||++this.idleFrames>=30)) {this.pendingX=sx;this.pendingZ=sz;this.cursor=0;this.building=true;this.idleFrames=0}
    if(!this.building) return 0
    // Both limits apply. Complete rows are not required; old complete texture stays published.
    let count=0
    const started=performance.now()
    while(this.cursor<DEPTH_SIZE*DEPTH_SIZE && count<520) {
      if(count>0 && count%16===0 && performance.now()-started>=budgetMs) break
      const col=this.cursor%DEPTH_SIZE,row=Math.floor(this.cursor/DEPTH_SIZE)
      const [r,g]=encodeHeight(surface(this.pendingX+col*DEPTH_STEP,this.pendingZ+row*DEPTH_STEP)),i=this.cursor*4
      this.pending[i]=r;this.pending[i+1]=g;this.pending[i+3]=255;count++;this.cursor++
    }
    if(this.cursor===DEPTH_SIZE*DEPTH_SIZE){this.data.set(this.pending);this.startX=this.pendingX;this.startZ=this.pendingZ;this.revision++;this.building=false}
    return count
  }
}
