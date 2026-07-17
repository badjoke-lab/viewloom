import assert from 'node:assert/strict'
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
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-acceptance-contract.json',
  'docs/audits/12a4-kick-category-capture-canary-post-rollback-evidence.json',
  'docs/audits/12a4-kick-canary-expiry-binding-cleanup-contract.json',
  'docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json',
  'docs/audits/12a4-kick-category-capture-canary-trigger.json',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
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
check('docs/README.md', [
  'canonical gate 12A-4-12',
  'Kick category capture is not active',
  'Twitch category capture has not started',
  'artifact `8399137444`',
])

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.status, '12a4_kick_canary_final_observation_and_rollback_accepted')
assert.equal(gate.categorySourceAudit.status, 'accepted')
assert.equal(gate.categoryStorageDesign.status, 'accepted')
assert.equal(gate.categoryMigrationRuntime.status, 'accepted_and_schema_applied')
assert.equal(gate.categoryMigrationRuntime.runtimeCaptureStarted, false)
assert.equal(gate.categorySchemaExecution.status, 'accepted_and_retired')
assert.equal(gate.categorySchemaExecution.providerLeakageRows, 0)
assert.equal(gate.categoryExecutionCostProbe.status, 'accepted_and_retired')
assert.equal(gate.categoryExecutionCostProbe.cleanupRemainingRows, 0)
assert.equal(gate.categoryExecutionCostProbe.providerLeakageRows, 0)
assert.equal(gate.categoryCaptureEnablementDecision.status, 'accepted')
assert.deepEqual(gate.categoryCaptureEnablementDecision.sequence, ['kick', 'twitch'])
assert.equal(gate.categoryCaptureEnablementDecision.productionRuntimeCaptureAuthorized, false)
assert.equal(gate.kickCategoryCaptureCanaryPackage.status, 'accepted')
assert.equal(gate.kickCategoryCaptureCanaryExecutionPackage.status, 'accepted_and_retired')

assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryProductionPathRetired, true)
assert.equal(gate.categoryCapture.kickCanaryObservationActive, false)
assert.equal(gate.categoryCapture.boundedCanaryRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.categoryCapture.providerSeparated, true)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_category_capture_canary_not_evaluated',
  'runtime_category_capture_not_authorized',
])

assert.equal(gate.currentWorkstream.phase, '12A-4-12')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.deepEqual(gate.currentWorkstream.providerSequence, ['kick', 'twitch'])
assert.equal(gate.currentWorkstream.exactKickTriggerCurrent, false)
assert.equal(gate.currentWorkstream.kickCanaryObservationActive, false)
assert.equal(gate.currentWorkstream.twitchPackageBlockedUntilKickFinalEvidence, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.currentWorkstream.kickCanaryExecutionRetired, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.boundedCanaryCaptureActive, false)
assert.equal(gate.currentWorkstream.finalRollbackPending, false)

const finalAcceptance = gate.kickCategoryCaptureCanaryFinalAcceptance
assert.equal(finalAcceptance.status, 'accepted_and_retired')
assert.equal(finalAcceptance.cleanupPackagePr, 586)
assert.equal(finalAcceptance.cleanupTriggerPr, 587)
assert.equal(finalAcceptance.cleanupRetirementPr, 588)
assert.equal(finalAcceptance.workflowRunId, 29488056134)
assert.equal(finalAcceptance.workflowJobId, 87822408236)
assert.equal(finalAcceptance.artifactId, 8399137444)
assert.equal(finalAcceptance.canaryBindingsAbsent, true)
assert.equal(finalAcceptance.permanentCategoryCaptureFlagPresent, false)
assert.equal(finalAcceptance.categoryPayloadRowsAfterGrace, 0)
assert.equal(finalAcceptance.providerLeakageRows, 0)
assert.equal(finalAcceptance.normalSnapshotAfterExpiryAuthenticated, true)
assert.equal(finalAcceptance.normalSnapshotAfterExpiryNonempty, true)
assert.equal(finalAcceptance.productionExecutionPathsRetired, true)
assert.equal(finalAcceptance.twitchStartAuthorized, false)
assert.equal(finalAcceptance.permanentRuntimeCaptureAuthorized, false)

const evidence = json(finalAcceptance.evidence)
assert.equal(evidence.outcome, 'accepted')
assert.equal(evidence.artifact.workflowRunId, finalAcceptance.workflowRunId)
assert.equal(evidence.artifact.workflowJobId, finalAcceptance.workflowJobId)
assert.equal(evidence.artifact.artifactId, finalAcceptance.artifactId)
assert.equal(evidence.artifact.artifactDigest, finalAcceptance.artifactDigest)
assert.equal(evidence.gates.readOnly, true)
assert.equal(evidence.gates.canaryBindingsAbsent, true)
assert.equal(evidence.gates.permanentDirectFlagAbsent, true)
assert.equal(evidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(evidence.gates.providerLeakagePass, true)
assert.equal(evidence.gates.normalSnapshotAuthenticatedPass, true)
assert.equal(evidence.gates.normalSnapshotNonemptyPass, true)
assert.equal(evidence.gates.twitchStartAuthorized, false)
assert.equal(evidence.gates.productionMutationAuthorized, false)

const trigger = json('docs/audits/12a4-kick-category-capture-canary-trigger.json')
assert.equal(trigger.status, 'consumed_and_retired')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.retired, true)
assert.equal(trigger.finalArtifactId, 8399137444)
assert.equal(trigger.productionExecutionPathRetired, true)
assert.equal(trigger.scheduledMonitorRetired, true)

const cleanupTrigger = json('docs/audits/12a4-kick-canary-expiry-binding-cleanup-trigger.json')
assert.equal(cleanupTrigger.status, 'consumed_and_retired')
assert.equal(cleanupTrigger.oneTime, true)
assert.equal(cleanupTrigger.retired, true)

for (const file of [
  'docs/audits/12a4-category-controlled-schema-apply-trigger.json',
  'docs/audits/12a4-category-schema-recovery-audit-trigger.json',
  'docs/audits/12a4-kick-category-schema-recovery-trigger.json',
  'docs/audits/12a4-category-execution-cost-probe-trigger.json',
]) {
  const retired = json(file)
  assert.equal(retired.status, 'consumed_and_retired')
  assert.equal(retired.oneTime, true)
  assert.equal(retired.retired, true)
}

for (const workflowPath of [
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
]) {
  const workflow = read(workflowPath)
  assert.equal(/^\s*push:/m.test(workflow), false, `${workflowPath}: push must be retired`)
  assert.equal(/^\s*schedule:/m.test(workflow), false, `${workflowPath}: schedule must be retired`)
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false, `${workflowPath}: Cloudflare token reference must be absent`)
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false, `${workflowPath}: Cloudflare account reference must be absent`)
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
  finalArtifactId: finalAcceptance.artifactId,
  kickCanaryExecutionRetired: true,
  permanentRuntimeCaptureAuthorized: false,
  twitchStartAuthorized: false,
}, null, 2))
