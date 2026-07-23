import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-kick-permanent-category-release-contract.json')
const gate = json(contract.acceptedPackage.canonicalGate)
const packageContract = json(contract.acceptedPackage.packageContract)
const workflow = read(contract.workflow.path)
const inspector = read('scripts/inspect-12a4-kick-permanent-category-release-trigger.mjs')
const waitRunner = read('scripts/wait-12a4-kick-permanent-category-release-start.mjs')
const observer = read(contract.acceptedPackage.readOnlyObserver)
const runner = read('scripts/run-12a4-kick-permanent-category-release.mjs')
const fixture = read('scripts/test-12a4-kick-permanent-category-release.mjs')
const normal = read(contract.acceptedPackage.rollbackConfig)
const permanent = read(contract.acceptedPackage.permanentConfig)
const twitch = read('workers/collector-twitch/wrangler.category-permanent.toml')
const wip = read('docs/work-in-progress/phase12a4-category-parallel-execution.md')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-permanent-category-release-v1')
assert.equal(contract.workstream, '12A-4-24B Kick permanent category exact release package')
assert.equal(contract.status, 'prepared')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.trackingIssue, 634)
assert.equal(contract.provider, 'kick')
assert.ok(Number.isInteger(contract.packagePr) && contract.packagePr > 0)
assert.equal(contract.trigger.releasePackagePr, contract.packagePr)
assert.equal(contract.acceptedPackage.implementationPr, 637)
assert.equal(contract.acceptedPackage.implementationMergeSha, 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0')
assert.equal(contract.acceptedPackage.acceptancePr, 639)
assert.equal(contract.acceptedPackage.acceptanceMergeSha, '662765a2444ba741e49b66aeab4ea0787e56d5e5')
assert.equal(gate.schemaVersion, contract.acceptedPackage.requiredGateSchemaVersion)
assert.equal(gate.currentWorkstream.phase, contract.acceptedPackage.requiredGatePhase)
assert.equal(gate.currentWorkstream.kickPermanentPackageAccepted, true)
assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.packagePr, 637)
assert.equal(packageContract.acceptance.packageMergeSha, contract.acceptedPackage.implementationMergeSha)

assert.equal(contract.workflow.triggerAbsentInPackagePr, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.pullRequestReadOnlyPreflightRequired, true)
assert.equal(contract.workflow.productionEvent, 'push of exact one-file trigger to main')
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.newWorkerCronAdded, false)
assert.equal(contract.workflow.temporaryObservationScheduleIncluded, false)
assert.equal(fs.existsSync(contract.workflow.triggerPath), false)
assert.deepEqual(contract.mandatoryOrder, [
  'inspect exact trigger and accepted identities',
  'wait for exact start boundary',
  'run fresh read-only Kick production preflight',
  'deploy accepted Kick permanent-category config',
  'verify deployed Kick-scoped binding',
  'verify two consecutive category-bearing real non-empty Kick snapshots',
  'freeze sanitized start evidence',
  'begin later separate Kick observation phase',
])
assert.deepEqual(contract.freshPreflight.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.freshPreflight.d1Statements, ['SELECT'])
assert.equal(contract.freshPreflight.failureStopsBeforeDeployment, true)
assert.equal(contract.deployment.collectorCron, '*/5 * * * *')
assert.equal(contract.deployment.twitchConfigReferenced, false)
assert.equal(contract.initialVerification.consecutiveCategorySnapshotsRequired, 2)
assert.equal(contract.initialVerification.rollbackOnFailure, true)
assert.equal(contract.rollback.normalSnapshotMustRecover, true)
assert.equal(contract.rollback.providerLeakageMustRemainZero, true)
assert.equal(contract.rollback.twitchMustRemainUnchanged, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance, null)

for (const fragment of [
  'export function inspectReleaseTrigger',
  'release package accepted identity',
  'Kick runtime inactive before release',
  'Twitch runtime remains active',
  'public Twitch filter remains unauthorized',
  "action: ok && eventName === 'push' ? 'start'",
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)
for (const fragment of [
  'export function evaluateReleaseStartWait',
  'start_wait_exceeds_limit',
  'release_start_too_stale',
  'Math.min(remaining, 60_000)',
]) assert.ok(waitRunner.includes(fragment), `wait runner missing ${fragment}`)
for (const fragment of [
  "schemaVersion: 'viewloom-12a4-kick-permanent-category-readonly-evidence-v1'",
  'latestNormalSnapshot',
  'rollbackNormalSnapshotPass',
  'normal_payload_rows_since_start',
  'productionMutationAuthorized: false',
  'twitchMutationAuthorized: false',
]) assert.ok(observer.includes(fragment), `observer missing ${fragment}`)
assert.equal(observer.includes('wrangler@4 deploy'), false)
assert.equal(/\bINSERT\s+INTO\b/i.test(observer), false)
assert.equal(/\bUPDATE\s+[A-Za-z_]/i.test(observer), false)
assert.equal(/\bDELETE\s+FROM\b/i.test(observer), false)

for (const fragment of [
  'export function requiredReleaseGates',
  'export function releaseAccepted',
  "mode: 'preflight'",
  "mode: 'observe'",
  "mode: 'rollback'",
  "['dlx', 'wrangler@4', 'deploy', '--config', configPath]",
  'initial_category_snapshot_verification_failed',
  'rollbackNormalSnapshotPass',
  'evidence-release-start.json',
  'twitchChanged: false',
]) assert.ok(runner.includes(fragment), `release runner missing ${fragment}`)

for (const fragment of [
  'absentTriggerNoop: true',
  'pullRequestValidationOnly: true',
  'pushStartVerified: true',
  'identityMismatchesRejected: true',
  'rollbackNormalSnapshotProofRequired: true',
  'twitchBoundaryVerified: true',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.match(workflow, /^\s*push:/m)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes("'docs/audits/12a4-kick-permanent-category-release-trigger.json'"))
assert.ok(workflow.includes("github.event_name != 'push' && needs.classify.outputs.trigger_present != 'true'"))
assert.ok(workflow.includes("github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(workflow.includes('Run fresh read-only Kick production preflight'))
assert.ok(workflow.includes('Verify recent Kick collector errors are zero'))
assert.ok(workflow.includes('Verify exact one-file Kick release trigger'))
assert.ok(workflow.includes('Wait for exact Kick release start boundary'))
assert.ok(workflow.includes('Run preflight and verify the Kick category release start'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('Upload sanitized Kick release evidence'))
assert.equal(workflow.includes('cron:'), false)

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(twitch), true)
assert.equal(cron(normal), '*/5 * * * *')
assert.equal(cron(permanent), cron(normal))
assert.equal(toml(permanent, 'name'), toml(normal, 'name'))
assert.equal(toml(permanent, 'database_id'), toml(normal, 'database_id'))
assert.notEqual(toml(permanent, 'database_id'), toml(twitch, 'database_id'))

assert.ok(wip.includes('Prepare a dormant Kick release package'))
assert.ok(wip.includes('Run a fresh read-only Kick production preflight'))
assert.ok(roadmap.includes('Prepare and accept a dormant release package'))
assert.ok(schedule.includes('Kick permanent release package accepted no'))
assert.ok(schedule.includes('Create an exact one-file trigger on main only after the fresh preflight passes'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-24B',
  provider: 'kick',
  packagePr: contract.packagePr,
  triggerPresent: false,
  pullRequestValidationOnly: true,
  pullRequestReadOnlyPreflight: true,
  freshPreflightBeforeRelease: true,
  consecutiveCategorySnapshotsRequired: 2,
  automaticRollbackRequired: true,
  twitchChanged: false,
}, null, 2))