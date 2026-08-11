import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const coreSource = await readFile(new URL('../functions/_lib/battle-lines-core.ts', import.meta.url), 'utf8')
const coreCompiled = ts.transpileModule(coreSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const coreUrl = `data:text/javascript;base64,${Buffer.from(coreCompiled).toString('base64')}`
const core = await import(coreUrl)

let categorySource = await readFile(new URL('../functions/_lib/battle-lines-category.ts', import.meta.url), 'utf8')
categorySource = categorySource.replace("from './battle-lines-core'", `from '${coreUrl}'`)
const categoryCompiled = ts.transpileModule(categorySource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText
const categoryUrl = `data:text/javascript;base64,${Buffer.from(categoryCompiled).toString('base64')}`
const category = await import(categoryUrl)

const period = {
  mode: 'date',
  selectedDate: '2026-08-10',
  from: '2026-08-10T00:00:00.000Z',
  to: '2026-08-10T00:30:00.000Z',
  isLive: false,
}
const dictionaryRows = [
  { category_id: 'catA', category_name: 'Category A', contract_version: 'category-source-v1' },
  { category_id: 'catB', category_name: 'Category B', contract_version: 'category-source-v1' },
]
const rows = [
  rawRow('00:00', [['alpha', 'Alpha', 100], ['beta', 'Beta', 90], ['gamma', 'Gamma', 500]], [0, 0, 1]),
  rawRow('00:05', [['alpha', 'Alpha', 110], ['beta', 'Beta', 95], ['gamma', 'Gamma', 500]], [1, 0, 1]),
  rawRow('00:10', [['alpha', 'Alpha', 120], ['beta', 'Beta', 100], ['gamma', 'Gamma', 500]], [null, 0, 1]),
  rawRow('00:15', [['alpha', 'Alpha', 130], ['beta', 'Beta', 110], ['gamma', 'Gamma', 500]], [0, 0, 1]),
  rawRow('00:20', [['alpha', 'Alpha', 140], ['beta', 'Beta', 120], ['gamma', 'Gamma', 500]], [0, 1, 1]),
  rawRow('00:25', [['alpha', 'Alpha', 150], ['beta', 'Beta', 130], ['gamma', 'Gamma', 500]], [0, 0, 1]),
]

const projection = category.projectKickBattleLinesCategory({
  rows,
  dictionaryRows,
  selectedCategory: 'catA',
  requestedBucket: '5m',
  period,
  sampleIntervalMinutes: 5,
})
assert.equal(projection.state, 'selected')
assert.equal(projection.coverageState, 'partial')
assert.deepEqual(projection.coverageCounts, { observed: 5, partial: 1, unavailable: 0 })
assert.equal(projection.candidateCount, 2)
assert.ok(projection.availableCategories.some((item) => item.id === 'catA'))
assert.ok(projection.availableCategories.some((item) => item.id === 'catB'))
assert.equal(projection.rows.some((row) => row.items.some((item) => item.id === 'gamma')), false, 'large out-of-category Gamma leaked into category candidate rows')

const viewers = core.buildBattleLinesPayload(projection.rows, {
  platform: 'kick',
  top: 5,
  requestedBucket: '5m',
  metric: 'viewers',
  period,
  now: new Date('2026-08-11T00:00:00.000Z'),
  sampleIntervalMinutes: 5,
  categoryScoped: true,
})
const indexed = core.buildBattleLinesPayload(projection.rows, {
  platform: 'kick',
  top: 5,
  requestedBucket: '5m',
  metric: 'indexed',
  period,
  now: new Date('2026-08-11T00:00:00.000Z'),
  sampleIntervalMinutes: 5,
  categoryScoped: true,
})

assert.deepEqual(viewers.lines.map((line) => line.id).sort(), ['alpha', 'beta'])
assert.equal(viewers.lines.some((line) => line.id === 'gamma'), false)
const alpha = viewers.lines.find((line) => line.id === 'alpha')
const beta = viewers.lines.find((line) => line.id === 'beta')
assert.ok(alpha && beta)
assert.deepEqual(alpha.points.map((point) => point.state), ['observed', 'outside_category', 'category_unavailable', 'observed', 'observed', 'observed'])
assert.deepEqual(beta.points.map((point) => point.state), ['observed', 'observed', 'observed', 'observed', 'outside_category', 'observed'])
assert.deepEqual(alpha.points.map((point) => point.viewers), [100, null, null, 130, 140, 150])
assert.deepEqual(beta.points.map((point) => point.viewers), [90, 95, 100, 110, null, 130])
assert.equal(alpha.viewerMinutes, 2600)
assert.equal(beta.viewerMinutes, 2625)
assert.ok(viewers.primaryBattle)
assert.equal(viewers.primaryBattle.overlapCount, 3)
assert.equal(viewers.primaryBattle.missingPenalty, 0, 'outside/unavailable buckets became category missing penalty')
assert.deepEqual(viewers.contract.linePointStates, ['observed', 'missing', 'not_observed', 'offline', 'outside_category', 'category_unavailable'])

const alphaIndexed = indexed.lines.find((line) => line.id === 'alpha')
const betaIndexed = indexed.lines.find((line) => line.id === 'beta')
assert.ok(alphaIndexed && betaIndexed)
assert.equal(Math.max(...alphaIndexed.points.map((point) => point.value ?? -1)), 100)
assert.equal(Math.max(...betaIndexed.points.map((point) => point.value ?? -1)), 100)
assert.equal(alphaIndexed.points[1].value, null)
assert.equal(alphaIndexed.points[2].value, null)

const unknown = category.projectKickBattleLinesCategory({
  rows,
  dictionaryRows,
  selectedCategory: '__unknown__',
  requestedBucket: '5m',
  period,
  sampleIntervalMinutes: 5,
})
assert.equal(unknown.state, 'unknown_category')
assert.equal(unknown.candidateCount, 0)
assert.ok(unknown.rows.every((row) => row.items.length === 0))
const unknownPayload = core.buildBattleLinesPayload(unknown.rows, {
  platform: 'kick',
  top: 5,
  requestedBucket: '5m',
  metric: 'viewers',
  period,
  now: new Date('2026-08-11T00:00:00.000Z'),
  sampleIntervalMinutes: 5,
  categoryScoped: true,
})
assert.equal(unknownPayload.lines.length, 0)
assert.equal(unknownPayload.battles.length, 0)
assert.equal(unknownPayload.coverage.observedBuckets, 6)

console.log(JSON.stringify({
  status: 'pass',
  selectedCategory: projection.selectedCategory,
  candidates: projection.candidateCount,
  coverage: projection.coverageCounts,
  alphaStates: alpha.points.map((point) => point.state),
  betaStates: beta.points.map((point) => point.state),
  overlapCount: viewers.primaryBattle.overlapCount,
  missingPenalty: viewers.primaryBattle.missingPenalty,
  unknownLines: unknownPayload.lines.length,
  unknownBattles: unknownPayload.battles.length,
}, null, 2))

function rawRow(time, tuples, refs) {
  const bucket = `2026-08-10T${time}:00.000Z`
  return {
    bucket_minute: bucket,
    collected_at: bucket,
    source_mode: 'real',
    payload_json: JSON.stringify({
      items: tuples.map(([channelLogin, displayName, viewers]) => ({ channelLogin, displayName, viewers })),
      categoryContractVersion: 'category-source-v1',
      categoryIds: ['catA', 'catB'],
      categoryRefs: refs,
    }),
  }
}
