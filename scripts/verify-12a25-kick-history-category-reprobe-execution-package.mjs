#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a25-kick-history-category-reprobe-execution-contract.json'
const decisionPath = 'docs/audits/12a24-kick-history-category-reprobe-reauthorization-decision.json'
const failurePath = 'docs/audits/12a22-kick-history-category-reprobe-production-failure.json'
const rootCausePath = 'docs/audits/12a23-kick-history-category-reprobe-confirmation-root-cause.json'
const retiredTriggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'
const retiredWorkflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const contract = json(contractPath)
const decision = json(decisionPath)
const failure = json(failurePath)
const rootCause = json(rootCausePath)
const retiredTrigger = json(retiredTriggerPath)
const retiredWorkflow = read(retiredWorkflowPath)
const runner = read(contract.implementation.runner)
const worker = read(contract.implementation.worker)
const workflow = read(contract.implementation.workflow)

assert(contract.schemaVersion === 'viewloom-12a25-kick-history-category-reprobe-execution-contract-v1', 'contract schema')
assert(contract.status === 'dormant_new_authority_no_execution_on_package_merge', 'contract status')
assert(contract.phase === '12A-25', 'phase')
assert(contract.provider === 'kick', 'provider')
assert(contract.trackingIssue === 882, 'tracking issue')
assert(contract.parentProgramIssue === 872, 'parent program')
assert(contract.decision.issue === 880, 'decision issue')
assert(contract.decision.pr === 881, 'decision PR')
assert(contract.decision.headSha === 'c16b15d5c93a6265be67af5e5b77881b048ca2b5', 'decision head')
assert(contract.decision.mergeSha === '0a02ebdb9c928abe026f9ddc63af961612f3b503', 'decision merge')
assert(contract.decision.phase === '12A-24', 'decision phase')
assert(contract.decision.value === 'yes_authorize_exactly_one_new_dormant_measurement_package_only', 'decision value')

assert(decision.schemaVersion === 'viewloom-12a24-kick-history-category-reprobe-reauthorization-decision-v1', 'decision schema linkage')
assert(decision.decision === contract.decision.value, 'decision linkage')
assert(decision.sourceMainSha === 'fdd6aeafc232ff4cd1e14580fc61cc7372cbd3f8', 'decision source main')
assert(decision.authorizedNextWork.createExactlyOneNewDormantExecutionPackage === true, 'dormant package authority')
assert(decision.authorizedNextWork.packageMergeExecutesProduction === false, 'decision package merge boundary')
assert(decision.authorizedNextWork.separateExactOneFileTriggerRequired === true, 'decision trigger boundary')
assert(decision.authorizedNextWork.triggerMergeRequiresLaterExplicitProductionAuthorization === true, 'decision later authorization')
assert(decision.notAuthorized.productionExecution === true, 'production remains unauthorized by decision')

assert(contract.acceptedEvidence.historicalCompletedPerformance.rowsRead === 843288, 'historical rows read')
assert(contract.acceptedEvidence.historicalCompletedPerformance.rowsReadMaximum === 250000, 'historical max')
assert(contract.acceptedEvidence.historicalCompletedPerformance.result === 'FAIL', 'historical fail')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.run === 31959926240, 'replacement run')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.costMeasurementCompleted === false, 'replacement incomplete')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.cleanupExitCode === 0, 'replacement cleanup')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.postCleanupAggregateRows === 0, 'replacement aggregate cleanup')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.postCleanupProviderLeakageRows === 0, 'replacement leakage cleanup')
assert(contract.acceptedEvidence.incompleteReplacementAttempt.postDeleteHttpStatus === 404, 'replacement final 404')
assert(contract.acceptedEvidence.repositoryLogicalTouchesWith25PctSafety === 112355, 'repository model safety')
assert(contract.acceptedEvidence.repositoryCeiling === 125000, 'repository ceiling')
assert(contract.acceptedEvidence.repositoryModelIsRemoteD1Evidence === false, 'repository model boundary')

assert(failure.status === 'probe_response_failed_cleanup_safe', 'failure evidence status')
assert(failure.production.run === contract.acceptedEvidence.incompleteReplacementAttempt.run, 'failure run linkage')
assert(failure.result.costMeasurementCompleted === false, 'failure incomplete linkage')
assert(failure.cleanup.exitCode === 0, 'failure cleanup linkage')
assert(rootCause.status === 'repository_root_cause_confirmed_repair_only', 'root cause status')
assert(rootCause.rootCause.classification === contract.acceptedEvidence.rootCause, 'root cause linkage')
assert(rootCause.repair.runnerConfirmationAfterRepair === contract.implementation.workerProbeConfirmation, 'root cause repair confirmation')

const workerMatch = worker.match(/const CONFIRMATION = '([^']+)'/)
const runnerMatch = runner.match(/^CONFIRM='([^']+)'$/m)
assert(workerMatch && runnerMatch, 'confirmation constants missing')
assert(workerMatch[1] === contract.implementation.workerProbeConfirmation, 'Worker confirmation contract')
assert(runnerMatch[1] === workerMatch[1], 'runner/Worker confirmation equality')
assert(contract.execution.runnerWorkerConfirmationEqualityRequired === true, 'confirmation equality required')
assert(runner.includes('PROBE_HTTP_STATUS="$probe_status"'), 'probe status capture')
assert(runner.includes('PROBE_ERROR="${PROBE_ERROR:0:120}"'), 'bounded probe error capture')
assert(runner.includes('probeTransport:{httpStatus:'), 'sanitized probe transport evidence')
assert(runner.includes('if (( total_rows_read > 250000 )); then'), 'rows read hard gate')
assert(runner.includes('return 42'), 'rows read failure code')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup always attempted')
assert(runner.includes('MAIN_FAILED_STAGE="$STAGE"'), 'failure stage preserved')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final 404 boundary')
assert(runner.includes('rm -rf "$RAW"'), 'private artifacts removed')
assert(!runner.includes('trap '), 'ERR/EXIT traps forbidden')

assert(contract.execution.packageMergeExecutesProduction === false, 'package merge execution forbidden')
assert(contract.execution.productionJobReachableBeforeFutureTriggerMerge === false, 'production unreachable before trigger')
assert(contract.execution.requiresSeparateOneFileTriggerPr === true, 'separate trigger required')
assert(contract.execution.futureTriggerMustPinExecutionPackagePr === true, 'trigger PR pin')
assert(contract.execution.futureTriggerMustPinExactPackageHeadSha === true, 'trigger head pin')
assert(contract.execution.futureTriggerMergeRequiresLaterExplicitProductionAuthorization === true, 'later explicit authorization')
assert(contract.execution.currentUtcDayOnly === true, 'UTC current day')
assert(contract.execution.providerKickOnly === true, 'Kick only')
assert(contract.execution.acceptedRowsReadMaximum === 250000, 'rows-read threshold')
assert(contract.execution.postCleanupAggregateRowsRequired === 0, 'post cleanup rows')
assert(contract.execution.postCleanupProviderLeakageRowsRequired === 0, 'post cleanup leakage')
assert(contract.execution.postDeleteHttpStatusRequired === 404, 'post delete status')
assert(contract.execution.sanitizedEvidenceOnly === true, 'sanitized evidence only')
assert(contract.execution.probeHttpStatusIncludedInSanitizedEvidence === true, 'probe status evidence')
assert(contract.execution.probeErrorMaximumCharacters === 120, 'probe error bound')
assert(contract.execution.rawProbeResponseUploaded === false, 'raw response upload forbidden')
assert(contract.execution.rawDeployLogsUploaded === false, 'raw deploy upload forbidden')
assert(Object.values(contract.retainedBoundaries).every((value) => value === false), 'retained boundaries')

assert(contract.packageFiles.length === 3, 'exact package file count')
for (const path of contract.packageFiles) assert(fs.existsSync(path), `missing package file ${path}`)
const futureTrigger = contract.implementation.futureTriggerFile

assert(workflow.includes('name: Analytics 12A25 Kick History Category Re-probe Execution'), 'workflow name')
assert(workflow.includes('pull_request:'), 'PR validation trigger')
assert(workflow.includes('push:'), 'future one-file push trigger required')
assert(workflow.includes(`- '${futureTrigger}'`), 'future trigger path')
assert(workflow.includes("github.event_name == 'push' && github.ref == 'refs/heads/main'"), 'production push/main gate')
assert(workflow.includes('production-reprobe:'), 'production job definition')
assert(workflow.includes('CLOUDFLARE_API_TOKEN'), 'production token reference')
assert(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), 'production account reference')
assert(workflow.includes('bash scripts/run-12a20-kick-history-category-reprobe.sh'), 'fail-hard runner execution')
assert(workflow.includes('actions/upload-artifact@v4'), 'sanitized artifact upload')
assert(workflow.includes('artifacts/12a20-kick-history-category-reprobe/evidence.json'), 'evidence-only upload path')
assert(workflow.includes(contract.implementation.executionTriggerConfirmation), 'trigger confirmation')
assert(workflow.includes("executionPackagePhase"), 'package phase pin')
assert(workflow.includes("'12A-25'"), '12A25 trigger phase')
assert(workflow.includes('expectedExecutionPackageHeadSha'), 'exact package head pin')
assert(workflow.includes('wrangler@4 deploy --dry-run'), 'PR dry-run only')
assert(!workflow.includes('workflow_dispatch:'), 'manual dispatch forbidden')
assert(!workflow.includes('schedule:'), 'schedule forbidden')

const pushBlock = workflow.match(/push:\n[\s\S]*?permissions:/)?.[0] ?? ''
assert(pushBlock.includes(`- '${futureTrigger}'`), 'push is trigger-file scoped')
for (const packagePath of contract.packageFiles) assert(!pushBlock.includes(packagePath), `package merge must not match push scope: ${packagePath}`)

assert(retiredTrigger.status === 'consumed_probe_response_failed_retired', 'old trigger remains retired')
assert(retiredTrigger.executionBoundary.mergeExecutesProduction === false, 'old trigger cannot execute')
assert(retiredTrigger.executionBoundary.newProductionProbeAuthorized === false, 'old trigger no new authority')
assert(retiredWorkflow.includes('Kick History Category Re-probe Retired'), 'old workflow remains retired')
for (const forbidden of ['\n  push:', 'production-reprobe:', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) {
  assert(!retiredWorkflow.includes(forbidden), `old retired workflow exposed: ${forbidden}`)
}

if (fs.existsSync(futureTrigger)) {
  const trigger = json(futureTrigger)
  assert(trigger.schemaVersion === 'viewloom-12a25-kick-history-category-reprobe-trigger-v1', 'future trigger schema')
  assert(trigger.status === 'armed_for_one_time_main_push', 'future trigger status')
  assert(trigger.provider === 'kick', 'future trigger provider')
  assert(trigger.oneTime === true, 'future trigger oneTime')
  assert(trigger.confirmation === contract.implementation.executionTriggerConfirmation, 'future trigger confirmation')
  assert(trigger.executionPackagePhase === '12A-25', 'future trigger phase')
  assert(Number.isInteger(trigger.executionPackagePr) && trigger.executionPackagePr > 0, 'future trigger package PR')
  assert(/^[0-9a-f]{40}$/.test(trigger.expectedExecutionPackageHeadSha), 'future trigger package head')
} else {
  assert(contract.acceptance.packagePrContainsTrigger === false, 'package must omit trigger')
}

console.log(JSON.stringify({
  phase: contract.phase,
  status: contract.status,
  trackingIssue: contract.trackingIssue,
  decisionPr: contract.decision.pr,
  packageFiles: contract.packageFiles,
  futureTriggerPresent: fs.existsSync(futureTrigger),
  runnerWorkerConfirmationMatch: runnerMatch[1] === workerMatch[1],
  rowsReadMaximum: contract.execution.acceptedRowsReadMaximum,
  packageMergeExecutesProduction: contract.execution.packageMergeExecutesProduction,
  productionReachableBeforeTriggerMerge: contract.execution.productionJobReachableBeforeFutureTriggerMerge,
  laterExplicitProductionAuthorizationRequired: contract.execution.futureTriggerMergeRequiresLaterExplicitProductionAuthorization
}, null, 2))
