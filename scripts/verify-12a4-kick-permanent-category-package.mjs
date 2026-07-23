import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const contractPath = 'docs/audits/12a4-kick-permanent-category-capture-package-contract.json'
const decisionPath = 'docs/audits/12a4-kick-permanent-category-decision-contract.json'
const gatePath = 'docs/audits/12a2-current-gate-state.json'
const requiredDocs = [
  'docs/product/category-capture-permanent-rollout-spec.md',
  'docs/product/category-capture-permanent-rollout-plan.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/work-in-progress/phase12a4-category-parallel-execution.md',
  'docs/operations/development-and-deployment-policy.md',
]

for (const path of [contractPath, decisionPath, gatePath, ...requiredDocs]) {
  assert.equal(fs.existsSync(path), true, `${path}: missing`)
}

const contract = json(contractPath)
const decision = json(decisionPath)
const gate = json(gatePath)
const normal = read(contract.package.normalConfig)
const permanent = read(contract.package.permanentConfig)
const twitch = read('workers/collector-twitch/wrangler.category-permanent.toml')
const observer = read(contract.package.readOnlyObserver)
const fixture = read(contract.package.fixture)

const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null

assert.ok(['candidate', 'accepted'].includes(contract.status))
assert.equal(contract.provider, 'kick')
assert.equal(contract.trackingIssue, 634)
assert.equal(contract.acceptedDecision.requiredGateSchemaVersion, 'viewloom-12a2-current-gate-state-v28')
assert.equal(contract.acceptedDecision.requiredGatePhase, '12A-4-24')
assert.equal(gate.currentWorkstream.phase, '12A-4-24')
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.categoryUiPublicExposureAuthorized, false)

if (contract.status === 'candidate') {
  assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v28')
  assert.equal(contract.acceptance, undefined)
} else {
  assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v29')
  assert.equal(gate.categoryCapture.kickPermanentPackageAccepted, true)
  assert.equal(gate.currentWorkstream.kickPermanentPackageAccepted, true)
  assert.equal(contract.acceptance.packagePr, 637)
  assert.equal(contract.acceptance.packageCandidateHeadSha, 'dc32533a02eca6586202a995d37ea0cddd2a4688')
  assert.equal(contract.acceptance.packageMergeSha, 'b4012ebddb9ec33c50b6298c882f0f1a4ee16be0')
  assert.equal(contract.acceptance.workflowRunId, 30003489805)
  assert.equal(contract.acceptance.workflowJobId, 89193908765)
  assert.equal(contract.acceptance.fixturePass, true)
  assert.equal(contract.acceptance.packageContractPass, true)
  assert.equal(contract.acceptance.categoryRolloutPolicyPass, true)
  assert.equal(contract.acceptance.collectorTypecheckPass, true)
  assert.equal(contract.acceptance.normalKickDryRunBundlePass, true)
  assert.equal(contract.acceptance.permanentCategoryKickDryRunBundlePass, true)
  assert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)
  assert.equal(contract.acceptance.productionWorkerDeployed, false)
  assert.equal(contract.acceptance.remoteD1OperationPerformed, false)
  assert.equal(contract.acceptance.twitchChanged, false)
}

assert.equal(decision.status, 'accepted_for_guarded_implementation')
assert.equal(decision.trackingIssue, 634)
assert.equal(decision.decision.implementationAuthorized, true)
assert.equal(decision.decision.runtimeActive, false)
assert.equal(decision.decision.productionDeploymentAuthorizedFromImplementationPr, false)
assert.equal(decision.decision.freshReadOnlyPreflightRequired, true)
assert.equal(decision.decision.separateExactReleaseTriggerRequired, true)

assert.equal(toml(normal, 'name'), contract.runtimeContract.serviceName)
assert.equal(toml(permanent, 'name'), toml(normal, 'name'))
assert.equal(toml(permanent, 'main'), toml(normal, 'main'))
assert.equal(toml(permanent, 'database_name'), contract.runtimeContract.databaseName)
assert.equal(toml(permanent, 'database_name'), toml(normal, 'database_name'))
assert.equal(toml(permanent, 'database_id'), toml(normal, 'database_id'))
assert.equal(cron(normal), contract.runtimeContract.collectorCron)
assert.equal(cron(permanent), cron(normal))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_CANARY_/.test(permanent), false)
assert.notEqual(toml(permanent, 'database_id'), toml(twitch, 'database_id'))

for (const fragment of [
  "provider: 'kick'",
  "json('docs/audits/12a4-kick-permanent-category-capture-package-contract.json')",
  "'preflight', 'observe', 'rollback'",
  "provider != 'kick'",
  "provider = 'kick'",
  "databaseName, '--remote', '--json'",
  "throw new Error('non_select_statement_rejected')",
  'productionMutationAuthorized: false',
  'twitchMutationAuthorized: false',
]) assert.ok(observer.includes(fragment), `observer missing: ${fragment}`)

assert.ok(fixture.includes("provider: 'kick'"))
assert.ok(fixture.includes('twitchChanged: false'))
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)
assert.equal(contract.runtimeContract.newWorkerCronAuthorized, false)
assert.equal(contract.runtimeContract.twitchConfigurationChanged, false)
assert.equal(contract.implementationRequirements.categoryUiIncluded, false)
assert.equal(contract.implementationRequirements.crossProviderIdentityAllowed, false)
assert.equal(contract.implementationRequirements.combinedProviderRankingAllowed, false)
assert.equal(contract.readOnlyPreflight.productionMutationAllowed, false)
assert.equal(contract.rollback.config, contract.package.normalConfig)

console.log(JSON.stringify({
  ok: true,
  phase: contract.workstream,
  lifecycle: contract.status,
  trackingIssue: contract.trackingIssue,
  provider: contract.provider,
  canonicalGate: gate.schemaVersion,
  normalIdentityPreserved: true,
  fiveMinuteCronPreserved: true,
  permanentFlagScopedToCandidateConfig: true,
  productionDeploymentIncluded: false,
  remoteD1OperationIncluded: false,
  twitchChanged: false,
  publicCategoryUiChanged: false,
  nextAction: contract.status === 'accepted' ? 'prepare-release-package-and-fresh-preflight' : 'accept-package-before-release-package',
}, null, 2))