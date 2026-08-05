import { cp, mkdir, rm, writeFile } from 'node:fs/promises'

const sourceDirectory = new URL('../dist/', import.meta.url)
const outputDirectory = new URL('../cloudflare-dist/', import.meta.url)
const museumDirectory = new URL('museum/', outputDirectory)

await rm(outputDirectory, { force: true, recursive: true })
await mkdir(museumDirectory, { recursive: true })
await cp(sourceDirectory, museumDirectory, { recursive: true })

await writeFile(
  new URL('index.html', outputDirectory),
  `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="refresh" content="0; url=/museum/" />
    <link rel="canonical" href="https://leon-made-this.work/museum/" />
    <title>正在前往史前动物博物馆</title>
  </head>
  <body>
    <p><a href="/museum/">打开史前动物博物馆</a></p>
  </body>
</html>
`,
)

await writeFile(
  new URL('_redirects', outputDirectory),
  `/museum /museum/ 301
/ /museum/ 302
`,
)

await writeFile(
  new URL('_headers', outputDirectory),
  `/museum/assets/*
  Cache-Control: public, max-age=31536000, immutable

/museum/*
  Cache-Control: public, max-age=0, must-revalidate

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
`,
)

console.log('Prepared Cloudflare Pages bundle in cloudflare-dist/.')
