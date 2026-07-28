import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  contract: 'docs/audits/12a5-twitch-seven-day-accumulation-audit-contract.json',
  runner: 'scripts/run-12a5-twitch-seven-day-accumulation-audit.mjs',
  workflow: '.github/workflows/analytics-12a5-twitch-seven-day-accumulation-audit.yml',
  gate: 'docs/audits/12a2-current-gate-state.json',
  decision: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-decision-contract.json',
  apiPackage: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-package-contract.json',
  controlsPackage: 'docs/audits/12a5-twitch-heatmap-category-filter-hidden-controls-contract.json',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
}

for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const contract = json(files.contract)
const gate = json(files.gate)
const decision = json(files.decision)
const apiPackage = json(files.apiPackage)
const controlsPackage = json(files.controlsPackage)
const runner = readFileSync(files.runner, 'utf8')
const workflow = readFileSync(files.workflow, 'utf8')
const normalTwitch = readFileSync(files.normalTwitch, 'utf8')

assert.equal(contract.status, 'ready_for_readonly_execution')
assert.equal(contract.trackingIssue, 650)
assert.equal(contract.parentTrackingIssue, 635)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.window.startAt, '2026-07-20T11:40:00.000Z')
assert.equal(contract.window.earliestAuditAt, '2026-07-27T11:40:00.000Z')
assert.equal(contract.window.minimumStableDays, 7)
assert.equal(contract.runtime.collectorCron, '*/5 * * * *')
assert.equal(contract.thresholds.minimumCategoryCoverageRatio, 0.995)
assert.equal(contract.thresholds.maximumGapMinutes, 10.01)
assert.equal(contract.thresholds.minimumCategoryReferenceCoverageRatio, 0.995)
assert.equal(contract.hiddenImplementation.accepted, true)
assert.equal(contract.hiddenImplementation.publicExposureAuthorized, false)
assert.equal(contract.audit.publicCutoverOnPass, false)
assert.equal(contract.audit.separatePublicCutoverPrRequired, true)
assert.equal(Object.values(contract.boundaries).every((value) => value === false), true)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v31')
assert.equal(gate.status, '12a4_kick_permanent_category_capture_accepted')
assert.deepEqual(gate.openBlockers, [
  'twitch_category_ui_seven_day_accumulation_not_accepted',
  'twitch_heatmap_category_filter_public_exposure_not_authorized',
])
assert.equal(gate.currentWorkstream.twitchHeatmapCategoryFilterPublicExposureAuthorized, false)
assert.equal(decision.authorization.publicExposureAuthorized, false)
assert.equal(decision.publicGate.earliestAuditAt, contract.window.earliestAuditAt)
assert.equal(apiPackage.status, 'accepted')
assert.equal(controlsPackage.status, 'accepted')

for (const fragment of [
  "provider = 'twitch'",
  'category-source-v1',
  'provider_category_dictionary',
  'collector_runs',
  'non_select_statement_rejected',
  'eligible_for_public_cutover_pr',
  'productionMutationAuthorized: false',
  'kickMutationAuthorized: false',
]) assert.ok(runner.includes(fragment), `runner missing: ${fragment}`)

for (const fragment of [
  'permissions:',
  'contents: read',
  'Run read-only Twitch seven-day accumulation audit',
  'Verify production HTML still has no public category controls',
  'analytics-12a5-twitch-seven-day-accumulation-audit',
]) assert.ok(workflow.includes(fragment), `workflow missing: ${fragment}`)
assert.equal(workflow.includes('contents: write'), false)
assert.equal(workflow.includes('wrangler@4 deploy'), false)
assert.equal(workflow.includes('git push'), false)
assert.equal(normalTwitch.includes('CATEGORY_CAPTURE_ENABLED = "true"'), false)
assert.equal(/crons\s*=\s*\[\s*"\*\/5 \* \* \* \*"\s*\]/.test(normalTwitch), true)

console.log(JSON.stringify({
  ok: true,
  phase: '12A-5B',
  provider: 'twitch',
  trackingIssue: 650,
  earliestAuditAt: contract.window.earliestAuditAt,
  readOnly: true,
  publicExposureAuthorized: false,
  separatePublicCutoverPrRequired: true,
}, null, 2))
