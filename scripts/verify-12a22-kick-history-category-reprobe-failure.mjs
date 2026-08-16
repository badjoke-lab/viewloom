#!/usr/bin/env node
import fs from 'node:fs'

const evidencePath = 'docs/audits/12a22-kick-history-category-reprobe-production-failure.json'
const triggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'
const workflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'
const runnerPath = 'scripts/run-12a20-kick-history-category-reprobe.sh'
const kickEntryPath = 'workers/collector-kick/src/entry.ts'
const kickConfigPath = 'workers/collector-kick/wrangler.toml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => {
  if (!value) throw new Error(message)
}

const evidence = json(evidencePath)
const trigger = json(triggerPath)
const workflow = read(workflowPath)
const runner = read(runnerPath)
const kickEntry = read(kickEntryPath)
const kickConfig = read(kickConfigPath)

assert(evidence.schemaVersion === 'viewloom-12a22-kick-history-category-reprobe-failure-v1', 'evidence schema')
assert(evidence.status === 'probe_response_failed_cleanup_safe', 'evidence status')
assert(evidence.phase === '12A-22', 'phase')
assert(evidence.provider === 'kick', 'provider')
assert(evidence.parentProgramIssue === 872, 'program issue')
assert(evidence.executionIssue === 870, 'execution issue')
assert(evidence.acceptanceIssue === 871, 'acceptance issue')
assert(evidence.repairedExecutionPackage.pr === 874, 'package PR')
assert(evidence.repairedExecutionPackage.headSha === '5742bb393486176cf2a2fdf813f2847b869cb0b5', 'package head')
assert(evidence.repairedExecutionPackage.mergeSha === '1bd6959818d7e1ad2079d935c382156c68c7384e', 'package merge')
assert(evidence.repairedExecutionPackage.phase === '12A-21', 'package phase')
assert(evidence.consumedTrigger.pr === 876, 'trigger PR')
assert(evidence.consumedTrigger.headSha === '6ae0e3ad6981d4c4bac1061b8113602ffc9987a0', 'trigger head')
assert(evidence.production.headSha === '273a3b6ceea48a858ece75651ea1c597365aa08c', 'production head')
assert(evidence.production.run === 31959926240, 'production run')
assert(evidence.production.contractJob === 95196241530, 'contract job')
assert(evidence.production.productionJob === 95196294113, 'production job')
assert(evidence.production.artifactId === 9266967900, 'artifact id')
assert(evidence.production.artifactDigest === 'sha256:d9e4dd7387e5ea24a76ddf52eeb5b56f2a539e90914871b36a58cfb81669348a', 'artifact digest')
assert(evidence.production.evidenceJsonSha256 === 'b79c74ba9d0bf0dfbf559afdbbaa3d247e59f49d84cbbf5e6473f6de049a1f08', 'evidence digest')
assert(evidence.production.probeDay === '2026-08-16', 'probe day')

assert(evidence.result.workflowConclusion === 'failure', 'workflow conclusion')
assert(evidence.result.contractConclusion === 'success', 'contract conclusion')
assert(evidence.result.productionJobConclusion === 'failure', 'production job conclusion')
assert(evidence.result.exitCode === 32, 'exit code')
assert(evidence.result.failedAtStage === 'run_probe', 'failure stage')
assert(evidence.result.classification === 'probe_http_non_200_before_cost_measurement', 'failure classification')
assert(evidence.result.costMeasurementCompleted === false, 'cost must be incomplete')
assert(evidence.result.rowsReadMeasured === false, 'rows read must be unmeasured')
assert(evidence.result.rowsRead === null, 'rows read must remain null')
assert(evidence.result.thresholdComparisonAvailable === false, 'threshold comparison unavailable')
assert(evidence.result.performanceDetermination === 'not_measured', 'performance not measured')

assert(evidence.pre.schemaComplete === true, 'schema complete')
assert(evidence.pre.aggregateRows === 0, 'pre aggregate rows')
assert(evidence.pre.providerLeakageRows === 0, 'pre leakage')
assert(evidence.pre.sourceMode === 'authenticated', 'authenticated source')
assert(evidence.cleanup.exitCode === 0, 'cleanup exit')
assert(evidence.cleanup.aggregateRows === 0, 'cleanup aggregate rows')
assert(evidence.cleanup.providerLeakageRows === 0, 'cleanup leakage')
assert(evidence.cleanup.temporaryWorkerDeleted === true, 'worker deleted')
assert(evidence.cleanup.postDeleteHttpStatus === 404, 'worker final 404')
assert(evidence.cleanup.safetyAccepted === true, 'cleanup safety accepted')
assert(evidence.diagnosisBoundary.exactProbeHttpStatusCaptured === false, 'exact non-200 status was not captured')
assert(evidence.diagnosisBoundary.probeResponseBodyRetained === false, 'response body not retained')
assert(evidence.diagnosisBoundary.rawDeployLogsRetained === false, 'raw deploy logs not retained')
assert(evidence.diagnosisBoundary.sanitizedEvidenceOnly === true, 'sanitized evidence only')
assert(evidence.diagnosisBoundary.automaticProductionRerunAuthorized === false, 'automatic rerun forbidden')
assert(evidence.historicalContext.previousProductionRowsRead === 843288, 'historical rows read')
assert(evidence.historicalContext.previousRowsReadMaximum === 250000, 'historical max')
assert(evidence.historicalContext.previousPerformanceResult === 'FAIL', 'historical fail retained')
assert(evidence.historicalContext.repositoryLogicalTouchesWith25PctSafety === 112355, 'repository safety model')
assert(evidence.historicalContext.repositoryModelIsRemoteD1Evidence === false, 'repository model not D1 evidence')
assert(evidence.acceptance.measurementAcceptedAsCompleted === false, 'incomplete measurement not accepted')
assert(evidence.acceptance.performanceAccepted === false, 'performance not accepted')
assert(evidence.acceptance.performanceDetermination === 'not_measured', 'performance determination')
assert(evidence.acceptance.cleanupSafetyAccepted === true, 'cleanup safety')
assert(evidence.acceptance.oneShotAuthorityConsumed === true, 'authority consumed')
assert(evidence.acceptance.oneShotAuthorityMustRetire === true, 'authority retirement required')
assert(evidence.acceptance.newProductionProbeAuthorized === false, 'new probe unauthorized')
assert(evidence.acceptance.permanentGeneratorEnablementAuthorized === false, 'permanent generator unauthorized')
assert(Object.values(evidence.retainedBoundaries).every((value) => value === false), 'retained boundaries')

assert(trigger.schemaVersion === 'viewloom-12a20-kick-history-category-reprobe-trigger-v2', 'trigger schema')
assert(trigger.status === 'consumed_probe_response_failed_retired', 'trigger retired')
assert(trigger.provider === 'kick', 'trigger provider')
assert(trigger.oneTime === true, 'trigger oneTime')
assert(trigger.productionAction === 'retired_no_further_execution', 'trigger action retired')
assert(trigger.executionPackagePhase === '12A-21', 'trigger package phase')
assert(trigger.executionPackagePr === 874, 'trigger package PR')
assert(trigger.expectedExecutionPackageHeadSha === evidence.repairedExecutionPackage.headSha, 'trigger package head')
assert(trigger.executionPackageMergeSha === evidence.repairedExecutionPackage.mergeSha, 'trigger package merge')
assert(trigger.acceptanceIssue === 871, 'trigger acceptance issue')
assert(trigger.consumedBy.triggerPr === evidence.consumedTrigger.pr, 'consumed trigger PR')
assert(trigger.consumedBy.triggerHeadSha === evidence.consumedTrigger.headSha, 'consumed trigger head')
assert(trigger.consumedBy.productionHeadSha === evidence.production.headSha, 'consumed production head')
assert(trigger.consumedBy.productionRun === evidence.production.run, 'consumed run')
assert(trigger.consumedBy.contractJob === evidence.production.contractJob, 'consumed contract job')
assert(trigger.consumedBy.productionJob === evidence.production.productionJob, 'consumed production job')
assert(trigger.consumedBy.artifactId === evidence.production.artifactId, 'consumed artifact id')
assert(trigger.consumedBy.artifactDigest === evidence.production.artifactDigest, 'consumed artifact digest')
assert(trigger.consumedBy.evidenceJsonSha256 === evidence.production.evidenceJsonSha256, 'consumed evidence digest')
assert(trigger.consumedBy.result === evidence.status, 'consumed result')
assert(trigger.consumedBy.exitCode === 32, 'consumed exit')
assert(trigger.consumedBy.failedAtStage === 'run_probe', 'consumed stage')
assert(trigger.consumedBy.costMeasurementCompleted === false, 'consumed incomplete measurement')
assert(trigger.executionBoundary.mergeExecutesProduction === false, 'retired trigger cannot execute')
assert(trigger.executionBoundary.newProductionProbeAuthorized === false, 'new probe remains unauthorized')
assert(trigger.executionBoundary.acceptedRowsReadMaximum === 250000, 'threshold unchanged')
assert(trigger.executionBoundary.thresholdRelaxationAuthorized === false, 'threshold relaxation forbidden')

assert(workflow.includes('name: Analytics 12A20/12A21 Kick History Category Re-probe Retired'), 'retired workflow name')
assert(workflow.includes('pull_request:'), 'PR-only validation required')
assert(workflow.includes(evidencePath), 'failure evidence path must be watched')
assert(workflow.includes('scripts/verify-12a22-kick-history-category-reprobe-failure.mjs'), 'retirement verifier required')
assert(workflow.includes('Production execution path: retired'), 'retirement summary required')
for (const forbidden of [
  '\n  push:',
  'production-reprobe:',
  "github.event_name == 'push'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'secret put PROBE_TOKEN',
  'actions/upload-artifact',
  'Execute one-shot current-day production re-probe',
]) {
  assert(!workflow.includes(forbidden), `retired workflow still exposes production path: ${forbidden}`)
}
assert(!workflow.includes('workflow_dispatch:'), 'manual dispatch forbidden')
assert(!workflow.includes('schedule:'), 'schedule forbidden')

assert(runner.includes('[[ "$probe_status" == \'200\' ]] || return 32'), 'exit 32 mapping must remain auditable')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup remains auditable')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final 404 boundary remains auditable')
assert(!runner.includes('trap '), 'ERR/EXIT trap remains forbidden')
assert(!kickEntry.includes('maybeGenerateKickHistoryCategoryAggregates'), 'permanent generator remains unintegrated')
assert(!kickConfig.includes('HISTORY_CATEGORY'), 'permanent runtime flag remains absent')

console.log(JSON.stringify({
  phase: evidence.phase,
  status: evidence.status,
  productionRun: evidence.production.run,
  productionHeadSha: evidence.production.headSha,
  exitCode: evidence.result.exitCode,
  failedAtStage: evidence.result.failedAtStage,
  performanceDetermination: evidence.result.performanceDetermination,
  cleanupSafetyAccepted: evidence.acceptance.cleanupSafetyAccepted,
  oneShotAuthorityRetired: trigger.status,
  newProductionProbeAuthorized: evidence.acceptance.newProductionProbeAuthorized,
  productionWorkflowRetired: true
}, null, 2))
