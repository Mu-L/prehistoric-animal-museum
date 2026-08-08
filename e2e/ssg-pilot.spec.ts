import { expect, test, type Page } from '@playwright/test'

const nestedPath = '/prehistoric-animal-museum/'

const pilotAnimals = [
  {
    id: 'stegosaurus',
    names: { 'zh-CN': '剑龙', en: 'Stegosaurus' },
    introductions: {
      'zh-CN': '看看它背上的两排骨板，像不像一列起伏的小山？',
      en: 'Look at the two rows of plates along its back. Do they look like a line of little hills?',
    },
    siblingId: 'tyrannosaurus-rex',
  },
  {
    id: 'tyrannosaurus-rex',
    names: { 'zh-CN': '霸王龙', en: 'Tyrannosaurus rex' },
    introductions: {
      'zh-CN': '看看它大大的脑袋、粗壮的后腿和两条短短的前肢。',
      en: 'Look at its huge head, powerful hind legs and two very short front limbs.',
    },
    siblingId: 'mosasaurus',
  },
  {
    id: 'mosasaurus',
    names: { 'zh-CN': '沧龙', en: 'Mosasaurus' },
    introductions: {
      'zh-CN': '看看它的鳍状肢和有力的尾部，你能想象它怎样在海水中向前游吗？',
      en: 'Look at its flippers and powerful tail. Can you imagine its tail pushing it forwards while the flippers steer?',
    },
    siblingId: 'stegosaurus',
  },
] as const

const detailCases = (['zh-CN', 'en'] as const).flatMap((locale) =>
  pilotAnimals.map((animal) => ({
    animalId: animal.id,
    introduction: animal.introductions[locale],
    locale,
    museumName:
      locale === 'zh-CN' ? '史前动物博物馆' : 'Prehistoric Animal Museum',
    name: animal.names[locale],
    siblingId: animal.siblingId,
  })),
)

function collectHydrationErrors(page: Page): string[] {
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (/hydration|hydrated|didn.t match/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    if (/hydration|hydrated|didn.t match/i.test(error.message)) {
      hydrationErrors.push(error.message)
    }
  })
  return hydrationErrors
}

test('hydrates the real English museum first frame without replacing it', async ({
  page,
}) => {
  const hydrationErrors = collectHydrationErrors(page)
  await page.route('**/*.glb*', (route) => route.abort())

  const response = await page.goto('./en/')
  expect(response?.status()).toBe(200)
  const source = await response?.text()
  expect(source).toContain('id="museum-experience"')
  expect(source).toContain('data-locale="en"')
  expect(source).not.toContain('class="seo-static-shell"')

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Prehistoric Animal Museum',
    }),
  ).toBeVisible()
  await expect(page.locator('a[data-animal-detail-link]')).toHaveCount(3)
  await expect(
    page.locator('a[data-animal-detail-link][data-animal-id="mosasaurus"]'),
  ).toHaveAttribute('href', './animals/mosasaurus/')
  await page.getByRole('button', { name: 'Guide for grown-ups' }).click()
  await expect(page.getByText('Late Jurassic', { exact: true })).toBeVisible()
  expect(hydrationErrors).toEqual([])
})

for (const detailCase of detailCases) {
  test(`serves the ${detailCase.locale} ${detailCase.animalId} museum deep link with useful no-JS content`, async ({
    baseURL,
    browser,
  }) => {
    if (!baseURL) {
      throw new Error('Playwright baseURL is required.')
    }
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      const response = await page.goto(
        `${baseURL}${detailCase.locale}/animals/${detailCase.animalId}/`,
      )
      expect(response?.status()).toBe(200)
      const source = await response?.text()
      expect(source).toContain('id="museum-experience"')
      expect(source).toContain('data-page-kind="animal-detail"')
      expect(source).toContain(
        `data-requested-animal-id="${detailCase.animalId}"`,
      )
      expect(source).not.toContain('class="animal-page"')
      expect(source).not.toContain('seo-static-shell')

      const museum = page.locator('#museum-experience')
      await expect(museum).toBeVisible()
      await expect(museum).toHaveAttribute('data-locale', detailCase.locale)
      await expect(museum).toHaveAttribute(
        'data-page-kind',
        'animal-detail',
      )
      await expect(
        page.getByRole('heading', { level: 1, name: detailCase.name }),
      ).toBeVisible()
      await expect(page.locator('.museum-kicker')).toContainText(
        detailCase.museumName,
      )
      await expect(
        page.getByText(detailCase.introduction, { exact: true }),
      ).toBeVisible()
      await expect(page.locator('.animal-card[data-animal-id]')).toHaveCount(18)
      await expect(page.locator('script[type="module"][src]')).toHaveCount(1)

      const still = page.locator('.model-still img')
      await expect(still).toBeVisible()
      await expect
        .poll(() => still.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0)

      await expect(page.locator('[data-museum-return]')).toHaveAttribute(
        'href',
        `../../../${detailCase.locale}/?animal=${detailCase.animalId}`,
      )
      await expect(
        page.locator(
          `[data-animal-detail-link][data-animal-id="${detailCase.siblingId}"]`,
        ),
      ).toHaveAttribute('href', `../${detailCase.siblingId}/`)
    } finally {
      await context.close()
    }
  })
}

test('hydrates a requested detail without flashing the default animal and exits its route when another animal is chosen', async ({
  page,
}) => {
  const hydrationErrors = collectHydrationErrors(page)
  await page.addInitScript(() => {
    const titleHistory: string[] = []
    Object.defineProperty(window, '__museumAnimalTitleHistory', {
      configurable: true,
      value: titleHistory,
    })
    const recordTitle = () => {
      const title = document.querySelector('.animal-title')?.textContent?.trim()
      if (title && titleHistory.at(-1) !== title) {
        titleHistory.push(title)
      }
    }
    new MutationObserver(recordTitle).observe(document, {
      characterData: true,
      childList: true,
      subtree: true,
    })
    document.addEventListener('DOMContentLoaded', recordTitle, { once: true })
  })
  await page.route('**/*.glb*', (route) => route.abort())

  const response = await page.goto('./en/animals/mosasaurus/')
  expect(response?.status()).toBe(200)
  expect(await response?.text()).toContain(
    'data-requested-animal-id="mosasaurus"',
  )
  await page.waitForLoadState('load')

  const museum = page.locator('#museum-experience')
  await expect(museum).toHaveAttribute('data-page-kind', 'animal-detail')
  await expect(museum).toHaveAttribute(
    'data-requested-animal-id',
    'mosasaurus',
  )
  await expect(
    page.getByRole('heading', { level: 1, name: 'Mosasaurus' }),
  ).toBeVisible()
  expect(new URL(page.url()).pathname).toBe(
    `${nestedPath}en/animals/mosasaurus/`,
  )
  expect(new URL(page.url()).search).toBe('')

  const titleHistory = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __museumAnimalTitleHistory: string[]
        }
      ).__museumAnimalTitleHistory,
  )
  expect(titleHistory).toContain('Mosasaurus')
  expect(titleHistory).not.toContain('Stegosaurus')
  expect(hydrationErrors).toEqual([])

  await page
    .locator(
      '[data-animal-detail-link][data-animal-id="tyrannosaurus-rex"]',
    )
    .click()
  await expect(page).toHaveURL(
    new RegExp(`${nestedPath}en/\\?animal=tyrannosaurus-rex$`),
  )
  await expect(museum).toHaveAttribute('data-page-kind', 'museum')
})

test('shows the default Chinese museum immediately when the edge redirect fails open', async ({
  page,
}) => {
  const response = await page.goto('.')
  expect(response?.status()).toBe(200)
  await expect(page.locator('.seo-static-shell')).toHaveCount(0)
  await expect(page.locator('#museum-experience')).toBeVisible()
  await expect(
    page.getByRole('heading', { level: 1, name: '史前动物博物馆' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: '切换语言，当前简体中文' }),
  ).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://leon-made-this.work/museum/zh-CN/',
  )
})

test('persists a detail language choice and keeps the equivalent animal route', async ({
  page,
}) => {
  await page.route('**/*.glb*', (route) => route.abort())
  await page.goto('./en/animals/mosasaurus/')
  await page.waitForLoadState('load')
  await page
    .getByRole('button', { name: 'Change language, current English' })
    .click()
  await page
    .getByRole('menuitemradio', { name: '简体中文', exact: true })
    .click()

  await expect(page).toHaveURL(/\/zh-CN\/animals\/mosasaurus\/$/)
  await expect(
    page.getByRole('heading', { level: 1, name: '沧龙' }),
  ).toBeVisible()
  await expect(page.locator('#museum-experience')).toHaveAttribute(
    'data-page-kind',
    'animal-detail',
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://leon-made-this.work/museum/zh-CN/animals/mosasaurus/',
  )
  await expect(
    page.locator('link[rel="alternate"][hreflang="en"]'),
  ).toHaveAttribute(
    'href',
    'https://leon-made-this.work/museum/en/animals/mosasaurus/',
  )
  const structuredData = JSON.parse(
    (await page.locator('#animal-structured-data').textContent()) ?? '{}',
  ) as { inLanguage?: string; name?: string; url?: string }
  expect(structuredData).toMatchObject({
    inLanguage: 'zh-CN',
    name: '沧龙',
    url: 'https://leon-made-this.work/museum/zh-CN/animals/mosasaurus/',
  })

  const localeCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'museum_locale',
  )
  expect(localeCookie).toMatchObject({
    value: 'zh-CN',
    path: nestedPath.slice(0, -1),
    secure: true,
    sameSite: 'Lax',
  })
})

test('returns from a direct detail deep link to the matching museum exhibit and opens the full guide', async ({
  page,
}) => {
  await page.route('**/*.glb*', (route) => route.abort())
  await page.goto('./en/animals/mosasaurus/')
  await page.waitForLoadState('load')

  const returnLink = page.locator('a[data-museum-return]')
  await expect(returnLink).toHaveAttribute(
    'href',
    '../../../en/?animal=mosasaurus',
  )
  await returnLink.click()

  await expect(page).toHaveURL(new RegExp(`${nestedPath}en/\\?animal=mosasaurus$`))
  await expect(page.locator('#museum-experience')).toHaveAttribute(
    'data-page-kind',
    'museum',
  )
  await expect(page.locator('.museum-kicker')).toContainText(
    'Prehistoric Animal Museum',
  )
  await expect(page.locator('.animal-title')).toHaveText('Mosasaurus')
  await expect(page.locator('.museum-kicker')).toHaveJSProperty(
    'tagName',
    'H1',
  )
  await expect(page.locator('.animal-title')).toHaveJSProperty(
    'tagName',
    'H2',
  )
  await expect(
    page.getByRole('dialog', { name: 'Museum guide' }),
  ).toBeVisible()
})

test('uses an explicit CSR boundary for E2E fixtures without hydration recovery', async ({
  page,
}) => {
  const hydrationErrors = collectHydrationErrors(page)

  await page.goto('./zh-CN/?fixtures=1')
  await expect(page.locator('.animal-card[data-animal-id]')).toHaveCount(21)
  expect(hydrationErrors).toEqual([])
})
