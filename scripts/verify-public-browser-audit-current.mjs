import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10F readiness complete PR #468', 'U10F canonical closeout complete PR #469', 'Phase 10 U10G architecture complete PR #470', 'Phase 10 U10H production acceptance complete PR #471', 'Active implementation branch: none', 'Exact next branch: work-quality-phase11-acceptance-operations', 'Phase 11 branch created: no']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10F readiness complete PR #468', 'U10F closeout complete PR #469', 'U10G architecture complete PR #470', 'U10H production acceptance complete PR #471', 'Active branch: none', 'Next branch: work-quality-phase11-acceptance-operations', 'Phase 11 created: no']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10F implementation: PR #468', 'Completed U10F canonical closeout: PR #469', 'Completed U10G implementation: PR #470', 'Completed U10H implementation: PR #471', 'Current phase: Phase 10 — U10H production acceptance complete', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-phase11-acceptance-operations`', 'Phase 11 branch created: no']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10F readiness                          complete PR #468', 'U10F canonical closeout                          complete PR #469', 'Phase 10 U10G architecture                       complete PR #470', 'Phase 10 U10H production acceptance              complete PR #471', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-phase11-acceptance-operations', 'Phase 11 branch created                         no']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10F, U10G, and U10H remain completed evidence')
console.log('- Phase 11 acceptance and operations is exact next and not yet created')
