import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-evidence.json'
const acceptancePath = 'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-acceptance.json'
const contractPath = 'docs/audits/12a5-twitch-heatmap-category-hidden-revalidation-contract.json'
const decisionPath = 'docs/audits/12a5-twitch-category-final-mode-decision.json'
const productionWorkflow = '.github/workflows/analytics-12a5-twitch-category-hidden-production-revalidation.yml'

const json = (p) => JSON.parse(readFileSync(p, 'utf8'))
for (const p of [evidencePath, acceptancePath, contractPath, decisionPath]) assert.equal(existsSync(p), true, `${p}: missing`)
assert.equal(existsSync(productionWorkflow), false, `${productionWorkflow}: one-time production revalidation workflow must be retired`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const contract = json(contractPath)
const decision = json(decisionPath)

assert.equal(evidence.status, 'pass')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.publicCutoverAuthorized, false)
assert.equal(evidence.productionMutationPerformed, false)
assert.equal(evidence.scenarios.length, 5)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: must pass`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const normal = byName.get('twitch-normal-desktop')
const hidden = byName.get('twitch-hidden-desktop')
const mobile = byName.get('twitch-hidden-mobile')
const unknown = byName.get('twitch-hidden-unknown-category')
const kick = byName.get('kick-preview-query-control')
for (const value of [normal, hidden, mobile, unknown, kick]) assert.ok(value)
assert.equal(normal.checks.itemCount, 300)
assert.equal(normal.checks.state, 'live')
assert.equal(normal.checks.categoryImplementation, 'hidden')
assert.equal(normal.checks.geometry.overflow, false)
assert.equal(hidden.checks.initialItems, 50)
assert.ok(hidden.checks.categoryOptions > 0)
assert.equal(hidden.checks.selectedCategory, '263490')
assert.ok(hidden.checks.selectedItems > 0 && hidden.checks.selectedItems <= 50)
assert.ok(hidden.checks.top20Items > 0 && hidden.checks.top20Items <= 20)
assert.equal(hidden.checks.keyboard, true)
assert.equal(hidden.checks.geometry.overflow, false)
assert.ok(mobile.checks.categoryOptions > 0)
assert.equal(mobile.checks.geometry.overflow, false)
assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.itemCount, 0)
assert.equal(unknown.checks.uiTitle, 'Unknown Twitch category')
assert.equal(kick.checks.itemCount, 100)
assert.equal(kick.checks.state, 'live')
assert.equal(kick.checks.geometry.overflow, false)

assert.equal(contract.status, 'ready_for_validation')
assert.equal(contract.provider, 'twitch')
assert.equal(contract.decision.mergeSha, '70cd79800edbdd2ff6d0cd65193bfb874917d0f4')
assert.equal(decision.authorization.hiddenTwitchFilterRevalidationAuthorized, true)
assert.equal(decision.authorization.publicTwitchCategoryUiAuthorized, false)

assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptancePr, 739)
assert.equal(acceptance.package.pr, 738)
assert.equal(acceptance.package.mergeSha, 'fadfa77f57b1373ac52e01e4cc0dda0ec3541973')
assert.equal(acceptance.execution.workflowRunId, 31242140146)
assert.equal(acceptance.execution.contractJobId, 93064776764)
assert.equal(acceptance.execution.productionJobId, 93064805414)
assert.equal(acceptance.execution.artifactId, 9017371935)
assert.equal(acceptance.execution.artifactDigest, 'sha256:85dc948e33e052b22961ff12581f7924d854452f0ffeb99b5053a57adf9120b1')
assert.equal(acceptance.execution.sourceEvidenceJsonSha256, '116c49d3cfb12e31778712bf855f829091e72fe167f586de411db1e4b8341108')
assert.equal(acceptance.acceptedResult.scenarioCount, 5)
assert.equal(acceptance.acceptedResult.passedScenarioCount, 5)
assert.equal(acceptance.acceptedResult.failureCount, 0)
assert.equal(acceptance.authorization.hiddenRevalidationAcceptedOnMerge, true)
assert.equal(acceptance.authorization.publicCutoverDecisionAuthorized, true)
assert.equal(acceptance.authorization.publicTwitchCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.kickCategoryUiAuthorized, false)
for (const key of [
  'collectorChangeAuthorized',
  'workerDeploymentAuthorized',
  'd1MutationAuthorized',
  'bindingChangeAuthorized',
  'cadenceChangeAuthorized',
  'retentionChangeAuthorized',
  'backfillAuthorized',
  'crossProviderBehaviorAuthorized',
]) assert.equal(acceptance.authorization[key], false, `${key}: must remain false`)

console.log(JSON.stringify({
  status: 'pass',
  acceptancePr: acceptance.acceptancePr,
  scenarios: evidence.scenarios.length,
  categoryOptions: hidden.checks.categoryOptions,
  selectedCategory: hidden.checks.selectedCategory,
  publicCutoverDecisionAuthorized: true,
  publicCategoryUiAuthorized: false,
  productionRevalidationWorkflowRetired: true,
}, null, 2))
