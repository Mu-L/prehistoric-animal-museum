import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Footprints } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import {
  ViewerController,
  ViewerUnavailableError,
  type ViewerFailure,
} from '../viewer/ViewerController'
import type { ModelCache } from '../viewer/model-cache'
import { modelPreviewFor } from '../viewer/responsive-model-stills'
import { useModelPreviewProfile } from '../viewer/use-model-preview-profile'

interface ViewerStageProps {
  animalId: string
  failureMessage: string | null
  initialLoading: boolean
  label: string
  loadingPhase: 'checking-cache' | 'downloading' | 'preparing' | null
  loadingPercent: number | null
  modelCache: ModelCache
  modelReady: boolean
  onControllerReady: (controller: ViewerController | null) => void
  onFirstFrameRendered: (animalId: string) => void
  onRetry: () => void
  onViewerFailure: (failure: ViewerFailure) => void
  posterUrl: string
  posterPortraitUrl: string
}

type ReviewCanvas = HTMLCanvasElement & {
  __museumReviewSetAnimationTime?: (time: number | null) => boolean
}

export function ViewerStage({
  animalId,
  failureMessage,
  initialLoading,
  label,
  loadingPhase,
  loadingPercent,
  modelCache,
  modelReady,
  onControllerReady,
  onFirstFrameRendered,
  onRetry,
  onViewerFailure,
  posterUrl,
  posterPortraitUrl,
}: ViewerStageProps) {
  const { messages } = useI18n()
  const stageRef = useRef<HTMLDivElement>(null)
  const compositionFrameRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [initialOverlayMounted, setInitialOverlayMounted] = useState(true)
  const [viewportSize, setViewportSize] = useState<{
    readonly height: number
    readonly width: number
  } | null>(null)
  const previewProfile = useModelPreviewProfile()
  const previewUrl =
    modelPreviewFor(animalId, previewProfile.fileName) ??
    (previewProfile.height > previewProfile.width
      ? posterPortraitUrl
      : posterUrl)

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) {
      return
    }
    const update = () => {
      const availableWidth = Math.max(stage.clientWidth, 1)
      const availableHeight = Math.max(stage.clientHeight, 1)
      const aspect = previewProfile.width / previewProfile.height
      const width = Math.min(availableWidth, availableHeight * aspect)
      const height = width / aspect
      setViewportSize((current) => {
        if (
          current &&
          Math.abs(current.width - width) < 0.5 &&
          Math.abs(current.height - height) < 0.5
        ) {
          return current
        }
        return { height, width }
      })
    }
    update()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update)
      return () => {
        window.removeEventListener('resize', update)
      }
    }
    const observer = new ResizeObserver(update)
    observer.observe(stage)
    return () => {
      observer.disconnect()
    }
  }, [previewProfile.height, previewProfile.width])

  useEffect(() => {
    if (!modelReady) {
      return
    }
    const timeout = window.setTimeout(() => {
      setInitialOverlayMounted(false)
    }, 420)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [modelReady])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      onControllerReady(null)
      return
    }

    let controller: ViewerController
    try {
      controller = new ViewerController(container, {
        ...(compositionFrameRef.current
          ? { compositionFrame: compositionFrameRef.current }
          : {}),
        modelCache,
        onFailure: onViewerFailure,
        onModelReady: onFirstFrameRendered,
      })
    } catch (error) {
      if (!(error instanceof ViewerUnavailableError)) {
        console.error(error)
      }
      onControllerReady(null)
      return
    }
    onControllerReady(controller)
    const reviewCanvas = container.querySelector<ReviewCanvas>(
      '.viewer-canvas',
    )
    if (
      import.meta.env.MODE === 'review' ||
      import.meta.env.MODE === 'model-still'
    ) {
      if (reviewCanvas) {
        reviewCanvas.__museumReviewSetAnimationTime = (time) =>
          controller.setReviewAnimationTime(time)
      }
    }

    return () => {
      if (reviewCanvas) {
        delete reviewCanvas.__museumReviewSetAnimationTime
      }
      onControllerReady(null)
      controller.destroy()
    }
  }, [
    modelCache,
    onControllerReady,
    onFirstFrameRendered,
    onViewerFailure,
  ])

  const revealPhase = failureMessage
    ? 'failure'
    : modelReady
      ? 'exiting'
      : 'loading'
  const showModelStill = initialOverlayMounted || Boolean(failureMessage)

  return (
    <div
      className="viewer-stage"
      data-initial-loading={initialLoading}
      data-model-ready={modelReady}
      data-reveal-phase={revealPhase}
      ref={stageRef}
    >
      <div
        className="model-viewport"
        data-preview-profile={previewProfile.key}
      >
        <div className="viewer-host" ref={containerRef} />
      </div>
      <div
        className="model-composition-frame"
        ref={compositionFrameRef}
        style={{
          height: viewportSize?.height ?? 1,
          visibility: viewportSize ? 'visible' : 'hidden',
          width: viewportSize?.width ?? 1,
        }}
      >
        {showModelStill ? (
          <picture aria-hidden="true" className="model-still">
            <img
              alt={messages.viewer.stillAlt(label)}
              decoding="async"
              fetchPriority="high"
              src={previewUrl}
            />
          </picture>
        ) : null}
        {initialOverlayMounted && !failureMessage ? (
          <div
            aria-atomic="true"
            aria-live="polite"
            className="stage-loading"
            role="status"
          >
            <span aria-hidden="true" className="fossil-loader">
              <span className="fossil-loader__ring" />
              <Footprints size={30} strokeWidth={2} />
            </span>
            <strong>
              {loadingPhase === 'preparing'
                ? messages.viewer.preparing
                : loadingPhase === 'downloading'
                  ? loadingPercent === null
                    ? messages.viewer.downloading
                    : messages.viewer.downloadingPercent(loadingPercent)
                  : loadingPhase === 'checking-cache'
                    ? messages.viewer.checkingCache
                    : messages.viewer.invitingFirst}
            </strong>
            <progress
              aria-label={messages.viewer.progressLabel}
              className="model-load-progress"
              max={100}
              {...(loadingPhase !== 'downloading' || loadingPercent === null
                ? {}
                : { value: loadingPercent })}
            />
          </div>
        ) : null}
        {modelReady ? (
          <p aria-hidden="true" className="model-gesture-hint">
            {messages.viewer.gestureHint}
          </p>
        ) : null}
        {failureMessage ? (
          <div className="model-fallback" role="status">
            <strong>{messages.viewer.fallbackTitle}</strong>
            <span>{failureMessage}</span>
            <button
              className="friendly-button friendly-button--small"
              onClick={onRetry}
              type="button"
            >
              {messages.viewer.retry}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
