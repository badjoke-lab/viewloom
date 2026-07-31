import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const primaryOrigin = 'https://viewloom.net'
const legacyOrigins = ['https://vl.badjoke-lab.com', 'https://www.viewloom.net']

const packageJson = JSON.parse(read('package.json'))
const vite = read('vite.config.ts')
const normalizer = read('scripts/normalize-built-head.mjs')
const middleware = read('functions/_middleware.ts')
const robots = read('public/robots.txt')
const sitemap = read('public/sitemap.xml')

assert.equal(packageJson.scripts.build, 'vite build && node scripts/normalize-built-head.mjs')
assert.ok(packageJson.scripts['verify:source'].includes('verify-primary-domain-cutover.mjs'))

assert.ok(vite.includes(`const PRIMARY_ORIGIN = '${primaryOrigin}'`))
for (const origin of legacyOrigins) assert.ok(vite.includes(origin))
assert.ok(vite.includes('viewloom-primary-domain'))
assert.ok(vite.includes('normalized.replaceAll(legacyOrigin, PRIMARY_ORIGIN)'))

assert.ok(normalizer.includes(`const primaryOrigin = '${primaryOrigin}'`))
for (const origin of legacyOrigins) assert.ok(normalizer.includes(origin))
assert.ok(normalizer.includes('normalizePrimaryOrigin(html)'))
assert.ok(normalizer.includes('legacy public origin remained after normalization'))
assert.ok(normalizer.includes("canonical_host: 'viewloom.net'"))

assert.ok(middleware.includes("const PRIMARY_HOST = 'viewloom.net'"))
assert.ok(middleware.includes("new Set(['www.viewloom.net', 'vl.badjoke-lab.com'])"))
assert.ok(middleware.includes('Response.redirect(url.toString(), 301)'))
assert.ok(middleware.indexOf('REDIRECT_HOSTS.has(url.hostname)') < middleware.indexOf('const response = await next()'))

assert.equal(robots.includes(`Sitemap: ${primaryOrigin}/sitemap.xml`), true)
assert.equal(sitemap.includes(`<loc>${primaryOrigin}/</loc>`), true)
for (const origin of legacyOrigins) {
  assert.equal(robots.includes(origin), false)
  assert.equal(sitemap.includes(origin), false)
}

console.log(JSON.stringify({
  ok: true,
  primaryOrigin,
  redirectHosts: legacyOrigins.map((origin) => new URL(origin).hostname),
  redirectStatus: 301,
  buildNormalization: true,
  sitemapAndRobotsUpdated: true,
}, null, 2))
