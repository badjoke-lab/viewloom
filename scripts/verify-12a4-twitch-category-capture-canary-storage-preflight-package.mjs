import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
const request = json('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json')
const execution = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const workflow = read(contract.workflow.path)
const runner = read(contract.evidence.runner)
const inspector = read('scripts/inspect-12a4-twitch-category-capture-canary-storage-preflight-request.mjs')
const fixture = read('scripts/test-12a4-twitch-category-capture-canary-storage-preflight.mjs')
const scope = read('scripts/check-12a4-twitch-category-capture-canary-storage-preflight-scope.mjs')
const note = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary-storage-preflight.md')
const normalConfig = read('workers/collector-twitch/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-v1')
assert.equal(contract.status, 'prepared')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.acceptedInputs.twitchPackagePr, 590)
assert.equal(contract.acceptedInputs.twitchPackageMergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(contract.acceptedInputs.twitchExecutionPr, 591)
assert.equal(contract.acceptedInputs.twitchExecutionMergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(contract.acceptedInputs.executionAcceptancePr, 592)
assert.equal(contract.acceptedInputs.executionAcceptanceMergeSha, 'e202bc24aa9fb200999e678f958984cc9c6ca238')
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionObservationEvent, 'push of exact request to main')
assert.equal(contract.workflow.automaticRecurringExecution, false)
assert.equal(contract.workflow.scheduleEvent, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
for (const key of [
  'workerDeployment',
  'workerDeletion',
  'workerSettingsMutation',
  'remoteMigration',
  'runtimeFlagMutation',
  'categoryRowsWritten',
  'collectorCadenceChanged',
  'backfillPerformed',
  'retentionChanged',
  'kickChanged',
  'triggerCreated',
  'runtimeCaptureStarted',
]) assert.equal(contract.readOnlyBoundary[key], false, `${key} must remain false`)
assert.equal(contract.identity.serviceName, 'viewloom-collector-twitch')
assert.equal(contract.identity.databaseBinding, 'DB_TWITCH_HOT')
assert.equal(contract.identity.databaseName, 'vl_twitch_hot')
assert.equal(contract.identity.databaseId, 'b77221fe-80a3-4749-bc0e-d3ad54003dcf')
assert.equal(contract.identity.normalCadence, '*/5 * * * *')
assert.equal(contract.thresholds.incrementalMbWithSafety, 48.32)
assert.equal(contract.thresholds.providerOperationalCeilingMb, 450)
assert.equal(contract.thresholds.projectedNinetyDaySizeMbMax, 440)
assert.equal(contract.thresholds.projectedProviderHeadroomMbMin, 10)
assert.equal(contract.thresholds.accountOperationalCeilingMb, 4608)
assert.equal(contract.thresholds.projectedAccountWideHeadroomMbMin, 500)
assert.equal(contract.thresholds.providerLeakageRowsMax, 0)
assert.equal(contract.thresholds.latestSnapshotFreshnessMinutesMax, 20)
assert.equal(contract.thresholds.latestSnapshotAuthenticatedRequired, true)
assert.equal(contract.thresholds.latestSnapshotNonemptyRequired, true)
assert.equal(contract.thresholds.canaryBindingsAbsentRequired, true)
assert.equal(contract.thresholds.permanentDirectFlagAbsentRequired, true)
assert.deepEqual(contract.thresholds.requiredTables, [
  'minute_snapshots',
  'provider_category_dictionary',
  'streamer_intraday_rollups',
  'intraday_rollup_status',
])
assert.equal(contract.evidence.digestAlgorithm, 'sha256')
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.rawPayloadRowsReturned, false)
assert.equal(contract.evidence.channelIdentitiesReturned, false)
assert.equal(contract.evidence.credentialsReturned, false)
assert.equal(Object.values(contract.acceptance).filter((value) => value === true).length, 0)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(request.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-request-v1')
assert.equal(request.status, 'requested')
assert.equal(request.provider, 'twitch')
assert.equal(request.oneTime, true)
assert.equal(request.confirmation, 'RUN_READ_ONLY_TWITCH_STORAGE_PREFLIGHT')
assert.equal(request.readOnly, true)
assert.equal(request.workerDeploymentAuthorized, false)
assert.equal(request.d1MutationAuthorized, false)
assert.equal(request.triggerCreationAuthorized, false)
assert.equal(request.runtimeCaptureAuthorized, false)
assert.equal(request.acceptedPackageMergeSha, contract.acceptedInputs.twitchPackageMergeSha)
assert.equal(request.acceptedExecutionMergeSha, contract.acceptedInputs.twitchExecutionMergeSha)
assert.equal(request.acceptedExecutionAcceptanceMergeSha, contract.acceptedInputs.executionAcceptanceMergeSha)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 590)
assert.equal(execution.status, 'accepted')
assert.equal(execution.acceptance.pr, 591)
assert.equal(execution.acceptance.mergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(execution.acceptance.mergeShaRecorded, true)
assert.equal(execution.trigger.storagePreflightContract, 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
assert.equal(execution.trigger.storagePreflightStatusRequired, 'accepted')
assert.equal(execution.trigger.maximumPreflightAgeMinutesAtStart, 60)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)

assert.equal(fs.existsSync('docs/audits/12a4-twitch-category-capture-canary-trigger.json'), false)
assert.equal(fs.existsSync(contract.evidence.repositoryEvidencePath), false)
assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*push:/m)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(/^\s*workflow_dispatch:/m.test(workflow), false)
assert.ok(workflow.includes('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json'))
assert.ok(workflow.includes("github.event_name == 'pull_request'"))
assert.ok(workflow.includes("github.event_name == 'push'"))
assert.ok(workflow.includes("needs.inspect-request.outputs.action == 'observe'"))
assert.ok(workflow.includes("github.ref == 'refs/heads/main'"))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('run-12a4-twitch-category-capture-canary-storage-preflight.mjs'))
assert.ok(workflow.includes('analytics-12a4-twitch-category-canary-storage-preflight'))
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.includes('workers/collector-kick'), false)

for (const fragment of [
  'export function inspectRequest',
  'export function assertReadOnlySql',
  'export function evaluateLatestSnapshot',
  'export function canonicalJson',
  'export function evidenceDigest',
  'projectTwitchStorage(',
  "method: 'GET'",
  "'d1',",
  "'execute',",
  "'--remote',",
  'SELECT name AS table_name FROM sqlite_master',
  'SELECT COUNT(*) AS twitch_dictionary_rows',
  'd1RowsWritten: 0',
  'workerDeployment: false',
  'workerSettingsMutation: false',
  'runtimeCaptureStarted: false',
]) assert.ok(runner.includes(fragment), `runner missing ${fragment}`)

for (const forbidden of [
  'wrangler@4 deploy',
  'wrangler@4 delete',
  "method: 'POST'",
  "method: 'PUT'",
  "method: 'PATCH'",
  "method: 'DELETE'",
  'INSERT INTO',
  'UPDATE minute_snapshots',
  'DELETE FROM minute_snapshots',
  'CREATE TABLE',
  'ALTER TABLE',
  'DROP TABLE',
]) assert.equal(runner.includes(forbidden), false, `runner contains forbidden mutation ${forbidden}`)

for (const fragment of [
  "action: 'noop'",
  "action: inspected.ok ? 'observe' : 'reject'",
  'request_absent',
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)

for (const fragment of [
  'assert.equal(inspectRequest(request, contract).ok, true)',
  "provider: 'kick'",
  'd1MutationAuthorized: true',
  'assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)',
  'assert.equal(acceptedStorage.projectedAccountWideHeadroomMb, 843.09)',
  'assert.equal(providerFailure.pass, false)',
  'assert.equal(accountFailure.pass, false)',
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
  'assert.equal(permanentFlag.categoryCaptureDirectFlagPresent, true)',
  "assert.throws(() => assertReadOnlySql(\"UPDATE",
  'assert.equal(evidenceDigest(ordered), evidenceDigest(reordered))',
  'assert.equal(freshAuthenticated.pass, true)',
  'assert.equal(stale.pass, false)',
  'assert.equal(demo.pass, false)',
  'assert.equal(empty.pass, false)',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)

assert.ok(scope.includes('production_evidence_must_not_be_frozen_in_package_pr'))
assert.ok(scope.includes('twitch_trigger_must_be_absent'))
assert.ok(note.includes('Prepared one-time read-only observation package.'))
assert.ok(note.includes('Cloudflare API `GET` requests'))
assert.ok(note.includes('D1 `SELECT` statements'))
assert.ok(note.includes('projected Twitch 90-day size at or below `440 MB`'))
assert.ok(note.includes('projected account-wide headroom at or above `500 MB`'))
assert.ok(normalConfig.includes('name = "viewloom-collector-twitch"'))
assert.ok(normalConfig.includes('crons = ["*/5 * * * *"]'))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: contract.provider,
  readOnlyCloudflareMethods: contract.readOnlyBoundary.cloudflareApiMethods,
  readOnlyD1Statements: contract.readOnlyBoundary.d1Statements,
  productionObservationFromPullRequest: false,
  productionObservationFromExactMainPushPrepared: true,
  triggerPresent: false,
  productionEvidencePresent: false,
  productionMutationAuthorized: false,
}, null, 2))
