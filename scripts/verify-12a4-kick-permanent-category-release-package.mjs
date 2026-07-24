import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const requireFile = (file) => assert.equal(fs.existsSync(file), true, `missing file: ${file}`)
const requireText = (source, fragment, label) => assert.ok(source.includes(fragment), `${label}: missing ${fragment}`)

const contractPath = 'docs/audits/12a4-kick-permanent-category-release-contract.json'
requireFile(contractPath)
const contract = json(contractPath)

for (const file of [
  contract.acceptedPackage.canonicalGate,
  contract.acceptedPackage.packageContract,
  contract.acceptedPackage.permanentConfig,
  contract.acceptedPackage.rollbackConfig,
  contract.acceptedPackage.readOnlyObserver,
  contract.workflow.path,
  'scripts/inspect-12a4-kick-permanent-category-release-trigger.mjs',
  'scripts/wait-12a4-kick-permanent-category-release-start.mjs',
  'scripts/run-12a4-kick-permanent-category-release.mjs',
  'scripts/test-12a4-kick-permanent-category-release.mjs',
  'workers/collector-twitch/wrangler.category-permanent.toml',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
]) requireFile(file)

const gate = json(contract.acceptedPackage.canonicalGate)
const packageContract = json(contract.acceptedPackage.packageContract)
const normal = read(contract.acceptedPackage.rollbackConfig)
const permanent = read(contract.acceptedPackage.permanentConfig)
const twitch = read('workers/collector-twitch/wrangler.category-permanent.toml')
const observer = read(contract.acceptedPackage.readOnlyObserver)
const inspector = read('scripts/inspect-12a4-kick-permanent-category-release-trigger.mjs')
const waitRunner = read('scripts/wait-12a4-kick-permanent-category-release-start.mjs')
const runner = read('scripts/run-12a4-kick-permanent-category-release.mjs')
const fixture = read('scripts/test-12a4-kick-permanent-category-release.mjs')
const workflow = read(contract.workflow.path)
const wip = read('docs/work-in-progress/phase12a4-category-parallel-execution.md')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')

console.log('verify: identities and canonical gate')
assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-permanent-category-release-v1')
assert.equal(contract.workstream, '12A-4-24B Kick permanent category exact release package')
assert.equal(contract.status, 'prepared')
assert.equal(contract.parentTrackingIssue, 623)
assert.equal(contract.trackingIssue, 634)
assert.equal(contract.provider, 'kick')
assert.equal(contract.packagePr, 641)
assert.equal(contract.trigger.releasePackagePr, 641)
assert.equal(contract.acceptedPackage.implementationPr, 637)
assert.equal(contract.acceptedPackage.implementationMergeSha, 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0')
assert.equal(contract.acceptedPackage.acceptancePr, 639)
assert.equal(contract.acceptedPackage.acceptanceMergeSha, '662765a2444ba741e49b66aeab4ea0787e56d5e5')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')
assert.equal(gate.currentWorkstream.phase, '12A-4-24')
assert.equal(gate.currentWorkstream.kickPermanentPackageAccepted, true)
assert.equal(gate.currentWorkstream.kickReleasePackageAccepted, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.packagePr, 637)
assert.equal(packageContract.acceptance.packageMergeSha, contract.acceptedPackage.implementationMergeSha)

console.log('verify: package has no trigger or production action')
assert.equal(fs.existsSync(contract.workflow.triggerPath), false)
assert.equal(contract.workflow.triggerAbsentInPackagePr, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.pullRequestReadOnlyPreflightRequired, true)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.newWorkerCronAdded, false)
assert.equal(contract.workflow.temporaryObservationScheduleIncluded, false)
assert.equal(contract.acceptance, null)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.freshPreflight.failureStopsBeforeDeployment, true)
assert.equal(contract.freshPreflight.collectorHealthEvidenceMode, 'latest_snapshot_fresh_real_nonempty_proxy')
assert.equal(contract.freshPreflight.collectorErrorHistoryPersisted, false)
assert.equal(contract.freshPreflight.collectorHealthProxyMustPass, true)
assert.equal(contract.initialVerification.consecutiveCategorySnapshotsRequired, 2)
assert.equal(contract.initialVerification.rollbackOnFailure, true)
assert.equal(contract.rollback.normalSnapshotMustRecover, true)
assert.equal(contract.rollback.providerLeakageMustRemainZero, true)
assert.equal(contract.rollback.twitchMustRemainUnchanged, true)

console.log('verify: exact trigger and wait boundaries')
for (const fragment of [
  'export function inspectReleaseTrigger',
  'release package accepted identity',
  'Kick runtime inactive before release',
  'Twitch runtime remains active',
  'public Twitch filter remains unauthorized',
  "eventName === 'push' ? 'start'",
]) requireText(inspector, fragment, 'trigger inspector')
for (const fragment of [
  'export function evaluateReleaseStartWait',
  'start_wait_exceeds_limit',
  'release_start_too_stale',
  'Math.min(remaining, 60_000)',
]) requireText(waitRunner, fragment, 'start wait')

console.log('verify: read-only observer and collector health proxy')
for (const fragment of [
  "schemaVersion: 'viewloom-12a4-kick-permanent-category-readonly-evidence-v1'",
  'export function isRealKickSourceMode',
  "sourceMode === 'authenticated'",
  "sourceMode === 'public-channel-fallback'",
  'collectorHealthProxy',
  'collectorHealthPass',
  'latestNormalSnapshot',
  'rollbackNormalSnapshotPass',
  'normal_payload_rows_since_start',
  'productionMutationAuthorized: false',
  'twitchMutationAuthorized: false',
  "throw new Error('non_select_statement_rejected')",
]) requireText(observer, fragment, 'observer')
assert.equal(observer.includes('wrangler@4 deploy'), false)
assert.equal(/\bINSERT\s+INTO\b/i.test(observer), false)
assert.equal(/\bUPDATE\s+[A-Za-z_]/i.test(observer), false)
assert.equal(/\bDELETE\s+FROM\b/i.test(observer), false)

console.log('verify: release runner and rollback')
for (const fragment of [
  'export function requiredReleaseGates',
  'export function releaseAccepted',
  'PREFLIGHT_LOOKBACK_MS',
  'collector_health_proxy_rejected',
  'collectorHealthPass',
  "mode: 'preflight'",
  "mode: 'observe'",
  "mode: 'rollback'",
  "['dlx', 'wrangler@4', 'deploy', '--config', configPath]",
  'initial_category_snapshot_verification_failed',
  'rollbackNormalSnapshotPass',
  'evidence-release-start.json',
  'twitchChanged: false',
]) requireText(runner, fragment, 'release runner')
for (const fragment of [
  'absentTriggerNoop: true',
  'pullRequestValidationOnly: true',
  'pushStartVerified: true',
  'identityMismatchesRejected: true',
  'kickSourceModesVerified: true',
  'collectorHealthProxyGateVerified: true',
  'rollbackNormalSnapshotProofRequired: true',
  'twitchBoundaryVerified: true',
]) requireText(fixture, fragment, 'release fixture')

console.log('verify: workflow execution boundary')
for (const fragment of [
  'pull_request:',
  'workflow_dispatch:',
  'push:',
  "'docs/audits/12a4-kick-permanent-category-release-trigger.json'",
  "github.event_name != 'push' && needs.classify.outputs.trigger_present != 'true'",
  "github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'",
  'Run fresh read-only Kick production preflight',
  'Verify Kick collector health proxy passed',
  'collectorHealthProxy?.clear',
  'Verify exact one-file Kick release trigger',
  'Wait for exact Kick release start boundary',
  'Run preflight and verify the Kick category release start',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'Upload sanitized Kick release evidence',
]) requireText(workflow, fragment, 'workflow')
assert.equal(workflow.includes('cron:'), false)

console.log('verify: provider configs and five-minute cadence')
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

console.log('verify: current documentation')
requireText(wip, 'Prepare a dormant Kick release package', 'active WIP')
requireText(wip, 'Run a fresh read-only Kick production preflight', 'active WIP')
requireText(roadmap, 'Prepare and accept a dormant release package', 'roadmap')
requireText(schedule, 'Kick permanent release package accepted no', 'schedule')
requireText(schedule, 'Create an exact one-file trigger on main only after the fresh preflight passes', 'schedule')

console.log(JSON.stringify({
  ok: true,
  phase: '12A-4-24B',
  provider: 'kick',
  packagePr: 641,
  triggerPresent: false,
  pullRequestValidationOnly: true,
  pullRequestReadOnlyPreflight: true,
  freshPreflightBeforeRelease: true,
  collectorHealthProxyGate: true,
  consecutiveCategorySnapshotsRequired: 2,
  automaticRollbackRequired: true,
  twitchChanged: false,
}, null, 2))
