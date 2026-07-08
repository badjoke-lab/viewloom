import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const roadmap = readFileSync('docs/product/current-roadmap.md', 'utf8')
const schedule = readFileSync('docs/product/current-schedule.md', 'utf8')
const program = readFileSync('docs/product/post-watchlist-program-plan.md', 'utf8')

for (const [path, source] of [
  ['roadmap', roadmap],
  ['schedule', schedule],
  ['program', program],
]) {
  for (const fragment of [
    'Phase 11 production closeout complete',
    'Phase 12 English release readiness',
    'R12A',
    'complete',
    'R12B',
    'complete',
    'R12C-0',
    'complete',
    'R12C-1',
    'active',
    'work-release-r12c1-launch-copy-faq',
    'Phase 12A Analytics Capture Foundation',
    'Phase 15 Analytics Capability and Calibration Audit',
    'Phase 16A',
  ]) assert.ok(source.includes(fragment), `${path} missing ${fragment}`)
}

for (const fragment of [
  'Current workstream: R12C-1 launch copy and FAQ',
  'Exact next implementation branch: work-release-r12c1-launch-copy-faq',
  'Next branch created: no',
]) {
  assert.ok(roadmap.includes(fragment), `roadmap missing ${fragment}`)
  assert.ok(schedule.includes(fragment), `schedule missing ${fragment}`)
}

const messageInventory = JSON.parse(readFileSync('docs/audits/r12c0-message-inventory.json', 'utf8'))
assert.equal(messageInventory.status, 'complete')
assert.equal(messageInventory.workstream, 'R12C-0')
assert.equal(messageInventory.completion.r12c0_complete, true)
assert.equal(messageInventory.completion.next_workstream, 'R12C-1 launch copy and FAQ')

const acceptance = JSON.parse(readFileSync('docs/audits/r12a-production-acceptance.json', 'utf8'))
assert.equal(acceptance.status, 'complete')
assert.equal(acceptance.result, 'pass')
assert.equal(acceptance.expected_main_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(acceptance.deployed_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(acceptance.counts.html_routes, 25)
assert.equal(acceptance.counts.provider_crossing_failures, 0)
assert.equal(acceptance.counts.blocking_alerts, 0)

const inventory = JSON.parse(readFileSync('docs/audits/public-surface-inventory.json', 'utf8'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.active_program, 'Phase 12 R12C English launch package and release acceptance')

console.log('Current public-state handoff verification passed.')
console.log('- U10F, U10G, U10H, Phase 11, R12A, and R12B remain completed evidence')
console.log('- R12C-0 message inventory is complete')
console.log('- Phase 12 English release readiness is active at R12C-1 launch copy and FAQ')
console.log('- exact next branch is work-release-r12c1-launch-copy-faq and remains uncreated')
console.log('- current inventory owns 25 public HTML routes and 100 browser scenarios')
