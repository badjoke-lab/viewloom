import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const middlewarePath = 'functions/_middleware.ts'
const helperPath = 'functions/_kick-feature-coverage.ts'
const middleware = read(middlewarePath)
const helper = read(helperPath)

for (const route of [
  '/api/kick-heatmap',
  '/api/kick-day-flow',
  '/api/kick-battle-lines',
]) {
  assert(middleware.includes(`'${route}'`), `${middlewarePath}: missing ${route}`)
}

assert(!middleware.includes("'/api/kick-history'"), `${middlewarePath}: History must remain route-level to avoid double enrichment.`)
assert(middleware.includes('const response = await next()'), `${middlewarePath}: feature handler must run before enrichment.`)
assert(middleware.includes('KICK_FEATURE_ROUTES.has(pathname)'), `${middlewarePath}: Kick route isolation is missing.`)
assert(middleware.includes('enrichKickFeatureResponse(env, response)'), `${middlewarePath}: shared coverage enrichment is not applied.`)
assert(middleware.includes("pathname.replace(/\\/$/, '')"), `${middlewarePath}: trailing-slash normalization is missing.`)
assert(middleware.includes('TWITCH_FEATURE_ROUTES.has(pathname)'), `${middlewarePath}: Twitch routes must use a separate route set.`)
assert(middleware.includes('enrichTwitchFeatureResponse(env, response)'), `${middlewarePath}: Twitch routes must use a separate helper.`)

for (const fragment of [
  'async function latestKickSnapshot(env: Env)',
  "const database = (env as Partial<Env>).DB_KICK_HOT",
  'if (!database) return null',
  'return null',
  'kickCoverageFromPayload',
  'kickCoverageFromMeta',
  'coverageModel:',
  'isProviderWide: coverage.isProviderWide',
  'isBounded: coverage.isBounded',
  'topLimit: runtime.topLimit',
  'collectionCadenceSeconds: runtime.collectionCadenceSeconds',
  "headers.set('cache-control', 'no-store')",
]) assert(helper.includes(fragment), `${helperPath}: missing ${fragment}`)

assert(!helper.includes('DB_TWITCH'), `${helperPath}: Twitch storage reference is forbidden.`)
assert(!helper.includes('enrichTwitchFeatureResponse'), `${helperPath}: Twitch enrichment must remain in its own helper.`)
assert(!helper.includes('isProviderWide: true'), `${helperPath}: provider-wide coverage must never be asserted.`)
assert(!helper.includes('isBounded: false'), `${helperPath}: unbounded coverage must never be asserted.`)

if (failures.length) {
  console.error('Kick feature coverage verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Kick feature coverage middleware verification passed.')
console.log('- Heatmap, Day Flow, and Battle Lines are enriched after their existing handlers')
console.log('- History remains route-level and is not double-enriched')
console.log('- missing Kick storage falls back to response metadata')
console.log('- Twitch routes use a separate route set and helper')
