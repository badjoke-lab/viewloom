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

// The canonical gate remains v21 until the separate complete-structure closeout PR.
const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v21')
assert.equal(gate.status, '12a4_twitch_canary_attempt3_active_initial_checkpoint_accepted')
assert.equal(gate.currentWorkstream.phase, '12A-4-17')
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
assert.equal(gate.twitchCategoryCaptureCanaryPackage.status, 'accepted')
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.status, 'accepted_active_bounded_canary')
assert.equal(gate.twitchCategoryCaptureCanaryInitialAcceptance.status, 'accepted_active_initial_checkpoint')
assert.equal(gate.twitchCategoryCaptureCanaryInitialAcceptance.providerLeakageRows, 0)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_category_capture_final_observation_not_accepted',
  'twitch_category_capture_canary_rollback_not_verified',
  'runtime_category_capture_not_authorized',
])

const start = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-start-evidence.json')
const checkpoint = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-initial-checkpoint-evidence.json')
const finalEvidence = json('docs/audits/12a4-twitch-category-capture-canary-attempt-3-final-evidence.json')
const acceptance = json('docs/audits/12a4-twitch-category-capture-canary-post-rollback-acceptance-contract.json')

assert.equal(start.outcome, 'started')
assert.equal(start.attempt, 3)
assert.equal(start.gates.permanentEnablementAuthorized, false)
assert.equal(checkpoint.outcome, 'checkpoint_pass')
assert.equal(checkpoint.queryEvidence.providerLeakageRows, 0)
assert.equal(checkpoint.gates.hardStop, false)

assert.equal(finalEvidence.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-final-evidence-v2')
assert.equal(finalEvidence.status, 'accepted_and_retired')
assert.equal(finalEvidence.provider, 'twitch')
assert.equal(finalEvidence.attempt, 3)
assert.equal(finalEvidence.acceptancePr, 619)
assert.equal(finalEvidence.acceptanceMergeSha, '651ed2e8093a9db02cbfe18af88d9b2ecef6c919')
assert.equal(finalEvidence.acceptanceWorkflowRunId, 29683729428)
assert.equal(finalEvidence.acceptanceWorkflowJobId, 88185314749)
assert.equal(finalEvidence.acceptanceArtifactId, 8441534201)
assert.equal(finalEvidence.outcome, 'accepted')
assert.equal(finalEvidence.trigger.expired, true)
assert.equal(finalEvidence.trigger.retiredFromMain, true)
assert.equal(finalEvidence.finalizer.rollbackExitCode, 0)
assert.equal(finalEvidence.finalizer.rollbackPass, true)
assert.equal(finalEvidence.serviceBindings.canaryBindingsAbsent, true)
assert.equal(finalEvidence.serviceBindings.permanentCategoryCaptureEnabledPresent, false)
assert.equal(finalEvidence.data.categoryPayloadRowsInCanaryWindow > 0, true)
assert.equal(finalEvidence.data.categoryPayloadRowsAfterGrace, 0)
assert.equal(finalEvidence.data.providerLeakageRows, 0)
assert.equal(finalEvidence.data.latestNormalSnapshotAfterExpiry.sourceMode, 'real')
assert.equal(finalEvidence.data.latestNormalSnapshotAfterExpiry.streamCount > 0, true)
assert.equal(finalEvidence.storage.pass, true)
assert.equal(finalEvidence.gates.readOnly, true)
assert.equal(finalEvidence.gates.noCategoryPayloadAfterGrace, true)
assert.equal(finalEvidence.gates.providerLeakageZero, true)
assert.equal(finalEvidence.gates.freshRealNonemptyNormalSnapshotAfterExpiry, true)
assert.equal(finalEvidence.productionRuntimeCaptureAuthorized, false)
assert.equal(finalEvidence.permanentCategoryCaptureAuthorized, false)
assert.equal(finalEvidence.kickChanged, false)
assert.equal(finalEvidence.cadenceChanged, false)
assert.equal(finalEvidence.retentionChanged, false)
assert.equal(finalEvidence.backfillPerformed, false)
assert.equal(finalEvidence.uiChanged, false)
assert.equal(finalEvidence.crossProviderBehaviorChanged, false)

assert.equal(acceptance.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-post-rollback-acceptance-v2')
assert.equal(acceptance.status, 'accepted_and_retired')
assert.equal(acceptance.provider, 'twitch')
assert.equal(acceptance.acceptedFinalizer.artifactId, 8439540426)
assert.equal(acceptance.acceptedTrigger.expired, true)
assert.equal(acceptance.acceptedTrigger.retiredFromMain, true)
assert.equal(acceptance.acceptance.pr, 619)
assert.equal(acceptance.acceptance.workflowRunId, 29683729428)
assert.equal(acceptance.acceptance.artifactId, 8441534201)
assert.equal(acceptance.acceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(acceptance.acceptance.canaryBindingsAbsent, true)
assert.equal(acceptance.acceptance.permanentDirectFlagAbsent, true)
assert.equal(acceptance.acceptance.providerLeakageRows, 0)
assert.equal(acceptance.acceptance.freshRealNonemptyNormalSnapshotAfterExpiry, true)
assert.equal(acceptance.acceptance.storagePass, true)
assert.equal(acceptance.acceptance.productionMutationPerformed, false)
assert.equal(acceptance.retirement.pr, 620)
assert.equal(acceptance.retirement.acceptanceWorkflowRetired, true)
assert.equal(acceptance.retirement.productionProbeRetired, true)
assert.equal(acceptance.retirement.canonicalGateAdvanced, false)
assert.deepEqual(acceptance.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(acceptance.readOnlyBoundary.d1Statements, ['SELECT'])
assert.equal(acceptance.permanentRuntimeCaptureAuthorized, false)
assert.equal(acceptance.permanentCategoryCaptureAuthorized, false)

for (const retiredPath of [
  'docs/audits/12a4-twitch-category-capture-canary-trigger.json',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-post-rollback-acceptance.yml',
  'scripts/check-12a4-twitch-category-capture-canary-post-rollback-acceptance-scope.mjs',
  'scripts/run-12a4-twitch-category-capture-canary-post-rollback-acceptance.mjs',
  'scripts/verify-12a4-twitch-category-capture-canary-post-rollback-acceptance-package.mjs',
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
  phase: '12A-4-18 final Twitch evidence accepted; canonical v22 pending',
  acceptanceRunId: finalEvidence.acceptanceWorkflowRunId,
  categoryPayloadRowsAfterGrace: finalEvidence.data.categoryPayloadRowsAfterGrace,
  canaryBindingsAbsent: finalEvidence.serviceBindings.canaryBindingsAbsent,
  exactTwitchTriggerCurrent: false,
  twitchExecutionWorkflowRetired: true,
  twitchAcceptanceWorkflowRetired: true,
  permanentRuntimeCaptureAuthorized: false,
  canonicalGatePendingFinalAcceptance: true,
  kickChanged: false,
}, null, 2))
