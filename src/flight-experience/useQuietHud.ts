import {useEffect,useState,type RefObject} from 'react'

/** Fade only at rest. Focus, held controls, open panels and recovery remain visible. */
export function useQuietHud(root:RefObject<HTMLElement|null>,blocked:boolean) {
 const [idle,setIdle]=useState(false)
 useEffect(()=>{
  const element=root.current
  if(!element)return
  let timer:ReturnType<typeof setTimeout>,held=false,keyboard=false,active=true
  const arm=()=>{
   clearTimeout(timer)
   timer=setTimeout(()=>{
    const focused=document.activeElement
    if(!blocked&&!held&&!(keyboard&&focused!==element&&element.contains(focused)))setIdle(true)
   },4000)
  }
  const wake=()=>{if(!active)return;setIdle(false);arm()}
  const pointerdown=()=>{held=true;keyboard=false;wake()}
  const pointerup=()=>{held=false;wake()}
  const keydown=()=>{keyboard=true;wake()}
  queueMicrotask(wake)
  window.addEventListener('pointermove',wake);element.addEventListener('pointerdown',pointerdown)
  window.addEventListener('pointerup',pointerup);window.addEventListener('pointercancel',pointerup)
  element.addEventListener('keydown',keydown);element.addEventListener('focusin',wake);element.addEventListener('focusout',wake)
  return ()=>{
   active=false
   clearTimeout(timer)
   window.removeEventListener('pointermove',wake);element.removeEventListener('pointerdown',pointerdown)
   window.removeEventListener('pointerup',pointerup);window.removeEventListener('pointercancel',pointerup)
   element.removeEventListener('keydown',keydown);element.removeEventListener('focusin',wake);element.removeEventListener('focusout',wake)
  }
 },[root,blocked])
 return idle&&!blocked
}
