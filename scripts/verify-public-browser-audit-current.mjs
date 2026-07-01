import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10E responsive and accessibility complete PR #465', 'U10E canonical closeout complete PR #466', 'Phase 10 U10F readiness active', 'Active implementation branch: work-quality-u10f-readiness', 'Exact next branch: work-quality-u10g-architecture']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10E responsive and accessibility complete PR #465', 'U10E closeout complete PR #466', 'U10F readiness active', 'Active branch: work-quality-u10f-readiness', 'Next branch: work-quality-u10g-architecture']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10E implementation: PR #465', 'Completed U10E canonical closeout: PR #466', 'Current phase: Phase 10 — U10F readiness', 'Current implementation branch: `work-quality-u10f-readiness`', 'Exact next implementation branch: `work-quality-u10g-architecture`']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10E responsive and accessibility       complete PR #465', 'U10E canonical closeout                          complete PR #466', 'Phase 10 U10F readiness                          active', 'Active implementation branch                    work-quality-u10f-readiness', 'Exact next implementation branch                work-quality-u10g-architecture']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10E is permanently complete')
console.log('- U10F is active and U10G is exact next')
