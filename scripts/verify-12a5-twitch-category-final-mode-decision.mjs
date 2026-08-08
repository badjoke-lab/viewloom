import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const decisionPath = 'docs/audits/12a5-twitch-category-final-mode-decision.json'
const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-final-evidence.json'
const acceptancePath = 'docs/audits/12a5-twitch-replacement-audit-final-acceptance.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-final-retirement.json'
const triggerPath = 'docs/audits/12a5-twitch-replacement-audit-final-trigger.json'
const executionWorkflow = '.github/workflows/analytics-12a5-twitch-replacement-audit-final.yml'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
for (const path of [decisionPath, evidencePath, acceptancePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
assert.equal(existsSync(triggerPath), false, 'consumed final trigger must remain retired')
assert.equal(existsSync(executionWorkflow), false, 'consumed final workflow must remain retired')

const decision = json(decisionPath)
const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const retirement = json(retirementPath)

assert.equal(decision.status, 'accepted_on_merge')
assert.equal(decision.provider, 'twitch')
assert.equal(decision.feature, 'heatmap_category_filter')
assert.equal(decision.decision, 'authorize_hidden_filter_revalidation')
assert.equal(decision.evidenceAcceptance.pr, 736)
assert.equal(decision.evidenceAcceptance.mergeSha, 'bf41aad2ea6aaf428d9e77e41d35df6303bb19be')
assert.equal(decision.evidenceAcceptance.workflowRunId, 31241374639)
assert.equal(decision.evidenceAcceptance.finalJobId, 93063011226)
assert.equal(decision.evidenceAcceptance.artifactId, 9017123435)
assert.equal(decision.evidenceAcceptance.artifactDigest, acceptance.execution.artifactDigest)
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.outcome, 'accepted_for_separate_evidence_pr')
assert.equal(evidence.data.slotAnalysis.expectedSlots, 2016)
assert.equal(evidence.data.slotAnalysis.observedDistinctSlots, 2016)
assert.equal(evidence.data.slotAnalysis.coverageRatio, 1)
assert.equal(evidence.data.slotAnalysis.missingSlotCount, 0)
assert.equal(evidence.data.slotAnalysis.maximumConsecutiveMissingSlots, 0)
assert.ok(evidence.data.categoryReferenceCoverageRatio >= 0.99)
assert.equal(evidence.data.unresolvedCategoryIds, 0)
assert.equal(evidence.data.collectorErrorRuns, 0)
assert.equal(evidence.data.twitchProviderLeakageRows, 0)
assert.equal(evidence.data.kickProviderLeakageRows, 0)
assert.equal(evidence.storage.providerPass, true)
assert.equal(evidence.storage.accountPass, true)
assert.equal(evidence.publicSurface.pass, true)
assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptancePr, 736)
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(decision.authorization.hiddenTwitchFilterRevalidationAuthorized, true)
assert.equal(decision.authorization.productionReadOnlyBrowserVerificationAuthorized, true)
for (const name of [
  'publicTwitchCategoryUiAuthorized',
  'defaultRouteExposureAuthorized',
  'publicNavigationAuthorized',
  'kickCategoryUiAuthorized',
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'crossProviderBehaviorAuthorized',
  'combinedProviderRankingAuthorized'
]) assert.equal(decision.authorization[name], false, `${name}: must remain false`)
for (const value of Object.values(decision.requiredRevalidation)) {
  if (typeof value === 'boolean') assert.equal(value, true)
}
assert.equal(decision.requiredRevalidation.hiddenEntry, 'categoryPreview=1')
assert.equal(decision.requiredRevalidation.provider, 'twitch')

console.log(JSON.stringify({
  status: 'pass',
  decision: decision.decision,
  acceptedSlots: evidence.data.slotAnalysis.observedDistinctSlots,
  categoryReferenceCoverage: evidence.data.categoryReferenceCoverageRatio,
  hiddenRevalidationAuthorized: true,
  publicCutoverAuthorized: false
}, null, 2))
