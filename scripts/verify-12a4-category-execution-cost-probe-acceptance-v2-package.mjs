import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const evidencePath = 'docs/audits/12a4-category-execution-cost-probe-attempt-2-evidence.json'

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-v2-contract.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance-v2.yml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-category-execution-cost-probe-acceptance-v2-contract-v1')
assert.ok(['candidate', 'accepted'].includes(contract.status))
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
assert.equal(contract.source.artifact, 'phase12a4-category-execution-cost-probe')
assert.equal(contract.acceptance.branch, 'accept-analytics-12a4-category-execution-cost-probe-v2')
assert.equal(contract.acceptance.artifact, 'phase12a4-category-execution-cost-probe-acceptance-v2')
assert.equal(contract.acceptance.rawFilesRetained, false)
assert.deepEqual(contract.requiredSourceJobs, ['contract', 'production-probe'])
assert.equal(contract.readOnlyBoundary, true)
assert.equal(contract.categoryCaptureAuthorized, false)

assert.equal(trigger.attempt, 2)
assert.equal(trigger.runId, contract.trigger.runId)
assert.equal(trigger.executionPackagePr, 551)
assert.equal(trigger.expectedExecutionPackageHeadSha, execution.acceptance.validatedImplementationHeadSha)
assert.equal(trigger.expectedExecutionPackageMergeSha, execution.acceptance.mergeSha)

assert.match(workflow, /TRIGGER_SHA:\s*e453053e23f5b4b930a736570d42cdbc1ff664a0/)
assert.match(workflow, /SOURCE_WORKFLOW:\s*analytics-12a4-category-execution-cost-probe-execution\.yml/)
assert.match(workflow, /SOURCE_ARTIFACT:\s*phase12a4-category-execution-cost-probe/)
assert.ok(workflow.includes("github.head_ref == 'accept-analytics-12a4-category-execution-cost-probe-v2'"))
assert.ok(workflow.includes('select(.head_sha == $sha)'))
assert.ok(workflow.includes('select(.name == $name and .expired == false)'))
assert.ok(workflow.includes('verify-12a4-category-execution-cost-probe-evidence.mjs "$RAW_DIR/source-evidence.json"'))
assert.ok(workflow.includes('verify-12a4-category-execution-cost-probe-evidence.mjs "$evidence" --require-pass'))
assert.ok(workflow.includes('rm -rf "$RAW_DIR"'))
assert.ok(workflow.includes('path: artifacts/12a4-category-execution-cost-probe-acceptance-v2/evidence.json'))
assert.ok(workflow.includes('actions: read'))
assert.ok(workflow.includes('contents: read'))
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.toLowerCase().includes('wrangler'), false)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)

let frozenEvidence = false
if (fs.existsSync(path.join(root, evidencePath))) {
  const result = spawnSync(process.execPath, [
    'scripts/verify-12a4-category-execution-cost-probe-evidence.mjs',
    evidencePath,
    '--require-pass',
  ], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'frozen evidence verification failed')
  const evidence = json(evidencePath)
  assert.equal(evidence.acceptance?.status, 'accepted')
  assert.equal(evidence.acceptance?.triggerPr, 553)
  assert.equal(evidence.acceptance?.triggerMergeSha, contract.trigger.mergeSha)
  assert.equal(evidence.workflow?.event, 'push')
  assert.equal(evidence.workflow?.headSha, contract.trigger.mergeSha)
  frozenEvidence = true
  assert.equal(contract.status, 'accepted')
}

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  attempt: contract.trigger.attempt,
  triggerSha: contract.trigger.mergeSha,
  readOnlyBoundary: contract.readOnlyBoundary,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
  frozenEvidence,
}, null, 2))
