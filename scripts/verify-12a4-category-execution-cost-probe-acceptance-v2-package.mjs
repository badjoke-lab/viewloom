import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-v2-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const evidence = json('docs/audits/12a4-category-execution-cost-probe-attempt-2-evidence.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance-v2.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-acceptance-v2-contract-v1')
assert.equal(contract.status, 'accepted_safe_failure')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.trigger.pr, 553)
assert.equal(contract.trigger.headSha, 'a3e9cdcf80bacc9e349c7db3ec4b855c6ad9d31f')
assert.equal(contract.trigger.mergeSha, 'e453053e23f5b4b930a736570d42cdbc1ff664a0')
assert.equal(contract.trigger.attempt, 2)
assert.equal(contract.trigger.runId, 'category-cost-probe-attempt-2')
assert.deepEqual(contract.trigger.providerOrder, ['twitch', 'kick'])
assert.equal(contract.source.workflow, 'analytics-12a4-category-execution-cost-probe-execution.yml')
assert.equal(contract.source.event, 'push')
assert.equal(contract.source.branch, 'main')
assert.equal(contract.source.headSha, contract.trigger.mergeSha)
assert.equal(contract.source.workflowRunId, 29356246266)
assert.equal(contract.source.artifact, 'phase12a4-category-execution-cost-probe')
assert.equal(contract.source.artifactId, 8320272101)
assert.equal(contract.source.conclusion, 'failure')
assert.equal(contract.acceptance.branch, 'accept-analytics-12a4-category-execution-cost-probe-v2')
assert.equal(contract.acceptance.evidence, 'docs/audits/12a4-category-execution-cost-probe-attempt-2-evidence.json')
assert.equal(contract.acceptance.rawFilesRetained, false)
assert.equal(contract.acceptance.successfulMeasurement, false)
assert.equal(contract.acceptance.safeFailureAccepted, true)
assert.deepEqual(contract.requiredSourceJobs, ['contract', 'production-probe'])
assert.equal(contract.readOnlyBoundary, true)
assert.equal(contract.categoryCaptureAuthorized, false)

assert.equal(trigger.attempt, 2)
assert.equal(trigger.runId, contract.trigger.runId)
assert.equal(trigger.executionPackagePr, 551)
assert.equal(trigger.expectedExecutionPackageHeadSha, execution.acceptance.validatedImplementationHeadSha)
assert.equal(trigger.expectedExecutionPackageMergeSha, execution.acceptance.mergeSha)

assert.equal(evidence.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-safe-failure-v1')
assert.equal(evidence.status, 'accepted_safe_failure')
assert.equal(evidence.source.triggerPr, 553)
assert.equal(evidence.source.triggerMergeSha, contract.trigger.mergeSha)
assert.equal(evidence.source.workflowRunId, contract.source.workflowRunId)
assert.equal(evidence.source.artifactId, contract.source.artifactId)
assert.equal(evidence.source.workflowConclusion, 'failure')
assert.equal(evidence.twitch.attempted, true)
assert.equal(evidence.twitch.preconditionsPassed, true)
assert.equal(evidence.twitch.healthHttpStatus, 200)
assert.equal(evidence.twitch.inspectHttpStatus, 200)
assert.equal(evidence.twitch.probeHttpStatus, 409)
assert.equal(evidence.twitch.failureCode, 'dictionary_upsert_sql_syntax')
assert.equal(evidence.twitch.categoryGeneratorQueries, 0)
assert.equal(evidence.twitch.dictionaryFirstPassChanges, 0)
assert.equal(evidence.twitch.probeRowsAfterWrite, 0)
assert.equal(evidence.twitch.d1RowsWritten, 0)
assert.equal(evidence.twitch.d1Changes, 0)
assert.equal(evidence.twitch.databaseSizeDeltaBytes, 0)
assert.equal(evidence.twitch.cleanupRemainingRows, 0)
assert.equal(evidence.twitch.providerLeakageRows, 0)
assert.equal(evidence.twitch.temporaryWorkerFinalHttpStatus, 404)
assert.equal(evidence.kick.attempted, false)
assert.equal(evidence.kick.reason, 'stopped_after_twitch_gate_failure')
assert.equal(evidence.gates.reservedRowsRemainingZero, true)
assert.equal(evidence.gates.providerLeakageZero, true)
assert.equal(evidence.gates.temporaryWorkersDeleted, true)
assert.equal(evidence.gates.categoryCaptureRemainedDisabled, true)
assert.equal(evidence.gates.runtimeCaptureEnablementAuthorized, false)
assert.equal(evidence.gates.acceptedAsSuccessfulMeasurement, false)

assert.ok(workflow.includes('Verify frozen attempt 2 safe failure evidence'))
assert.ok(workflow.includes('check-12a4-category-execution-cost-probe-acceptance-v2-scope.mjs'))
assert.ok(workflow.includes('verify-12a4-category-execution-cost-probe-acceptance-v2-package.mjs'))
assert.ok(workflow.includes('contents: read'))
assert.equal(workflow.includes('actions: read'), false)
assert.equal(workflow.includes('GH_TOKEN'), false)
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
  twitchWrites: evidence.twitch.d1RowsWritten,
  cleanupRemainingRows: evidence.twitch.cleanupRemainingRows,
  kickAttempted: evidence.kick.attempted,
  temporaryWorkersDeleted: evidence.gates.temporaryWorkersDeleted,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
}, null, 2))
