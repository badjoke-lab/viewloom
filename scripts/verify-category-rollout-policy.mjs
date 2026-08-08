import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = {
  historicalGate: 'docs/audits/12a2-current-gate-state.json',
  finalEvidence: 'docs/audits/12a5-twitch-replacement-audit-final-evidence.json',
  finalAcceptance: 'docs/audits/12a5-twitch-replacement-audit-final-acceptance.json',
  finalDecision: 'docs/audits/12a5-twitch-category-final-mode-decision.json',
  hiddenEvidence: 'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-evidence.json',
  hiddenAcceptance: 'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-acceptance.json',
  cutoverDecision: 'docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json',
}
for (const path of Object.values(required)) assert.equal(existsSync(path), true, `${path}: missing`)

const gate = json(required.historicalGate)
const finalEvidence = json(required.finalEvidence)
const finalAcceptance = json(required.finalAcceptance)
const finalDecision = json(required.finalDecision)
const hiddenEvidence = json(required.hiddenEvidence)
const hiddenAcceptance = json(required.hiddenAcceptance)
const cutover = json(required.cutoverDecision)

// v33 remains immutable historical accumulation evidence. Current public-cutover authority is the accepted evidence/decision chain below.
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v33')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.crossProviderIdentityAllowed, false)
assert.equal(gate.categoryCapture.combinedProviderRankingAllowed, false)

assert.equal(finalEvidence.status, 'accepted')
assert.equal(finalEvidence.mode, 'final')
assert.equal(finalEvidence.data.slotAnalysis.expectedSlots, 2016)
assert.equal(finalEvidence.data.slotAnalysis.observedDistinctSlots, 2016)
assert.equal(finalEvidence.data.slotAnalysis.coverageRatio, 1)
assert.equal(finalEvidence.data.slotAnalysis.missingSlotCount, 0)
assert.equal(finalEvidence.data.slotAnalysis.maximumConsecutiveMissingSlots, 0)
assert.ok(finalEvidence.data.categoryReferenceCoverageRatio >= 0.99)
assert.equal(finalEvidence.data.unresolvedCategoryIds, 0)
assert.equal(finalEvidence.data.twitchProviderLeakageRows, 0)
assert.equal(finalEvidence.data.kickProviderLeakageRows, 0)
assert.deepEqual(finalEvidence.hardStops, [])
assert.equal(finalAcceptance.acceptancePr, 736)
assert.equal(finalDecision.decision, 'authorize_hidden_filter_revalidation')

assert.equal(hiddenEvidence.status, 'pass')
assert.equal(hiddenEvidence.scenarios.length, 5)
assert.deepEqual(hiddenEvidence.failures, [])
assert.equal(hiddenAcceptance.acceptancePr, 739)
assert.equal(hiddenAcceptance.authorization.publicCutoverDecisionAuthorized, true)

assert.equal(cutover.status, 'accepted_on_merge')
assert.equal(cutover.provider, 'twitch')
assert.equal(cutover.decision, 'authorize_public_twitch_heatmap_category_filter')
assert.equal(cutover.hiddenProductionRevalidation.acceptancePr, 739)
assert.equal(cutover.hiddenProductionRevalidation.acceptanceMergeSha, 'ef4f2ba3ea5bbbb739ac8d6941dad074fa05591d')
assert.equal(cutover.publicBehavior.defaultCategory, 'all')
assert.equal(cutover.publicBehavior.defaultTop, 50)
assert.deepEqual(cutover.publicBehavior.allowedTopValues, [20, 50, 100])
assert.equal(cutover.publicBehavior.filterBeforeTopN, true)
assert.equal(cutover.authorization.publicTwitchCategoryUiAuthorized, true)
assert.equal(cutover.authorization.defaultRouteExposureAuthorized, true)
assert.equal(cutover.authorization.kickCategoryUiAuthorized, false)
for (const key of [
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized',
]) assert.equal(cutover.authorization[key], false, `${key}: must remain false`)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const dbId = (source) => source.match(/^database_id\s*=\s*"([^"]+)"$/m)?.[1] ?? null
const twNormal = read('workers/collector-twitch/wrangler.toml')
const twPermanent = read('workers/collector-twitch/wrangler.category-permanent.toml')
const kickNormal = read('workers/collector-kick/wrangler.toml')
const kickPermanent = read('workers/collector-kick/wrangler.category-permanent.toml')
assert.equal(cron(twNormal), '*/5 * * * *')
assert.equal(cron(twPermanent), cron(twNormal))
assert.equal(cron(kickNormal), '*/5 * * * *')
assert.equal(cron(kickPermanent), cron(kickNormal))
assert.equal(dbId(twPermanent), dbId(twNormal))
assert.equal(dbId(kickPermanent), dbId(kickNormal))
assert.notEqual(dbId(twPermanent), dbId(kickPermanent))

console.log(JSON.stringify({
  ok: true,
  historicalGate: gate.schemaVersion,
  finalSlots: finalEvidence.data.slotAnalysis.observedDistinctSlots,
  categoryReferenceCoverage: finalEvidence.data.categoryReferenceCoverageRatio,
  hiddenProductionScenarios: hiddenEvidence.scenarios.length,
  publicTwitchFilterAuthorized: cutover.authorization.publicTwitchCategoryUiAuthorized,
  kickCategoryUiAuthorized: cutover.authorization.kickCategoryUiAuthorized,
}, null, 2))
