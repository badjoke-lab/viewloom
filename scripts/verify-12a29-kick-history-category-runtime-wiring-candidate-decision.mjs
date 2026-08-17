#!/usr/bin/env node
import fs from 'node:fs'

const decisionPath = 'docs/audits/12a29-kick-history-category-runtime-wiring-candidate-decision.json'
const packagePath = 'docs/audits/12a28-kick-history-category-permanent-generator-integration-package.json'
const passPath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'
const deployWorkflowPath = '.github/workflows/deploy-collector-workers.yml'
const deployPlannerPath = 'scripts/plan-collector-worker-deploy.mjs'
const collectorEntryPath = 'workers/collector-kick/src/entry.ts'
const kickWranglerPath = 'workers/collector-kick/wrangler.toml'
const workflowPath = '.github/workflows/analytics-12a29-kick-history-category-runtime-wiring-candidate-decision.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const decision = json(decisionPath)
const pkg = json(packagePath)
const pass = json(passPath)
const deployWorkflow = read(deployWorkflowPath)
const deployPlanner = read(deployPlannerPath)
const collectorEntry = read(collectorEntryPath)
const kickWrangler = read(kickWranglerPath)
const workflow = read(workflowPath)

assert(decision.schemaVersion === 'viewloom-12a29-kick-history-category-runtime-wiring-candidate-decision-v1', 'decision schema')
assert(decision.status === 'repository_only_draft_candidate_preparation_authorized_no_deployment', 'decision status')
assert(decision.phase === '12A-29', 'phase')
assert(decision.provider === 'kick', 'provider')
assert(decision.trackingIssue === 895, 'tracking issue')
assert(decision.sourceMainSha === 'c1c753de71275f857bd68654839bd7debeb6abb6', 'source main')
assert(decision.decision === 'yes_prepare_exactly_one_draft_disabled_runtime_wiring_candidate_only', 'decision')

assert(pkg.schemaVersion === 'viewloom-12a28-kick-history-category-permanent-generator-integration-package-v1', 'package schema')
assert(pkg.status === 'dormant_repository_only_no_runtime_wiring', 'package status')
assert(pkg.trackingIssue === 893, 'package issue')
assert(decision.acceptedPackage.issue === 893, 'accepted package issue')
assert(decision.acceptedPackage.pr === 894, 'accepted package PR')
assert(decision.acceptedPackage.headSha === '2e332037e15c9d92bfe38f74f55113927ddae812', 'accepted package head')
assert(decision.acceptedPackage.mergeMainSha === 'c1c753de71275f857bd68654839bd7debeb6abb6', 'accepted package merge')
assert(decision.acceptedPackage.contract === packagePath, 'package contract path')
assert(decision.acceptedPackage.adapter === 'workers/dormant/history-category-aggregate-integration.ts', 'adapter path')
assert(decision.acceptedPackage.collectorDeployPushRunsOnMerge === 0, 'package merge deploy count')

assert(pass.schemaVersion === 'viewloom-12a26-kick-history-category-reprobe-production-pass-v1', 'PASS schema')
assert(pass.performanceDetermination === 'PASS', 'PASS determination')
assert(decision.acceptedProductionEvidence.audit === passPath, 'PASS path')
assert(decision.acceptedProductionEvidence.run === 31987877725, 'PASS run')
assert(decision.acceptedProductionEvidence.rowsRead === 16117, 'rows-read evidence')
assert(decision.acceptedProductionEvidence.rowsReadMaximum === 250000, 'rows-read max')
assert(decision.acceptedProductionEvidence.rowsRead <= decision.acceptedProductionEvidence.rowsReadMaximum, 'rows-read gate')
assert(decision.acceptedProductionEvidence.result === 'PASS', 'PASS result')

const coupling = decision.deploymentCoupling
assert(coupling.workflow === deployWorkflowPath, 'deploy workflow path')
assert(coupling.planner === deployPlannerPath, 'deploy planner path')
assert(coupling.mainPushCollectorKickPathTriggersWorkflow === true, 'Kick path deployment coupling')
assert(coupling.mainPushSharedPathTriggersWorkflow === true, 'shared path deployment coupling')
assert(coupling.pullRequestPlannerDeploysTwitch === false, 'PR Twitch deploy false')
assert(coupling.pullRequestPlannerDeploysKick === false, 'PR Kick deploy false')
assert(coupling.candidatePrCanBeValidatedWithoutProductionDeploy === true, 'Draft PR validation boundary')
assert(coupling.candidateMergeWouldBeProductionDeploymentAction === true, 'merge deployment coupling')
assert(deployWorkflow.includes("- 'workers/shared/**'"), 'shared deployment path missing')
assert(deployWorkflow.includes("- 'workers/collector-kick/**'"), 'Kick deployment path missing')
assert(deployWorkflow.includes('push:'), 'push deployment event missing')
assert(deployWorkflow.includes('pull_request:'), 'PR verification event missing')
assert(deployPlanner.includes("let deployTwitch = false"), 'planner Twitch default false')
assert(deployPlanner.includes("let deployKick = false"), 'planner Kick default false')
assert(deployPlanner.includes("else if (eventName === 'push')"), 'planner push branch')
assert(deployPlanner.includes("else if (eventName !== 'pull_request')"), 'planner PR no-deploy branch')

const next = decision.authorizedNextWork
assert(next.createExactlyOneDraftRuntimeWiringCandidate === true, 'Draft candidate authority')
assert(next.candidateMustBeDraft === true, 'candidate must be Draft')
assert(next.candidateMustRemainDraftAfterCi === true, 'candidate remains Draft')
assert(next.candidateKickOnly === true, 'candidate Kick only')
assert(next.candidateDisabledByDefault === true, 'candidate disabled by default')
assert(next.candidateMayImportDormantAdapterIntoKickCollector === true, 'adapter import preparation')
assert(next.candidateMayAddDisabledRuntimeConfigSupport === true, 'disabled config support')
assert(next.candidateMayCommitEnabledTrue === false, 'enabled true forbidden')
assert(next.candidateMayCommitProductionStartDay === false, 'production start day forbidden')
assert(next.candidateMayAddNewCron === false, 'new cron forbidden')
assert(next.candidateMayBackfill === false, 'backfill forbidden')
assert(next.candidateMayChangeRawRetention === false, 'raw retention change forbidden')
assert(next.candidateMayExposeHistoryCategoryApi === false, 'History API forbidden')
assert(next.candidateMayExposeHistoryCategoryUi === false, 'History UI forbidden')
assert(next.candidateMayChangeTwitch === false, 'Twitch forbidden')
assert(next.candidateMayChangeCrossProviderBehavior === false, 'cross-provider forbidden')
assert(next.candidateMergeAuthorized === false, 'candidate merge unauthorized')
assert(next.productionCollectorDeploymentAuthorized === false, 'production deployment unauthorized')
assert(next.permanentGeneratorProductionEnablementAuthorized === false, 'production generator enablement unauthorized')
assert(next.laterExplicitProductionDeploymentDecisionRequired === true, 'later production decision required')

assert(decision.fixedRuntimeSemantics.bucketMinutes === 5, 'bucket')
assert(decision.fixedRuntimeSemantics.retentionDays === 180, 'retention')
assert(decision.fixedRuntimeSemantics.categoryRowCapPerDay === 300, 'category cap')
assert(decision.fixedRuntimeSemantics.streamerCategoryRowCapPerDay === 1000, 'streamer-category cap')
assert(decision.fixedRuntimeSemantics.explicitStartDayRequiredBeforeEnablement === true, 'startDay required')
assert(decision.fixedRuntimeSemantics.preActivationDaysEligible === false, 'preactivation forbidden')
assert(decision.fixedRuntimeSemantics.reuseExistingCron === '*/5 * * * *', 'cron')
assert(decision.fixedRuntimeSemantics.reuseExistingMaintenanceWindow === true, 'maintenance window')
assert(Object.values(decision.notAuthorized).every((value) => value === true), 'notAuthorized boundary')

assert(!collectorEntry.includes('history-category-aggregate-integration'), 'current collector remains unwired')
assert(!collectorEntry.includes('maybeRunKickHistoryCategoryPermanentIntegration'), 'current collector cannot call adapter')
assert(!kickWrangler.includes('HISTORY_CATEGORY'), 'current Kick History runtime config absent')
assert(kickWrangler.includes('crons = ["*/5 * * * *"]'), 'current cron unchanged')

assert(decision.acceptance.decisionPrMustChangeExactlyThreeRepositoryOnlyFiles === true, 'exact decision scope')
assert(decision.acceptance.decisionPrMustNotTouchCollectorOrWrangler === true, 'decision cannot touch runtime')
assert(decision.acceptance.decisionWorkflowMustBePullRequestOnly === true, 'decision workflow PR-only')
assert(decision.acceptance.nextGate === 'prepare_one_draft_disabled_runtime_wiring_candidate_and_leave_unmerged', 'next gate')

assert(workflow.includes('name: Analytics 12A29 Kick History Runtime Wiring Candidate Decision'), 'workflow name')
assert(workflow.includes('pull_request:'), 'workflow PR-only')
assert(workflow.includes('scripts/verify-12a29-kick-history-category-runtime-wiring-candidate-decision.mjs'), 'verifier wiring')
for (const forbidden of [
  '\n  ' + 'push:',
  'workflow_' + 'dispatch:',
  'sched' + 'ule:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'wrangler@4 ' + 'deploy',
  'actions/' + 'upload-artifact',
]) assert(!workflow.includes(forbidden), `decision workflow production surface: ${forbidden}`)

console.log(JSON.stringify({
  phase: decision.phase,
  decision: decision.decision,
  packageMain: decision.acceptedPackage.mergeMainSha,
  draftCandidateAuthorized: next.createExactlyOneDraftRuntimeWiringCandidate,
  candidateMergeAuthorized: next.candidateMergeAuthorized,
  productionDeploymentAuthorized: next.productionCollectorDeploymentAuthorized,
  productionEnablementAuthorized: next.permanentGeneratorProductionEnablementAuthorized,
  nextGate: decision.acceptance.nextGate,
}, null, 2))
