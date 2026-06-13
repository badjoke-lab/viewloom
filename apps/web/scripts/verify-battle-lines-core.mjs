import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const sourceUrl = new URL('../functions/_lib/battle-lines-core.ts', import.meta.url)
const source = await readFile(sourceUrl, 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText
const core = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)

assert.equal(core.normalizeTop('3'), 3)
assert.equal(core.normalizeTop('10'), 10)
assert.equal(core.normalizeTop('7'), 5)
assert.equal(core.normalizeRequestedBucket('1m'), '1m')
assert.equal(core.normalizeDisplayBucket('1m', 5), '5m')
assert.equal(core.normalizeDisplayBucket('10m', 5), '10m')

const now = new Date('2026-06-13T12:23:00.000Z')
const today = core.buildBattlePeriod(new URL('https://example.test/api?range=today'), now)
assert.deepEqual(today, {
  mode: 'today',
  selectedDate: '2026-06-13',
  from: '2026-06-13T00:00:00.000Z',
  to: '2026-06-13T12:23:00.000Z',
  isLive: true,
})
const yesterday = core.buildBattlePeriod(new URL('https://example.test/api?range=yesterday'), now)
assert.equal(yesterday.from, '2026-06-12T00:00:00.000Z')
assert.equal(yesterday.to, '2026-06-13T00:00:00.000Z')
assert.equal(yesterday.isLive, false)
const dated = core.buildBattlePeriod(new URL('https://example.test/api?range=date&date=2026-06-01'), now)
assert.equal(dated.from, '2026-06-01T00:00:00.000Z')
assert.equal(dated.to, '2026-06-02T00:00:00.000Z')

const fixturePeriod = {
  mode: 'date',
  selectedDate: '2026-06-13',
  from: '2026-06-13T00:00:00.000Z',
  to: '2026-06-13T00:25:00.000Z',
  isLive: false,
}
const fixtureRows = [
  row('00:00', [['alpha', 'Alpha', 100], ['beta', 'Beta', 90]]),
  row('00:05', [['alpha', 'Alpha', 120]]),
  row('00:15', [['alpha', 'Alpha', 80], ['beta', 'Beta', 130]]),
  row('00:20', [['alpha', 'Alpha', 60], ['beta', 'Beta', 140]]),
]

const viewers = core.buildBattleLinesPayload(fixtureRows, {
  platform: 'twitch',
  top: 5,
  requestedBucket: '5m',
  metric: 'viewers',
  period: fixturePeriod,
  now,
  sampleIntervalMinutes: 5,
})
const indexed = core.buildBattleLinesPayload(fixtureRows, {
  platform: 'twitch',
  top: 5,
  requestedBucket: '5m',
  metric: 'indexed',
  period: fixturePeriod,
  now,
  sampleIntervalMinutes: 5,
})

assert.equal(viewers.timeline.length, 5)
assert.equal(viewers.lines.length, 2)
assert.ok(viewers.lines.every((line) => line.points.length === viewers.timeline.length))
const alphaViewers = viewers.lines.find((line) => line.id === 'alpha')
const betaViewers = viewers.lines.find((line) => line.id === 'beta')
const alphaIndexed = indexed.lines.find((line) => line.id === 'alpha')
const betaIndexed = indexed.lines.find((line) => line.id === 'beta')
assert.ok(alphaViewers && betaViewers && alphaIndexed && betaIndexed)
assert.equal(alphaViewers.points[2].state, 'not_observed')
assert.equal(betaViewers.points[1].state, 'missing')
assert.equal(betaViewers.points[2].state, 'not_observed')
assert.equal(Math.max(...alphaIndexed.points.map((point) => point.value ?? -1)), 100)
assert.equal(Math.max(...betaIndexed.points.map((point) => point.value ?? -1)), 100)
assert.notDeepEqual(
  alphaViewers.points.map((point) => point.value),
  alphaIndexed.points.map((point) => point.value),
)
assert.ok(viewers.primaryBattle)
assert.equal(viewers.primaryBattle.currentLeaderId, 'beta')
assert.equal(viewers.primaryBattle.currentGap, 80)
assert.equal(viewers.reversals.length, 1)
assert.equal(viewers.reversals[0].passer, 'Beta')
assert.equal(viewers.reversals[0].passed, 'Alpha')
assert.equal(viewers.reversals[0].time, '2026-06-13T00:15:00.000Z')
assert.ok(viewers.events.every((event) => !event.title.endsWith(' observed')))
assert.equal(viewers.coverage.expectedBuckets, 5)
assert.equal(viewers.coverage.observedBuckets, 4)
assert.equal(viewers.coverage.missingBuckets, 1)
assert.equal(viewers.state, 'partial')
assert.deepEqual(
  viewers.lines[0].points.map((point) => point.bucket),
  viewers.lines[1].points.map((point) => point.bucket),
)

console.log('Battle Lines core fixtures passed.')

function row(time, tuples) {
  const bucket = `2026-06-13T${time}:00.000Z`
  return {
    bucketMinute: bucket,
    collectedAt: bucket,
    sourceMode: 'real',
    items: tuples.map(([id, name, viewers]) => ({ id, name, viewers })),
  }
}
