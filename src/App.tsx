import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  Leaf,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pause,
  RotateCcw,
  Volume2,
} from 'lucide-react'
import {
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { NarrationController, getNarrationControlLabel } from './audio'
import {
  AnimalCollectionSheet,
  type CollectionAnimal,
} from './components/AnimalCollectionSheet'
import { IconButton } from './components/IconButton'
import {
  ParentDrawer,
  type ParentFacts,
  type ParentReviewFacts,
} from './components/ParentDrawer'
import { SceneAtmosphere } from './components/SceneAtmosphere'
import { ViewerStage } from './components/ViewerStage'
import { mainAnimals } from './content/catalog'
import { credits } from './content/credits.generated'
import type { PublishedAnimalPackage } from './content/types'
import { localReviewAnimals } from 'virtual:local-review-catalog'
import {
  MODEL_DATA_REMINDER_STORAGE_KEY,
  NARROW_TOUCH_MEDIA_QUERY,
  formatModelSize,
  isLargeModel,
} from './model-policy'
import type { DisplayableAnimalPackage } from './review/types'
import {
  AnimalLoadCoordinator,
  type AnimalLoadSnapshot,
  type AnimalLoadContext,
} from './state'
import {
  type ModelLoadProgress,
  type StagedViewerModel,
  type ViewerController,
  type ViewerFailure,
  type ViewerModelDescriptor,
} from './viewer/ViewerController'
import { ModelCache } from './viewer/model-cache'
import { createViewerModelDescriptor } from './viewer/create-viewer-model-descriptor'

interface RuntimeAnimal {
  readonly id: string
  readonly name: string
  readonly intro: string
  readonly habitat: DisplayableAnimalPackage['habitat']
  readonly atmosphere: DisplayableAnimalPackage['atmosphere']
  readonly classification: string
  readonly accent: string
  readonly accentSoft: string
  readonly narrationScript: readonly [string, string]
  readonly facts: ParentFacts
  readonly review: NonNullable<ParentFacts['review']> | null
  readonly assets: {
    readonly model: string
    readonly modelBytes: number
    readonly poster: string
    readonly posterPortrait: string
    readonly thumbnail: string
    readonly backgroundLandscape: string
    readonly backgroundPortrait: string
    readonly narration: string | null
  }
  readonly viewer: ViewerModelDescriptor
  readonly testBehavior?: {
    readonly delayMs?: number
    readonly failuresBeforeSuccess?: number
    readonly ignoreAbort?: boolean
  }
}

interface LoadedRuntimeAnimal {
  readonly animal: RuntimeAnimal
  readonly staged: StagedViewerModel
}

interface ModelDataNotice {
  readonly kind: 'first-entry' | 'large-model'
  readonly message: string
}

interface ModelLoadingProgress {
  readonly animalId: string
  readonly loadedBytes: number
  readonly requestToken: number
  readonly totalBytes: number
}

function SceneBackground({
  animal,
  onFailure,
  onReady,
  phase,
  transitionReady,
}: {
  readonly animal: RuntimeAnimal
  readonly onFailure?: (animalId: string) => void
  readonly onReady?: (animalId: string) => void
  readonly phase: 'solo' | 'incoming' | 'outgoing'
  readonly transitionReady: boolean
}) {
  return (
    <picture
      aria-hidden="true"
      className={`scene-background scene-background--${phase}${
        transitionReady ? ' scene-background--transition-ready' : ''
      }`}
    >
      <source media="(orientation: portrait)" srcSet={animal.assets.backgroundPortrait} />
      <img
        alt=""
        onError={() => onFailure?.(animal.id)}
        onLoad={(event) => {
          const image = event.currentTarget
          const decoded =
            typeof image.decode === 'function'
              ? image.decode()
              : Promise.resolve()
          void decoded.then(
            () => onReady?.(animal.id),
            () => onFailure?.(animal.id),
          )
        }}
        src={animal.assets.backgroundLandscape}
      />
    </picture>
  )
}

const publishedMainAnimals = mainAnimals.filter(
  (animal): animal is PublishedAnimalPackage => animal.status === 'published',
)
const defaultPackage = publishedMainAnimals[0]

if (!defaultPackage) {
  throw new Error('主展览集合中没有可展示的动物。')
}

function dietLabel(
  diet: DisplayableAnimalPackage['content']['zh-CN']['facts']['diet'],
): string {
  return (
    {
      herbivore: '植食',
      carnivore: '肉食',
      omnivore: '杂食',
      unknown: '尚不确定',
    } as const
  )[diet]
}

function sizeFact(
  size: DisplayableAnimalPackage['content']['zh-CN']['facts']['size'],
): { readonly label: string; readonly value: string } {
  const range =
    size.minMeters === size.maxMeters
      ? `${size.minMeters} 米（约）`
      : `${size.minMeters}-${size.maxMeters} 米（约）`
  if (size.kind === 'wingspan') {
    return { label: '翼展', value: range }
  }
  if (size.kind === 'shoulder-height') {
    return { label: '肩高', value: range }
  }
  if (size.kind === 'group-range') {
    return { label: '类群体型', value: `${size.note}；${range}` }
  }
  return { label: '体长', value: range }
}

function toRuntimeAnimal(animal: DisplayableAnimalPackage): RuntimeAnimal {
  const content = animal.content['zh-CN']
  const narration = animal.assets.narration
  const size = sizeFact(content.facts.size)
  const review: ParentReviewFacts | null = animal.review
    ? {
        badge: animal.review.badge,
        checks: [...animal.review.checks],
        displayLabel:
          animal.status === 'draft'
            ? `草稿 · ${animal.review.badge}`
            : animal.review.badge,
        note: animal.review.note,
        packageStatus: animal.status,
        stateLabel: animal.status === 'draft' ? '草稿' : '已听审',
        status: animal.review.status,
      }
    : null
  const accent =
    animal.review?.accent ??
    (animal.id === 'stegosaurus'
      ? { strong: '#a85f2f', soft: '#f2d1a5' }
      : { strong: '#356859', soft: '#d9e6d8' })
  const assetCredits: ParentFacts['assetCredits'] = credits
    .filter((credit) => credit.animalId === animal.id && credit.assetKind === 'model')
    .map((credit) => ({
      attribution: credit.attribution,
      licenseName: credit.licenseName,
      licenseUrl: credit.licenseUrl,
      sourceTitle: credit.sourceTitle,
      ...('sourceUrl' in credit ? { sourceUrl: credit.sourceUrl } : {}),
    }))
  if (animal.review?.modelCredit) {
    assetCredits.push({ ...animal.review.modelCredit })
  }
  return {
    id: animal.id,
    name: content.name,
    intro: content.visibleFeature,
    habitat: animal.habitat,
    atmosphere: animal.atmosphere,
    classification: content.classificationLabel,
    accent: accent.strong,
    accentSoft: accent.soft,
    narrationScript: content.narration.sentences,
    review,
    facts: {
      assetCredits,
      classification: content.classificationLabel,
      classificationNote: content.parentClassificationNote,
      diet: dietLabel(content.facts.diet),
      discoveryRegions: [...content.facts.discoveryRegions],
      size: size.value,
      sizeLabel: size.label,
      period: content.facts.period,
      narrationScript: content.narration.sentences,
      ...(review ? { review } : {}),
      sources: content.sources.map(({ title, url }) => ({ title, url })),
    },
    assets: {
      model: animal.assets.model,
      modelBytes: animal.assets.modelBytes,
      poster: animal.assets.poster,
      posterPortrait: animal.assets.posterPortrait ?? animal.assets.poster,
      thumbnail: animal.assets.thumbnail,
      backgroundLandscape: animal.assets.backgrounds.landscape,
      backgroundPortrait: animal.assets.backgrounds.portrait,
      narration: narration.status === 'ready' ? narration.url : null,
    },
    viewer: createViewerModelDescriptor(
      animal,
      content.name,
      animal.assets.model,
    ),
  }
}

const productionAnimals = publishedMainAnimals.map(toRuntimeAnimal)
const defaultAnimal = toRuntimeAnimal(defaultPackage)
const localReviewMode = import.meta.env.MODE === 'review'
const applicationAnimals = localReviewMode
  ? localReviewAnimals.map(toRuntimeAnimal)
  : productionAnimals
const initialLoadSnapshot: AnimalLoadSnapshot = {
  readyAnimalId: null,
  requestedAnimalId: defaultAnimal.id,
  requestToken: 0,
  phase: 'loading',
  showDelayedLabel: false,
  failure: null,
}

function readInitialAnimal(animals: readonly RuntimeAnimal[]): RuntimeAnimal {
  const requestedId = new URLSearchParams(window.location.search).get('animal')
  return (
    animals.find((animal) => animal.id === requestedId) ??
    animals[0] ??
    defaultAnimal
  )
}

function replaceAnimalUrl(animalId: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('animal', animalId)
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
}

function makeE2EFixtures(base: RuntimeAnimal): RuntimeAnimal[] {
  const makeFixture = (
    id: string,
    name: string,
    intro: string,
    testBehavior: NonNullable<RuntimeAnimal['testBehavior']>,
    habitat: RuntimeAnimal['habitat'] = base.habitat,
  ): RuntimeAnimal => {
    const markAsset = (url: string) => `${url}#${id}`
    return {
      ...base,
      id,
      name,
      intro,
      habitat,
      atmosphere:
        habitat === 'water' ? 'underwater' : base.atmosphere,
      facts: {
        ...base.facts,
        classification: `测试分类：${name}`,
        classificationNote: '仅用于端到端原子切换验证。',
        discoveryRegions: [`测试展区：${name}`],
        period: `测试时期：${name}`,
      },
      assets: {
        ...base.assets,
        modelBytes:
          id === 'fixture-slow'
            ? 9 * 1024 * 1024
            : base.assets.modelBytes,
        backgroundLandscape: markAsset(base.assets.backgroundLandscape),
        backgroundPortrait: markAsset(base.assets.backgroundPortrait),
        poster: markAsset(base.assets.poster),
        posterPortrait: markAsset(base.assets.posterPortrait),
        thumbnail: markAsset(base.assets.thumbnail),
      },
      viewer: {
        ...base.viewer,
        id,
        label: name,
        modelUrl: `${base.viewer.modelUrl}${
          base.viewer.modelUrl.includes('?') ? '&' : '?'
        }fixture=${encodeURIComponent(id)}`,
      },
      testBehavior,
    }
  }

  return [
    makeFixture(
      'fixture-slow',
      '慢慢龙',
      '它会慢一点来到展台，用来检查连续选择。',
      { delayMs: 850, ignoreAbort: true },
    ),
    makeFixture(
      'fixture-fast',
      '快快龙',
      '它会很快来到展台，用来确认最新选择获胜。',
      { delayMs: 60 },
      'water',
    ),
    makeFixture(
      'fixture-retry',
      '再试龙',
      '它第一次会迷路，再点一次就能来到展台。',
      { delayMs: 80, failuresBeforeSuccess: 1 },
    ),
  ]
}

const e2eFixtureAnimals =
  import.meta.env.MODE === 'e2e' ? makeE2EFixtures(defaultAnimal) : []

function waitForFixture(
  milliseconds: number,
  signal: AbortSignal,
  ignoreAbort = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds)
    if (ignoreAbort) {
      return
    }
    const abort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('请求已取消。', 'AbortError'))
    }
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

const INITIAL_PRESENTATION_MINIMUM_MS = 900
const REDUCED_MOTION_INITIAL_MINIMUM_MS = 180

function abortError(): DOMException {
  return new DOMException('请求已取消。', 'AbortError')
}

function waitForInitialMinimum(
  startedAt: number,
  signal: AbortSignal,
): Promise<void> {
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const minimum =
    import.meta.env.MODE === 'test'
      ? 0
      : reducedMotion
        ? REDUCED_MOTION_INITIAL_MINIMUM_MS
        : INITIAL_PRESENTATION_MINIMUM_MS
  const remaining = Math.max(0, minimum - (performance.now() - startedAt))
  if (remaining === 0) {
    signal.throwIfAborted()
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, remaining)
    const handleAbort = () => {
      window.clearTimeout(timer)
      reject(abortError())
    }
    if (signal.aborted) {
      handleAbort()
      return
    }
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

function preloadImageAsset(
  url: string,
  signal?: AbortSignal,
  priority: RequestPriority = 'auto',
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    let settled = false

    const cleanup = () => {
      image.onload = null
      image.onerror = null
      signal?.removeEventListener('abort', handleAbort)
    }
    const finish = (
      result: { readonly image: HTMLImageElement } | { readonly error: Error },
    ) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      if ('image' in result) {
        resolve(result.image)
      } else {
        reject(result.error)
      }
    }
    const handleAbort = () => {
      image.src = ''
      finish({ error: abortError() })
    }

    image.decoding = 'async'
    image.fetchPriority = priority
    image.onload = () => {
      const decoded: Promise<void> =
        typeof image.decode === 'function'
          ? image.decode()
          : Promise.resolve()
      void decoded.then(
        () => finish({ image }),
        () => finish({ error: new Error(`场景图片解码失败：${url}`) }),
      )
    }
    image.onerror = () => {
      finish({ error: new Error(`场景图片加载失败：${url}`) })
    }
    if (signal?.aborted) {
      handleAbort()
      return
    }
    signal?.addEventListener('abort', handleAbort, { once: true })
    image.src = url
  })
}

function readE2EFixturesEnabled(): boolean {
  return (
    import.meta.env.MODE === 'e2e' &&
    new URLSearchParams(window.location.search).get('fixtures') === '1'
  )
}

export function App() {
  const e2eFixturesEnabled = useMemo(() => readE2EFixturesEnabled(), [])
  const animals = useMemo(
    () =>
      e2eFixturesEnabled
        ? [...productionAnimals, ...e2eFixtureAnimals]
        : applicationAnimals,
    [e2eFixturesEnabled],
  )
  const animalIndex = useMemo(
    () => new Map(animals.map((animal) => [animal.id, animal])),
    [animals],
  )
  const initialAnimal = useMemo(() => readInitialAnimal(animals), [animals])
  const modelCache = useMemo(() => new ModelCache(), [])

  const viewerControllerRef = useRef<ViewerController | null>(null)
  const coordinatorRef = useRef<AnimalLoadCoordinator<LoadedRuntimeAnimal> | null>(null)
  const attemptsRef = useRef(new Map<string, number>())
  const activeAnimalRef = useRef(initialAnimal)
  const backgroundTimerRef = useRef<number | null>(null)
  const visibleBackgroundRef = useRef(initialAnimal)
  const initialPresentationPendingRef = useRef(true)
  const preloadLifecycleAbortRef = useRef(new AbortController())
  const preloadedImagesRef = useRef(new Map<string, HTMLImageElement>())
  const focusPointerRef = useRef<{
    readonly pointerId: number
    readonly startedAt: number
    readonly x: number
    readonly y: number
  } | null>(null)
  const modelDataNoticeTimerRef = useRef<number | null>(null)
  const modelDataNoticeKindRef =
    useRef<ModelDataNotice['kind'] | null>(null)
  const modelDataNoticeLifecycleRef = useRef(0)
  const narrationLifecycleRef = useRef(0)
  const lastReportedModelProgressRef = useRef('')
  const requestTokenRef = useRef(0)
  const viewerRequiresRemountRef = useRef(false)
  const drawerTriggerRef = useRef<HTMLButtonElement>(null)
  const collectionTriggerRef = useRef<HTMLButtonElement>(null)
  const focusTriggerRef = useRef<HTMLButtonElement>(null)
  const focusExitRef = useRef<HTMLButtonElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const narrationScriptId = useId()
  const [viewerController, setViewerController] = useState<ViewerController | null>(null)
  const [viewerRetryKey, setViewerRetryKey] = useState(0)
  const [activeAnimalId, setActiveAnimalId] = useState(initialAnimal.id)
  const [outgoingAnimal, setOutgoingAnimal] = useState<RuntimeAnimal | null>(null)
  const [backgroundTransitionReady, setBackgroundTransitionReady] =
    useState(false)
  const [loadSnapshot, setLoadSnapshot] = useState<AnimalLoadSnapshot>(() => ({
    ...initialLoadSnapshot,
    requestedAnimalId: initialAnimal.id,
  }))
  const [modelReady, setModelReady] = useState(false)
  const [modelLoadingProgress, setModelLoadingProgress] =
    useState<ModelLoadingProgress | null>(null)
  const [viewerFailure, setViewerFailure] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collectionOpen, setCollectionOpen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [modelDataNotice, setModelDataNotice] =
    useState<ModelDataNotice | null>(null)
  const [liveMessage, setLiveMessage] = useState(
    `正在准备${initialAnimal.name}展台。`,
  )

  const narration = useMemo(() => new NarrationController(), [])
  const narrationSnapshot = useSyncExternalStore(
    narration.subscribe,
    narration.getSnapshot,
    narration.getServerSnapshot,
  )
  const activeAnimal = animalIndex.get(activeAnimalId) ?? initialAnimal
  const overlayOpen = drawerOpen || collectionOpen
  const collectionAnimals = useMemo<CollectionAnimal[]>(
    () =>
      animals.map((animal) => ({
        classification: animal.classification,
        id: animal.id,
        name: animal.name,
        thumbnail: animal.assets.thumbnail,
      })),
    [animals],
  )

  useEffect(() => {
    document.title = `${activeAnimal.name} | 史前动物博物馆`
  }, [activeAnimal.name])

  const dismissModelDataNotice = useCallback(() => {
    if (modelDataNoticeTimerRef.current !== null) {
      window.clearTimeout(modelDataNoticeTimerRef.current)
      modelDataNoticeTimerRef.current = null
    }
    modelDataNoticeKindRef.current = null
    setModelDataNotice(null)
  }, [])

  const presentModelDataNotice = useCallback((notice: ModelDataNotice) => {
    if (modelDataNoticeTimerRef.current !== null) {
      window.clearTimeout(modelDataNoticeTimerRef.current)
    }
    modelDataNoticeKindRef.current = notice.kind
    setModelDataNotice(notice)
    modelDataNoticeTimerRef.current = window.setTimeout(() => {
      modelDataNoticeTimerRef.current = null
      modelDataNoticeKindRef.current = null
      setModelDataNotice(null)
    }, notice.kind === 'first-entry' ? 8_000 : 5_500)
  }, [])

  useEffect(() => {
    const lifecycle = ++narrationLifecycleRef.current
    return () => {
      queueMicrotask(() => {
        // StrictMode immediately mounts the effect again; only the final
        // lifecycle should release the shared controller after unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (narrationLifecycleRef.current === lifecycle) {
          narration.destroy()
        }
      })
    }
  }, [narration])

  useEffect(() => {
    const lifecycle = ++modelDataNoticeLifecycleRef.current
    return () => {
      queueMicrotask(() => {
        // React StrictMode immediately starts the next lifecycle. Only clear
        // the timer after the final unmount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (modelDataNoticeLifecycleRef.current === lifecycle) {
          if (modelDataNoticeTimerRef.current !== null) {
            window.clearTimeout(modelDataNoticeTimerRef.current)
            modelDataNoticeTimerRef.current = null
          }
          modelDataNoticeKindRef.current = null
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!window.matchMedia(NARROW_TOUCH_MEDIA_QUERY).matches) {
      return
    }

    try {
      if (window.localStorage.getItem(MODEL_DATA_REMINDER_STORAGE_KEY)) {
        return
      }
    } catch {
      // Privacy settings may disable storage. The reminder still works for
      // this visit without blocking the museum.
    }

    const reminderTimer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(MODEL_DATA_REMINDER_STORAGE_KEY)) {
          return
        }
        window.localStorage.setItem(MODEL_DATA_REMINDER_STORAGE_KEY, 'seen')
      } catch {
        // Keep the current visit useful when persistent storage is blocked.
      }
      presentModelDataNotice({
        kind: 'first-entry',
        message:
          '这里的 3D 动物会使用一些流量，连接 Wi‑Fi 时观看会更顺畅。',
      })
    }, 0)

    return () => {
      window.clearTimeout(reminderTimer)
    }
  }, [presentModelDataNotice])

  useEffect(() => {
    const preloadLifecycle = new AbortController()
    const preloadedImages = preloadedImagesRef.current
    preloadLifecycleAbortRef.current = preloadLifecycle
    return () => {
      if (backgroundTimerRef.current !== null) {
        window.clearTimeout(backgroundTimerRef.current)
      }
      preloadLifecycle.abort()
      for (const image of preloadedImages.values()) {
        image.src = ''
      }
      preloadedImages.clear()
    }
  }, [])

  useEffect(() => {
    narration.commit({
      animalId: initialAnimal.id,
      source: initialAnimal.assets.narration,
    })
  }, [initialAnimal, narration])

  const handleViewerFailure = useCallback((failure: ViewerFailure) => {
    if (failure.kind === 'animation') {
      console.warn(failure.message)
      return
    }
    if (failure.kind === 'model-load') {
      console.error(failure.message, failure.cause)
      return
    }
    setModelReady(false)
    setModelLoadingProgress(null)
    setViewerFailure(failure.message)
    viewerRequiresRemountRef.current =
      failure.kind === 'webgl-unavailable' || failure.kind === 'context-lost'
    const fatalViewerFailure =
      failure.kind === 'webgl-unavailable' || failure.kind === 'context-lost'
    if (failure.kind === 'context-lost') {
      coordinatorRef.current?.destroy()
      coordinatorRef.current = null
    }
    if (fatalViewerFailure) {
      setLoadSnapshot((snapshot) => ({
        ...snapshot,
        readyAnimalId: snapshot.readyAnimalId ?? activeAnimalRef.current.id,
        requestedAnimalId: activeAnimalRef.current.id,
        phase: 'idle',
        showDelayedLabel: false,
        failure: null,
      }))
    }
    setLiveMessage(
      `三维展台暂时不可用，已经换成${activeAnimalRef.current.name}的静态模型图。`,
    )
  }, [])

  const handleControllerReady = useCallback((controller: ViewerController | null) => {
    viewerControllerRef.current = controller
    setViewerController(controller)
    if (controller) {
      viewerRequiresRemountRef.current = false
      setViewerFailure(null)
    }
  }, [])

  const handleFirstFrameRendered = useCallback((animalId: string) => {
    if (animalId !== activeAnimalRef.current.id) {
      return
    }
    setModelReady(true)
  }, [])

  const handleBackgroundReady = useCallback((animalId: string) => {
    if (animalId !== activeAnimalRef.current.id) {
      return
    }
    setBackgroundTransitionReady(true)
    if (backgroundTimerRef.current !== null) {
      window.clearTimeout(backgroundTimerRef.current)
    }
    backgroundTimerRef.current = window.setTimeout(
      () => {
        backgroundTimerRef.current = null
        if (animalId !== activeAnimalRef.current.id) {
          return
        }
        visibleBackgroundRef.current = activeAnimalRef.current
        setOutgoingAnimal(null)
        setBackgroundTransitionReady(false)
      },
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 520,
    )
  }, [])

  const handleBackgroundFailure = useCallback((animalId: string) => {
    if (animalId !== activeAnimalRef.current.id) {
      return
    }
    if (backgroundTimerRef.current !== null) {
      window.clearTimeout(backgroundTimerRef.current)
      backgroundTimerRef.current = null
    }
    setBackgroundTransitionReady(false)
    setLiveMessage(
      `${activeAnimalRef.current.name}的场景还在准备，先保留上一幅画面。`,
    )
  }, [])

  useEffect(() => {
    const controller = viewerController
    coordinatorRef.current?.destroy()
    coordinatorRef.current = null

    if (!controller) {
      return
    }

    const coordinator = new AnimalLoadCoordinator<LoadedRuntimeAnimal>({
      initialReadyAnimalId: null,
      initialRequestToken: requestTokenRef.current,
      load: async (animalId, context: AnimalLoadContext) => {
        const animal = animalIndex.get(animalId)
        if (!animal) {
          throw new Error(`没有找到动物 ${animalId}。`)
        }
        let ignoreAbort = false
        if (import.meta.env.MODE === 'e2e') {
          const behavior = animal.testBehavior
          const attempt = (attemptsRef.current.get(animalId) ?? 0) + 1
          attemptsRef.current.set(animalId, attempt)
          if (behavior?.delayMs) {
            await waitForFixture(
              behavior.delayMs,
              context.signal,
              behavior.ignoreAbort,
            )
          }
          if (attempt <= (behavior?.failuresBeforeSuccess ?? 0)) {
            throw new Error('确定性的展台加载失败。')
          }
          ignoreAbort = behavior?.ignoreAbort ?? false
        }
        const shouldHoldInitial = initialPresentationPendingRef.current
        const startedAt = performance.now()
        const reportModelProgress = (progress: ModelLoadProgress) => {
          if (context.signal.aborted) {
            return
          }
          const totalBytes = progress.totalBytes ?? animal.assets.modelBytes
          const percent = Math.min(
            100,
            Math.floor((progress.loadedBytes / totalBytes) * 100),
          )
          const progressKey = `${context.requestToken}:${percent}`
          if (lastReportedModelProgressRef.current === progressKey) {
            return
          }
          lastReportedModelProgressRef.current = progressKey
          setModelLoadingProgress({
            animalId,
            loadedBytes: progress.loadedBytes,
            requestToken: context.requestToken,
            totalBytes,
          })
        }
        lastReportedModelProgressRef.current = `${context.requestToken}:0`
        setModelLoadingProgress({
          animalId,
          loadedBytes: 0,
          requestToken: context.requestToken,
          totalBytes: animal.assets.modelBytes,
        })
        const selectedBackground = window.matchMedia(
          '(orientation: portrait)',
        ).matches
          ? animal.assets.backgroundPortrait
          : animal.assets.backgroundLandscape
        const modelPromise = controller.stageModel(
          animal.viewer,
          ignoreAbort ? undefined : context.signal,
          reportModelProgress,
        )
        const cachedBackground =
          preloadedImagesRef.current.get(selectedBackground)
        const backgroundPromise =
          import.meta.env.MODE === 'test'
            ? Promise.resolve<HTMLImageElement | null>(null)
            : cachedBackground
              ? Promise.resolve(cachedBackground)
              : preloadImageAsset(
                  selectedBackground,
                  context.signal,
                  'high',
                )
        const selectedPoster = window.matchMedia(
          '(orientation: portrait)',
        ).matches
          ? animal.assets.posterPortrait
          : animal.assets.poster
        const cachedPoster = preloadedImagesRef.current.get(selectedPoster)
        const posterLifecycleSignal =
          preloadLifecycleAbortRef.current.signal
        const posterPromise =
          import.meta.env.MODE === 'test'
            ? Promise.resolve<HTMLImageElement | null>(null)
            : cachedPoster
              ? Promise.resolve(cachedPoster)
              : preloadImageAsset(
                  selectedPoster,
                  posterLifecycleSignal,
                  'low',
                )

        void posterPromise.then(
          (image) => {
            if (image && !posterLifecycleSignal.aborted) {
              preloadedImagesRef.current.set(selectedPoster, image)
            }
          },
          () => {
            // The poster is a failure fallback, not a switching prerequisite.
          },
        )
        const [modelResult, backgroundResult] = await Promise.allSettled([
          modelPromise,
          backgroundPromise,
        ])
        if (
          backgroundResult.status === 'fulfilled' &&
          backgroundResult.value
        ) {
          preloadedImagesRef.current.set(
            selectedBackground,
            backgroundResult.value,
          )
        }
        if (modelResult.status === 'rejected') {
          throw modelResult.reason
        }
        const staged = modelResult.value
        if (backgroundResult.status === 'rejected') {
          controller.disposeStagedModel(staged)
          throw backgroundResult.reason
        }

        if (shouldHoldInitial) {
          try {
            await waitForInitialMinimum(startedAt, context.signal)
          } catch (error: unknown) {
            controller.disposeStagedModel(staged)
            throw error
          }
        }
        return { animal, staged }
      },
      commit: ({ animal, staged }) => {
        const isInitialCommit = initialPresentationPendingRef.current
        controller.commitModel(staged)
        const previousAnimal = activeAnimalRef.current
        if (previousAnimal.id !== animal.id) {
          if (backgroundTimerRef.current !== null) {
            window.clearTimeout(backgroundTimerRef.current)
            backgroundTimerRef.current = null
          }
          setBackgroundTransitionReady(false)
          setOutgoingAnimal(
            (current) => current ?? visibleBackgroundRef.current,
          )
        }
        initialPresentationPendingRef.current = false
        activeAnimalRef.current = animal
        setActiveAnimalId(animal.id)
        if (!isInitialCommit) {
          setModelLoadingProgress(null)
        }
        setViewerFailure(null)
        replaceAnimalUrl(animal.id)
        narration.commit({
          animalId: animal.id,
          source: animal.assets.narration,
        })
        setLiveMessage(`${animal.name}已经来到展台。`)
      },
      dispose: ({ staged }) => {
        controller.disposeStagedModel(staged)
      },
      onDisposeError: (error) => {
        console.error('释放过期模型失败。', error)
      },
    })
    coordinatorRef.current = coordinator
    setLoadSnapshot(coordinator.getSnapshot())
    const unsubscribe = coordinator.subscribe(() => {
      const snapshot = coordinator.getSnapshot()
      requestTokenRef.current = Math.max(requestTokenRef.current, snapshot.requestToken)
      setLoadSnapshot(snapshot)
      if (snapshot.phase === 'failed' && snapshot.failure) {
        setModelLoadingProgress(null)
        const failedAnimal = animalIndex.get(snapshot.failure.animalId)
        setLiveMessage(
          `${failedAnimal?.name ?? '这只动物'}暂时没准备好，可以点击它的卡片重试。`,
        )
      }
    })
    void coordinator.request(activeAnimalRef.current.id)

    return () => {
      unsubscribe()
      coordinator.destroy()
      if (coordinatorRef.current === coordinator) {
        coordinatorRef.current = null
      }
    }
  }, [
    animalIndex,
    modelCache,
    narration,
    viewerController,
  ])

  useEffect(() => {
    const readyAnimalId = loadSnapshot.readyAnimalId
    if (!readyAnimalId) {
      return
    }
    const selectedCard = railRef.current?.querySelector<HTMLElement>(
      `[data-animal-id="${readyAnimalId}"]`,
    )
    selectedCard?.scrollIntoView?.({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }, [loadSnapshot.readyAnimalId])

  const exitFocusMode = useCallback(() => {
    focusPointerRef.current = null
    viewerControllerRef.current?.setFocusMode(false)
    setFocusMode(false)
    setLiveMessage('已经回到完整的博物馆界面。')
    window.setTimeout(() => focusTriggerRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      if (focusMode) {
        event.preventDefault()
        exitFocusMode()
      } else if (collectionOpen) {
        event.preventDefault()
        setCollectionOpen(false)
      } else if (drawerOpen) {
        event.preventDefault()
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [collectionOpen, drawerOpen, exitFocusMode, focusMode])

  useEffect(() => {
    if (focusMode) {
      focusExitRef.current?.focus()
    }
  }, [focusMode])

  const requestAnimal = (animalId: string) => {
    const coordinator = coordinatorRef.current
    if (!coordinator) {
      return
    }
    const requestedAnimal = animalIndex.get(animalId)
    if (
      requestedAnimal &&
      requestedAnimal.id !== activeAnimalRef.current.id &&
      window.matchMedia(NARROW_TOUCH_MEDIA_QUERY).matches &&
      modelDataNoticeKindRef.current !== 'first-entry'
    ) {
      if (isLargeModel(requestedAnimal.assets.modelBytes)) {
        presentModelDataNotice({
          kind: 'large-model',
          message: `${requestedAnimal.name}的 3D 模型约 ${formatModelSize(
            requestedAnimal.assets.modelBytes,
          )}，加载可能会久一点。`,
        })
      } else if (modelDataNoticeKindRef.current === 'large-model') {
        dismissModelDataNotice()
      }
    }
    setLiveMessage('正在准备新的动物展台。')
    void coordinator.request(animalId)
  }

  const retryAnimal = () => {
    setLiveMessage('正在重新准备展台。')
    const coordinator = coordinatorRef.current
    if (viewerRequiresRemountRef.current) {
      viewerRequiresRemountRef.current = false
      coordinator?.destroy()
      coordinatorRef.current = null
      setViewerFailure(null)
      setModelReady(false)
      setViewerRetryKey((retryKey) => retryKey + 1)
    } else if (coordinator?.getSnapshot().phase === 'failed') {
      setViewerFailure(null)
      void coordinator.retry()
    } else if (coordinator) {
      setViewerFailure(null)
      void coordinator?.reload(activeAnimal.id)
    } else {
      setViewerRetryKey((retryKey) => retryKey + 1)
    }
  }

  const currentIndex = Math.max(
    animals.findIndex((animal) => animal.id === (loadSnapshot.readyAnimalId ?? activeAnimal.id)),
    0,
  )
  const previousAnimal = animals[(currentIndex - 1 + animals.length) % animals.length] ?? activeAnimal
  const nextAnimal = animals[(currentIndex + 1) % animals.length] ?? activeAnimal
  const initialModelFailure =
    !modelReady && loadSnapshot.phase === 'failed'
      ? '它暂时没准备好，再点一次试试。'
      : viewerFailure

  const enterFocusMode = () => {
    if (!modelReady) {
      return
    }
    viewerControllerRef.current?.setFocusMode(true)
    setFocusMode(true)
    setLiveMessage(
      '已进入模型专注模式，轻点画面或按 Escape 返回完整界面。',
    )
  }

  const handleFocusPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    if (
      !focusMode ||
      !event.isPrimary ||
      (event.target instanceof Element &&
        event.target.closest('button, a') !== null)
    ) {
      focusPointerRef.current = null
      return
    }
    focusPointerRef.current = {
      pointerId: event.pointerId,
      startedAt: performance.now(),
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handleFocusPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = focusPointerRef.current
    focusPointerRef.current = null
    if (
      !focusMode ||
      !start ||
      start.pointerId !== event.pointerId ||
      performance.now() - start.startedAt > 500
    ) {
      return
    }
    const distance = Math.hypot(
      event.clientX - start.x,
      event.clientY - start.y,
    )
    if (distance <= 10) {
      exitFocusMode()
    }
  }

  const handleNarrationToggle = async () => {
    const result = await narration.toggle()
    if (result.status === 'playing') {
      setLiveMessage(`正在播放${activeAnimalRef.current.name}的介绍。`)
    } else if (result.status === 'paused') {
      setLiveMessage(`${activeAnimalRef.current.name}的介绍已暂停。`)
    }
  }

  const narrationLabel = getNarrationControlLabel(narrationSnapshot)
  const narrationVisibleLabel =
    narrationSnapshot.availability === 'available'
      ? narrationSnapshot.playback === 'playing'
        ? '暂停'
        : '听介绍'
      : '暂无语音'
  const hasOutgoingBackground =
    outgoingAnimal !== null && outgoingAnimal.id !== activeAnimal.id
  const initialLoading =
    !modelReady &&
    loadSnapshot.readyAnimalId === null &&
    loadSnapshot.phase === 'loading'
  const loadingPercent =
    modelLoadingProgress?.requestToken === loadSnapshot.requestToken &&
    modelLoadingProgress.totalBytes > 0
      ? Math.min(
          100,
          Math.floor(
            (modelLoadingProgress.loadedBytes /
              modelLoadingProgress.totalBytes) *
              100,
          ),
        )
      : null
  const interfaceStyle = {
    '--animal-accent': activeAnimal.accent,
    '--animal-accent-soft': activeAnimal.accentSoft,
  } as CSSProperties

  return (
    <main
      className={`museum-experience ${focusMode ? 'museum-experience--focus' : ''}`}
      data-atmosphere={activeAnimal.atmosphere}
      data-habitat={activeAnimal.habitat}
      data-ready-animal-id={loadSnapshot.readyAnimalId ?? ''}
      data-review-mode={localReviewMode || undefined}
      data-request-token={loadSnapshot.requestToken}
      data-requested-animal-id={loadSnapshot.requestedAnimalId ?? ''}
      id="museum-experience"
      style={interfaceStyle}
    >
      {hasOutgoingBackground ? (
        <SceneBackground
          animal={outgoingAnimal}
          key={outgoingAnimal.id}
          phase="outgoing"
          transitionReady={backgroundTransitionReady}
        />
      ) : null}
      <SceneBackground
        animal={activeAnimal}
        key={activeAnimal.id}
        onFailure={handleBackgroundFailure}
        onReady={handleBackgroundReady}
        phase={hasOutgoingBackground ? 'incoming' : 'solo'}
        transitionReady={backgroundTransitionReady}
      />
      <SceneAtmosphere
        key={`atmosphere-${activeAnimal.id}`}
        kind={activeAnimal.atmosphere}
      />
      {!focusMode ? (
        <section aria-hidden={overlayOpen} className="story-panel" inert={overlayOpen}>
          <div className="story-card">
            <p className="museum-kicker">
              <span className="museum-mark" aria-hidden="true">
                <Leaf size={16} strokeWidth={2.3} />
              </span>
              <span>史前动物博物馆</span>
              {localReviewMode ? (
                <span className="review-mode-label">本地评审</span>
              ) : null}
            </p>
            <div className="title-lockup" key={`title-${activeAnimal.id}`}>
              <div className="animal-copy">
                <div className="animal-eyebrow">
                  <span>今天认识</span>
                  <span className="classification-chip">
                    {activeAnimal.classification}
                  </span>
                  {localReviewMode && activeAnimal.review ? (
                    <span
                      className="review-state-chip"
                      data-package-status={activeAnimal.review.packageStatus}
                    >
                      {activeAnimal.review.displayLabel}
                    </span>
                  ) : null}
                </div>
                <h1>{activeAnimal.name}</h1>
                <p className="child-intro">
                  <Eye aria-hidden="true" size={21} strokeWidth={2.2} />
                  <span>{activeAnimal.intro}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="story-actions">
            <div className="narration-control">
              <button
                aria-label={narrationLabel}
                aria-describedby={
                  narrationSnapshot.availability === 'available'
                    ? narrationScriptId
                    : undefined
                }
                className="narration-button"
                data-playback={narrationSnapshot.playback}
                disabled={narrationSnapshot.availability !== 'available'}
                onClick={() => {
                  void handleNarrationToggle()
                }}
                type="button"
              >
                {narrationSnapshot.playback === 'playing' ? (
                  <Pause aria-hidden="true" size={22} strokeWidth={2.25} />
                ) : (
                  <Volume2 aria-hidden="true" size={22} strokeWidth={2.25} />
                )}
                <span>{narrationVisibleLabel}</span>
                {narrationSnapshot.playback === 'playing' ? (
                  <span aria-hidden="true" className="narration-wave">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
              </button>
              <span
                className="narration-script-popover"
                id={narrationScriptId}
                role="tooltip"
              >
                {activeAnimal.narrationScript.join('')}
              </span>
            </div>
            <button
              aria-label="给家长的资料"
              className="parent-info-button"
              onClick={() => {
                setCollectionOpen(false)
                setDrawerOpen(true)
              }}
              ref={drawerTriggerRef}
              type="button"
            >
              <BookOpen aria-hidden="true" size={21} strokeWidth={2.1} />
              <span>家长资料</span>
            </button>
            <button
              aria-label="打开全馆图鉴"
              className="collection-open-button"
              onClick={() => {
                setDrawerOpen(false)
                setCollectionOpen(true)
              }}
              ref={collectionTriggerRef}
              type="button"
            >
              <LayoutGrid aria-hidden="true" size={21} strokeWidth={2.1} />
              <span>全馆</span>
            </button>
          </div>
        </section>
      ) : null}

      <section
        aria-hidden={overlayOpen && !focusMode}
        aria-label={`${activeAnimal.name}模型展台`}
        className="stage-panel"
        data-testid="model-stage"
        inert={overlayOpen && !focusMode}
        onPointerCancel={() => {
          focusPointerRef.current = null
        }}
        onPointerDownCapture={handleFocusPointerDown}
        onPointerUpCapture={handleFocusPointerUp}
      >
        <ViewerStage
          animalId={activeAnimal.id}
          failureMessage={initialModelFailure}
          initialLoading={initialLoading}
          key={`viewer-${viewerRetryKey}`}
          label={activeAnimal.name}
          loadingPercent={loadingPercent}
          modelCache={modelCache}
          modelReady={modelReady}
          onControllerReady={handleControllerReady}
          onFirstFrameRendered={handleFirstFrameRendered}
          onRetry={retryAnimal}
          onViewerFailure={handleViewerFailure}
          posterUrl={activeAnimal.assets.poster}
          posterPortraitUrl={activeAnimal.assets.posterPortrait}
        />
        {!focusMode ? (
          <div aria-hidden={overlayOpen} className="stage-actions" inert={overlayOpen}>
            <IconButton
              icon={RotateCcw}
              label="恢复初始视角"
              onClick={() => {
                viewerControllerRef.current?.reset()
                setLiveMessage('已经恢复初始视角。')
              }}
            />
            <IconButton
              disabled={!modelReady}
              icon={Maximize2}
              hideTooltipOnFocus
              label="专注看模型"
              onClick={enterFocusMode}
              ref={focusTriggerRef}
            />
          </div>
        ) : (
          <>
            <p aria-hidden="true" className="focus-return-hint">
              轻点画面即可返回
            </p>
            <IconButton
              className="focus-exit"
              hideTooltipOnFocus
              icon={Minimize2}
              label="退出模型专注模式"
              onClick={exitFocusMode}
              ref={focusExitRef}
            />
          </>
        )}
      </section>

      {!focusMode ? (
        <section
          aria-hidden={overlayOpen}
          aria-label={localReviewMode ? '本地评审动物选择' : '动物选择'}
          className={`animal-navigation ${
            animals.length === 1 ? 'animal-navigation--single' : ''
          }`}
          data-animal-count={animals.length}
          inert={overlayOpen}
        >
          <IconButton
            className="animal-step animal-step--previous"
            icon={ChevronLeft}
            label="上一只动物"
            onClick={() => requestAnimal(previousAnimal.id)}
          />
          <div className="animal-rail" ref={railRef} role="list">
            {animals.map((animal) => {
              const loading =
                loadSnapshot.phase === 'loading' &&
                loadSnapshot.requestedAnimalId === animal.id
              const failed =
                loadSnapshot.phase === 'failed' &&
                loadSnapshot.requestedAnimalId === animal.id
              const selected = loadSnapshot.readyAnimalId === animal.id
              return (
                <div className="animal-card-slot" key={animal.id} role="listitem">
                  <button
                    aria-current={selected ? 'true' : undefined}
                    aria-label={
                      failed
                        ? `查看${animal.name}${
                            localReviewMode && animal.review
                              ? `，本地评审，${animal.review.displayLabel}`
                              : ''
                          }，加载失败，点击重试`
                        : `查看${animal.name}${
                            localReviewMode && animal.review
                              ? `，本地评审，${animal.review.displayLabel}`
                              : ''
                          }`
                    }
                    className="animal-card"
                    data-animal-id={animal.id}
                    data-failed={failed}
                    data-loading={loading}
                    data-selected={selected}
                    onClick={() => {
                      if (failed) {
                        retryAnimal()
                      } else {
                        requestAnimal(animal.id)
                      }
                    }}
                    type="button"
                  >
                    <span className="thumbnail-frame">
                      <img
                        alt=""
                        decoding="async"
                        loading="lazy"
                        src={animal.assets.thumbnail}
                      />
                      {localReviewMode && animal.review ? (
                        <span
                          aria-hidden="true"
                          className="review-thumbnail-badge"
                          data-package-status={animal.review.packageStatus}
                        >
                          {animal.review.stateLabel}
                        </span>
                      ) : null}
                      {loading ? <span aria-hidden="true" className="loading-orbit" /> : null}
                    </span>
                    <strong>{animal.name}</strong>
                    {loading &&
                    !initialLoading &&
                    loadSnapshot.showDelayedLabel ? (
                      <span className="card-status">
                        {loadingPercent === null
                          ? '正在请它出来…'
                          : `准备中 · ${loadingPercent}%`}
                      </span>
                    ) : null}
                    {failed ? <span className="card-status">点我再试</span> : null}
                    {!failed &&
                    (!loading || !loadSnapshot.showDelayedLabel) &&
                    localReviewMode &&
                    animal.review ? (
                      <span className="card-review-status">本地评审</span>
                    ) : null}
                  </button>
                </div>
              )
            })}
          </div>
          <IconButton
            className="animal-step animal-step--next"
            icon={ChevronRight}
            label="下一只动物"
            onClick={() => requestAnimal(nextAnimal.id)}
          />
        </section>
      ) : null}

      {modelDataNotice && !focusMode && !overlayOpen ? (
        <aside
          aria-atomic="true"
          aria-live="polite"
          className="model-data-notice"
          data-notice-kind={modelDataNotice.kind}
          role="status"
        >
          <span aria-hidden="true" className="model-data-notice__dot" />
          <p>{modelDataNotice.message}</p>
          <button
            aria-label="关闭模型流量提示"
            onClick={dismissModelDataNotice}
            type="button"
          >
            知道了
          </button>
        </aside>
      ) : null}

      <p aria-atomic="true" aria-live="polite" className="sr-only" role="status">
        {liveMessage}
      </p>

      <ParentDrawer
        facts={activeAnimal.facts}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen && !focusMode}
        returnFocusTo={drawerTriggerRef}
        showReviewDetails={localReviewMode}
      />
      <AnimalCollectionSheet
        animals={collectionAnimals}
        currentAnimalId={loadSnapshot.readyAnimalId ?? activeAnimal.id}
        loadingAnimalId={
          loadSnapshot.phase === 'loading'
            ? loadSnapshot.requestedAnimalId
            : null
        }
        loadingPercent={loadingPercent}
        onClose={() => setCollectionOpen(false)}
        onSelect={(animalId) => {
          setCollectionOpen(false)
          if (animalId !== (loadSnapshot.readyAnimalId ?? activeAnimal.id)) {
            requestAnimal(animalId)
          }
        }}
        open={collectionOpen && !focusMode}
        returnFocusTo={collectionTriggerRef}
      />
    </main>
  )
}
