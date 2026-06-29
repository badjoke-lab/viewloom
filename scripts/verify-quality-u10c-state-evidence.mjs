import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const file = resolve(process.env.QUALITY_U10C_ARTIFACT_DIR ?? '/tmp/quality-u10c', 'quality-u10c-state-settle-evidence.json')
const evidence = JSON.parse(readFileSync(file, 'utf8'))

assert.equal(evidence.schema, 'viewloom-quality-u10c-state-settle-v1')
assert.equal(evidence.phase, 'U10C')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.checks.length, 32)
for (const check of evidence.checks) {
  assert.notEqual(check.stageState, 'loading')
  assert.equal(check.stageState, check.guideState)
  assert.equal(check.busy, 'false')
  assert.ok(check.stateLabel)
  assert.ok(check.stateDetail)
  assert.ok(check.stateMark)
  assert.equal(check.result, 'pass')
}

console.log('ViewLoom U10C settled-state evidence passed for 32 route/viewport checks.')
