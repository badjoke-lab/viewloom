import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  package: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json',
  triggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json',
  trigger: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  sourcePackage: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  sourceAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  repair: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  repairAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  gate: 'docs/audits/12a2-current-gate-state.json',
  runner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  schedule: 'docs/product/current-schedule.md',
  roadmap: 'docs/product/current-roadmap.md',
  spec: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  wip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
}

for (const [name, path] of Object.entries(files)) {
  if (name === 'trigger') continue
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(files.trigger), false, 'production checkpoint trigger must be absent on package PR')

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const pkg = json(files.package)
const triggerContract = json(files.triggerContract)
const sourcePackage = json(files.sourcePackage)
const sourceAcceptance = json(files.sourceAcceptance)
const repair = json(files.repair)
const repairAcceptance = json(files.repairAcceptance)
const gate = json(files.gate)
const runner = read(files.runner)
const workflow = read(files.workflow)

assert.equal(pkg.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-package-v1')
assert.equal(pkg.status, 'ready_for_validation')
assert.equal(pkg.phase, '12A-5B-R2')
assert.equal(pkg.trackingIssue, 659)
assert.equal(pkg.provider, 'twitch')
assert.equal(pkg.mode, 'checkpoint')
assert.equal(pkg.governingMainSha, '0d591c0085bab421ab9d4b6369a775bdcfd6ae8b')
assert.equal(pkg.sourcePackage.packagePr, 661)
assert.equal(pkg.sourcePackage.acceptancePr, 662)
assert.equal(pkg.acceptedRunnerRepair.repairPr, 663)
assert.equal(pkg.acceptedRunnerRepair.acceptancePr, 664)
assert.equal(pkg.acceptedRunnerRepair.repairMergeSha, 'ab33afa4d6195532652791be2380a1fa9a278491')
assert.equal(pkg.acceptedRunnerRepair.validationRunId, 30475011149)
assert.equal(pkg.acceptedRunnerRepair.validationJobId, 90654426211)
assert.equal(pkg.window.semantics, 'half_open')
assert.equal(pkg.window.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(pkg.window.finalEndExclusiveAt, '2026-08-05T05:30:00.000Z')
assert.equal(pkg.window.checkpointEnd, 'latest_completed_five_minute_boundary_capped_at_final_end')
assert.equal(pkg.window.expectedFinalSlots, 2016)
assert.equal(pkg.execution.auditMode, 'checkpoint')
assert.equal(pkg.execution.oneTime, true)
assert.equal(pkg.execution.explicitPushTriggerOnly, true)
assert.equal(pkg.execution.newWorkerCronAdded, false)
assert.equal(pkg.execution.productionExecutionIncludedOnPackagePr, false)
assert.equal(pkg.execution.productionCredentialsUsedOnPackagePr, false)
assert.equal(pkg.checkpointBoundary.authorizesAuditAcceptance, false)
assert.equal(pkg.checkpointBoundary.authorizesPublicCutover, false)
assert.equal(pkg.checkpointBoundary.healthyCheckpointGuaranteesFinalAcceptance, false)
assert.equal(pkg.checkpointBoundary.failedCheckpointAuthorizesMutation, false)
assert.equal(pkg.checkpointBoundary.separatePathAcceptanceRequired, true)
assert.equal(Object.values(pkg.readOnlyBoundary).every((value) => Array.isArray(value) || value === false), true)
assert.deepEqual(pkg.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(pkg.readOnlyBoundary.d1Statements, ['SELECT', 'WITH'])
assert.equal(Object.values(pkg.acceptance).filter((value) => value === true).length, 0)
assert.equal(pkg.acceptance.packagePr, null)
assert.equal(pkg.acceptance.acceptancePr, null)
assert.equal(pkg.acceptance.productionExecutionPerformed, false)
assert.equal(pkg.acceptance.publicExposureEnabled, false)
assert.equal(pkg.acceptance.kickChanged, false)

assert.equal(triggerContract.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-trigger-contract-v1')
assert.equal(triggerContract.status, 'ready_for_validation')
assert.equal(triggerContract.provider, 'twitch')
assert.equal(triggerContract.mode, 'checkpoint')
assert.equal(triggerContract.trigger.path, files.trigger)
assert.equal(triggerContract.trigger.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-trigger-v1')
assert.equal(triggerContract.trigger.status, 'armed')
assert.equal(triggerContract.trigger.provider, 'twitch')
assert.equal(triggerContract.trigger.mode, 'checkpoint')
assert.equal(triggerContract.trigger.oneTime, true)
assert.equal(triggerContract.trigger.confirmation, 'RUN_TWITCH_REPLACEMENT_AUDIT_CHECKPOINT')
assert.equal(triggerContract.trigger.maximumStartDelayHours, 3)
assert.equal(triggerContract.trigger.allowedPastSkewMinutes, 10)
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, null)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, null)
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, null)
assert.equal(triggerContract.executionBoundary.event, 'push_to_main_with_exact_trigger_path')
assert.equal(triggerContract.executionBoundary.workflowDispatchAuthorized, false)
assert.equal(triggerContract.executionBoundary.scheduleAuthorized, false)
assert.equal(triggerContract.executionBoundary.auditMode, 'checkpoint')
assert.equal(triggerContract.executionBoundary.finalModeAuthorized, false)
assert.equal(triggerContract.afterExecution.checkpointEvidenceDiagnosticOnly, true)
assert.equal(triggerContract.afterExecution.auditAcceptanceAuthorized, false)
assert.equal(triggerContract.afterExecution.publicCutoverAuthorized, false)
assert.equal(triggerContract.afterExecution.triggerRetirementRequired, true)

assert.equal(sourcePackage.status, 'accepted_dormant')
assert.equal(sourcePackage.acceptance.acceptancePr, 662)
assert.equal(sourceAcceptance.status, 'accepted')
assert.equal(sourceAcceptance.acceptedCapabilities.checkpointModeAuthorizing, false)
assert.equal(repair.status, 'accepted')
assert.equal(repair.acceptance.repairPr, 663)
assert.equal(repair.acceptance.acceptancePr, 664)
assert.equal(repairAcceptance.status, 'accepted')
assert.equal(repairAcceptance.validation.conclusion, 'success')
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)

assert.ok(runner.includes("const mode = normalizeMode(options.mode ?? process.env.AUDIT_MODE ?? 'checkpoint')"))
assert.ok(runner.includes("if (!['checkpoint', 'final'].includes(mode))"))
assert.ok(runner.includes("if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))"))
assert.ok(runner.includes("throw new Error('non_select_statement_rejected')"))
assert.ok(runner.includes("Math.min(Math.max(completedBoundaryMs, startMs), finalEndMs)"))
assert.ok(runner.includes("status: failedGates.length === 0 ? 'checkpoint_healthy' : 'checkpoint_failed'"))
assert.equal(runner.includes('wrangler@4 deploy'), false)
for (const forbidden of ['INSERT INTO', 'UPDATE ', 'DELETE FROM', 'ALTER TABLE']) {
  assert.equal(runner.includes(forbidden), false, `runner forbidden fragment: ${forbidden}`)
}

for (const fragment of [
  "name: Analytics 12A5 Twitch Replacement Audit Checkpoint",
  "- 'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json'",
  "if: github.event_name == 'pull_request' && needs.classify.outputs.trigger_present != 'true'",
  "Confirm production trigger is absent",
  "Verify bounded checkpoint package",
  "if: github.event_name == 'push' && needs.classify.outputs.trigger_present == 'true'",
  "AUDIT_MODE=checkpoint node scripts/run-12a5-twitch-replacement-seven-day-audit.mjs",
  "analytics-12a5-twitch-replacement-audit-checkpoint",
  "Fail after evidence upload when checkpoint is unhealthy",
]) assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(workflow.includes('AUDIT_MODE=final'), false)
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.split("- 'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json'").length - 1, 2)
assert.ok(workflow.includes("CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}"))
assert.ok(workflow.includes("CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}"))

for (const [path, fragments] of Object.entries({
  [files.schedule]: [
    'Current gate bounded checkpoint execution package',
    'Current branch work-659-twitch-replacement-audit-checkpoint-package',
  ],
  [files.roadmap]: [
    '### Current gate: bounded checkpoint execution package',
    'work-659-twitch-replacement-audit-checkpoint-package',
  ],
  [files.spec]: [
    '## Checkpoint package and mode',
    'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  ],
  [files.wip]: [
    '### 1. Bounded checkpoint package',
    'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  ],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

console.log(JSON.stringify({
  ok: true,
  phase: pkg.phase,
  mode: pkg.mode,
  sourcePackageAccepted: true,
  runnerRepairAccepted: true,
  triggerPresent: false,
  productionExecutionIncluded: false,
  publicCategoryFilterAuthorized: false,
  nextGate: pkg.nextGate,
}, null, 2))
