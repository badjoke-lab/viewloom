import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const paths = {
  contract: 'functions/_twitch-coverage.ts',
  helper: 'functions/_twitch-feature-coverage.ts',
  middleware: 'functions/_middleware.ts',
  heatmap: 'functions/api/twitch-heatmap.ts',
  dayFlow: 'functions/api/day-flow.ts',
  battleRoute: 'functions/api/battle-lines.ts',
  battleCore: 'functions/_lib/battle-lines-core.ts',
  historyRoute: 'functions/api/history.ts',
  historyModel: 'functions/_history/model.ts',
  audit: 'docs/twitch-feature-coverage-audit.md',
}

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]))

const compiled = ts.transpileModule(source.contract, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const contract = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

for (const value of ['real', 'api', 'authenticated', 'helix', 'twitch-helix-streams', 'observed-top-pages', 'partial-top-pages']) {
  assert(contract.normalizeTwitchCoverageMode(value) === 'helix', `${value} must normalize to helix.`)
}
for (const value of ['demo', 'fixture']) {
  assert(contract.normalizeTwitchCoverageMode(value) === 'fixture', `${value} must normalize to fixture.`)
}
assert(contract.normalizeTwitchCoverageMode('missing') === 'unknown', 'Unknown modes must remain unknown.')

const helix = contract.twitchCoverageFromMeta({ sourceMode: 'real' })
assert(helix.mode === 'helix', 'Collector sourceMode must be used when the function argument is omitted.')
assert(helix.sourceMode === 'real', 'Raw Twitch sourceMode must remain visible.')
assert(helix.isDirectoryCoverage === true, 'Helix must be identified as directory coverage.')
assert(helix.isProviderWide === false, 'Twitch coverage must not claim provider-wide completeness.')
assert(helix.isBounded === true, 'Twitch coverage must remain bounded.')
const fixture = contract.twitchCoverageFromMeta({}, 'demo')
assert(fixture.mode === 'fixture' && fixture.isDirectoryCoverage === false, 'Fixture coverage contract failed.')

for (const key of ['heatmap', 'dayFlow', 'battleRoute', 'historyRoute']) {
  assert(source[key].includes('DB_TWITCH_HOT'), `${paths[key]} must read Twitch storage.`)
  assert(!source[key].includes('DB_KICK_HOT'), `${paths[key]} must not read Kick storage.`)
}

for (const route of ['/api/twitch-heatmap', '/api/day-flow', '/api/battle-lines', '/api/history']) {
  assert(source.middleware.includes(`'${route}'`), `${paths.middleware}: missing ${route}`)
}
for (const route of ['/api/kick-heatmap', '/api/kick-day-flow', '/api/kick-battle-lines']) {
  assert(source.middleware.includes(`'${route}'`), `${paths.middleware}: lost ${route}`)
}
assert(!source.middleware.includes("'/api/kick-history'"), 'Kick History must remain route-level and avoid double enrichment.')
assert(source.middleware.includes('enrichTwitchFeatureResponse(env, response)'), 'Twitch middleware enrichment is not connected.')
assert(source.middleware.includes('enrichKickFeatureResponse(env, response)'), 'Kick middleware enrichment was removed.')

for (const fragment of [
  'response.clone().json<JsonRecord>()',
  '(env as Partial<Env>).DB_TWITCH_HOT',
  "bind('twitch')",
  'resolveSourceMode(payload, latest?.source_mode)',
  "provider: text(payload.provider) || 'twitch'",
  "platform: text(payload.platform) || 'twitch'",
  'coverageMode:',
  'targetSource:',
  'sourceMode: coverage.sourceMode',
  'coverageModel:',
  'isProviderWide: coverage.isProviderWide',
  'isBounded: coverage.isBounded',
  'topLimit: runtime.topLimit',
  'collectionCadenceSeconds: runtime.collectionCadenceSeconds',
  "headers.set('cache-control', 'no-store')",
]) assert(source.helper.includes(fragment), `${paths.helper}: missing ${fragment}`)
assert(!source.helper.includes('DB_KICK_HOT'), `${paths.helper}: Kick storage reference is forbidden.`)
assert(!source.helper.includes('coverage: {'), `${paths.helper}: existing feature coverage objects must not be replaced.`)

assert(source.battleCore.includes('coverage,'), 'Battle Lines timeline coverage baseline changed.')
assert(source.historyModel.includes('coverage,'), 'History day-completeness coverage baseline changed.')

for (const fragment of [
  'C5 result',
  'coverageModel.mode = helix | fixture | unknown',
  'coverageModel.isProviderWide = false',
  'coverageModel.isBounded = true',
  'coverageModel.topLimit = 300',
  'coverageModel.collectionCadenceSeconds = 300',
  'Battle Lines timeline `coverage` is preserved unchanged',
  'History day-completeness `coverage` is preserved unchanged',
]) assert(source.audit.includes(fragment), `${paths.audit}: missing ${fragment}`)

if (failures.length) {
  console.error('Twitch feature coverage verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Twitch feature coverage verification passed.')
console.log('- four Twitch feature routes receive one bounded Top 300 contract')
console.log('- existing Battle Lines and History coverage semantics remain reserved')
console.log('- Twitch and Kick storage and enrichment paths remain separated')
