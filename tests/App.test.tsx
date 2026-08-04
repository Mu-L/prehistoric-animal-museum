import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../src/App'

interface Deferred<T> {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (reason: unknown) => void
}

interface MockDescriptor {
  readonly id: string
}

interface MockViewerOptions {
  readonly onFailure?: (failure: {
    readonly kind: 'context-lost' | 'webgl-unavailable'
    readonly message: string
  }) => void
}

const viewerMock = vi.hoisted(() => ({
  commitModel: vi.fn(),
  constructorCount: 0,
  destroy: vi.fn(),
  disposeStagedModel: vi.fn(),
  failConstruction: false,
  failureHandlers: [] as Array<
    (failure: {
      readonly kind: 'context-lost' | 'webgl-unavailable'
      readonly message: string
    }) => void
  >,
  reset: vi.fn(),
  setFocusMode: vi.fn(),
  stageModel: vi.fn(),
}))

vi.mock('../src/viewer/ViewerController', () => {
  class ViewerUnavailableError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ViewerUnavailableError'
    }
  }

  class ViewerController {
    constructor(_container: HTMLElement, options: MockViewerOptions = {}) {
      viewerMock.constructorCount += 1
      if (options.onFailure) {
        viewerMock.failureHandlers.push(options.onFailure)
      }
      if (viewerMock.failConstruction) {
        const message = '这个浏览器现在不能显示 3D 模型。'
        options.onFailure?.({ kind: 'webgl-unavailable', message })
        throw new ViewerUnavailableError(message)
      }
    }

    stageModel(
      descriptor: MockDescriptor,
      signal?: AbortSignal,
    ): Promise<unknown> {
      const result = viewerMock.stageModel(descriptor, signal) as unknown
      return Promise.resolve(result)
    }

    commitModel(staged: unknown): void {
      viewerMock.commitModel(staged)
    }

    disposeStagedModel(staged: unknown): void {
      viewerMock.disposeStagedModel(staged)
    }

    reset(): void {
      viewerMock.reset()
    }

    setFocusMode(focused: boolean): void {
      viewerMock.setFocusMode(focused)
    }

    destroy(): void {
      viewerMock.destroy()
    }
  }

  return { ViewerController, ViewerUnavailableError }
})

function deferred<T>(): Deferred<T> {
  let resolvePromise: (value: T) => void = () => undefined
  let rejectPromise: (reason: unknown) => void = () => undefined
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })
  return {
    promise,
    resolve: resolvePromise,
    reject: rejectPromise,
  }
}

function stagedModel(descriptor: MockDescriptor) {
  return {
    animalId: descriptor.id,
    descriptor,
    disposed: false,
  }
}

function configureSuccessfulViewer(): void {
  viewerMock.stageModel.mockImplementation(
    (descriptor: MockDescriptor) =>
      Promise.resolve(stagedModel(descriptor)),
  )
}

async function renderReadyApp(): Promise<void> {
  render(<App />)
  await waitFor(() => {
    expect(document.getElementById('museum-experience')).toHaveAttribute(
      'data-ready-animal-id',
      'stegosaurus',
    )
  })
}

function expectTooltip(buttonName: string): void {
  const button = screen.getByRole('button', { name: buttonName })
  const tooltipId = button.getAttribute('aria-describedby')
  expect(tooltipId).toBeTruthy()
  const tooltip = tooltipId ? document.getElementById(tooltipId) : null
  expect(tooltip).toHaveAttribute('role', 'tooltip')
  expect(tooltip).toHaveTextContent(buttonName)
}

describe('App', () => {
  beforeEach(() => {
    viewerMock.commitModel.mockReset()
    viewerMock.constructorCount = 0
    viewerMock.destroy.mockReset()
    viewerMock.disposeStagedModel.mockReset()
    viewerMock.reset.mockReset()
    viewerMock.setFocusMode.mockReset()
    viewerMock.stageModel.mockReset()
    viewerMock.failConstruction = false
    viewerMock.failureHandlers.length = 0
    configureSuccessfulViewer()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('presents the Chinese child experience with accessible controls and reviewed narration', async () => {
    await renderReadyApp()

    expect(viewerMock.constructorCount).toBe(1)
    expect(viewerMock.stageModel).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('heading', { level: 1, name: '剑龙' }),
    ).toBeVisible()
    expect(
      screen.getByText('看看它背上的两排骨板，像不像一列起伏的小山？'),
    ).toBeVisible()
    expect(
      screen.queryByText('这是剑龙，它是一种生活在晚侏罗世的食草恐龙。'),
    ).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: '听它的介绍' })).toBeEnabled()
    expect(
      screen.getByRole('region', { name: '剑龙模型展台' }),
    ).toBeVisible()
    expect(
      screen.getByRole('region', { name: '动物选择' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: /^查看剑龙$/ }),
    ).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByText('本地评审')).not.toBeInTheDocument()
    expect(screen.queryByText('已听审')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '给家长的资料' }),
    ).toBeVisible()
    expect(document.getElementById('museum-experience')).toHaveAttribute(
      'data-habitat',
      'land',
    )
    expect(document.getElementById('museum-experience')).toHaveAttribute(
      'data-atmosphere',
      'forest',
    )
    expect(document.querySelector('.forest-atmosphere')).toBeInTheDocument()
    expect(
      document.querySelector('.underwater-atmosphere'),
    ).not.toBeInTheDocument()
    expect(new URL(window.location.href).searchParams.get('animal')).toBe(
      'stegosaurus',
    )

    for (const name of [
      '恢复初始视角',
      '专注看模型',
      '上一只动物',
      '下一只动物',
    ]) {
      expectTooltip(name)
    }
  })

  it('replaces navigation with the parent drawer and gives focus mode Escape priority', async () => {
    const user = userEvent.setup()
    await renderReadyApp()

    const focusButton = screen.getByRole('button', { name: '专注看模型' })
    const drawerButton = screen.getByRole('button', {
      name: '给家长的资料',
    })
    const navigation = screen.getByRole('region', { name: '动物选择' })
    await user.click(drawerButton)

    const dialog = screen.getByRole('dialog', { name: '给家长的资料' })
    expect(dialog).toBeVisible()
    expect(
      within(dialog).queryByRole('region', { name: '本地评审记录' }),
    ).not.toBeInTheDocument()
    expect(
      within(dialog).queryByText('评审备注（仅本地可见）'),
    ).not.toBeInTheDocument()
    expect(navigation).toHaveAttribute('aria-hidden', 'true')
    expect(navigation).toHaveAttribute('inert')
    expect(screen.getByTestId('model-stage')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('model-stage')).toHaveAttribute('inert')
    expect(screen.getByText('晚侏罗世')).toBeVisible()
    expect(screen.getByText('北美洲西部')).toBeVisible()
    expect(
      within(dialog).getByText(
        '这是剑龙，它是一种生活在晚侏罗世的食草恐龙。看看它背上的两排骨板，像不像一列起伏的小山？',
      ),
    ).toBeVisible()
    expect(
      screen.getByRole('link', { name: 'PBR Stegasaurus (Animated)' }),
    ).toHaveAttribute(
      'href',
      'https://sketchfab.com/3d-models/pbr-stegasaurus-animated-ec254ea1554941fe8a131f62db0faf3d',
    )
    expect(
      screen.getByRole('link', {
        name: 'Creative Commons Attribution 4.0 International',
      }),
    ).toHaveAttribute('href', 'https://creativecommons.org/licenses/by/4.0/')
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '关闭家长资料' }),
      ).toHaveFocus()
    })

    // The action is inert to real users while the dialog is open. Firing it
    // directly creates the otherwise unreachable overlapping state so Escape
    // ordering can be verified deterministically.
    fireEvent.click(focusButton)
    const exitButton = screen.getByRole('button', {
      name: '退出模型专注模式',
    })
    expect(exitButton).toBeVisible()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '剑龙' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toEqual([exitButton])
    expect(viewerMock.setFocusMode).toHaveBeenCalledWith(true)

    await user.keyboard('{Escape}')
    expect(
      screen.getByRole('dialog', { name: '给家长的资料' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('button', { name: '退出模型专注模式' }),
    ).not.toBeInTheDocument()
    expect(viewerMock.setFocusMode).toHaveBeenLastCalledWith(false)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '给家长的资料' }),
      ).toHaveFocus()
    })
  })

  it('opens a complete museum index and moves directly to the chosen exhibit', async () => {
    const user = userEvent.setup()
    await renderReadyApp()

    const collectionButton = screen.getByRole('button', {
      name: '打开全馆图鉴',
    })
    const navigation = screen.getByRole('region', { name: '动物选择' })
    await user.click(collectionButton)

    const dialog = screen.getByRole('dialog', { name: '全馆图鉴' })
    expect(dialog).toBeVisible()
    expect(
      within(dialog).getAllByRole('button', { name: /前往.+展台$/ }),
    ).toHaveLength(18)
    expect(
      within(dialog).getByRole('button', {
        name: '当前展台，前往剑龙展台',
      }),
    ).toHaveAttribute('aria-current', 'true')
    expect(navigation).toHaveAttribute('aria-hidden', 'true')
    expect(navigation).toHaveAttribute('inert')
    expect(screen.getByTestId('model-stage')).toHaveAttribute('inert')

    await user.click(
      within(dialog).getByRole('button', { name: '前往三角龙展台' }),
    )

    expect(screen.queryByRole('dialog', { name: '全馆图鉴' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: '三角龙' }),
      ).toBeVisible()
    })
    expect(new URL(window.location.href).searchParams.get('animal')).toBe(
      'triceratops',
    )
  })

  it('shows the loading label only after 300 ms, reveals the poster on failure, and retries', async () => {
    vi.useFakeTimers()
    const staged = deferred<ReturnType<typeof stagedModel>>()
    viewerMock.stageModel.mockImplementation(() => staged.promise)

    render(<App />)
    await act(async () => {
      await Promise.resolve()
    })

    const card = screen.getByRole('button', { name: '查看剑龙' })
    const focusButton = screen.getByRole('button', { name: '专注看模型' })
    expect(card).toHaveAttribute('data-loading', 'true')
    expect(screen.queryByText('正在请它出来…')).not.toBeInTheDocument()
    expect(
      screen.queryByText('正在请第一位朋友出来……'),
    ).not.toBeInTheDocument()
    expect(document.querySelector('.stage-loading')).toBeVisible()
    expect(focusButton).toBeDisabled()
    expect(
      screen.queryByAltText('剑龙的展示照片'),
    ).not.toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(screen.queryByText('正在请它出来…')).not.toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(screen.getByText('正在请第一位朋友出来……')).toBeVisible()
    expect(screen.queryByText('正在请它出来…')).not.toBeInTheDocument()

    const loadFailure = new Error('mock model failure')
    await act(async () => {
      staged.reject(loadFailure)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(card).toHaveAttribute('data-failed', 'true')
    expect(
      screen.getByText('点我再试'),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: '重新加载模型' }),
    ).toBeVisible()
    expect(screen.getByAltText('剑龙的展示照片')).toBeVisible()
    expect(document.querySelector('.stage-loading')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '剑龙' })).toBeVisible()
    expect(screen.getByRole('button', { name: '听它的介绍' })).toBeEnabled()

    configureSuccessfulViewer()
    fireEvent.click(card)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(document.getElementById('museum-experience')).toHaveAttribute(
      'data-ready-animal-id',
      'stegosaurus',
    )
    expect(focusButton).toBeEnabled()
  })

  it('aborts adjacent idle preloading before starting a user selection', async () => {
    vi.useFakeTimers()
    let idleSignal: AbortSignal | undefined
    const fetchMock = vi.fn(
      (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          idleSignal = init?.signal ?? undefined
          idleSignal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          )
        }),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<App />)
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(document.getElementById('museum-experience')).toHaveAttribute(
      'data-ready-animal-id',
      'stegosaurus',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000)
      await vi.advanceTimersToNextTimerAsync()
    })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(idleSignal?.aborted).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '下一只动物' }))

    expect(idleSignal?.aborted).toBe(true)
  })

  it('preserves unrelated query parameters and the hash when committing an animal', async () => {
    window.history.replaceState(
      {},
      '',
      '/museum?campaign=forest&animal=missing#details',
    )

    await renderReadyApp()

    const currentUrl = new URL(window.location.href)
    expect(currentUrl.pathname).toBe('/museum')
    expect(currentUrl.searchParams.get('campaign')).toBe('forest')
    expect(currentUrl.searchParams.get('animal')).toBe('stegosaurus')
    expect(currentUrl.hash).toBe('#details')
  })

  it('does not reposition the animal rail merely because a card receives focus', async () => {
    const originalScrollIntoView = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'scrollIntoView',
    )
    const scrollIntoView = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    try {
      await renderReadyApp()
      scrollIntoView.mockClear()

      fireEvent.focus(screen.getByRole('button', { name: '查看剑龙' }))

      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      if (originalScrollIntoView) {
        Object.defineProperty(
          HTMLElement.prototype,
          'scrollIntoView',
          originalScrollIntoView,
        )
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
      }
    }
  })

  it('keeps content and controls available with a poster when WebGL is unavailable', async () => {
    viewerMock.failConstruction = true
    render(<App />)

    expect(
      await screen.findByText('今天先看看它的照片吧'),
    ).toBeVisible()
    expect(screen.getByText('这个浏览器现在不能显示 3D 模型。')).toBeVisible()
    expect(screen.getByAltText('剑龙的展示照片')).toBeVisible()
    expect(screen.getByRole('heading', { name: '剑龙' })).toBeVisible()
    expect(screen.getByRole('button', { name: '听它的介绍' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '专注看模型' })).toBeDisabled()
    expect(screen.getByRole('region', { name: '动物选择' })).toBeVisible()

    viewerMock.failConstruction = false
    await userEvent.click(
      screen.getByRole('button', { name: '重新加载模型' }),
    )
    await waitFor(() => {
      expect(document.getElementById('museum-experience')).toHaveAttribute(
        'data-ready-animal-id',
        'stegosaurus',
      )
    })
    expect(
      screen.queryByText('今天先看看它的照片吧'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '专注看模型' })).toBeEnabled()

    await userEvent.click(
      screen.getByRole('button', { name: '给家长的资料' }),
    )
    expect(
      screen.getByRole('dialog', { name: '给家长的资料' }),
    ).toBeVisible()
  })

  it('shows the poster after context loss and remounts a working viewer on retry', async () => {
    const user = userEvent.setup()
    await renderReadyApp()
    const initialConstructorCount = viewerMock.constructorCount
    const failureHandler = viewerMock.failureHandlers.at(-1)
    if (!failureHandler) {
      throw new Error('The mock viewer did not receive an onFailure callback')
    }

    act(() => {
      failureHandler({
        kind: 'context-lost',
        message: 'WebGL 绘图环境暂时不可用。',
      })
    })

    expect(screen.getByText('今天先看看它的照片吧')).toBeVisible()
    expect(screen.getByText('WebGL 绘图环境暂时不可用。')).toBeVisible()
    expect(screen.getByAltText('剑龙的展示照片')).toBeVisible()
    expect(screen.getByRole('heading', { name: '剑龙' })).toBeVisible()
    expect(screen.getByRole('button', { name: '听它的介绍' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '专注看模型' })).toBeDisabled()

    await user.click(
      screen.getByRole('button', { name: '重新加载模型' }),
    )
    await waitFor(() => {
      expect(viewerMock.constructorCount).toBeGreaterThan(
        initialConstructorCount,
      )
      expect(document.getElementById('museum-experience')).toHaveAttribute(
        'data-ready-animal-id',
        'stegosaurus',
      )
    })

    expect(viewerMock.destroy).toHaveBeenCalled()
    expect(
      screen.queryByText('今天先看看它的照片吧'),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '专注看模型' })).toBeEnabled()
  })

  it('cannot commit an in-flight model after context loss and keeps tokens increasing on retry', async () => {
    const staged = deferred<ReturnType<typeof stagedModel>>()
    viewerMock.stageModel.mockImplementationOnce(() => staged.promise)
    render(<App />)

    await waitFor(() => {
      expect(viewerMock.stageModel).toHaveBeenCalledOnce()
    })
    const museum = document.getElementById('museum-experience')
    const failedToken = Number(museum?.getAttribute('data-request-token'))
    const failureHandler = viewerMock.failureHandlers.at(-1)
    if (!failureHandler) {
      throw new Error('The mock viewer did not receive an onFailure callback')
    }

    act(() => {
      failureHandler({
        kind: 'context-lost',
        message: 'WebGL 绘图环境暂时不可用。',
      })
    })
    expect(screen.getByText('今天先看看它的照片吧')).toBeVisible()

    await act(async () => {
      staged.resolve(stagedModel({ id: 'stegosaurus' }))
      await staged.promise
      await Promise.resolve()
    })
    expect(viewerMock.commitModel).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(viewerMock.disposeStagedModel).toHaveBeenCalledOnce()
    })
    expect(screen.getByText('今天先看看它的照片吧')).toBeVisible()

    configureSuccessfulViewer()
    await userEvent.click(
      screen.getByRole('button', { name: '重新加载模型' }),
    )
    await waitFor(() => {
      expect(museum).toHaveAttribute('data-ready-animal-id', 'stegosaurus')
      expect(screen.queryByText('今天先看看它的照片吧')).not.toBeInTheDocument()
    })
    expect(Number(museum?.getAttribute('data-request-token'))).toBeGreaterThan(
      failedToken,
    )
  })
})
