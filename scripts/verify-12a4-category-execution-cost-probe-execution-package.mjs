import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(path.join(root, file))

const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const packageContract = json('docs/audits/12a4-category-execution-cost-probe-package-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-execution.yml')
const runner = read('scripts/run-12a4-category-execution-cost-probe-provider.mjs')
const runnerTest = read('scripts/test-12a4-category-execution-cost-probe-runner.mjs')
const providerVerifier = read('scripts/verify-12a4-category-execution-cost-probe-provider-result.mjs')
const triggerVerifier = read('scripts/verify-12a4-category-execution-cost-probe-trigger.mjs')
const packageScope = read('scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs')
const triggerScope = read('scripts/check-12a4-category-execution-cost-probe-trigger-scope.mjs')
const triggerPresent = exists('docs/audits/12a4-category-execution-cost-probe-trigger.json')

assert.equal(execution.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-execution-contract-v1')
assert.ok(['candidate', 'accepted'].includes(execution.status))
assert.equal(execution.trackingIssue, 519)
assert.equal(execution.acceptedPackage.pr, 547)
assert.equal(execution.acceptedPackage.headSha, '4556a5708ec3a33cd4b1835ca9e32baf78c5690d')
assert.equal(execution.acceptedPackage.mergeSha, 'cb2673eec8424288bbee7b4403c415261926097a')
assert.equal(execution.acceptedPackage.packageValidationRunId, 29337837976)
assert.equal(execution.acceptedPackage.twitchWorkerDryRun, true)
assert.equal(execution.acceptedPackage.kickWorkerDryRun, true)
assert.deepEqual(execution.workflow.providerOrder, ['twitch', 'kick'])
assert.equal(execution.workflow.stopBeforeKickOnTwitchFailure, true)
assert.equal(execution.workflow.productionJobOnPullRequest, false)
assert.equal(execution.workflow.productionJobWithoutTrigger, false)
assert.equal(execution.providerExecution.temporaryWorkerPreconditionHttpStatus, 404)
assert.equal(execution.providerExecution.temporaryWorkerPostDeleteHttpStatus, 404)
assert.equal(execution.providerExecution.naturalSnapshotPollingAttempts, 70)
assert.equal(execution.providerExecution.naturalSnapshotPollingIntervalSeconds, 10)
assert.equal(execution.providerExecution.deleteInFinally, true)
assert.equal(execution.providerExecution.rawDeploymentLogsInArtifact, false)
assert.deepEqual(execution.requiredSecrets, ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'])
assert.equal(Object.values(execution.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 547)
assert.equal(packageContract.acceptance.packageValidationPass, true)
assert.equal(packageContract.pullRequestBoundary.productionExecution, false)
assert.equal(packageContract.pullRequestBoundary.categoryCaptureEnablement, false)

assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(workflow.includes("paths:\n      - 'docs/audits/12a4-category-execution-cost-probe-trigger.json'"), true)
assert.equal(workflow.includes("github.event_name == 'push'"), true)
assert.equal(workflow.includes("needs.contract.outputs.armed == 'true'"), true)
assert.equal(workflow.includes("if: steps.twitch-gate.outcome == 'success'"), true)
assert.equal(workflow.includes('skipped_after_twitch_gate_failure'), true)
assert.equal(workflow.includes('run-12a4-category-execution-cost-probe-provider.mjs'), true)
assert.equal(workflow.includes('verify-12a4-category-execution-cost-probe-provider-result.mjs'), true)
assert.equal(workflow.includes('collect-12a4-category-execution-cost-probe-evidence.mjs'), true)
assert.equal(workflow.includes('verify-12a4-category-execution-cost-probe-evidence.mjs "$ARTIFACT_DIR/evidence.json" --require-pass'), true)
assert.equal(workflow.includes('actions/upload-artifact@v4'), true)
assert.ok(workflow.indexOf('actions/upload-artifact@v4') < workflow.indexOf('Enforce final provider-separated acceptance'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'), true)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'), true)
assert.equal(workflow.includes('production-probe:'), true)
assert.equal(workflow.includes('workflow_dispatch:'), true)
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

for (const fragment of [
  'snapshotLatencyMs',
  'collectorLatencyDeltaMs',
  'temporary_worker_preexisting_http_',
  "['dlx', 'wrangler@4', 'deploy'",
  "['dlx', 'wrangler@4', 'secret', 'put', 'PROBE_TOKEN'",
  "['dlx', 'wrangler@4', 'delete'",
  "'/inspect'",
  "'/probe'",
  "'x-viewloom-confirm': CONFIRMATION",
  'naturalSnapshotObserved',
  'waitForDeleted',
  'finally',
]) {
  assert.equal(runner.includes(fragment), true, `runner missing ${fragment}`)
}
assert.equal(runner.includes('console.log(deploy.output)'), false)
assert.equal(runner.includes('console.log(secret.output)'), false)
assert.equal(runner.includes('CATEGORY_CAPTURE_ENABLED'), false)
assert.equal(runner.includes('REMOTE_SCHEMA_APPLY'), false)

assert.equal(runnerTest.includes('collectorLatencyDeltaMs(before, after), 550'), true)
assert.equal(runnerTest.includes("validateRunId('../not-allowed')"), true)
assert.equal(runnerTest.includes("sanitized.includes('secret.workers.dev'), false"), true)
assert.equal(providerVerifier.includes('lifecycle.naturalSnapshotObserved === true'), true)
assert.equal(providerVerifier.includes('lifecycle.deleteHttpStatus === 404'), true)
assert.equal(providerVerifier.includes('collectorLatencyDeltaMs <= thresholds.collectorLatencyDeltaMsPerProviderMax'), true)
assert.equal(triggerVerifier.includes('RUN_BOUNDED_CATEGORY_EXECUTION_COST_PROBE'), true)
assert.equal(triggerVerifier.includes('expectedExecutionPackageMergeSha'), true)
assert.equal(triggerScope.includes('changed.length !== 1'), true)
assert.equal(packageScope.includes("'scripts/verify-12a4-category-execution-cost-probe-trigger.mjs'"), true)

if (!triggerPresent) {
  assert.equal(execution.status, 'candidate')
}

console.log(JSON.stringify({
  ok: true,
  workstream: execution.workstream,
  status: execution.status,
  acceptedPackagePr: execution.acceptedPackage.pr,
  triggerPresent,
  productionJobOnPullRequest: false,
  productionJobWithoutTrigger: false,
  providerOrder: execution.workflow.providerOrder,
  stopBeforeKickOnTwitchFailure: execution.workflow.stopBeforeKickOnTwitchFailure,
  rawDeploymentLogsInArtifact: execution.providerExecution.rawDeploymentLogsInArtifact,
  categoryCaptureEnablement: false,
}, null, 2))
