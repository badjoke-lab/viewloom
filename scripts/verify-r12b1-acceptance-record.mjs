import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const recordPath = 'docs/operations/r12b1-support-transition-acceptance-2026-07-09.md'
assert.equal(existsSync(recordPath), true, `missing ${recordPath}`)
const record = readFileSync(recordPath, 'utf8')

for (const fragment of [
  'Status: complete',
  'Workstream: R12B-1',
  'Acceptance model: existing implementation accepted; no Support UI change required',
  'Workflow run: `28963037083`',
  'Artifact id: `8176871147`',
  'sha256:98d92c559c9ddeda0d3307be01a213e13cb85406a0ee4333d211b47dbf0197c1',
  'Evidence head SHA: `1f4405ace2735f7a34f1989bd1988800bc442897`',
  'Desktop 1440: pass',
  'Mobile 390: pass',
  'Violations: 0',
  'Horizontal overflow: 0px desktop / 0px mobile',
  'Desktop CTA size: 217x34px',
  'Mobile CTA size: 217x44px',
  'The 44px mobile action-target requirement is met exactly.',
  'secret-like Stripe credential token in public DOM text: none',
  'R12B-1 is complete as acceptance-only work.',
  'The next workstream is R12B-2 refund/disclosure consistency acceptance.',
]) assert.ok(record.includes(fragment), `${recordPath}: missing ${fragment}`)

for (const forbidden of [
  'Stripe Dashboard registered website is confirmed current',
  'Stripe recurring configuration is confirmed disabled',
  'Stripe refund configuration is confirmed',
]) assert.equal(record.includes(forbidden), false, `${recordPath}: unsupported external claim ${forbidden}`)

console.log('R12B-1 permanent acceptance record verification passed.')
console.log('- existing Support implementation is accepted without unnecessary UI changes')
console.log('- desktop and mobile transition evidence is permanently recorded')
console.log('- mobile CTA meets the 44px requirement')
console.log('- external Stripe Dashboard facts remain outside the acceptance claim')
console.log('- R12B-2 refund/disclosure consistency acceptance is next')
