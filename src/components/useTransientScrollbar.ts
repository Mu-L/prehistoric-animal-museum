import { useCallback, useEffect, useRef, useState } from 'react'

const SCROLLBAR_IDLE_DELAY_MS = 700

export function useTransientScrollbar() {
  const hideTimerRef = useRef<number | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)

  const handleScroll = useCallback(() => {
    setIsScrolling(true)
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = window.setTimeout(() => {
      hideTimerRef.current = null
      setIsScrolling(false)
    }, SCROLLBAR_IDLE_DELAY_MS)
  }, [])

  useEffect(
    () => () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current)
      }
    },
    [],
  )

  return { handleScroll, isScrolling }
}
