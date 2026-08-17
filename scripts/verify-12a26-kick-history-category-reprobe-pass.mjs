#!/usr/bin/env node
import fs from 'node:fs'

const evidencePath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'
const triggerPath = 'docs/audits/12a25-kick-history-category-reprobe-trigger.json'
const workflowPath = '.github/workflows/analytics-12a25-kick-history-category-reprobe-execution.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const evidence = json(evidencePath)
const trigger = json(triggerPath)
const workflow = read(workflowPath)

assert(evidence.schemaVersion === 'viewloom-12a26-kick-history-category-reprobe-production-pass-v1', 'evidence schema')
assert(evidence.phase === '12A-26', 'phase')
assert(evidence.status === 'production_pass_cleanup_safe_authority_retired', 'evidence status')
assert(evidence.provider === 'kick', 'provider')
assert(evidence.performanceDetermination === 'PASS', 'performance determination')

assert(evidence.production.pr === 885, 'production PR')
assert(evidence.production.triggerHeadSha === '05055c195cba0b4259a7fd21db84cec8fdb87fbb', 'trigger head')
assert(evidence.production.headSha === '33819c2ceff36c819d727d0399f85bbd789ba920', 'production head')
assert(evidence.production.run === 31987877725, 'production run')
assert(evidence.production.probeDay === '2026-08-17', 'probe day')

assert(evidence.sourceArtifact.id === 9274330562, 'artifact id')
assert(evidence.sourceArtifact.name === 'phase12a25-kick-history-category-reprobe', 'artifact name')
assert(evidence.sourceArtifact.digest === 'sha256:3885386abd9e9c6f5c578766529aabcf689cd30b95ee342bafebe687ef8d4580', 'artifact digest')
assert(evidence.sourceArtifact.sanitizedEvidenceOnly === true, 'sanitized evidence')

assert(evidence.result.exitCode === 0, 'exit code')
assert(evidence.result.cleanupExitCode === 0, 'cleanup exit code')
assert(evidence.result.failedAtStage === null, 'failed stage')
assert(evidence.result.probeTransport.httpStatus === 200, 'probe HTTP status')
assert(evidence.result.probeTransport.error === null, 'probe HTTP error')

const cost = evidence.result.cost
const thresholds = evidence.thresholds
assert(cost.rowsRead === 16117 && cost.rowsRead > 0 && cost.rowsRead <= thresholds.rowsReadMaximum, 'rows read PASS')
assert(thresholds.rowsReadMaximum === 250000, 'rows read hard maximum')
assert(cost.rowsWritten === 1164 && cost.rowsWritten <= thresholds.rowsWrittenMaximum, 'rows written PASS')
assert(thresholds.rowsWrittenMaximum === 5000, 'rows written maximum')
assert(cost.changes === 583 && cost.changes <= thresholds.changesMaximum, 'changes PASS')
assert(thresholds.changesMaximum === 3000, 'changes maximum')
assert(cost.statements === 24 && cost.statements <= thresholds.statementsMaximum, 'statements PASS')
assert(thresholds.statementsMaximum === 40, 'statements maximum')
assert(cost.wallMs === 2178 && cost.wallMs <= thresholds.workerWallMsMaximum, 'wall time PASS')
assert(thresholds.workerWallMsMaximum === 20000, 'wall maximum')
assert(cost.sizeDelta === 0 && cost.sizeDelta <= thresholds.sizeIncreaseMaximumBytes, 'size delta PASS')
assert(thresholds.sizeIncreaseMaximumBytes === 1048576, 'size maximum')

assert(evidence.pre.schemaComplete === true, 'pre schema complete')
assert(evidence.pre.aggregateRows === 0, 'pre aggregate rows')
assert(evidence.pre.providerLeakageRows === 0, 'pre provider leakage')
assert(evidence.pre.latestSnapshotMinute === '2026-08-17T02:20:00.000Z', 'latest snapshot minute')
assert(evidence.pre.sourceMode === 'authenticated', 'source mode')
assert(evidence.probe.rawCategoryQueryPaths === 3, 'raw category query paths')
assert(evidence.probe.coverageState === 'partial', 'coverage state')
assert(evidence.probe.candidateCategoryRows === 55, 'candidate category rows')
assert(evidence.probe.candidateStreamerCategoryRows === 235, 'candidate streamer category rows')
assert(evidence.probe.generatedCategoryRows === 55, 'generated category rows')
assert(evidence.probe.generatedStreamerCategoryRows === 235, 'generated streamer category rows')
assert(evidence.probe.cleanupSucceeded === true, 'cleanup succeeded')
assert(evidence.postCleanup.aggregateRows === 0, 'post cleanup aggregate rows')
assert(evidence.postCleanup.providerLeakageRows === 0, 'post cleanup leakage')
assert(evidence.temporaryWorkerDeleted === true, 'temporary Worker deleted')
assert(evidence.postDeleteHttpStatus === 404, 'post-delete HTTP status')

assert(evidence.retirement.issue === 887, 'retirement issue')
assert(evidence.retirement.pr === 888, 'retirement PR')
assert(evidence.retirement.mainSha === '3918d5bfc0eacb5d8ab7960231d0726b7812645d', 'retirement main SHA')
assert(evidence.retirement.productionPushRunsOnRetirementSha === 0, 'retirement production runs')
assert(evidence.retirement.triggerConsumed === true, 'trigger consumed evidence')
assert(evidence.retirement.newProductionProbeAuthorized === false, 'no new production authority evidence')

assert(evidence.historicalContext.previousCompletedRowsRead === 843288, 'historical rows read')
assert(evidence.historicalContext.previousCompletedResult === 'FAIL', 'historical result')
assert(evidence.historicalContext.previousCompletedRowsReadMaximum === 250000, 'historical threshold')
assert(evidence.historicalContext.repositoryLogicalTouchesWith25PctSafety === 112355, 'repository model')
assert(evidence.historicalContext.repositoryModelIsRemoteD1Evidence === false, 'repository model boundary')
assert(Object.values(evidence.boundaries).every((value) => value === false), 'no expansion boundary changed')

assert(trigger.schemaVersion === 'viewloom-12a25-kick-history-category-reprobe-trigger-v1', 'trigger schema')
assert(trigger.status === 'consumed_pass_retired', 'trigger status')
assert(trigger.provider === 'kick' && trigger.oneTime === true, 'trigger provider/oneTime')
assert(trigger.executionPackagePhase === '12A-25', 'trigger package phase')
assert(trigger.executionPackagePr === 883, 'trigger package PR')
assert(trigger.expectedExecutionPackageHeadSha === 'cb236ba838f173a3fd0fcc9b10e441e56f4a28e0', 'trigger package head')
assert(trigger.executionPackageMergeSha === '3de3af43f037eba7d22e4e1a479474cee19cf33a', 'trigger package merge')
assert(trigger.authorization.productionExecutionDecisionIssue === 886, 'execution decision issue')
assert(trigger.authorization.executedPr === 885, 'executed PR')
assert(trigger.authorization.executedTriggerHeadSha === evidence.production.triggerHeadSha, 'executed trigger head linkage')
assert(trigger.authorization.productionMergeSha === evidence.production.headSha, 'production merge linkage')
assert(trigger.authorization.productionRun === evidence.production.run, 'production run linkage')
assert(trigger.authorization.consumed === true, 'trigger consumed')
assert(trigger.authorization.newProductionProbeAuthorized === false, 'new probe unauthorized')
assert(trigger.authorization.rerunAuthorized === false, 'rerun unauthorized')
assert(trigger.executionResult.status === 'pass', 'trigger result')
assert(trigger.executionResult.rowsRead === cost.rowsRead, 'trigger rows read')
assert(trigger.executionResult.rowsReadMaximum === thresholds.rowsReadMaximum, 'trigger rows-read threshold')
assert(trigger.executionResult.cleanupExitCode === 0, 'trigger cleanup')
assert(trigger.executionResult.postCleanupAggregateRows === 0, 'trigger post-cleanup rows')
assert(trigger.executionResult.postCleanupProviderLeakageRows === 0, 'trigger post-cleanup leakage')
assert(trigger.executionResult.temporaryWorkerDeleted === true, 'trigger Worker deletion')
assert(trigger.executionResult.postDeleteHttpStatus === 404, 'trigger final HTTP')
assert(trigger.retirement.pr === 888, 'trigger retirement PR')
assert(trigger.retirement.mainSha === evidence.retirement.mainSha, 'trigger retirement SHA')
assert(trigger.retirement.workflowProductionSurfaceRetired === true, 'workflow retired')
assert(trigger.retirement.newProductionProbeAuthorized === false, 'retired no new authority')
assert(trigger.productionBoundary.rowsReadMaximum === 250000, 'trigger hard threshold')
for (const key of [
  'thresholdRelaxationAuthorized',
  'permanentGeneratorEnablementAuthorized',
  'historyCategoryApiAuthorized',
  'historyCategoryUiAuthorized',
  'twitchRolloutAuthorized',
  'crossProviderBehaviorAuthorized'
]) assert(trigger.productionBoundary[key] === false, `trigger retained boundary ${key}`)

assert(workflow.includes('name: Analytics 12A25 Kick History Category Re-probe Retired'), 'retired workflow name')
assert(workflow.includes('pull_request:'), 'retired PR validation')
assert(!workflow.includes('\n  push:'), 'push trigger must remain absent')
for (const forbidden of [
  'production-reprobe:',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'run-12a20-kick-history-category-reprobe.sh'
]) assert(!workflow.includes(forbidden), `retired workflow production surface: ${forbidden}`)
for (const required of [
  evidencePath,
  triggerPath,
  'scripts/verify-12a26-kick-history-category-reprobe-pass.mjs'
]) assert(workflow.includes(required), `retired workflow missing acceptance path: ${required}`)

console.log(JSON.stringify({
  phase: evidence.phase,
  status: evidence.status,
  productionRun: evidence.production.run,
  rowsRead: cost.rowsRead,
  rowsReadMaximum: thresholds.rowsReadMaximum,
  performanceDetermination: evidence.performanceDetermination,
  cleanupExitCode: evidence.result.cleanupExitCode,
  postCleanupAggregateRows: evidence.postCleanup.aggregateRows,
  providerLeakageRows: evidence.postCleanup.providerLeakageRows,
  postDeleteHttpStatus: evidence.postDeleteHttpStatus,
  triggerStatus: trigger.status,
  productionSurfaceRetired: true,
  newProductionProbeAuthorized: false
}, null, 2))
