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
  'docs/audits/12a4-twitch-category-capture-canary-package-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-execution-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-kick-category-capture-canary-post-rollback-acceptance.yml',
  '.github/workflows/analytics-12a4-kick-canary-expiry-binding-cleanup.yml',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-execution.yml',
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-twitch/wrangler.category-canary.toml',
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
  'canonical gate 12A-4-15',
  'Twitch read-only storage preflight accepted PR #599 and finalized PR #600',
  'exact Twitch trigger current no',
  'fresh Twitch storage evidence for start no',
  'Twitch category capture started no',
  'artifact: `8413901173`',
])

const gate = json('docs/audits/12a2-current-gate-state.json')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v20')
assert.equal(gate.status, '12a4_twitch_canary_storage_preflight_accepted_trigger_blocked_by_freshness')
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
assert.equal(gate.twitchCategoryCaptureCanaryPackage.status, 'accepted')
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.status, 'accepted_dormant')
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.triggerPresent, false)
assert.equal(gate.twitchCategoryCaptureCanaryExecutionPackage.productionRuntimeCaptureStarted, false)

const twitchPreflight = gate.twitchCategoryCaptureCanaryStoragePreflight
assert.equal(twitchPreflight.status, 'accepted')
assert.equal(twitchPreflight.packagePr, 594)
assert.equal(twitchPreflight.parserFixPr, 598)
assert.equal(twitchPreflight.acceptancePr, 599)
assert.equal(twitchPreflight.acceptanceMergeSha, '785a271a7b95808e01478b9fb3846028229faa24')
assert.equal(twitchPreflight.finalizationPr, 600)
assert.equal(twitchPreflight.finalizationMergeSha, 'b7a86ed7cc954c138d3e5a3281a5302e9bc17604')
assert.equal(twitchPreflight.workflowRunId, 29598193753)
assert.equal(twitchPreflight.workflowJobId, 87943655515)
assert.equal(twitchPreflight.artifactId, 8413901173)
assert.equal(twitchPreflight.observedAt, '2026-07-17T16:57:55.343Z')
assert.equal(twitchPreflight.providerCurrentMb, 325.9)
assert.equal(twitchPreflight.projectedNinetyDaySizeMb, 374.22)
assert.equal(twitchPreflight.projectedProviderHeadroomMb, 75.78)
assert.equal(twitchPreflight.projectedAccountWideHeadroomMb, 894.34)
assert.equal(twitchPreflight.providerLeakageRows, 0)
assert.equal(twitchPreflight.allReadOnlyGatesPass, true)
assert.equal(twitchPreflight.productionMutationPerformed, false)
assert.equal(twitchPreflight.productionObservationPathsRetired, true)
assert.equal(twitchPreflight.triggerPresent, false)
assert.equal(twitchPreflight.runtimeCaptureAuthorized, false)
assert.equal(twitchPreflight.freshForFutureStart, false)
assert.equal(twitchPreflight.freshnessLimitMinutesAtStart, 60)

assert.equal(gate.categoryCapture.kickCanaryFinalAcceptanceAccepted, true)
assert.equal(gate.categoryCapture.kickCanaryRollbackVerified, true)
assert.equal(gate.categoryCapture.kickCanaryProductionPathRetired, true)
assert.equal(gate.categoryCapture.twitchCanaryPackageAccepted, true)
assert.equal(gate.categoryCapture.twitchCanaryExecutionPackageAccepted, true)
assert.equal(gate.categoryCapture.twitchCanaryStoragePreflightAccepted, true)
assert.equal(gate.categoryCapture.twitchStoragePreflightFreshForStart, false)
assert.equal(gate.categoryCapture.twitchExactTriggerAccepted, false)
assert.equal(gate.categoryCapture.twitchCanaryExecuted, false)
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
  'twitch_category_capture_storage_preflight_not_fresh_for_start',
  'twitch_category_capture_exact_trigger_not_accepted',
  'twitch_category_capture_canary_not_executed',
  'runtime_category_capture_not_authorized',
])

assert.equal(gate.currentWorkstream.phase, '12A-4-15')
assert.equal(gate.currentWorkstream.acceptedKickCanaryFinalEvidence, true)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchStoragePreflight, true)
assert.deepEqual(gate.currentWorkstream.providerSequence, ['kick', 'twitch'])
assert.equal(gate.currentWorkstream.exactTwitchTriggerCurrent, false)
assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, false)
assert.equal(gate.currentWorkstream.twitchStoragePreflightFreshForStart, false)
assert.equal(gate.currentWorkstream.twitchCanaryAutomaticallyAuthorized, false)
assert.equal(gate.currentWorkstream.twitchStorageObservationExecutionRetired, true)
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

const kickEvidence = json(finalAcceptance.evidence)
assert.equal(kickEvidence.outcome, 'accepted')
assert.equal(kickEvidence.artifact.workflowRunId, finalAcceptance.workflowRunId)
assert.equal(kickEvidence.artifact.workflowJobId, finalAcceptance.workflowJobId)
assert.equal(kickEvidence.artifact.artifactId, finalAcceptance.artifactId)
assert.equal(kickEvidence.artifact.artifactDigest, finalAcceptance.artifactDigest)
assert.equal(kickEvidence.gates.readOnly, true)
assert.equal(kickEvidence.gates.canaryBindingsAbsent, true)
assert.equal(kickEvidence.gates.permanentDirectFlagAbsent, true)
assert.equal(kickEvidence.gates.noCategoryPayloadAfterGracePass, true)
assert.equal(kickEvidence.gates.providerLeakagePass, true)
assert.equal(kickEvidence.gates.normalSnapshotAuthenticatedPass, true)
assert.equal(kickEvidence.gates.normalSnapshotNonemptyPass, true)
assert.equal(kickEvidence.gates.twitchStartAuthorized, false)
assert.equal(kickEvidence.gates.productionMutationAuthorized, false)

const twitchContract = json(twitchPreflight.contract)
const twitchEvidence = json(twitchPreflight.evidence)
assert.equal(twitchContract.status, 'accepted')
assert.equal(twitchContract.acceptance.pr, twitchPreflight.acceptancePr)
assert.equal(twitchContract.acceptance.mergeSha, twitchPreflight.acceptanceMergeSha)
assert.equal(twitchContract.acceptance.mergeShaRecorded, true)
assert.equal(twitchContract.acceptance.productionWorkflowRunId, twitchPreflight.workflowRunId)
assert.equal(twitchContract.acceptance.productionWorkflowJobId, twitchPreflight.workflowJobId)
assert.equal(twitchContract.acceptance.artifactId, twitchPreflight.artifactId)
assert.equal(twitchContract.acceptance.allReadOnlyGatesPass, true)
assert.equal(twitchContract.acceptance.productionMutationPerformed, false)
assert.equal(twitchContract.acceptance.triggerCreated, false)
assert.equal(twitchContract.acceptance.runtimeCaptureStarted, false)
assert.equal(twitchEvidence.evidence.digest, twitchPreflight.evidenceDigest)
assert.equal(twitchEvidence.storage.projectedNinetyDaySizeMb, twitchPreflight.projectedNinetyDaySizeMb)
assert.equal(twitchEvidence.storage.projectedProviderHeadroomMb, twitchPreflight.projectedProviderHeadroomMb)
assert.equal(twitchEvidence.storage.projectedAccountWideHeadroomMb, twitchPreflight.projectedAccountWideHeadroomMb)
assert.equal(twitchEvidence.providerLeakageRows, 0)
assert.equal(twitchEvidence.gates.allReadOnlyGatesPass, true)
assert.equal(twitchEvidence.gates.productionMutationPerformed, false)
assert.equal(twitchEvidence.gates.triggerCreated, false)
assert.equal(twitchEvidence.gates.runtimeCaptureStarted, false)

const kickTrigger = json('docs/audits/12a4-kick-category-capture-canary-trigger.json')
assert.equal(kickTrigger.status, 'consumed_and_retired')
assert.equal(kickTrigger.oneTime, true)
assert.equal(kickTrigger.retired, true)
assert.equal(kickTrigger.finalArtifactId, 8399137444)
assert.equal(kickTrigger.productionExecutionPathRetired, true)
assert.equal(kickTrigger.scheduledMonitorRetired, true)

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
  '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml',
]) {
  const workflow = read(workflowPath)
  assert.equal(/^\s*push:/m.test(workflow), false, `${workflowPath}: push must be absent`)
  assert.equal(/^\s*schedule:/m.test(workflow), false, `${workflowPath}: schedule must be absent`)
  assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false, `${workflowPath}: Cloudflare token reference must be absent`)
  assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false, `${workflowPath}: Cloudflare account reference must be absent`)
}

assert.equal(exists('docs/audits/12a4-twitch-category-capture-canary-trigger.json'), false)
assert.equal(exists('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json'), false)
assert.equal(exists('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-reporting-request.json'), false)
assert.equal(exists('docs/audits/12a4-twitch-category-capture-canary-storage-preflight-diagnostic-marker.json'), false)
assert.equal(exists('.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight-reporting.yml'), false)

const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const twitchCanaryConfig = read('workers/collector-twitch/wrangler.category-canary.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')
const kickCanaryConfig = read('workers/collector-kick/wrangler.category-canary.toml')
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(twitchCanaryConfig), true)
assert.equal(/CATEGORY_CAPTURE_CANARY_ENABLED\s*=\s*"false"/.test(kickCanaryConfig), true)
assert.notEqual(twitchConfig.match(/database_id = "([^"]+)"/)?.[1], kickConfig.match(/database_id = "([^"]+)"/)?.[1])

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  currentWorkstream: gate.currentWorkstream.name,
  twitchPreflightArtifactId: twitchPreflight.artifactId,
  twitchPreflightAccepted: true,
  twitchStoragePreflightFreshForStart: false,
  exactTwitchTriggerCurrent: false,
  permanentRuntimeCaptureAuthorized: false,
}, null, 2))
