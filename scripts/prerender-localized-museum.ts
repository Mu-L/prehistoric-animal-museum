import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  appBootstrapElementId,
  type InitialAppState,
} from '../src/app-bootstrap'

export const museumRootStartMarker = '<!--museum-root-start-->'
export const museumRootEndMarker = '<!--museum-root-end-->'

function serialiseBootstrap(state: InitialAppState): string {
  return JSON.stringify(state)
    .replaceAll('&', '\\u0026')
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

function rebaseApplicationAssets(
  markup: string,
  assetBase: './assets/' | '../assets/',
): string {
  return markup.replace(
    /\b(src|srcSet|href|poster)=(["'])\/assets\//gi,
    `$1=$2${assetBase}`,
  )
}

export function renderPrerenderedMuseumDocument(
  source: string,
  state: InitialAppState,
  applicationMarkup: string,
): string {
  const documentSource = source.replace(
    /<style\b[^>]*id=["']seo-static-shell-style["'][^>]*>[\s\S]*?<\/style>\s*/i,
    '',
  )
  const start = documentSource.indexOf(museumRootStartMarker)
  const end = documentSource.indexOf(museumRootEndMarker)
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Localized museum document is missing root markers.')
  }
  if (!documentSource.includes('</head>')) {
    throw new Error('Localized museum document is missing </head>.')
  }

  const withMarkup = `${documentSource.slice(0, start + museumRootStartMarker.length)}${rebaseApplicationAssets(
    applicationMarkup,
    state.rootFallback ? './assets/' : '../assets/',
  )}${documentSource.slice(end)}`
  const bootstrap = `<script id="${appBootstrapElementId}" type="application/json">${serialiseBootstrap(state)}</script>`
  return withMarkup.replace('</head>', `    ${bootstrap}\n  </head>`)
}

export async function writeLocalizedMuseumPrerenders(
  outputDirectory: string,
  render: (state: InitialAppState) => string | Promise<string>,
): Promise<void> {
  const prerenders = [
    { documentPath: 'index.html', locale: 'zh-CN', rootFallback: true },
    {
      documentPath: 'zh-CN/index.html',
      locale: 'zh-CN',
      rootFallback: false,
    },
    { documentPath: 'en/index.html', locale: 'en', rootFallback: false },
  ] as const

  for (const {
    documentPath: relativePath,
    locale,
    rootFallback,
  } of prerenders) {
    const documentPath = resolve(outputDirectory, relativePath)
    const source = await readFile(documentPath, 'utf8')
    const state: InitialAppState = {
      animalId: 'stegosaurus',
      locale,
      preference: locale,
      ...(rootFallback ? { rootFallback: true } : {}),
    }
    const applicationMarkup = await render(state)
    await writeFile(
      documentPath,
      renderPrerenderedMuseumDocument(source, state, applicationMarkup),
      'utf8',
    )
  }
}
