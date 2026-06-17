import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const failures = []
const read = (path) => readFileSync(join(root, path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const contractPath = 'functions/_kick-coverage.ts'
const source = read(contractPath)
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
}).outputText
const contract = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)

const official = contract.kickCoverageFromMeta({ coverageMode: 'official-livestreams', targetSource: 'official-livestreams' }, 'authenticated')
assert(official.mode === 'official-livestreams', 'Authenticated official coverage must remain official-livestreams.')
assert(official.authMode === 'authenticated', 'Official coverage must use authenticated auth mode.')
assert(official.isDirectoryCoverage === true, 'Official livestream endpoint is the only Kick directory coverage mode.')
assert(official.isProviderWide === false && official.isBounded === true, 'Official coverage must remain bounded and not provider-wide.')
assert(/bounded/i.test(official.description), 'Official description must state that coverage is bounded.')

const registry = contract.kickCoverageFromMeta({ coverageMode: 'registry', targetSource: 'registry' }, 'public-channel-fallback')
assert(registry.mode === 'registry', 'Registry coverage normalization failed.')
assert(registry.isDirectoryCoverage === false, 'Registry candidates must not be directory coverage.')
assert(/candidate/i.test(registry.description), 'Registry description must identify candidate coverage.')

const seed = contract.kickCoverageFromMeta({}, 'public-channel-fallback')
assert(seed.mode === 'seed-list', 'Unknown public fallback must normalize to seed-list.')
assert(seed.isDirectoryCoverage === false && seed.isProviderWide === false, 'Seed-list coverage must remain candidate-only.')
assert(/seed-list/i.test(seed.publicNote), 'Seed-list public note is missing.')

const fixture = contract.kickCoverageFromMeta({ coverageMode: 'registry' }, 'fixture')
assert(fixture.authMode === 'fixture', 'Fixture source mode must remain explicit.')

const payload = JSON.stringify({ collectorMeta: { coverageMode: 'official-livestreams', targetSource: 'official-livestreams' } })
assert(contract.kickCoverageFromPayload(payload, 'authenticated').mode === 'official-livestreams', 'Collector payload coverage extraction failed.')
assert(contract.kickCoverageFromPayload('{broken', 'public-channel-fallback').mode === 'seed-list', 'Broken metadata must fall back safely.')

const homePath = 'functions/_home/kick.ts'
const homeEndpointPath = 'functions/api/kick-home.ts'
const statusPath = 'functions/api/kick-status.ts'
const home = read(homePath)
const homeEndpoint = read(homeEndpointPath)
const status = read(statusPath)

for (const fragment of [
  "import { kickCoverageFromPayload } from '../_kick-coverage'",
  'coverageModel:',
  'isProviderWide: coverage.isProviderWide',
  'isBounded: coverage.isBounded',
  'note: coverage.publicNote',
]) assert(home.includes(fragment), `${homePath}: missing ${fragment}`)
assert(homeEndpoint.includes("import { buildKickHomeResponse } from '../_home/kick'"), `${homeEndpointPath}: shared Kick Home response is not used.`)

for (const fragment of [
  "type CoverageMode = 'official-livestreams' | 'registry' | 'seed-list'",
  'isTwitchParity: false',
  "isDirectoryCoverage: runtimeCoverageMode === 'official-livestreams'",
  'not a claim of complete platform coverage',
  'not provider-wide directory coverage',
  'topLimit: runtime.topLimit',
  'runCadenceSeconds: runtime.collectionCadenceSeconds',
]) assert(status.includes(fragment), `${statusPath}: missing existing Status truth fragment ${fragment}`)

for (const [path, text] of [[contractPath, source], [homePath, home], [statusPath, status]]) {
  assert(!/complete provider-wide coverage|full platform coverage|global Kick coverage/i.test(text), `${path}: contains a forbidden complete-coverage claim.`)
  assert(!/DB_TWITCH|provider\s*=\s*['"]twitch['"]/i.test(text), `${path}: contains Twitch data-path leakage.`)
}

if (failures.length) {
  console.error('Kick coverage contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Kick coverage contract verification passed.')
console.log('- official endpoint, registry, seed-list, and fixture modes remain distinct')
console.log('- every mode remains bounded and never claims provider-wide completeness')
console.log('- Kick Home and Status preserve separate Kick data paths')
