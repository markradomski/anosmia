#!/usr/bin/env node
// Scans files git would commit for credential-shaped content (tokens, JWTs, session caches).
// Filenames alone don't catch dumps (one arrived as "wine-preferences.json"), so this checks contents.
// Usage: node scripts/check-secrets.mjs   (exit 1 when anything matches)
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'

const PATTERNS = [
  ['JSON web token', /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/],
  ['token field', /"[A-Za-z_]*(?:token|Token|TOKEN)"\s*:\s*"[^"]{16,}"/],
  ['password field', /"(?:password|passwd|secret)"\s*:\s*"[^"]+"/i],
  ['bearer header', /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{16,}/i],
  ['GraphQL client cache', /"ROOT_QUERY"\s*:/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
]

const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n').filter(Boolean)
let found = 0
for (const file of files) {
  let text
  try {
    if (statSync(file).size > 20_000_000) continue
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  for (const [name, re] of PATTERNS) {
    if (re.test(text)) {
      console.error(`${file}: looks like it contains a ${name}`)
      found++
    }
  }
}
if (found) {
  console.error(`\n${found} possible secret(s). Remove them, or move local captures into private/.`)
  process.exit(1)
}
console.log(`No credential-shaped content in ${files.length} files.`)
