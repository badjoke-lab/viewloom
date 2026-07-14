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
const probeWorker = read('workers/category-cost-probe/src/index.ts')
const runner = read('scripts/run-12a4-category-execution-cost-probe-provider.mjs')
const runnerTest = read('scripts/test-12a4-category-execution-cost-probe-runner.mjs')
const evidenceTest = read('scripts/test-12a4-category-execution-cost-probe-evidence.mjs')
const evidenceCollector = read('scripts/collect-12a4-category-execution-cost-probe-evidence.mjs')
const evidenceVerifier = read('scripts/verify-12a4-category-execution-cost-probe-evidence.mjs')
const providerVerifier = read('scripts/verify-12a4-category-execution-cost-probe-provider-result.mjs')
const triggerVerifier = read('scripts/verify-12a4-category-execution-cost-probe-trigger.mjs')
const packageScope = read('scripts/check-12a4-category-execution-cost-probe-execution-package-scope.mjs')
const triggerScope = read('scripts/check-12a4-category-execution-cost-probe-trigger-scope.mjs')
const triggerPresent = exists('docs/audits/12a4-category-execution-cost-probe-trigger.json')

assert.equal(execution.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-execution-contract-v1')
assert.equal(execution.status, 'accepted')
assert.equal(execution.trackingIssue, 519)
assert.equal(execution.acceptance.pr, 551)
assert.equal(execution.acceptance.validatedImplementationHeadSha, '6b0ac0f58e41a8f4a8a969b60bad31b4aec18b68')
assert.equal(execution.acceptance.mergeSha, '9f007c5024aa6db7abae8e9d17bea34cfbe8f0d9')
assert.equal(execution.acceptance.workflowRunId, 29355545064)
assert.equal(execution.acceptance.workflowJobId, 87162131023)
assert.equal(execution.acceptance.contractPass, true)
assert.equal(execution.acceptance.productionJobSkippedOnPullRequest, true)
assert.equal(execution.acceptance.readinessRetryValidated, true)
assert.equal(execution.acceptance.explicitAttemptStateValidated, true)
assert.equal(execution.acceptance.missingMeasurementsPreserved, true)
assert.equal(execution.previousAttempt.attempt, 1)
assert.equal(execution.previousAttempt.status, 'accepted_safe_failure')
assert.equal(execution.previousAttempt.probeEndpointCalled, false)
assert.equal(execution.previousAttempt.kickAttempted, false)
assert.equal(execution.previousAttempt.reservedWritesPerformed, false)
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
assert.equal(execution.providerExecution.workerReadinessPollingAttempts, 40)
assert.equal(execution.providerExecution.workerReadinessPollingIntervalSeconds, 5)
assert.equal(execution.providerExecution.naturalSnapshotPollingAttempts, 70)
assert.equal(execution.providerExecution.naturalSnapshotPollingIntervalSeconds, 10)
assert.equal(execution.providerExecution.deleteViaCloudflareServiceApi, true)
assert.equal(execution.providerExecution.deleteInFinally, true)
assert.equal(execution.providerExecution.rawDeploymentLogsInArtifact, false)
assert.equal(execution.sanitizedEvidence.unattemptedProvidersExplicit, true)
assert.equal(execution.sanitizedEvidence.missingMeasurementsCoercedToZero, false)
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

const dictionaryStart = probeWorker.indexOf('async function dictionaryUpsert')
const dictionaryEnd = probeWorker.indexOf('async function inspectProvider')
assert.ok(dictionaryStart >= 0 && dictionaryEnd > dictionaryStart)
const dictionaryBlock = probeWorker.slice(dictionaryStart, dictionaryEnd)
assert.equal(dictionaryBlock.includes('WITH incoming(category_id, category_name)'), false)
assert.equal(dictionaryBlock.includes('FROM incoming'), false)
assert.equal(dictionaryBlock.includes(') VALUES (?, ?, ?, ?, ?, ?)'), true)
assert.match(dictionaryBlock, /`\)\.bind\(\s*env\.PROVIDER,\s*identity\.categoryId,\s*identity\.categoryName,\s*observedAt,\s*observedAt,\s*CATEGORY_CONTRACT_VERSION,/s)
assert.equal(dictionaryBlock.includes('ON CONFLICT(provider, category_id) DO UPDATE SET'), true)

for (const fragment of [
  'snapshotLatencyMs',
  'collectorLatencyDeltaMs',
  'RETRYABLE_HTTP_STATUSES',
  'waitForWorkerHealth',
  'postJsonWithRetry',
  'healthAttempts',
  'inspectAttempts',
  'temporary_worker_preexisting_http_',
  "['dlx', 'wrangler@4', 'deploy'",
  "['dlx', 'wrangler@4', 'secret', 'put', 'PROBE_TOKEN'",
  'deleteService',
  "method: 'DELETE'",
  "'/inspect'",
  "'/probe'",
  "'x-viewloom-confirm': CONFIRMATION",
  'naturalSnapshotObserved',
  'waitForDeleted',
  'finally',
]) {
  assert.equal(runner.includes(fragment), true, `runner missing ${fragment}`)
}
assert.equal(runner.includes("['dlx', 'wrangler@4', 'delete'"), false)
assert.equal(runner.includes('console.log(deploy.output)'), false)
assert.equal(runner.includes('console.log(secret.output)'), false)
assert.equal(runner.includes('CATEGORY_CAPTURE_ENABLED'), false)
assert.equal(runner.includes('REMOTE_SCHEMA_APPLY'), false)

assert.equal(runnerTest.includes('collectorLatencyDeltaMs(before, after), 550'), true)
assert.equal(runnerTest.includes("validateRunId('../not-allowed')"), true)
assert.equal(runnerTest.includes('isRetryableWorkerResponse({ status: 500'), true)
assert.equal(runnerTest.includes('schema_query_failed'), true)
assert.equal(runnerTest.includes("sanitized.includes('secret.workers.dev'), false"), true)
assert.equal(evidenceTest.includes('attemptOneFailure'), true)
assert.equal(evidenceTest.includes('providers.kick.attempted, false'), true)
assert.equal(evidenceCollector.includes('rawProvider?.attempted === true'), true)
assert.equal(evidenceCollector.includes('MISSING_NUMBER'), true)
assert.equal(evidenceVerifier.includes('!item.attempted || !item.lifecycle.probeEndpointCalled'), true)
assert.equal(providerVerifier.includes('lifecycle.healthHttpStatus === 200'), true)
assert.equal(providerVerifier.includes('lifecycle.inspectAttempts'), true)
assert.equal(providerVerifier.includes('lifecycle.naturalSnapshotObserved === true'), true)
assert.equal(providerVerifier.includes('lifecycle.deleteHttpStatus === 404'), true)
assert.equal(providerVerifier.includes('collectorLatencyDeltaMs <= thresholds.collectorLatencyDeltaMsPerProviderMax'), true)
assert.equal(triggerVerifier.includes('trigger.attempt >= 1'), true)
assert.equal(triggerVerifier.includes('accepted_safe_failure'), true)
assert.equal(triggerVerifier.includes('exactExecutionIdentityVerifiedByWorkflowApi'), true)
assert.equal(triggerScope.includes('changed.length !== 1'), true)
assert.equal(triggerScope.includes('execution_package_scope'), true)
assert.equal(packageScope.includes("'scripts/collect-12a4-category-execution-cost-probe-evidence.mjs'"), true)
assert.equal(packageScope.includes("'workers/category-cost-probe/src/index.ts'"), true)

console.log(JSON.stringify({
  ok: true,
  workstream: execution.workstream,
  status: execution.status,
  acceptedPackagePr: execution.acceptedPackage.pr,
  executionPackagePr: execution.acceptance.pr,
  triggerPresent,
  readinessRetry: true,
  serviceApiDelete: true,
  d1CompatibleDictionaryUpsert: true,
  evidenceAttemptedFalsePreserved: true,
  missingMeasurementsNotZeroed: true,
  productionJobOnPullRequest: false,
  productionJobWithoutTrigger: false,
  providerOrder: execution.workflow.providerOrder,
  stopBeforeKickOnTwitchFailure: execution.workflow.stopBeforeKickOnTwitchFailure,
  categoryCaptureEnablement: false,
}, null, 2))
