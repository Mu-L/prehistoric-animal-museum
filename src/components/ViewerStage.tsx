import { useEffect, useRef, type RefObject } from 'react'
import { Footprints } from 'lucide-react'
import {
  ViewerController,
  ViewerUnavailableError,
  type ViewerFailure,
} from '../viewer/ViewerController'
import type { ModelCache } from '../viewer/model-cache'

interface ViewerStageProps {
  compositionFrameRef: RefObject<HTMLElement | null>
  failureMessage: string | null
  initialLoading: boolean
  label: string
  modelCache: ModelCache
  modelReady: boolean
  onControllerReady: (controller: ViewerController | null) => void
  onRetry: () => void
  onViewerFailure: (failure: ViewerFailure) => void
  posterUrl: string
  showLoadingLabel: boolean
}

type ReviewCanvas = HTMLCanvasElement & {
  __museumReviewSetAnimationTime?: (time: number | null) => boolean
}

export function ViewerStage({
  compositionFrameRef,
  failureMessage,
  initialLoading,
  label,
  modelCache,
  modelReady,
  onControllerReady,
  onRetry,
  onViewerFailure,
  posterUrl,
  showLoadingLabel,
}: ViewerStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      onControllerReady(null)
      return
    }

    let controller: ViewerController
    try {
      controller = new ViewerController(container, {
        compositionFrame: compositionFrameRef.current,
        modelCache,
        onFailure: onViewerFailure,
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
    if (import.meta.env.MODE === 'review') {
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
  }, [compositionFrameRef, modelCache, onControllerReady, onViewerFailure])

  return (
    <div
      className="viewer-stage"
      data-initial-loading={initialLoading}
      data-model-ready={modelReady}
    >
      {failureMessage && !modelReady ? (
        <img
          alt={`${label}的展示照片`}
          className="model-poster"
          src={posterUrl}
        />
      ) : null}
      <div className="viewer-host" ref={containerRef} />
      {initialLoading && !failureMessage ? (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="stage-loading"
          data-show-label={showLoadingLabel}
          role="status"
        >
          <span aria-hidden="true" className="fossil-loader">
            <span className="fossil-loader__ring" />
            <Footprints size={30} strokeWidth={2} />
          </span>
          {showLoadingLabel ? (
            <strong>正在请第一位朋友出来……</strong>
          ) : (
            <span className="sr-only">正在准备三维动物模型。</span>
          )}
        </div>
      ) : null}
      {modelReady ? (
        <p aria-hidden="true" className="model-gesture-hint">
          拖动旋转，滚动或双指缩放
        </p>
      ) : null}
      {failureMessage ? (
        <div className="model-fallback" role="status">
          <strong>今天先看看它的照片吧</strong>
          <span>{failureMessage}</span>
          <button className="friendly-button friendly-button--small" onClick={onRetry} type="button">
            重新加载模型
          </button>
        </div>
      ) : null}
    </div>
  )
}
