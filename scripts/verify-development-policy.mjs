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
  'docs/operations/12a2-intraday-rollup-design-acceptance-2026-07-11.md',
  'docs/operations/12a2-binding-size-production-acceptance-2026-07-11.md',
  'docs/operations/12a2-migration-acceptance-2026-07-11.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/product/intraday-rollup-design-v1.md',
  'docs/audits/phase12-release-acceptance.json',
  'docs/audits/12a0-current-data-capacity-baseline.json',
  'docs/audits/12a1-analytics-field-contract.json',
  'docs/audits/12a1-source-evidence.json',
  'docs/audits/12a2-intraday-rollup-design-contract.json',
  'docs/audits/12a2-intraday-rollup-budget-evidence.json',
  'docs/audits/12a2-binding-size-production-evidence.json',
  'docs/audits/12a2-migration-acceptance.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'db/d1/004_intraday_rollups.sql',
  'scripts/verify-12a2-intraday-migration.mjs',
  'scripts/verify-12a2-migration-acceptance.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a2-migration.yml',
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
  'docs/work-in-progress/phase12a2-binding-size-gate.md',
  'docs/work-in-progress/phase12a2-migration.md',
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
    '12A-2',
    'PR #499',
    'remote_schema_apply_unverified',
    'account_aggregate_storage_unmeasured',
  ])
}

check('AGENTS.md', [
  '12A-2 repository migration: accepted PR #499',
  'Remote D1 schema apply: unverified',
  '12A-3 generation authorized: no',
])

check('CONTRIBUTING.md', [
  '12A-2 repository migration accepted PR #499',
  'Remote D1 schema apply unverified',
  '12A-3 generation authorized no',
])

const phase12 = json('docs/audits/phase12-release-acceptance.json')
assert.equal(phase12.status, 'complete')
assert.equal(phase12.result, 'pass')
assert.equal(phase12.expectedMainSha, phase12.deployedSha)
assert.equal(phase12.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(phase12.providers.kick.binding, 'DB_KICK_HOT')

const baseline = json('docs/audits/12a0-current-data-capacity-baseline.json')
assert.equal(baseline.providerSeparated, true)
assert.equal(baseline.runtimeChanged, false)
assert.equal(baseline.acceptance.status, 'accepted')

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.providerSeparated, true)
assert.equal(fieldContract.migrationIncluded, false)
assert.equal(fieldContract.runtimeCaptureChangeIncluded, false)
assert.equal(fieldContract.purposes.category.twitch.captureApproved, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)

const design = json('docs/audits/12a2-intraday-rollup-design-contract.json')
assert.equal(design.providerSeparated, true)
assert.equal(design.model.grain, 'provider x day x streamer')
assert.equal(design.selection.twitch.retainedStreamerCapPerDay, 600)
assert.equal(design.selection.kick.retainedStreamerCapPerDay, 200)
assert.equal(design.retention.intradayDays, 90)
assert.equal(design.refresh.newCronRequired, false)
assert.equal(design.retention.rawRetentionChanged, false)

const budget = json('docs/audits/12a2-intraday-rollup-budget-evidence.json')
assert.equal(budget.providers.twitch.projectedStorageMb90dWithSafety, 70.99)
assert.equal(budget.providers.kick.projectedStorageMb90dWithSafety, 23.57)
assert.equal(budget.acceptance.remoteDatabaseSizeEvidenceRequiredBeforeApply, true)

const productionSize = json('docs/audits/12a2-binding-size-production-evidence.json')
assert.equal(productionSize.providers.twitch.currentSizeMb, 320.96)
assert.equal(productionSize.providers.twitch.projectedSizeMbWithSafety, 391.95)
assert.equal(productionSize.providers.twitch.providerMigrationGatePass, true)
assert.equal(productionSize.providers.kick.currentSizeMb, 264.38)
assert.equal(productionSize.providers.kick.projectedSizeMbWithSafety, 287.95)
assert.equal(productionSize.providers.kick.providerMigrationGatePass, true)
assert.equal(productionSize.gate.schemaMigrationGatePass, true)
assert.equal(productionSize.gate.accountAggregateMeasured, false)
assert.equal(productionSize.gate.generationStorageGatePass, false)

const migration = json('docs/audits/12a2-migration-acceptance.json')
assert.equal(migration.schemaVersion, 'viewloom-12a2-migration-acceptance-v1')
assert.equal(migration.status, 'accepted')
assert.equal(migration.result, 'pass')
assert.equal(migration.schemaOnly, true)
assert.equal(migration.providerSeparated, true)
assert.equal(migration.migrationFile, 'db/d1/004_intraday_rollups.sql')
assert.equal(migration.verification.scopeGuardPass, true)
assert.equal(migration.verification.localApplyPass, true)
assert.equal(migration.verification.secondApplyIdempotencyPass, true)
assert.equal(migration.verification.emptyAfterApply, true)
assert.equal(migration.verification.forbiddenDmlAbsent, true)
assert.equal(migration.backfillIncluded, false)
assert.equal(migration.runtimeGenerationIncluded, false)
assert.equal(migration.generationAuthorized, false)
assert.equal(migration.remoteSchemaApplied, false)
assert.equal(migration.remoteApplyEvidencePresent, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v3')
assert.equal(state.status, 'repository_migration_accepted_remote_apply_unverified_generation_blocked')
assert.equal(state.migration.status, 'repository_accepted_remote_apply_unverified')
assert.equal(state.migration.authorized, true)
assert.equal(state.migration.pr, 499)
assert.equal(state.migration.localApplyVerified, true)
assert.equal(state.migration.idempotencyVerified, true)
assert.equal(state.migration.remoteSchemaApplied, false)
assert.equal(state.migration.remoteApplyEvidencePresent, false)
assert.equal(state.migration.dataBackfillAllowed, false)
assert.equal(state.migration.runtimeGenerationStarted, false)
assert.equal(state.generation.status, 'blocked')
assert.equal(state.generation.authorized, false)
assert.deepEqual(state.generation.blockers, [
  'account_aggregate_storage_unmeasured',
  'remote_schema_apply_unverified',
])

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
console.log('- Phase 12A remains active')
console.log('- 12A-2 repository migration accepted PR #499')
console.log('- remote D1 schema apply remains unverified')
console.log('- 12A-3 generation remains blocked')
console.log('- generation blockers: remote schema apply and account aggregate storage')
console.log('- Twitch and Kick remain provider-separated')
