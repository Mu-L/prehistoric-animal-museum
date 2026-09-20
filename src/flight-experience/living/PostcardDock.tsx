import {useLayoutEffect,useRef,useState} from 'react'
import {useTransientScrollbar} from '../../components/useTransientScrollbar'
import {TransientScrollbar} from '../../components/TransientScrollbar'
import {Camera,Images,X,Download} from 'lucide-react'
import type {FlightRuntime,FlightSnapshot} from '../FlightRuntime'
import './postcard.css'

/** The exact completed frame floats above the still-running scene, then joins the dock. */
export function PostcardDock({runtime,snapshot,locale,galleryOpen,onGalleryChange}:{galleryOpen?:boolean;onGalleryChange?:(open:boolean)=>void;runtime:FlightRuntime;snapshot:FlightSnapshot;locale:'en'|'zh-CN'}) {
 const zh=locale==='zh-CN',state=snapshot.photos??runtime.photos.getSnapshot()
 const [localOpen,setLocalOpen]=useState(false),[unavailable,setUnavailable]=useState(false)
 const open=galleryOpen??localOpen,setOpen=onGalleryChange??setLocalOpen
 const destination=useRef<HTMLButtonElement>(null),stage=useRef<HTMLDivElement>(null),close=useRef<HTMLButtonElement>(null)
 const {scrollRef,handleScroll,isScrolling,metrics}=useTransientScrollbar(open)
 const capture=state.capture
 useLayoutEffect(()=>{
  if(!capture)return
  const host=stage.current,target=destination.current
  if(!host||!target){runtime.photos.releaseCapture(capture.id);return}
  const canvas=capture.canvas
  host.appendChild(canvas)
  let ended=false
  const motion:{animation?:Animation}={}
  const finish=()=>{if(ended)return;ended=true;motion.animation?.cancel();canvas.remove();runtime.photos.releaseCapture(capture.id)}
  const bounds=host.getBoundingClientRect(),to=target.getBoundingClientRect()
  const scale=Math.min((to.width-8)/bounds.width,(to.height-8)/bounds.height)
  const x=to.left+to.width/2-(bounds.left+bounds.width/2),y=to.top+to.height/2-(bounds.top+bounds.height/2)
  if(document.hidden||matchMedia('(prefers-reduced-motion: reduce)').matches||!canvas.animate){finish();return}
  motion.animation=canvas.animate([
   {transform:'translate(0,0) scale(1)',borderRadius:'0px',boxShadow:'0 0 0 0px #fffaf0',offset:0},
   {transform:'translate(0,0) scale(.95)',borderRadius:'8px',boxShadow:'0 0 0 7px #fffaf0, 0 12px 40px #102d3840',offset:.24},
   {transform:`translate(${x}px,${y}px) scale(${scale})`,borderRadius:'12px',boxShadow:'0 0 0 7px #fffaf0, 0 12px 40px #102d3840',offset:1},
  ],{duration:820,easing:'cubic-bezier(.22,.7,.18,1)',fill:'forwards'})
  motion.animation.onfinish=finish
  const visibility=()=>{if(document.hidden)finish()}
  window.addEventListener('resize',finish);document.addEventListener('visibilitychange',visibility)
  return ()=>{window.removeEventListener('resize',finish);document.removeEventListener('visibilitychange',visibility);finish()}
 },[capture,runtime])
 useLayoutEffect(()=>{if(open)close.current?.focus()},[open])
 const busy=Boolean(capture)||state.status==='waiting'||state.status==='encoding'
 const photos=state.photos.filter(photo=>photo.frame!==capture?.frame)
 const dismiss=()=>{setOpen(false);destination.current?.focus()}
 return <div className="flight-postcards" onKeyDown={e=>{if(e.key==='Escape'&&open){e.stopPropagation();dismiss()}}}>
  <button className="flight-postcard-shutter" type="button" disabled={busy||snapshot.phase==='preparing'||snapshot.phase==='recovering'} onClick={()=>{runtime.input.clear();setOpen(false);setUnavailable(!runtime.requestPhoto())}} aria-label={zh?'拍张明信片':'Take a postcard'}><Camera size={20}/><span>{zh?'拍张明信片':'Take a postcard'}</span></button>
  <button ref={destination} className="flight-postcard-pocket" type="button" aria-label={zh?`查看明信片，${photos.length}张`:`View postcards, ${photos.length}`} aria-expanded={open} aria-controls="flight-postcard-gallery" onClick={()=>{runtime.input.clear();setOpen(!open)}}>
   {photos[0]?<img src={photos[0].url} alt=""/>:<Images size={22}/>}<small>{photos.length||'+'}</small>
  </button>
  <span className="flight-postcard-feedback" role="status">{state.status==='error'?(zh?'没能拍下，请再试一次':'Could not capture. Try again.'):unavailable?(zh?'等风景准备好再拍':'Wait for the scenery to be ready'):busy?(zh?'正在收好这一刻…':'Keeping this moment…'):photos.length?(zh?'已拍下，可保存':'Captured · ready to save'):''}</span>
  {capture&&<div ref={stage} className="flight-postcard-stage" aria-hidden="true"/>}
  {open&&<section id="flight-postcard-gallery" className="flight-postcard-gallery" aria-label={zh?'这一程的明信片':'Postcards from this flight'}>
   <header><div><small>{zh?'把喜欢的一刻带走':'A moment to take with you'}</small><h2>{zh?'这一程的明信片':'Your postcards'}</h2></div><button ref={close} type="button" aria-label={zh?'关闭明信片':'Close postcards'} onClick={dismiss}><X size={20}/></button></header>
   <p>{zh?'最多暂存三张。关闭飞行前，记得保存到设备。':'Up to three previews. Save to your device before leaving flight.'}</p>
   {!state.photos.length&&<div className="flight-postcard-empty"><Camera size={32}/><p>{zh?'遇见喜欢的风景，就拍一张。':'See something you love? Take a postcard.'}</p></div>}
   <div className="drawer-scroll-shell"><div ref={scrollRef} onScroll={handleScroll} className="flight-postcard-list museum-scrollbar">{state.photos.map(photo=><figure key={photo.url}><img src={photo.url} width={photo.width} height={photo.height} alt={zh?'拍下的海岸风景':'The coastal view you captured'}/><figcaption><a href={photo.url} download="prehistoric-coast.png"><Download size={16}/>{zh?'保存到设备':'Save to device'}</a><button type="button" onClick={()=>{runtime.photos.remove(photo.url);destination.current?.focus()}}>{zh?'移除':'Remove'}</button></figcaption></figure>)}</div><TransientScrollbar isScrolling={isScrolling} metrics={metrics}/></div>
  </section>}
 </div>
}
