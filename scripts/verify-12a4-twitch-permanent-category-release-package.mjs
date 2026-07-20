import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const contract = json('docs/audits/12a4-twitch-permanent-category-release-contract.json')
const gate = json(contract.acceptedPackage.canonicalGate)
const packageContract = json(contract.acceptedPackage.packageContract)
const packageAcceptance = json(contract.acceptedPackage.packageAcceptance)
const workflow = read(contract.workflow.path)
const inspector = read('scripts/inspect-12a4-twitch-permanent-category-release-trigger.mjs')
const waitRunner = read('scripts/wait-12a4-twitch-permanent-category-release-start.mjs')
const observer = read(contract.acceptedPackage.readOnlyObserver)
const runner = read('scripts/run-12a4-twitch-permanent-category-release.mjs')
const fixture = read('scripts/test-12a4-twitch-permanent-category-release.mjs')
const scope = read('scripts/check-12a4-twitch-permanent-category-release-scope.mjs')
const triggerVerifier = read('scripts/verify-12a4-twitch-permanent-category-release-trigger.mjs')
const normal = read(contract.acceptedPackage.rollbackConfig)
const permanent = read(contract.acceptedPackage.permanentConfig)
const kick = read('workers/collector-kick/wrangler.toml')
const wip = read('docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-permanent-category-release-v1')
assert.equal(contract.workstream, '12A-4-21 Twitch permanent category exact release package')
assert.equal(contract.status, 'prepared')
assert.equal(contract.trackingIssue, 623)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.packagePr, 627)
assert.equal(contract.acceptedPackage.implementationPr, 625)
assert.equal(contract.acceptedPackage.implementationMergeSha, '66f2b544e22dafc52e76d684cc2844c734eb8c09')
assert.equal(contract.acceptedPackage.acceptancePr, 626)
assert.equal(contract.acceptedPackage.acceptanceMergeSha, '3bf0b407d27eac9de1f8b2480a223d244f3f1a30')
assert.equal(gate.schemaVersion, contract.acceptedPackage.requiredGateSchemaVersion)
assert.equal(gate.currentWorkstream.phase, contract.acceptedPackage.requiredGatePhase)
assert.equal(gate.currentWorkstream.packageAccepted, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)
assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 626)
assert.equal(packageAcceptance.status, 'accepted')
assert.equal(packageAcceptance.packageMergeSha, contract.acceptedPackage.implementationMergeSha)

assert.equal(contract.workflow.triggerAbsentInPackagePr, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionEvent, 'push of exact one-file trigger to main')
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.newWorkerCronAdded, false)
assert.equal(contract.workflow.temporaryObservationScheduleIncluded, false)
assert.equal(fs.existsSync(contract.workflow.triggerPath), false)
assert.deepEqual(contract.mandatoryOrder, [
  'inspect exact trigger and accepted identities',
  'wait for exact start boundary',
  'run fresh read-only production preflight',
  'deploy accepted Twitch permanent-category config',
  'verify deployed provider-scoped binding',
  'verify two consecutive category-bearing real non-empty snapshots',
  'freeze sanitized start evidence',
  'begin later separate observation phase',
])
assert.deepEqual(contract.freshPreflight.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.freshPreflight.d1Statements, ['SELECT'])
assert.equal(contract.freshPreflight.failureStopsBeforeDeployment, true)
assert.equal(contract.deployment.collectorCron, '*/5 * * * *')
assert.equal(contract.deployment.kickConfigReferenced, false)
assert.equal(contract.initialVerification.consecutiveCategorySnapshotsRequired, 2)
assert.equal(contract.initialVerification.rollbackOnFailure, true)
assert.equal(contract.rollback.normalSnapshotMustRecover, true)
assert.equal(contract.rollback.providerLeakageMustRemainZero, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.acceptance, null)

for (const fragment of [
  'export function inspectReleaseTrigger',
  'release package accepted identity',
  'runtime inactive before release',
  'Kick unauthorized',
  "action: ok && eventName === 'push' ? 'start'",
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)
for (const fragment of [
  'export function evaluateReleaseStartWait',
  'start_wait_exceeds_limit',
  'release_start_too_stale',
  'Math.min(remaining, 60_000)',
]) assert.ok(waitRunner.includes(fragment), `wait runner missing ${fragment}`)
for (const fragment of [
  "schemaVersion: 'viewloom-12a4-twitch-permanent-category-readonly-evidence-v2'",
  'latestNormalSnapshot',
  'rollbackNormalSnapshotPass',
  'normal_payload_rows_since_start',
  'productionMutationAuthorized: false',
  'kickMutationAuthorized: false',
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
]) assert.ok(runner.includes(fragment), `release runner missing ${fragment}`)

for (const fragment of [
  'absentTriggerNoop: true',
  'pullRequestValidationOnly: true',
  'pushStartVerified: true',
  'identityMismatchesRejected: true',
  'rollbackNormalSnapshotProofRequired: true',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)
assert.ok(scope.includes("const triggerPath = 'docs/audits/12a4-twitch-permanent-category-release-trigger.json'"))
assert.ok(scope.includes('exact release trigger must be absent from the dormant package PR'))
assert.ok(triggerVerifier.includes('exact one-file release trigger required'))
assert.ok(triggerVerifier.includes("contract.acceptance.pr, 628"))

assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.match(workflow, /^\s*push:/m)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.ok(workflow.includes("'docs/audits/12a4-twitch-permanent-category-release-trigger.json'"))
assert.ok(workflow.includes("github.event_name != 'push' && needs.classify.outputs.trigger_present != 'true'"))
assert.ok(workflow.includes("github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(workflow.includes('Verify exact one-file Twitch release trigger'))
assert.ok(workflow.includes('Wait for exact release start boundary'))
assert.ok(workflow.includes('Run preflight and verify the Twitch category release start'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('Upload sanitized release evidence'))
assert.equal(workflow.includes("cron:"), false)

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kick), false)
assert.equal(cron(normal), '*/5 * * * *')
assert.equal(cron(permanent), cron(normal))
assert.equal(toml(permanent, 'name'), toml(normal, 'name'))
assert.equal(toml(permanent, 'database_id'), toml(normal, 'database_id'))
assert.notEqual(toml(permanent, 'database_id'), toml(kick, 'database_id'))

assert.ok(wip.includes('# 12A-4-21 Twitch permanent category release package candidate'))
assert.ok(wip.includes('Production release from PR #627: no'))
assert.ok(wip.includes('Exact one-file trigger present: no'))
assert.ok(wip.includes('Kick change: no'))

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-21',
  provider: 'twitch',
  packagePr: 627,
  triggerPresent: false,
  pullRequestValidationOnly: true,
  freshPreflightBeforeRelease: true,
  consecutiveCategorySnapshotsRequired: 2,
  automaticRollbackRequired: true,
  kickChanged: false,
}, null, 2))
