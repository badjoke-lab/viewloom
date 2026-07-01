import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10F readiness complete PR #468', 'U10F canonical closeout complete PR #469', 'Active implementation branch: none', 'Exact next branch: work-quality-u10g-architecture']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10F readiness complete PR #468', 'U10F closeout complete PR #469', 'Active branch: none', 'Next branch: work-quality-u10g-architecture']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10F implementation: PR #468', 'Completed U10F canonical closeout: PR #469', 'Current phase: Phase 10 — U10G architecture exact next', 'Current implementation branch: none', 'Exact next implementation branch: `work-quality-u10g-architecture`']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10F readiness                          complete PR #468', 'U10F canonical closeout                          complete PR #469', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10g-architecture']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10F is permanently complete')
console.log('- U10G architecture is exact next and remains uncreated')
