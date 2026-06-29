import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.env.QUALITY_U10B_EVIDENCE_PATH ?? '/tmp/quality-u10b/quality-u10b-shell-browser-evidence.json'
const evidence = JSON.parse(readFileSync(path, 'utf8'))

assert.equal(evidence.schema, 'viewloom-quality-u10b-shell-browser-v1')
assert.equal(evidence.phase, 'U10B')
assert.equal(evidence.result, 'pass')
assert.equal(evidence.routes, 20)
assert.deepEqual(evidence.viewports, [1440, 390])
assert.equal(evidence.scenarios.length, 40)
assert.equal(evidence.scenarios.filter((item) => item.width === 1440).length, 20)
assert.equal(evidence.scenarios.filter((item) => item.width === 390).length, 20)

console.log('ViewLoom U10B browser evidence verification passed.')
console.log('- 20 built routes and 40 desktop/mobile scenarios are exact')
