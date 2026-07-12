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
  'docs/operations/12a2-collector-worker-deploy-acceptance-2026-07-12.md',
  'docs/operations/12a3-account-storage-acceptance-2026-07-12.md',
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
  'docs/audits/12a2-controlled-remote-apply-contract.json',
  'docs/audits/12a2-collector-worker-deploy-contract.json',
  'docs/audits/12a2-collector-worker-deploy-evidence.json',
  'docs/audits/12a3-account-storage-gate-contract.json',
  'docs/audits/12a3-account-storage-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/public-surface-inventory.json',
  'docs/audits/public-surface-gaps.json',
  'db/d1/004_intraday_rollups.sql',
  'apps/web/functions/api/schema-audit.ts',
  'workers/shared/intraday-schema.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'scripts/verify-12a2-controlled-remote-apply.mjs',
  'scripts/verify-12a2-collector-worker-deploy.mjs',
  'scripts/collect-12a3-account-storage-evidence.mjs',
  'scripts/verify-12a3-account-storage-evidence.mjs',
  '.github/workflows/development-policy.yml',
  '.github/workflows/analytics-12a2-controlled-remote-apply.yml',
  '.github/workflows/deploy-collector-workers.yml',
  '.github/workflows/analytics-12a3-account-storage-gate.yml',
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
  'docs/work-in-progress/phase12a2-collector-worker-deploy.md',
  'docs/work-in-progress/phase12a3-account-storage-gate.md',
  '.github/workflows/one-time-12a2-collector-deploy.yml',
  '.github/workflows/one-time-12a2-collector-deploy-cli.yml',
  '.github/workflows/one-time-12a3-d1-read-diagnostic.yml',
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
    'PR #506',
    'PR #507',
    '3 / 3',
    '8 / 8',
    'generation_execution_cost_unmeasured',
  ])
}

check('AGENTS.md', [
  '12A-2 collector deployment and remote schema: accepted PR #506',
  '12A-3 account storage gate: accepted PR #507',
  'Twitch remote schema objects: 3 / 3',
  'Kick remote schema objects: 3 / 3',
  'Account D1 databases measured: 8 / 8',
  'Generation storage gate: pass',
  'Current workstream: 12A-3 production execution-cost measurement and bounded generation dry run',
  '12A-3 generation authorized: no',
])

check('CONTRIBUTING.md', [
  '12A-2 collector deployment and remote schema accepted PR #506',
  '12A-3 account storage gate accepted PR #507',
  'Twitch remote schema objects 3 / 3',
  'Kick remote schema objects 3 / 3',
  'Account D1 databases measured 8 / 8',
  'Generation storage gate pass',
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
assert.equal(productionSize.providers.twitch.projectedSizeMbWithSafety, 391.95)
assert.equal(productionSize.providers.twitch.providerMigrationGatePass, true)
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
assert.equal(controlled.bootstrap.ddlMustMatchAcceptedMigration, true)
assert.equal(controlled.scope.backfillIncluded, false)
assert.equal(controlled.scope.generationIncluded, false)

const deployContract = json('docs/audits/12a2-collector-worker-deploy-contract.json')
assert.equal(deployContract.schemaVersion, 'viewloom-12a2-collector-worker-deploy-contract-v2')
assert.equal(deployContract.status, 'accepted')
assert.equal(deployContract.deploymentMethod, 'wrangler@4 CLI')
assert.equal(deployContract.triggers.pullRequestVerificationOnly, true)
assert.equal(deployContract.triggers.mainPushDeploy, true)
assert.equal(deployContract.triggers.manualDeploy, true)
assert.equal(deployContract.triggers.pullRequestDeploy, false)
assert.equal(deployContract.providers.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(deployContract.providers.kick.binding, 'DB_KICK_HOT')
assert.equal(deployContract.acceptedEvidence.workflowRunId, 29158855070)
assert.equal(deployContract.acceptedEvidence.twitchDeployPass, true)
assert.equal(deployContract.acceptedEvidence.kickDeployPass, true)
assert.equal(deployContract.acceptedEvidence.remoteSchemaGatePass, true)
assert.equal(deployContract.scope.directD1ExecuteIncluded, false)
assert.equal(deployContract.scope.backfillIncluded, false)
assert.equal(deployContract.scope.generationIncluded, false)
assert.equal(deployContract.scope.newCronAdded, false)

const deploy = json('docs/audits/12a2-collector-worker-deploy-evidence.json')
assert.equal(deploy.schemaVersion, 'viewloom-12a2-collector-worker-deploy-evidence-v1')
assert.equal(deploy.status, 'accepted')
assert.equal(deploy.result, 'pass')
assert.equal(deploy.acceptanceIdentity.workflowRunId, 29158855070)
assert.equal(deploy.acceptanceIdentity.artifactId, 8250263833)
assert.equal(deploy.deployment.method, 'wrangler@4 CLI')
assert.equal(deploy.deployment.cloudflareSecretsPresent, true)
assert.equal(deploy.deployment.secretValuesIncluded, false)
assert.equal(deploy.deployment.providerSeparated, true)
assert.equal(deploy.deployment.twitch.outcome, 'success')
assert.equal(deploy.deployment.twitch.exitCode, 0)
assert.equal(deploy.deployment.twitch.binding, 'DB_TWITCH_HOT')
assert.equal(deploy.deployment.kick.outcome, 'success')
assert.equal(deploy.deployment.kick.exitCode, 0)
assert.equal(deploy.deployment.kick.binding, 'DB_KICK_HOT')
assert.equal(deploy.remoteSchema.twitch.schemaComplete, true)
assert.equal(deploy.remoteSchema.twitch.observedObjectCount, 3)
assert.equal(deploy.remoteSchema.twitch.rowsWritten, 0)
assert.equal(deploy.remoteSchema.kick.schemaComplete, true)
assert.equal(deploy.remoteSchema.kick.observedObjectCount, 3)
assert.equal(deploy.remoteSchema.kick.rowsWritten, 0)
assert.equal(deploy.gate.workerDeploymentEvidencePresent, true)
assert.equal(deploy.gate.remoteSchemaGatePass, true)
assert.equal(deploy.boundary.directD1ExecuteUsed, false)
assert.equal(deploy.boundary.backfillPerformed, false)
assert.equal(deploy.boundary.rollupGenerationStarted, false)
assert.equal(deploy.boundary.newCronAdded, false)
assert.equal(deploy.boundary.crossProviderAnalyticsAdded, false)

const storageContract = json('docs/audits/12a3-account-storage-gate-contract.json')
assert.equal(storageContract.schemaVersion, 'viewloom-12a3-account-storage-gate-contract-v1')
assert.equal(storageContract.providerSeparated, true)
assert.equal(storageContract.platformLimits.maximumDatabaseMb, 500)
assert.equal(storageContract.platformLimits.maximumAccountStorageMb, 5120)
assert.equal(storageContract.platformLimits.perDatabaseOperationalCeilingMb, 450)
assert.equal(storageContract.platformLimits.accountOperationalCeilingMb, 4608)
assert.equal(storageContract.acceptedSafeRollupProjectionMb.twitch, 70.99)
assert.equal(storageContract.acceptedSafeRollupProjectionMb.kick, 23.57)
assert.equal(storageContract.acceptedSafeRollupProjectionMb.combined, 94.56)
assert.equal(storageContract.gate.generationAuthorizedByStorageEvidenceAlone, false)
assert.equal(storageContract.gate.nextGateAfterStoragePass, 'generation_execution_cost_measurement')
assert.equal(storageContract.workflow.manual, true)
assert.equal(storageContract.workflow.weekly, true)
assert.equal(storageContract.workflow.forkPullRequestSecretsAllowed, false)
for (const value of Object.values(storageContract.privacy)) assert.equal(value, false)
for (const value of Object.values(storageContract.scope)) assert.equal(value, false)

const storage = json('docs/audits/12a3-account-storage-evidence.json')
assert.equal(storage.schemaVersion, 'viewloom-12a3-account-storage-gate-v1')
assert.equal(storage.status, 'observed')
assert.equal(storage.acceptanceIdentity.pr, 507)
assert.equal(storage.acceptanceIdentity.workflowRunId, 29175976919)
assert.equal(storage.acceptanceIdentity.artifactId, 8254945754)
assert.equal(storage.providers.twitch.currentSizeMb, 319.39)
assert.equal(storage.providers.twitch.projectedSizeMbWithSafety, 390.38)
assert.equal(storage.providers.twitch.providerStorageGatePass, true)
assert.equal(storage.providers.kick.currentSizeMb, 268.99)
assert.equal(storage.providers.kick.projectedSizeMbWithSafety, 292.56)
assert.equal(storage.providers.kick.providerStorageGatePass, true)
assert.equal(storage.account.databaseCount, 8)
assert.equal(storage.account.sizedDatabaseCount, 8)
assert.equal(storage.account.currentSizeMb, 3551.7)
assert.equal(storage.account.projectedSizeMbWithSafety, 3646.26)
assert.equal(storage.account.operationalCeilingMb, 4608)
assert.equal(storage.account.projectedHeadroomMb, 1473.74)
assert.equal(storage.account.projectedUtilizationPct, 71.22)
assert.equal(storage.account.accountStorageGatePass, true)
assert.equal(storage.gate.accountAggregateMeasured, true)
assert.equal(storage.gate.generationStorageGatePass, true)
assert.equal(storage.gate.generationAuthorizedByThisEvidenceAlone, false)
assert.equal(storage.gate.nextGate, 'generation_execution_cost_measurement')
for (const value of Object.values(storage.privacy)) assert.equal(value, false)
for (const value of Object.values(storage.boundaries)) assert.equal(value, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v7')
assert.equal(state.status, 'remote_schema_complete_storage_gate_passed_execution_gate_blocked')
assert.equal(state.repositoryMigration.status, 'accepted')
assert.equal(state.controlledApply.status, 'deployed_and_verified')
assert.equal(state.controlledApply.workerDeploymentEvidencePresent, true)
assert.equal(state.remoteSchemaProbe.status, 'complete')
assert.equal(state.remoteSchemaProbe.twitchObservedObjects, 3)
assert.equal(state.remoteSchemaProbe.twitchSchemaComplete, true)
assert.equal(state.remoteSchemaProbe.kickObservedObjects, 3)
assert.equal(state.remoteSchemaProbe.kickSchemaComplete, true)
assert.equal(state.remoteSchemaProbe.remoteSchemaGatePass, true)
assert.equal(state.remoteSchemaProbe.probeRowsWritten, 0)
assert.equal(state.generationStorageGate.status, 'accepted')
assert.equal(state.generationStorageGate.pr, 507)
assert.equal(state.generationStorageGate.accountDatabaseCount, 8)
assert.equal(state.generationStorageGate.accountSizedDatabaseCount, 8)
assert.equal(state.generationStorageGate.accountAggregateMeasured, true)
assert.equal(state.generationStorageGate.generationStorageGatePass, true)
assert.deepEqual(state.closedBlockers, [
  'remote_schema_not_applied',
  'collector_worker_deployment_not_evidenced',
  'account_aggregate_storage_unmeasured',
])
assert.equal(state.generation.status, 'blocked')
assert.equal(state.generation.authorized, false)
assert.equal(state.generation.runtimeGenerationStarted, false)
assert.deepEqual(state.generation.blockers, ['generation_execution_cost_unmeasured'])
assert.equal(state.nextWorkstream, '12A-3 production execution-cost measurement and bounded generation dry run')

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
console.log('- collector Worker deployment and remote schema accepted PR #506')
console.log('- account storage gate accepted PR #507')
console.log('- Twitch and Kick remote schema objects are 3 / 3')
console.log('- 8 / 8 account D1 databases have size evidence')
console.log('- generation storage gate passed')
console.log('- production generation remains blocked by execution-cost measurement')
console.log('- Twitch and Kick remain provider-separated')
