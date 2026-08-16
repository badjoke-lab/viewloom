#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const contractPath = 'docs/audits/12a20-kick-history-category-reprobe-execution-contract.json'
const repairPath = 'docs/audits/12a21-kick-history-category-reprobe-errexit-repair.json'
const workflowPath = '.github/workflows/analytics-12a20-kick-history-category-reprobe-execution.yml'
const runnerPath = 'scripts/run-12a20-kick-history-category-reprobe.sh'
const triggerPath = 'docs/audits/12a20-kick-history-category-reprobe-trigger.json'

const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const repair = JSON.parse(fs.readFileSync(repairPath, 'utf8'))
const workflow = fs.readFileSync(workflowPath, 'utf8')
const runner = fs.readFileSync(runnerPath, 'utf8')

const assert = (value, message) => {
  if (!value) throw new Error(message)
}

assert(contract.schemaVersion === 'viewloom-12a20-kick-history-category-reprobe-execution-contract-v1', 'schema version')
assert(contract.status === 'dormant_one_shot_package_repaired_no_execution_on_package_merge', 'status')
assert(contract.trackingIssue === 866, 'tracking issue')
assert(contract.repairIssue === 873, 'repair issue')
assert(contract.repairPhase === '12A-21', 'repair phase')
assert(contract.repairAuditFile === repairPath, 'repair audit path')
assert(contract.parentProgramIssue === 872, 'parent program')
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
assert(contract.execution.requiredTriggerPackagePhase === '12A-21', 'repaired trigger phase required')
assert(contract.execution.currentUtcDayOnly === true, 'UTC current day only')
assert(contract.execution.acceptedRowsReadMaximum === 250000, 'threshold unchanged')
assert(contract.execution.thresholdFailureMustExitNonZero === true, 'threshold fail hard')
assert(contract.execution.implicitErrexitInsideCapturedMainAllowed === false, 'implicit captured-main errexit forbidden')
assert(contract.execution.explicitFailureReturnsRequired === true, 'explicit failure returns required')
assert(contract.execution.errTrapAllowed === false, 'ERR trap prohibited')
assert(contract.execution.exitTrapAllowed === false, 'EXIT trap prohibited')
assert(contract.execution.originalFailureCodePreserved === true, 'failure code preservation')
assert(contract.execution.originalFailureStagePreserved === true, 'failure stage preservation')
assert(contract.execution.cleanupFinallyEquivalent === true, 'finally cleanup')
assert(contract.execution.cleanupFailureStillDeletesWorker === true, 'delete on cleanup failure')
assert(contract.execution.postCleanupAggregateRowsRequired === 0, 'cleanup to zero')
assert(contract.execution.postDeleteHttpStatusRequired === 404, 'final 404')
assert(contract.execution.sanitizedEvidenceOnly === true, 'sanitized evidence')
assert(contract.execution.rawDeployLogsUploaded === false, 'deploy logs not uploaded')
assert(contract.execution.oneShotAuthorityRetiredAfterMeasurementRequired === true, 'authority retirement required')
assert(Object.values(contract.retainedBoundaries).every((value) => value === false), 'all expansion boundaries remain false')
assert(contract.futureTriggerFile === triggerPath, 'trigger path')
assert(contract.supersededTriggerPr === 869, 'stale trigger frozen')

assert(repair.schemaVersion === 'viewloom-12a21-kick-history-category-reprobe-errexit-repair-v1', 'repair schema')
assert(repair.status === 'repository_only_repair_no_production_execution', 'repair status')
assert(repair.phase === '12A-21', 'repair phase file')
assert(repair.staleTriggerPr === 869, 'repair stale trigger')
assert(repair.defect.productionExecutedWhileDiscovering === false, 'no production during discovery')
assert(repair.repair.explicitFailureReturnsRequired !== false, 'repair explicit returns')
assert(repair.repair.oldTriggerMustNotMerge === true, 'old trigger invalid')
assert(Object.values(repair.retainedBoundaries).every((value) => value === false), 'repair expansion boundaries remain false')

for (const file of contract.packageFiles) assert(fs.existsSync(file), `missing package file ${file}`)

assert(workflow.includes('pull_request:'), 'PR validation trigger required')
assert(workflow.includes("docs/audits/12a21-kick-history-category-reprobe-errexit-repair.json"), 'repair audit scope required')
assert(workflow.includes("github.event_name == 'push'"), 'production job must require main push')
assert(workflow.includes("executionPackagePhase"), 'repaired package phase pin required')
assert(workflow.includes("== '12A-21'"), '12A21 package phase required')
assert(workflow.includes('CLOUDFLARE_API_TOKEN'), 'production credentials only in production job')
assert(workflow.includes('expectedExecutionPackageHeadSha'), 'exact execution head pin required')
assert(workflow.includes('RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE'), 'confirmation required')
assert(workflow.includes('wrangler@4 deploy --dry-run'), 'PR dry-run required')
assert(!workflow.includes('workflow_dispatch:'), 'manual dispatch forbidden')
assert(!workflow.includes('schedule:'), 'schedule forbidden')

assert(runner.includes('set -Eeuo pipefail'), 'strict shell required')
assert(!runner.includes('trap '), 'ERR/EXIT trap forbidden')
assert(runner.includes("[[ \"$existing\" == '404' ]] || return 12"), 'absent precondition explicit return')
assert(runner.includes("jq -e '.schema.complete == true' \"$RAW/pre.json\" >/dev/null || return 22"), 'schema check explicit return')
assert(runner.includes("jq -e '.checks.postTargetRowsZero == true' \"$RAW/probe.json\" >/dev/null || return 38"), 'probe cleanup check explicit return')
assert(runner.includes('main || {'), 'main failure must be captured explicitly')
assert(runner.includes('MAIN_FAILED_STAGE="$STAGE"'), 'main failure stage must be captured')
assert(runner.includes('cleanup || CLEANUP_RC=$?'), 'cleanup must always be attempted')
assert(runner.includes('FINAL_RC="$MAIN_RC"'), 'original main failure code must seed final status')
assert(runner.includes('FINAL_FAILED_STAGE="$MAIN_FAILED_STAGE"'), 'original main failure stage must seed evidence')
assert(runner.includes('if (( CLEANUP_RC != 0 && FINAL_RC == 0 )); then'), 'cleanup may replace status only when main passed')
assert(runner.includes('if (( total_rows_read > 250000 )); then'), '250k fail-hard branch required')
assert(runner.includes('return 42'), 'threshold failure must have explicit non-zero code')
assert(runner.includes('POST_DELETE_STATUS'), 'post-delete status required')
assert(runner.includes('[[ "$POST_DELETE_STATUS" == "404" ]]'), 'final worker 404 required')
assert(runner.includes('aggregateRows.total'), 'post cleanup row verification required')
assert(runner.includes('evidence.json'), 'sanitized evidence required')
assert(!runner.includes('upload-artifact'), 'runner must not upload raw material')

if (fs.existsSync(triggerPath)) {
  const trigger = JSON.parse(fs.readFileSync(triggerPath, 'utf8'))
  assert(trigger.status === 'armed_for_one_time_main_push', 'trigger status')
  assert(trigger.provider === 'kick', 'trigger provider')
  assert(trigger.oneTime === true, 'trigger oneTime')
  assert(trigger.confirmation === 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_REPROBE', 'trigger confirmation')
  assert(trigger.executionPackagePhase === '12A-21', 'trigger repaired package phase')
  assert(Number.isInteger(trigger.executionPackagePr), 'trigger package PR')
  assert(/^[0-9a-f]{40}$/.test(trigger.expectedExecutionPackageHeadSha), 'trigger exact package head')
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'viewloom-12a21-'))
const mockBin = path.join(tmp, 'bin')
const fixtures = path.join(tmp, 'fixtures')
fs.mkdirSync(mockBin)
fs.mkdirSync(fixtures)

const now = new Date().toISOString()
const pre = {
  ok: true,
  schema: { complete: true },
  aggregateRows: { total: 0 },
  providerLeakageRows: 0,
  latestSnapshot: { collected_at: now, source_mode: 'live', stream_count: 1, bucket_minute: now.slice(0, 16) },
}
const post = { ok: true, schema: { complete: true }, aggregateRows: { total: 0 }, providerLeakageRows: 0 }
const meta = (rowsRead, sizeAfter = 1000) => ({ rowsRead, rowsWritten: 0, changes: 0, statements: 1, sizeAfter })
const probe = {
  ok: true,
  rawCategoryQueryPaths: 3,
  providerLeakageCheck: 'indexed_exists_ranges',
  checks: { aggregateRowsAuthoritative: true, cleanupSucceeded: true, postTargetRowsZero: true },
  pre: { query: meta(100000, 1000) },
  operation: {
    precheck: { meta: meta(100000), candidateCategoryRows: 1, candidateStreamerCategoryRows: 1 },
    pendingWrite: meta(30000),
    writeBatch: meta(30000),
    recoveryBatch: meta(0),
    coverageState: 'complete',
    generatedCategoryRows: 1,
    generatedStreamerCategoryRows: 1,
  },
  during: { query: meta(0) },
  cleanup: meta(0),
  post: { query: meta(0, 1000) },
  workerWallMs: 100,
}
fs.writeFileSync(path.join(fixtures, 'pre.json'), JSON.stringify(pre))
fs.writeFileSync(path.join(fixtures, 'post.json'), JSON.stringify(post))
fs.writeFileSync(path.join(fixtures, 'probe.json'), JSON.stringify(probe))

const curlMock = `#!/usr/bin/env bash
set -euo pipefail
out=''
method='GET'
url=''
while (($#)); do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -w) shift 2 ;;
    -X) method="$2"; shift 2 ;;
    -H|--data) shift 2 ;;
    -sS) shift ;;
    *) url="$1"; shift ;;
  esac
done
if [[ "$url" == *'/workers/services/'* ]]; then
  if [[ "$method" == 'DELETE' ]]; then
    printf '{"success":true}'
    exit 0
  fi
  if [[ "$MOCK_SCENARIO" == 'early_precondition_fail' ]]; then
    printf '200'
    exit 0
  fi
  count_file="$MOCK_STATE_DIR/service_get_count"
  count=0
  [[ -f "$count_file" ]] && count=$(cat "$count_file")
  count=$((count+1))
  printf '%s' "$count" > "$count_file"
  if [[ "$MOCK_SCENARIO" == 'threshold_cleanup_failure' && "$count" -gt 1 ]]; then
    printf '500'
  else
    printf '404'
  fi
  exit 0
fi
if [[ "$url" == */inspect ]]; then
  count_file="$MOCK_STATE_DIR/inspect_count"
  count=0
  [[ -f "$count_file" ]] && count=$(cat "$count_file")
  count=$((count+1))
  printf '%s' "$count" > "$count_file"
  if [[ "$count" -eq 1 ]]; then cp "$MOCK_PRE" "$out"; else cp "$MOCK_POST" "$out"; fi
  printf '200'
  exit 0
fi
if [[ "$url" == */probe ]]; then
  cp "$MOCK_PROBE" "$out"
  printf '200'
  exit 0
fi
echo "unexpected mock curl URL: $url" >&2
exit 90
`
const pnpmMock = `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >> "$MOCK_PNPM_MARKER"
if [[ "$*" == *'wrangler@4 deploy'* ]]; then
  printf 'Uploaded https://mock-reprobe.workers.dev\\n'
  exit 0
fi
if [[ "$*" == *'wrangler@4 secret put'* ]]; then
  cat >/dev/null
  exit 0
fi
exit 91
`
fs.writeFileSync(path.join(mockBin, 'curl'), curlMock, { mode: 0o755 })
fs.writeFileSync(path.join(mockBin, 'pnpm'), pnpmMock, { mode: 0o755 })

const runScenario = (scenario) => {
  const root = path.join(tmp, scenario)
  const state = path.join(root, 'state')
  const artifact = path.join(root, 'artifacts')
  fs.mkdirSync(state, { recursive: true })
  const marker = path.join(root, 'pnpm.log')
  const result = spawnSync('bash', [runnerPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${mockBin}:${process.env.PATH}`,
      MOCK_SCENARIO: scenario,
      MOCK_STATE_DIR: state,
      MOCK_PRE: path.join(fixtures, 'pre.json'),
      MOCK_POST: path.join(fixtures, 'post.json'),
      MOCK_PROBE: path.join(fixtures, 'probe.json'),
      MOCK_PNPM_MARKER: marker,
      ARTIFACT_DIR: artifact,
      GITHUB_WORKSPACE: process.cwd(),
      GITHUB_SHA: '0000000000000000000000000000000000000000',
      CLOUDFLARE_API_TOKEN: 'test-token',
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
    },
  })
  const evidencePath = path.join(artifact, 'evidence.json')
  assert(fs.existsSync(evidencePath), `${scenario}: evidence missing; stderr=${result.stderr}`)
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
  assert(!fs.existsSync(path.join(artifact, 'private')), `${scenario}: private artifacts retained`)
  return { result, evidence, marker }
}

try {
  const early = runScenario('early_precondition_fail')
  assert(early.result.status === 12, `early precondition must exit 12, got ${early.result.status}`)
  assert(early.evidence.exitCode === 12, 'early evidence exit code')
  assert(early.evidence.cleanupExitCode === 0, 'early cleanup exit code')
  assert(early.evidence.failedAtStage === 'verify_absent', 'early failure stage')
  assert(!fs.existsSync(early.marker), 'early failure must not deploy or write secret')

  const threshold = runScenario('threshold_cleanup_success')
  assert(threshold.result.status === 42, `threshold must exit 42, got ${threshold.result.status}`)
  assert(threshold.evidence.exitCode === 42, 'threshold evidence exit code')
  assert(threshold.evidence.cleanupExitCode === 0, 'threshold cleanup success')
  assert(threshold.evidence.failedAtStage === 'measure_thresholds', 'threshold failure stage')
  assert(threshold.evidence.cost.rowsRead === 260000, 'threshold rows read fixture')
  assert(threshold.evidence.postCleanup.aggregateRows === 0, 'threshold cleanup aggregate zero')
  assert(threshold.evidence.temporaryWorkerDeleted === true, 'threshold worker deleted')
  assert(threshold.evidence.postDeleteHttpStatus === 404, 'threshold final 404')
  assert(fs.existsSync(threshold.marker), 'threshold scenario must exercise deploy path')

  const cleanupFailure = runScenario('threshold_cleanup_failure')
  assert(cleanupFailure.result.status === 42, `main failure must survive cleanup failure, got ${cleanupFailure.result.status}`)
  assert(cleanupFailure.evidence.exitCode === 42, 'cleanup-failure final keeps main code')
  assert(cleanupFailure.evidence.cleanupExitCode === 56, 'cleanup failure recorded')
  assert(cleanupFailure.evidence.failedAtStage === 'measure_thresholds', 'cleanup failure must not overwrite main failure stage')
  assert(cleanupFailure.evidence.temporaryWorkerDeleted === false, 'cleanup-failure final status not 404')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

console.log(JSON.stringify({
  phase: contract.phase,
  repairPhase: contract.repairPhase,
  status: contract.status,
  previousRowsRead: contract.previousProductionTruth.rowsRead,
  rowsReadMaximum: contract.execution.acceptedRowsReadMaximum,
  repositoryLogicalTouchesWithSafety: contract.repositoryModel.logicalTouchesWith25PctSafety,
  deterministicFailHardRegression: 'passed',
  productionExecutedByPackage: false,
  separateRepairedTriggerRequired: true,
}, null, 2))
