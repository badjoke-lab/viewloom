import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const storageContract = json('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const kickEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const workflow = read(contract.workflow.path)
const runner = read(contract.evidence.runner)
const storageRunner = read(contract.evidence.freshPreflightRunner)
const inspector = read(contract.evidence.triggerInspector)
const fixture = read('scripts/test-12a4-twitch-category-capture-canary-execution.mjs')
const note = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary-execution.md')
const normalConfig = read('workers/collector-twitch/wrangler.toml')
const canaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-execution-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedPackage.pr, 590)
assert.equal(contract.acceptedPackage.mergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(contract.acceptedPackage.provider, 'twitch')
assert.equal(contract.acceptedPackage.committedDisabled, true)
assert.equal(contract.acceptedPackage.minimumObservationHours, 24)

assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionExecutionFromPackagePr, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.automaticPermanentEnablement, false)
assert.equal(contract.workflow.automaticKickStart, false)

assert.equal(contract.trigger.statusRequired, 'armed')
assert.equal(contract.trigger.providerRequired, 'twitch')
assert.equal(contract.trigger.exactPackagePr, 590)
assert.equal(contract.trigger.exactPackageMergeSha, 'e798df275b2fad0601b2e9ef89c76a6a30f1d038')
assert.equal(contract.trigger.exactExecutionPackagePr, 591)
assert.equal(contract.trigger.exactExecutionPackageMergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(contract.trigger.storagePreflightContract, 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json')
assert.equal(contract.trigger.storagePreflightStatusRequired, 'accepted')
assert.equal(contract.trigger.acceptedBaselinePreflightIdentityRequired, true)
assert.equal(contract.trigger.freshReadOnlyPreflightInStartJobRequired, true)
assert.deepEqual(contract.trigger.freshReadOnlyPreflightMethods.cloudflareApi, ['GET'])
assert.deepEqual(contract.trigger.freshReadOnlyPreflightMethods.d1, ['SELECT'])
assert.equal(contract.trigger.freshReadOnlyPreflightMustCompleteBeforeDeploy, true)
assert.equal(contract.trigger.oneFileTriggerPrRequired, true)
assert.equal(Object.hasOwn(contract.trigger, 'maximumPreflightAgeMinutesAtStart'), false)

assert.equal(contract.start.ephemeralRequestOnly, true)
assert.equal(contract.start.ephemeralRequestCommitted, false)
assert.equal(contract.start.freshPreflightEvidenceIncludedInStartArtifact, true)
assert.equal(contract.start.generatedConfigOnly, true)
assert.equal(contract.start.committedCanaryConfigMutated, false)
assert.equal(contract.start.postDeployVerificationFailureRollsBack, true)
assert.equal(contract.evidence.freshPreflightRunner, 'scripts/run-12a4-twitch-category-capture-canary-storage-preflight.mjs')
assert.equal(contract.evidence.freshPreflightArtifactFile, 'fresh-storage-preflight.json')
assert.equal(contract.evidence.separateReadOnlyAcceptancePrRequired, false)
assert.equal(contract.evidence.acceptedBaselineEvidenceStillPinned, true)

assert.equal(contract.monitor.frequency, 'every two hours')
assert.equal(contract.monitor.exactExpiryEnforcedByWrapper, true)
assert.equal(contract.monitor.maximumRollbackBindingLagHours, 2)
assert.equal(contract.hardStops.projectedNinetyDaySizeMbMax, 440)
assert.equal(contract.hardStops.projectedProviderHeadroomMbMin, 10)
assert.equal(contract.hardStops.projectedAccountWideHeadroomMbMin, 500)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.hardStops.categoryGeneratorQueriesMax, 12)
assert.equal(contract.rollback.normalConfig, 'workers/collector-twitch/wrangler.toml')
assert.equal(contract.rollback.schemaRollback, false)
assert.equal(contract.rollback.categoryDataDeletion, false)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 590)
assert.equal(storageContract.status, 'accepted')
assert.equal(storageContract.acceptance.pr, 599)
assert.equal(storageContract.acceptance.mergeSha, '785a271a7b95808e01478b9fb3846028229faa24')
assert.equal(storageContract.acceptance.allReadOnlyGatesPass, true)
assert.equal(storageContract.acceptance.productionMutationPerformed, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v20')
assert.equal(gate.currentWorkstream.phase, '12A-4-15')
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchStoragePreflight, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(kickEvidence.outcome, 'accepted')
assert.equal(kickEvidence.gates.canaryBindingsAbsent, true)

assert.equal(contract.acceptance.pr, 591)
assert.equal(contract.acceptance.mergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(contract.acceptance.mergeShaRecorded, true)
assert.equal(contract.acceptance.triggerPresent, false)
assert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(contract.acceptance.productionWorkerDeployed, false)
assert.equal(contract.acceptance.remoteD1OperationPerformed, false)
assert.equal(contract.acceptance.inlineFreshPreflightAmendmentPendingPrAcceptance, true)

assert.equal(fs.existsSync(contract.workflow.triggerPath), false)
assert.equal(fs.existsSync(contract.trigger.storagePreflightContract), true)
assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.match(workflow, /^\s*push:/m)
assert.match(workflow, /^\s*schedule:/m)
assert.ok(workflow.includes("cron: '47 */2 * * *'"))
assert.ok(workflow.includes('docs/audits/12a4-twitch-category-capture-canary-trigger.json'))
assert.ok(workflow.includes("needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(workflow.includes('Create ephemeral read-only preflight request'))
assert.ok(workflow.includes('Run fresh read-only production preflight'))
assert.ok(workflow.includes('run-12a4-twitch-category-capture-canary-storage-preflight.mjs'))
assert.ok(workflow.includes('fresh-storage-preflight.json'))
assert.ok(workflow.includes('Start bounded Twitch category canary'))
assert.ok(workflow.indexOf('Run fresh read-only production preflight') < workflow.indexOf('Start bounded Twitch category canary'))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('workerDeploymentAuthorized'))
assert.ok(workflow.includes('"workerDeploymentAuthorized": false'))
assert.ok(workflow.includes('"d1MutationAuthorized": false'))
assert.ok(workflow.includes('"triggerCreationAuthorized": false'))
assert.ok(workflow.includes('"runtimeCaptureAuthorized": false'))
assert.equal(workflow.includes('workers/collector-kick/wrangler.toml'), false)

for (const fragment of [
  'export function projectTwitchStorage',
  'PROJECTED_SIZE_MAX_MB = 440',
  'PROJECTED_PROVIDER_HEADROOM_MIN_MB = 10',
  'PROJECTED_ACCOUNT_HEADROOM_MIN_MB = 500',
  'export function renderActiveCanaryConfig',
  'export function canaryBindingsFromSettings',
  'export function bindingsMatchTrigger',
  'export function canaryBindingsAbsent',
  'fetchAllD1Databases',
  'productionRuntimeCaptureAuthorizedBeyondCanary: false',
  'permanentEnablementAuthorized: false',
  'kickStartAuthorized: false',
]) assert.ok(runner.includes(fragment), `runner missing ${fragment}`)

for (const fragment of [
  'export function inspectRequest',
  'export function assertReadOnlySql',
  'export function evaluateLatestSnapshot',
  'export function parseLastJson',
  "method: 'GET'",
  "'--remote'",
  'd1RowsWritten: 0',
  'runtimeCaptureStarted: false',
]) assert.ok(storageRunner.includes(fragment), `storage runner missing ${fragment}`)

for (const fragment of [
  "const CONFIRMATION = 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY'",
  "trigger.provider === 'twitch'",
  'loadStoragePreflight(executionContract)',
  'fresh read-only preflight required in start job',
  'fresh read-only preflight before deploy',
  'acceptedBaselinePreflightPinned: true',
  'freshReadOnlyPreflightRequiredBeforeDeploy: true',
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)
assert.equal(inspector.includes('storage preflight fresh at start'), false)

for (const fragment of [
  "assert.equal(absent.action, 'noop')",
  'pushWithOldAcceptedBaseline',
  'oldAcceptedBaselineIdentityAccepted: true',
  'inlineFreshPreflightRequired: true',
  "failure.name === 'storage preflight present'",
  "failure.name === 'storage preflight digest identity'",
  "failure.name === 'fresh read-only preflight required in start job'",
  'assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)',
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)

assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
assert.equal(/\nCATEGORY_CAPTURE_ENABLED\s*=/.test(canaryConfig), false)
assert.ok(note.includes('fresh read-only preflight'))
assert.ok(note.includes('accepted baseline evidence'))
assert.ok(note.includes('before any Worker deployment'))
assert.ok(note.includes('Cloudflare `GET` and D1 `SELECT`'))

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: 'twitch',
  acceptedExecutionPr: contract.acceptance.pr,
  acceptedExecutionMergeSha: contract.acceptance.mergeSha,
  triggerPresent: false,
  acceptedBaselinePreflightPinned: true,
  freshReadOnlyPreflightInStartJobRequired: true,
  freshPreflightBeforeDeployVerified: true,
  productionExecutionFromPullRequest: false,
  monitorFrequency: contract.monitor.frequency,
  providerStorageLimitMb: contract.hardStops.projectedNinetyDaySizeMbMax,
  accountHeadroomMinMb: contract.hardStops.projectedAccountWideHeadroomMbMin,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
