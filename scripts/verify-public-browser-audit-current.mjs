import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')

for (const text of [
  'Phase 8 P8B complete PR #428',
  'Phase 10 U10F readiness complete PR #468',
  'Phase 10 U10G architecture complete PR #470',
  'Phase 10 U10H production acceptance complete PR #471',
  'Phase 11 acceptance and operations active',
  'Active implementation branch: work-quality-phase11-acceptance-operations',
  'Current workstream: P11A strict-null baseline',
]) assert.ok(roadmap.includes(text), `roadmap missing ${text}`)

for (const text of [
  'Phase 8 complete PR #428',
  'U10F complete PR #468',
  'U10G complete PR #470',
  'U10H production acceptance complete PR #471',
  'Phase 11 acceptance and operations active',
  'Active branch: work-quality-phase11-acceptance-operations',
  'Current workstream: P11A strict-null baseline',
]) assert.ok(schedule.includes(text), `schedule missing ${text}`)

console.log('P8B current-state handoff verification passed.')
console.log('- U10F, U10G, and U10H remain completed evidence')
console.log('- Phase 11 acceptance and operations is active at P11A baseline')
