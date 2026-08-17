#!/usr/bin/env node
import fs from 'node:fs'

const candidatePath = 'docs/audits/12a30-kick-history-category-runtime-wiring-candidate.json'
const decisionPath = 'docs/audits/12a29-kick-history-category-runtime-wiring-candidate-decision.json'
const packagePath = 'docs/audits/12a28-kick-history-category-permanent-generator-integration-package.json'
const entryPath = 'workers/collector-kick/src/entry.ts'
const wranglerPath = 'workers/collector-kick/wrangler.toml'
const deployWorkflowPath = '.github/workflows/deploy-collector-workers.yml'
const deployPlannerPath = 'scripts/plan-collector-worker-deploy.mjs'
const workflowPath = '.github/workflows/analytics-12a30-kick-history-category-runtime-wiring-candidate.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const candidate = json(candidatePath)
const decision = json(decisionPath)
const pkg = json(packagePath)
const entry = read(entryPath)
const wrangler = read(wranglerPath)
const deployWorkflow = read(deployWorkflowPath)
const deployPlanner = read(deployPlannerPath)
const workflow = read(workflowPath)

assert(candidate.schemaVersion === 'viewloom-12a30-kick-history-category-runtime-wiring-candidate-v1', 'candidate schema')
assert(candidate.status === 'draft_disabled_by_default_no_merge_authority', 'candidate status')
assert(candidate.phase === '12A-30', 'phase')
assert(candidate.provider === 'kick', 'provider')
assert(candidate.trackingIssue === 897, 'tracking issue')
assert(candidate.decisionIssue === 895, 'decision issue')
assert(candidate.decisionPr === 896, 'decision PR')
assert(candidate.decisionHeadSha === 'cc2dc8edd59523f93e1bfe1a94df9f20e42218c9', 'decision head')
assert(candidate.decisionMergeMainSha === '40a3ea9ff3a88e848fb5f5ce112bd0f127f5ecb8', 'decision merge')

assert(decision.schemaVersion === 'viewloom-12a29-kick-history-category-runtime-wiring-candidate-decision-v1', 'decision schema')
assert(decision.status === 'repository_only_draft_candidate_preparation_authorized_no_deployment', 'decision status')
assert(decision.trackingIssue === 895, 'decision tracking issue')
assert(decision.decision === 'yes_prepare_exactly_one_draft_disabled_runtime_wiring_candidate_only', 'candidate preparation not authorized')
assert(decision.authorizedNextWork.createExactlyOneDraftRuntimeWiringCandidate === true, 'Draft candidate authority')
assert(decision.authorizedNextWork.candidateMustBeDraft === true, 'Draft state authority')
assert(decision.authorizedNextWork.candidateMustRemainDraftAfterCi === true, 'Draft retention authority')
assert(decision.authorizedNextWork.candidateDisabledByDefault === true, 'disabled-by-default authority')
assert(decision.authorizedNextWork.candidateMergeAuthorized === false, 'merge must remain unauthorized')
assert(decision.authorizedNextWork.productionCollectorDeploymentAuthorized === false, 'production deploy must remain unauthorized')
assert(decision.authorizedNextWork.permanentGeneratorProductionEnablementAuthorized === false, 'production enablement must remain unauthorized')

assert(pkg.schemaVersion === 'viewloom-12a28-kick-history-category-permanent-generator-integration-package-v1', 'package schema')
assert(pkg.status === 'dormant_repository_only_no_runtime_wiring', 'package status')
assert(candidate.acceptedDormantPackage.issue === 893, 'package issue')
assert(candidate.acceptedDormantPackage.pr === 894, 'package PR')
assert(candidate.acceptedDormantPackage.mergeMainSha === 'c1c753de71275f857bd68654839bd7debeb6abb6', 'package merge')
assert(candidate.acceptedDormantPackage.contract === packagePath, 'package contract path')
assert(candidate.acceptedDormantPackage.adapter === 'workers/dormant/history-category-aggregate-integration.ts', 'adapter path')

const runtime = candidate.candidateRuntime
assert(runtime.collectorEntry === entryPath, 'entry path')
assert(runtime.kickWrangler === wranglerPath, 'wrangler path')
assert(runtime.adapter === 'workers/dormant/history-category-aggregate-integration.ts', 'runtime adapter path')
assert(runtime.enableEnv === 'HISTORY_CATEGORY_GENERATION_ENABLED', 'enable env')
assert(runtime.startDayEnv === 'HISTORY_CATEGORY_START_DAY', 'startDay env')
assert(runtime.enableValue === 'true', 'enable value')
assert(runtime.categoryCaptureAlsoRequired === true, 'category capture prerequisite')
assert(runtime.missingEnableMeansDisabled === true, 'missing enable must disable')
assert(runtime.nonTrueEnableMeansDisabled === true, 'non-true enable must disable')
assert(runtime.missingStartDayCannotGenerate === true, 'missing startDay must not generate')
assert(runtime.activeWranglerEnableValueCommitted === false, 'active enable config forbidden')
assert(runtime.activeWranglerStartDayCommitted === false, 'active startDay config forbidden')
assert(runtime.wranglerChangedByCandidate === false, 'wrangler change forbidden')
assert(runtime.newCron === false, 'new cron forbidden')
assert(runtime.existingCron === '*/5 * * * *', 'existing cron')
assert(runtime.bucketMinutes === 5, 'bucket')
assert(runtime.retentionDays === 180, 'retention')
assert(runtime.categoryRowCapPerDay === 300, 'category cap')
assert(runtime.streamerCategoryRowCapPerDay === 1000, 'streamer-category cap')
assert(runtime.preActivationDaysEligible === false, 'preactivation forbidden')
assert(runtime.usesExistingMaintenanceWindow === true, 'maintenance window')

for (const fragment of [
  "from '../../dormant/history-category-aggregate-integration'",
  'HISTORY_CATEGORY_GENERATION_ENABLED?: string',
  'HISTORY_CATEGORY_START_DAY?: string',
  'const historyCategoryEnabled = categoryEnabled',
  "&& env.HISTORY_CATEGORY_GENERATION_ENABLED === 'true'",
  "const historyCategoryStartDay = env.HISTORY_CATEGORY_START_DAY?.trim() ?? ''",
  'maybeRunKickHistoryCategoryPermanentIntegration(',
  'enabled: historyCategoryEnabled',
  'startDay: historyCategoryStartDay',
  "event: 'history_category_aggregate_generation'",
]) assert(entry.includes(fragment), `entry fragment missing: ${fragment}`)

for (const forbidden of [
  "HISTORY_CATEGORY_GENERATION_ENABLED = 'true'",
  'HISTORY_CATEGORY_GENERATION_ENABLED: "true"',
  'HISTORY_CATEGORY_START_DAY =',
]) assert(!entry.includes(forbidden), `entry must not hard-code production activation: ${forbidden}`)

assert(!wrangler.includes('HISTORY_CATEGORY'), 'active Kick wrangler must not contain History Category vars')
assert(wrangler.includes('crons = ["*/5 * * * *"]'), 'existing Kick cron must remain unchanged')

const deployment = candidate.deploymentBoundary
assert(deployment.deployWorkflow === deployWorkflowPath, 'deploy workflow path')
assert(deployment.deployPlanner === deployPlannerPath, 'deploy planner path')
assert(deployment.candidateChangesCollectorPath === true, 'candidate collector-path coupling')
assert(deployment.pullRequestPlannerDeployTwitch === false, 'PR Twitch deploy false')
assert(deployment.pullRequestPlannerDeployKick === false, 'PR Kick deploy false')
assert(deployment.pullRequestProductionDeployAuthorized === false, 'PR production deploy unauthorized')
assert(deployment.mainMergeWouldTriggerCollectorDeploymentWorkflow === true, 'main merge deployment coupling')
assert(deployment.candidateMergeAuthorized === false, 'candidate merge unauthorized')
assert(deployment.productionCollectorDeploymentAuthorized === false, 'production deployment unauthorized')
assert(deployment.productionGeneratorEnablementAuthorized === false, 'production enablement unauthorized')
assert(deployment.candidateMustRemainDraft === true, 'candidate must remain Draft')
assert(deployWorkflow.includes("- 'workers/collector-kick/**'"), 'Kick collector deploy path missing')
assert(deployWorkflow.includes('push:'), 'deploy workflow main push event missing')
assert(deployWorkflow.includes('pull_request:'), 'deploy workflow PR event missing')
assert(deployPlanner.includes('let deployTwitch = false'), 'planner Twitch default false')
assert(deployPlanner.includes('let deployKick = false'), 'planner Kick default false')
assert(deployPlanner.includes("else if (eventName !== 'pull_request')"), 'planner PR no-deploy branch missing')

assert(candidate.authorization.candidatePreparationAuthorized === true, 'candidate preparation authority')
assert(candidate.authorization.candidatePrValidationAuthorized === true, 'candidate validation authority')
for (const [key, value] of Object.entries(candidate.authorization)) {
  if (['candidatePreparationAuthorized', 'candidatePrValidationAuthorized'].includes(key)) continue
  assert(value === false, `${key} must remain false`)
}

const expectedFiles = [
  '.github/workflows/analytics-12a30-kick-history-category-runtime-wiring-candidate.yml',
  'docs/audits/12a30-kick-history-category-runtime-wiring-candidate.json',
  'scripts/verify-12a30-kick-history-category-runtime-wiring-candidate.mjs',
  'workers/collector-kick/src/entry.ts',
]
assert(JSON.stringify(candidate.acceptance.exactChangedFiles) === JSON.stringify(expectedFiles), 'exact candidate scope')
assert(candidate.acceptance.pullRequestMustBeDraft === true, 'Draft required')
assert(candidate.acceptance.pullRequestMustRemainDraftAfterCi === true, 'Draft after CI required')
assert(candidate.acceptance.kickWranglerMustRemainUnchanged === true, 'wrangler unchanged')
assert(candidate.acceptance.deployPlannerMustReturnNoDeployOnPullRequest === true, 'PR deploy planner boundary')
assert(candidate.acceptance.allApplicableCiMustPass === true, 'CI required')
assert(candidate.acceptance.mergeForbiddenUnderThisGate === true, 'merge forbidden')
assert(candidate.acceptance.nextGate === 'open_explicit_production_deployment_decision_for_exact_draft_candidate_head', 'next gate')

assert(workflow.includes('name: Analytics 12A30 Kick History Runtime Wiring Candidate'), 'workflow name')
assert(workflow.includes('pull_request:'), 'candidate workflow PR-only')
assert(workflow.includes('github.event.pull_request.draft'), 'candidate workflow must verify Draft state')
assert(workflow.includes('scripts/verify-12a30-kick-history-category-runtime-wiring-candidate.mjs'), 'candidate verifier wired')
assert(workflow.includes('plan-collector-worker-deploy.mjs'), 'deploy planner verification wired')
for (const forbidden of [
  '\n  ' + 'push:',
  'workflow_' + 'dispatch:',
  'sched' + 'ule:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'wrangler@4 ' + 'deploy',
  'actions/' + 'upload-artifact',
]) assert(!workflow.includes(forbidden), `candidate workflow production surface: ${forbidden}`)

console.log(JSON.stringify({
  phase: candidate.phase,
  status: candidate.status,
  disabledByDefault: runtime.missingEnableMeansDisabled,
  activeWranglerEnableValueCommitted: runtime.activeWranglerEnableValueCommitted,
  pullRequestDeployKick: deployment.pullRequestPlannerDeployKick,
  pullRequestDeployTwitch: deployment.pullRequestPlannerDeployTwitch,
  candidateMergeAuthorized: deployment.candidateMergeAuthorized,
  productionDeploymentAuthorized: deployment.productionCollectorDeploymentAuthorized,
  nextGate: candidate.acceptance.nextGate,
}, null, 2))
