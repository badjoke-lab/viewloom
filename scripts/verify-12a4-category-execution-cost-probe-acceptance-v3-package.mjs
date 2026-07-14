import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-v3-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const evidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance-v3.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-acceptance-v3-contract-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.trigger.pr, 557)
assert.equal(contract.trigger.headSha, '6228412ddbb202691c69a2313e6cb753c1d11053')
assert.equal(contract.trigger.mergeSha, '741e080187cfc3c92595120e57899d52664dd85e')
assert.equal(contract.trigger.attempt, 3)
assert.equal(contract.trigger.runId, 'category-cost-probe-attempt-3')
assert.deepEqual(contract.trigger.providerOrder, ['twitch', 'kick'])
assert.equal(contract.source.workflow, 'analytics-12a4-category-execution-cost-probe-execution.yml')
assert.equal(contract.source.event, 'push')
assert.equal(contract.source.branch, 'main')
assert.equal(contract.source.headSha, contract.trigger.mergeSha)
assert.equal(contract.source.workflowRunId, 29358245194)
assert.equal(contract.source.artifact, 'phase12a4-category-execution-cost-probe')
assert.equal(contract.source.artifactId, 8321254541)
assert.equal(contract.source.conclusion, 'success')
assert.equal(contract.acceptance.branch, 'accept-analytics-12a4-category-execution-cost-probe-v3')
assert.equal(contract.acceptance.evidence, 'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json')
assert.equal(contract.acceptance.artifact, 'phase12a4-category-execution-cost-probe-acceptance-v3')
assert.equal(contract.acceptance.artifactId, 8321258554)
assert.equal(contract.acceptance.rawFilesRetained, false)
assert.equal(contract.acceptance.successfulMeasurement, true)
assert.deepEqual(contract.requiredSourceJobs, ['contract', 'production-probe'])
assert.equal(contract.readOnlyBoundary, true)
assert.equal(contract.categoryCaptureAuthorized, false)

assert.equal(trigger.attempt, 3)
assert.equal(trigger.runId, contract.trigger.runId)
assert.equal(trigger.executionPackagePr, 555)
assert.equal(trigger.expectedExecutionPackageHeadSha, execution.acceptance.validatedImplementationHeadSha)
assert.equal(trigger.expectedExecutionPackageMergeSha, execution.acceptance.mergeSha)

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-accepted-summary-v1')
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.source.triggerPr, 557)
assert.equal(evidence.source.triggerMergeSha, contract.trigger.mergeSha)
assert.equal(evidence.source.workflowRunId, contract.source.workflowRunId)
assert.equal(evidence.source.artifactId, contract.source.artifactId)
assert.equal(evidence.source.workflowConclusion, 'success')
assert.deepEqual(evidence.providerOrder, ['twitch', 'kick'])

const expected = {
  twitch: {
    d1SqlDurationMs: 1.743,
    workerWallMs: 2010,
    collectorLatencyDeltaMs: 942,
  },
  kick: {
    d1SqlDurationMs: 1.417,
    workerWallMs: 1760,
    collectorLatencyDeltaMs: 9,
  },
}

for (const provider of ['twitch', 'kick']) {
  const item = evidence.providers[provider]
  assert.equal(item.attempted, true)
  assert.equal(item.providerGatePass, true)
  assert.equal(item.categoryGeneratorQueries, 4)
  assert.equal(item.dictionaryFirstPassChanges, 1)
  assert.equal(item.dictionarySecondPassChanges, 0)
  assert.equal(item.probeRowsAfterWrite, 3)
  assert.equal(item.probeCleanupRemainingRows, 0)
  assert.equal(item.providerLeakageRows, 0)
  assert.equal(item.databaseSizeDeltaBytes, 0)
  assert.equal(item.d1Statements, 10)
  assert.equal(item.d1RowsRead, 7)
  assert.equal(item.d1RowsWritten, 10)
  assert.equal(item.d1Changes, 6)
  assert.equal(item.d1SqlDurationMs, expected[provider].d1SqlDurationMs)
  assert.equal(item.workerWallMs, expected[provider].workerWallMs)
  assert.equal(item.collectorLatencyDeltaMs, expected[provider].collectorLatencyDeltaMs)
  assert.equal(item.naturalSnapshotObserved, true)
  assert.equal(item.temporaryWorkerFinalHttpStatus, 404)
}

assert.equal(evidence.gates.providerOrderPass, true)
assert.equal(evidence.gates.twitchGatePass, true)
assert.equal(evidence.gates.kickGatePass, true)
assert.equal(evidence.gates.allReservedRowsRemoved, true)
assert.equal(evidence.gates.providerLeakageRowsZero, true)
assert.equal(evidence.gates.temporaryWorkersDeleted, true)
assert.equal(evidence.gates.categoryCaptureRemainedDisabled, true)
assert.equal(evidence.gates.executionCostProbePass, true)
assert.equal(evidence.gates.runtimeCaptureEnablementAuthorized, false)
assert.equal(evidence.boundaries.persistentProductionCategoryRows, false)
assert.equal(evidence.boundaries.categoryCaptureEnablement, false)
assert.equal(evidence.boundaries.remoteSchemaApply, false)
assert.equal(evidence.boundaries.newCron, false)
assert.equal(evidence.boundaries.backfill, false)
assert.equal(evidence.boundaries.rawRetentionChange, false)

assert.ok(workflow.includes('Verify frozen attempt 3 accepted evidence'))
assert.ok(workflow.includes('check-12a4-category-execution-cost-probe-acceptance-v3-scope.mjs'))
assert.ok(workflow.includes('verify-12a4-category-execution-cost-probe-acceptance-v3-package.mjs'))
assert.ok(workflow.includes('contents: read'))
assert.equal(workflow.includes('actions: read'), false)
assert.equal(workflow.includes('GH_TOKEN'), false)
assert.equal(workflow.includes('gh api'), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.toLowerCase().includes('wrangler'), false)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  attempt: contract.trigger.attempt,
  triggerSha: contract.trigger.mergeSha,
  sourceRunId: contract.source.workflowRunId,
  sourceArtifactId: contract.source.artifactId,
  acceptanceArtifactId: contract.acceptance.artifactId,
  twitch: evidence.providers.twitch,
  kick: evidence.providers.kick,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
}, null, 2))
