import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10C visualization complete PR #458', 'Phase 10 U10D analysis coherence active', 'Active implementation branch: work-quality-u10d-analysis-coherence', 'Exact next branch: work-quality-u10e-responsive']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10C complete PR #458', 'U10D analysis coherence active', 'Active branch: work-quality-u10d-analysis-coherence', 'Next branch: work-quality-u10e-responsive']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10C implementation: PR #458', 'Current implementation branch: `work-quality-u10d-analysis-coherence`', 'work-quality-u10e-responsive']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10C visualization                      complete PR #458', 'Phase 10 U10D analysis coherence                 active', 'Active implementation branch                    work-quality-u10d-analysis-coherence', 'Exact next implementation branch                work-quality-u10e-responsive']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10C is permanently complete')
console.log('- U10D is active and U10E is exact next')
