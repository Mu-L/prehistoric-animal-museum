import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  renderPrerenderedMuseumDocument,
  writeLocalizedMuseumPrerenders,
} from '../scripts/prerender-localized-museum'
import { renderMuseumApp } from '../src/entry-server'

describe('localized museum prerender document', () => {
  it('replaces the temporary shell with real application markup and bootstrap state', () => {
    const source = `<!doctype html>
      <html lang="en">
        <head><title>Museum</title><style id="seo-static-shell-style">.seo-static-shell { display: block; }</style></head>
        <body>
          <div id="root"><!--museum-root-start--><main class="seo-static-shell">Temporary</main><!--museum-root-end--></div>
          <script type="module" src="../assets/app.js"></script>
        </body>
      </html>`

    const result = renderPrerenderedMuseumDocument(
      source,
      {
        animalId: 'stegosaurus',
        locale: 'en',
        preference: 'en',
      },
      '<main id="museum-experience" data-locale="en"><img src="/assets/stegosaurus.webp" alt="" />Stegosaurus</main>',
    )

    const document = new DOMParser().parseFromString(result, 'text/html')
    expect(document.querySelector('.seo-static-shell')).toBeNull()
    expect(document.querySelector('#seo-static-shell-style')).toBeNull()
    expect(document.querySelector('#museum-experience')?.textContent).toBe(
      'Stegosaurus',
    )
    expect(
      document.querySelector('#museum-bootstrap')?.textContent,
    ).toBe(
      '{"animalId":"stegosaurus","locale":"en","preference":"en"}',
    )
    expect(
      document.querySelector('script[type="module"]')?.getAttribute('src'),
    ).toBe('../assets/app.js')
    expect(
      document.querySelector('#museum-experience img')?.getAttribute('src'),
    ).toBe('../assets/stegosaurus.webp')
  })

  it('keeps fallback application assets relative to the museum entry', () => {
    const source = `<!doctype html><html lang="zh-CN"><head></head><body><div id="root"><!--museum-root-start-->Temporary<!--museum-root-end--></div><script type="module" src="./assets/app.js"></script></body></html>`
    const result = renderPrerenderedMuseumDocument(
      source,
      {
        animalId: 'stegosaurus',
        locale: 'zh-CN',
        preference: 'zh-CN',
        rootFallback: true,
      },
      '<main id="museum-experience"><img src="/assets/stegosaurus.webp" alt="" /></main>',
    )
    const document = new DOMParser().parseFromString(result, 'text/html')

    expect(
      document.querySelector('script[type="module"]')?.getAttribute('src'),
    ).toBe('./assets/app.js')
    expect(
      document.querySelector('#museum-experience img')?.getAttribute('src'),
    ).toBe('./assets/stegosaurus.webp')
  })

  it('writes real server-rendered first frames to the fallback and localized build documents', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'museum-prerender-'))
    const template = `<!doctype html><html lang="en"><head></head><body><div id="root"><!--museum-root-start--><main class="seo-static-shell">Temporary</main><!--museum-root-end--></div></body></html>`
    try {
      await mkdir(join(outputDirectory, 'en'), { recursive: true })
      await mkdir(join(outputDirectory, 'zh-CN'), { recursive: true })
      await writeFile(join(outputDirectory, 'index.html'), template)
      await writeFile(join(outputDirectory, 'en/index.html'), template)
      await writeFile(join(outputDirectory, 'zh-CN/index.html'), template)

      await writeLocalizedMuseumPrerenders(
        outputDirectory,
        renderMuseumApp,
      )

      const english = await readFile(
        join(outputDirectory, 'en/index.html'),
        'utf8',
      )
      const chinese = await readFile(
        join(outputDirectory, 'zh-CN/index.html'),
        'utf8',
      )
      const fallback = await readFile(
        join(outputDirectory, 'index.html'),
        'utf8',
      )
      expect(english).toContain('data-locale="en"')
      expect(english).toContain('Stegosaurus')
      expect(chinese).toContain('data-locale="zh-CN"')
      expect(chinese).toContain('剑龙')
      expect(fallback).toContain('id="museum-experience"')
      expect(fallback).toContain('data-locale="zh-CN"')
      expect(fallback).toContain('剑龙')
      expect(fallback).not.toContain('seo-static-shell')
      expect(fallback).toContain(
        'href="./zh-CN/animals/mosasaurus/"',
      )
    } finally {
      await rm(outputDirectory, { recursive: true })
    }
  })
})
