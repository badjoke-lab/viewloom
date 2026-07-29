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
  auditSpec: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  auditPackage: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  auditPackageAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-acceptance.json',
  runnerRepair: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  runnerRepairAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  roadmap: 'docs/product/current-roadmap.md',
  schedule: 'docs/product/current-schedule.md',
  gate: 'docs/audits/12a2-current-gate-state.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json',
  hiddenDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenControls: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  kickAcceptance: 'docs/audits/12a4-kick-permanent-category-final-acceptance.json',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  workflow: '.github/workflows/category-rollout-policy.yml',
  auditWorkflow: '.github/workflows/analytics-12a5-twitch-replacement-seven-day-audit-package.yml',
  auditRunner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  auditTest: 'scripts/test-12a5-twitch-replacement-seven-day-audit.mjs',
  repairVerifier: 'scripts/verify-12a5-twitch-replacement-seven-day-audit-runner-repair.mjs',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalKick: 'workers/collector-kick/wrangler.toml',
  permanentKick: 'workers/collector-kick/wrangler.category-permanent.toml',
}

for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const gate = json(files.gate)
const recoveryAcceptance = json(files.recoveryAcceptance)
const auditPackage = json(files.auditPackage)
const auditPackageAcceptance = json(files.auditPackageAcceptance)
const runnerRepair = json(files.runnerRepair)
const runnerRepairAcceptance = json(files.runnerRepairAcceptance)
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
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(recoveryAcceptance.status, 'accepted')
assert.equal(recoveryAcceptance.gates.permanentBindingPass, true)
assert.equal(recoveryAcceptance.gates.cadencePass, true)
assert.equal(recoveryAcceptance.gates.providerLeakagePass, true)
assert.equal(recoveryAcceptance.gates.storagePass, true)
assert.equal(recoveryAcceptance.gates.rollbackRequired, false)
assert.equal(recoveryAcceptance.boundaries.kickChanged, false)
assert.equal(recoveryAcceptance.boundaries.publicCategoryUiAuthorized, false)

assert.equal(auditPackage.status, 'accepted_dormant')
assert.equal(auditPackage.window.semantics, 'half_open')
assert.equal(auditPackage.window.startAt, '2026-07-29T05:30:00.000Z')
assert.equal(auditPackage.window.endExclusiveAt, '2026-08-05T05:30:00.000Z')
assert.equal(auditPackage.window.expectedFinalSlots, 2016)
assert.equal(auditPackage.modes.checkpoint.authorizesAuditAcceptance, false)
assert.equal(auditPackage.modes.checkpoint.authorizesPublicCutover, false)
assert.equal(auditPackage.modes.final.allowedBeforeFinalBoundary, false)
assert.equal(auditPackage.acceptance.acceptancePr, 662)
assert.equal(auditPackageAcceptance.status, 'accepted')
assert.equal(auditPackageAcceptance.acceptedCapabilities.checkpointModeAuthorizing, false)
assert.equal(Object.values(auditPackageAcceptance.boundaries).every((value) => value === false), true)

assert.equal(runnerRepair.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-v1')
assert.equal(runnerRepair.status, 'accepted')
assert.equal(runnerRepair.phase, '12A-5B-R2')
assert.equal(runnerRepair.trackingIssue, 659)
assert.equal(runnerRepair.defect.code, 'sqlite_cte_scope_cross_statement')
assert.equal(runnerRepair.defect.productionExecutionOccurred, false)
assert.equal(runnerRepair.defect.checkpointEvidenceProduced, false)
assert.equal(runnerRepair.defect.finalAuditExecuted, false)
assert.equal(runnerRepair.repair.exportSqlBuilder, true)
assert.equal(runnerRepair.repair.slotEnumerationReadsMinuteSnapshotsDirectly, true)
assert.equal(runnerRepair.repair.allStatementsRemainSelectOrWith, true)
assert.equal(runnerRepair.repair.expectedFinalSlotsPreserved, 2016)
assert.equal(runnerRepair.acceptance.acceptancePr, 664)
assert.equal(runnerRepair.acceptance.repairPr, 663)
assert.equal(Object.values(runnerRepair.boundaries).every((value) => value === false), true)

assert.equal(runnerRepairAcceptance.schemaVersion, 'viewloom-12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance-v1')
assert.equal(runnerRepairAcceptance.status, 'accepted')
assert.equal(runnerRepairAcceptance.acceptancePr, 664)
assert.equal(runnerRepairAcceptance.repairPr, 663)
assert.equal(runnerRepairAcceptance.validation.workflowRunId, 30475011149)
assert.equal(runnerRepairAcceptance.validation.workflowJobId, 90654426211)
assert.equal(runnerRepairAcceptance.validation.conclusion, 'success')
assert.equal(runnerRepairAcceptance.acceptedRepair.laterStatementsReferenceScopedCte, false)
assert.equal(runnerRepairAcceptance.acceptedRepair.expectedFinalSlotsPreserved, 2016)
assert.equal(Object.values(runnerRepairAcceptance.boundaries).every((value) => value === false), true)

assert.equal(hiddenDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenDecision.publicGate.earliestAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(hiddenControls.acceptance.publicExposureEnabled, false)
assert.equal(kickAcceptance.status, 'accepted')
assert.equal(kickAcceptance.rollbackRequired, false)
assert.equal(kickAcceptance.data.providerLeakageRows, 0)

const sources = {
  agents: read(files.agents),
  contributing: read(files.contributing),
  docsIndex: read(files.docsIndex),
  auditSpec: read(files.auditSpec),
  roadmap: read(files.roadmap),
  schedule: read(files.schedule),
  activeWip: read(files.activeWip),
}

for (const [name, fragments] of Object.entries({
  agents: [
    'Runner repair: accepted through PR #663 and acceptance PR #664',
    'work-659-twitch-replacement-audit-checkpoint-package',
    'Checkpoint evidence is diagnostic, does not accept #659, and does not authorize public UI.',
  ],
  contributing: [
    'Runner repair accepted PR #663 / acceptance PR #664',
    'Current branch work-659-twitch-replacement-audit-checkpoint-package',
  ],
  docsIndex: [
    'Runner repair accepted PR #663',
    'Runner repair acceptance PR #664',
    'Current branch work-659-twitch-replacement-audit-checkpoint-package',
  ],
  auditSpec: [
    '## Accepted runner repair',
    'The runner repair is accepted on main.',
    'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  ],
  roadmap: [
    '### Current gate: bounded checkpoint execution package',
    'Runner repair acceptance is frozen through PR #664.',
  ],
  schedule: [
    'Current gate bounded checkpoint execution package',
    'Current branch work-659-twitch-replacement-audit-checkpoint-package',
  ],
  activeWip: [
    'Runner repair acceptance: PR #664.',
    'Current branch: `work-659-twitch-replacement-audit-checkpoint-package`.',
  ],
})) {
  for (const fragment of fragments) assert.ok(sources[name].includes(fragment), `${name} missing: ${fragment}`)
}

const runner = read(files.auditRunner)
const test = read(files.auditTest)
assert.ok(runner.includes('export function buildTwitchWindowSql'))
const slotQuery = runner.match(/SELECT bucket_minute AS observed_bucket_minute[\s\S]*?ORDER BY bucket_minute;/)?.[0]
assert.ok(slotQuery)
assert.ok(slotQuery.includes('FROM minute_snapshots'))
assert.equal(slotQuery.includes('FROM scoped'), false)
assert.ok(slotQuery.includes("provider = 'twitch'"))
assert.ok(test.includes('sqlStatementScopeSafe: true'))
assert.ok(read(files.repairVerifier).includes('runnerRepairAccepted: true'))

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
assert.notEqual(toml(permanentTwitch, 'database_id'), toml(permanentKick, 'database_id'))

const workflow = read(files.workflow)
const auditWorkflow = read(files.auditWorkflow)
for (const path of [
  'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  'scripts/verify-12a5-twitch-replacement-seven-day-audit-runner-repair.mjs',
]) {
  assert.equal(workflow.split(`- '${path}'`).length - 1, 2, `category workflow must watch ${path}`)
  assert.equal(auditWorkflow.split(`- '${path}'`).length - 1, 2, `audit workflow must watch ${path}`)
}
assert.ok(workflow.includes('cancel-in-progress: true'))
assert.ok(auditWorkflow.includes('Verify replacement audit runner SQL repair'))
assert.equal(auditWorkflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(auditWorkflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(auditWorkflow.includes('contents: write'), false)

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  canonicalGate: gate.schemaVersion,
  auditPackageAccepted: true,
  runnerRepairAccepted: true,
  runnerRepairPr: runnerRepair.acceptance.repairPr,
  runnerRepairAcceptancePr: runnerRepair.acceptance.acceptancePr,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-package',
  twitchRuntimeActive: true,
  kickRuntimeActive: true,
  publicTwitchFilterAuthorized: false,
}, null, 2))
