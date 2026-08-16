#!/usr/bin/env node
import fs from 'node:fs'

const auditPath = 'docs/audits/12a23-kick-history-category-reprobe-confirmation-root-cause.json'
const failurePath = 'docs/audits/12a22-kick-history-category-reprobe-production-failure.json'
const runnerPath = 'scripts/run-12a20-kick-history-category-reprobe.sh'
const workerPath = 'workers/history-category-aggregate-cost-probe/src/index.ts'
const retiredWorkflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'
const triggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => {
  if (!value) throw new Error(message)
}

const audit = json(auditPath)
const failure = json(failurePath)
const trigger = json(triggerPath)
const runner = read(runnerPath)
const worker = read(workerPath)
const retiredWorkflow = read(retiredWorkflowPath)

assert(audit.schemaVersion === 'viewloom-12a23-kick-history-category-reprobe-confirmation-root-cause-v1', 'audit schema')
assert(audit.status === 'repository_root_cause_confirmed_repair_only', 'audit status')
assert(audit.phase === '12A-23', 'phase')
assert(audit.provider === 'kick', 'provider')
assert(audit.trackingIssue === 878, 'tracking issue')
assert(audit.parentProgramIssue === 872, 'parent program')
assert(audit.productionReference.headSha === '273a3b6ceea48a858ece75651ea1c597365aa08c', 'production head')
assert(audit.productionReference.run === 31959926240, 'production run')
assert(audit.productionReference.productionJob === 95196294113, 'production job')
assert(audit.productionReference.exitCode === 32, 'production exit')
assert(audit.productionReference.failedAtStage === 'run_probe', 'production stage')
assert(audit.productionReference.costMeasurementCompleted === false, 'measurement incomplete')
assert(audit.productionReference.sanitizedEvidenceCapturedExactHttpStatus === false, 'old evidence did not capture status')

assert(audit.rootCause.classification === 'confirmation_header_contract_mismatch', 'root cause classification')
assert(audit.rootCause.certainty === 'deterministic_from_exact_production_code', 'root cause certainty')
assert(audit.rootCause.workerConfirmationAtProductionHead === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE', 'old worker confirm')
assert(audit.rootCause.runnerConfirmationAtProductionHead === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE', 'old runner confirm')
assert(audit.rootCause.valuesMatchedAtProductionHead === false, 'old values must differ')
assert(audit.rootCause.workerMismatchBehavior.httpStatus === 409, 'mismatch status')
assert(audit.rootCause.workerMismatchBehavior.error === 'confirmation_required', 'mismatch error')
assert(audit.rootCause.workerMismatchBehavior.occursBeforeRunProbe === true, 'mismatch before operation')

assert(failure.schemaVersion === 'viewloom-12a22-kick-history-category-reprobe-failure-v1', 'failure schema')
assert(failure.status === 'probe_response_failed_cleanup_safe', 'accepted failure')
assert(failure.production.headSha === audit.productionReference.headSha, 'failure head linkage')
assert(failure.production.run === audit.productionReference.run, 'failure run linkage')
assert(failure.result.exitCode === 32, 'failure exit linkage')
assert(failure.result.failedAtStage === 'run_probe', 'failure stage linkage')
assert(failure.result.costMeasurementCompleted === false, 'failure cost incomplete')
assert(failure.cleanup.exitCode === 0, 'cleanup safe')
assert(failure.cleanup.aggregateRows === 0, 'cleanup rows zero')
assert(failure.cleanup.providerLeakageRows === 0, 'cleanup leakage zero')
assert(failure.cleanup.postDeleteHttpStatus === 404, 'cleanup final 404')

const workerMatch = worker.match(/const CONFIRMATION = '([^']+)'/)
const runnerMatch = runner.match(/^CONFIRM='([^']+)'$/m)
assert(workerMatch, 'worker confirmation constant missing')
assert(runnerMatch, 'runner confirmation constant missing')
const workerConfirmation = workerMatch[1]
const runnerConfirmation = runnerMatch[1]
assert(workerConfirmation === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE', 'worker confirmation changed unexpectedly')
assert(runnerConfirmation === workerConfirmation, 'runner/Worker confirmation mismatch')
assert(audit.repair.workerContractValue === workerConfirmation, 'audit worker repair value')
assert(audit.repair.runnerConfirmationAfterRepair === runnerConfirmation, 'audit runner repair value')
assert(audit.repair.requireStaticEqualityCheck === true, 'static equality required')
assert(!runner.includes("CONFIRM='RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE'"), 'old re-probe confirmation must be absent from runner')
assert(worker.includes("request.headers.get('x-viewloom-confirm') !== CONFIRMATION"), 'Worker confirmation gate missing')
assert(worker.includes("error: 'confirmation_required'"), 'Worker mismatch error missing')
assert(worker.indexOf("request.headers.get('x-viewloom-confirm') !== CONFIRMATION") < worker.indexOf('const result = await runProbe'), 'confirmation gate must precede runProbe')
assert(worker.includes("return out({ ok: false, error: 'confirmation_required' }, 409)"), 'Worker 409 mismatch behavior')
assert(runner.includes('-H "x-viewloom-confirm: $CONFIRM"'), 'runner confirmation header')

assert(runner.includes('PROBE_HTTP_STATUS=-1'), 'probe status state')
assert(runner.includes("PROBE_ERROR=''"), 'probe error state')
assert(runner.includes('PROBE_HTTP_STATUS="$probe_status"'), 'probe HTTP status capture')
assert(runner.includes('PROBE_ERROR="${PROBE_ERROR:0:120}"'), 'probe error bound')
assert(runner.includes('--argjson probeHttpStatus "$PROBE_HTTP_STATUS"'), 'sanitized status evidence')
assert(runner.includes('--arg probeError "$PROBE_ERROR"'), 'sanitized error evidence')
assert(runner.includes('probeTransport:{httpStatus:'), 'probe transport evidence object')
assert(audit.repair.futureSanitizedProbeHttpStatus === true, 'audit status capture')
assert(audit.repair.futureSanitizedProbeErrorMaximumCharacters === 120, 'audit error bound')
assert(audit.repair.rawProbeResponseRetained === false, 'raw response retention forbidden')
assert(audit.repair.rawDeployLogsRetained === false, 'raw deploy retention forbidden')
assert(audit.repair.privateArtifactsDeleted === true, 'private artifacts deleted')
assert(runner.includes('rm -rf "$RAW"'), 'private artifacts deletion')
assert(runner.includes('[[ "$probe_status" == \'200\' ]] || return 32'), 'non-200 fail hard')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup always attempted')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final 404 boundary')
assert(runner.includes('if (( total_rows_read > 250000 )); then'), 'rows read threshold')
assert(runner.includes('return 42'), 'rows read threshold fail-hard')
assert(!runner.includes('trap '), 'ERR/EXIT traps forbidden')

assert(trigger.status === 'consumed_probe_response_failed_retired', 'trigger remains retired')
assert(trigger.executionBoundary.mergeExecutesProduction === false, 'retired trigger cannot execute')
assert(trigger.executionBoundary.newProductionProbeAuthorized === false, 'new production probe unauthorized')
assert(retiredWorkflow.includes('name: Analytics 12A20/12A21 Kick History Category Re-probe Retired'), 'retired workflow name')
for (const forbidden of [
  '\n  push:',
  'production-reprobe:',
  "github.event_name == 'push'",
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'actions/upload-artifact',
]) assert(!retiredWorkflow.includes(forbidden), `retired workflow exposes production surface: ${forbidden}`)

assert(audit.authorization.repositoryRepairAuthorized === true, 'repository repair authorized')
assert(audit.authorization.productionWorkflowReenabled === false, 'production workflow remains retired')
assert(audit.authorization.newProductionProbeAuthorized === false, 'new production probe unauthorized')
assert(audit.authorization.newTriggerAuthorized === false, 'new trigger unauthorized')
assert(audit.authorization.permanentGeneratorEnablementAuthorized === false, 'generator unauthorized')
assert(audit.authorization.thresholdRelaxationAuthorized === false, 'threshold relaxation unauthorized')
assert(Object.values(audit.retainedBoundaries).every((value) => value === false), 'retained boundaries')

console.log(JSON.stringify({
  phase: audit.phase,
  rootCause: audit.rootCause.classification,
  productionRun: audit.productionReference.run,
  oldRunnerConfirmation: audit.rootCause.runnerConfirmationAtProductionHead,
  workerConfirmation,
  repairedRunnerConfirmation: runnerConfirmation,
  confirmationValuesMatch: runnerConfirmation === workerConfirmation,
  futureSanitizedProbeHttpStatus: audit.repair.futureSanitizedProbeHttpStatus,
  futureSanitizedProbeErrorMaximumCharacters: audit.repair.futureSanitizedProbeErrorMaximumCharacters,
  productionWorkflowReenabled: audit.authorization.productionWorkflowReenabled,
  newProductionProbeAuthorized: audit.authorization.newProductionProbeAuthorized
}, null, 2))
