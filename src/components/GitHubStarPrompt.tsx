import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Star } from 'lucide-react'
import {
  GITHUB_REPOSITORY_URL,
  GITHUB_STAR_PROMPT_DELAY_MS,
  GITHUB_STAR_PROMPT_VISIBLE_MS,
  recordGitHubStarPromptDismissed,
  recordGitHubStarPromptOpened,
  shouldSuppressGitHubStarPrompt,
} from '../github'

interface GitHubStarPromptProps {
  readonly blocked: boolean
  readonly start: boolean
}

function readInitialSuppression(): boolean {
  try {
    return shouldSuppressGitHubStarPrompt(window.localStorage)
  } catch {
    return false
  }
}

export function GitHubStarPrompt({
  blocked,
  start,
}: GitHubStarPromptProps) {
  const remainingMsRef = useRef(GITHUB_STAR_PROMPT_DELAY_MS)
  const startedAtRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const [elapsed, setElapsed] = useState(false)
  const [suppressed, setSuppressed] = useState(readInitialSuppression)
  const visible = elapsed && !suppressed && !blocked

  useEffect(() => {
    if (!start || suppressed || elapsed) {
      return
    }

    const pause = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (startedAtRef.current !== null) {
        remainingMsRef.current = Math.max(
          0,
          remainingMsRef.current - (Date.now() - startedAtRef.current),
        )
        startedAtRef.current = null
      }
    }
    const schedule = () => {
      if (document.visibilityState === 'hidden') {
        return
      }
      if (remainingMsRef.current <= 0) {
        setElapsed(true)
        return
      }
      startedAtRef.current = Date.now()
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null
        startedAtRef.current = null
        remainingMsRef.current = 0
        setElapsed(true)
      }, remainingMsRef.current)
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pause()
      } else {
        schedule()
      }
    }

    schedule()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      pause()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [elapsed, start, suppressed])

  const dismiss = useCallback(() => {
    try {
      recordGitHubStarPromptDismissed(window.localStorage)
    } catch {
      // A blocked localStorage must not make the museum or prompt unusable.
    }
    setSuppressed(true)
  }, [])

  const handleOpen = useCallback(() => {
    try {
      recordGitHubStarPromptOpened(window.localStorage)
    } catch {
      // Opening GitHub still works when persistent storage is unavailable.
    }
    setSuppressed(true)
  }, [])

  useEffect(() => {
    if (!visible) {
      return
    }
    const timer = window.setTimeout(dismiss, GITHUB_STAR_PROMPT_VISIBLE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [dismiss, visible])

  if (!visible) {
    return null
  }

  return (
    <aside
      aria-label="支持这座博物馆"
      aria-live="polite"
      className="github-star-toast"
    >
      <span aria-hidden="true" className="github-star-toast__icon">
        <Star size={19} strokeWidth={2.2} />
      </span>
      <div className="github-star-toast__copy">
        <strong>喜欢这座小博物馆吗？</strong>
        <p>可以去 GitHub 点一颗 Star，帮助更多家庭看到它。</p>
      </div>
      <div className="github-star-toast__actions">
        <a
          href={GITHUB_REPOSITORY_URL}
          onClick={handleOpen}
          rel="noreferrer"
          target="_blank"
        >
          <span>去 GitHub</span>
          <ExternalLink aria-hidden="true" size={15} strokeWidth={2} />
        </a>
        <button onClick={dismiss} type="button">
          暂时不用
        </button>
      </div>
    </aside>
  )
}
