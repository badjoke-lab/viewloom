import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json')
const gate = json(contract.acceptedInputs.currentGatePath)
const trigger = contract.acceptedTrigger
const workflow = read('.github/workflows/analytics-12a4-twitch-category-capture-canary-post-rollback-acceptance.yml')
const runner = read('scripts/run-12a4-twitch-category-capture-canary-post-rollback-acceptance.mjs')
const scope = read('scripts/check-12a4-twitch-category-capture-canary-post-rollback-acceptance-scope.mjs')
const doc = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary-post-rollback-acceptance.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-post-rollback-acceptance-v1')
assert.equal(contract.status, 'prepared')
assert.equal(contract.provider, 'twitch')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedInputs.packagePr, 590)
assert.equal(contract.acceptedInputs.executionPackagePr, 591)
assert.equal(contract.acceptedInputs.startOrderFixPr, 609)
assert.equal(contract.acceptedInputs.monitorParserFixPr, 613)
assert.equal(contract.acceptedInputs.triggerPr, 614)
assert.equal(contract.acceptedInputs.triggerMergeSha, '7726934cb8dc39f2e6706f8a6250989f897a831f')
assert.equal(contract.acceptedInputs.initialAcceptancePr, 617)
assert.equal(contract.acceptedInputs.triggerPath, undefined)
assert.equal(contract.acceptedFinalizer.workflowRunId, 29677847983)
assert.equal(contract.acceptedFinalizer.workflowJobId, 88168491392)
assert.equal(contract.acceptedFinalizer.artifactId, 8439540426)
assert.equal(contract.acceptedFinalizer.artifactDigest, 'sha256:57fd3e7bec159aacd41f527a43a2b910db27b9c5cb2d369d9127ee9b5cb9a542')
assert.equal(contract.acceptedFinalizer.outcome, 'finalized')
assert.equal(contract.acceptedFinalizer.rollbackPass, true)
assert.equal(contract.acceptedFinalizer.canaryBindingsAbsentAfterRollback, true)
assert.equal(contract.observation.preExpiryOutcome, 'not_ready')
assert.equal(contract.observation.requireTriggerExpired, true)
assert.equal(contract.observation.requireCanaryBindingsAbsent, true)
assert.equal(contract.observation.requireFreshNormalSnapshotAfterExpiry, true)
assert.equal(contract.observation.requireRealNormalSnapshot, true)
assert.equal(contract.observation.requireNonemptyNormalSnapshot, true)
assert.equal(contract.observation.requireNoCategoryPayloadAfterGrace, true)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance, null)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')
assert.equal(gate.currentWorkstream.phase, '12A-4-17')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.twitchCanaryObservationActive, true)
assert.equal(gate.currentWorkstream.finalRollbackPending, true)
assert.equal(trigger.status, 'armed')
assert.equal(trigger.retiredFromMain, true)
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.startAt, '2026-07-18T05:15:00.000Z')
assert.equal(trigger.until, '2026-07-19T05:15:00.000Z')
assert.equal((new Date(trigger.until).getTime() - new Date(trigger.startAt).getTime()) / 3_600_000, 24)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes(contract.evidence.artifactName))
assert.ok(workflow.includes('timeout-minutes: 75'))
assert.ok(runner.includes('canaryBindingsAbsent'))
assert.ok(runner.includes('projectTwitchStorage'))
assert.ok(runner.includes("['dlx', 'wrangler@4', 'd1', 'execute'"))
assert.ok(runner.includes('SELECT COUNT(*) AS category_payload_rows_after_grace'))
assert.ok(runner.includes("json_extract(payload_json, '$.categoryContractVersion') IS NULL"))
assert.ok(runner.includes("normal_source_mode === 'real'"))
assert.ok(runner.includes("evidence.outcome = contract.observation.preExpiryOutcome"))
assert.ok(runner.includes('balancedJsonEnd'))
assert.equal(runner.includes('wrangler@4 deploy'), false)
assert.equal(runner.includes('DELETE FROM'), false)
assert.equal(runner.includes('INSERT INTO'), false)
assert.equal(runner.includes('UPDATE '), false)
assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(scope.includes("'scripts/verify-development-policy.mjs'"))
assert.ok(doc.includes('ten-minute post-expiry grace boundary'))
assert.ok(doc.includes('normal five-minute Twitch snapshots'))
assert.ok(doc.includes('Kick change: none'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-18 prepared',
  provider: contract.provider,
  triggerAttempt: trigger.attempt,
  triggerRetiredFromMain: true,
  finalizerRunId: contract.acceptedFinalizer.workflowRunId,
  preExpiryOutcome: contract.observation.preExpiryOutcome,
  productionMutationAuthorized: false,
  permanentEnablementAuthorized: false,
  kickChanged: false,
}, null, 2))
