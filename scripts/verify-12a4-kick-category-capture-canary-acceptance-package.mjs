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
assert.equal(contract.workstream, '12A-4-11 Kick category capture canary read-only acceptance')
assert.equal(contract.status, 'candidate')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'kick')
assert.equal(contract.acceptedInputs.packagePr, 562)
assert.equal(contract.acceptedInputs.executionPackagePr, 563)
assert.equal(contract.acceptedInputs.executionRepairPr, 580)
assert.equal(contract.acceptedInputs.executionRepairMergeSha, '654543c46713c327a76f6ff7e61feeea97231982')
assert.equal(contract.acceptedInputs.triggerPr, 581)
assert.equal(contract.acceptedInputs.triggerMergeSha, '952716ee71ff9b15aae8771803ee8350cd8b917f')
assert.equal(contract.observation.mode, 'read_only_pull_request_probe')
assert.equal(contract.observation.pollIntervalSeconds, 30)
assert.equal(contract.observation.pollAttempts, 30)
assert.equal(contract.observation.minimumCategoryPayloadRows, 1)
assert.equal(contract.observation.maximumProviderLeakageRows, 0)
assert.equal(contract.observation.healthSource, 'latest_kick_minute_snapshot')
assert.equal(contract.observation.latestSnapshotFreshnessMinutesMax, 20)
assert.equal(contract.observation.requireActiveTriggerWindow, true)
assert.equal(contract.observation.requireExactCanaryBindings, true)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(Object.values(contract.readOnlyBoundary).filter((value) => typeof value === 'boolean').every((value) => value === false), true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.evidence.artifactName, 'analytics-12a4-kick-category-canary-readonly-acceptance-attempt-3')
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.rawPayloadRowsReturned, false)
assert.equal(contract.evidence.channelIdentitiesReturned, false)
assert.equal(contract.evidence.secretsReturned, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v17')
assert.equal(gate.currentWorkstream.phase, '12A-4-10')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickEvidence, true)

assert.equal(trigger.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-trigger-v1')
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, 'RUN_KICK_CATEGORY_CAPTURE_CANARY')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.packagePr, contract.acceptedInputs.packagePr)
assert.equal(trigger.packageMergeSha, contract.acceptedInputs.packageMergeSha)
assert.equal(trigger.executionPackagePr, contract.acceptedInputs.executionPackagePr)
assert.equal(trigger.executionPackageMergeSha, contract.acceptedInputs.executionPackageMergeSha)
const start = new Date(trigger.startAt)
const until = new Date(trigger.until)
assert.ok(Number.isFinite(start.getTime()))
assert.ok(Number.isFinite(until.getTime()))
assert.equal((until.getTime() - start.getTime()) / 3_600_000, 24)
assert.ok(Date.now() < until.getTime(), 'Kick canary trigger expired before acceptance package validation')

assert.equal(execution.status, 'accepted')
assert.equal(execution.acceptance.pr, 563)
assert.equal(execution.acceptance.mergeSha, contract.acceptedInputs.executionPackageMergeSha)
assert.equal(execution.pullRequestBoundary.productionRuntimeCaptureStarted, false)
assert.equal(execution.pullRequestBoundary.remoteD1OperationPerformed, false)

assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(/^\s*workflow_dispatch:/m.test(workflow), false)
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'))
assert.ok(workflow.includes('analytics-12a4-kick-category-canary-readonly-acceptance-attempt-3'))
assert.ok(workflow.includes('Kick canary read-only acceptance attempt 3'))
assert.ok(workflow.includes('node scripts/run-12a4-kick-category-capture-canary-acceptance.mjs'))
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.includes('wrangler secret'), false)

for (const pattern of [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bALTER\b/i,
  /\bCREATE\b/i,
  /\bREPLACE\s+INTO\b/i,
  /wrangler@4\s+deploy/i,
  /secret\s+put/i,
  /method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i,
]) assert.equal(pattern.test(runner), false, `read-only runner contains forbidden mutation: ${pattern}`)

for (const fragment of [
  "['dlx', 'wrangler@4', 'd1', 'execute'",
  "'--remote'",
  'SELECT COUNT(*) AS kick_dictionary_rows',
  'SELECT COUNT(*) AS provider_leakage_rows',
  'category_payload_rows_since_start',
  'category_bucket_minute',
  'polling.attemptsUsed',
]) assert.ok(runner.includes(fragment), `read-only runner missing ${fragment}`)
assert.equal(runner.includes('FROM collector_status'), false)
assert.ok(scope.includes("'apps/'"))
assert.ok(scope.includes("'workers/'"))
assert.ok(scope.includes('12a4-kick-category-capture-canary-trigger.json'))
assert.ok(doc.includes('attempt 3'))
assert.ok(doc.includes('does not:'))
assert.ok(doc.includes('write D1 rows'))
assert.ok(doc.includes('latest `minute_snapshots` row'))
assert.ok(doc.includes('Twitch has not been authorized or started'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-11 attempt 3',
  provider: contract.provider,
  triggerAttempt: trigger.attempt,
  triggerStartAt: trigger.startAt,
  triggerUntil: trigger.until,
  triggerMergeSha: contract.acceptedInputs.triggerMergeSha,
  executionRepairMergeSha: contract.acceptedInputs.executionRepairMergeSha,
  healthSource: contract.observation.healthSource,
  readOnly: true,
  productionMutationAuthorized: false,
  twitchStartAuthorized: false,
}, null, 2))
