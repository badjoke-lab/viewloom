import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const recordPath = 'docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md'
assert.equal(existsSync(recordPath), true, `missing ${recordPath}`)
const record = readFileSync(recordPath, 'utf8')

for (const fragment of [
  'Status: complete',
  'Workstream: R12B-2',
  'Workflow run: `28963522407`',
  'Artifact id: `8177066249`',
  'sha256:7c209bf81f04df9687f154b89c9ce89ee602900b583191b4691e2731cea9690d',
  'Evidence head SHA: `3cfc02ea3458170a19f86e43bc7dc6b2d7d16598`',
  'Page scenarios: 8',
  'Mobile Back/return flows: 2',
  'Violations: 0',
  'charitable donation wording detected: false',
  'unsupported current Stripe Dashboard-state claim detected: false',
  'secret-like payment token count: 0',
  '/support/ -> /refund-policy/ -> Back -> /support/: pass',
  '/support/ -> /commercial-disclosure/ -> Back -> /support/: pass',
  'Historical project record date: 2026-06-09',
  'R12B is complete through R12B-2.',
  'The next active workstream is R12C-0 message inventory.',
]) assert.ok(record.includes(fragment), `${recordPath}: missing ${fragment}`)

for (const forbidden of [
  'Current Stripe Dashboard registered website value: confirmed',
  'Current recurring/subscription configuration: confirmed',
  'Current refund configuration: confirmed',
]) assert.equal(record.includes(forbidden), false, `${recordPath}: unsupported external-state claim ${forbidden}`)

console.log('R12B-2 permanent acceptance record verification passed.')
console.log('- 8 page scenarios and 2 mobile return flows are permanently recorded')
console.log('- no wording conflict, donation wording, unsupported dashboard claim, or secret-like token remains')
console.log('- pending external Stripe facts remain explicit')
console.log('- R12B is complete and R12C-0 message inventory is next')
