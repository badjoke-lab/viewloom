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
  'docs/operations/12a2-remote-schema-production-recheck-2026-07-11.md',
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
  'docs/audits/12a2-remote-schema-post-bootstrap-recheck.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a2-controlled-remote-apply-contract.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'db/d1/004_intraday_rollups.sql',
  'apps/web/functions/api/schema-audit.ts',
  'workers/shared/intraday-schema.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'scripts/verify-12a2-remote-schema-probe.mjs',
  'scripts/verify-12a2-remote-schema-production-evidence.mjs',
  'scripts/verify-12a2-controlled-remote-apply.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a2-remote-schema-probe.yml',
  '.github/workflows/analytics-12a2-remote-schema-production.yml',
  '.github/workflows/analytics-12a2-controlled-remote-apply.yml',
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
  'docs/work-in-progress/phase12a2-controlled-remote-apply.md',
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
    'PR #504',
    'remote_schema_not_applied',
    'collector_worker_deployment_not_evidenced',
    'account_aggregate_storage_unmeasured',
  ])
}

check('AGENTS.md', [
  '12A-2 controlled apply code: merged PR #502',
  '12A-2 immediate bootstrap refinement: merged PR #503',
  '12A-2 post-bootstrap recheck: observed PR #504',
  'Twitch remote schema objects: 0 / 3',
  'Kick remote schema objects: 0 / 3',
  'Worker deployment evidence: absent',
  'Current workstream: collector Worker deployment evidence and remote schema verification',
  '12A-3 generation authorized: no',
])

check('CONTRIBUTING.md', [
  '12A-2 controlled apply code merged PR #502',
  '12A-2 immediate bootstrap refinement merged PR #503',
  '12A-2 post-bootstrap recheck observed PR #504',
  'Worker deployment evidence absent',
  'Current workstream collector Worker deployment evidence and remote schema verification',
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
assert.equal(migration.backfillIncluded, false)
assert.equal(migration.runtimeGenerationIncluded, false)
assert.equal(migration.generationAuthorized, false)

const controlled = json('docs/audits/12a2-controlled-remote-apply-contract.json')
assert.equal(controlled.schemaVersion, 'viewloom-12a2-controlled-remote-apply-contract-v2')
assert.equal(controlled.providerSeparated, true)
assert.equal(controlled.schedule.newCronAdded, false)
assert.equal(controlled.schedule.startupBootstrapEnabled, true)
assert.equal(controlled.schedule.maximumStartupAttemptsPerWorkerIsolate, 1)
assert.equal(controlled.bootstrap.ddlMustMatchAcceptedMigration, true)
assert.equal(controlled.bootstrap.modulePresenceCache, true)
assert.equal(controlled.bootstrap.startupRetrySuppressedWithinSameIsolate, true)
assert.equal(controlled.bootstrap.maintenanceRetryAfterStartupFailure, true)
assert.equal(controlled.scope.backfillIncluded, false)
assert.equal(controlled.scope.generationIncluded, false)
assert.equal(controlled.deploymentBoundary.repositoryMergeDoesNotClaimWorkerDeployment, true)
assert.equal(controlled.deploymentBoundary.productionSchemaEvidenceRequiredAfterDeploy, true)

const initialRemote = json('docs/audits/12a2-remote-schema-production-evidence.json')
assert.equal(initialRemote.providers.twitch.schemaComplete, false)
assert.equal(initialRemote.providers.twitch.observedObjectCount, 0)
assert.equal(initialRemote.providers.kick.schemaComplete, false)
assert.equal(initialRemote.providers.kick.observedObjectCount, 0)
assert.equal(initialRemote.gate.remoteSchemaGatePass, false)
assert.equal(initialRemote.providers.twitch.auditQuery.rowsWritten, 0)
assert.equal(initialRemote.providers.kick.auditQuery.rowsWritten, 0)

const recheck = json('docs/audits/12a2-remote-schema-post-bootstrap-recheck.json')
assert.equal(recheck.schemaVersion, 'viewloom-12a2-remote-schema-post-bootstrap-recheck-v1')
assert.equal(recheck.status, 'remote_schema_still_absent')
assert.equal(recheck.codeState.controlledApplyPr, 502)
assert.equal(recheck.codeState.immediateBootstrapPr, 503)
assert.equal(recheck.providers.twitch.schemaComplete, false)
assert.equal(recheck.providers.twitch.observedObjectCount, 0)
assert.equal(recheck.providers.twitch.rowsWritten, 0)
assert.equal(recheck.providers.kick.schemaComplete, false)
assert.equal(recheck.providers.kick.observedObjectCount, 0)
assert.equal(recheck.providers.kick.rowsWritten, 0)
assert.equal(recheck.gate.remoteSchemaGatePass, false)
assert.equal(recheck.gate.controlledApplyCodeMerged, true)
assert.equal(recheck.gate.workerDeploymentEvidencePresent, false)
assert.equal(recheck.gate.generationAuthorized, false)
assert.deepEqual(recheck.gate.blockers, [
  'remote_schema_not_applied',
  'collector_worker_deployment_not_evidenced',
  'account_aggregate_storage_unmeasured',
])
assert.equal(recheck.boundary.mergeClaimsWorkerDeployment, false)
assert.equal(recheck.boundary.recheckClaimsAutomaticDeploymentFailure, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v5')
assert.equal(state.status, 'controlled_apply_merged_remote_schema_absent_deployment_not_evidenced_generation_blocked')
assert.equal(state.repositoryMigration.status, 'accepted')
assert.equal(state.controlledApply.status, 'code_merged')
assert.equal(state.controlledApply.initialPr, 502)
assert.equal(state.controlledApply.immediateBootstrapPr, 503)
assert.equal(state.controlledApply.workerDeploymentEvidencePresent, false)
assert.equal(state.remoteSchemaProbe.recheckPr, 504)
assert.equal(state.remoteSchemaProbe.status, 'observed_absent_after_code_merge')
assert.equal(state.remoteSchemaProbe.twitchObservedObjects, 0)
assert.equal(state.remoteSchemaProbe.kickObservedObjects, 0)
assert.equal(state.remoteSchemaProbe.remoteSchemaGatePass, false)
assert.equal(state.deploymentBoundary.status, 'deployment_not_evidenced')
assert.equal(state.deploymentBoundary.repositoryDeployWorkflowIdentified, false)
assert.equal(state.deploymentBoundary.automaticDeployFailureClaimed, false)
assert.equal(state.generation.status, 'blocked')
assert.equal(state.generation.authorized, false)
assert.deepEqual(state.generation.blockers, [
  'remote_schema_not_applied',
  'collector_worker_deployment_not_evidenced',
  'account_aggregate_storage_unmeasured',
])
assert.equal(state.nextWorkstream, '12A-2 collector Worker deployment evidence and remote schema verification')

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
console.log('- controlled apply code merged through PR #503')
console.log('- post-bootstrap production recheck observed PR #504')
console.log('- Twitch and Kick remote schema objects remain 0 / 3')
console.log('- collector Worker deployment evidence is the current gate')
console.log('- 12A-3 generation remains blocked')
console.log('- Twitch and Kick remain provider-separated')
