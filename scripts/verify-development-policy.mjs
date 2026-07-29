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
  'docs/product/category-capture-permanent-rollout-spec.md',
  'docs/product/category-capture-permanent-rollout-plan.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
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
const auditSpec = read('docs/product/twitch-replacement-seven-day-audit-spec.md')
const activeWip = read('docs/work-in-progress/phase12a4-category-parallel-execution.md')
const prTemplate = read('.github/pull_request_template.md')
const gate = json('docs/audits/12a2-current-gate-state.json')
const auditPackage = json('docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json')
const auditPackageAcceptance = json('docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json')
const repair = json('docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json')
const repairAcceptance = json('docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json')

for (const fragment of [
  'Mandatory current authorities',
  'Do not rely on a cached handoff',
  'Current execution order',
  'Runner repair: accepted through PR #663 and acceptance PR #664',
  'work-659-twitch-replacement-audit-checkpoint-package',
]) assert.ok(agents.includes(fragment), `AGENTS missing: ${fragment}`)

for (const fragment of [
  'Required reading and freshness rule',
  'Every PR must record the Current-main SHA',
  'If the documents disagree',
  'Runner repair accepted PR #663 / acceptance PR #664',
  'Current branch work-659-twitch-replacement-audit-checkpoint-package',
]) assert.ok(contributing.includes(fragment), `CONTRIBUTING missing: ${fragment}`)

for (const fragment of [
  'Read the following from current `main`',
  'Runner repair accepted PR #663',
  'Runner repair acceptance PR #664',
  'Current branch work-659-twitch-replacement-audit-checkpoint-package',
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
  'Active deliverables before 2026-08-05',
  '### Current gate: bounded checkpoint execution package',
  'Runner repair acceptance is frozen through PR #664.',
  'work-659-twitch-replacement-audit-checkpoint-package',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  'Current gate bounded checkpoint execution package',
  'Current branch work-659-twitch-replacement-audit-checkpoint-package',
  'Runner repair acceptance PR #664',
  'Immediate — checkpoint package',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

for (const fragment of [
  '## Accepted runner repair',
  'The runner repair is accepted on main.',
  'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  'Checkpoint evidence is diagnostic.',
]) assert.ok(auditSpec.includes(fragment), `audit spec missing: ${fragment}`)

for (const fragment of [
  'Runner repair acceptance: PR #664.',
  'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  '### 1. Bounded checkpoint package',
]) assert.ok(activeWip.includes(fragment), `active WIP missing: ${fragment}`)

for (const fragment of [
  'Current-main SHA read:',
  'No newer source-of-truth change supersedes this candidate',
  'The active working note and current schedule remain accurate',
]) assert.ok(prTemplate.includes(fragment), `PR template missing: ${fragment}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)

assert.equal(auditPackage.status, 'accepted_dormant')
assert.equal(auditPackage.acceptance.acceptancePr, 662)
assert.equal(auditPackage.acceptance.productionExecutionPerformed, false)
assert.equal(auditPackage.acceptance.publicExposureEnabled, false)
assert.equal(auditPackage.acceptance.kickChanged, false)
assert.equal(auditPackageAcceptance.status, 'accepted')
assert.equal(auditPackageAcceptance.acceptedCapabilities.checkpointModeAuthorizing, false)
assert.equal(Object.values(auditPackageAcceptance.boundaries).every((value) => value === false), true)

assert.equal(repair.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-v1')
assert.equal(repair.status, 'accepted')
assert.equal(repair.phase, '12A-5B-R2')
assert.equal(repair.defect.code, 'sqlite_cte_scope_cross_statement')
assert.equal(repair.defect.productionExecutionOccurred, false)
assert.equal(repair.repair.expectedFinalSlotsPreserved, 2016)
assert.equal(repair.acceptance.repairPr, 663)
assert.equal(repair.acceptance.acceptancePr, 664)
assert.equal(Object.values(repair.boundaries).every((value) => value === false), true)

assert.equal(repairAcceptance.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance-v1')
assert.equal(repairAcceptance.status, 'accepted')
assert.equal(repairAcceptance.acceptancePr, 664)
assert.equal(repairAcceptance.repairPr, 663)
assert.equal(repairAcceptance.validation.workflowRunId, 30475011149)
assert.equal(repairAcceptance.validation.workflowJobId, 90654426211)
assert.equal(repairAcceptance.validation.conclusion, 'success')
assert.equal(Object.values(repairAcceptance.boundaries).every((value) => value === false), true)

console.log(JSON.stringify({
  ok: true,
  policy: 'current-main-source-of-truth-freshness',
  phase: gate.currentWorkstream.phase,
  gate: gate.schemaVersion,
  auditPackageAccepted: true,
  runnerRepairAccepted: true,
  runnerRepairPr: repair.acceptance.repairPr,
  runnerRepairAcceptancePr: repair.acceptance.acceptancePr,
  currentBranch: 'work-659-twitch-replacement-audit-checkpoint-package',
  publicCategoryFilterAuthorized: false,
}, null, 2))
