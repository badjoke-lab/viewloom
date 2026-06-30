import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.env.QUALITY_U10D_EVIDENCE ?? '/tmp/quality-u10d/quality-u10d-analysis-coherence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))
assert.equal(evidence.schema, 'viewloom-quality-u10d-analysis-coherence-v1')
assert.equal(evidence.phase, 'U10D')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.checkpoint, 'complete')
assert.equal(evidence.scenarios.length, 20)
assert.equal(evidence.scenarios.filter((item) => item.feature === 'day-flow').length, 12)
assert.equal(evidence.scenarios.filter((item) => item.feature === 'battle-lines').length, 8)
for (const provider of ['twitch', 'kick']) {
  for (const width of [1440, 820, 390, 360]) {
    assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-default-${width}`))
    assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-battle-analysis-${width}`))
  }
  assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-url-split-1440`))
  assert.ok(evidence.scenarios.some((item) => item.id === `${provider}-day-flow-stored-split-1440`))
}
for (const item of evidence.scenarios) {
  assert.equal(item.crossRequests, 0, `${item.id}: crossed provider request`)
  assert.equal(item.actionRefetched, false, `${item.id}: local analysis action refetched data`)
  assert.ok(item.requests >= 1, `${item.id}: expected provider request was not observed`)
}
console.log('U10D browser evidence verification passed.')
console.log('- 20 provider-separated scenarios passed')
console.log('- layout, recommendation, and selected-time actions did not refetch')
