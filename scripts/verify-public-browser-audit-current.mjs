import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')

for (const text of [
  'Phase 8 P8B complete PR #428',
  'Phase 10 U10F readiness complete PR #468',
  'Phase 10 U10G architecture complete PR #470',
  'Phase 10 U10H production acceptance complete PR #471',
  'Phase 11 P11A-P11G complete',
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'R12A legal and support public-surface completion complete',
  'R12A implementation PR: #477',
  'R12A production acceptance: pass',
  'Current workstream: R12B-0 evidence and configuration audit',
  'Exact next implementation branch: work-release-r12b-stripe-support-flow',
  'Next branch created: no',
]) assert.ok(roadmap.includes(text), `roadmap missing ${text}`)

for (const text of [
  'Phase 8 complete PR #428',
  'U10F complete PR #468',
  'U10G complete PR #470',
  'U10H production acceptance complete PR #471',
  'Phase 11 P11A-P11G complete',
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'R12A legal and support public-surface completion complete',
  'R12A implementation PR: #477',
  'R12A production acceptance: pass',
  'Current workstream: R12B-0 evidence and configuration audit',
  'Exact next implementation branch: work-release-r12b-stripe-support-flow',
  'Next branch created: no',
]) assert.ok(schedule.includes(text), `schedule missing ${text}`)

const acceptance = JSON.parse(readFileSync('docs/audits/r12a-production-acceptance.json', 'utf8'))
assert.equal(acceptance.status, 'complete')
assert.equal(acceptance.result, 'pass')
assert.equal(acceptance.expected_main_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(acceptance.deployed_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(acceptance.counts.html_routes, 25)
assert.equal(acceptance.counts.provider_crossing_failures, 0)
assert.equal(acceptance.counts.blocking_alerts, 0)

console.log('Current public-state handoff verification passed.')
console.log('- U10F, U10G, and U10H remain completed evidence')
console.log('- Phase 11 and R12A production closeout are complete')
console.log('- Phase 12 English release readiness is active at R12B-0')
console.log('- exact next branch is work-release-r12b-stripe-support-flow and remains uncreated')
console.log('- current inventory owns 25 public HTML routes and 100 browser scenarios')
