import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const decision = json('docs/audits/12a4-category-capture-enablement-decision-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const storageContract = json('docs/audits/12a4-category-storage-design-contract.json')
const storageEvidence = json('docs/audits/12a4-category-storage-budget-evidence.json')
const migration = json('docs/audits/12a4-category-migration-runtime-contract.json')
const costEvidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const wip = read('docs/work-in-progress/phase12a4-category-capture-enablement-decision.md')
const workflow = read('.github/workflows/analytics-12a4-category-capture-enablement-decision.yml')

assert.equal(decision.schemaVersion, 'viewloom-12a4-category-capture-enablement-decision-v1')
assert.ok(['candidate', 'accepted'].includes(decision.status))
assert.equal(decision.trackingIssue, 519)
assert.equal(decision.acceptedInputs.executionCostAcceptancePr, 558)
assert.equal(decision.acceptedInputs.executionPathRetirementPr, 559)
assert.equal(decision.decision.providerSeparatedCanaryDesignAuthorized, true)
assert.equal(decision.decision.productionRuntimeCaptureAuthorized, false)
assert.equal(decision.decision.productionFlagChangeAuthorized, false)
assert.equal(decision.decision.combinedProviderRolloutAuthorized, false)
assert.deepEqual(decision.decision.sequencing, ['kick', 'twitch'])

assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.selectedDesign.model, 'embedded_hourly')
assert.equal(storageEvidence.status, 'accepted')
assert.equal(storageEvidence.gate.categoryStorageDesignPass, true)
assert.equal(storageEvidence.providers.kick.projectedSizeMbWithCategorySafety, 314.57)
assert.equal(storageEvidence.providers.kick.projectedHeadroomMb, 135.43)
assert.equal(storageEvidence.providers.twitch.projectedSizeMbWithCategorySafety, 438.7)
assert.equal(storageEvidence.providers.twitch.projectedHeadroomMb, 11.3)
assert.equal(storageEvidence.account.projectedHeadroomMb, 891.41)
assert.equal(storageEvidence.gate.runtimeCaptureAuthorized, false)

assert.equal(migration.runtime.flag, 'CATEGORY_CAPTURE_ENABLED')
assert.equal(migration.runtime.defaultEnabled, false)
assert.equal(migration.runtime.committedWranglerValue, false)
assert.equal(migration.runtime.productionCaptureStarted, false)
assert.equal(migration.runtime.dictionary.statementsPerCollectionWhenEnabled, 1)
assert.equal(migration.runtime.dictionary.failureChangesCollectorSuccess, false)
assert.equal(migration.rollup.generatorMaximumQueries, 12)
assert.equal(migration.rollup.additionalGeneratorStatements, 0)

assert.equal(execution.status, 'accepted_and_retired')
assert.equal(execution.acceptedMeasurement.acceptancePr, 558)
assert.equal(execution.retirement.productionPushTriggerPresent, false)
assert.equal(execution.retirement.productionJobPresent, false)
assert.equal(execution.retirement.rearmAuthorized, false)
assert.equal(costEvidence.status, 'accepted')
assert.equal(costEvidence.gates.executionCostProbePass, true)
assert.equal(costEvidence.gates.runtimeCaptureEnablementAuthorized, false)

for (const provider of ['kick', 'twitch']) {
  const providerDecision = decision.providers[provider]
  const measured = costEvidence.providers[provider]
  assert.equal(providerDecision.canaryPackageDesignAuthorized, true)
  assert.equal(providerDecision.productionCanaryExecutionAuthorizedByThisContract, false)
  assert.equal(measured.providerGatePass, true)
  assert.equal(providerDecision.boundedProbe.categoryGeneratorQueries, measured.categoryGeneratorQueries)
  assert.equal(providerDecision.boundedProbe.d1Statements, measured.d1Statements)
  assert.equal(providerDecision.boundedProbe.d1RowsWritten, measured.d1RowsWritten)
  assert.equal(providerDecision.boundedProbe.d1Changes, measured.d1Changes)
  assert.equal(providerDecision.boundedProbe.d1SqlDurationMs, measured.d1SqlDurationMs)
  assert.equal(providerDecision.boundedProbe.workerWallMs, measured.workerWallMs)
  assert.equal(providerDecision.boundedProbe.collectorLatencyDeltaMs, measured.collectorLatencyDeltaMs)
  assert.equal(providerDecision.boundedProbe.databaseSizeDeltaBytes, 0)
  assert.equal(providerDecision.boundedProbe.cleanupRemainingRows, 0)
  assert.equal(providerDecision.boundedProbe.providerLeakageRows, 0)
  assert.ok(providerDecision.preconditionsBeforeExecution.length >= 7)
}
assert.equal(decision.providers.kick.sequence, 1)
assert.equal(decision.providers.twitch.sequence, 2)
assert.ok(decision.providers.twitch.preconditionsBeforeExecution.includes('Kick canary evidence accepted first'))

assert.deepEqual(decision.canaryDesignRequirements.providerOrder, ['kick', 'twitch'])
assert.equal(decision.canaryDesignRequirements.oneProviderAtATime, true)
assert.equal(decision.canaryDesignRequirements.minimumObservationHoursPerProvider, 24)
assert.equal(decision.canaryDesignRequirements.collectorCadenceChange, false)
assert.equal(decision.canaryDesignRequirements.newCron, false)
assert.equal(decision.canaryDesignRequirements.backfill, false)
assert.equal(decision.canaryDesignRequirements.rawRetentionChange, false)
assert.equal(decision.canaryDesignRequirements.categoryAnalyticsUi, false)
assert.equal(decision.canaryDesignRequirements.crossProviderCategoryIdentity, false)
assert.equal(decision.canaryDesignRequirements.combinedProviderCategoryRanking, false)
assert.equal(decision.canaryDesignRequirements.automaticSecondProviderStart, false)
assert.equal(decision.canaryDesignRequirements.automaticPermanentEnablement, false)
assert.equal(decision.canaryDesignRequirements.hardStops.categoryGeneratorQueriesMax, 12)
assert.equal(decision.canaryDesignRequirements.hardStops.collectorLatencyDeltaMsMax, 2000)
assert.equal(decision.canaryDesignRequirements.hardStops.providerLeakageRowsMax, 0)
assert.equal(decision.canaryDesignRequirements.hardStops.collectorSuccessReplacedByCategoryFailure, false)
assert.equal(decision.canaryDesignRequirements.hardStops.persistentCaptureAfterFailedCanary, false)
assert.equal(Object.values(decision.pullRequestBoundary).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v15')
assert.equal(gate.currentWorkstream.phase, '12A-4-7')
assert.equal(gate.currentWorkstream.acceptedCostEvidence, true)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)

for (const fragment of [
  'Status: candidate decision package',
  'Kick canary design: eligible first',
  'Twitch canary design: eligible second',
  'production runtime capture: not authorized',
  'minimum 24-hour observation per provider',
  'no production runtime capture',
]) assert.ok(wip.includes(fragment), `WIP missing ${fragment}`)

assert.ok(workflow.includes('Verify category capture enablement decision'))
assert.ok(workflow.includes('verify-12a4-category-capture-enablement-decision.mjs'))
assert.ok(workflow.includes('verify-development-policy.mjs'))
assert.ok(workflow.includes('contents: read'))
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.toLowerCase().includes('wrangler'), false)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

console.log(JSON.stringify({
  ok: true,
  status: decision.status,
  sequencing: decision.decision.sequencing,
  kickCanaryDesignAuthorized: decision.providers.kick.canaryPackageDesignAuthorized,
  twitchCanaryDesignAuthorized: decision.providers.twitch.canaryPackageDesignAuthorized,
  productionRuntimeCaptureAuthorized: decision.decision.productionRuntimeCaptureAuthorized,
}, null, 2))
