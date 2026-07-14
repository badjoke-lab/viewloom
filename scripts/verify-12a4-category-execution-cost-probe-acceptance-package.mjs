import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const must = (name, condition) => assert.equal(Boolean(condition), true, name)

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-acceptance-contract-v1')
must('acceptance contract status', ['candidate', 'accepted'].includes(contract.status))
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.trigger.pr, 549)
assert.equal(contract.trigger.headSha, '7ef6a887d6bc4395ff3b0929add2fafaeff108b7')
assert.equal(contract.trigger.mergeSha, '9637f4927fbc5e4674e3a78e285d7ea6c5049cfa')
assert.equal(contract.trigger.runId, 'category-cost-probe-attempt-1')
assert.deepEqual(contract.trigger.providerOrder, ['twitch', 'kick'])
assert.equal(contract.source.workflow, 'analytics-12a4-category-execution-cost-probe-execution.yml')
assert.equal(contract.source.event, 'push')
assert.equal(contract.source.branch, 'main')
assert.equal(contract.source.headSha, contract.trigger.mergeSha)
assert.equal(contract.source.artifact, 'phase12a4-category-execution-cost-probe')
assert.equal(contract.acceptance.branch, 'accept-analytics-12a4-category-execution-cost-probe')
assert.equal(contract.acceptance.artifact, 'phase12a4-category-execution-cost-probe-acceptance')
assert.equal(contract.acceptance.sourceEvidenceStatusRequired, 'observed_pass')
assert.equal(contract.acceptance.sourceGateRequired, true)
assert.equal(contract.acceptance.sourceWorkflowConclusionRequired, 'success')
assert.equal(contract.acceptance.rawFilesRetained, false)
assert.deepEqual(contract.requiredSourceJobs, ['contract', 'production-probe'])
assert.equal(contract.readOnlyBoundary, true)
assert.equal(contract.categoryCaptureAuthorized, false)

assert.equal(trigger.status, 'armed_for_one_time_main_push')
assert.equal(trigger.expectedExecutionPackageMergeSha, '219d79351388a15a599e72f8e85228d498488f11')
assert.equal(execution.status, 'accepted')
assert.equal(execution.acceptance.pr, 548)
assert.equal(execution.workflow.artifactName, contract.source.artifact)

must('exact trigger SHA env', /TRIGGER_SHA:\s*9637f4927fbc5e4674e3a78e285d7ea6c5049cfa/.test(workflow))
must('exact source workflow env', /SOURCE_WORKFLOW:\s*analytics-12a4-category-execution-cost-probe-execution\.yml/.test(workflow))
must('exact source artifact env', /SOURCE_ARTIFACT:\s*phase12a4-category-execution-cost-probe/.test(workflow))
must('exact acceptance branch guard', workflow.includes("github.head_ref == 'accept-analytics-12a4-category-execution-cost-probe'"))
must('exact source SHA filter', workflow.includes('select(.head_sha == $sha)'))
must('exact artifact name filter', workflow.includes('select(.name == $name and .expired == false)'))
must('source evidence structural verification', /verify-12a4-category-execution-cost-probe-evidence\.mjs\s+"\$RAW_DIR\/source-evidence\.json"/.test(workflow))
must('accepted evidence pass verification', /verify-12a4-category-execution-cost-probe-evidence\.mjs\s+"\$ARTIFACT_DIR\/evidence\.json"\s+--require-pass/.test(workflow))
must('raw source removal', /rm -rf\s+"\$RAW_DIR"/.test(workflow))
must('acceptance evidence only upload', workflow.includes('path: artifacts/12a4-category-execution-cost-probe-acceptance/evidence.json'))
must('read-only permissions', workflow.includes('actions: read') && workflow.includes('contents: read'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.toLowerCase().includes('wrangler'), false)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)

console.log(JSON.stringify({
  ok: true,
  workstream: contract.workstream,
  status: contract.status,
  triggerSha: contract.trigger.mergeSha,
  sourceWorkflow: contract.source.workflow,
  sourceArtifact: contract.source.artifact,
  acceptanceBranch: contract.acceptance.branch,
  readOnlyBoundary: contract.readOnlyBoundary,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
}, null, 2))
