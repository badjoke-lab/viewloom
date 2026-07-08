import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')

for (const text of [
  'Phase 8 P8B complete PR #428',
  'Phase 10 U10F readiness complete PR #468',
  'Phase 10 U10G architecture complete PR #470',
  'Phase 10 U10H production acceptance complete PR #471',
  'Phase 11 P11A strict-null migration complete',
  'Phase 11 P11F acceptance ownership complete',
  'Phase 11 P11G candidate merged PR #473',
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'Current workstream: R12A-5 candidate and hosted acceptance',
  'Active implementation branch: work-release-r12a-legal-support',
  'Branch created: yes',
  'Candidate public HTML routes: 25',
  'Candidate browser scenarios: 100',
  'Hosted production acceptance: pending merge',
]) assert.ok(roadmap.includes(text), `roadmap missing ${text}`)

for (const text of [
  'Phase 8 complete PR #428',
  'U10F complete PR #468',
  'U10G complete PR #470',
  'U10H production acceptance complete PR #471',
  'Phase 11 P11A strict-null migration complete',
  'Phase 11 P11F acceptance ownership complete',
  'Phase 11 P11G candidate merged PR #473',
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness active',
  'Current workstream: R12A-5 candidate and hosted acceptance',
  'Active implementation branch: work-release-r12a-legal-support',
  'Branch created: yes',
  'Hosted production acceptance: pending merge',
]) assert.ok(schedule.includes(text), `schedule missing ${text}`)

console.log('Current public-state handoff verification passed.')
console.log('- U10F, U10G, and U10H remain completed evidence')
console.log('- Phase 11 P11A through P11G and production closeout are complete')
console.log('- Phase 12 English release readiness is active at R12A-5')
console.log('- active branch is work-release-r12a-legal-support')
console.log('- candidate owns 25 public HTML routes and 100 browser scenarios')
console.log('- hosted production acceptance remains pending merge')
