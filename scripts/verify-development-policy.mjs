import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')
const exists = (file) => existsSync(join(root, file))
const json = (file) => JSON.parse(read(file))
const check = (file, fragments) => {
  const source = read(file)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${file}: missing ${fragment}`)
}

const requiredFiles = [
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/post-watchlist-program-plan.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a4-category-source-audit-evidence.json',
  'docs/audits/12a4-category-storage-design-contract.json',
  'docs/audits/12a4-category-storage-budget-evidence.json',
  'docs/audits/12a4-category-migration-runtime-contract.json',
  'docs/audits/12a4-category-schema-recovery-audit-evidence.json',
  'docs/audits/12a4-category-execution-cost-probe-execution-contract.json',
  'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json',
  'docs/audits/12a4-category-capture-enablement-decision-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-package-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-execution-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  'docs/work-in-progress/phase12a4-category-execution-cost-probe.md',
  'docs/work-in-progress/phase12a4-category-capture-enablement-decision.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-execution.md',
  'docs/work-in-progress/phase12a4-kick-category-capture-canary-acceptance.md',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
]
for (const file of requiredFiles) assert.ok(exists(file), `${file}: missing`)

check('docs/operations/development-and-deployment-policy.md', [
  '`main` is the production branch',
  'Merge only completed candidates',
  'Feature work and operating-policy work should remain separate',
  'Provider separation remains mandatory',
  'Twitch and Kick remain separate',
  'Coverage remains bounded and explicitly non-provider-wide',
  'production deployment deliberate and observable',
])
check('docs/work-in-progress/phase12a4-category-execution-cost-probe.md', [
  'Status: accepted and retired',
  'reserved probe rows remaining after cleanup: 0',
  'provider leakage rows: 0',
  'CATEGORY_CAPTURE_ENABLED remains absent',
])
check('docs/work-in-progress/phase12a4-kick-category-capture-canary-acceptance.md', [
  'Accepted initial checkpoint.',
  'execution-path repair PR #580',
  'exact one-file attempt 3 trigger PR #581',
  'provider leakage rows: `0`',
  'Twitch authorization: false',
  'scheduled execution workflow continues hourly read-only checkpoints',
])

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v18')
assert.equal(gate.status, '12a4_kick_canary_initial_checkpoint_accepted_observation_active')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categoryMigrationRuntime.runtimeCaptureStarted, false)
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categorySchemaExecution.twitchSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.kickSchemaState, 'complete')
assert.equal(gate.categorySchemaExecution.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.twitchGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.kickGatePass, true)
assert.equal(gate.categoryExecutionCostProbe.cleanupRemainingRows, 0)
assert.equal(gate.categoryExecutionCostProbe.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.allExecutionTriggersRetired, true)
assert.equal(gate.categoryCaptureEnablementDecision.status, 'accepted')
assert.deepEqual(gate.categoryCaptureEnablementDecision.sequence, ['kick', 'twitch'])
assert.equal(gate.categoryCaptureEnablementDecision.productionRuntimeCaptureAuthorized, false)
assert.equal(gate.kickCategoryCaptureCanaryPackage.status, 'accepted')
assert.equal(gate.kickCategoryCaptureCanaryPackage.pr, 562)
assert.equal(gate.kickCategoryCaptureCanaryPackage.committedDisabled, true)
assert.equal(gate.kickCategoryCaptureCanaryExecutionPackage.status, 'accepted')
assert.equal(gate.kickCategoryCaptureCanaryExecutionPackage.pr, 563)
assert.equal(gate.kickCategoryCaptureCanaryExecutionPackage.rollbackContainmentVerified, true)

const initial = gate.kickCategoryCaptureCanaryInitialAcceptance
assert.equal(initial.status, 'accepted_initial_checkpoint_observation_active')
assert.equal(initial.pr, 579)
assert.equal(initial.mergeSha, 'b04da1427bd5ca0f2460fb811798b04182bd2ff9')
assert.equal(initial.executionRepairPr, 580)
assert.equal(initial.triggerPr, 581)
assert.equal(initial.triggerAttempt, 3)
assert.equal(initial.kickDictionaryRows, 26)
assert.equal(initial.categoryPayloadRowsAtAcceptance, 1)
assert.equal(initial.providerLeakageRows, 0)
assert.equal(initial.permanentCategoryCaptureFlagPresent, false)
assert.equal(initial.hourlyObservationActive, true)
assert.equal(initial.finalRollbackPending, true)
assert.equal(initial.twitchChanged, false)

assert.equal(gate.categoryCapture.kickExactTriggerAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryExecuted, true)
assert.equal(gate.categoryCapture.kickCanaryInitialAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryObservationActive, true)
assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.productionCategoryRowsPresent, true)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'kick_category_capture_final_observation_not_accepted',
  'kick_category_capture_canary_rollback_not_verified',
  'runtime_category_capture_not_authorized',
])
assert.equal(gate.currentWorkstream.phase, '12A-4-11')
assert.equal(gate.currentWorkstream.name, 'Kick category capture canary 24-hour observation')
assert.equal(gate.currentWorkstream.acceptedKickCanaryInitialCheckpoint, true)
assert.deepEqual(gate.currentWorkstream.providerSequence, ['kick', 'twitch'])
assert.equal(gate.currentWorkstream.exactKickTriggerCurrent, true)
assert.equal(gate.currentWorkstream.kickCanaryObservationActive, true)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickFinalEvidence, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, true)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, true)
assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, true)
assert.equal(gate.currentWorkstream.finalRollbackPending, true)

const acceptance = json('docs/audits/12a4-kick-category-capture-canary-acceptance-contract.json')
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.acceptance.pr, 579)
assert.equal(acceptance.acceptance.triggerAttempt, 3)
assert.equal(acceptance.acceptance.allReadOnlyGatesPass, true)
assert.equal(acceptance.acceptance.serviceBindings.enabled, 'true')
assert.equal(acceptance.acceptance.serviceBindings.provider, 'kick')
assert.equal(acceptance.acceptance.serviceBindings.categoryCaptureDirectFlagPresent, false)
assert.equal(acceptance.acceptance.kickDictionaryRows, 26)
assert.equal(acceptance.acceptance.categoryPayloadRowsSinceStart, 1)
assert.equal(acceptance.acceptance.providerLeakageRows, 0)
assert.equal(acceptance.pullRequestBoundary.permanentRuntimeEnablement, false)
assert.equal(acceptance.pullRequestBoundary.twitchStartAuthorized, false)

for (const file of [
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
]) {
  const trigger = json(file)
  assert.equal(trigger.status, 'consumed_and_retired')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.retired, true)
}

const canaryWorkflow = read('.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml')
assert.ok(/^\s*push:/m.test(canaryWorkflow))
assert.ok(/^\s*schedule:/m.test(canaryWorkflow))
assert.ok(canaryWorkflow.includes("cron: '23 * * * *'"))
assert.ok(canaryWorkflow.includes("github.event_name == 'push' && needs.inspect-trigger.outputs.action == 'start'"))
assert.ok(canaryWorkflow.includes("github.event_name == 'schedule' && (needs.inspect-trigger.outputs.action == 'monitor' || needs.inspect-trigger.outputs.action == 'finalize')"))

const exactTriggerPath = 'docs/audits/12a4-kick-category-capture-canary-trigger.json'
const trigger = json(exactTriggerPath)
assert.equal(trigger.schemaVersion, 'viewloom-12a4-kick-category-capture-canary-trigger-v1')
assert.equal(trigger.status, 'armed')
assert.equal(trigger.provider, 'kick')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.confirmation, 'RUN_KICK_CATEGORY_CAPTURE_CANARY')
assert.equal(trigger.attempt, 3)
assert.equal(trigger.packagePr, 562)
assert.equal(trigger.executionPackagePr, 563)
assert.equal(trigger.startAt, '2026-07-16T03:45:00.000Z')
assert.equal(trigger.until, '2026-07-17T03:45:00.000Z')
assert.ok(new Date(trigger.until).getTime() > Date.now(), 'exact trigger is already expired')

const baseRef = process.env.GITHUB_BASE_REF
const base = baseRef ? `origin/${baseRef}` : 'HEAD^'
const mergeBase = execFileSync('git', ['merge-base', 'HEAD', base], { encoding: 'utf8' }).trim()
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)
if (changed.includes(exactTriggerPath)) {
  assert.deepEqual(changed, [exactTriggerPath], 'armed Kick trigger must be the only changed file in its trigger PR')
}

const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')
const kickCanaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(kickCanaryConfig), true)
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  currentWorkstream: gate.currentWorkstream.name,
  providerSequence: gate.currentWorkstream.providerSequence,
  acceptedKickCanaryInitialCheckpoint: gate.currentWorkstream.acceptedKickCanaryInitialCheckpoint,
  exactKickTriggerPresent: exists(exactTriggerPath),
  boundedCanaryCaptureActive: gate.currentWorkstream.boundedCanaryCaptureActive,
  permanentRuntimeCaptureAuthorized: gate.categoryCapture.runtimeCaptureAuthorized,
  twitchStartAuthorized: false,
}, null, 2))
