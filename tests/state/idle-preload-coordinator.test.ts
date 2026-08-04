import { IdlePreloadCoordinator } from '../../src/state/idle-preload-coordinator'
import { ModelCache } from '../../src/viewer/model-cache'

const targets = [
  {
    id: 'stegosaurus',
    imageUrls: ['/stegosaurus-background.webp'],
    modelUrl: '/stegosaurus.glb',
  },
  {
    id: 'triceratops',
    imageUrls: ['/triceratops-background.webp'],
    modelUrl: '/triceratops.glb',
  },
  {
    id: 'mammoth',
    imageUrls: ['/mammoth-background.webp'],
    modelUrl: '/mammoth.glb',
  },
] as const

describe('IdlePreloadCoordinator', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('waits for the committed animal to stay idle before preloading next then previous', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(new ArrayBuffer(8), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const cache = new ModelCache()
    const coordinator = new IdlePreloadCoordinator({
      idleDelayMs: 2_000,
      modelCache: cache,
      targets,
    })

    coordinator.scheduleAfterCommit('triceratops')

    await vi.advanceTimersByTimeAsync(1_999)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await vi.runAllTimersAsync()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/mammoth-background.webp',
      '/mammoth.glb',
      '/stegosaurus-background.webp',
      '/stegosaurus.glb',
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect(init).toMatchObject({ priority: 'low' })
    }
    expect(cache.get('/mammoth.glb')).not.toBeNull()
    expect(cache.get('/stegosaurus.glb')).not.toBeNull()

    coordinator.destroy()
  })

  it('immediately aborts in-flight idle work when a user request takes priority', async () => {
    vi.useFakeTimers()
    let preloadSignal: AbortSignal | undefined
    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          preloadSignal = init?.signal ?? undefined
          preloadSignal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const coordinator = new IdlePreloadCoordinator({
      idleDelayMs: 2_000,
      modelCache: new ModelCache(),
      targets,
    })

    coordinator.scheduleAfterCommit('triceratops')
    await vi.advanceTimersByTimeAsync(2_000)
    await vi.advanceTimersToNextTimerAsync()
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(preloadSignal?.aborted).toBe(false)

    coordinator.cancelAll()

    expect(preloadSignal?.aborted).toBe(true)
    await Promise.resolve()
    await vi.runAllTimersAsync()
    expect(fetchMock).toHaveBeenCalledOnce()

    coordinator.destroy()
  })

  it('preloads only images when the user has enabled data saving', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {
      connection: { effectiveType: '4g', saveData: true },
    })
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(new ArrayBuffer(8), { status: 200 })),
    )
    vi.stubGlobal('fetch', fetchMock)
    const cache = new ModelCache()
    const coordinator = new IdlePreloadCoordinator({
      idleDelayMs: 2_000,
      modelCache: cache,
      targets,
    })

    coordinator.scheduleAfterCommit('triceratops')
    await vi.advanceTimersByTimeAsync(2_000)
    await vi.runAllTimersAsync()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/mammoth-background.webp',
      '/stegosaurus-background.webp',
    ])
    expect(cache.get('/mammoth.glb')).toBeNull()
    expect(cache.get('/stegosaurus.glb')).toBeNull()

    coordinator.destroy()
  })
})
