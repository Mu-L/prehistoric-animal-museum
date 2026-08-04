import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.glb', 'model/gltf-binary'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.mp3', 'audio/mpeg'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
])

const args = process.argv.slice(2)
const rootArgument = args[0]?.startsWith('--') ? 'dist' : (args[0] ?? 'dist')

function option(name, fallback) {
  const index = args.indexOf(name)
  return index === -1 ? fallback : (args[index + 1] ?? fallback)
}

const root = resolve(process.cwd(), rootArgument)
const port = Number(option('--port', process.env.PORT ?? '4173'))
const host = option('--host', process.env.HOST ?? '127.0.0.1')
const rawBase = option('--base', '/')
const base = `/${rawBase.split('/').filter(Boolean).join('/')}${rawBase === '/' ? '' : '/'}`

if (!existsSync(root) || !statSync(root).isDirectory()) {
  console.error(`Static root does not exist: ${root}`)
  process.exit(1)
}

function sendFile(filePath, response) {
  response.writeHead(200, {
    'Content-Type': mimeTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
    'Cache-Control': filePath.endsWith('.html') ? 'no-cache' : 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
  })
  createReadStream(filePath).pipe(response)
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)

  if (!requestUrl.pathname.startsWith(base)) {
    response.writeHead(302, { Location: base })
    response.end()
    return
  }

  const relativePath = decodeURIComponent(requestUrl.pathname.slice(base.length))
  const requestedPath = resolve(root, relativePath || 'index.html')
  const isInsideRoot = requestedPath === root || requestedPath.startsWith(`${root}${sep}`)

  if (!isInsideRoot) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  if (existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    sendFile(requestedPath, response)
    return
  }

  if (!extname(relativePath)) {
    sendFile(resolve(root, 'index.html'), response)
    return
  }

  response.writeHead(404)
  response.end('Not found')
})

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}${base}`)
})
