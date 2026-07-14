import assert from 'node:assert/strict'
import {
  collectorLatencyDeltaMs,
  parseServiceName,
  sanitize,
  snapshotLatencyMs,
  validateRunId,
} from './run-12a4-category-execution-cost-probe-provider.mjs'

assert.equal(parseServiceName('name = "viewloom-category-cost-probe-twitch"\nmain = "src/index.ts"'), 'viewloom-category-cost-probe-twitch')
assert.equal(validateRunId('Run-0001'), 'run-0001')
assert.throws(() => validateRunId('short'))
assert.throws(() => validateRunId('../not-allowed'))

const before = {
  bucket_minute: '2026-07-14T00:00:00.000Z',
  collected_at: '2026-07-14T00:00:01.250Z',
}
const after = {
  bucket_minute: '2026-07-14T00:05:00.000Z',
  collected_at: '2026-07-14T00:05:01.800Z',
}
assert.equal(snapshotLatencyMs(before), 1250)
assert.equal(snapshotLatencyMs(after), 1800)
assert.equal(collectorLatencyDeltaMs(before, after), 550)
assert.equal(snapshotLatencyMs({}), Number.POSITIVE_INFINITY)
assert.equal(collectorLatencyDeltaMs(before, {}), Number.POSITIVE_INFINITY)

const sanitized = sanitize('Bearer abcdefghijklmnop https://secret.workers.dev 0123456789abcdef0123456789abcdef')
assert.equal(sanitized.includes('abcdefghijklmnop'), false)
assert.equal(sanitized.includes('secret.workers.dev'), false)
assert.equal(sanitized.includes('0123456789abcdef0123456789abcdef'), false)

console.log(JSON.stringify({
  ok: true,
  snapshotLatencyBeforeMs: snapshotLatencyMs(before),
  snapshotLatencyAfterMs: snapshotLatencyMs(after),
  collectorLatencyDeltaMs: collectorLatencyDeltaMs(before, after),
  runIdValidation: true,
  sanitization: true,
}, null, 2))
