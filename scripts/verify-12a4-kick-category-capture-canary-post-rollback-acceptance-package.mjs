import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json')
const gate = json(contract.acceptedInputs.currentGatePath)
const trigger = json(contract.acceptedInputs.triggerPath)
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml')
const runner = read('scripts/run-12a4-kick-category-capture-canary-post-rollback-acceptance.mjs')
const scope = read('scripts/check-12a4-kick-category-capture-canary-post-rollback-acceptance-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-kick-category-capture-canary-post-rollback-acceptance.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-post-rollback-acceptance-v1')
assert.equal(contract.status, 'prepared')
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedInputs.triggerPr, 581)
assert.equal(contract.acceptedInputs.triggerMergeSha, '952716ee71ff9b15aae8771803ee8350cd8b917f')
assert.equal(contract.acceptedInputs.initialAcceptancePr, 579)
assert.equal(contract.acceptedInputs.activeObservationGatePr, 582)
assert.equal(contract.observation.preExpiryOutcome, 'not_ready')
assert.equal(contract.observation.requireTriggerExpired, true)
assert.equal(contract.observation.requireCanaryBindingsAbsent, true)
assert.equal(contract.observation.requireFreshNormalSnapshotAfterExpiry, true)
assert.equal(contract.observation.requireNonemptyNormalSnapshot, true)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance, null)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v18')
assert.equal(gate.currentWorkstream.phase, '12A-4-11')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.kickCanaryObservationActive, true)
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.attempt, 3)
assert.equal((new Date(trigger.until).getTime() - new Date(trigger.startAt).getTime()) / 3_600_000, 24)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes(contract.evidence.artifactName))
assert.ok(workflow.includes('timeout-minutes: 75'))
assert.match(
  workflow,
  /- name: Verify exact post-rollback acceptance scope\n\s+if: github\.event_name == 'pull_request'/,
)
assert.ok(runner.includes('canaryBindingsAbsent'))
assert.ok(runner.includes("['dlx', 'wrangler@4', 'd1', 'execute'"))
assert.ok(runner.includes('SELECT COUNT(*) AS category_payload_rows_after_grace'))
assert.ok(runner.includes("json_extract(payload_json, '$.categoryContractVersion') IS NULL"))
assert.ok(runner.includes('evidence.outcome = contract.observation.preExpiryOutcome'))
assert.equal(runner.includes('wrangler@4 deploy'), false)
assert.equal(runner.includes('DELETE FROM'), false)
assert.equal(runner.includes('INSERT INTO'), false)
assert.equal(runner.includes('UPDATE '), false)
assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(doc.includes('not_ready'))
assert.ok(doc.includes('normal Kick snapshot'))
assert.ok(doc.includes('Twitch authorization remains false'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-12 prepared',
  provider: contract.provider,
  triggerAttempt: trigger.attempt,
  preExpiryOutcome: contract.observation.preExpiryOutcome,
  manualDispatchScopeDiffSkipped: true,
  productionMutationAuthorized: false,
  twitchStartAuthorized: false,
}, null, 2))
