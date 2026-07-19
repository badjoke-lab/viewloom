import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (file) => readFileSync(join(root, file), 'utf8')
const exists = (file) => existsSync(join(root, file))
const json = (file) => JSON.parse(read(file))
const requireFiles = (files) => files.forEach((file) => assert.equal(exists(file), true, `${file}: missing`))

requireFiles([
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
  'docs/audits/12a4-category-execution-cost-probe-attempt-3-evidence.json',
  'docs/audits/12a4-category-capture-enablement-decision-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json',
  'docs/audits/12a4-twitch-category-capture-canary-package-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-execution-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json',
  'docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json',
  'docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json',
  'docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json',
  'docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json',
  'docs/work-in-progress/phase12a4-twitch-category-capture-canary-post-rollback-acceptance.md',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-canary.toml',
  'workers/collector-kick/wrangler.toml',
  'workers/collector-kick/wrangler.category-canary.toml',
])

const policy = read('docs/operations/development-and-deployment-policy.md')
for (const fragment of [
  '`main` is the production branch',
  'Merge only completed candidates',
  'Provider separation remains mandatory',
  'Twitch and Kick remain separate',
  'production deployment deliberate and observable',
]) assert.ok(policy.includes(fragment), `development policy missing: ${fragment}`)

const docsIndex = read('docs/README.md')
for (const fragment of [
  'canonical gate 12A-4-18 provider canaries accepted and retired',
  'Twitch category payload after expiry grace: 0 rows',
  'Twitch bounded category capture active no',
  'permanent runtime category capture authorized no',
]) assert.ok(docsIndex.includes(fragment), `docs index missing: ${fragment}`)

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v22')
assert.equal(gate.status, '12a4_provider_canaries_accepted_and_retired')
assert.equal(gate.currentWorkstream.phase, '12A-4-18')
assert.equal(gate.currentWorkstream.name, 'Provider-separated category canaries accepted and retired')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryCaptureEnablementDecision.status, 'accepted')
assert.deepEqual(gate.categoryCaptureEnablementDecision.sequence, ['kick', 'twitch'])
assert.equal(gate.categoryCaptureEnablementDecision.productionRuntimeCaptureAuthorized, false)
assert.equal(gate.kickCategoryCaptureCanaryFinalAcceptance.status, 'accepted_and_retired')
assert.equal(gate.kickCategoryCaptureCanaryFinalAcceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(gate.kickCategoryCaptureCanaryFinalAcceptance.providerLeakageRows, 0)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.status, 'accepted_and_retired')
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.triggerPresent, false)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.productionRuntimeCaptureStarted, false)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.productionExecutionPathRetired, true)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.scheduledMonitorRetired, true)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.closeoutPr, 620)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.closeoutMergeSha, '4bc053e451ebfee237080fa024c59443316a27b9')

assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.kickCanaryObservationActive, false)
assert.equal(gate.categoryCapture.twitchCanaryObservationActive, false)
assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryProductionPathRetired, true)
assert.equal(gate.categoryCapture.twitchCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.twitchCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.twitchCanaryProductionPathRetired, true)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, ['runtime_category_capture_not_authorized'])
assert.ok(gate.closedBlockers.includes('twitch_category_capture_final_observation_not_accepted'))
assert.ok(gate.closedBlockers.includes('twitch_category_capture_canary_rollback_not_verified'))

assert.equal(gate.currentWorkstream.exactTwitchTriggerCurrent, false)
assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, false)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryFinalEvidence, true)
assert.equal(gate.currentWorkstream.twitchCanaryExecutionRetired, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, false)
assert.equal(gate.currentWorkstream.finalRollbackPending, false)
assert.equal(gate.currentWorkstream.twitchCanaryRollbackVerified, true)
assert.equal(gate.currentWorkstream.crossProviderAnalyticsAllowed, false)

const start = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')
const checkpoint = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')
const finalEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json')
const acceptance = json('docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json')
const finalAcceptance = gate.twitchCategoryCaptureCanaryFinalAcceptance

assert.equal(start.outcome, 'started')
assert.equal(checkpoint.outcome, 'checkpoint_pass')
assert.equal(checkpoint.queryEvidence.providerLeakageRows, 0)
assert.equal(finalEvidence.status, 'accepted_and_retired')
assert.equal(finalEvidence.outcome, 'accepted')
assert.equal(finalEvidence.acceptancePr, 619)
assert.equal(finalEvidence.acceptanceMergeSha, '651ed2e8093a9db02cbfe18af88d9b2ecef6c919')
assert.equal(finalEvidence.finalizer.rollbackPass, true)
assert.equal(finalEvidence.serviceBindings.canaryBindingsAbsent, true)
assert.equal(finalEvidence.serviceBindings.permanentCategoryCaptureEnabledPresent, false)
assert.equal(finalEvidence.data.categoryPayloadRowsAfterGrace, 0)
assert.equal(finalEvidence.data.providerLeakageRows, 0)
assert.equal(finalEvidence.gates.freshRealNonemptyNormalSnapshotAfterExpiry, true)
assert.equal(finalEvidence.storage.pass, true)
assert.equal(finalEvidence.productionRuntimeCaptureAuthorized, false)
assert.equal(finalEvidence.permanentCategoryCaptureAuthorized, false)
assert.equal(finalEvidence.kickChanged, false)
assert.equal(finalEvidence.cadenceChanged, false)
assert.equal(finalEvidence.retentionChanged, false)
assert.equal(finalEvidence.backfillPerformed, false)
assert.equal(finalEvidence.uiChanged, false)
assert.equal(finalEvidence.crossProviderBehaviorChanged, false)

assert.equal(acceptance.status, 'accepted_and_retired')
assert.equal(acceptance.acceptance.pr, 619)
assert.equal(acceptance.acceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(acceptance.retirement.pr, 620)
assert.equal(acceptance.retirement.mergeSha, '4bc053e451ebfee237080fa024c59443316a27b9')
assert.equal(acceptance.retirement.canonicalGateAdvanced, true)
assert.equal(acceptance.retirement.canonicalGateSchemaVersion, gate.schemaVersion)
assert.equal(acceptance.retirement.canonicalGatePhase, gate.currentWorkstream.phase)
assert.equal(acceptance.permanentRuntimeCaptureAuthorized, false)
assert.equal(acceptance.permanentCategoryCaptureAuthorized, false)

assert.equal(finalAcceptance.status, 'accepted_and_retired')
assert.equal(finalAcceptance.acceptancePr, finalEvidence.acceptancePr)
assert.equal(finalAcceptance.acceptanceWorkflowRunId, finalEvidence.acceptanceWorkflowRunId)
assert.equal(finalAcceptance.acceptanceArtifactId, finalEvidence.acceptanceArtifactId)
assert.equal(finalAcceptance.closeoutPr, 620)
assert.equal(finalAcceptance.closeoutMergeSha, '4bc053e451ebfee237080fa024c59443316a27b9')
assert.equal(finalAcceptance.canaryBindingsAbsent, true)
assert.equal(finalAcceptance.permanentCategoryCaptureFlagPresent, false)
assert.equal(finalAcceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(finalAcceptance.providerLeakageRows, 0)
assert.equal(finalAcceptance.normalSnapshotAfterExpiryReal, true)
assert.equal(finalAcceptance.normalSnapshotAfterExpiryNonempty, true)
assert.equal(finalAcceptance.productionExecutionPathsRetired, true)
assert.equal(finalAcceptance.kickChanged, false)
assert.equal(finalAcceptance.permanentRuntimeCaptureAuthorized, false)

for (const retiredPath of [
  'docs/audits/12a4-twitch-category-capture-canary-trigger.json',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-post-rollback-acceptance.yml',
  'scripts/check-12a4-twitch-category-capture-canary-post-rollback-acceptance-scope.mjs',
  'scripts/run-12a4-twitch-category-capture-canary-post-rollback-acceptance.mjs',
  'scripts/verify-12a4-twitch-category-capture-canary-post-rollback-acceptance-package.mjs',
  '.github/workflows/reconcile-12a4-category-gate-v22.yml',
  'scripts/reconcile-12a4-category-gate-v22.mjs',
]) assert.equal(exists(retiredPath), false, `${retiredPath}: must be retired`)

for (const workflowPath of [
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml',
]) {
  const workflow = read(workflowPath)
  assert.equal(/^\s*push:/m.test(workflow), false, `${workflowPath}: push must be absent`)
  assert.equal(/^\s*schedule:/m.test(workflow), false, `${workflowPath}: schedule must be absent`)
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false, `${workflowPath}: Cloudflare token reference must be absent`)
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false, `${workflowPath}: Cloudflare account reference must be absent`)
}

const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const twitchCanaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')
const kickCanaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(twitchCanaryConfig), true)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(kickCanaryConfig), true)
assert.equal(twitchConfig.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1], '*/5 * * * *')
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  status: gate.status,
  acceptanceRunId: finalEvidence.acceptanceWorkflowRunId,
  categoryPayloadRowsAfterGrace: finalEvidence.data.categoryPayloadRowsAfterGrace,
  canaryBindingsAbsent: finalEvidence.serviceBindings.canaryBindingsAbsent,
  twitchExecutionWorkflowRetired: true,
  permanentRuntimeCaptureAuthorized: false,
  openBlockers: gate.openBlockers,
  kickChanged: false,
}, null, 2))
