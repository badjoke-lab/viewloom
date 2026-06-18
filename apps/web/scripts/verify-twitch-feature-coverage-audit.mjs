import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const failures = []
const read = (path) => readFileSync(join(process.cwd(), path), 'utf8')
const assert = (condition, message) => { if (!condition) failures.push(message) }

const paths = {
  heatmap: 'functions/api/twitch-heatmap.ts',
  dayFlow: 'functions/api/day-flow.ts',
  battleRoute: 'functions/api/battle-lines.ts',
  battleCore: 'functions/_lib/battle-lines-core.ts',
  historyRoute: 'functions/api/history.ts',
  historyModel: 'functions/_history/model.ts',
  audit: 'docs/twitch-feature-coverage-audit.md',
}

const source = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, read(path)]))

for (const key of ['heatmap', 'dayFlow', 'battleRoute', 'historyRoute']) {
  assert(source[key].includes('DB_TWITCH_HOT'), `${paths[key]} must read Twitch storage.`)
  assert(!source[key].includes('DB_KICK_HOT'), `${paths[key]} must not read Kick storage.`)
}

assert(source.heatmap.includes("targetSource: 'twitch-helix-streams'"), 'Heatmap target source baseline changed.')
assert(source.heatmap.includes('coverageMode:'), 'Heatmap coverageMode baseline changed.')
assert(!source.heatmap.includes('coverageModel:'), 'Heatmap now has coverageModel; update the audit and move to C5 verification.')

assert(source.dayFlow.includes('coverageNote:'), 'Day Flow coverage note baseline changed.')
assert(!source.dayFlow.includes('targetSource:'), 'Day Flow now has targetSource; update the audit and move to C5 verification.')
assert(!source.dayFlow.includes('coverageModel:'), 'Day Flow now has coverageModel; update the audit and move to C5 verification.')

assert(source.battleCore.includes('coverage,'), 'Battle Lines timeline coverage baseline changed.')
assert(!source.battleCore.includes('coverageModel:'), 'Battle Lines now has coverageModel; update the audit and move to C5 verification.')

assert(source.historyModel.includes('coverage,'), 'History day-completeness coverage baseline changed.')
assert(!source.historyModel.includes('coverageModel:'), 'History now has coverageModel; update the audit and move to C5 verification.')

for (const key of ['heatmap', 'dayFlow', 'battleCore', 'historyModel']) {
  assert(!source[key].includes('isProviderWide:'), `${paths[key]} now states provider-wide truth; update the audit and C5 checks.`)
}

for (const fragment of [
  'Twitch feature coverage audit',
  '/api/twitch-heatmap',
  '/api/day-flow',
  '/api/battle-lines',
  '/api/history',
  'coverageModel.isProviderWide = false',
  'coverageModel.isBounded = true',
  'coverageModel.topLimit = 300',
  'coverageModel.collectionCadenceSeconds = 300',
  'Do not replace Battle Lines timeline `coverage`',
  'Do not replace History day-completeness `coverage`',
]) assert(source.audit.includes(fragment), `${paths.audit}: missing ${fragment}`)

if (failures.length) {
  console.error('Twitch feature coverage audit verification failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Twitch feature coverage audit verification passed.')
console.log('- Twitch storage remains isolated from Kick storage')
console.log('- all four feature APIs still lack the complete coverageModel contract')
console.log('- Battle Lines and History coverage semantics are reserved for existing completeness data')
