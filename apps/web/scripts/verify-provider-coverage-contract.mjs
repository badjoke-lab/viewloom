import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

async function importTs(path) {
  const compiled = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
}

const twitchContract = await importTs('functions/_twitch-coverage.ts')
const kickContract = await importTs('functions/_kick-coverage.ts')
const runtimeModule = await importTs('functions/_provider-runtime.ts')

const commonFields = [
  'mode',
  'targetSource',
  'sourceMode',
  'authMode',
  'label',
  'isDirectoryCoverage',
  'isProviderWide',
  'isBounded',
  'description',
  'limitation',
  'sourceLimitation',
]

const contracts = [
  ['Twitch Helix', twitchContract.twitchCoverageFromMeta({ sourceMode: 'real' })],
  ['Twitch fixture', twitchContract.twitchCoverageFromMeta({}, 'demo')],
  ['Twitch unknown', twitchContract.twitchCoverageFromMeta({}, 'unknown')],
  ['Kick official', kickContract.kickCoverageFromMeta({ coverageMode: 'official-livestreams' }, 'authenticated')],
  ['Kick registry', kickContract.kickCoverageFromMeta({ coverageMode: 'registry' }, 'public-channel-fallback')],
  ['Kick seed list', kickContract.kickCoverageFromMeta({ coverageMode: 'seed-list' }, 'public-channel-fallback')],
]

for (const [label, contract] of contracts) {
  for (const field of commonFields) {
    assert(Object.hasOwn(contract, field), `${label}: missing ${field}`)
  }
  assert(contract.isProviderWide === false, `${label}: provider-wide coverage must be false.`)
  assert(contract.isBounded === true, `${label}: bounded coverage must be true.`)
  assert(typeof contract.description === 'string' && contract.description.length > 0, `${label}: description is empty.`)
  assert(typeof contract.limitation === 'string' && contract.limitation.length > 0, `${label}: limitation is empty.`)
}

assert(twitchContract.normalizeTwitchCoverageMode('real') === 'helix', 'Twitch real mode must normalize to helix.')
assert(twitchContract.normalizeTwitchCoverageMode('demo') === 'fixture', 'Twitch demo mode must normalize to fixture.')
assert(twitchContract.normalizeTwitchCoverageMode('missing') === 'unknown', 'Twitch unknown mode must stay unknown.')
assert(kickContract.normalizeKickCoverageMode('official-livestreams') === 'official-livestreams', 'Kick official mode failed.')
assert(kickContract.normalizeKickCoverageMode('registry') === 'registry', 'Kick registry mode failed.')
assert(kickContract.normalizeKickCoverageMode('missing') === 'seed-list', 'Kick fallback mode must be seed-list.')

const runtime = runtimeModule.PROVIDER_RUNTIME
assert(runtime.twitch.topLimit === 300, 'Twitch top limit must be 300.')
assert(runtime.kick.topLimit === 100, 'Kick top limit must be 100.')
assert(runtime.twitch.collectionCadenceSeconds === 300, 'Twitch cadence must be 300 seconds.')
assert(runtime.kick.collectionCadenceSeconds === 300, 'Kick cadence must be 300 seconds.')
assert(runtime.twitch.topLimit + runtime.kick.topLimit === 400, 'Provider limits changed unexpectedly; do not expose this sum publicly.')

const middleware = read('functions/_middleware.ts')
const twitchHelper = read('functions/_twitch-feature-coverage.ts')
const kickHelper = read('functions/_kick-feature-coverage.ts')

for (const route of ['/api/twitch-heatmap', '/api/day-flow', '/api/battle-lines', '/api/history']) {
  assert(middleware.includes(`'${route}'`), `Twitch middleware route missing: ${route}`)
}
for (const route of ['/api/kick-heatmap', '/api/kick-day-flow', '/api/kick-battle-lines']) {
  assert(middleware.includes(`'${route}'`), `Kick middleware route missing: ${route}`)
}
assert(!middleware.includes("'/api/kick-history'"), 'Kick History must remain route-level.')
assert(middleware.includes('KICK_FEATURE_ROUTES.has(pathname)'), 'Kick route set is not isolated.')
assert(middleware.includes('TWITCH_FEATURE_ROUTES.has(pathname)'), 'Twitch route set is not isolated.')
assert(middleware.includes('enrichKickFeatureResponse(env, response)'), 'Kick helper is not connected.')
assert(middleware.includes('enrichTwitchFeatureResponse(env, response)'), 'Twitch helper is not connected.')

for (const [label, helper, ownDb, forbiddenDb] of [
  ['Twitch', twitchHelper, 'DB_TWITCH_HOT', 'DB_KICK_HOT'],
  ['Kick', kickHelper, 'DB_KICK_HOT', 'DB_TWITCH_HOT'],
]) {
  assert(helper.includes(ownDb), `${label} helper must read ${ownDb}.`)
  assert(!helper.includes(forbiddenDb), `${label} helper must not read ${forbiddenDb}.`)
  for (const fragment of [
    'coverageModel:',
    'isProviderWide: coverage.isProviderWide',
    'isBounded: coverage.isBounded',
    'topLimit: runtime.topLimit',
    'collectionCadenceSeconds: runtime.collectionCadenceSeconds',
  ]) assert(helper.includes(fragment), `${label} helper missing ${fragment}`)
  assert(!helper.includes('isProviderWide: true'), `${label} helper must never claim provider-wide coverage.`)
  assert(!helper.includes('isBounded: false'), `${label} helper must never claim unbounded coverage.`)
}

assert(!twitchHelper.includes('coverage: {'), 'Twitch enrichment must preserve feature-specific coverage objects.')
assert(!middleware.toLowerCase().includes('combined'), 'Middleware must not introduce combined provider coverage.')

const doc = read('docs/provider-observation-coverage-contract.md')
for (const fragment of [
  'isProviderWide = false',
  'isBounded = true',
  'Twitch topLimit = 300',
  'Kick topLimit = 100',
  'They must not be added together',
  'Twitch helper -> DB_TWITCH_HOT only',
  'Kick helper   -> DB_KICK_HOT only',
  'Battle Lines `coverage` describes timeline bucket completeness',
  'History `coverage` describes requested-day completeness',
]) assert(doc.includes(fragment), `Provider coverage documentation missing: ${fragment}`)

if (failures.length) {
  console.error('Provider coverage contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Provider coverage contract verification passed.')
console.log('- Twitch and Kick share bounded, non-provider-wide coverage invariants')
console.log('- provider-specific modes, limits, routes, helpers, and storage remain separated')
console.log('- feature-specific Battle Lines and History coverage semantics remain preserved')
