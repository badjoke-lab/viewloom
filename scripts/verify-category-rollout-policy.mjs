import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const files = {
  agents: 'AGENTS.md',
  contributing: 'CONTRIBUTING.md',
  docsIndex: 'docs/README.md',
  policy: 'docs/operations/development-and-deployment-policy.md',
  prTemplate: '.github/pull_request_template.md',
  spec: 'docs/product/category-capture-permanent-rollout-spec.md',
  plan: 'docs/product/category-capture-permanent-rollout-plan.md',
  auditSpec: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  auditPackage: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  auditPackageAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  heatmapSpec: 'docs/product/heatmap-canvas-redesign-spec.md',
  heatmapPlan: 'docs/product/heatmap-canvas-implementation-plan.md',
  roadmap: 'docs/product/current-roadmap.md',
  schedule: 'docs/product/current-schedule.md',
  gate: 'docs/audits/12a2-current-gate-state.json',
  recovery: 'docs/audits/12a5-twitch-permanent-category-recovery-contract.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json',
  hiddenDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenControls: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  kickAcceptance: 'docs/audits/12a4-kick-permanent-category-final-acceptance.json',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  workflow: '.github/workflows/category-rollout-policy.yml',
  auditWorkflow: '.github/workflows/analytics-12a5-twitch-replacement-seven-day-audit-package.yml',
  auditRunner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  auditTest: 'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs',
  auditVerifier: 'scripts/verify-12a5-twitch-replacement-seven-day-audit-package.mjs',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalKick: 'workers/collector-kick/wrangler.toml',
  permanentKick: 'workers/collector-kick/wrangler.category-permanent.toml',
}

for (const path of Object.values(files)) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const agents = read(files.agents)
const contributing = read(files.contributing)
const docsIndex = read(files.docsIndex)
const policy = read(files.policy)
const prTemplate = read(files.prTemplate)
const spec = read(files.spec)
const plan = read(files.plan)
const auditSpec = read(files.auditSpec)
const heatmapSpec = read(files.heatmapSpec)
const heatmapPlan = read(files.heatmapPlan)
const roadmap = read(files.roadmap)
const schedule = read(files.schedule)
const activeWip = read(files.activeWip)
const workflow = read(files.workflow)
const auditWorkflow = read(files.auditWorkflow)

for (const [name, source, fragments] of [
  ['AGENTS', agents, [
    'Current phase: 12A-5B-R2 replacement Twitch seven-day accumulation',
    'Read these from the current `main` branch before starting work and reread them before merging:',
    'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
    'work-659-twitch-replacement-audit-checkpoint-package',
  ]],
  ['CONTRIBUTING', contributing, [
    'Required reading and freshness rule',
    'Current-main SHA',
    'Create and verify `work-659-twitch-replacement-audit-checkpoint-package`.',
    'Checkpoint mode never accepts #659 or authorizes public UI.',
  ]],
  ['docs index', docsIndex, [
    'Canonical gate viewloom-12a2-current-gate-state-v33',
    'Dormant replacement audit package accepted yes',
    'Package acceptance PR #662',
    'Next branch work-659-twitch-replacement-audit-checkpoint-package',
  ]],
  ['development policy', policy, [
    'Mandatory freshness protocol',
    'Cached chat summaries',
    'Fetch current main and record its SHA',
    'Repair stale/conflicting source-of-truth documents before implementation',
  ]],
  ['PR template', prTemplate, [
    'Current-main SHA read:',
    'I fetched current `main` before creating this branch',
    'No newer source-of-truth change supersedes this candidate',
  ]],
  ['category spec', spec, [
    'Replacement Twitch stability start: `2026-07-29T05:30:00.000Z`',
    'Earliest replacement read-only audit: `2026-08-05T05:30:00.000Z`',
    'The seven-day gate blocks public exposure, not hidden implementation work.',
    'Heatmap Canvas boundary',
  ]],
  ['category plan', plan, [
    'Current phase 12A-5B-R2 — replacement accumulation and parallel safe work',
    'implemented the dormant package in PR #661',
    'work-659-twitch-replacement-audit-checkpoint-package',
    'Track C — Heatmap Canvas redesign',
  ]],
  ['audit spec', auditSpec, [
    'Tracking issue: #659',
    'Accepted dormant package',
    'Package acceptance PR: #662.',
    'A checkpoint cannot accept #659 or authorize public UI.',
    'A passing audit does not itself expose the feature',
  ]],
  ['heatmap spec', heatmapSpec, [
    'Canvas scene, camera state, redraw',
    'Do not expose the hidden category filter',
    'world-coordinate hit testing',
  ]],
  ['heatmap plan', heatmapPlan, [
    'work-heatmap-canvas-module-split',
    'work-heatmap-canvas-scene',
    'No Canvas production cutover occurs before the audit boundary',
  ]],
  ['roadmap', roadmap, [
    'Active deliverables before 2026-08-05',
    'Create and accept `work-659-twitch-replacement-audit-checkpoint-package`.',
    'The #659 package prerequisite is complete',
    'Track B — Heatmap Canvas redesign',
  ]],
  ['schedule', schedule, [
    'Dormant replacement audit package accepted yes',
    'Package acceptance PR #662',
    'Next branch work-659-twitch-replacement-audit-checkpoint-package',
    '2026-08-05 at or after 05:30 UTC / 14:30 JST',
  ]],
  ['active WIP', activeWip, [
    '# 12A-5B-R2 replacement Twitch accumulation and pre-audit parallel work',
    'Package acceptance: PR #662.',
    'work-659-twitch-replacement-audit-checkpoint-package',
    'Provider parity #148',
  ]],
]) {
  for (const fragment of fragments) {
    assert.ok(source.includes(fragment), `${name} missing: ${fragment}`)
  }
}

const gate = json(files.gate)
const recovery = json(files.recovery)
const recoveryAcceptance = json(files.recoveryAcceptance)
const auditPackage = json(files.auditPackage)
const auditPackageAcceptance = json(files.auditPackageAcceptance)
const hiddenDecision = json(files.hiddenDecision)
const hiddenControls = json(files.hiddenControls)
const kickAcceptance = json(files.kickAcceptance)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.status, '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.twitchRecoveryRequired, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchStableAccumulationStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.categoryUiPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
])
assert.ok(gate.closedBlockers.includes('twitch_permanent_category_capture_regression_not_recovered'))

assert.equal(recovery.status, 'accepted')
assert.equal(recovery.acceptance.publicExposureEnabled, false)
assert.equal(recovery.acceptance.kickChanged, false)
assert.equal(recoveryAcceptance.status, 'accepted')
assert.equal(recoveryAcceptance.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(recoveryAcceptance.earliestSevenDayAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(recoveryAcceptance.gates.finalReadOnlyPreflightPass, true)
assert.equal(recoveryAcceptance.gates.twoConsecutiveCategorySnapshotsPass, true)
assert.equal(recoveryAcceptance.gates.rollbackRequired, false)
assert.equal(recoveryAcceptance.boundaries.kickChanged, false)
assert.equal(recoveryAcceptance.boundaries.d1MutationPerformed, false)
assert.equal(recoveryAcceptance.boundaries.cadenceChanged, false)
assert.equal(recoveryAcceptance.boundaries.publicCategoryUiAuthorized, false)

assert.equal(auditPackage.status, 'accepted_dormant')
assert.equal(auditPackage.phase, '12A-5B-R2')
assert.equal(auditPackage.trackingIssue, 659)
assert.equal(auditPackage.window.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(auditPackage.window.endExclusiveAt, '2026-08-05T05:30:00.000Z')
assert.equal(auditPackage.window.expectedFinalSlots, 2016)
assert.equal(auditPackage.modes.checkpoint.authorizesAuditAcceptance, false)
assert.equal(auditPackage.modes.checkpoint.authorizesPublicCutover, false)
assert.equal(auditPackage.acceptance.acceptancePr, 662)
assert.equal(auditPackage.acceptance.packagePr, 661)
assert.equal(auditPackage.acceptance.packageMergeSha, '1cab151ce243e1ec58091bfd309f65671e1f41c7')
assert.equal(auditPackage.acceptance.workflowRunId, 30455002204)
assert.equal(auditPackage.acceptance.workflowJobId, 90586212618)
assert.equal(auditPackage.acceptance.productionExecutionPerformed, false)
assert.equal(auditPackage.acceptance.publicExposureEnabled, false)
assert.equal(auditPackage.acceptance.kickChanged, false)
assert.equal(auditPackageAcceptance.status, 'accepted')
assert.equal(auditPackageAcceptance.acceptancePr, 662)
assert.equal(auditPackageAcceptance.packagePr, 661)
assert.equal(auditPackageAcceptance.validation.conclusion, 'success')
assert.equal(auditPackageAcceptance.acceptedCapabilities.checkpointModeAuthorizing, false)
assert.equal(Object.values(auditPackageAcceptance.boundaries).every((value) => value === false), true)

assert.equal(hiddenDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenDecision.publicGate.earliestAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(hiddenControls.acceptance.publicExposureEnabled, false)
assert.equal(kickAcceptance.status, 'accepted')
assert.equal(kickAcceptance.rollbackRequired, false)
assert.equal(kickAcceptance.data.providerLeakageRows, 0)

const normalTwitch = read(files.normalTwitch)
const permanentTwitch = read(files.permanentTwitch)
const normalKick = read(files.normalKick)
const permanentKick = read(files.permanentKick)
const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalTwitch), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanentTwitch), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalKick), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanentKick), true)
assert.equal(cron(normalTwitch), '*/5 * * * *')
assert.equal(cron(permanentTwitch), cron(normalTwitch))
assert.equal(cron(normalKick), '*/5 * * * *')
assert.equal(cron(permanentKick), cron(normalKick))
assert.equal(toml(permanentTwitch, 'database_id'), toml(normalTwitch, 'database_id'))
assert.equal(toml(permanentKick, 'database_id'), toml(normalKick, 'database_id'))
assert.notEqual(toml(normalTwitch, 'database_id'), toml(normalKick, 'database_id'))

const workflowPathCount = (path) => workflow.split(`- '${path}'`).length - 1
for (const path of [
  'AGENTS.md',
  'CONTRIBUTING.md',
  'docs/README.md',
  '.github/pull_request_template.md',
  'docs/product/category-capture-permanent-rollout-spec.md',
  'docs/product/category-capture-permanent-rollout-plan.md',
  'docs/product/twitch-replacement-seven-day-audit-spec.md',
  'docs/product/heatmap-canvas-redesign-spec.md',
  'docs/product/heatmap-canvas-implementation-plan.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/audits/12a5-twitch-permanent-category-recovery-contract.json',
  'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/operations/development-and-deployment-policy.md',
  'workers/collector-twitch/**',
  'workers/collector-kick/**',
  'db/d1/**',
  'apps/web/**',
  'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs',
  'scripts/verify-12a5-twitch-replacement-seven-day-audit-package.mjs',
  'scripts/verify-category-rollout-policy.mjs',
  'scripts/verify-development-policy.mjs',
  '.github/workflows/analytics-12a5-twitch-replacement-seven-day-audit-package.yml',
  '.github/workflows/category-rollout-policy.yml',
]) {
  assert.equal(workflowPathCount(path), 2, `workflow must watch ${path} on pull_request and push`)
}
assert.ok(workflow.includes('cancel-in-progress: true'))
assert.ok(auditWorkflow.includes('Package status: accepted dormant'))
assert.ok(auditWorkflow.includes('work-659-twitch-replacement-audit-checkpoint-package'))
assert.equal(auditWorkflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(auditWorkflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(auditWorkflow.includes('contents: write'), false)

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  canonicalGate: gate.schemaVersion,
  replacementStartAt: gate.currentWorkstream.twitchStableAccumulationStartAt,
  earliestAuditAt: gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt,
  auditPackageAccepted: true,
  auditPackageAcceptancePr: 662,
  twitchRuntimeActive: true,
  kickRuntimeActive: true,
  publicTwitchFilterAuthorized: false,
  nextBranches: [
    'work-659-twitch-replacement-audit-checkpoint-package',
    'work-heatmap-canvas-module-split',
    'work-heatmap-canvas-scene',
    'work-148-provider-parity',
  ],
}, null, 2))
