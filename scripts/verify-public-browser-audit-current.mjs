import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')
const index = readFileSync('docs/README.md', 'utf8')

for (const text of ['Phase 8 P8B complete PR #428', 'Phase 10 U10C visualization complete PR #458', 'Active implementation branch: none', 'Exact next branch: work-quality-u10d-analysis-coherence']) assert.ok(roadmap.includes(text))
for (const text of ['Phase 8 complete PR #428', 'U10C complete PR #458', 'Active branch: none', 'Next branch: work-quality-u10d-analysis-coherence']) assert.ok(schedule.includes(text))
for (const text of ['Completed U10C implementation: PR #458', 'Current implementation branch: none', 'work-quality-u10d-analysis-coherence']) assert.ok(program.includes(text))
for (const text of ['Phase 10 U10C visualization                      complete PR #458', 'Active implementation branch                    none', 'Exact next implementation branch                work-quality-u10d-analysis-coherence']) assert.ok(index.includes(text))

console.log('P8B current-state handoff verification passed.')
console.log('- U10C is complete')
console.log('- U10D is exact next')
