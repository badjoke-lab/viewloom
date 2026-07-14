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

for (const path of [
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
  'docs/operations/12a3-generator-enablement-acceptance-2026-07-12.md',
  'docs/operations/12a3-postmerge-acceptance-2026-07-12.md',
  'docs/operations/12a4-category-source-audit-2026-07-12.md',
  'docs/operations/12a4-category-storage-design-acceptance-2026-07-14.md',
  'docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md',
  'docs/work-in-progress/phase12a4-disabled-runtime-postmerge.md',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'workers/shared/intraday-rollup.ts',
  'workers/collector-twitch/src/entry.ts',
  'workers/collector-kick/src/entry.ts',
  'workers/category-cost-probe/src/index.ts',
]) assert.equal(exists(path), true, `missing file: ${path}`)

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
]) assert.equal(exists(retired), false, `retired one-time file still present: ${retired}`)

for (const path of canonicalDocs) {
  check(path, ['PR #513', 'PR #514', 'category storage design', 'category migration', 'runtime capture'])
  const source = read(path)
  assert.equal(source.includes('bounded_generator_not_implemented'), false, `${path}: stale 12A-3 boundary`)
  assert.equal(source.includes('Production generation started no'), false, `${path}: stale generation state`)
  assert.equal(source.includes('category capture remains unapproved for both providers'), false, `${path}: stale category source state`)
  assert.equal(source.includes('category storage design accepted: false'), false, `${path}: stale category storage state`)
  assert.equal(source.includes('category storage design not accepted'), false, `${path}: stale category storage state`)
  assert.equal(source.includes('Current workstream 12A-4 category storage design and budget gate'), false, `${path}: stale current workstream`)
  assert.equal(source.includes('Current workstream: 12A-4 provider-specific category storage design and budget gate'), false, `${path}: stale current workstream`)
  assert.equal(source.includes('Current workstream 12A-4 category migration and disabled runtime implementation'), false, `${path}: stale 12A-4-2 workstream`)
  assert.equal(source.includes('Current workstream: 12A-4 provider-specific category migration and disabled runtime implementation'), false, `${path}: stale 12A-4-2 workstream`)
}

const enablement = json('docs/audits/12a3-generator-enablement-evidence.json')
assert.equal(enablement.status, 'accepted')
assert.equal(enablement.providerSeparated, true)
assert.equal(enablement.acceptanceIdentity.pr, 510)

const postmerge = json('docs/audits/12a3-postmerge-acceptance-evidence.json')
assert.equal(postmerge.status, 'accepted')
assert.equal(postmerge.merge.pr, 510)
assert.equal(postmerge.merge.sha, 'ad90585d74149b0fb1805b9a76fd8d796a5e7c2d')
assert.equal(postmerge.deployment.runId, 29191094150)
assert.equal(postmerge.deployment.gatePass, true)
assert.equal(postmerge.providers.twitch.providerGatePass, true)
assert.equal(postmerge.providers.kick.providerGatePass, true)
assert.equal(postmerge.gate.postMergeAccumulationPass, true)

const categoryContract = json('docs/audits/12a4-category-source-audit-contract.json')
assert.equal(categoryContract.status, 'accepted')
assert.equal(categoryContract.providerSeparated, true)
assert.equal(categoryContract.acceptedEvidence.pr, 513)
assert.equal(categoryContract.acceptedEvidence.workflowRunId, 29195340633)
assert.equal(categoryContract.providers.twitch.providerIdPath, 'game_id')
assert.equal(categoryContract.providers.twitch.namePath, 'game_name')
assert.equal(categoryContract.providers.twitch.minimumObservedPresenceRatio, 1)
assert.equal(categoryContract.providers.kick.providerIdPath, 'category.id')
assert.equal(categoryContract.providers.kick.namePath, 'category.name')
assert.equal(categoryContract.providers.kick.minimumObservedPresenceRatio, 1)
assert.equal(categoryContract.gate.categorySourceAuditPass, true)
assert.equal(categoryContract.gate.storageDesignAuthorized, true)
assert.equal(categoryContract.gate.runtimeCaptureAuthorized, false)

const categoryEvidence = json('docs/audits/12a4-category-source-audit-evidence.json')
assert.equal(categoryEvidence.status, 'accepted')
assert.equal(categoryEvidence.acceptanceIdentity.pr, 513)
assert.equal(categoryEvidence.acceptanceIdentity.workflowRunId, 29195340633)
assert.equal(categoryEvidence.acceptanceIdentity.artifactId, 8260821948)
assert.equal(categoryEvidence.providerSeparated, true)
assert.equal(categoryEvidence.providers.twitch.captureApproved, true)
assert.equal(categoryEvidence.providers.twitch.selectedSourceContract.providerIdPath, 'game_id')
assert.equal(categoryEvidence.providers.twitch.selectedSourceContract.namePath, 'game_name')
assert.equal(categoryEvidence.providers.kick.captureApproved, true)
assert.equal(categoryEvidence.providers.kick.selectedSourceContract.providerIdPath, 'category.id')
assert.equal(categoryEvidence.providers.kick.selectedSourceContract.namePath, 'category.name')
assert.equal(categoryEvidence.providers.kick.alternateEvidenceCannotApprovePrimary, true)
assert.equal(categoryEvidence.gate.lifecyclePass, true)
assert.equal(categoryEvidence.gate.categorySourceAuditPass, true)
assert.equal(categoryEvidence.gate.storageDesignAuthorized, true)
assert.equal(categoryEvidence.gate.runtimeCaptureAuthorized, false)
assert.equal(categoryEvidence.boundaries.mainCollectorsRestored, true)
for (const value of Object.values(categoryEvidence.privacy)) assert.equal(value, false)

const storageContract = json('docs/audits/12a4-category-storage-design-contract.json')
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.providerSeparated, true)
assert.equal(storageContract.categoryContractVersion, 'category-source-v1')
assert.equal(storageContract.selectedDesign.model, 'embedded_hourly')
assert.equal(storageContract.selectedDesign.dictionaryTable, 'provider_category_dictionary')
assert.equal(storageContract.selectedDesign.newCategoryIndex, false)
assert.equal(storageContract.selectedDesign.newCron, false)
assert.equal(storageContract.selectedDesign.backfill, false)
assert.equal(storageContract.selectedDesign.rawRetentionChanged, false)
assert.equal(storageContract.selectedDesign.runtimeCaptureEnabled, false)
assert.equal(storageContract.acceptedEvidence.pr, 514)
assert.equal(storageContract.acceptedEvidence.workflowRunId, 29197092303)
assert.equal(storageContract.acceptedEvidence.artifactId, 8261289433)
assert.equal(storageContract.acceptedEvidence.selectedModel, 'embedded_hourly')
assert.equal(storageContract.acceptedEvidence.categoryStorageDesignPass, true)
assert.equal(storageContract.acceptance.repositoryMigrationCandidateAuthorized, true)
assert.equal(storageContract.acceptance.remoteMigrationApplyAuthorized, false)
assert.equal(storageContract.acceptance.runtimeCaptureAuthorizedByThisContract, false)
for (const value of Object.values(storageContract.scope)) assert.equal(value, false)

const storageEvidence = json('docs/audits/12a4-category-storage-budget-evidence.json')
assert.equal(storageEvidence.status, 'accepted')
assert.equal(storageEvidence.acceptanceIdentity.pr, 514)
assert.equal(storageEvidence.acceptanceIdentity.workflowRunId, 29197092303)
assert.equal(storageEvidence.acceptanceIdentity.artifactId, 8261289433)
assert.equal(storageEvidence.sourceContract.providerSeparated, true)
assert.equal(storageEvidence.sourceContract.categoryContractVersion, 'category-source-v1')
assert.equal(storageEvidence.selectedDesign.model, 'embedded_hourly')
assert.equal(storageEvidence.providers.twitch.projectedSizeMbWithCategorySafety, 438.7)
assert.equal(storageEvidence.providers.twitch.projectedHeadroomMb, 11.3)
assert.equal(storageEvidence.providers.kick.projectedSizeMbWithCategorySafety, 314.57)
assert.equal(storageEvidence.providers.kick.projectedHeadroomMb, 135.43)
assert.equal(storageEvidence.account.projectedSizeMbWithCategorySafety, 3716.59)
assert.equal(storageEvidence.account.projectedHeadroomMb, 891.41)
assert.equal(storageEvidence.gate.categoryStorageDesignPass, true)
assert.equal(storageEvidence.gate.repositoryMigrationCandidateAuthorized, true)
assert.equal(storageEvidence.gate.remoteMigrationApplyAuthorized, false)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)
assert.equal(storageEvidence.gate.productionCostProbeRequired, true)
for (const value of Object.values(storageEvidence.boundaries)) assert.equal(value, false)

const fieldContract = json('docs/audits/12a1-analytics-field-contract.json')
assert.equal(fieldContract.purposes.category.twitch.captureApproved, true)
assert.equal(fieldContract.purposes.category.twitch.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.kick.captureApproved, true)
assert.equal(fieldContract.purposes.category.kick.runtimeCaptureStarted, false)
assert.equal(fieldContract.purposes.category.crossProviderIdentityEquivalenceAllowed, false)
assert.equal(fieldContract.purposes.category.combinedProviderCategoryRankingAllowed, false)

const sourceEvidence = json('docs/audits/12a1-source-evidence.json')
assert.equal(sourceEvidence.schemaVersion, 'viewloom-12a1-source-evidence-v2')
assert.equal(sourceEvidence.providers.twitch.category.providerIdPath, 'game_id')
assert.equal(sourceEvidence.providers.twitch.category.namePath, 'game_name')
assert.equal(sourceEvidence.providers.twitch.category.captureApproved, true)
assert.equal(sourceEvidence.providers.kick.category.providerIdPath, 'category.id')
assert.equal(sourceEvidence.providers.kick.category.namePath, 'category.name')
assert.equal(sourceEvidence.providers.kick.category.captureApproved, true)
assert.equal(sourceEvidence.crossProviderIdentity.categoryIdentityEquivalenceAllowed, false)
assert.equal(sourceEvidence.crossProviderIdentity.combinedProviderCategoryRankingAllowed, false)

const disabledRuntime = json('docs/audits/12a4-disabled-runtime-postmerge-evidence.json')
assert.equal(disabledRuntime.status, 'accepted')
assert.equal(disabledRuntime.acceptanceIdentity.pr, 517)
assert.equal(disabledRuntime.merge.pr, 516)
assert.equal(disabledRuntime.deployment.runId, 29277503634)
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

const probeContract = json('docs/audits/12a4-category-execution-cost-probe-contract.json')
assert.equal(probeContract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-contract-v1')
assert.equal(probeContract.status, 'planning_package_ready')
assert.equal(probeContract.trackingIssue, 519)
assert.equal(probeContract.acceptedStartingPoint.implementationPr, 516)
assert.equal(probeContract.acceptedStartingPoint.evidenceFreezePr, 518)
assert.equal(probeContract.acceptanceThresholds.categoryGeneratorQueriesMax, 12)
assert.equal(probeContract.acceptanceThresholds.dictionarySecondPassChangesMax, 0)
assert.equal(probeContract.planningPrBoundary.remoteMigrationApply, false)
assert.equal(probeContract.planningPrBoundary.productionCategoryCapture, false)
assert.equal(probeContract.planningPrBoundary.cloudflareSecretsRequired, false)
assert.equal(probeContract.planningPrBoundary.productionDeploymentJobIncluded, false)

const state = json('docs/audits/12a2-current-gate-state.json')
assert.equal(state.schemaVersion, 'viewloom-12a2-current-gate-state-v12')
assert.equal(state.status, '12a4_disabled_runtime_accepted_execution_cost_probe_current')
assert.equal(state.categorySourceAudit.pr, 513)
assert.equal(state.categorySourceAudit.lifecyclePass, true)
assert.equal(state.categoryStorageDesign.pr, 514)
assert.equal(state.categoryStorageDesign.mergeSha, 'd3c219670af2189fe9acd51ecd67777481162a29')
assert.equal(state.categoryStorageDesign.selectedModel, 'embedded_hourly')
assert.equal(state.categoryMigrationRuntime.implementationPr, 516)
assert.equal(state.categoryMigrationRuntime.repositoryMigrationCandidateImplemented, true)
assert.equal(state.disabledRuntimePostMerge.acceptancePr, 517)
assert.equal(state.disabledRuntimePostMerge.evidenceFreezePr, 518)
assert.equal(state.disabledRuntimePostMerge.productionCategorySchemaAbsent, true)
assert.equal(state.categoryExecutionCostProbe.trackingIssue, 519)
assert.equal(state.categoryExecutionCostProbe.status, 'planning_current')
assert.equal(state.categoryExecutionCostProbe.remoteMigrationApplyAuthorized, false)
assert.equal(state.categoryCapture.sourceContractAccepted, true)
assert.equal(state.categoryCapture.storageDesignAccepted, true)
assert.equal(state.categoryCapture.repositoryMigrationCandidateImplemented, true)
assert.equal(state.categoryCapture.disabledRuntimeProductionAccepted, true)
assert.equal(state.categoryCapture.productionSchemaPresent, false)
assert.equal(state.categoryCapture.remoteMigrationApplyAuthorized, false)
assert.equal(state.categoryCapture.productionCostProbeRequired, true)
assert.equal(state.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(state.categoryCapture.runtimeCaptureStarted, false)
assert.equal(state.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(state.categoryCapture.combinedProviderRankingAllowed, false)
assert.equal(state.currentWorkstream.phase, '12A-4-3')
assert.equal(state.currentWorkstream.name, 'production category execution-cost probe and remote migration decision')
assert.equal(state.currentWorkstream.trackingIssue, 519)
assert.equal(state.currentWorkstream.remoteMigrationApplied, false)
assert.equal(state.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(state.nextWorkstream, '12A-4 provider-separated production capture acceptance')

const completedWip = read('docs/work-in-progress/phase12a4-category-migration-disabled-runtime.md')
for (const fragment of [
  'Status: accepted through PR #518',
  'repository migration candidate implemented',
  'no CATEGORY_CAPTURE_ENABLED value in either committed wrangler.toml',
  'no production migration apply',
  'production cost probe remains required',
]) assert.ok(completedWip.includes(fragment), `completed category WIP missing: ${fragment}`)

const currentWip = read('docs/work-in-progress/phase12a4-category-execution-cost-probe.md')
for (const fragment of [
  'Status: current',
  'Tracking issue: #519',
  'read-only provider preflight Worker',
  'no remote D1 migration',
  'no CATEGORY_CAPTURE_ENABLED value',
  'no production category rows',
]) assert.ok(currentWip.includes(fragment), `current category cost WIP missing: ${fragment}`)

console.log('Development and documentation policy verification passed.')
console.log('- 12A-3 generation is enabled and accumulating')
console.log('- 12A-4 category source audit accepted PR #513')
console.log('- 12A-4 category storage design accepted PR #514')
console.log('- 12A-4 migration and disabled runtime accepted through PR #518')
console.log('- current workstream: production category execution-cost probe')
console.log('- remote category migration and runtime capture remain disabled')
