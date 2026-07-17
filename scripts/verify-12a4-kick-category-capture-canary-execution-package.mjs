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
assert.equal(contract.start.postDeployVerificationFailureRollsBack, true)
assert.equal(contract.monitor.beforeStartAction, 'no-op')
assert.equal(contract.monitor.duringWindowAction, 'inspect and checkpoint')
assert.equal(contract.monitor.afterWindowAction, 'finalize and rollback')
assert.equal(contract.monitor.alreadyRolledBackAction, 'no-op')
assert.equal(contract.monitor.mismatchedBindingsAction, 'hard stop and rollback')
assert.equal(contract.hardStops.projectedNinetyDaySizeMbMax, 330)
assert.equal(contract.hardStops.projectedProviderHeadroomMbMin, 100)
assert.equal(contract.hardStops.providerLeakageRowsMax, 0)
assert.equal(contract.rollback.requiredAtExpiry, true)
assert.equal(contract.rollback.requiredAtHardStop, true)
assert.equal(contract.rollback.requiredAfterPostDeployVerificationFailure, true)
assert.equal(contract.rollback.schemaRollback, false)
assert.equal(contract.rollback.categoryDataDeletion, false)
assert.equal(contract.rollback.canaryBindingsAbsentAfterRollbackRequired, true)
assert.equal(contract.evidence.sanitizedJsonOnly, true)
assert.equal(contract.evidence.separateReadOnlyAcceptancePrRequired, true)
assert.equal(contract.acceptance.pr, 563)
assert.equal(contract.acceptance.validatedCandidateHeadSha, 'e6b2e05811dfc70b262239603407254cc8d94246')
assert.equal(contract.acceptance.workflowRunId, 29387873802)
assert.equal(contract.acceptance.workflowJobId, 87264801162)
assert.equal(contract.acceptance.rollbackContainmentPass, true)
assert.equal(contract.acceptance.alreadyRolledBackNoopPass, true)
assert.equal(contract.acceptance.mismatchedBindingsRollbackPass, true)
assert.equal(contract.acceptance.mergeSha, '9391fd1479d3c149303637ae65deae7abf0e9b7d')
assert.equal(contract.acceptance.mergeShaRecorded, true)
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 562)
assert.equal(packageContract.package.committedDisabled, true)
assert.equal(packageContract.package.automaticExpiryRequired, true)
assert.equal(packageContract.package.automaticTwitchStart, false)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v18')
assert.equal(gate.status, '12a4_kick_canary_initial_checkpoint_accepted_observation_active')
assert.equal(gate.currentWorkstream.phase, '12A-4-11')
assert.equal(gate.currentWorkstream.acceptedKickCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedKickCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedKickCanaryInitialCheckpoint, true)
assert.equal(gate.currentWorkstream.exactKickTriggerCurrent, true)
assert.equal(gate.currentWorkstream.kickCanaryObservationActive, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickFinalEvidence, true)
assert.equal(gate.categoryCapture.kickExactTriggerAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryExecuted, true)
assert.equal(gate.categoryCapture.kickCanaryInitialAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, true)

assert.equal(exists(triggerPath), true, 'rollback cleanup requires the retained attempt-3 trigger identity')
const trigger = json(triggerPath)
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.confirmation, 'RUN_KICK_CATEGORY_CAPTURE_CANARY')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.packagePr, contract.trigger.exactPackagePr)
assert.equal(trigger.packageMergeSha, contract.trigger.exactPackageMergeSha)
assert.equal(trigger.executionPackagePr, contract.acceptance.pr)
assert.equal(trigger.executionPackageMergeSha, contract.acceptance.mergeSha)
assert.ok(Date.now() >= new Date(trigger.until).getTime(), 'attempt-3 trigger must be expired during rollback cleanup validation')

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
  'export function generatedCanaryConfigPath',
  'path.dirname(path.resolve(templatePath))',
  'fs.rmSync(activeConfigPath, { force: true })',
  'export function canaryBindingsAbsent',
  "if (rendered.includes('CATEGORY_CAPTURE_ENABLED ='))",
  'let canaryDeploySucceeded = false',
  'canaryDeploySucceeded = true',
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
assert.equal(runner.includes('FROM collector_status'), false)
assert.ok(runner.includes('SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode FROM minute_snapshots'))
assert.equal(runner.includes('rawDeploymentLogs'), false)

for (const fragment of [
  "assert.equal(absent.action, 'noop')",
  "assert.equal(pushBefore.action, 'start')",
  "assert.equal(active.action, 'monitor')",
  "assert.equal(expired.action, 'finalize')",
  'assert.equal(goodStorage.pass, true)',
  'assert.equal(badStorage.pass, false)',
  'assert.equal(path.dirname(activeConfigPath), path.dirname(templatePath))',
  'assert.equal(bindingsMatchTrigger(bindings, trigger), true)',
  'assert.equal(canaryBindingsAbsent(normalBindings), true)',
]) assert.ok(fixture.includes(fragment), `execution fixture missing ${fragment}`)

assert.ok(/^\s*push:/m.test(workflow), 'exact-trigger push event missing')
assert.ok(/^\s*schedule:/m.test(workflow), 'hourly monitor event missing')
assert.ok(workflow.includes("cron: '23 * * * *'"), 'hourly monitor cadence missing')
assert.ok(workflow.includes("github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(workflow.includes("github.event_name == 'schedule' && (needs.inspect-trigger.outputs.action == 'monitor' || needs.inspect-trigger.outputs.action == 'finalize')"))
assert.ok(workflow.includes('CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}'))
assert.ok(workflow.includes('CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}'))
assert.ok(workflow.includes('verify-development-policy.mjs'))
assert.equal(workflow.includes('CATEGORY_CAPTURE_ENABLED='), false)

for (const fragment of [
  'Status: accepted and merge identity recorded',
  'Accepted execution package PR: #563',
  'execution package merge SHA: `9391fd1479d3c149303637ae65deae7abf0e9b7d`',
  'post-deploy verification failure rollback: verified',
  'already-rolled-back hourly no-op: verified',
  'No GitHub job sleeps for 24 hours',
  'projected 90-day Kick size <= 330 MB',
  'provider leakage rows > 0',
  'no production deploy',
  '12A-4-10 is the exact one-file Kick category capture canary trigger',
]) assert.ok(wip.includes(fragment), `execution WIP missing ${fragment}`)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  acceptedCandidateHeadSha: contract.acceptance.validatedCandidateHeadSha,
  executionMergeSha: contract.acceptance.mergeSha,
  triggerPresent: true,
  triggerAttempt: trigger.attempt,
  packagePr: contract.acceptedPackage.pr,
  currentPhase: gate.currentWorkstream.phase,
  generatedConfigDirectoryMatchesTemplate: true,
  kickHealthSource: 'latest_minute_snapshot',
  rollbackContainment: true,
  boundedCanaryCaptureActive: true,
  permanentRuntimeCaptureAuthorized: false,
  TwitchStartAuthorized: false,
}, null, 2))
