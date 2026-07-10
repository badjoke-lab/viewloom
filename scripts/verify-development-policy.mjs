import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (path) => readFileSync(join(root, path), 'utf8')
const exists = (path) => existsSync(join(root, path))
const json = (path) => JSON.parse(read(path))
const check = (path, fragments) => {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path}: missing ${fragment}`)
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
  'docs/operations/r12c3-release-candidate-acceptance-2026-07-09.md',
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md',
  'docs/operations/12a0-closeout-2026-07-10.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/release-readiness-spec.md',
  'docs/product/release-readiness-plan.md',
  'docs/product/english-launch-copy.md',
  'docs/product/launch-asset-captions.md',
  'docs/audits/r12a-production-acceptance.json',
  'docs/audits/r12b-evidence-and-configuration-audit.json',
  'docs/audits/r12c0-message-inventory.json',
  'docs/audits/r12c1-launch-copy-package.json',
  'docs/audits/r12c2-launch-assets-capture.json',
  'docs/audits/r12c2-launch-asset-manifest.json',
  'docs/audits/r12c3-release-candidate-contract.json',
  'docs/audits/r12c3-candidate-acceptance.json',
  'docs/audits/phase12-production-closeout-contract.json',
  'docs/audits/phase12-release-acceptance.json',
  'docs/audits/12a0-current-data-capacity-baseline.json',
  'docs/audits/12a0-closeout.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'scripts/verify-r12c1-launch-copy-package.mjs',
  'scripts/verify-r12c2-launch-assets-package.mjs',
  'scripts/verify-r12c3-candidate-acceptance-record.mjs',
  'scripts/verify-phase12-release-acceptance.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  'scripts/verify-public-browser-audit-current.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/release-r12c2-launch-assets.yml',
  '.github/workflows/public-browser-audit.yml',
  '.github/workflows/public-readiness-audit.yml',
  '.github/workflows/production-smoke.yml',
]
for (const path of required) assert.equal(exists(path), true, `missing file: ${path}`)

for (const asset of [
  'viewloom-desktop.png',
  'viewloom-mobile.png',
  'twitch-heatmap.png',
  'twitch-day-flow.png',
  'twitch-battle-lines.png',
  'twitch-history.png',
]) assert.equal(exists(`apps/web/public/launch-assets/${asset}`), true, `missing R12C-2 asset: ${asset}`)

for (const retired of [
  'docs/work-in-progress/phase11-acceptance-operations.md',
  '.github/workflows/phase11-hosted-closeout-acceptance.yml',
  '.github/workflows/release-r12a-production-closeout.yml',
  'docs/audits/r12a-candidate-acceptance-marker.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  '.github/workflows/release-phase12-production-closeout.yml',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
]) assert.equal(exists(retired), false, `retired file still present: ${retired}`)

for (const path of [
  'README.md',
  'docs/README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]) {
  check(path, [
    'Phase 12',
    'complete',
    'Phase 12A Analytics Capture Foundation',
    '12A-0 current data and capacity baseline',
    '12A-1 analytics field contract',
    'work-analytics-12a1-field-contract',
  ])
}

check('AGENTS.md', [
  'Current phase: Phase 12A Analytics Capture Foundation',
  '12A-0 current data and capacity baseline: complete PR #490',
  'Current workstream: 12A-1 analytics field contract',
  'Exact next implementation branch: work-analytics-12a1-field-contract',
  'Next branch created: no',
  'No D1 migration is authorized in 12A-1.',
])
check('CONTRIBUTING.md', [
  'Current phase: Phase 12A Analytics Capture Foundation',
  '12A-0 current data and capacity baseline: complete PR #490',
  'Current workstream: 12A-1 analytics field contract',
  'Exact next implementation branch: work-analytics-12a1-field-contract',
  'Next branch created: no',
  '12A-1 defines provider-specific analytics field contracts.',
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
assert.equal(r12c0.completion.r12c0_complete, true)

const r12c1 = json('docs/audits/r12c1-launch-copy-package.json')
assert.equal(r12c1.status, 'complete')
assert.equal(r12c1.feature_roles.length, 7)
assert.equal(r12c1.faq.length, 12)
assert.equal(r12c1.completion.r12c1_complete, true)

const r12c2Capture = json('docs/audits/r12c2-launch-assets-capture.json')
assert.equal(r12c2Capture.result, 'pass')
assert.equal(r12c2Capture.assets.length, 6)
assert.equal(r12c2Capture.violations.length, 0)
const r12c2Manifest = json('docs/audits/r12c2-launch-asset-manifest.json')
assert.equal(r12c2Manifest.assetCount, 6)
assert.equal(r12c2Manifest.capture.result, 'pass')
assert.equal(r12c2Manifest.packageVerification.result, 'pass')

const candidate = json('docs/audits/r12c3-candidate-acceptance.json')
assert.equal(candidate.status, 'candidate_pass')
assert.equal(candidate.browser.scenarios, 100)
assert.equal(candidate.browser.violations, 0)
assert.equal(candidate.providerSeparation.combinedTotalsAllowed, false)
assert.equal(candidate.providerSeparation.combinedRankingsAllowed, false)

const phase12 = json('docs/audits/phase12-release-acceptance.json')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.expectedMainSha, '32c27a9a772cb62ff38f009c5fd1bb095ac27ad8')
assert.equal(phase12.deployedSha, phase12.expectedMainSha)
assert.equal(phase12.deployment.matchesExpected, true)
assert.equal(phase12.counts.htmlRoutes, 25)
assert.equal(phase12.counts.statusApis, 2)
assert.equal(phase12.counts.sitemapRoutes, 21)
assert.equal(phase12.counts.launchAssets, 6)
assert.equal(phase12.counts.blockingAlerts, 0)
assert.equal(phase12.failures.length, 0)
assert.equal(phase12.nextWorkstream, 'Phase 12A Analytics Capture Foundation')
assert.equal(phase12.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(phase12.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(phase12.providers.twitch.isStale, false)
assert.equal(phase12.providers.kick.isFresh, true)
assert.equal(phase12.providers.kick.isStale, false)
assert.equal(phase12.monitoring.twitchCapacity, 'at-or-over-window')
assert.equal(phase12.monitoring.kickCapacity, 'at-or-over-window')

const baseline = json('docs/audits/12a0-current-data-capacity-baseline.json')
assert.equal(baseline.schemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(baseline.workstream, '12A-0 current data and capacity baseline')
assert.equal(baseline.providerSeparated, true)
assert.equal(baseline.runtimeChanged, false)
assert.equal(baseline.acceptance.status, 'accepted')
assert.equal(baseline.providers.twitch.storage.binding, 'DB_TWITCH_HOT')
assert.equal(baseline.providers.kick.storage.binding, 'DB_KICK_HOT')
assert.equal(baseline.providers.twitch.storage.rawRows, 8688)
assert.equal(baseline.providers.kick.storage.rawRows, 14442)
assert.equal(baseline.providers.twitch.collection.cadenceRatio, 0.9965)
assert.equal(baseline.providers.kick.collection.cadenceRatio, 0.9965)
assert.equal(baseline.providers.twitch.storage.dailyRollupObservedDays, 74)
assert.equal(baseline.providers.kick.storage.dailyRollupObservedDays, 52)
assert.match(baseline.budgets.decisionBoundary, /No 12A-2 migration is authorized/)

const closeout = json('docs/audits/12a0-closeout.json')
assert.equal(closeout.status, 'complete')
assert.equal(closeout.result, 'pass')
assert.equal(closeout.completedMainSha, 'b2d5d88c251d40b59338ef53dac2917aef45e9d0')
assert.equal(closeout.implementationPr, 490)
assert.equal(closeout.completionRules.permanentMachineReadableBaselineEvidenceExists, true)
assert.equal(closeout.completionRules.storageBudgetsRecorded, true)
assert.equal(closeout.completionRules.queryBudgetsRecorded, true)
assert.equal(closeout.completionRules.providerSeparated, true)
assert.equal(closeout.completionRules.runtimeChangeIncluded, false)
assert.equal(closeout.decisionBoundaries.migrationAuthorizedBy12A0Alone, false)
assert.equal(closeout.nextWorkstream, '12A-1 analytics field contract')
assert.equal(closeout.nextBranch, 'work-analytics-12a1-field-contract')
assert.equal(closeout.nextBranchCreated, false)

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.active_program, 'Phase 12A Analytics Capture Foundation')
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

check('docs/product/analytics-observation-system-plan.md', [
  '12A-0 — current data and capacity baseline',
  'permanent machine-readable baseline evidence exists',
  'no runtime change is included',
  '12A-1 — analytics field contract',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
])

console.log('Development and documentation policy verification passed.')
console.log('- Phase 12 exact-SHA production acceptance is complete')
console.log('- Phase 12A Analytics Capture Foundation is active')
console.log('- 12A-0 current data and capacity baseline is complete PR #490')
console.log('- 12A-0 permanent baseline and closeout evidence are present')
console.log('- current workstream is 12A-1 analytics field contract')
console.log('- exact next branch is work-analytics-12a1-field-contract and remains uncreated')
console.log('- 12A-1 does not authorize 12A-2 migration or analytics runtime')
console.log('- Twitch and Kick remain provider-separated')
