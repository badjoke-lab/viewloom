#!/usr/bin/env node
import fs from 'node:fs'

const decisionPath = 'docs/audits/12a24-kick-history-category-reprobe-reauthorization-decision.json'
const failurePath = 'docs/audits/12a22-kick-history-category-reprobe-production-failure.json'
const rootCausePath = 'docs/audits/12a23-kick-history-category-reprobe-confirmation-root-cause.json'
const triggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'
const retiredWorkflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'
const runnerPath = 'scripts/run-12a20-kick-history-category-reprobe.sh'
const workerPath = 'workers/history-category-aggregate-cost-probe/src/index.ts'
const decisionWorkflowPath = '.github/workflows/analytics-12a24-kick-history-category-reprobe-reauthorization-decision.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => {
  if (!value) throw new Error(message)
}

const decision = json(decisionPath)
const failure = json(failurePath)
const rootCause = json(rootCausePath)
const trigger = json(triggerPath)
const retiredWorkflow = read(retiredWorkflowPath)
const runner = read(runnerPath)
const worker = read(workerPath)
const decisionWorkflow = read(decisionWorkflowPath)

assert(decision.schemaVersion === 'viewloom-12a24-kick-history-category-reprobe-reauthorization-decision-v1', 'decision schema')
assert(decision.status === 'repository_only_decision_no_production_execution', 'decision status')
assert(decision.phase === '12A-24', 'phase')
assert(decision.provider === 'kick', 'provider')
assert(decision.trackingIssue === 880, 'tracking issue')
assert(decision.parentProgramIssue === 872, 'parent program')
assert(decision.sourceMainSha === 'fdd6aeafc232ff4cd1e14580fc61cc7372cbd3f8', 'source main')
assert(decision.decision === 'yes_authorize_exactly_one_new_dormant_measurement_package_only', 'decision')
assert(Array.isArray(decision.rationale) && decision.rationale.length >= 5, 'rationale')

assert(decision.acceptedInputs.historicalCompletedPerformance.rowsRead === 843288, 'historical rows read')
assert(decision.acceptedInputs.historicalCompletedPerformance.rowsReadMaximum === 250000, 'historical max')
assert(decision.acceptedInputs.historicalCompletedPerformance.result === 'FAIL', 'historical failure')
assert(decision.acceptedInputs.incompleteReplacementAttempt.productionHeadSha === '273a3b6ceea48a858ece75651ea1c597365aa08c', 'replacement production head')
assert(decision.acceptedInputs.incompleteReplacementAttempt.run === 31959926240, 'replacement run')
assert(decision.acceptedInputs.incompleteReplacementAttempt.exitCode === 32, 'replacement exit')
assert(decision.acceptedInputs.incompleteReplacementAttempt.failedAtStage === 'run_probe', 'replacement stage')
assert(decision.acceptedInputs.incompleteReplacementAttempt.costMeasurementCompleted === false, 'replacement measurement incomplete')
assert(decision.acceptedInputs.incompleteReplacementAttempt.cleanupSafe === true, 'replacement cleanup safe')
assert(decision.acceptedInputs.failureAcceptance.pr === 877, 'failure acceptance PR')
assert(decision.acceptedInputs.failureAcceptance.mergeSha === '0d96dddb19f1c0cc8c6ff8d4ef0de21534ac0e36', 'failure acceptance merge')
assert(decision.acceptedInputs.rootCauseRepair.issue === 878, 'repair issue')
assert(decision.acceptedInputs.rootCauseRepair.pr === 879, 'repair PR')
assert(decision.acceptedInputs.rootCauseRepair.headSha === '06d5d6789e9bb2d3bf66adf31730ef8bf314e2db', 'repair head')
assert(decision.acceptedInputs.rootCauseRepair.mergeSha === 'fdd6aeafc232ff4cd1e14580fc61cc7372cbd3f8', 'repair merge')
assert(decision.acceptedInputs.rootCauseRepair.confirmationValuesMatch === true, 'confirmation repair accepted')
assert(decision.acceptedInputs.rootCauseRepair.productionWorkflowStillRetired === true, 'workflow retirement accepted')
assert(decision.acceptedInputs.repositoryModel.logicalTouchesWith25PctSafety === 112355, 'repository model')
assert(decision.acceptedInputs.repositoryModel.repositoryCeiling === 125000, 'repository ceiling')
assert(decision.acceptedInputs.repositoryModel.isRemoteD1Evidence === false, 'repository model not D1 evidence')

assert(failure.status === 'probe_response_failed_cleanup_safe', 'accepted failure status')
assert(failure.production.run === decision.acceptedInputs.incompleteReplacementAttempt.run, 'failure run linkage')
assert(failure.result.costMeasurementCompleted === false, 'failure measurement linkage')
assert(failure.cleanup.exitCode === 0, 'failure cleanup exit')
assert(failure.cleanup.aggregateRows === 0, 'failure cleanup rows')
assert(failure.cleanup.providerLeakageRows === 0, 'failure cleanup leakage')
assert(failure.cleanup.postDeleteHttpStatus === 404, 'failure final 404')

assert(rootCause.status === 'repository_root_cause_confirmed_repair_only', 'root-cause status')
assert(rootCause.rootCause.classification === 'confirmation_header_contract_mismatch', 'root-cause classification')
assert(rootCause.rootCause.certainty === 'deterministic_from_exact_production_code', 'root-cause certainty')
assert(rootCause.repair.runnerConfirmationAfterRepair === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE', 'repaired runner confirmation')
assert(rootCause.authorization.newProductionProbeAuthorized === false, '12A23 production remained unauthorized')

const workerMatch = worker.match(/const CONFIRMATION = '([^']+)'/)
const runnerMatch = runner.match(/^CONFIRM='([^']+)'$/m)
assert(workerMatch && runnerMatch, 'confirmation constants')
assert(workerMatch[1] === runnerMatch[1], 'runner/Worker confirmation equality')
assert(workerMatch[1] === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE', 'confirmation contract value')
assert(runner.includes('PROBE_HTTP_STATUS="$probe_status"'), 'future HTTP status capture')
assert(runner.includes('PROBE_ERROR="${PROBE_ERROR:0:120}"'), 'future bounded error')
assert(runner.includes('if (( total_rows_read > 250000 )); then'), '250k threshold retained')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup retained')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final 404 retained')
assert(!runner.includes('trap '), 'traps remain forbidden')

assert(trigger.status === 'consumed_probe_response_failed_retired', 'consumed trigger remains retired')
assert(trigger.executionBoundary.mergeExecutesProduction === false, 'consumed trigger cannot execute')
assert(trigger.executionBoundary.newProductionProbeAuthorized === false, 'consumed trigger grants no new probe')
for (const forbidden of [
  '\n  push:',
  'production-reprobe:',
  "github.event_name == 'push'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'actions/upload-artifact',
]) assert(!retiredWorkflow.includes(forbidden), `retired workflow exposes production surface: ${forbidden}`)

const next = decision.authorizedNextWork
assert(next.createExactlyOneNewDormantExecutionPackage === true, 'one dormant package authorized')
assert(next.newPackageMustUseNewAuthority === true, 'new authority required')
assert(next.reuseConsumedTrigger876 === false, 'consumed trigger reuse forbidden')
assert(next.directlyRestoreRetired12A20Workflow === false, 'retired workflow direct restore forbidden')
assert(next.packageMergeExecutesProduction === false, 'package merge cannot execute')
assert(next.separateExactOneFileTriggerRequired === true, 'separate trigger required')
assert(next.triggerMergeRequiresLaterExplicitProductionAuthorization === true, 'later explicit production authorization required')
assert(next.currentUtcDayOnly === true, 'UTC current day only')
assert(next.providerKickOnly === true, 'Kick only')
assert(next.rowsReadMaximum === 250000, 'threshold unchanged')
assert(next.failHardExitCodeAndStageRequired === true, 'fail hard required')
assert(next.cleanupFinallyEquivalentRequired === true, 'cleanup required')
assert(next.postCleanupAggregateRowsRequired === 0, 'post cleanup rows zero')
assert(next.postCleanupProviderLeakageRowsRequired === 0, 'post cleanup leakage zero')
assert(next.postDeleteHttpStatusRequired === 404, 'post delete 404')
assert(next.sanitizedEvidenceOnly === true, 'sanitized evidence only')
assert(next.futureProbeHttpStatusRequired === true, 'future HTTP status required')
assert(next.futureProbeErrorMaximumCharacters === 120, 'future error bound')
assert(Object.values(decision.notAuthorized).every((value) => value === true), 'all not-authorized boundaries must remain true')
assert(decision.acceptance.decisionPrMustBeRepositoryOnly === true, 'decision PR repository-only')
assert(decision.acceptance.decisionPrMustNotAddProductionCapableWorkflow === true, 'decision PR cannot add production workflow')
assert(decision.acceptance.decisionPrMustNotAddTrigger === true, 'decision PR cannot add trigger')

assert(decisionWorkflow.includes('name: Analytics 12A24 Kick History Re-probe Reauthorization Decision'), 'decision workflow name')
assert(decisionWorkflow.includes('pull_request:'), 'PR-only decision workflow')
assert(decisionWorkflow.includes('scripts/verify-12a24-kick-history-category-reprobe-reauthorization-decision.mjs'), 'decision verifier wired')
for (const forbidden of [
  '\n  push:',
  'workflow_dispatch:',
  'schedule:',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'wrangler@4 deploy',
  'actions/upload-artifact',
]) assert(!decisionWorkflow.includes(forbidden), `decision workflow must remain repository-only: ${forbidden}`)

console.log(JSON.stringify({
  phase: decision.phase,
  decision: decision.decision,
  sourceMainSha: decision.sourceMainSha,
  historicalRowsRead: decision.acceptedInputs.historicalCompletedPerformance.rowsRead,
  incompleteReplacementRun: decision.acceptedInputs.incompleteReplacementAttempt.run,
  confirmationValuesMatch: workerMatch[1] === runnerMatch[1],
  authorizeDormantPackageOnly: next.createExactlyOneNewDormantExecutionPackage,
  productionExecutionAuthorized: false,
  separateTriggerRequired: next.separateExactOneFileTriggerRequired,
  laterExplicitProductionAuthorizationRequired: next.triggerMergeRequiresLaterExplicitProductionAuthorization
}, null, 2))
