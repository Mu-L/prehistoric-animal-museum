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

  it('waits for the committed animal to stay idle before starting both adjacent models', async () => {
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
    expect(fetchMock.mock.calls.slice(0, 2).map(([url]) => url)).toEqual([
      '/mammoth.glb',
      '/stegosaurus.glb',
    ])
    await vi.runAllTimersAsync()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/mammoth.glb',
      '/stegosaurus.glb',
      '/mammoth-background.webp',
      '/stegosaurus-background.webp',
    ])
    for (const [url, init] of fetchMock.mock.calls) {
      const requestUrl =
        typeof url === 'string'
          ? url
          : url instanceof URL
            ? url.href
            : url.url
      expect(init).toMatchObject({
        priority: requestUrl.endsWith('.glb') ? 'auto' : 'low',
      })
    }
    expect(cache.get('/mammoth.glb')).not.toBeNull()
    expect(cache.get('/stegosaurus.glb')).not.toBeNull()

    coordinator.destroy()
  })

  it('immediately aborts in-flight idle work when a user request takes priority', async () => {
    vi.useFakeTimers()
    const preloadSignals: AbortSignal[] = []
    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const preloadSignal = init?.signal
          if (preloadSignal) {
            preloadSignals.push(preloadSignal)
          }
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
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(preloadSignals.every((signal) => !signal.aborted)).toBe(true)

    coordinator.cancelAll()

    expect(preloadSignals.every((signal) => signal.aborted)).toBe(true)
    await Promise.resolve()
    await vi.runAllTimersAsync()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    coordinator.destroy()
  })

  it('does not perform optional preloading when the user has enabled data saving', async () => {
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

    expect(fetchMock).not.toHaveBeenCalled()
    expect(cache.get('/mammoth.glb')).toBeNull()
    expect(cache.get('/stegosaurus.glb')).toBeNull()

    coordinator.destroy()
  })

  it('keeps image previews but skips models on a slow connection', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {
      connection: { effectiveType: '2g', saveData: false },
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

  it('still preloads adjacent models on a 3g connection', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', {
      connection: { effectiveType: '3g', saveData: false },
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

    expect(fetchMock.mock.calls.slice(0, 2).map(([url]) => url)).toEqual([
      '/mammoth.glb',
      '/stegosaurus.glb',
    ])
    expect(cache.get('/mammoth.glb')).not.toBeNull()
    expect(cache.get('/stegosaurus.glb')).not.toBeNull()

    coordinator.destroy()
  })
})
