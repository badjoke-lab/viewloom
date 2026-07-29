import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))

const files = {
  agents: 'AGENTS.md',
  contributing: 'CONTRIBUTING.md',
  docsIndex: 'docs/README.md',
  auditSpec: 'docs/product/twitch-replacement-seven-day-audit-spec.md',
  roadmap: 'docs/product/current-roadmap.md',
  schedule: 'docs/product/current-schedule.md',
  activeWip: 'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  gate: 'docs/audits/12a2-current-gate-state.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-permanent-category-recovery-acceptance.json',
  sourcePackage: 'docs/audits/12a5-twitch-replacement-seven-day-audit-package-contract.json',
  runnerRepair: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-contract.json',
  runnerRepairAcceptance: 'docs/audits/12a5-twitch-replacement-seven-day-audit-runner-repair-acceptance.json',
  checkpointPackage: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-package-contract.json',
  checkpointAcceptance: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-package-acceptance.json',
  checkpointTriggerContract: 'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger-contract.json',
  hiddenDecision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  hiddenControls: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  kickAcceptance: 'docs/audits/12a4-kick-permanent-category-final-acceptance.json',
  auditRunner: 'scripts/run-12a5-twitch-replacement-seven-day-audit.mjs',
  checkpointVerifier: 'scripts/verify-12a5-twitch-replacement-audit-checkpoint-package.mjs',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalKick: 'workers/collector-kick/wrangler.toml',
  permanentKick: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const gate = json(files.gate)
const recovery = json(files.recoveryAcceptance)
const sourcePackage = json(files.sourcePackage)
const repair = json(files.runnerRepair)
const repairAcceptance = json(files.runnerRepairAcceptance)
const checkpointPackage = json(files.checkpointPackage)
const checkpointAcceptance = json(files.checkpointAcceptance)
const triggerContract = json(files.checkpointTriggerContract)
const hiddenDecision = json(files.hiddenDecision)
const hiddenControls = json(files.hiddenControls)
const kickAcceptance = json(files.kickAcceptance)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.status, '12a5_twitch_permanent_category_capture_recovered_seven_day_accumulation_active')
assert.equal(gate.currentWorkstream.phase, '12A-5B-R2')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.twitchStableAccumulationStartAt, '2026-07-29T05:30:00.000Z')
assert.equal(gate.currentWorkstream.twitchStableAccumulationEarliestAuditAt, '2026-08-05T05:30:00.000Z')
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(recovery.status, 'accepted')
assert.equal(recovery.gates.permanentBindingPass, true)
assert.equal(recovery.gates.cadencePass, true)
assert.equal(recovery.gates.providerLeakagePass, true)
assert.equal(recovery.gates.storagePass, true)
assert.equal(recovery.boundaries.kickChanged, false)
assert.equal(recovery.boundaries.publicCategoryUiAuthorized, false)

assert.equal(sourcePackage.status, 'accepted_dormant')
assert.equal(sourcePackage.window.expectedFinalSlots, 2016)
assert.equal(sourcePackage.modes.checkpoint.authorizesAuditAcceptance, false)
assert.equal(sourcePackage.modes.checkpoint.authorizesPublicCutover, false)
assert.equal(sourcePackage.modes.final.allowedBeforeFinalBoundary, false)

assert.equal(repair.status, 'accepted')
assert.equal(repair.defect.code, 'sqlite_cte_scope_cross_statement')
assert.equal(repair.repair.slotEnumerationReadsMinuteSnapshotsDirectly, true)
assert.equal(repair.repair.allStatementsRemainSelectOrWith, true)
assert.equal(repair.acceptance.repairPr, 663)
assert.equal(repair.acceptance.acceptancePr, 664)
assert.equal(repairAcceptance.status, 'accepted')
assert.equal(repairAcceptance.validation.conclusion, 'success')
assert.equal(Object.values(repairAcceptance.boundaries).every((value) => value === false), true)

assert.equal(checkpointPackage.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-package-v1')
assert.equal(checkpointPackage.status, 'accepted')
assert.equal(checkpointPackage.mode, 'checkpoint')
assert.equal(checkpointPackage.acceptance.packagePr, 665)
assert.equal(checkpointPackage.acceptance.packageMergeSha, '317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a')
assert.equal(checkpointPackage.acceptance.acceptancePr, 666)
assert.equal(checkpointPackage.acceptance.validationRunId, 30476596379)
assert.equal(checkpointPackage.acceptance.validationJobId, 90659857133)
assert.equal(checkpointPackage.execution.newWorkerCronAdded, false)
assert.equal(checkpointPackage.checkpointBoundary.authorizesAuditAcceptance, false)
assert.equal(checkpointPackage.checkpointBoundary.authorizesPublicCutover, false)
assert.equal(Object.values(checkpointPackage.readOnlyBoundary).every((value) => Array.isArray(value) || value === false), true)

assert.equal(checkpointAcceptance.status, 'accepted')
assert.equal(checkpointAcceptance.acceptancePr, 666)
assert.equal(checkpointAcceptance.packagePr, 665)
assert.equal(checkpointAcceptance.validation.conclusion, 'success')
assert.equal(checkpointAcceptance.validation.triggerAbsentPass, true)
assert.equal(checkpointAcceptance.validation.productionCheckpointJobSkippedPass, true)
assert.equal(checkpointAcceptance.acceptedCapabilities.checkpointNonAuthorizing, true)
assert.equal(Object.values(checkpointAcceptance.boundaries).every((value) => value === false), true)

assert.equal(triggerContract.status, 'accepted')
assert.equal(triggerContract.mode, 'checkpoint')
assert.equal(triggerContract.acceptedPackageIdentity.packagePr, 665)
assert.equal(triggerContract.acceptedPackageIdentity.packageMergeSha, '317675ea9a6256eb61bf36f8ec9d7a51ffdfff2a')
assert.equal(triggerContract.acceptedPackageIdentity.acceptancePr, 666)
assert.equal(triggerContract.executionBoundary.finalModeAuthorized, false)
assert.equal(triggerContract.executionBoundary.newWorkerCronAuthorized, false)
assert.equal(triggerContract.afterExecution.auditAcceptanceAuthorized, false)
assert.equal(triggerContract.afterExecution.publicCutoverAuthorized, false)

assert.equal(hiddenDecision.authorization.publicExposureAuthorized, false)
assert.equal(hiddenControls.acceptance.publicExposureEnabled, false)
assert.equal(kickAcceptance.status, 'accepted')
assert.equal(kickAcceptance.rollbackRequired, false)
assert.equal(kickAcceptance.data.providerLeakageRows, 0)

for (const [path, fragments] of Object.entries({
  [files.agents]: ['Checkpoint package: accepted PR #665 / #666', 'work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.contributing]: ['Checkpoint package accepted PR #665 / #666', 'Current branch work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.docsIndex]: ['Checkpoint package accepted PR #665 / #666', 'Current branch work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.auditSpec]: ['Checkpoint package PR: #665', 'Checkpoint package acceptance PR: #666', 'work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.roadmap]: ['Checkpoint package PR #665', 'acceptance PR #666', 'work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.schedule]: ['Checkpoint package PR #665', 'Checkpoint package acceptance PR #666', 'Current branch work-659-twitch-replacement-audit-checkpoint-trigger'],
  [files.activeWip]: ['Checkpoint package: PR #665', 'Checkpoint package acceptance: PR #666', 'work-659-twitch-replacement-audit-checkpoint-trigger'],
})) {
  const source = read(path)
  for (const fragment of fragments) assert.ok(source.includes(fragment), `${path} missing: ${fragment}`)
}

const runner = read(files.auditRunner)
assert.ok(runner.includes('export function buildTwitchWindowSql'))
const slotQuery = runner.match(/SELECT bucket_minute AS observed_bucket_minute[\s\S]*?ORDER BY bucket_minute;/)?.[0]
assert.ok(slotQuery)
assert.ok(slotQuery.includes('FROM minute_snapshots'))
assert.equal(slotQuery.includes('FROM scoped'), false)
assert.ok(runner.includes("if (statements.some((part) => !/^(SELECT|WITH)\\b/i.test(part)))"))
assert.ok(read(files.checkpointVerifier).includes('checkpointPackageAccepted: true'))

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

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  canonicalGate: gate.schemaVersion,
  checkpointPackageAccepted: true,
  checkpointPackagePr: 665,
  checkpointAcceptancePr: 666,
  nextBranch: 'work-659-twitch-replacement-audit-checkpoint-trigger',
  twitchRuntimeActive: true,
  kickRuntimeActive: true,
  publicTwitchFilterAuthorized: false,
}, null, 2))
