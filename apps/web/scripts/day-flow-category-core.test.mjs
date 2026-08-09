import assert from 'node:assert/strict'
import { projectDayFlowCategory } from '../functions/api/day-flow-category-core.mjs'

const buckets = [
  '2026-08-08T00:00:00.000Z',
  '2026-08-08T00:05:00.000Z',
  '2026-08-08T00:10:00.000Z',
]
const categoryNames = new Map([
  ['100', 'Game A'],
  ['200', 'Game B'],
])
const payload = (items, categoryIds, categoryRefs, version = 'category-source-v1') => JSON.stringify({
  categoryContractVersion: version,
  categoryIds,
  categoryRefs,
  items,
})
const stream = (login, viewers) => ({ channelLogin: login, displayName: login.toUpperCase(), viewers, title: `${login} title` })
const rows = [
  {
    bucket_minute: buckets[0],
    total_viewers: 100,
    payload_json: payload([stream('alpha', 30), stream('beta', 20)], ['100', '200'], [0, 1]),
  },
  {
    bucket_minute: buckets[1],
    total_viewers: 120,
    payload_json: payload([stream('alpha', 40), stream('beta', 25)], ['100', '200'], [1, 1]),
  },
  {
    bucket_minute: buckets[2],
    total_viewers: 90,
    payload_json: payload([stream('alpha', 35), stream('beta', 15)], ['100', '200'], [0, null]),
  },
]

const all = projectDayFlowCategory({ rows, buckets, bucketSize: 5, selectedCategory: 'all', categoryNames })
assert.deepEqual(all.totals, [100, 120, 90], 'global bucket totals must remain unchanged')
assert.equal(all.categoryFilter.state, 'all')
assert.equal(all.streams.find((value) => value.id === 'alpha')?.values[0], 30)
assert.equal(all.streams.find((value) => value.id === 'alpha')?.values[1], 40)
assert.equal(all.streams.find((value) => value.id === 'alpha')?.values[2], 35)
assert.deepEqual(all.categoryFilter.bucketCoverage.map((value) => value.state), ['observed', 'observed', 'partial'])
assert.equal(all.categoryFilter.coverageState, 'partial')

const gameA = projectDayFlowCategory({ rows, buckets, bucketSize: 5, selectedCategory: '100', categoryNames })
assert.equal(gameA.categoryFilter.state, 'selected')
assert.deepEqual(gameA.totals, [100, 120, 90], 'selected category must keep the global denominator')
assert.deepEqual(gameA.streams.find((value) => value.id === 'alpha')?.values, [30, 0, 35], 'latest category must not be projected backward or forward')
assert.equal(gameA.streams.some((value) => value.id === 'beta'), false)

const gameB = projectDayFlowCategory({ rows, buckets, bucketSize: 5, selectedCategory: '200', categoryNames })
assert.deepEqual(gameB.streams.find((value) => value.id === 'alpha')?.values, [0, 40, 0], 'category switch must be evaluated per observed snapshot')
assert.deepEqual(gameB.streams.find((value) => value.id === 'beta')?.values, [20, 25, 0], 'partial unresolved item must not silently match a category')

const categoryA = all.categoryFilter.availableCategories.find((value) => value.id === '100')
const categoryB = all.categoryFilter.availableCategories.find((value) => value.id === '200')
assert.equal(categoryA?.viewerMinutes, (30 + 35) * 5)
assert.equal(categoryB?.viewerMinutes, (20 + 40 + 25) * 5)
assert.equal(all.categoryFilter.missingItems, 1)

const unavailableRows = [{
  bucket_minute: buckets[0],
  total_viewers: 70,
  payload_json: payload([stream('alpha', 30)], ['100'], [0], 'legacy-contract'),
}]
const unavailable = projectDayFlowCategory({ rows: unavailableRows, buckets: [buckets[0]], bucketSize: 5, selectedCategory: '100', categoryNames })
assert.equal(unavailable.categoryFilter.state, 'category_unavailable')
assert.equal(unavailable.categoryFilter.bucketCoverage[0].state, 'unavailable')
assert.deepEqual(unavailable.totals, [70], 'unavailable category metadata must not erase global context')
assert.deepEqual(unavailable.streams, [], 'unavailable metadata must not be inferred as a category match')

const unknown = projectDayFlowCategory({ rows, buckets, bucketSize: 5, selectedCategory: '999999', categoryNames })
assert.equal(unknown.categoryFilter.state, 'unknown_category')
assert.deepEqual(unknown.streams, [])

const maxRows = [
  { bucket_minute: '2026-08-08T00:01:00.000Z', total_viewers: 100, payload_json: payload([stream('alpha', 20)], ['100'], [0]) },
  { bucket_minute: '2026-08-08T00:04:00.000Z', total_viewers: 110, payload_json: payload([stream('alpha', 35)], ['100'], [0]) },
]
const maxProjection = projectDayFlowCategory({ rows: maxRows, buckets: [buckets[0]], bucketSize: 5, selectedCategory: '100', categoryNames })
assert.deepEqual(maxProjection.totals, [110])
assert.deepEqual(maxProjection.streams[0].values, [35], 'category projection must preserve existing max-within-bucket aggregation')

console.log(JSON.stringify({
  status: 'pass',
  globalTotalsPreserved: true,
  perSnapshotCategorySwitch: true,
  partialCoverageDisclosed: true,
  unavailableIsNotZero: true,
  filterBeforeTopNProjectionReady: true,
}, null, 2))
