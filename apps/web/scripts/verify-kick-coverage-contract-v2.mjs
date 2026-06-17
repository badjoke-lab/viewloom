import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const check = (condition, message) => { if (!condition) failures.push(message) }

const contractSource = read('functions/_kick-coverage.ts')
const compiled = ts.transpileModule(contractSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const coverage = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

const official = coverage.kickCoverageFromMeta({ coverageMode: 'official-livestreams', targetSource: 'official-livestreams' }, 'authenticated')
check(official.mode === 'official-livestreams', 'Official mode normalization failed.')
check(official.authMode === 'authenticated', 'Official auth mode normalization failed.')
check(official.isDirectoryCoverage === true, 'Official endpoint directory flag failed.')
check(official.isProviderWide === false && official.isBounded === true, 'Official endpoint boundary flags failed.')

const registry = coverage.kickCoverageFromMeta({ coverageMode: 'registry', targetSource: 'registry' }, 'public-channel-fallback')
check(registry.mode === 'registry', 'Registry mode normalization failed.')
check(registry.isDirectoryCoverage === false && registry.isProviderWide === false, 'Registry boundary flags failed.')

const seed = coverage.kickCoverageFromMeta({}, 'public-channel-fallback')
check(seed.mode === 'seed-list', 'Seed-list fallback normalization failed.')
check(seed.isDirectoryCoverage === false && seed.isProviderWide === false, 'Seed-list boundary flags failed.')

const fixture = coverage.kickCoverageFromMeta({ coverageMode: 'registry' }, 'fixture')
check(fixture.authMode === 'fixture', 'Fixture source mode normalization failed.')

const payload = JSON.stringify({ collectorMeta: { coverageMode: 'official-livestreams', targetSource: 'official-livestreams' } })
check(coverage.kickCoverageFromPayload(payload, 'authenticated').mode === 'official-livestreams', 'Payload metadata extraction failed.')
check(coverage.kickCoverageFromPayload('', 'public-channel-fallback').mode === 'seed-list', 'Empty metadata fallback failed.')

const home = read('functions/_home/kick.ts')
const endpoint = read('functions/api/kick-home.ts')
const status = read('functions/api/kick-status.ts')

for (const fragment of [
  "kickCoverageFromPayload",
  'coverageModel:',
  'isProviderWide: coverage.isProviderWide',
  'isBounded: coverage.isBounded',
  'note: coverage.publicNote',
]) check(home.includes(fragment), `Kick Home is missing ${fragment}`)

check(endpoint.includes("buildKickHomeResponse"), 'Kick Home endpoint does not use the shared wrapper.')

for (const fragment of [
  "official-livestreams' | 'registry' | 'seed-list",
  'isTwitchParity: false',
  "isDirectoryCoverage: runtimeCoverageMode === 'official-livestreams'",
  'topLimit: runtime.topLimit',
  'runCadenceSeconds: runtime.collectionCadenceSeconds',
]) check(status.includes(fragment), `Kick Status is missing ${fragment}`)

for (const [name, source] of [['contract', contractSource], ['home', home], ['status', status]]) {
  check(!source.includes('isProviderWide: true'), `${name} enables a provider-wide flag.`)
  check(!source.includes('isTwitchParity: true'), `${name} enables a parity flag.`)
  check(!source.includes('DB_TWITCH'), `${name} contains a Twitch database reference.`)
}

if (failures.length) {
  console.error('Kick coverage verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Kick coverage verification passed.')
