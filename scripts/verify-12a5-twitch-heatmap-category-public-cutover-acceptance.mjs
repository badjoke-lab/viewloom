import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const evidencePath = 'docs/audits/12a5-twitch-heatmap-category-public-production-evidence.json'
const acceptancePath = 'docs/audits/12a5-twitch-heatmap-category-public-cutover-acceptance.json'
const decisionPath = 'docs/audits/12a5-twitch-heatmap-category-public-cutover-decision.json'
for (const path of [evidencePath, acceptancePath, decisionPath]) assert.equal(existsSync(path), true, `${path}: missing`)

const evidence = json(evidencePath)
const acceptance = json(acceptancePath)
const decision = json(decisionPath)

assert.equal(decision.authorization.publicTwitchCategoryUiAuthorized, true)
assert.equal(decision.authorization.kickCategoryUiAuthorized, false)
assert.equal(evidence.status, 'accepted')
assert.equal(evidence.origin, 'https://www.viewloom.net')
assert.equal(evidence.deploymentCommit, 'b006f45d0676c9ff3e05e5d6727458e43802de53')
assert.equal(evidence.acceptedAttempt, 1)
assert.deepEqual(evidence.failures, [])
assert.equal(evidence.scenarios.length, 4)
for (const scenario of evidence.scenarios) assert.equal(scenario.status, 'pass', `${scenario.name}: failed`)

const byName = new Map(evidence.scenarios.map((scenario) => [scenario.name, scenario]))
const desktop = byName.get('twitch-public-desktop')
const mobile = byName.get('twitch-public-mobile')
const unknown = byName.get('twitch-public-unknown-category')
const kick = byName.get('kick-public-control-isolation')
for (const scenario of [desktop, mobile, unknown, kick]) assert.ok(scenario)
assert.ok(desktop.checks.categoryOptions > 0)
assert.equal(desktop.checks.initialItems, 50)
assert.ok(desktop.checks.selectedItems > 0 && desktop.checks.selectedItems <= 50)
assert.ok(desktop.checks.top20Items > 0 && desktop.checks.top20Items <= 20)
assert.equal(desktop.checks.keyboard, true)
assert.equal(desktop.checks.geometry.overflow, false)
assert.ok(mobile.checks.categoryOptions > 0)
assert.equal(mobile.checks.geometry.width, 390)
assert.equal(mobile.checks.geometry.scrollWidth, 390)
assert.equal(mobile.checks.geometry.overflow, false)
assert.equal(unknown.checks.state, 'unknown_category')
assert.equal(unknown.checks.itemCount, 0)
assert.equal(unknown.checks.uiTitle, 'Unknown Twitch category')
assert.equal(kick.checks.itemCount, 100)
assert.equal(kick.checks.geometry.overflow, false)
assert.equal(evidence.publicTwitchCategoryUiActive, true)
assert.equal(evidence.kickCategoryUiEnabled, false)
assert.equal(evidence.productionMutationPerformed, false)

assert.equal(acceptance.status, 'accepted_on_merge')
assert.equal(acceptance.acceptancePr, 742)
assert.equal(acceptance.implementation.cutoverPr, 740)
assert.equal(acceptance.implementation.cutoverMergeSha, '6193d2f6ad8d9263519d90bddd575d6db4a07283')
assert.equal(acceptance.implementation.mobileOverflowRepairPr, 741)
assert.equal(acceptance.implementation.acceptedProductionSha, 'b006f45d0676c9ff3e05e5d6727458e43802de53')
assert.equal(acceptance.rejectedProductionAttempt.reason, 'mobile overflow 474/390')
assert.equal(acceptance.acceptedDeployment.workflowRunId, 31244148642)
assert.equal(acceptance.acceptedDeployment.verifyJobId, 93069854385)
assert.equal(acceptance.acceptedDeployment.deployJobId, 93069879125)
assert.equal(acceptance.acceptedDeployment.artifactId, 9017954946)
assert.equal(acceptance.acceptedDeployment.artifactDigest, 'sha256:2d20d5123e1b609e5fcb32a26c3734bae1f48f12e8b589009ae3eb6f064aad0a')
assert.equal(acceptance.acceptedProductionBrowser.workflowRunId, 31244148651)
assert.equal(acceptance.acceptedProductionBrowser.contractJobId, 93069854307)
assert.equal(acceptance.acceptedProductionBrowser.productionJobId, 93069877735)
assert.equal(acceptance.acceptedProductionBrowser.artifactId, 9017957852)
assert.equal(acceptance.acceptedProductionBrowser.artifactDigest, 'sha256:9af2fac18c762050a32c8957ab774acdd5c0553c96099eca37964152bfa30110')
assert.equal(acceptance.acceptedProductionBrowser.sourceEvidenceJsonSha256, '9706bfa5f66f04548e7dc36a429c1d63ebd42e656deba5086f4ce0572cc41624')
assert.equal(acceptance.acceptedProductionBrowser.acceptedAttempt, 1)
assert.equal(acceptance.acceptedProductionBrowser.passedScenarioCount, 4)
assert.equal(acceptance.acceptedProductionBrowser.failureCount, 0)
assert.equal(acceptance.acceptedBehavior.mobileOverflow, false)
assert.equal(acceptance.authorization.publicTwitchCategoryUiAccepted, true)
assert.equal(acceptance.authorization.twitchHeatmapCategoryRolloutComplete, true)
assert.equal(acceptance.authorization.kickCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.dayFlowCategoryUiAuthorized, false)
assert.equal(acceptance.authorization.historyCategoryUiAuthorized, false)

console.log(JSON.stringify({
  status: 'pass',
  acceptancePr: acceptance.acceptancePr,
  acceptedProductionSha: acceptance.implementation.acceptedProductionSha,
  publicScenarios: evidence.scenarios.length,
  mobileWidth: mobile.checks.geometry.width,
  mobileScrollWidth: mobile.checks.geometry.scrollWidth,
  publicTwitchCategoryUiAccepted: true,
  kickCategoryUiAuthorized: false,
}, null, 2))
