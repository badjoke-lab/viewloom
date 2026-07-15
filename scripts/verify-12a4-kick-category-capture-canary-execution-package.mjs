import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const exists = (file) => fs.existsSync(path.join(root, file))

const contract = json('docs/audits/12a4-kick-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-kick-category-capture-canary-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const workflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml')
const inspector = read('scripts/inspect-12a4-kick-category-capture-canary-trigger.mjs')
const runner = read('scripts/run-12a4-kick-category-capture-canary-execution.mjs')
const fixture = read('scripts/test-12a4-kick-category-capture-canary-execution.mjs')
const wip = read('docs/work-in-progress/phase12a4-kick-category-capture-canary-execution.md')
const triggerPath = contract.workflow.triggerPath

assert.equal(contract.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-execution-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.acceptedPackage.pr, 562)
assert.equal(contract.acceptedPackage.mergeSha, '8dc53c6041f425f78e82cddb62328cff1128120f')
assert.equal(contract.acceptedPackage.provider, 'kick')
assert.equal(contract.acceptedPackage.committedDisabled, true)
assert.equal(contract.acceptedPackage.minimumObservationHours, 24)
assert.equal(contract.workflow.triggerMayBeAbsentInPackagePr, true)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionExecutionFromPackagePr, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)
assert.equal(contract.workflow.automaticTwitchStart, false)
assert.equal(contract.trigger.statusRequired, 'armed')
assert.equal(contract.trigger.providerRequired, 'kick')
assert.equal(contract.trigger.oneTimeRequired, true)
assert.equal(contract.trigger.confirmationRequired, 'RUN_KICK_CATEGORY_CAPTURE_CANARY')
assert.equal(contract.trigger.exactPackagePr, 562)
assert.equal(contract.trigger.exactPackageMergeSha, '8dc53c6041f425f78e82cddb62328cff1128120f')
assert.equal(contract.trigger.windowHoursMin, 23)
assert.equal(contract.trigger.windowHoursMax, 25)
assert.equal(contract.trigger.oneFileTriggerPrRequired, true)
assert.equal(contract.start.generatedConfigOnly, true)
assert.equal(contract.start.committedCanaryConfigMutated, false)
assert.equal(contract.monitor.beforeStartAction, 'no-op')
assert.equal(contract.monitor.duringWindowAction, 'inspect and checkpoint')
assert.equal(contract.monitor.afterWindowAction, 'finalize and rollback')
assert.equal(contract.monitor.alreadyRolledBackAction, 'no-op')
assert.equal(contract.hardStops.projectedNinetyDaySizeMbMax, 330)
assert.equal(contract.hardStops.projectedProviderHeadroomMbMin, 100)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.hardStops.hardStopAction, 'deploy normal Kick config and freeze failure evidence')
assert.equal(contract.rollback.requiredAtExpiry, true)
assert.equal(contract.rollback.requiredAtHardStop, true)
assert.equal(contract.rollback.schemaRollback, false)
assert.equal(contract.rollback.categoryDataDeletion, false)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.separateReadOnlyAcceptancePrRequired, true)
assert.equal(contract.acceptance.pr, 563)
assert.equal(contract.acceptance.triggerPresent, false)
assert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(contract.acceptance.productionWorkerDeployed, false)
assert.equal(contract.acceptance.remoteD1OperationPerformed, false)
assert.equal(contract.acceptance.mergeSha, null)
assert.equal(contract.acceptance.mergeShaRecorded, false)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 562)
assert.equal(packageContract.package.committedDisabled, true)
assert.equal(packageContract.package.automaticExpiryRequired, true)
assert.equal(packageContract.package.automaticTwitchStart, false)
assert.equal(packageContract.pullRequestBoundary.productionRuntimeCaptureStarted, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v16')
assert.equal(gate.currentWorkstream.phase, '12A-4-8')
assert.equal(gate.currentWorkstream.kickPackageDesignCurrent, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickEvidence, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, false)

assert.equal(exists(triggerPath), false, 'package PR must not contain the exact production trigger')

for (const fragment of [
  "const CONFIRMATION = 'RUN_KICK_CATEGORY_CAPTURE_CANARY'",
  "eventName === 'push'",
  "eventName === 'schedule'",
  "action = phase === 'before_start' ? 'noop' : phase === 'active_window' ? 'monitor' : 'finalize'",
  'executionPackageMergeSha',
  'windowMs >= MIN_WINDOW_MS && windowMs <= MAX_WINDOW_MS',
  'writeOutputs(result)',
]) assert.ok(inspector.includes(fragment), `trigger inspector missing ${fragment}`)

for (const fragment of [
  'export function projectKickStorage',
  'KICK_INCREMENTAL_MB_WITH_SAFETY = 22.01',
  'PROJECTED_SIZE_MAX_MB = 330',
  'PROJECTED_HEADROOM_MIN_MB = 100',
  'export function renderActiveCanaryConfig',
  'export function canaryBindingsAbsent',
  "if (rendered.includes('CATEGORY_CAPTURE_ENABLED ='))",
  'let canaryDeploySucceeded = false',
  'canaryDeploySucceeded = true',
  "if (action !== 'start' || canaryDeploySucceeded) shouldRollback = true",
  "evidence.outcome = 'already_rolled_back_noop'",
  '!bindingsMatchTrigger(evidence.serviceBindingsBefore, trigger)',
  'fetchD1Info',
  'fetchWorkerSettings',
  'runKickEvidenceQueries',
  "action === 'finalize'",
  "wrangler@4', 'deploy'",
  'waitForNormalBindings',
  'productionRuntimeCaptureAuthorizedBeyondCanary: false',
  'TwitchStartAuthorized: false',
  'sanitize(',
]) assert.ok(runner.includes(fragment), `execution runner missing ${fragment}`)
assert.equal(runner.includes('CLOUDFLARE_API_TOKEN ??'), true)
assert.equal(runner.includes('authorization: `Bearer ${apiToken}`'), true)
assert.equal(runner.includes('rawDeploymentLogs'), false)
assert.equal(runner.includes('API token'), false)

for (const fragment of [
  "assert.equal(absent.action, 'noop')",
  "assert.equal(pushBefore.action, 'start')",
  "assert.equal(active.action, 'monitor')",
  "assert.equal(expired.action, 'finalize')",
  "assert.equal(badIdentity.action, 'reject')",
  'assert.equal(goodStorage.pass, true)',
  'assert.equal(badStorage.pass, false)',
  'assert.equal(bindingsMatchTrigger(bindings, trigger), true)',
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
  'assert.equal(canaryBindingsAbsent(partialBindings), false)',
  'assert.equal(directFlagBindings.categoryCaptureDirectFlagPresent, true)',
]) assert.ok(fixture.includes(fragment), `execution fixture missing ${fragment}`)

assert.ok(/^\s*push:/m.test(workflow), 'exact-trigger push event missing')
assert.ok(/^\s*schedule:/m.test(workflow), 'hourly monitor event missing')
assert.ok(workflow.includes("cron: '23 * * * *'"), 'hourly monitor cadence missing')
assert.ok(workflow.includes("github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'"), 'validation-only event boundary missing')
assert.ok(workflow.includes("github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'"), 'start job event gate missing')
assert.ok(workflow.includes("github.event_name == 'schedule' && (needs.inspect-trigger.outputs.action == 'monitor' || needs.inspect-trigger.outputs.action == 'finalize')"), 'monitor job event gate missing')
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'))
assert.ok(workflow.includes('verify-development-policy.mjs'))
assert.ok(workflow.includes('test-12a4-kick-category-capture-canary-execution.mjs'))
assert.ok(workflow.includes('wrangler@4 deploy --dry-run --config workers/collector-kick/wrangler.category-canary.toml'))
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

for (const fragment of [
  'accepted dormant execution package',
  'Accepted execution package PR: #563',
  'exact trigger file: absent',
  'execution merge SHA in contract: pending',
  'hourly monitor without trigger: no-op',
  'No GitHub job sleeps for 24 hours',
  'projected 90-day Kick size <= 330 MB',
  'provider leakage rows > 0',
  'no production deploy',
  'Record the actual PR #563 squash merge SHA',
]) assert.ok(wip.includes(fragment), `execution WIP missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  triggerPresent: false,
  packagePr: contract.acceptedPackage.pr,
  packageMergeSha: contract.acceptedPackage.mergeSha,
  pullRequestValidationOnly: contract.workflow.pullRequestValidationOnly,
  rollbackContainment: true,
  alreadyRolledBackNoop: true,
  productionRuntimeCaptureStarted: false,
  TwitchStartAuthorized: false,
}, null, 2))
