import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'

const webRoot = resolve(process.cwd())
const repoRoot = resolve(webRoot, '..', '..')
const legacyOrigin = 'https://vl.badjoke-lab.com'
const primaryOrigin = 'https://www.viewloom.net'
const scannedExtensions = new Set(['.html', '.ts', '.js', '.mjs', '.json', '.xml', '.txt', '.md'])

const intentionalLegacyFiles = new Set([
  resolve(webRoot, 'vite.config.ts'),
  resolve(webRoot, 'scripts/normalize-built-head.mjs'),
  resolve(webRoot, 'scripts/verify-primary-domain-cutover.mjs'),
  resolve(webRoot, 'scripts/verify-primary-origin-source-contract.mjs'),
])

const requiredPrimaryFiles = [
  resolve(webRoot, 'docs/canonical-url-contract.md'),
  resolve(webRoot, 'functions/api/_middleware.ts'),
  resolve(webRoot, 'src/navigation/url-contract.ts'),
  resolve(repoRoot, 'scripts/collect-12a0-capacity-baseline.mjs'),
  resolve(repoRoot, 'scripts/collect-12a2-binding-size-production-evidence.mjs'),
  resolve(repoRoot, 'scripts/collect-12a2-remote-schema-production-evidence.mjs'),
  resolve(repoRoot, '.github/workflows/analytics-maintenance-audits.yml'),
  resolve(repoRoot, '.github/workflows/deploy-collector-workers.yml'),
]

const stale = []
for (const file of walk(webRoot)) {
  if (intentionalLegacyFiles.has(file)) continue
  if (readFileSync(file, 'utf8').includes(legacyOrigin)) stale.push(file)
}

for (const file of requiredPrimaryFiles) {
  assert.equal(existsSync(file), true, `${file}: required source is missing`)
  const source = readFileSync(file, 'utf8')
  assert.equal(source.includes(primaryOrigin), true, `${file}: primary origin is missing`)
  assert.equal(source.includes(legacyOrigin), false, `${file}: stale legacy origin remains`)
}

for (const file of intentionalLegacyFiles) {
  assert.equal(existsSync(file), true, `${file}: intentional compatibility source is missing`)
  const source = readFileSync(file, 'utf8')
  assert.equal(source.includes(primaryOrigin), true, `${file}: primary origin is missing`)
  assert.equal(source.includes(legacyOrigin), true, `${file}: legacy compatibility origin is missing`)
}

assert.deepEqual(stale, [], `Unexpected legacy origin references remain:\n${stale.join('\n')}`)

console.log(JSON.stringify({
  ok: true,
  primaryOrigin,
  legacyOrigin,
  intentionalLegacyFiles: [...intentionalLegacyFiles].map(relativeToRepo),
  requiredPrimaryFiles: requiredPrimaryFiles.map(relativeToRepo),
  unexpectedLegacyReferences: 0,
}, null, 2))

function walk(directory) {
  const files = []
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const target = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...walk(target))
    else if (entry.isFile() && scannedExtensions.has(extname(entry.name))) files.push(resolve(target))
  }
  return files
}

function relativeToRepo(file) {
  return file.replace(`${repoRoot}/`, '')
}
