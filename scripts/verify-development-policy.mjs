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
  'docs/operations/phase12-release-acceptance-2026-07-09.md',
  'docs/operations/12a0-current-data-capacity-baseline-acceptance-2026-07-10.md',
  'docs/operations/12a0-closeout-2026-07-10.md',
  'docs/operations/12a1-field-contract-acceptance-2026-07-10.md',
  'docs/operations/12a1-closeout-2026-07-10.md',
  'docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md',
  'docs/operations/12a2-remote-d1-size-gate-blocked-2026-07-11.md',
  'docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/next-feature-data-capability-audit.md',
  'docs/product/analytics-field-contract-v1.md',
  'docs/product/intraday-rollup-design-v1.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/audits/phase12-production-closeout-contract.json',
  'docs/audits/12a0-current-data-capacity-baseline.json',
  'docs/audits/12a1-analytics-field-contract.json',
  'docs/audits/12a1-source-evidence.json',
  'docs/audits/12a2-intraday-rollup-design-contract.json',
  'docs/audits/12a2-intraday-rollup-budget-evidence.json',
  'docs/audits/12a2-remote-d1-size-evidence.json',
  'docs/audits/12a2-binding-size-production-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'scripts/verify-12a1-field-contract.mjs',
  'scripts/verify-12a2-intraday-rollup-design.mjs',
  'scripts/verify-12a2-remote-d1-size-evidence.mjs',
  'scripts/verify-12a2-binding-size-production-evidence.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a1-field-contract.yml',
  '.github/workflows/analytics-12a2-rollup-design.yml',
  '.github/workflows/analytics-12a2-remote-d1-size-gate.yml',
  '.github/workflows/analytics-12a2-binding-size-production.yml',
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
  'docs/work-in-progress/phase12a2-intraday-rollup-design.md',
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
    '12A-0',
    '12A-1',
    '12A-2',
    'work-analytics-12a2-migration',
    'account_aggregate_storage_unmeasured',
  ])
}

check('AGENTS.md', [
  '12A-0 current data and capacity baseline: complete PR #490',
  '12A-1 analytics field contract: complete PR #492',
  '12A-2 rollup design budget: accepted PR #494',
  '12A-2 binding size source: merged PR #497',
  '12A-2 production size evidence: accepted PR #498',
  'Current workstream: 12A-2 empty schema migration',
  'Schema migration authorized: yes',
  '12A-3 generation authorized: no',
])

check('CONTRIBUTING.md', [
  '12A-2 production size evidence accepted PR #498',
  'Current workstream 12A-2 empty schema migration',
  'Schema migration authorized yes',
  'schemaMigrationGatePass true',
  'generationStorageGatePass false',
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
assert.equal(phase12.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(phase12.providers.kick.binding, 'DB_KICK_HOT')

const baseline = json('docs/audits/12a0-current-data-capacity-baseline.json')
assert.equal(baseline.schemaVersion, 'viewloom-12a0-capacity-baseline-v1')
assert.equal(baseline.providerSeparated, true)
assert.equal(baseline.runtimeChanged, false)
assert.equal(baseline.acceptance.status, 'accepted')
assert.equal(baseline.providers.twitch.storage.rawRows, 8688)
assert.equal(baseline.providers.kick.storage.rawRows, 14442)
assert.equal(baseline.providers.twitch.storage.estimatedPayloadMbPerDay, 10.38)
assert.equal(baseline.providers.kick.storage.estimatedPayloadMbPerDay, 4.63)

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.schemaVersion, 'viewloom-analytics-field-contract-v1')
assert.equal(fieldContract.contractVersion, 'analytics-source-v1')
assert.equal(fieldContract.providerSeparated, true)
assert.equal(fieldContract.migrationIncluded, false)
assert.equal(fieldContract.runtimeCaptureChangeIncluded, false)
assert.equal(fieldContract.purposes.observedRun.twitch.providerStartedAt.evidenceStrength, 'provider_reported_start_time')
assert.equal(fieldContract.purposes.observedRun.kick.providerStartedAt.availability, 'unavailable')
assert.equal(fieldContract.purposes.category.twitch.captureApproved, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)

const design = json('docs/audits/12a2-intraday-rollup-design-contract.json')
assert.equal(design.schemaVersion, 'viewloom-12a2-intraday-rollup-design-v1')
assert.equal(design.providerSeparated, true)
assert.equal(design.designOnly, true)
assert.equal(design.migrationIncluded, false)
assert.equal(design.model.grain, 'provider x day x streamer')
assert.equal(design.selection.twitch.retainedStreamerCapPerDay, 600)
assert.equal(design.selection.kick.retainedStreamerCapPerDay, 200)
assert.equal(design.retention.intradayDays, 90)
assert.equal(design.refresh.newCronRequired, false)
assert.equal(design.retention.rawRetentionChanged, false)

const budget = json('docs/audits/12a2-intraday-rollup-budget-evidence.json')
assert.equal(budget.schemaVersion, 'viewloom-12a2-intraday-rollup-budget-v1')
assert.equal(budget.providers.twitch.totalMeasuredBytesPerRollupRow, 1148.83)
assert.equal(budget.providers.twitch.projectedStorageMb90dWithSafety, 70.99)
assert.equal(budget.providers.kick.totalMeasuredBytesPerRollupRow, 1143.95)
assert.equal(budget.providers.kick.projectedStorageMb90dWithSafety, 23.57)
assert.equal(budget.acceptance.migrationAuthorized, false)
assert.equal(budget.acceptance.remoteDatabaseSizeEvidenceRequiredBeforeApply, true)

const legacyRemote = json('docs/audits/12a2-remote-d1-size-evidence.json')
assert.equal(legacyRemote.status, 'blocked')
assert.equal(legacyRemote.blocker.code, 'cloudflare_credentials_missing')
assert.equal(legacyRemote.gate.migrationStorageGatePass, false)
assert.equal(legacyRemote.privacy.secretsIncluded, false)

const productionSize = json('docs/audits/12a2-binding-size-production-evidence.json')
assert.equal(productionSize.schemaVersion, 'viewloom-12a2-binding-size-production-evidence-v1')
assert.equal(productionSize.source.evidenceField, 'D1Result.meta.size_after')
assert.equal(productionSize.providers.twitch.currentSizeMb, 320.96)
assert.equal(productionSize.providers.twitch.projectedSizeMbWithSafety, 391.95)
assert.equal(productionSize.providers.twitch.providerMigrationGatePass, true)
assert.equal(productionSize.providers.twitch.auditQuery.rowsWritten, 0)
assert.equal(productionSize.providers.kick.currentSizeMb, 264.38)
assert.equal(productionSize.providers.kick.projectedSizeMbWithSafety, 287.95)
assert.equal(productionSize.providers.kick.providerMigrationGatePass, true)
assert.equal(productionSize.providers.kick.auditQuery.rowsWritten, 0)
assert.equal(productionSize.gate.schemaMigrationGatePass, true)
assert.equal(productionSize.gate.accountAggregateMeasured, false)
assert.equal(productionSize.gate.generationStorageGatePass, false)
assert.equal(productionSize.gate.generationAuthorizedByThisEvidenceAlone, false)
assert.equal(productionSize.boundary.migrationAppliesData, false)
assert.equal(productionSize.boundary.migrationStartsGeneration, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v2')
assert.equal(state.status, 'schema_migration_authorized_generation_blocked')
assert.equal(state.design.status, 'accepted')
assert.equal(state.bindingSizeGate.status, 'accepted')
assert.equal(state.bindingSizeGate.schemaMigrationGatePass, true)
assert.equal(state.bindingSizeGate.accountAggregateMeasured, false)
assert.equal(state.bindingSizeGate.generationStorageGatePass, false)
assert.equal(state.migration.status, 'authorized_not_started')
assert.equal(state.migration.authorized, true)
assert.equal(state.migration.nextBranch, 'work-analytics-12a2-migration')
assert.equal(state.migration.schemaApplied, false)
assert.equal(state.migration.dataBackfillAllowed, false)
assert.equal(state.migration.runtimeGenerationStarted, false)
assert.equal(state.generation.status, 'blocked')
assert.equal(state.generation.authorized, false)
assert.equal(state.generation.blocker, 'account_aggregate_storage_unmeasured')
assert.equal(state.legacyControlPlaneGate.status, 'blocked')
assert.equal(state.legacyControlPlaneGate.supersededForProviderSchemaGate, true)

const inventory = json('docs/audits/public-surface-inventory.json')
assert.equal(inventory.active_program, 'Phase 12A Analytics Capture Foundation')
assert.equal(inventory.provider_invariants.twitch_binding, 'DB_TWITCH_HOT')
assert.equal(inventory.provider_invariants.kick_binding, 'DB_KICK_HOT')
assert.equal(inventory.provider_invariants.combined_totals_allowed, false)
assert.equal(inventory.provider_invariants.combined_rankings_allowed, false)

const gaps = json('docs/audits/public-surface-gaps.json')
assert.equal(gaps.missing_surfaces.length, 0)
assert.equal(gaps.candidate_surfaces.length, 0)

console.log('Development and documentation policy verification passed.')
console.log('- Phase 12A Analytics Capture Foundation is active')
console.log('- 12A-0 baseline complete PR #490')
console.log('- 12A-1 field contract complete PR #492')
console.log('- 12A-2 design budget accepted PR #494')
console.log('- 12A-2 binding size source merged PR #497')
console.log('- 12A-2 production size evidence accepted PR #498')
console.log('- schema migration gate passed; work-analytics-12a2-migration is next')
console.log('- 12A-3 generation remains blocked by account_aggregate_storage_unmeasured')
console.log('- Twitch and Kick remain provider-separated')
