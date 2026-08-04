import { expect, test, type Locator, type Page } from '@playwright/test'
import { MODEL_DATA_REMINDER_STORAGE_KEY } from '../src/model-policy'

const nestedPath = '/prehistoric-animal-museum/'

async function openMuseum(
  page: Page,
  query = '',
  options: { waitForModel?: boolean } = {},
): Promise<Locator> {
  const response = await page.goto(`.${query}`)
  expect(response?.ok()).toBe(true)
  await expect(page.getByRole('heading', { level: 1, name: '剑龙' })).toBeVisible()

  const museum = page.locator('#museum-experience')
  await expect(museum).toBeVisible()
  if (options.waitForModel !== false) {
    await expect(museum).toHaveAttribute(
      'data-ready-animal-id',
      'stegosaurus',
      { timeout: 20_000 },
    )
    await expect(page.locator('.viewer-canvas')).toBeVisible()
  }
  return museum
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate<{
    body: number
    document: number
    viewport: number
  }>(`({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth
  })`)
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1)
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1)
}

async function expectPrimaryTargetsAtLeast48Px(page: Page): Promise<void> {
  const buttons = page.locator('button:visible')
  const count = await buttons.count()
  expect(count).toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    const name = await button.getAttribute('aria-label')
      ?? (await button.textContent())
      ?? `button ${index}`
    const box = await button.boundingBox()
    expect(box, `${name} should have a layout box`).not.toBeNull()
    expect(box?.width ?? 0, `${name} width`).toBeGreaterThanOrEqual(48)
    expect(box?.height ?? 0, `${name} height`).toBeGreaterThanOrEqual(48)
  }
}

async function expectInsideViewport(
  locator: Locator,
  viewport: { width: number; height: number },
): Promise<void> {
  await expect(locator).toHaveCSS('opacity', '1')
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
  expect(box?.y ?? -1).toBeGreaterThanOrEqual(0)
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    viewport.width + 1,
  )
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
    viewport.height + 1,
  )
}

test('loads from the nested static base with Chinese semantics and accessible tooltips', async ({
  page,
}) => {
  const museum = await openMuseum(page)

  expect(new URL(page.url()).pathname).toBe(nestedPath)
  const moduleScriptUrl = await page
    .locator('script[type="module"]')
    .getAttribute('src')
  expect(moduleScriptUrl).toMatch(/^\.\/assets\//)

  await expect(
    page.getByText('看看它背上的两排骨板，像不像一列起伏的小山？', {
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByText('这是剑龙，它是一种生活在晚侏罗世的食草恐龙。', {
      exact: true,
    }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '听它的介绍' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: '查看剑龙' }),
  ).toHaveAttribute('aria-current', 'true')
  await expect(museum).toHaveAttribute(
    'data-requested-animal-id',
    'stegosaurus',
  )
  await expect(page.locator('.viewer-canvas')).toHaveAttribute(
    'data-auto-rotate',
    'true',
  )
  await expect(page.locator('.viewer-canvas')).toHaveAttribute(
    'aria-label',
    '剑龙三维模型，可拖动旋转并缩放',
  )

  const reset = page.getByRole('button', { name: '恢复初始视角' })
  await reset.hover()
  const tooltipId = await reset.getAttribute('aria-describedby')
  expect(tooltipId).toBeTruthy()
  const tooltip = page.locator(`#${tooltipId ?? ''}`)
  await expect(tooltip).toHaveRole('tooltip')
  await expect(tooltip).toHaveText('恢复初始视角')
  await expect(tooltip).toHaveCSS('opacity', '1')
})

test('pauses focus-mode rotation for four idle seconds after a drag', async ({
  page,
}) => {
  await openMuseum(page)
  await page.getByRole('button', { name: '专注看模型' }).click()
  const canvas = page.locator('.viewer-canvas')
  await expect(canvas).toHaveAttribute('data-auto-rotate', 'true')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  if (!box) {
    throw new Error('Viewer canvas did not have a layout box')
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 36, box.y + box.height / 2)
  await expect(canvas).toHaveAttribute('data-auto-rotate', 'false')
  await page.mouse.up()
  await page.waitForTimeout(3_600)
  await expect(canvas).toHaveAttribute('data-auto-rotate', 'false')
  await expect(canvas).toHaveAttribute('data-auto-rotate', 'true', {
    timeout: 1_000,
  })
})

test('shows a distinct stage loader while the first animal is arriving', async ({
  page,
}) => {
  await page.route('**/*.glb', async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 850)
    })
    await route.continue()
  })

  const museum = await openMuseum(page, '', { waitForModel: false })
  const loader = page.locator('.stage-loading')

  await expect(loader).toBeVisible()
  await expect(page.locator('.model-poster')).toHaveCount(0)
  await expect(
    page.getByText('正在请第一位朋友出来……'),
  ).toBeVisible({ timeout: 1_000 })
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'stegosaurus',
    { timeout: 20_000 },
  )
  await expect(loader).toHaveCount(0)
  await expect(page.locator('.viewer-canvas')).toBeVisible()
})

test('keeps the first-arrival treatment visible for a useful minimum', async ({
  page,
}) => {
  const startedAt = Date.now()
  const museum = await openMuseum(page, '', { waitForModel: false })

  await expect(page.locator('.stage-loading')).toBeVisible()
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'stegosaurus',
    { timeout: 20_000 },
  )
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(800)
})

test('keeps every initial model surface transparent across a hard refresh', async ({
  page,
}) => {
  await page.route('**/*.glb', async (route) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 1_100)
    })
    await route.continue()
  })

  const assertTransparentStage = async () => {
    await expect(
      page.getByRole('heading', { level: 1, name: '剑龙' }),
    ).toBeVisible()
    await expect(page.locator('.scene-background img')).toBeVisible()
    await expect(page.locator('.viewer-canvas')).toBeVisible()
    const paints = await page.evaluate<{
      body: string
      canvas: string
      clearAlpha: number | null
      host: string
      root: string
      stage: string
    }>(`(() => {
      const canvas = document.querySelector('.viewer-canvas')
      const host = document.querySelector('.viewer-host')
      const stage = document.querySelector('.viewer-stage')
      if (!(canvas instanceof HTMLCanvasElement) || !host || !stage) {
        throw new Error('The transparent viewer surfaces are missing.')
      }
      const context = canvas.getContext('webgl2') || canvas.getContext('webgl')
      const clearValue = context
        ? context.getParameter(context.COLOR_CLEAR_VALUE)
        : null
      return {
        body: getComputedStyle(document.body).backgroundColor,
        canvas: getComputedStyle(canvas).backgroundColor,
        clearAlpha: clearValue ? clearValue[3] : null,
        host: getComputedStyle(host).backgroundColor,
        root: getComputedStyle(document.documentElement).backgroundColor,
        stage: getComputedStyle(stage).backgroundColor
      }
    })()`)

    expect(paints.root).not.toBe('rgb(255, 255, 255)')
    expect(paints.body).not.toBe('rgb(255, 255, 255)')
    expect(paints.canvas).toBe('rgba(0, 0, 0, 0)')
    expect(paints.host).toBe('rgba(0, 0, 0, 0)')
    expect(paints.stage).toBe('rgba(0, 0, 0, 0)')
    expect(paints.clearAlpha).toBe(0)
  }

  await page.goto('.')
  await assertTransparentStage()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await assertTransparentStage()
})

test('switches the bounded CSS atmosphere with the committed exhibit', async ({
  page,
}) => {
  const museum = await openMuseum(page, '?fixtures=1')
  await expect(museum).toHaveAttribute('data-habitat', 'land')
  await expect(museum).toHaveAttribute('data-atmosphere', 'forest')
  await expect(page.locator('.forest-atmosphere')).toBeVisible()
  await expect(page.locator('.underwater-atmosphere')).toHaveCount(0)

  await page.getByRole('button', { name: '查看快快龙' }).click()
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'fixture-fast', {
    timeout: 20_000,
  })
  await expect(museum).toHaveAttribute('data-habitat', 'water')
  await expect(museum).toHaveAttribute('data-atmosphere', 'underwater')
  await expect(page.locator('.forest-atmosphere')).toHaveCount(0)
  const atmosphere = page.locator('.underwater-atmosphere')
  await expect(atmosphere).toBeVisible()
  await expect(atmosphere).toHaveCSS('pointer-events', 'none')
  await expect(atmosphere.locator('.underwater-bubble')).toHaveCount(12)
  await expect(atmosphere.locator('.underwater-current').first()).toHaveCSS(
    'animation-name',
    'underwater-current-drift',
  )

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(atmosphere.locator('.underwater-bubble').first()).toHaveCSS(
    'display',
    'none',
  )
  await expect(atmosphere.locator('.underwater-current').first()).toHaveCSS(
    'animation-name',
    'none',
  )
  await expect(atmosphere.locator('.underwater-bubbles')).not.toHaveCSS(
    'background-image',
    'none',
  )

  await page.getByRole('button', { name: '查看再试龙' }).click()
  await page.getByRole('button', { name: '查看再试龙，加载失败，点击重试' }).click()
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'fixture-retry', {
    timeout: 20_000,
  })
  await expect(museum).toHaveAttribute('data-habitat', 'land')
  await expect(museum).toHaveAttribute('data-atmosphere', 'forest')
  await expect(page.locator('.forest-atmosphere')).toBeVisible()
  await expect(page.locator('.underwater-atmosphere')).toHaveCount(0)
})

test('refits when the composition frame changes without a viewport resize', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openMuseum(page)

  const canvas = page.locator('.viewer-canvas')
  const frame = page.locator('.viewer-composition-frame')
  const stage = page.getByTestId('model-stage')
  const stageBefore = await stage.boundingBox()
  const frameBefore = await frame.boundingBox()
  expect(stageBefore).not.toBeNull()
  expect(frameBefore).not.toBeNull()

  await page.evaluate(`(() => {
    const element = document.querySelector('.viewer-composition-frame')
    if (element) {
      element.setAttribute(
        'style',
        'position: fixed; inset: auto; top: 200px; left: 20px; width: 200px; height: 200px;'
      )
    }
  })()`)

  await expect
    .poll(async () => {
      const frameBox = await frame.boundingBox()
      return {
        measured: Math.round(frameBox?.width ?? 0),
        fitted: Number(await canvas.getAttribute('data-composition-width')),
      }
    })
    .toEqual({ measured: 200, fitted: 200 })

  const stageAfter = await stage.boundingBox()
  expect(stageAfter?.width).toBeCloseTo(stageBefore?.width ?? 0, 0)
  expect(stageAfter?.height).toBeCloseTo(stageBefore?.height ?? 0, 0)

  await page.evaluate(`(() => {
    document
      .querySelector('.viewer-composition-frame')
      ?.removeAttribute('style')
  })()`)

  await expect
    .poll(async () => {
      const frameBox = await frame.boundingBox()
      return {
        measured: Math.round(frameBox?.width ?? 0),
        fitted: Number(await canvas.getAttribute('data-composition-width')),
      }
    })
    .toEqual({
      measured: Math.round(frameBefore?.width ?? 0),
      fitted: Math.round(frameBefore?.width ?? 0),
    })
})

test('reveals the local loading label after 300 ms while preserving the ready animal', async ({
  page,
}) => {
  await page.clock.install()
  const museum = await openMuseum(page, '?fixtures=1')
  const slowCard = page.getByRole('button', { name: '查看慢慢龙' })
  const browserTime = await page.evaluate(() => Date.now())
  await page.clock.pauseAt(browserTime + 60_000)

  await slowCard.click()
  await expect(museum).toHaveAttribute('data-requested-animal-id', 'fixture-slow')
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'stegosaurus')
  await expect(page.getByRole('heading', { name: '剑龙' })).toBeVisible()
  await expect(page.locator('.scene-background--solo img')).not.toHaveAttribute(
    'src',
    /fixture-slow/,
  )
  await expect(slowCard).toHaveAttribute('data-loading', 'true')
  await expect(page.getByText('正在请它出来…')).toHaveCount(0)

  await page.clock.runFor(299)
  await expect(page.getByText('正在请它出来…')).toHaveCount(0)
  await page.clock.runFor(1)
  await expect(page.getByText('正在请它出来…')).toBeVisible()

  await page.clock.runFor(550)
  await page.clock.resume()
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'fixture-slow',
    { timeout: 20_000 },
  )
  await expect(page.getByRole('heading', { name: '慢慢龙' })).toBeVisible()
  await expect(page.getByText('正在请它出来…')).toHaveCount(0)
})

test('keeps the fast selection when an uncancellable slow result arrives later', async ({
  page,
}) => {
  const museum = await openMuseum(page, '?fixtures=1')
  await page.evaluate(`(() => {
    const probe = {
      outgoingAppeared: false,
      outgoingPreservedInitial: false,
      outgoingRemoved: false,
      coverOpacities: [],
      viewerStates: [],
      transitionPhases: []
    }
    Object.defineProperty(window, '__museumTransitionProbe', {
      configurable: true,
      value: probe
    })
    document
      .querySelector('.scene-background')
      ?.setAttribute('data-probe-background', 'initial')
    const inspect = () => {
      const outgoing = document.querySelector('.scene-background--outgoing')
      if (outgoing) {
        probe.outgoingAppeared = true
        if (outgoing.getAttribute('data-probe-background') === 'initial') {
          probe.outgoingPreservedInitial = true
        }
      } else if (probe.outgoingAppeared) {
        probe.outgoingRemoved = true
      }
      const state = document
        .querySelector('.viewer-canvas')
        ?.getAttribute('data-transitioning')
      if (state && probe.viewerStates.at(-1) !== state) {
        probe.viewerStates.push(state)
      }
      const phase = document
        .querySelector('.viewer-canvas')
        ?.getAttribute('data-transition-phase')
      if (phase && probe.transitionPhases.at(-1) !== phase) {
        probe.transitionPhases.push(phase)
      }
      const cover = Number.parseFloat(
        document
          .querySelector('.viewer-host')
          ?.style.getPropertyValue('--model-transition-cover') ?? ''
      )
      if (Number.isFinite(cover)) {
        probe.coverOpacities.push(cover)
      }
    }
    new MutationObserver((records) => {
      for (const record of records) {
        if (
          record.attributeName === 'data-transition-phase' &&
          record.oldValue &&
          probe.transitionPhases.at(-1) !== record.oldValue
        ) {
          probe.transitionPhases.push(record.oldValue)
        }
      }
      inspect()
    }).observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: [
        'class',
        'data-transitioning',
        'data-transition-phase',
        'style'
      ],
      childList: true,
      subtree: true
    })
    inspect()
  })()`)

  await page.getByRole('button', { name: '查看慢慢龙' }).click()
  await expect(museum).toHaveAttribute('data-requested-animal-id', 'fixture-slow')
  await page.getByRole('button', { name: '查看快快龙' }).click()
  await expect(museum).toHaveAttribute('data-requested-animal-id', 'fixture-fast')

  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'fixture-fast',
    { timeout: 20_000 },
  )
  await expect(page.getByRole('heading', { name: '快快龙' })).toBeVisible()
  await expect(page.locator('.viewer-canvas')).toHaveAttribute(
    'aria-label',
    '快快龙三维模型，可拖动旋转并缩放',
  )
  await expect(
    page.locator(
      '.scene-background:not(.scene-background--outgoing) img',
    ),
  ).toHaveAttribute('src', /#fixture-fast$/)
  await expect(page.locator('.model-poster')).toHaveCount(0)
  await expect
    .poll(() =>
      page.evaluate<boolean>(
        `Boolean(
          window.__museumTransitionProbe?.outgoingAppeared &&
          window.__museumTransitionProbe?.outgoingPreservedInitial
        )`,
      ),
    )
    .toBe(true)

  // The slow fixture ignores AbortSignal and still produces a staged model.
  // Waiting past its delay proves that late success cannot overwrite the page.
  await page.waitForTimeout(1_400)
  await expect(page.locator('.scene-background--outgoing')).toHaveCount(0)
  await expect(page.locator('.viewer-canvas')).toHaveAttribute(
    'data-transitioning',
    'false',
  )
  const transitionProbe = await page.evaluate<{
    outgoingAppeared: boolean
    outgoingPreservedInitial: boolean
    outgoingRemoved: boolean
    coverOpacities: number[]
    transitionPhases: string[]
    viewerStates: string[]
  }>(`window.__museumTransitionProbe`)
  expect(transitionProbe.outgoingAppeared).toBe(true)
  expect(transitionProbe.outgoingPreservedInitial).toBe(true)
  expect(transitionProbe.outgoingRemoved).toBe(true)
  expect(transitionProbe.viewerStates).toContain('true')
  expect(transitionProbe.viewerStates.at(-1)).toBe('false')
  expect(transitionProbe.transitionPhases).toContain('outgoing')
  expect(transitionProbe.transitionPhases).toContain('incoming')
  expect(transitionProbe.transitionPhases.at(-1)).toBe('idle')
  expect(Math.max(...transitionProbe.coverOpacities)).toBeGreaterThan(0.9)
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'fixture-fast')
  await expect(museum).toHaveAttribute('data-requested-animal-id', 'fixture-fast')
  await expect(page.getByRole('heading', { name: '快快龙' })).toBeVisible()
  await page.getByRole('button', { name: '给家长的资料' }).click()
  await expect(page.getByText('测试时期：快快龙')).toBeVisible()
  await expect(page.getByText('测试展区：快快龙')).toBeVisible()
  await page.getByRole('button', { name: '关闭家长资料' }).click()
})

test('keeps the ready presentation on failure and retries with a fresh token', async ({
  page,
}) => {
  const museum = await openMuseum(page, '?fixtures=1')
  const retryCard = page.getByRole('button', { name: '查看再试龙' })
  const tokenBefore = Number(await museum.getAttribute('data-request-token'))

  await retryCard.click()
  await expect(retryCard).toHaveAttribute('data-failed', 'true')
  await expect(
    page.getByText('点我再试'),
  ).toBeVisible()
  await expect(retryCard).toHaveAccessibleName(
    '查看再试龙，加载失败，点击重试',
  )
  await expect(page.getByRole('status')).toContainText(
    '再试龙暂时没准备好，可以点击它的卡片重试。',
  )
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'stegosaurus')
  const failedToken = Number(await museum.getAttribute('data-request-token'))
  expect(failedToken).toBeGreaterThan(tokenBefore)

  await retryCard.click()
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'fixture-retry',
    { timeout: 20_000 },
  )
  const retriedToken = Number(await museum.getAttribute('data-request-token'))
  expect(retriedToken).toBeGreaterThan(failedToken)
  await expect(page.getByRole('heading', { name: '再试龙' })).toBeVisible()
  await expect(
    page.getByText('点我再试'),
  ).toHaveCount(0)
})

test('shows the poster for an initial model failure and succeeds on explicit retry', async ({
  page,
}) => {
  let firstModelRequest = true
  await page.route('**/*.glb', async (route) => {
    if (firstModelRequest) {
      firstModelRequest = false
      await route.fulfill({
        body: 'deterministic model request failure',
        contentType: 'text/plain',
        status: 503,
      })
      return
    }
    await route.continue()
  })
  const museum = await openMuseum(page, '', {
    waitForModel: false,
  })

  await expect(page.getByText('今天先看看它的照片吧')).toBeVisible()
  await expect(
    page.getByText('它暂时没准备好，再点一次试试。'),
  ).toBeVisible()
  await expect(page.getByAltText('剑龙的展示照片')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '专注看模型' }),
  ).toBeDisabled()
  await expect(museum).toHaveAttribute('data-ready-animal-id', '')

  const failedToken = Number(await museum.getAttribute('data-request-token'))
  await page.getByRole('button', { name: '重新加载模型' }).click()
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'stegosaurus',
    { timeout: 20_000 },
  )
  expect(Number(await museum.getAttribute('data-request-token'))).toBeGreaterThan(
    failedToken,
  )
  await expect(page.getByText('今天先看看它的照片吧')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '专注看模型' }),
  ).toBeEnabled()
})

test('keeps content, navigation, narration state, and parent facts in WebGL fallback', async ({
  page,
}) => {
  await page.addInitScript({
    content: `(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
        if (contextId === 'webgl' || contextId === 'webgl2') {
          return null
        }
        return originalGetContext.call(this, contextId, ...args)
      }
    })()`,
  })
  const museum = await openMuseum(page, '', {
    waitForModel: false,
  })

  await expect(museum).toHaveAttribute('data-ready-animal-id', 'stegosaurus')
  await expect(page.getByText('今天先看看它的照片吧')).toBeVisible()
  await expect(
    page.getByText('这个浏览器现在不能显示 3D 模型。'),
  ).toBeVisible()
  await expect(page.getByAltText('剑龙的展示照片')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '听它的介绍' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: '专注看模型' }),
  ).toBeDisabled()
  await expect(page.getByRole('region', { name: '动物选择' })).toBeVisible()

  await page.getByRole('button', { name: '重新加载模型' }).click()
  await expect(page.getByText('今天先看看它的照片吧')).toBeVisible()
  await expect(page.getByAltText('剑龙的展示照片')).toBeVisible()
  await expect(
    page.getByRole('button', { name: '专注看模型' }),
  ).toBeDisabled()

  await page.getByRole('button', { name: '给家长的资料' }).click()
  await expect(
    page.getByRole('dialog', { name: '给家长的资料' }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('dialog', { name: '给家长的资料' })
      .getByText('晚侏罗世', { exact: true }),
  ).toBeVisible()
})

test('honors reduced motion for loading and viewer startup', async ({
  browser,
}, testInfo) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') {
    throw new Error('The Playwright project must provide a baseURL')
  }
  const context = await browser.newContext({
    baseURL,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()
  try {
    await openMuseum(page, '?fixtures=1')
    expect(
      await page.evaluate<boolean>(
        `window.matchMedia('(prefers-reduced-motion: reduce)').matches`,
      ),
    ).toBe(true)

    await page.getByRole('button', { name: '查看慢慢龙' }).click()
    const spinner = page.locator('.loading-orbit')
    await expect(spinner).toBeVisible()
    const duration = await page.evaluate<number>(`(() => {
      const element = document.querySelector('.loading-orbit')
      if (!element) {
        return Number.POSITIVE_INFINITY
      }
      const value = getComputedStyle(element).animationDuration
      if (value.endsWith('ms')) {
        return Number.parseFloat(value)
      }
      return Number.parseFloat(value) * 1_000
    })()`)
    expect(duration).toBeLessThanOrEqual(80)

    await page.getByRole('button', { name: '专注看模型' }).click()
    await expect(page.locator('.viewer-canvas')).toHaveAttribute(
      'data-auto-rotate',
      'false',
    )
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(page.locator('.viewer-canvas')).toHaveAttribute(
      'data-auto-rotate',
      'true',
    )
  } finally {
    await context.close()
  }
})

test('gives narrow touch layouts one calm data reminder and large-model notices', async ({
  browser,
}, testInfo) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') {
    throw new Error('The Playwright project must provide a baseURL')
  }
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  })
  const page = await context.newPage()

  try {
    await openMuseum(page, '?fixtures=1')
    const notice = page.locator('.model-data-notice')
    await expect(notice).toHaveAttribute('data-notice-kind', 'first-entry')
    await expect(notice).toContainText(
      '3D 动物会使用一些流量，连接 Wi‑Fi 时观看会更顺畅',
    )
    await expect(notice).toHaveAttribute('role', 'status')
    expect(
      await page.evaluate<string | null>(
        `window.localStorage.getItem(${JSON.stringify(
          MODEL_DATA_REMINDER_STORAGE_KEY,
        )})`,
      ),
    ).toBe('seen')
    const animationDuration = await page.evaluate<string>(
      `getComputedStyle(document.querySelector('.model-data-notice')).animationDuration`,
    )
    const animationDurationMs = animationDuration.endsWith('ms')
      ? Number.parseFloat(animationDuration)
      : Number.parseFloat(animationDuration) * 1_000
    expect(animationDurationMs).toBeLessThanOrEqual(1)

    await page.getByRole('button', { name: '关闭模型流量提示' }).click()
    await expect(notice).toHaveCount(0)

    await page.getByRole('button', { name: '查看慢慢龙' }).click()
    await expect(
      page.locator('#museum-experience'),
    ).toHaveAttribute('data-ready-animal-id', 'fixture-slow', {
      timeout: 20_000,
    })
    await expect(notice).toHaveAttribute('data-notice-kind', 'large-model')
    await expect(notice).toContainText(
      '慢慢龙的 3D 模型约 9.0 MiB，加载可能会久一点',
    )

    await page.getByRole('button', { name: '关闭模型流量提示' }).click()
    await page.getByRole('button', { name: '查看快快龙' }).click()
    await expect(
      page.locator('#museum-experience'),
    ).toHaveAttribute('data-ready-animal-id', 'fixture-fast', {
      timeout: 20_000,
    })
    await expect(notice).toHaveCount(0)

    await page.reload()
    await expect(
      page.locator('#museum-experience'),
    ).toHaveAttribute('data-ready-animal-id', 'fixture-fast', {
      timeout: 20_000,
    })
    await expect(notice).toHaveCount(0)
  } finally {
    await context.close()
  }
})

for (const width of [768, 1023]) {
  test(`keeps the narration script popover inside a ${width}px tablet viewport`, async ({
    page,
  }) => {
    const viewport = { width, height: 768 }
    await page.setViewportSize(viewport)
    await openMuseum(page)

    await page.locator('.narration-control').hover()
    const popover = page.locator('.narration-script-popover')
    await expect(popover).toBeVisible()
    await expectInsideViewport(popover, viewport)
  })
}

test('preserves the committed animal and switches the picture source after orientation change', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const museum = await openMuseum(page, '?fixtures=1')
  await page.getByRole('button', { name: '查看快快龙' }).click()
  await expect(museum).toHaveAttribute(
    'data-ready-animal-id',
    'fixture-fast',
    { timeout: 20_000 },
  )

  const portraitSource = await page.evaluate<string>(
    `document.querySelector('.scene-background img')?.currentSrc ?? ''`,
  )
  expect(portraitSource).toContain('portrait')

  await page.setViewportSize({ width: 844, height: 390 })
  await expect
    .poll(() =>
      page.evaluate<string>(
        `document.querySelector('.scene-background img')?.currentSrc ?? ''`,
      ),
    )
    .not.toBe(portraitSource)
  const landscapeSource = await page.evaluate<string>(
    `document.querySelector('.scene-background img')?.currentSrc ?? ''`,
  )
  expect(landscapeSource).toContain('landscape')
  await expect(museum).toHaveAttribute('data-ready-animal-id', 'fixture-fast')
  await expect(page.getByRole('heading', { name: '快快龙' })).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

const requiredViewports = [
  { name: 'phone-360x640', width: 360, height: 640 },
  { name: 'phone-390x844', width: 390, height: 844 },
  { name: 'compact-tablet-767x1024', width: 767, height: 1024 },
  { name: 'phone-landscape-844x390', width: 844, height: 390 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'tablet-1023x1365', width: 1023, height: 1365 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
] as const

test.describe('required responsive viewports', () => {
  test.describe.configure({ mode: 'serial' })

  for (const viewport of requiredViewports) {
    test(`${viewport.name} has safe controls, rail, drawer, and model focus`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      })
      await openMuseum(page, '?fixtures=1')
      await expectNoHorizontalOverflow(page)
      await expectPrimaryTargetsAtLeast48Px(page)
      const focusButton = page.getByRole('button', { name: '专注看模型' })
      await focusButton.hover()
      const focusTooltipId = await focusButton.getAttribute('aria-describedby')
      expect(focusTooltipId).toBeTruthy()
      const focusTooltip = page.locator(`#${focusTooltipId ?? ''}`)
      await expect(focusTooltip).toBeVisible()
      await expectInsideViewport(focusTooltip, viewport)

      for (const name of ['上一只动物', '下一只动物']) {
        const step = page.getByRole('button', { name })
        await step.hover()
        const tooltipId = await step.getAttribute('aria-describedby')
        expect(tooltipId).toBeTruthy()
        const tooltip = page.locator(`#${tooltipId ?? ''}`)
        await expect(tooltip).toBeVisible()
        await expectInsideViewport(tooltip, viewport)
      }

      const stage = page.getByTestId('model-stage')
      const stageBox = await stage.boundingBox()
      expect(stageBox).not.toBeNull()
      expect(stageBox?.x).toBeCloseTo(0, 0)
      expect(stageBox?.y).toBeCloseTo(0, 0)
      expect(stageBox?.width).toBeCloseTo(viewport.width, 0)
      expect(stageBox?.height).toBeCloseTo(viewport.height, 0)
      const canvasBox = await page.locator('.viewer-canvas').boundingBox()
      expect(canvasBox?.x).toBeCloseTo(0, 0)
      expect(canvasBox?.y).toBeCloseTo(0, 0)
      expect(canvasBox?.width).toBeCloseTo(viewport.width, 0)
      expect(canvasBox?.height).toBeCloseTo(viewport.height, 0)

      if (viewport.width >= 1024 && viewport.width > viewport.height) {
        const storyBox = await page.locator('.story-panel').boundingBox()
        const compositionLeft = Number(
          await page
            .locator('.viewer-canvas')
            .getAttribute('data-composition-left'),
        )
        expect(storyBox).not.toBeNull()
        expect(compositionLeft).toBeGreaterThanOrEqual(
          (storyBox?.x ?? 0) + (storyBox?.width ?? 0) - 1,
        )
      }

      const intro = page.locator('.child-intro')
      await expect(intro).toBeVisible()
      const introLayout = await page.evaluate<{
        clientHeight: number
        scrollHeight: number
        textOverflow: string
        whiteSpace: string
      }>(`(() => {
        const element = document.querySelector('.child-intro')
        if (!(element instanceof HTMLElement)) {
          throw new Error('The child introduction is missing.')
        }
        const style = getComputedStyle(element)
        return {
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          textOverflow: style.textOverflow,
          whiteSpace: style.whiteSpace
        }
      })()`)
      expect(introLayout.whiteSpace).toBe('normal')
      expect(introLayout.textOverflow).not.toBe('ellipsis')
      expect(introLayout.scrollHeight).toBeLessThanOrEqual(
        introLayout.clientHeight + 1,
      )

      if (
        viewport.width >= 768 &&
        viewport.width <= 1023 &&
        viewport.height > viewport.width
      ) {
        const storyPanelBox = await page.locator('.story-panel').boundingBox()
        const museumKickerBox = await page
          .locator('.museum-kicker')
          .boundingBox()
        const titleBox = await page.locator('h1').boundingBox()
        const introBox = await intro.boundingBox()
        const animalEyebrowBox = await page
          .locator('.animal-eyebrow')
          .boundingBox()
        const storyActionsBox = await page
          .locator('.story-actions')
          .boundingBox()
        const stageActionsBox = await page
          .locator('.stage-actions')
          .boundingBox()

        expect(storyPanelBox).not.toBeNull()
        expect(museumKickerBox).not.toBeNull()
        expect(titleBox).not.toBeNull()
        expect(introBox).not.toBeNull()
        expect(animalEyebrowBox).not.toBeNull()
        expect(storyActionsBox).not.toBeNull()
        expect(stageActionsBox).not.toBeNull()
        expect(storyPanelBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThan(
          180,
        )
        expect(
          Math.abs((museumKickerBox?.x ?? 0) - (titleBox?.x ?? 0)),
        ).toBeLessThanOrEqual(1)
        expect(titleBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
          (introBox?.y ?? 0) + (introBox?.height ?? 0),
        )
        expect(introBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
          (titleBox?.y ?? 0) + (titleBox?.height ?? 0),
        )
        expect(
          Math.abs((museumKickerBox?.y ?? 0) - (animalEyebrowBox?.y ?? 0)),
        ).toBeLessThanOrEqual(1)
        expect(
          Math.abs(
            (animalEyebrowBox?.x ?? 0) +
              (animalEyebrowBox?.width ?? 0) -
              ((storyActionsBox?.x ?? 0) + (storyActionsBox?.width ?? 0)),
          ),
        ).toBeLessThanOrEqual(1)
        expect(storyActionsBox?.y ?? -1).toBeGreaterThanOrEqual(
          (animalEyebrowBox?.y ?? 0) +
            (animalEyebrowBox?.height ?? 0) +
            4,
        )
        expect(stageActionsBox?.y ?? -1).toBeGreaterThanOrEqual(
          (storyPanelBox?.y ?? 0) + (storyPanelBox?.height ?? 0),
        )
      }

      if (viewport.width <= 767 && viewport.height > viewport.width) {
        const introTextBox = await page
          .locator('.child-intro > span')
          .boundingBox()
        const storyCardBox = await page.locator('.story-card').boundingBox()
        const introTextSize = await page.evaluate<{
          clientHeight: number
          lineHeight: number
          scrollHeight: number
        }>(`(() => {
          const element = document.querySelector('.child-intro > span')
          if (!(element instanceof HTMLElement)) {
            throw new Error('The child introduction text is missing.')
          }
          return {
            clientHeight: element.clientHeight,
            lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
            scrollHeight: element.scrollHeight
          }
        })()`)
        const storyActionsBox = await page
          .locator('.story-actions')
          .boundingBox()
        const animalNavigationBox = await page
          .locator('.animal-navigation')
          .boundingBox()
        expect(introTextBox).not.toBeNull()
        expect(storyCardBox).not.toBeNull()
        expect(storyActionsBox).not.toBeNull()
        expect(animalNavigationBox).not.toBeNull()
        expect(introTextSize.scrollHeight).toBeLessThanOrEqual(
          introTextSize.clientHeight + 1,
        )
        expect(
          Math.abs(
            (storyActionsBox?.width ?? 0) -
              (animalNavigationBox?.width ?? 0),
          ),
        ).toBeLessThanOrEqual(1)
        if (viewport.width >= 600) {
          expect(introTextSize.scrollHeight).toBeLessThanOrEqual(
            Math.ceil(introTextSize.lineHeight) + 1,
          )
        }
        expect(introTextBox?.x ?? -1).toBeGreaterThanOrEqual(
          storyCardBox?.x ?? 0,
        )
        expect(introTextBox?.y ?? -1).toBeGreaterThanOrEqual(
          storyCardBox?.y ?? 0,
        )
        expect(
          (introTextBox?.x ?? 0) + (introTextBox?.width ?? 0),
        ).toBeLessThanOrEqual(
          (storyCardBox?.x ?? 0) + (storyCardBox?.width ?? 0) + 1,
        )
        expect(
          (introTextBox?.y ?? 0) + (introTextBox?.height ?? 0),
        ).toBeLessThanOrEqual(
          (storyCardBox?.y ?? 0) + (storyCardBox?.height ?? 0) + 1,
        )

        const stageActionsBox = await page
          .locator('.stage-actions')
          .boundingBox()
        expect(stageActionsBox).not.toBeNull()
        expect(stageActionsBox?.width ?? 0).toBeGreaterThan(
          stageActionsBox?.height ?? Number.POSITIVE_INFINITY,
        )
        const compositionTop = Number(
          await page
            .locator('.viewer-canvas')
            .getAttribute('data-composition-top'),
        )
        expect(stageActionsBox?.y ?? -1).toBeGreaterThanOrEqual(
          compositionTop - 1,
        )
        expect(stageActionsBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(
          compositionTop + 80,
        )
      }

      const rail = page.locator('.animal-rail')
      await expect(rail).toBeVisible()
      const railDimensions = await page.evaluate<{
        clientHeight: number
        clientWidth: number
        scrollHeight: number
        scrollWidth: number
      }>(`(() => {
          const element = document.querySelector('.animal-rail')
          return {
            clientHeight: element?.clientHeight ?? 0,
            clientWidth: element?.clientWidth ?? 0,
            scrollHeight: element?.scrollHeight ?? 0,
            scrollWidth: element?.scrollWidth ?? 0
          }
        })()`)
      expect(railDimensions.clientHeight).toBeGreaterThan(0)
      expect(railDimensions.clientWidth).toBeGreaterThan(0)
      expect(railDimensions.scrollHeight).toBeGreaterThanOrEqual(
        railDimensions.clientHeight,
      )
      expect(railDimensions.scrollWidth).toBeGreaterThanOrEqual(
        railDimensions.clientWidth,
      )

      const landscapePhone =
        viewport.height <= 500 && viewport.width > viewport.height
      if (landscapePhone) {
        const navigationBox = await page
          .locator('.animal-navigation')
          .boundingBox()
        const selectedCardBox = await page
          .locator('.animal-card[data-selected="true"]')
          .boundingBox()
        expect(navigationBox).not.toBeNull()
        expect(selectedCardBox).not.toBeNull()
        expect(navigationBox?.width ?? 0).toBeGreaterThan(
          navigationBox?.height ?? Number.POSITIVE_INFINITY,
        )
        expect(selectedCardBox?.y ?? -1).toBeGreaterThanOrEqual(
          navigationBox?.y ?? 0,
        )
        expect(
          (selectedCardBox?.y ?? 0) + (selectedCardBox?.height ?? 0),
        ).toBeLessThanOrEqual(
          (navigationBox?.y ?? 0) + (navigationBox?.height ?? 0) + 1,
        )
      }

      const lastCard = page.getByRole('button', { name: '查看再试龙' })
      await lastCard.scrollIntoViewIfNeeded()
      await expect(lastCard).toBeInViewport()
      await lastCard.focus()
      await expect(lastCard).toBeFocused()
      if (railDimensions.scrollWidth > railDimensions.clientWidth + 1) {
        expect(
          await page.evaluate<number>(`(() => {
            const element = document.querySelector('.animal-rail')
            if (!element) {
              return 0
            }
            element.scrollLeft = element.scrollWidth
            return element.scrollLeft
          })()`),
        ).toBeGreaterThan(0)
      }

      await page.getByRole('button', { name: '给家长的资料' }).click()
      const drawer = page.getByRole('dialog', { name: '给家长的资料' })
      await expect(drawer).toBeVisible()
      await expect(
        page.getByRole('region', {
          name: '动物选择',
          includeHidden: true,
        }),
      ).toHaveAttribute('inert', '')
      await expect(stage).toHaveAttribute('aria-hidden', 'true')
      await expect(stage).toHaveAttribute('inert', '')
      const drawerBox = await drawer.boundingBox()
      expect(drawerBox).not.toBeNull()
      await expect
        .poll(async () => {
          const settledBox = await drawer.boundingBox()
          return Boolean(
            settledBox &&
            settledBox.y >= 0 &&
            settledBox.x + settledBox.width <= viewport.width + 1 &&
            settledBox.y + settledBox.height <= viewport.height + 1,
          )
        })
        .toBe(true)
      const settledDrawerBox = await drawer.boundingBox()
      expect(settledDrawerBox?.y ?? -1).toBeGreaterThanOrEqual(0)
      expect(
        (settledDrawerBox?.x ?? 0) + (settledDrawerBox?.width ?? 0),
      ).toBeLessThanOrEqual(viewport.width + 1)
      expect(
        (settledDrawerBox?.y ?? 0) + (settledDrawerBox?.height ?? 0),
      ).toBeLessThanOrEqual(viewport.height + 1)
      if (viewport.width >= 1024 || viewport.width > viewport.height) {
        await expect(drawer).toHaveCSS('animation-name', 'drawer-enter-side')
        expect(settledDrawerBox?.x ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(
          18,
        )
        expect(
          (settledDrawerBox?.x ?? 0) + (settledDrawerBox?.width ?? 0),
        ).toBeLessThan(viewport.width * 0.56)
        await expect(page.locator('.drawer-backdrop')).toHaveCSS(
          'backdrop-filter',
          'none',
        )
      } else {
        await expect(drawer).toHaveCSS('animation-name', 'drawer-enter')
      }
      await page.getByRole('button', { name: '关闭家长资料' }).click()

      await page.getByRole('button', { name: '专注看模型' }).click()
      const exit = page.getByRole('button', { name: '退出模型专注模式' })
      await expect(exit).toBeVisible()
      await expect(page.getByRole('heading', { name: '剑龙' })).toHaveCount(0)
      await expect(page.getByRole('region', { name: '动物选择' })).toHaveCount(0)
      await expect(page.locator('button:visible')).toHaveCount(1)
      await expect(page.locator('.model-gesture-hint')).toBeHidden()
      const focusedStageBox = await stage.boundingBox()
      expect(focusedStageBox).not.toBeNull()
      expect(focusedStageBox?.x).toBeCloseTo(0, 0)
      expect(focusedStageBox?.y).toBeCloseTo(0, 0)
      expect(focusedStageBox?.width).toBeCloseTo(viewport.width, 0)
      expect(focusedStageBox?.height).toBeCloseTo(viewport.height, 0)
      await expectPrimaryTargetsAtLeast48Px(page)

      await page.keyboard.press('Escape')
      await expect(page.getByRole('heading', { name: '剑龙' })).toBeVisible()
      await expect(page.getByRole('region', { name: '动物选择' })).toBeVisible()
      await expectNoHorizontalOverflow(page)
    })
  }
})
