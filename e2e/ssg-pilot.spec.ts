import { expect, test } from '@playwright/test'

test('hydrates the real English museum first frame without replacing it', async ({
  page,
}) => {
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    const text = message.text()
    if (/hydration|hydrated|didn.t match/i.test(text)) {
      hydrationErrors.push(text)
    }
  })
  page.on('pageerror', (error) => {
    if (/hydration|hydrated|didn.t match/i.test(error.message)) {
      hydrationErrors.push(error.message)
    }
  })
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

test('keeps a Mosasaurus detail page useful without JavaScript', async ({
  baseURL,
  browser,
}) => {
  if (!baseURL) {
    throw new Error('Playwright baseURL is required.')
  }
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  try {
    const response = await page.goto(`${baseURL}en/animals/mosasaurus/`)
    expect(response?.status()).toBe(200)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Mosasaurus' }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Late Cretaceous (about 82 million to 66 million years ago)',
        { exact: true },
      ),
    ).toBeVisible()
    await expect(
      page.locator('script:not([type="application/ld+json"])'),
    ).toHaveCount(1)
    await expect(page.locator('script[src]')).toHaveCount(0)
    await expect
      .poll(() =>
        page
          .locator('.animal-hero__media img')
          .evaluate((image: HTMLImageElement) => image.naturalWidth),
      )
      .toBe(1200)
  } finally {
    await context.close()
  }
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

test('persists a static detail-page language choice and keeps the same animal', async ({
  page,
}) => {
  await page.goto('./en/animals/mosasaurus/')
  await page.getByRole('link', { name: '简体中文' }).click()

  await expect(page).toHaveURL(/\/zh-CN\/animals\/mosasaurus\/$/)
  await expect(
    page.getByRole('heading', { level: 1, name: '沧龙' }),
  ).toBeVisible()
  const localeCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'museum_locale',
  )
  expect(localeCookie).toMatchObject({
    value: 'zh-CN',
    path: '/museum',
    secure: true,
    sameSite: 'Lax',
  })
})

test('uses an explicit CSR boundary for E2E fixtures without hydration recovery', async ({
  page,
}) => {
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (/hydration|didn.t match/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    if (/hydration|didn.t match/i.test(error.message)) {
      hydrationErrors.push(error.message)
    }
  })

  await page.goto('./zh-CN/?fixtures=1')
  await expect(page.locator('.animal-card[data-animal-id]')).toHaveCount(21)
  expect(hydrationErrors).toEqual([])
})

test('opens the requested 3D exhibit from a pilot detail page', async ({ page }) => {
  await page.goto('./en/animals/mosasaurus/')
  await page.getByRole('link', { name: /Explore it in the 3D museum/ }).click()

  await expect(page).toHaveURL(/\/en\/\?animal=mosasaurus$/)
  await expect(
    page.getByRole('heading', { level: 2, name: 'Mosasaurus' }),
  ).toBeVisible()
})
