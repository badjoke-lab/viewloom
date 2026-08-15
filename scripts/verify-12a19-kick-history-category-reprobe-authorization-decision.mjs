#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a19-kick-history-category-reprobe-authorization-decision.json'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

const fail = (message) => {
  throw new Error(message)
}
const expect = (condition, message) => {
  if (!condition) fail(message)
}

expect(contract.schemaVersion === 'viewloom-12a19-kick-history-category-reprobe-authorization-decision-v1', 'unexpected schemaVersion')
expect(contract.status === 'candidate_accept_on_merge_no_execution_path', 'decision must remain merge-gated and non-executable')
expect(contract.trackingIssue === 864, 'tracking issue must be #864')
expect(contract.provider === 'kick', 'provider must remain kick-only')
expect(contract.sourceMainSha === '3b72717bbbbe8dfecb67defcc24839d915ab3f1b', 'source main SHA drifted')
expect(contract.decision === 'yes_reauthorize_exactly_one_future_measurement_subject_to_separate_execution_package_gate', 'decision changed')

const basis = contract.decisionBasis
expect(basis.previousMeasuredRowsRead === 843288, 'previous failure rows_read must remain 843288')
expect(basis.previousResult === 'formal_performance_failure', 'previous production result must remain a formal failure')
expect(basis.acceptedRowsReadMaximum === 250000, 'production rows_read maximum must remain 250000')
expect(basis.rawCategoryPathsBefore === 8 && basis.rawCategoryPathsNow === 3, 'raw category path reduction must remain 8 -> 3')
expect(basis.repositoryBaseLogicalTouches === 89884, 'base repository logical touches drifted')
expect(basis.repositoryLogicalTouchesWith25PctSafety === 112355, '25% safety model drifted')
expect(basis.repositoryModelCeiling === 125000, 'repository ceiling drifted')
expect(basis.repositoryModelHeadroomToProductionMaximum === 137645, 'headroom drifted')
expect(basis.repositoryModelIsRemoteD1RowsReadEvidence === false, 'repository model must never be labeled remote D1 evidence')

const safety = contract.oneShotSafetyContract
expect(safety.measurementCountMaximum === 1, 'only one measurement may be authorized')
expect(safety.temporaryAuthenticatedWorkerOnly === true, 'temporary authenticated Worker required')
expect(safety.currentUtcDayOnly === true, 'current UTC day only required')
expect(safety.exactPackageShaPinningRequired === true, 'exact package SHA pinning required')
expect(safety.rowsReadMaximum === 250000, 'threshold relaxation forbidden')
expect(safety.thresholdFailureMustExitNonZero === true, 'threshold failure must exit non-zero')
expect(safety.thresholdFailureMustMakeWorkflowRed === true, 'threshold failure must make workflow red')
expect(safety.errOrExitTrapMaySwallowOriginalFailureCode === false, 'failure code swallowing forbidden')
expect(safety.finallyEquivalentCleanupRequired === true, 'finally-equivalent cleanup required')
expect(safety.cleanupFailureStillAttemptsWorkerDeletion === true, 'Worker deletion must still be attempted after cleanup failure')
expect(safety.aggregateRowsAfterCleanupRequired === 0, 'aggregate cleanup must return to zero rows')
expect(safety.finalTemporaryWorkerEndpointStatusRequired === 404, 'temporary Worker endpoint must finish at 404')
expect(safety.sanitizedEvidenceOnly === true && safety.credentialLeakageAllowed === false, 'evidence must remain sanitized')
expect(safety.oneShotExecutionAuthorityMustBeRetiredImmediatelyAfterMeasurement === true, 'one-shot authority must be retired immediately')
expect(safety.productionResultMustRetainPrevious843288FailureInHistory === true, 'previous failure must remain in history')

const boundary = contract.implementationBoundary
expect(boundary.separateExecutionPackageMayBeImplementedAfterThisDecisionMerges === true, 'separate package authorization missing')
expect(boundary.productionExecutionPathPresentInThisDecisionPr === false, 'decision PR must not contain production execution')
expect(boundary.productionExecutionMayRunBeforeSeparateExecutionPackageGatePasses === false, 'production must remain blocked until the separate gate passes')
for (const key of [
  'permanentGeneratorEnablementAuthorized',
  'collectorGeneratorWiringAuthorized',
  'newCronAuthorized',
  'backfillAuthorized',
  'rawRetentionChangeAuthorized',
  'historyCategoryApiAuthorized',
  'historyCategoryUiAuthorized',
  'twitchRolloutAuthorized',
  'crossProviderAggregateAuthorized',
  'rowsReadThresholdRelaxationAuthorized',
]) {
  expect(boundary[key] === false, `${key} must remain false`)
}

const gate = contract.requiredSeparateExecutionPackageGate
expect(gate.exactScopeGuardRequired === true, 'execution package must have exact scope guard')
expect(gate.noAutomaticSchedule === true, 'automatic schedule forbidden')
expect(gate.noPushTriggeredProductionExecution === true, 'push-triggered production execution forbidden')
expect(gate.oneShotManualAuthorizationRequired === true, 'one-shot manual authorization required')
expect(gate.exactHeadShaCheckRequired === true, 'exact head SHA check required')
expect(gate.cleanupAssertionsRequired === true, 'cleanup assertions required')
expect(gate.failurePropagationTestRequired === true, 'failure propagation test required')
expect(gate.sanitizedEvidenceContractRequired === true, 'sanitized evidence contract required')
expect(gate.retirementChangeRequiredImmediatelyAfterMeasurement === true, 'retirement change required after measurement')

console.log(JSON.stringify({
  trackingIssue: contract.trackingIssue,
  decision: contract.decision,
  previousMeasuredRowsRead: basis.previousMeasuredRowsRead,
  acceptedRowsReadMaximum: basis.acceptedRowsReadMaximum,
  repositoryLogicalTouchesWith25PctSafety: basis.repositoryLogicalTouchesWith25PctSafety,
  repositoryModelIsRemoteD1RowsReadEvidence: basis.repositoryModelIsRemoteD1RowsReadEvidence,
  productionExecutionPathPresentInThisDecisionPr: boundary.productionExecutionPathPresentInThisDecisionPr,
  nextGate: contract.nextGate,
}, null, 2))
