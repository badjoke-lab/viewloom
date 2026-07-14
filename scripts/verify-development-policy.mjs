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

const canonicalDocs = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
]

const requiredFiles = [
  ...canonicalDocs,
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/analytics-observation-system-spec.md',
  'docs/product/analytics-observation-system-plan.md',
  'docs/audits/12a1-analytics-field-contract.json',
  'docs/audits/12a1-source-evidence.json',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a3-generator-enablement-contract.json',
  'docs/audits/12a3-generator-enablement-evidence.json',
  'docs/audits/12a3-postmerge-acceptance-contract.json',
  'docs/audits/12a3-postmerge-acceptance-evidence.json',
  'docs/audits/12a4-category-source-audit-contract.json',
  'docs/audits/12a4-category-source-audit-evidence.json',
  'docs/audits/12a4-category-storage-design-contract.json',
  'docs/audits/12a4-category-storage-budget-evidence.json',
  'docs/audits/12a4-category-migration-runtime-contract.json',
  'docs/audits/12a4-disabled-runtime-postmerge-evidence.json',
  'docs/audits/12a4-category-execution-cost-probe-contract.json',
  'docs/audits/12a4-category-readonly-preflight-evidence.json',
  'docs/audits/12a4-category-controlled-schema-apply-contract.json',
  'docs/operations/12a3-generator-enablement-acceptance-2026-07-12.md',
  'docs/operations/12a3-postmerge-acceptance-2026-07-12.md',
  'docs/operations/12a4-category-source-audit-2026-07-12.md',
  'docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md',
  'docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-readonly-preflight-acceptance.md',
  'docs/work-in-progress/phase12a4-category-controlled-schema-apply.md',
  'workers/shared/intraday-rollup.ts',
  'workers/shared/category-schema.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/category-cost-probe/src/index.ts',
  'workers/category-schema-apply/src/index.ts',
]
for (const path of requiredFiles) assert.equal(exists(path), true, `missing file: ${path}`)

const retiredOneTimeFiles = [
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
  'docs/work-in-progress/phase12a3-execution-cost-probe.md',
  'docs/work-in-progress/phase12a3-generator-enablement.md',
  'docs/work-in-progress/phase12a3-postmerge-acceptance.md',
  'docs/work-in-progress/phase12a4-category-source-audit.md',
  'docs/work-in-progress/phase12a4-category-storage-design.md',
  '.github/workflows/analytics-12a4-category-source-audit.yml',
  'workers/category-source-audit/shared.ts',
  'workers/category-source-audit/twitch.ts',
  'workers/category-source-audit/kick.ts',
  'workers/category-source-audit/wrangler.twitch.toml',
  'workers/category-source-audit/wrangler.kick.toml',
  'scripts/collect-12a4-category-source-evidence.mjs',
  'scripts/verify-12a4-category-source-audit-package.mjs',
  'scripts/check-12a4-category-source-audit-scope.mjs',
]
for (const path of retiredOneTimeFiles) assert.equal(exists(path), false, `retired one-time file still present: ${path}`)

for (const path of canonicalDocs) {
  check(path, ['PR #513', 'PR #514', 'category storage design', 'category migration', 'runtime capture'])
  const source = read(path)
  for (const stale of [
    'bounded_generator_not_implemented',
    'Production generation started no',
    'category capture remains unapproved for both providers',
    'category storage design accepted: false',
    'category storage design not accepted',
    'Current workstream 12A-4 category storage design and budget gate',
    'Current workstream: 12A-4 provider-specific category storage design and budget gate',
    'Current workstream 12A-4 category migration and disabled runtime implementation',
    'Current workstream: 12A-4 provider-specific category migration and disabled runtime implementation',
    'Current workstream 12A-4 production category execution-cost probe',
    'Current workstream: 12A-4 production category execution-cost probe',
  ]) assert.equal(source.includes(stale), false, `${path}: stale current state: ${stale}`)
  assert.ok(source.includes('controlled category schema apply') || source.includes('controlled provider schema apply'), `${path}: controlled schema apply current state missing`)
}

const enablement = json('docs/audits/12a3-generator-enablement-evidence.json')
assert.equal(enablement.status, 'accepted')
assert.equal(enablement.providerSeparated, true)
assert.equal(enablement.acceptanceIdentity.pr, 510)

const postmerge = json('docs/audits/12a3-postmerge-acceptance-evidence.json')
assert.equal(postmerge.status, 'accepted')
assert.equal(postmerge.merge.pr, 510)
assert.equal(postmerge.deployment.gatePass, true)
assert.equal(postmerge.providers.twitch.providerGatePass, true)
assert.equal(postmerge.providers.kick.providerGatePass, true)
assert.equal(postmerge.gate.postMergeAccumulationPass, true)

const categoryContract = json('docs/audits/12a4-category-source-audit-contract.json')
assert.equal(categoryContract.status, 'accepted')
assert.equal(categoryContract.providerSeparated, true)
assert.equal(categoryContract.acceptedEvidence.pr, 513)
assert.equal(categoryContract.providers.twitch.providerIdPath, 'game_id')
assert.equal(categoryContract.providers.twitch.namePath, 'game_name')
assert.equal(categoryContract.providers.kick.providerIdPath, 'category.id')
assert.equal(categoryContract.providers.kick.namePath, 'category.name')
assert.equal(categoryContract.gate.categorySourceAuditPass, true)
assert.equal(categoryContract.gate.runtimeCaptureAuthorized, false)

const categoryEvidence = json('docs/audits/12a4-category-source-audit-evidence.json')
assert.equal(categoryEvidence.status, 'accepted')
assert.equal(categoryEvidence.acceptanceIdentity.pr, 513)
assert.equal(categoryEvidence.providerSeparated, true)
assert.equal(categoryEvidence.providers.twitch.captureApproved, true)
assert.equal(categoryEvidence.providers.kick.captureApproved, true)
assert.equal(categoryEvidence.gate.categorySourceAuditPass, true)
assert.equal(categoryEvidence.gate.runtimeCaptureAuthorized, false)
for (const value of Object.values(categoryEvidence.privacy)) assert.equal(value, false)

const storageContract = json('docs/audits/12a4-category-storage-design-contract.json')
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.providerSeparated, true)
assert.equal(storageContract.categoryContractVersion, 'category-source-v1')
assert.equal(storageContract.selectedDesign.model, 'embedded_hourly')
assert.equal(storageContract.selectedDesign.dictionaryTable, 'provider_category_dictionary')
assert.equal(storageContract.acceptance.repositoryMigrationCandidateAuthorized, true)
assert.equal(storageContract.acceptance.remoteMigrationApplyAuthorized, false)
assert.equal(storageContract.acceptance.runtimeCaptureAuthorizedByThisContract, false)
for (const value of Object.values(storageContract.scope)) assert.equal(value, false)

const storageEvidence = json('docs/audits/12a4-category-storage-budget-evidence.json')
assert.equal(storageEvidence.status, 'accepted')
assert.equal(storageEvidence.acceptanceIdentity.pr, 514)
assert.equal(storageEvidence.selectedDesign.model, 'embedded_hourly')
assert.equal(storageEvidence.providers.twitch.projectedHeadroomMb, 11.3)
assert.equal(storageEvidence.providers.kick.projectedHeadroomMb, 135.43)
assert.equal(storageEvidence.gate.categoryStorageDesignPass, true)
assert.equal(storageEvidence.gate.remoteMigrationApplyAuthorized, false)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.purposes.category.twitch.captureApproved, true)
assert.equal(fieldContract.purposes.category.twitch.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, true)
assert.equal(fieldContract.purposes.category.kick.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)
assert.equal(fieldContract.purposes.category.combinedProviderCategoryRankingAllowed, false)

const sourceEvidence = json('docs/audits/12a1-source-evidence.json')
assert.equal(sourceEvidence.providers.twitch.category.providerIdPath, 'game_id')
assert.equal(sourceEvidence.providers.kick.category.providerIdPath, 'category.id')
assert.equal(sourceEvidence.crossProviderIdentity.categoryIdentityEquivalenceAllowed, false)
assert.equal(sourceEvidence.crossProviderIdentity.combinedProviderCategoryRankingAllowed, false)

const disabledRuntime = json('docs/audits/12a4-disabled-runtime-postmerge-evidence.json')
assert.equal(disabledRuntime.status, 'accepted')
assert.equal(disabledRuntime.acceptanceIdentity.pr, 517)
assert.equal(disabledRuntime.merge.pr, 516)
assert.equal(disabledRuntime.deployment.gatePass, true)
assert.equal(disabledRuntime.providers.twitch.providerGatePass, true)
assert.equal(disabledRuntime.providers.kick.providerGatePass, true)
assert.equal(disabledRuntime.gate.disabledRuntimePostMergePass, true)
assert.equal(disabledRuntime.gate.remoteMigrationApplyAuthorized, false)
assert.equal(disabledRuntime.gate.runtimeCaptureEnablementAuthorized, false)
assert.equal(disabledRuntime.boundaries.productionSchemaChangedByAcceptance, false)
assert.equal(disabledRuntime.boundaries.productionRowsWrittenByAcceptance, false)
assert.equal(disabledRuntime.boundaries.categoryRuntimeEnabled, false)
assert.equal(disabledRuntime.boundaries.temporaryVerifiersRetained, false)

const preflight = json('docs/audits/12a4-category-readonly-preflight-evidence.json')
assert.equal(preflight.status, 'accepted')
assert.equal(preflight.providerSeparated, true)
assert.equal(preflight.acceptanceIdentity.triggerPr, 527)
assert.equal(preflight.acceptanceIdentity.workflowRunId, 29318733171)
assert.equal(preflight.gate.twitchGatePass, true)
assert.equal(preflight.gate.kickGatePass, true)
assert.equal(preflight.gate.readOnlyPreflightPass, true)
assert.equal(preflight.providers.twitch.health.source, 'collector_status')
assert.equal(preflight.providers.kick.health.source, 'latest_snapshot')
assert.equal(preflight.providers.twitch.providerLeakageRows, 0)
assert.equal(preflight.providers.kick.providerLeakageRows, 0)
assert.equal(preflight.providers.twitch.query.rowsWritten, 0)
assert.equal(preflight.providers.kick.query.rowsWritten, 0)
assert.equal(preflight.providers.twitch.query.changes, 0)
assert.equal(preflight.providers.kick.query.changes, 0)
assert.equal(preflight.providers.twitch.lifecycle.deleteHttpStatus, 404)
assert.equal(preflight.providers.kick.lifecycle.deleteHttpStatus, 404)
assert.equal(preflight.gate.remoteMigrationApplyAuthorized, false)
assert.equal(preflight.gate.runtimeCaptureEnablementAuthorized, false)
for (const value of Object.values(preflight.privacy)) assert.equal(value, false)
for (const value of Object.values(preflight.boundaries)) assert.equal(value, false)

const probeContract = json('docs/audits/12a4-category-execution-cost-probe-contract.json')
assert.equal(probeContract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v1')
assert.equal(probeContract.status, 'readonly_preflight_accepted_schema_apply_design_current')
assert.equal(probeContract.trackingIssue, 519)
assert.equal(probeContract.acceptedStartingPoint.implementationPr, 516)
assert.equal(probeContract.acceptedStartingPoint.evidenceFreezePr, 518)
assert.equal(probeContract.acceptedStartingPoint.readonlyPreflightAcceptancePr, 523)
assert.equal(probeContract.acceptedStartingPoint.readonlyPreflightAccepted, true)
assert.equal(probeContract.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(probeContract.acceptanceThresholds.dictionarySecondPassChangesMax, 0)
assert.equal(probeContract.currentDesign.productionExecutionIncluded, false)
assert.equal(probeContract.planningPrBoundary.remoteMigrationApply, false)
assert.equal(probeContract.planningPrBoundary.productionCategoryCapture, false)
assert.equal(probeContract.planningPrBoundary.cloudflareSecretsRequired, false)
assert.equal(probeContract.planningPrBoundary.productionDeploymentJobIncluded, false)

const applyContract = json('docs/audits/12a4-category-controlled-schema-apply-contract.json')
assert.equal(applyContract.schemaVersion, 'viewloom-12a4-category-controlled-schema-apply-contract-v1')
assert.equal(applyContract.status, 'design_package_ready_no_production_execution')
assert.equal(applyContract.trackingIssue, 519)
assert.equal(applyContract.acceptedPreflight.acceptancePr, 523)
assert.equal(applyContract.acceptedPreflight.twitchGatePass, true)
assert.equal(applyContract.acceptedPreflight.kickGatePass, true)
assert.equal(applyContract.migration.expectedStatementCount, 9)
assert.equal(applyContract.migration.secondPassStatementCountMax, 0)
assert.equal(applyContract.migration.partialSchemaPolicy, 'stop_without_applying')
assert.deepEqual(applyContract.providers.order, ['twitch', 'kick'])
assert.equal(applyContract.providers.stopAfterFirstProviderFailure, true)
assert.equal(applyContract.execution.categoryCaptureEnablementIncluded, false)
assert.equal(applyContract.execution.categoryRowsIncluded, false)
assert.equal(applyContract.failurePolicy.doNotDropAppliedSchema, true)
assert.equal(applyContract.failurePolicy.leaveCategoryCaptureDisabled, true)
assert.equal(Object.values(applyContract.planningPrBoundary).every((value) => value === false), true)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v13')
assert.equal(state.status, '12a4_readonly_preflight_accepted_schema_apply_design_current')
assert.equal(state.categorySourceAudit.pr, 513)
assert.equal(state.categoryStorageDesign.pr, 514)
assert.equal(state.categoryMigrationRuntime.implementationPr, 516)
assert.equal(state.disabledRuntimePostMerge.acceptancePr, 517)
assert.equal(state.disabledRuntimePostMerge.evidenceFreezePr, 518)
assert.equal(state.categoryReadOnlyPreflight.acceptancePr, 523)
assert.equal(state.categoryReadOnlyPreflight.twitchGatePass, true)
assert.equal(state.categoryReadOnlyPreflight.kickGatePass, true)
assert.equal(state.categoryReadOnlyPreflight.productionCategorySchemaAbsent, true)
assert.equal(state.categoryExecutionCostProbe.status, 'readonly_preflight_accepted_schema_apply_design_current')
assert.equal(state.categoryExecutionCostProbe.readOnlyPreflightAccepted, true)
assert.equal(state.categoryExecutionCostProbe.controlledSchemaApplyDesign.status, 'current')
assert.equal(state.categoryExecutionCostProbe.controlledSchemaApplyDesign.productionExecutionIncluded, false)
assert.equal(state.categoryCapture.readOnlyPreflightAccepted, true)
assert.equal(state.categoryCapture.controlledSchemaApplyDesignCurrent, true)
assert.equal(state.categoryCapture.productionSchemaPresent, false)
assert.equal(state.categoryCapture.remoteMigrationApplyAuthorized, false)
assert.equal(state.categoryCapture.productionCostProbeAuthorized, false)
assert.equal(state.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(state.categoryCapture.runtimeCaptureStarted, false)
assert.equal(state.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(state.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(state.currentWorkstream.phase, '12A-4-4')
assert.equal(state.currentWorkstream.name, 'controlled category schema apply design')
assert.equal(state.currentWorkstream.trackingIssue, 519)
assert.equal(state.currentWorkstream.acceptedReadOnlyPreflight, true)
assert.equal(state.currentWorkstream.productionExecutionIncluded, false)
assert.equal(state.currentWorkstream.remoteMigrationApplied, false)
assert.equal(state.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(state.nextWorkstream, '12A-4-5 provider-separated bounded category cost probe')

const completedWip = read('docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md')
for (const fragment of [
  'Status: accepted through PR #518',
  'repository migration candidate implemented',
  'no CATEGORY_CAPTURE_ENABLED value in either committed wrangler.toml',
  'no production migration apply',
  'production cost probe remains required',
]) assert.ok(completedWip.includes(fragment), `completed category WIP missing: ${fragment}`)

const preflightWip = read('docs/work-in-progress/phase12a4-category-readonly-preflight-acceptance.md')
for (const fragment of [
  'Status: accepted on `main` through PR #523',
  'Twitch gate pass using collector_status health evidence',
  'Kick gate pass using latest minute snapshot health evidence',
  'D1 rows written zero',
  'runtime capture unauthorized',
]) assert.ok(preflightWip.includes(fragment), `accepted preflight WIP missing: ${fragment}`)

const currentWip = read('docs/work-in-progress/phase12a4-category-controlled-schema-apply.md')
for (const fragment of [
  'Status: current design gate',
  'Tracking issue: #519',
  'partial schema',
  'no production execution in this PR',
  'no CATEGORY_CAPTURE_ENABLED',
  'no production category rows',
]) assert.ok(currentWip.includes(fragment), `current controlled schema WIP missing: ${fragment}`)

console.log('Development and documentation policy verification passed.')
console.log('- 12A-3 generation is enabled and accumulating')
console.log('- 12A-4 category source audit accepted PR #513')
console.log('- 12A-4 category storage design accepted PR #514')
console.log('- 12A-4 category migration and disabled runtime accepted through PR #518')
console.log('- 12A-4 read-only production preflight accepted PR #523')
console.log('- current workstream: controlled category schema apply design')
console.log('- production category schema, bounded cost probe, and runtime capture remain disabled')
