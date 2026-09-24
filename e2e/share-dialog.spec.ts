import { expect, test } from '@playwright/test'
import sharp from 'sharp'

const exhibitUrl = 'https://leon-made-this.work/museum/zh-CN/animals/stegosaurus/'

test('shares the selected exhibit and exports its portrait card', async ({ context, page }, testInfo) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
  })
  const response = await page.goto('./zh-CN/?animal=stegosaurus')
  expect(response?.ok()).toBe(true)

  const trigger = page.getByRole('button', { name: '分享剑龙' })
  await expect(trigger).toBeVisible()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: '分享这次发现' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.share-dialog-action')).toHaveCount(4)
  await testInfo.attach('desktop-share-dialog', { body: await page.screenshot(), contentType: 'image/png' })
  const xUrl = new URL((await dialog.getByRole('link', { name: /发到 X/ }).getAttribute('href'))!)
  const threadsUrl = new URL((await dialog.getByRole('link', { name: /发到 Threads/ }).getAttribute('href'))!)
  expect(xUrl.searchParams.get('url')).toBe(exhibitUrl)
  expect(threadsUrl.searchParams.get('url')).toBe(exhibitUrl)
  expect(xUrl.searchParams.get('text')).toContain('@leon_made_this')

  await dialog.getByRole('button', { name: /复制展项链接/ }).click()
  await expect(dialog.getByText('展项链接已复制')).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(exhibitUrl)

  const downloadPromise = page.waitForEvent('download')
  await dialog.getByRole('button', { name: /保存图片/ }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('stegosaurus-museum-card.png')
  const cardPath = testInfo.outputPath('stegosaurus-share-card.png')
  await download.saveAs(cardPath)
  const metadata = await sharp(cardPath).metadata()
  expect(metadata.width).toBe(1080)
  expect(metadata.height).toBe(1920)
  await testInfo.attach('stegosaurus-share-card', { path: cardPath, contentType: 'image/png' })

  await dialog.getByRole('button', { name: '关闭' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test('keeps mobile author links legible in English', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 700 })
  const response = await page.goto('./en/?animal=stegosaurus')
  expect(response?.ok()).toBe(true)
  await page.getByRole('button', { name: 'Share Stegosaurus' }).click()

  const dialog = page.getByRole('dialog', { name: 'Share this discovery' })
  await expect(dialog.locator('.share-dialog-author__identity strong')).toHaveText('Leon Made This')
  const profiles = dialog.getByRole('navigation', { name: 'Creator profiles' })
  await expect(profiles.getByRole('link', { name: 'X' })).toBeVisible()
  await expect(profiles.getByRole('link', { name: 'rednote' })).toBeVisible()
  await expect(profiles.getByRole('link', { name: 'Threads' })).toBeVisible()
  await expect(dialog.locator('.share-dialog-preview')).toBeHidden()
  await testInfo.attach('mobile-share-dialog', { body: await page.screenshot(), contentType: 'image/png' })
})

test('sends only the museum origin when opening the creator site', async ({ page }) => {
  const response = await page.goto('./en/')
  expect(response?.ok()).toBe(true)
  await page.getByRole('button', { name: 'About Leon Made This and this museum' }).click()
  const creatorLink = page.locator('.about-drawer .official-links__actions a[href="https://leon-made-this.work/"]')
  await expect(creatorLink).toBeVisible()
  await expect(creatorLink).toHaveAttribute('referrerpolicy', 'origin')
  await expect(creatorLink).toHaveAttribute('rel', 'noopener')
})
