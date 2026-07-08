import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const ledger = JSON.parse(read('docs/audits/public-browser-defects.json'))

assert.equal(ledger.schema, 'viewloom-public-browser-defect-ledger-v1')
assert.equal(ledger.status, 'complete')
assert.equal(ledger.phase, 'P8B')
assert.equal(ledger.evidence.matrix.owned_routes, 21)
assert.equal(ledger.evidence.matrix.production_scenarios, 84)
assert.equal(ledger.evidence.matrix.missing_surface_probes, 5)
assert.equal(ledger.evidence.matrix.history_scenarios, 10)
assert.deepEqual(ledger.counts, { p0: 0, p1: 3, p2: 5, p3: 0, total: 8 })
assert.equal(ledger.defects.length, 8)
assert.equal(ledger.verified_invariants.provider_crossing_scenarios, 0)
assert.equal(ledger.verified_invariants.horizontal_overflow_scenarios, 0)

for (const id of [
  'P8B-P1-HISTORY-METRIC-SYNCHRONIZATION',
  'P8B-P1-HISTORY-KEYBOARD-ENTRY',
  'P8B-P1-HISTORY-TASK-HIERARCHY',
  'P8B-P2-SMALL-INTERACTIVE-TARGETS',
  'P8B-P2-WATCHLIST-PUBLIC-READINESS-OMISSION',
  'P8B-P2-PRODUCTION-SMOKE-OMISSIONS',
  'P8B-P2-RELEASE-POLICY-SURFACES-MISSING',
  'P8B-P2-UNLABELED-CONTROLS',
]) assert.ok(ledger.defects.some((item) => item.id === id), `missing P8B record: ${id}`)

const scope = read('docs/audits/P8B_SCOPE.md')
for (const text of [
  'Status: complete through PR #428',
  '84 production route scenarios',
  '10 deterministic History state/interaction scenarios',
  'P8B was audit-only.',
]) assert.ok(scope.includes(text), `P8B scope missing: ${text}`)

const browser = read('apps/web/scripts/public-browser-audit.mjs')
for (const text of [
  "schema: 'viewloom-public-browser-audit-v1'",
  "phase: 'P8B'",
  'productionMatrix',
  'missingSurfaceProbes',
  'historyScenarios',
]) assert.ok(browser.includes(text), `P8B browser owner missing: ${text}`)

console.log('P8B historical repository verification passed.')
console.log('- historical ledger remains 21 owned routes and 84 production scenarios')
console.log('- historical five missing-surface probes remain preserved in the P8B defect ledger')
console.log('- current route inventory and current gap state may advance independently')
