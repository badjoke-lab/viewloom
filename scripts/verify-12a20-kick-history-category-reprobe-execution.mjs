#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a20-kick-history-category-reprobe-execution-contract.json'
const workflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'
const runnerPath = 'scripts/run-12a20-kick-history-category-reprobe.sh'
const triggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')

const assert = (value, message) => {
  if (!value) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a20-kick-history-category-reprobe-execution-contract-v1', 'schema version')
assert(contract.status === 'dormant_one_shot_package_no_execution_on_package_merge', 'status')
assert(contract.trackingIssue === 866, 'tracking issue')
assert(contract.parentDecisionIssue === 864, 'decision issue')
assert(contract.authorizationPr === 865, 'authorization PR')
assert(contract.authorizationHeadSha === '4b274da37a62e027a06f4e5d4f5d5a67b8247c3f', 'authorization head')
assert(contract.authorizationMergeSha === 'fbb6c2b3d44533aeab7618c715a96323201fc0b3', 'authorization merge')
assert(contract.provider === 'kick', 'provider')
assert(contract.previousProductionTruth.rowsRead === 843288, 'previous rows read')
assert(contract.previousProductionTruth.rowsReadMaximum === 250000, 'previous maximum')
assert(contract.previousProductionTruth.status === 'performance_failed_cleanup_safe', 'previous failure retained')
assert(contract.repositoryModel.rawCategoryPaths === 3, 'raw paths')
assert(contract.repositoryModel.logicalTouchesWith25PctSafety === 112355, 'repository safety model')
assert(contract.repositoryModel.isRemoteD1Evidence === false, 'repository model remote evidence boundary')
assert(contract.execution.packageMergeExecutesProduction === false, 'package merge must not execute')
assert(contract.execution.requiresSeparateOneFileTriggerPr === true, 'separate trigger required')
assert(contract.execution.currentUtcDayOnly === true, 'UTC current day only')
assert(contract.execution.acceptedRowsReadMaximum === 250000, 'threshold unchanged')
assert(contract.execution.thresholdFailureMustExitNonZero === true, 'threshold fail hard')
assert(contract.execution.errTrapAllowed === false, 'ERR trap prohibited')
assert(contract.execution.originalFailureCodePreserved === true, 'failure code preservation')
assert(contract.execution.cleanupFinallyEquivalent === true, 'finally cleanup')
assert(contract.execution.cleanupFailureStillDeletesWorker === true, 'delete on cleanup failure')
assert(contract.execution.postCleanupAggregateRowsRequired === 0, 'cleanup to zero')
assert(contract.execution.postDeleteHttpStatusRequired === 404, 'final 404')
assert(contract.execution.sanitizedEvidenceOnly === true, 'sanitized evidence')
assert(contract.execution.rawDeployLogsUploaded === false, 'deploy logs not uploaded')
assert(contract.execution.oneShotAuthorityRetiredAfterMeasurementRequired === true, 'authority retirement required')
assert(Object.values(contract.retainedBoundaries).every((value) => value === false), 'all expansion boundaries remain false')
assert(contract.futureTriggerFile === triggerPath, 'trigger path')

for (const file of contract.packageFiles) assert(fs.existsSync(file), `missing package file ${file}`)

assert(workflow.includes('pull_request:'), 'PR validation trigger required')
assert(workflow.includes("docs/audits/12a20-kick-history-category-reprobe-trigger.json"), 'future trigger path required')
assert(workflow.includes("github.event_name == 'push'"), 'production job must require main push')
assert(workflow.includes('CLOUDFLARE_API_TOKEN'), 'production credentials only in production job')
assert(workflow.includes('expectedExecutionPackageHeadSha'), 'exact execution head pin required')
assert(workflow.includes('RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE'), 'confirmation required')
assert(workflow.includes('wrangler@4 deploy --dry-run'), 'PR dry-run required')
assert(!workflow.includes('workflow_dispatch:'), 'manual dispatch forbidden')
assert(!workflow.includes('schedule:'), 'schedule forbidden')

assert(runner.includes('set -Eeuo pipefail'), 'strict shell required')
assert(!runner.includes('trap '), 'ERR/EXIT trap forbidden')
assert(runner.includes('main || MAIN_RC=$?'), 'main failure code must be captured')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup must always be attempted')
assert(runner.includes('FINAL_RC="$MAIN_RC"'), 'original main failure code must seed final status')
assert(runner.includes('if (( CLEANUP_RC != 0 && FINAL_RC == 0 )); then'), 'cleanup may replace status only when main passed')
assert(runner.includes('if (( total_rows_read > 250000 )); then'), '250k fail-hard branch required')
assert(runner.includes('return 42'), 'threshold failure must have explicit non-zero code')
assert(runner.includes('POST_DELETE_STATUS'), 'post-delete status required')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final worker 404 required')
assert(runner.includes('aggregateRows.total'), 'post cleanup row verification required')
assert(runner.includes('evidence.json'), 'sanitized evidence required')
assert(!runner.includes('upload-artifact'), 'runner must not upload raw material')

if (!fs.existsSync(triggerPath)) {
  assert(true, 'package remains dormant without trigger')
} else {
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  assert(trigger.status === 'armed_for_one_time_main_push', 'trigger status')
  assert(trigger.provider === 'kick', 'trigger provider')
  assert(trigger.oneTime === true, 'trigger oneTime')
  assert(trigger.confirmation === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE', 'trigger confirmation')
  assert(Number.isInteger(trigger.executionPackagePr), 'trigger package PR')
  assert(/^[0-9a-f]{40}$/.test(trigger.expectedExecutionPackageHeadSha), 'trigger exact package head')
}

console.log(JSON.stringify({
  phase: contract.phase,
  status: contract.status,
  previousRowsRead: contract.previousProductionTruth.rowsRead,
  rowsReadMaximum: contract.execution.acceptedRowsReadMaximum,
  repositoryLogicalTouchesWithSafety: contract.repositoryModel.logicalTouchesWith25PctSafety,
  productionExecutedByPackage: false,
  separateTriggerRequired: true,
}, null, 2))
