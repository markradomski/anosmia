#!/usr/bin/env node
// Tiny static file server for tests (serves references/ so the original export can be compared).
// Usage: node scripts/serve-static.mjs <dir> <port>
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const [dir = '.', port = '5234'] = process.argv.slice(2)
const root = resolve(dir)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }

createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
  if (!path.startsWith(root)) return res.writeHead(403).end()
  try {
    if (!statSync(path).isFile()) throw new Error('not a file')
  } catch {
    return res.writeHead(404).end()
  }
  res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
  createReadStream(path).pipe(res)
}).listen(Number(port), '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`))
