import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
const failures = []

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

const contractPath = 'functions/_state-contract.ts'
const contractSource = read(contractPath)
const transpiled = ts.transpileModule(contractSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText
const contractUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`
const contract = await import(contractUrl)

const expectedPublicStates = ['fresh', 'partial', 'stale', 'empty', 'demo', 'error']
const expectedStatusOnlyStates = ['strong_stale', 'failing', 'unconfigured', 'not_ready']

assert(JSON.stringify(contract.PUBLIC_DATA_STATES) === JSON.stringify(expectedPublicStates), 'Public data states changed without updating the state contract.')
assert(JSON.stringify(contract.STATUS_ONLY_STATES) === JSON.stringify(expectedStatusOnlyStates), 'Status-only states changed without updating the state contract.')

const cases = [
  ['fresh', 'real', 'fresh'],
  ['live', 'real', 'fresh'],
  ['ok', 'api', 'fresh'],
  ['good', 'api', 'fresh'],
  ['partial', 'real', 'partial'],
  ['poor', 'real', 'partial'],
  ['stale', 'real', 'stale'],
  ['strong_stale', 'real', 'stale'],
  ['empty', 'real', 'empty'],
  ['not_ready', 'real', 'empty'],
  ['demo', 'demo', 'demo'],
  ['fixture', 'fixture', 'demo'],
  ['fresh', 'fixture', 'demo'],
  ['error', 'api', 'error'],
  ['failing', 'api', 'error'],
  ['unconfigured', 'api', 'error'],
  ['unavailable', 'api', 'error'],
  ['unknown', 'api', 'error'],
  ['unexpected-state', 'api', 'error'],
]

for (const [state, sourceMode, expected] of cases) {
  const actual = contract.normalizeFeatureState(state, sourceMode)
  assert(actual === expected, `${state}/${sourceMode} normalized to ${actual}; expected ${expected}.`)
  assert(contract.isPublicDataState(actual), `${actual} is not a public data state.`)
}

for (const state of [...expectedPublicStates, ...expectedStatusOnlyStates]) {
  assert(contract.isStatusDataState(state), `${state} is not accepted by the Status state contract.`)
}
assert(!contract.isStatusDataState('fixture'), 'fixture must remain a source mode and normalize to demo, not a public state.')
assert(!contract.isStatusDataState('unknown'), 'unknown must not be emitted as a public state.')

const twitchStatus = read('functions/api/twitch-status.ts')
const kickStatus = read('functions/api/kick-status.ts')
for (const [path, source] of [
  ['functions/api/twitch-status.ts', twitchStatus],
  ['functions/api/kick-status.ts', kickStatus],
]) {
  assert(source.includes("import { normalizeFeatureState } from '../_state-contract'"), `${path} does not import the shared state contract.`)
  assert(source.includes('normalizeFeatureState(state, sourceMode)'), `${path} does not normalize feature states through the shared contract.`)
}
assert(!kickStatus.includes("return 'fixture'"), 'Kick Status still emits fixture as a public state instead of demo.')

if (failures.length > 0) {
  console.error('ViewLoom API state contract verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`ViewLoom API state contract verification passed for ${cases.length} normalization cases.`)
console.log(`Public states: ${expectedPublicStates.join(', ')}`)
console.log(`Status-only states: ${expectedStatusOnlyStates.join(', ')}`)
