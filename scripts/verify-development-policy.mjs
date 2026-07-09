import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const json = (path) => JSON.parse(read(path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
  }
}

const required = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/operations/documentation-governance.md',
  'docs/operations/phase11-production-closeout-2026-07-08.md',
  'docs/operations/r12a-production-acceptance-2026-07-08.md',
  'docs/operations/r12b0-evidence-audit-2026-07-09.md',
  'docs/operations/r12b1-support-transition-acceptance-2026-07-09.md',
  'docs/operations/r12b2-refund-disclosure-acceptance-2026-07-09.md',
  'docs/operations/r12c0-message-inventory-2026-07-09.md',
  'docs/operations/r12c1-launch-copy-acceptance-2026-07-09.md',
  'docs/operations/r12c2-launch-assets-acceptance-2026-07-09.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/product/english-launch-copy.md',
  'docs/product/launch-asset-captions.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/audits/r12a-production-acceptance.json',
  'docs/audits/r12b-evidence-and-configuration-audit.json',
  'docs/audits/r12c0-message-inventory.json',
  'docs/audits/r12c1-launch-copy-package.json',
  'docs/audits/r12c2-launch-assets-capture.json',
  'docs/audits/r12c2-launch-asset-manifest.json',
  'docs/audits/r12c3-release-candidate-contract.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'scripts/verify-r12c1-launch-copy-package.mjs',
  'scripts/verify-r12c2-launch-assets-package.mjs',
  'scripts/verify-r12c3-release-candidate.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/release-r12c2-launch-assets.yml',
  '.github/workflows/release-r12c3-release-candidate.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) {
  assert.equal(exists(path), true, `missing file: ${path}`)
}

for (const asset of [
  'viewloom-desktop.png',
  'viewloom-mobile.png',
  'twitch-heatmap.png',
  'twitch-day-flow.png',
  'twitch-battle-lines.png',
  'twitch-history.png',
]) {
  assert.equal(exists(`apps/web/public/launch-assets/${asset}`), true, `missing R12C-2 asset: ${asset}`)
}

assert.equal(exists('docs/work-in-progress/phase11-acceptance-operations.md'), false)
assert.equal(exists('.github/workflows/phase11-hosted-closeout-acceptance.yml'), false)
assert.equal(exists('.github/workflows/release-r12a-production-closeout.yml'), false)
assert.equal(exists('docs/audits/r12a-candidate-acceptance-marker.md'), false)

for (const path of [
  'README.md',
  'docs/README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/work-in-progress/phase12-release-readiness.md',
]) {
  check(path, [
    'Phase 12',
    'R12C-2',
    'complete',
    'R12C-3',
    'active',
    'work-release-r12c3-release-candidate-acceptance',
  ])
}

check('AGENTS.md', [
  'Current workstream: R12C-3 release candidate acceptance',
  'Exact active implementation branch: work-release-r12c3-release-candidate-acceptance',
  'Active branch created: yes',
  'Candidate merge does not complete Phase 12.',
])
check('CONTRIBUTING.md', [
  'Current workstream: R12C-3 release candidate acceptance',
  'Exact active implementation branch: work-release-r12c3-release-candidate-acceptance',
  'Active branch created: yes',
  'Candidate merge alone does not complete Phase 12.',
])
check('docs/work-in-progress/phase12-release-readiness.md', [
  'R12C-3 candidate contract: `../audits/r12c3-release-candidate-contract.json`',
  'Exact active implementation branch: `work-release-r12c3-release-candidate-acceptance`',
  'Active branch created: yes',
  'Candidate merge alone does not complete Phase 12.',
])

const r12a = json('docs/audits/r12a-production-acceptance.json')
assert.equal(r12a.status, 'complete')
assert.equal(r12a.result, 'pass')
assert.equal(r12a.expected_main_sha, r12a.deployed_sha)
assert.equal(r12a.counts.html_routes, 25)
assert.equal(r12a.counts.provider_crossing_failures, 0)
assert.equal(r12a.counts.blocking_alerts, 0)

const r12b = json('docs/audits/r12b-evidence-and-configuration-audit.json')
assert.equal(r12b.status, 'complete')
assert.equal(r12b.workstream, 'R12B-0')
assert.equal(r12b.completion_gate.r12b_0_complete, true)
assert.equal(r12b.evidence_classes.current_external_dashboard_state.status, 'pending_external_evidence')
assert.equal(r12b.consistency_review.unsupported_dashboard_state_claims_detected, false)
assert.equal(r12b.consistency_review.charitable_donation_wording_detected, false)

const r12c0 = json('docs/audits/r12c0-message-inventory.json')
assert.equal(r12c0.status, 'complete')
assert.equal(r12c0.workstream, 'R12C-0')
assert.equal(r12c0.completion.r12c0_complete, true)

const r12c1 = json('docs/audits/r12c1-launch-copy-package.json')
assert.equal(r12c1.schema, 'viewloom-r12c1-launch-copy-package-v1')
assert.equal(r12c1.status, 'complete')
assert.equal(r12c1.feature_roles.length, 7)
assert.equal(r12c1.faq.length, 12)
assert.equal(r12c1.completion.r12c1_complete, true)
assert.equal(r12c1.retention.collection_cadence, '5 minutes')
assert.equal(r12c1.retention.public_daily_rollups, 'up to 180 days')

const r12c2Capture = json('docs/audits/r12c2-launch-assets-capture.json')
assert.equal(r12c2Capture.schema, 'viewloom-r12c2-launch-assets-capture-v1')
assert.equal(r12c2Capture.result, 'pass')
assert.equal(r12c2Capture.assets.length, 6)
assert.equal(r12c2Capture.violations.length, 0)

const r12c2Manifest = json('docs/audits/r12c2-launch-asset-manifest.json')
assert.equal(r12c2Manifest.schema, 'viewloom-r12c2-launch-asset-manifest-v1')
assert.equal(r12c2Manifest.assetCount, 6)
assert.equal(r12c2Manifest.assets.length, 6)
assert.equal(r12c2Manifest.capture.result, 'pass')
assert.equal(r12c2Manifest.packageVerification.result, 'pass')

const r12c3 = json('docs/audits/r12c3-release-candidate-contract.json')
assert.equal(r12c3.schema, 'viewloom-r12c3-release-candidate-contract-v1')
assert.equal(r12c3.phase, 'Phase 12')
assert.equal(r12c3.workstream, 'R12C-3')
assert.equal(r12c3.status, 'active')
assert.equal(r12c3.branch, 'work-release-r12c3-release-candidate-acceptance')
assert.equal(r12c3.baseMainSha, '13975969a077bbbf9979253e6ee4570b1e20aa4a')
assert.equal(r12c3.candidateContract.htmlRoutes, 25)
assert.equal(r12c3.candidateContract.browserScenarios, 100)
assert.equal(r12c3.candidateContract.combinedTotalsAllowed, false)
assert.equal(r12c3.candidateContract.combinedRankingsAllowed, false)
assert.equal(r12c3.postmergeBoundary.exactMainShaProductionSmokeRequired, true)

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.counts.current_browser_required_viewports, 4)
assert.equal(inventory.counts.current_browser_scenarios, 100)
assert.equal(inventory.counts.sitemap_routes, 21)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = json('docs/audits/public-surface-gaps.json')
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)
assert.equal(gaps.resolved_surfaces.length, 5)

check('docs/product/release-readiness-plan.md', [
  'R12C-3 — release candidate acceptance',
  'exact production SHA smoke after merge',
  'Create permanent Phase 12 release acceptance evidence.',
  'Do not begin Phase 12A data/schema work before Phase 12 release acceptance closes',
])
check('docs/product/analytics-observation-system-plan.md', [
  'Phase 12A — Analytics Capture Foundation',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
])

console.log('Development and documentation policy verification passed.')
console.log('- R12C-0, R12C-1, and R12C-2 remain complete with permanent evidence')
console.log('- R12C-3 candidate contract is active on work-release-r12c3-release-candidate-acceptance')
console.log('- active branch state is synchronized across canonical handoff documents')
console.log('- candidate merge does not complete Phase 12; exact main SHA Production Smoke remains required')
console.log('- Phase 12A remains gated by full Phase 12 acceptance and closeout')
