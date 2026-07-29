import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const required = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  'docs/operations/development-and-deployment-policy.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json',
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json',
  'docs/product/heatmap-canvas-redesign-spec.md',
  'docs/product/heatmap-canvas-implementation-plan.md',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/audits/12a2-current-gate-state.json',
  '.github/pull_request_template.md',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)

const agents = read('AGENTS.md')
const contributing = read('CONTRIBUTING.md')
const docsIndex = read('docs/README.md')
const policy = read('docs/operations/development-and-deployment-policy.md')
const roadmap = read('docs/product/current-roadmap.md')
const schedule = read('docs/product/current-schedule.md')
const spec = read('docs/product/twitch-replacement-seven-day-audit-spec.md')
const wip = read('docs/work-in-progress/phase12a4-category-parallel-execution.md')
const template = read('.github/pull_request_template.md')
const gate = json('docs/audits/12a2-current-gate-state.json')
const sourcePackage = json('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json')
const repairAcceptance = json('docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json')
const checkpointPackage = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json')
const checkpointAcceptance = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json')
const triggerContract = json('docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json')

for (const fragment of [
  'Mandatory current authorities',
  'Do not rely on a cached handoff',
  'Checkpoint package: accepted PR #665 / #666',
  'work-659-twitch-replacement-audit-checkpoint-trigger',
]) assert.ok(agents.includes(fragment), `AGENTS missing: ${fragment}`)

for (const fragment of [
  'Required reading and freshness rule',
  'Every PR must record the Current-main SHA',
  'Checkpoint package accepted PR #665 / #666',
  'Current branch work-659-twitch-replacement-audit-checkpoint-trigger',
]) assert.ok(contributing.includes(fragment), `CONTRIBUTING missing: ${fragment}`)

for (const fragment of [
  'Read the following from current `main`',
  'Checkpoint package accepted PR #665 / #666',
  'Current branch work-659-twitch-replacement-audit-checkpoint-trigger',
]) assert.ok(docsIndex.includes(fragment), `docs index missing: ${fragment}`)

for (const fragment of [
  'Mandatory freshness protocol',
  'Cached chat summaries',
  'Before marking a PR ready or merging',
  'Repair stale/conflicting source-of-truth documents before implementation',
  '`main` is production',
  'Provider separation and data truth',
]) assert.ok(policy.includes(fragment), `development policy missing: ${fragment}`)

for (const fragment of [
  '### Current gate: exact checkpoint trigger',
  'Checkpoint package PR #665',
  'acceptance PR #666',
  'work-659-twitch-replacement-audit-checkpoint-trigger',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  'Current gate exact one-file checkpoint trigger',
  'Checkpoint package PR #665',
  'Checkpoint package acceptance PR #666',
  'Current branch work-659-twitch-replacement-audit-checkpoint-trigger',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

for (const fragment of [
  '## Accepted checkpoint execution package',
  'Checkpoint package PR: #665',
  'Checkpoint package acceptance PR: #666',
  'Current branch: `work-659-twitch-replacement-audit-checkpoint-trigger`.',
]) assert.ok(spec.includes(fragment), `audit spec missing: ${fragment}`)

for (const fragment of [
  'Checkpoint package: PR #665',
  'Checkpoint package acceptance: PR #666',
  'Current branch: `work-659-twitch-replacement-audit-checkpoint-trigger`.',
]) assert.ok(wip.includes(fragment), `active WIP missing: ${fragment}`)

for (const fragment of [
  'Current-main SHA read:',
  'No newer source-of-truth change supersedes this candidate',
  'The active working note and current schedule remain accurate',
]) assert.ok(template.includes(fragment), `PR template missing: ${fragment}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)

assert.equal(sourcePackage.status, 'accepted_dormant')
assert.equal(sourcePackage.acceptance.acceptancePr, 662)
assert.equal(sourcePackage.acceptance.productionExecutionPerformed, false)
assert.equal(sourcePackage.acceptance.publicExposureEnabled, false)
assert.equal(repairAcceptance.status, 'accepted')
assert.equal(repairAcceptance.acceptancePr, 664)
assert.equal(repairAcceptance.validation.conclusion, 'success')
assert.equal(Object.values(repairAcceptance.boundaries).every((value) => value === false), true)

assert.equal(checkpointPackage.status, 'accepted')
assert.equal(checkpointPackage.mode, 'checkpoint')
assert.equal(checkpointPackage.acceptance.packagePr, 665)
assert.equal(checkpointPackage.acceptance.packageMergeSha, '317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a')
assert.equal(checkpointPackage.acceptance.acceptancePr, 666)
assert.equal(checkpointPackage.acceptance.validationRunId, 30476596379)
assert.equal(checkpointPackage.acceptance.validationJobId, 90659857133)
assert.equal(checkpointPackage.acceptance.productionExecutionPerformed, false)
assert.equal(checkpointPackage.checkpointBoundary.authorizesAuditAcceptance, false)
assert.equal(checkpointPackage.checkpointBoundary.authorizesPublicCutover, false)

assert.equal(checkpointAcceptance.status, 'accepted')
assert.equal(checkpointAcceptance.acceptancePr, 666)
assert.equal(checkpointAcceptance.validation.conclusion, 'success')
assert.equal(checkpointAcceptance.validation.triggerAbsentPass, true)
assert.equal(checkpointAcceptance.validation.productionCheckpointJobSkippedPass, true)
assert.equal(Object.values(checkpointAcceptance.boundaries).every((value) => value === false), true)

assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 665)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, '317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a')
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 666)
assert.equal(triggerContract.executionBoundary.auditMode, 'checkpoint')
assert.equal(triggerContract.executionBoundary.finalModeAuthorized, false)
assert.equal(triggerContract.executionBoundary.newWorkerCronAuthorized, false)
assert.equal(triggerContract.afterExecution.auditAcceptanceAuthorized, false)
assert.equal(triggerContract.afterExecution.publicCutoverAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  phase: gate.currentWorkstream.phase,
  gate: gate.schemaVersion,
  checkpointPackageAccepted: true,
  checkpointPackagePr: 665,
  checkpointAcceptancePr: 666,
  currentBranch: 'work-659-twitch-replacement-audit-checkpoint-trigger',
  publicCategoryFilterAuthorized: false,
}, null, 2))
