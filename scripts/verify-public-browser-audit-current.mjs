import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10F readiness complete PR #468', 'U10F canonical closeout complete PR #469', 'Phase 10 U10G architecture complete PR #470', 'Phase 10 U10H production acceptance active', 'Active implementation branch: work-quality-u10h-acceptance', 'Exact next branch: work-quality-phase11-acceptance-operations']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10F readiness complete PR #468', 'U10F closeout complete PR #469', 'U10G architecture complete PR #470', 'U10H production acceptance active', 'Active branch: work-quality-u10h-acceptance', 'Next branch: work-quality-phase11-acceptance-operations']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10F implementation: PR #468', 'Completed U10F canonical closeout: PR #469', 'Completed U10G implementation: PR #470', 'Current phase: Phase 10 — U10H production acceptance', 'Current implementation branch: `work-quality-u10h-acceptance`', 'Exact next implementation branch: `work-quality-phase11-acceptance-operations`']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10F readiness                          complete PR #468', 'U10F canonical closeout                          complete PR #469', 'Phase 10 U10G architecture                       complete PR #470', 'Phase 10 U10H production acceptance              active', 'Active implementation branch                    work-quality-u10h-acceptance', 'Exact next implementation branch                work-quality-phase11-acceptance-operations']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10F remains permanently complete')
console.log('- U10G architecture is complete and U10H production acceptance is active')
