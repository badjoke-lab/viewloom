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
  'docs/operations/12a2-remote-schema-production-blocked-2026-07-11.md',
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
  'docs/audits/12a2-remote-schema-probe-contract.json',
  'docs/audits/12a2-remote-schema-production-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'db/d1/004_intraday_rollups.sql',
  'apps/web/functions/api/schema-audit.ts',
  'scripts/verify-12a2-remote-schema-probe.mjs',
  'scripts/verify-12a2-remote-schema-production-evidence.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a2-remote-schema-probe.yml',
  '.github/workflows/analytics-12a2-remote-schema-production.yml',
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
  'docs/work-in-progress/phase12a2-remote-schema-probe.md',
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
    'PR #501',
    'remote_schema_not_applied',
    'account_aggregate_storage_unmeasured',
  ])
}

check('AGENTS.md', [
  '12A-2 repository migration: accepted PR #499',
  '12A-2 remote schema evidence: observed PR #501',
  'Twitch remote schema objects: 0 / 3',
  'Kick remote schema objects: 0 / 3',
  'Current workstream: controlled remote schema apply and verification',
  '12A-3 generation authorized: no',
])

check('CONTRIBUTING.md', [
  '12A-2 repository migration accepted PR #499',
  '12A-2 remote schema evidence observed PR #501',
  'Remote schema gate blocked',
  'Current workstream controlled remote schema apply and verification',
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

const probeContract = json('docs/audits/12a2-remote-schema-probe-contract.json')
assert.equal(probeContract.readOnly, true)
assert.equal(probeContract.providerSeparated, true)
assert.equal(probeContract.queriesPerProvider, 1)
assert.equal(probeContract.querySource, 'sqlite_master')
assert.equal(probeContract.rawSqlReturned, false)
assert.equal(probeContract.scope.migrationApplyIncluded, false)
assert.equal(probeContract.scope.generationIncluded, false)

const remoteSchema = json('docs/audits/12a2-remote-schema-production-evidence.json')
assert.equal(remoteSchema.schemaVersion, 'viewloom-12a2-remote-schema-production-evidence-v1')
assert.equal(remoteSchema.source.readOnly, true)
assert.equal(remoteSchema.providers.twitch.schemaComplete, false)
assert.equal(remoteSchema.providers.twitch.observedObjectCount, 0)
assert.equal(remoteSchema.providers.twitch.expectedObjectCount, 3)
assert.equal(remoteSchema.providers.twitch.auditQuery.rowsWritten, 0)
assert.equal(remoteSchema.providers.kick.schemaComplete, false)
assert.equal(remoteSchema.providers.kick.observedObjectCount, 0)
assert.equal(remoteSchema.providers.kick.expectedObjectCount, 3)
assert.equal(remoteSchema.providers.kick.auditQuery.rowsWritten, 0)
assert.equal(remoteSchema.gate.remoteSchemaGatePass, false)
assert.deepEqual(remoteSchema.gate.blockers, [
  'remote_schema_not_applied',
  'account_aggregate_storage_unmeasured',
])
assert.equal(remoteSchema.boundary.migrationApplyPerformedByProbe, false)
assert.equal(remoteSchema.boundary.backfillPerformedByProbe, false)
assert.equal(remoteSchema.boundary.generationStartedByProbe, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v4')
assert.equal(state.status, 'remote_schema_absent_generation_blocked')
assert.equal(state.repositoryMigration.status, 'accepted')
assert.equal(state.repositoryMigration.pr, 499)
assert.equal(state.remoteSchemaProbe.status, 'observed_absent')
assert.equal(state.remoteSchemaProbe.twitchObservedObjects, 0)
assert.equal(state.remoteSchemaProbe.twitchExpectedObjects, 3)
assert.equal(state.remoteSchemaProbe.twitchSchemaComplete, false)
assert.equal(state.remoteSchemaProbe.kickObservedObjects, 0)
assert.equal(state.remoteSchemaProbe.kickExpectedObjects, 3)
assert.equal(state.remoteSchemaProbe.kickSchemaComplete, false)
assert.equal(state.remoteSchemaProbe.remoteSchemaGatePass, false)
assert.equal(state.remoteSchemaProbe.probeRowsWritten, 0)
assert.equal(state.remoteApply.status, 'required')
assert.equal(state.remoteApply.providerSeparated, true)
assert.equal(state.remoteApply.idempotentApplyRequired, true)
assert.equal(state.remoteApply.generationMustRemainDisabledDuringApply, true)
assert.equal(state.generation.status, 'blocked')
assert.equal(state.generation.authorized, false)
assert.deepEqual(state.generation.blockers, [
  'remote_schema_not_applied',
  'account_aggregate_storage_unmeasured',
])
assert.equal(state.nextWorkstream, '12A-2 controlled remote schema apply and verification')

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
console.log('- remote schema evidence observed PR #501')
console.log('- Twitch and Kick remote schema objects: 0 / 3 each')
console.log('- controlled provider-separated remote apply is current')
console.log('- 12A-3 generation remains blocked')
console.log('- generation blockers: remote schema not applied and account aggregate storage unmeasured')
console.log('- Twitch and Kick remain provider-separated')
