/** A scene-only pointer owner. Flight buttons keep their own independent IDs. */
export class CameraInput {
  private pointer: {id:number;x:number;y:number;startX:number;startY:number;dragging:boolean} | null = null
  constructor(private readonly element:HTMLElement,private readonly move:(yaw:number,pitch:number)=>void,private readonly finish:()=>void,private readonly zoom:(delta:number)=>void=()=>{}) {
    element.addEventListener('wheel',this.wheel,{passive:false})
    element.addEventListener('pointerdown',this.down);element.addEventListener('pointermove',this.motion)
    element.addEventListener('pointerup',this.up);element.addEventListener('pointercancel',this.up);element.addEventListener('lostpointercapture',this.up)
    window.addEventListener('blur',this.cancel);document.addEventListener('visibilitychange',this.visibility)
  }
  private wheel=(event:WheelEvent)=>{
    if(event.target!==this.element||event.ctrlKey||!Number.isFinite(event.deltaY))return
    event.preventDefault()
    const pixels=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?this.element.clientHeight:1)
    this.zoom(Math.max(-.25,Math.min(.25,pixels*.0015)))
  }
  private down=(e:PointerEvent)=>{
    if(this.pointer || (e.pointerType==='mouse'&&e.button!==0) || e.target!==this.element)return
    this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,dragging:false}
    this.element.setPointerCapture(e.pointerId)
  }
  private motion=(e:PointerEvent)=>{
    const p=this.pointer;if(!p||p.id!==e.pointerId)return
    if(e.pointerType==='mouse'&&(e.buttons&1)===0){this.cancel();return}
    const threshold=e.pointerType==='touch'?6:4
    if(!p.dragging&&Math.hypot(e.clientX-p.startX,e.clientY-p.startY)<threshold)return
    p.dragging=true
    const rect=this.element.getBoundingClientRect()
    if(rect.width>0&&rect.height>0)this.move(-(e.clientX-p.x)/rect.width*Math.PI*2,(e.clientY-p.y)/rect.height*Math.PI)
    p.x=e.clientX;p.y=e.clientY;e.preventDefault()
  }
  private up=(e:PointerEvent)=>{if(this.pointer?.id===e.pointerId)this.cancel()}
  private visibility=()=>{if(document.hidden)this.cancel()}
  cancel=()=>{
    const p=this.pointer;this.pointer=null
    if(p&&this.element.hasPointerCapture(p.id))this.element.releasePointerCapture(p.id)
    if(p?.dragging)this.finish()
  }
  dispose(){this.cancel();this.element.removeEventListener('wheel',this.wheel);this.element.removeEventListener('pointerdown',this.down);this.element.removeEventListener('pointermove',this.motion);this.element.removeEventListener('pointerup',this.up);this.element.removeEventListener('pointercancel',this.up);this.element.removeEventListener('lostpointercapture',this.up);window.removeEventListener('blur',this.cancel);document.removeEventListener('visibilitychange',this.visibility)}
}
