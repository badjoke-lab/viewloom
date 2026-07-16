import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const trigger = json(contract.acceptedInputs.triggerPath)
const execution = json(contract.acceptedInputs.executionContractPath)
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-acceptance.yml')
const runner = read('scripts/run-12a4-kick-category-capture-canary-acceptance.mjs')
const scope = read('scripts/check-12a4-kick-category-capture-canary-acceptance-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-category-capture-canary-acceptance.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-acceptance-v1')
assert.equal(contract.status, 'candidate')
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedInputs.packagePr, 562)
assert.equal(contract.acceptedInputs.executionPackagePr, 563)
assert.equal(contract.acceptedInputs.executionRepairPr, 580)
assert.equal(contract.acceptedInputs.executionRepairMergeSha, '654543c46713c327a76f6ff7e61feeea97231982')
assert.equal(contract.acceptedInputs.triggerPr, 581)
assert.equal(contract.acceptedInputs.triggerMergeSha, '952716ee71ff9b15aae8771803ee8350cd8b917f')
assert.equal(contract.observation.healthSource, 'latest_kick_minute_snapshot')
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(contract.evidence.artifactName, 'analytics-12a4-kick-category-canary-readonly-acceptance-attempt-2')
assert.ok(contract.evidence.artifactLabelNote.includes('trigger attempt 3'))
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v17')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.attempt, 3)
assert.equal(trigger.packagePr, contract.acceptedInputs.packagePr)
assert.equal(trigger.executionPackagePr, contract.acceptedInputs.executionPackagePr)
assert.equal((new Date(trigger.until).getTime() - new Date(trigger.startAt).getTime()) / 3_600_000, 24)
assert.ok(Date.now() < new Date(trigger.until).getTime())
assert.equal(execution.status, 'accepted')
assert.equal(execution.acceptance.mergeSha, contract.acceptedInputs.executionPackageMergeSha)

assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes(contract.evidence.artifactName))
assert.ok(workflow.includes('run-12a4-kick-category-capture-canary-acceptance.mjs'))
assert.ok(runner.includes("['dlx', 'wrangler@4', 'd1', 'execute'"))
assert.ok(runner.includes('SELECT COUNT(*) AS kick_dictionary_rows'))
assert.ok(runner.includes('SELECT COUNT(*) AS provider_leakage_rows'))
assert.ok(runner.includes('category_payload_rows_since_start'))
assert.ok(runner.includes('category_bucket_minute'))
assert.equal(runner.includes('FROM collector_status'), false)
assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(doc.includes('attempt 3'))
assert.ok(doc.includes('write D1 rows'))
assert.ok(doc.includes('Twitch has not been authorized or started'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-11 attempt 3',
  triggerAttempt: trigger.attempt,
  triggerStartAt: trigger.startAt,
  triggerUntil: trigger.until,
  readOnly: true,
  twitchStartAuthorized: false,
}, null, 2))
