import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
}

const required = [
  'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/u10h-production-acceptance-2026-07-04.md',
  'docs/operations/phase11-production-closeout-2026-07-08.md',
  'docs/operations/r12a-production-acceptance-2026-07-08.md',
  'docs/operations/r12b0-evidence-audit-2026-07-09.md',
  'docs/operations/r12b1-support-transition-acceptance-2026-07-09.md',
  'docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/audits/r12a-production-acceptance.json',
  'docs/audits/r12b-evidence-and-configuration-audit.json',
  'docs/audits/r12b-repository-consistency-notes.md',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'docs/audits/phase11-strict-null-baseline.json',
  'docs/audits/phase11-ci-ownership-baseline.json',
  'docs/audits/phase11-monitoring-contract.json',
  'docs/audits/phase11-public-acceptance-ownership.json',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'scripts/verify-r12b-evidence-audit.mjs',
  'scripts/verify-r12b1-acceptance-record.mjs',
  'scripts/verify-r12b2-acceptance-record.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  '.github/workflows/release-r12b-evidence-audit.yml',
  '.github/workflows/release-r12b1-support-transition.yml',
  '.github/workflows/release-r12b2-refund-disclosure.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) assert.equal(exists(path), true, `missing file: ${path}`)

assert.equal(exists('docs/work-in-progress/phase11-acceptance-operations.md'), false, 'completed Phase 11 working note must be retired')
assert.equal(exists('.github/workflows/phase11-hosted-closeout-acceptance.yml'), false, 'temporary Phase 11 workflow must remain retired')
assert.equal(exists('.github/workflows/release-r12a-production-closeout.yml'), false, 'temporary R12A closeout workflow must remain retired')
assert.equal(exists('docs/audits/r12a-candidate-acceptance-marker.md'), false, 'R12A candidate marker must remain retired')

for (const path of ['README.md', 'docs/README.md']) check(path, [
  'Phase 12 English release readiness',
  'R12A', 'complete',
  'R12B', 'complete',
  'R12C', 'R12C-0',
  'work-release-r12c0-message-inventory',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A',
])

check('AGENTS.md', [
  'Phase 11 production closeout complete',
  'R12B Stripe/support readiness complete through R12B-2',
  'Current workstream: R12C-0 message inventory',
  'Exact next implementation branch: work-release-r12c0-message-inventory',
  'Next branch created: no',
])

check('CONTRIBUTING.md', [
  'Phase 11 production closeout complete',
  'R12B Stripe and support-flow readiness complete through R12B-2',
  'Current workstream: R12C-0 message inventory',
  'Exact next implementation branch: work-release-r12c0-message-inventory',
  'R12C English launch package and release acceptance active at R12C-0',
])

for (const path of [
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) check(path, [
  'Phase 11 production closeout complete',
  'Phase 12 English release readiness',
  'R12B', 'complete',
  'R12C', 'R12C-0',
  'work-release-r12c0-message-inventory',
  'Phase 12A Analytics Capture Foundation',
  'Phase 15 Analytics Capability and Calibration Audit',
  'Phase 16A',
  'Phase 16F',
])

check('docs/work-in-progress/phase12-release-readiness.md', [
  'Status: active',
  'Current workstream: R12C-0 message inventory',
  'Exact next implementation branch: `work-release-r12c0-message-inventory`',
  'Next branch created: no',
  'R12B Stripe and support-flow readiness             complete through R12B-2',
  'R12C English launch package and release acceptance active at R12C-0',
  'R12B is complete through R12B-2.',
])

check('docs/product/release-readiness-plan.md', [
  'R12B-0 — evidence and configuration audit',
  'R12B-1 — Support page and payment transition',
  'R12B-2 — refund/disclosure consistency acceptance',
  'R12C-0 — message inventory',
  'R12C-3 — release candidate acceptance',
  'Do not begin Phase 12A data/schema work before Phase 12 release acceptance closes',
])

check('docs/operations/r12b0-evidence-audit-2026-07-09.md', [
  'Status: complete',
  'Workstream: R12B-0',
  'Hosted workflow run: `28962351393`',
  'current registered business website/domain value in Stripe Dashboard',
])
check('docs/operations/r12b1-support-transition-acceptance-2026-07-09.md', [
  'Status: complete',
  'Workstream: R12B-1',
  'Workflow run: `28963037083`',
  'Mobile CTA size: 217x44px',
  'R12B-1 is complete as acceptance-only work.',
])
check('docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md', [
  'Status: complete',
  'Workstream: R12B-2',
  'Workflow run: `28963522407`',
  'Page scenarios: 8',
  'Mobile Back/return flows: 2',
  'Violations: 0',
  'R12B is complete through R12B-2.',
  'The next active workstream is R12C-0 message inventory.',
])

const r12a = JSON.parse(read('docs/audits/r12a-production-acceptance.json'))
assert.equal(r12a.status, 'complete')
assert.equal(r12a.result, 'pass')
assert.equal(r12a.expected_main_sha, '952f0008209363f4fd5b22587975ac247ee8d6f2')
assert.equal(r12a.deployed_sha, r12a.expected_main_sha)
assert.equal(r12a.counts.html_routes, 25)
assert.equal(r12a.counts.provider_crossing_failures, 0)
assert.equal(r12a.counts.blocking_alerts, 0)

const r12b0 = JSON.parse(read('docs/audits/r12b-evidence-and-configuration-audit.json'))
assert.equal(r12b0.status, 'complete')
assert.equal(r12b0.workstream, 'R12B-0')
assert.equal(r12b0.completion_gate.r12b_0_complete, true)
assert.equal(r12b0.evidence_classes.current_external_dashboard_state.status, 'pending_external_evidence')
assert.equal(r12b0.consistency_review.unsupported_dashboard_state_claims_detected, false)
assert.equal(r12b0.consistency_review.charitable_donation_wording_detected, false)

const inventory = JSON.parse(read('docs/audits/public-surface-inventory.json'))
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.active_program, 'Phase 12 R12C English launch package and release acceptance')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = JSON.parse(read('docs/audits/public-surface-gaps.json'))
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)
assert.equal(gaps.resolved_surfaces.length, 5)
assert.equal(gaps.historical_missing_surface_baseline.count, 5)
assert.equal(gaps.cross_route_gaps.find((item) => item.id === 'policy-surfaces-missing')?.state, 'resolved')

const strict = JSON.parse(read('docs/audits/phase11-strict-null-baseline.json'))
assert.equal(strict.status, 'remediation-complete')
assert.equal(strict.result.total_errors_remaining, 0)
const ci = JSON.parse(read('docs/audits/phase11-ci-ownership-baseline.json'))
assert.equal(ci.status, 'complete')
assert.equal(ci.remediation.counts.workflows_missing_latest_head_cancellation, 0)
const monitoring = JSON.parse(read('docs/audits/phase11-monitoring-contract.json'))
assert.equal(monitoring.status, 'complete')
assert.equal(monitoring.hosted_evidence.result, 'pass')
assert.equal(monitoring.hosted_evidence.blocking_alerts, 0)
const historicalOwnership = JSON.parse(read('docs/audits/phase11-public-acceptance-ownership.json'))
assert.equal(historicalOwnership.status, 'complete')
assert.equal(historicalOwnership.counts.routes, 20)
assert.equal(historicalOwnership.requirements.provider_binding_crossing_failures, 0)

check('docs/product/analytics-observation-system-spec.md', [
  'Baseline Engine', 'Anomaly Detection', 'Observed Run Intelligence',
  'Category-relative Analysis', 'Co-movement and Relationship Analysis',
  'Replay and Backtest', 'Phase 12A Analytics Capture Foundation',
])
check('docs/product/analytics-observation-system-plan.md', [
  'Phase 12A — Analytics Capture Foundation',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
])

for (const path of [
  '.github/workflows/development-policy.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/production-smoke.yml',
  '.github/workflows/release-r12b-evidence-audit.yml',
  '.github/workflows/release-r12b1-support-transition.yml',
  '.github/workflows/release-r12b2-refund-disclosure.yml',
]) {
  const source = read(path)
  assert.ok(source.includes('concurrency:'), `${path}: concurrency missing`)
  assert.ok(source.includes('cancel-in-progress: true'), `${path}: cancellation missing`)
}

console.log('ViewLoom development and documentation verification passed.')
console.log('- Phase 10, Phase 11, R12A, and R12B closeouts remain complete')
console.log('- R12B-0, R12B-1, and R12B-2 permanent evidence is retained')
console.log('- Phase 12 English release readiness is active at R12C-0 message inventory')
console.log('- exact next branch is work-release-r12c0-message-inventory and remains uncreated')
console.log('- current inventory owns 25 HTML routes and 100 browser scenarios')
console.log('- Phase 12A remains blocked until R12C-3 closes Phase 12')
console.log('- Twitch and Kick remain separate')
