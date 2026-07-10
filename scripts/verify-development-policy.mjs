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
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md',
  'docs/operations/12a0-closeout-2026-07-10.md',
  'docs/operations/12a1-field-contract-acceptance-2026-07-10.md',
  'docs/operations/12a1-closeout-2026-07-10.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/analytics-field-contract-v1.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/audits/phase12-production-closeout-contract.json',
  'docs/audits/12a0-current-data-capacity-baseline.json',
  'docs/audits/12a0-closeout.json',
  'docs/audits/12a1-analytics-field-contract.json',
  'docs/audits/12a1-source-evidence.json',
  'docs/audits/12a1-closeout.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'scripts/verify-12a1-field-contract.mjs',
  'scripts/verify-phase12-release-acceptance.mjs',
  'scripts/verify-public-surface-inventory.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a1-field-contract.yml',
  '.github/workflows/analytics-12a1-no-runtime-change.yml',
]
for (const path of required) assert.equal(exists(path), true, `missing file: ${path}`)

for (const asset of [
  'viewloom-desktop.png',
  'viewloom-mobile.png',
  'twitch-heatmap.png',
  'twitch-day-flow.png',
  'twitch-battle-lines.png',
  'twitch-history.png',
]) assert.equal(exists(`apps/web/public/launch-assets/${asset}`), true, `missing launch asset: ${asset}`)

for (const retired of [
  'docs/work-in-progress/phase11-acceptance-operations.md',
  'docs/work-in-progress/phase12-release-readiness.md',
  'docs/work-in-progress/phase12a0-capacity-baseline.md',
  'docs/work-in-progress/phase12a1-field-contract.md',
  '.github/workflows/phase11-hosted-closeout-acceptance.yml',
  '.github/workflows/release-r12a-production-closeout.yml',
  '.github/workflows/release-phase12-production-closeout.yml',
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
    'Phase 12A Analytics Capture Foundation',
    '12A-0 current data and capacity baseline',
    '12A-1 analytics field contract',
    '12A-2 compact intraday rollup design',
    'work-analytics-12a2-intraday-rollup-design',
  ])
}

check('AGENTS.md', [
  'Current phase: Phase 12A Analytics Capture Foundation',
  '12A-0 current data and capacity baseline: complete PR #490',
  '12A-1 analytics field contract: complete PR #492',
  'Current workstream: 12A-2 compact intraday rollup design and migration',
  'Exact next implementation branch: work-analytics-12a2-intraday-rollup-design',
  'Next branch created: no',
  '12A-2 must not perform migration before budget acceptance.',
])

check('CONTRIBUTING.md', [
  'Current phase: Phase 12A Analytics Capture Foundation',
  '12A-1 analytics field contract: complete PR #492',
  'Current workstream: 12A-2 compact intraday rollup design and migration',
  'Exact next implementation branch: work-analytics-12a2-intraday-rollup-design',
  'Next branch created: no',
  '12A-2 designs and budgets provider-separated compact intraday storage before migration.',
])

const phase12 = json('docs/audits/phase12-release-acceptance.json')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.expectedMainSha, phase12.deployedSha)
assert.equal(phase12.counts.htmlRoutes, 25)
assert.equal(phase12.counts.statusApis, 2)
assert.equal(phase12.counts.sitemapRoutes, 21)
assert.equal(phase12.counts.launchAssets, 6)
assert.equal(phase12.counts.blockingAlerts, 0)
assert.equal(phase12.failures.length, 0)
assert.equal(phase12.nextWorkstream, 'Phase 12A Analytics Capture Foundation')
assert.equal(phase12.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(phase12.providers.kick.binding, 'DB_KICK_HOT')

const baseline = json('docs/audits/12a0-current-data-capacity-baseline.json')
assert.equal(baseline.schemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(baseline.workstream, '12A-0 current data and capacity baseline')
assert.equal(baseline.providerSeparated, true)
assert.equal(baseline.runtimeChanged, false)
assert.equal(baseline.acceptance.status, 'accepted')
assert.equal(baseline.providers.twitch.storage.rawRows, 8688)
assert.equal(baseline.providers.kick.storage.rawRows, 14442)
assert.equal(baseline.providers.twitch.storage.estimatedPayloadMbPerDay, 10.38)
assert.equal(baseline.providers.kick.storage.estimatedPayloadMbPerDay, 4.63)
assert.equal(baseline.providers.twitch.storage.dailyRollupObservedDays, 74)
assert.equal(baseline.providers.kick.storage.dailyRollupObservedDays, 52)
assert.match(baseline.budgets.decisionBoundary, /No 12A-2 migration is authorized/)

const closeout12a0 = json('docs/audits/12a0-closeout.json')
assert.equal(closeout12a0.status, 'complete')
assert.equal(closeout12a0.result, 'pass')
assert.equal(closeout12a0.implementationPr, 490)
assert.equal(closeout12a0.completionRules.providerSeparated, true)
assert.equal(closeout12a0.completionRules.runtimeChangeIncluded, false)

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.schemaVersion, 'viewloom-analytics-field-contract-v1')
assert.equal(fieldContract.workstream, '12A-1 analytics field contract')
assert.equal(fieldContract.contractVersion, 'analytics-source-v1')
assert.equal(fieldContract.providerSeparated, true)
assert.equal(fieldContract.migrationIncluded, false)
assert.equal(fieldContract.runtimeCaptureChangeIncluded, false)
assert.equal(fieldContract.purposes.observedRun.twitch.providerStartedAt.retentionDecision, 'approved_for_future_capture')
assert.equal(fieldContract.purposes.observedRun.twitch.providerStartedAt.evidenceStrength, 'provider_reported_start_time')
assert.equal(fieldContract.purposes.observedRun.kick.providerStartedAt.availability, 'unavailable')
assert.equal(fieldContract.purposes.category.twitch.captureApproved, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)
assert.equal(fieldContract.completion.migrationPerformed, false)
assert.equal(fieldContract.completion.runtimeCaptureChanged, false)

const sourceEvidence = json('docs/audits/12a1-source-evidence.json')
assert.equal(sourceEvidence.providers.twitch.startedAt.futureRetentionDecision, 'approved')
assert.equal(sourceEvidence.providers.twitch.startedAt.evidenceStrength, 'provider_reported_start_time')
assert.equal(sourceEvidence.providers.kick.startedAt.futureRetentionDecision, 'unapproved')
assert.equal(sourceEvidence.providers.kick.category.captureApproved, false)
assert.equal(sourceEvidence.crossProviderIdentity.categoryIdentityEquivalenceAllowed, false)

const closeout12a1 = json('docs/audits/12a1-closeout.json')
assert.equal(closeout12a1.status, 'complete')
assert.equal(closeout12a1.result, 'pass')
assert.equal(closeout12a1.implementationPr, 492)
assert.equal(closeout12a1.completedMainSha, '8878c0da1e32e60ee15697bbcc1f445888a65c59')
assert.equal(closeout12a1.completionRules.providerSpecificFieldContractsExist, true)
assert.equal(closeout12a1.completionRules.fieldProvenanceExplicit, true)
assert.equal(closeout12a1.completionRules.unsupportedFieldsExplicit, true)
assert.equal(closeout12a1.completionRules.sourceContractsVersioned, true)
assert.equal(closeout12a1.completionRules.migrationPerformed, false)
assert.equal(closeout12a1.completionRules.runtimeCaptureChanged, false)
assert.equal(closeout12a1.nextWorkstream, '12A-2 compact intraday rollup design and migration')
assert.equal(closeout12a1.nextBranch, 'work-analytics-12a2-intraday-rollup-design')
assert.equal(closeout12a1.nextBranchCreated, false)
assert.equal(closeout12a1.nextEntryGate.providerSeparatedBudgetingRequired, true)
assert.equal(closeout12a1.nextEntryGate.rowCountEstimateRequired, true)
assert.equal(closeout12a1.nextEntryGate.bytesPerDayEstimateRequired, true)
assert.equal(closeout12a1.nextEntryGate.retainedSizeEstimateRequired, true)
assert.equal(closeout12a1.nextEntryGate.indexCostEstimateRequired, true)
assert.equal(closeout12a1.nextEntryGate.queryCostEstimateRequired, true)
assert.equal(closeout12a1.nextEntryGate.rawRetentionExtensionAllowed, false)
assert.equal(closeout12a1.nextEntryGate.migrationAuthorizedBeforeBudgetAcceptance, false)

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.active_program, 'Phase 12A Analytics Capture Foundation')
assert.equal(inventory.counts.vite_html_inputs, 25)
assert.equal(inventory.counts.inventory_entries, 26)
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = json('docs/audits/public-surface-gaps.json')
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)

check('docs/product/analytics-observation-system-plan.md', [
  '12A-0 — current data and capacity baseline',
  '12A-1 — analytics field contract',
  '12A-2 — compact intraday rollup design and migration',
  'Phase 15 — Analytics Capability and Calibration Audit',
  'Phase 16A — Baseline Engine',
  'Phase 16F — Replay and Backtest',
])

console.log('Development and documentation policy verification passed.')
console.log('- Phase 12A Analytics Capture Foundation is active')
console.log('- 12A-0 current data and capacity baseline is complete PR #490')
console.log('- 12A-1 analytics field contract is complete PR #492')
console.log('- 12A-1 permanent contract and closeout evidence are present')
console.log('- current workstream is 12A-2 compact intraday rollup design and migration')
console.log('- exact next branch is work-analytics-12a2-intraday-rollup-design and remains uncreated')
console.log('- migration remains blocked until provider-specific budgets are accepted')
console.log('- Twitch and Kick remain provider-separated')
