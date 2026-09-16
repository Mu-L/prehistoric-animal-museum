import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Plugin } from 'vite'

/** Local review evidence only. Never installed in a build or exposed to remote clients. */
export function flightReviewTracePlugin(): Plugin {
  return {
    name: 'flight-local-trace',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__flight-review/trace', (request, response) => {
        const address = request.socket.remoteAddress
        if (request.method !== 'POST' || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address ?? '') || request.headers.origin !== `http://${request.headers.host}`) {
          response.writeHead(403).end(); return
        }
        const chunks: Buffer[] = []; let bytes = 0
        request.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > 64 * 1024 * 1024) { response.writeHead(413).end(); request.destroy(); return }
          chunks.push(chunk)
        })
        request.on('end', () => {
          void (async () => {
            const text = Buffer.concat(chunks).toString('utf8')
            const data = JSON.parse(text) as { schema?: unknown; route?: unknown; frames?: unknown }
            if (data.schema !== 'flight-frame-trace-v1' || typeof data.route !== 'string' || !/^(manual|[A-D]-[a-z-]+)$/.test(data.route) || !Array.isArray(data.frames) || data.frames.length > 14400) {
              response.writeHead(400).end(); return
            }
            const directory = path.join(server.config.root, '.flight-evidence/r4/traces')
            await mkdir(directory, { recursive: true })
            const filename = `${data.route}-${Date.now()}.json`
            await writeFile(path.join(directory, filename), text, { flag: 'wx' })
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ saved: filename, frames: data.frames.length }))
          })().catch(() => { if (!response.headersSent) response.writeHead(500); response.end() })
        })
      })
    },
  }
}
