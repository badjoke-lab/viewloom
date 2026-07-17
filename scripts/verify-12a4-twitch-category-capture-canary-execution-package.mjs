import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))

const contract = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const kickEvidence = json('docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json')
const workflow = read(contract.workflow.path)
const runner = read(contract.evidence.runner)
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
assert.equal(contract.trigger.maximumPreflightAgeMinutesAtStart, 60)
assert.equal(contract.trigger.oneFileTriggerPrRequired, true)
assert.equal(contract.monitor.frequency, 'every two hours')
assert.equal(contract.monitor.exactExpiryEnforcedByWrapper, true)
assert.equal(contract.monitor.maximumRollbackBindingLagHours, 2)
assert.equal(contract.hardStops.projectedNinetyDaySizeMbMax, 440)
assert.equal(contract.hardStops.projectedProviderHeadroomMbMin, 10)
assert.equal(contract.hardStops.projectedAccountWideHeadroomMbMin, 500)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.hardStops.categoryGeneratorQueriesMax, 12)
assert.equal(contract.hardStops.collectorLatencyDeltaMsMax, 2000)
assert.equal(contract.rollback.normalConfig, 'workers/collector-twitch/wrangler.toml')
assert.equal(contract.rollback.schemaRollback, false)
assert.equal(contract.rollback.categoryDataDeletion, false)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(contract.evidence.separateReadOnlyAcceptancePrRequired, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 590)
assert.equal(packageContract.package.committedDisabled, true)
assert.equal(packageContract.package.productionExecutionFromPackagePr, false)
assert.equal(packageContract.preflight.projectedNinetyDaySizeMbMax, 440)
assert.equal(packageContract.preflight.projectedProviderHeadroomMbMin, 10)
assert.equal(packageContract.preflight.projectedAccountWideHeadroomMbMin, 500)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.status, '12a4_kick_canary_final_observation_and_rollback_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(kickEvidence.outcome, 'accepted')
assert.equal(kickEvidence.artifact.artifactId, 8399137444)
assert.equal(kickEvidence.gates.canaryBindingsAbsent, true)

assert.equal(contract.acceptance.pr, 591)
assert.equal(contract.acceptance.validatedCandidateHeadSha, '4a97486545926b251ee3307946f625310119becf')
assert.equal(contract.acceptance.workflowRunId, 29576877370)
assert.equal(contract.acceptance.workflowJobId, 87873237039)
assert.equal(contract.acceptance.scopePass, true)
assert.equal(contract.acceptance.contractPass, true)
assert.equal(contract.acceptance.triggerFixturePass, true)
assert.equal(contract.acceptance.storageFixturePass, true)
assert.equal(contract.acceptance.bindingFixturePass, true)
assert.equal(contract.acceptance.rollbackContainmentPass, true)
assert.equal(contract.acceptance.alreadyRolledBackNoopPass, true)
assert.equal(contract.acceptance.mismatchedBindingsRollbackPass, true)
assert.equal(contract.acceptance.normalTwitchBundlePass, true)
assert.equal(contract.acceptance.disabledCanaryBundlePass, true)
assert.equal(contract.acceptance.startJobSkipped, true)
assert.equal(contract.acceptance.monitorJobSkipped, true)
assert.equal(contract.acceptance.triggerInspectorJobSkipped, true)
assert.equal(contract.acceptance.triggerPresent, false)
assert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(contract.acceptance.productionWorkerDeployed, false)
assert.equal(contract.acceptance.remoteD1OperationPerformed, false)
assert.equal(contract.acceptance.mergeSha, '5c302c8b674edd1d13ab5a467465ed60d0fb96c5')
assert.equal(contract.acceptance.mergeShaRecorded, true)

assert.equal(fs.existsSync(contract.workflow.triggerPath), false)
assert.equal(fs.existsSync(contract.trigger.storagePreflightContract), false)
assert.match(workflow, /^\s*pull_request:/m)
assert.match(workflow, /^\s*workflow_dispatch:/m)
assert.match(workflow, /^\s*push:/m)
assert.match(workflow, /^\s*schedule:/m)
assert.ok(workflow.includes("cron: '47 */2 * * *'"))
assert.ok(workflow.includes('docs/audits/12a4-twitch-category-capture-canary-trigger.json'))
assert.ok(workflow.includes("github.event_name == 'push'"))
assert.ok(workflow.includes("github.event_name == 'schedule'"))
assert.ok(workflow.includes("github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'"))
assert.ok(workflow.includes("needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(workflow.includes("needs.inspect-trigger.outputs.action == 'monitor' || needs.inspect-trigger.outputs.action == 'finalize'"))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.toml'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-twitch/wrangler.category-canary.toml'))
assert.equal(workflow.includes('workers/collector-kick/wrangler.toml'), false)

for (const fragment of [
  'export function projectTwitchStorage',
  'TWITCH_INCREMENTAL_MB_WITH_SAFETY = 48.32',
  'PROJECTED_SIZE_MAX_MB = 440',
  'PROJECTED_PROVIDER_HEADROOM_MIN_MB = 10',
  'PROJECTED_ACCOUNT_HEADROOM_MIN_MB = 500',
  'export function renderActiveCanaryConfig',
  "CATEGORY_CAPTURE_CANARY_PROVIDER', 'twitch'",
  'export function canaryBindingsFromSettings',
  'export function bindingsMatchTrigger',
  "bindings.provider === 'twitch'",
  'export function canaryBindingsAbsent',
  'fetchAllD1Databases',
  'runTwitchEvidenceQueries',
  "evidence.outcome = 'already_rolled_back_noop'",
  'productionRuntimeCaptureAuthorizedBeyondCanary: false',
  'permanentEnablementAuthorized: false',
  'kickStartAuthorized: false',
]) assert.ok(runner.includes(fragment), `runner missing ${fragment}`)

for (const fragment of [
  "const CONFIRMATION = 'RUN_TWITCH_CATEGORY_CAPTURE_CANARY'",
  "trigger.provider === 'twitch'",
  'loadStoragePreflight(executionContract)',
  "storagePreflight.status === executionContract.trigger.storagePreflightStatusRequired",
  "trigger.storagePreflightPr === storagePreflight.acceptance?.pr",
  "trigger.storagePreflightEvidenceDigest === storagePreflight.evidence?.digest",
  "failure.name === 'storage preflight fresh at start'",
  "action = phase === 'after_expiry' ? 'reject' : 'start'",
  "phase === 'active_window' ? 'monitor' : 'finalize'",
  "docs/audits/12a4-twitch-category-capture-canary-trigger.json",
]) assert.ok(inspector.includes(fragment), `inspector missing ${fragment}`)

for (const fragment of [
  "assert.equal(absent.action, 'noop')",
  "assert.equal(pushBefore.action, 'start')",
  "assert.equal(active.action, 'monitor')",
  "assert.equal(expired.action, 'finalize')",
  "failure.name === 'storage preflight present'",
  "failure.name === 'storage preflight fresh at start'",
  "failure.name === 'storage preflight digest identity'",
  'assert.equal(acceptedStorage.projectedNinetyDaySizeMb, 438.7)',
  'assert.equal(acceptedStorage.projectedAccountWideHeadroomMb, 843.09)',
  'assert.equal(providerFailure.pass, false)',
  'assert.equal(accountFailure.pass, false)',
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
  'assert.equal(bindingsMatchTrigger(mismatchedBindings, trigger), false)',
]) assert.ok(fixture.includes(fragment), `fixture missing ${fragment}`)

assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)
assert.ok(canaryConfig.includes('CATEGORY_CAPTURE_CANARY_ENABLED = "false"'))
assert.equal(/\nCATEGORY_CAPTURE_ENABLED\s*=/.test(canaryConfig), false)
assert.ok(note.includes('Accepted dormant execution/evidence package. No trigger exists and production execution is not authorized.'))
assert.ok(note.includes('workflow run `29576877370`, job `87873237039`'))
assert.ok(note.includes('every two hours'))
assert.ok(note.includes('no older than 60 minutes'))
assert.ok(note.includes('`48.32 MB`'))
assert.ok(note.includes('`440 MB`'))
assert.ok(note.includes('`10 MB`'))
assert.ok(note.includes('`500 MB`'))

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  provider: 'twitch',
  acceptedExecutionPr: contract.acceptance.pr,
  acceptedExecutionMergeSha: contract.acceptance.mergeSha,
  triggerPresent: false,
  storagePreflightPresent: false,
  storagePreflightRequiredBeforeTrigger: true,
  maximumPreflightAgeMinutesAtStart: contract.trigger.maximumPreflightAgeMinutesAtStart,
  productionExecutionFromPullRequest: false,
  monitorFrequency: contract.monitor.frequency,
  exactExpiryEnforcedByWrapper: true,
  providerStorageLimitMb: contract.hardStops.projectedNinetyDaySizeMbMax,
  accountHeadroomMinMb: contract.hardStops.projectedAccountWideHeadroomMbMin,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
