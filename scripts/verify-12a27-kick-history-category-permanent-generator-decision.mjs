#!/usr/bin/env node
import fs from 'node:fs'

const decisionPath = 'docs/audits/12a27-kick-history-category-permanent-generator-decision.json'
const passPath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'
const triggerPath = 'docs/audits/12a25-kick-history-category-reprobe-trigger.json'
const retiredWorkflowPath = '.github/workflows/analytics-12a25-kick-history-category-reprobe-execution.yml'
const generatorContractPath = 'docs/audits/12a15-kick-history-category-aggregate-generator-contract.json'
const kickEntryPath = 'workers/collector-kick/src/entry.ts'
const kickConfigPath = 'workers/collector-kick/wrangler.toml'
const decisionWorkflowPath = '.github/workflows/analytics-12a27-kick-history-category-permanent-generator-decision.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const decision = json(decisionPath)
const pass = json(passPath)
const trigger = json(triggerPath)
const retiredWorkflow = read(retiredWorkflowPath)
const generatorContract = json(generatorContractPath)
const kickEntry = read(kickEntryPath)
const kickConfig = read(kickConfigPath)
const decisionWorkflow = read(decisionWorkflowPath)

assert(decision.schemaVersion === 'viewloom-12a27-kick-history-category-permanent-generator-decision-v1', 'decision schema')
assert(decision.status === 'repository_only_decision_no_runtime_enablement', 'decision status')
assert(decision.phase === '12A-27', 'phase')
assert(decision.provider === 'kick', 'provider')
assert(decision.trackingIssue === 891, 'tracking issue')
assert(decision.parentProgramIssue === 872, 'parent program')
assert(decision.sourceMainSha === 'e5ee1f17313638621eca3a242bc0a435f847208e', 'source main')
assert(decision.decision === 'yes_authorize_exactly_one_dormant_permanent_generator_integration_package_only', 'decision')
assert(Array.isArray(decision.rationale) && decision.rationale.length >= 6, 'rationale')

const accepted = decision.acceptedProductionEvidence
assert(accepted.audit === passPath, 'accepted audit path')
assert(accepted.canonicalMainSha === 'e5ee1f17313638621eca3a242bc0a435f847208e', 'canonical main')
assert(accepted.productionPr === 885, 'production PR')
assert(accepted.productionHeadSha === '33819c2ceff36c819d727d0399f85bbd789ba920', 'production head')
assert(accepted.workflowRun === 31987877725, 'workflow run')
assert(accepted.performanceDetermination === 'PASS', 'accepted PASS')
assert(accepted.rowsRead === 16117 && accepted.rowsRead <= accepted.rowsReadMaximum, 'rows read PASS')
assert(accepted.rowsReadMaximum === 250000, 'rows read maximum')
assert(accepted.rowsWritten === 1164 && accepted.rowsWritten <= accepted.rowsWrittenMaximum, 'rows written PASS')
assert(accepted.rowsWrittenMaximum === 5000, 'rows written maximum')
assert(accepted.changes === 583 && accepted.changes <= accepted.changesMaximum, 'changes PASS')
assert(accepted.changesMaximum === 3000, 'changes maximum')
assert(accepted.statements === 24 && accepted.statements <= accepted.statementsMaximum, 'statements PASS')
assert(accepted.statementsMaximum === 40, 'statements maximum')
assert(accepted.workerWallMs === 2178 && accepted.workerWallMs <= accepted.workerWallMsMaximum, 'wall PASS')
assert(accepted.workerWallMsMaximum === 20000, 'wall maximum')
assert(accepted.databaseSizeDeltaBytes === 0 && accepted.databaseSizeDeltaBytes <= accepted.databaseSizeIncreaseMaximumBytes, 'size PASS')
assert(accepted.databaseSizeIncreaseMaximumBytes === 1048576, 'size maximum')
assert(accepted.cleanupExitCode === 0, 'cleanup exit')
assert(accepted.postCleanupAggregateRows === 0, 'post cleanup aggregate rows')
assert(accepted.postCleanupProviderLeakageRows === 0, 'post cleanup leakage')
assert(accepted.temporaryWorkerDeleted === true, 'temporary Worker deleted')
assert(accepted.postDeleteHttpStatus === 404, 'final 404')
assert(accepted.sourceArtifactId === 9274330562, 'artifact id')
assert(accepted.sourceArtifactDigest === 'sha256:3885386abd9e9c6f5c578766529aabcf689cd30b95ee342bafebe687ef8d4580', 'artifact digest')

assert(pass.schemaVersion === 'viewloom-12a26-kick-history-category-reprobe-production-pass-v1', 'PASS schema')
assert(pass.status === 'production_pass_cleanup_safe_authority_retired', 'PASS status')
assert(pass.performanceDetermination === 'PASS', 'PASS determination')
assert(pass.production.run === accepted.workflowRun, 'PASS run linkage')
assert(pass.production.headSha === accepted.productionHeadSha, 'PASS head linkage')
assert(pass.result.cost.rowsRead === accepted.rowsRead, 'PASS rows-read linkage')
assert(pass.thresholds.rowsReadMaximum === accepted.rowsReadMaximum, 'PASS threshold linkage')
assert(pass.result.cleanupExitCode === 0, 'PASS cleanup linkage')
assert(pass.postCleanup.aggregateRows === 0, 'PASS cleanup rows linkage')
assert(pass.postCleanup.providerLeakageRows === 0, 'PASS cleanup leakage linkage')
assert(pass.temporaryWorkerDeleted === true && pass.postDeleteHttpStatus === 404, 'PASS worker retirement linkage')

assert(decision.historicalEvidence.previousCompletedRowsRead === 843288, 'historical rows read')
assert(decision.historicalEvidence.previousCompletedRowsReadMaximum === 250000, 'historical threshold')
assert(decision.historicalEvidence.previousCompletedResult === 'FAIL', 'historical result')
assert(decision.historicalEvidence.incompleteReplacementRun === 31959926240, 'incomplete replacement run')
assert(decision.historicalEvidence.repositoryLogicalTouchesWith25PctSafety === 112355, 'repository model')
assert(decision.historicalEvidence.repositoryModelIsRemoteD1Evidence === false, 'repository model not D1 evidence')

assert(trigger.status === 'consumed_pass_retired', 'one-shot trigger consumed')
assert(trigger.authorization.consumed === true, 'one-shot trigger consumed flag')
assert(trigger.authorization.newProductionProbeAuthorized === false, 'no new probe authority')
assert(trigger.authorization.rerunAuthorized === false, 'no rerun authority')
assert(decision.oneShotRetirement.triggerStatus === trigger.status, 'retirement status linkage')
assert(decision.oneShotRetirement.workflowPrOnly === true, 'retired workflow PR-only decision')
assert(decision.oneShotRetirement.productionPushTriggerPresent === false, 'no production push trigger decision')
assert(decision.oneShotRetirement.productionJobPresent === false, 'no production job decision')
assert(decision.oneShotRetirement.newProductionProbeAuthorized === false, 'no new probe decision')
assert(decision.oneShotRetirement.rerunAuthorized === false, 'no rerun decision')

for (const forbidden of [
  '\n  push:',
  'production' + '-reprobe:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'run-12a20-' + 'kick-history-category-reprobe.sh',
]) assert(!retiredWorkflow.includes(forbidden), `retired workflow exposes production surface: ${forbidden}`)

assert(generatorContract.schemaVersion === 'viewloom-12a15-kick-history-category-aggregate-generator-contract-v1', 'generator contract schema')
assert(generatorContract.status === 'dormant_package_candidate_no_production_execution', 'generator remains dormant')
assert(generatorContract.provider === 'kick', 'generator provider')
assert(generatorContract.generator.bucketMinutes === 5, 'bucket minutes')
assert(generatorContract.generator.retentionDays === 180, 'retention days')
assert(generatorContract.generator.categoryRowCapPerDay === 300, 'category row cap')
assert(generatorContract.generator.streamerCategoryRowCapPerDay === 1000, 'streamer-category row cap')
assert(generatorContract.generator.explicitStartDayRequired === true, 'explicit start day')
assert(generatorContract.generator.preActivationDaysEligible === false, 'no pre-activation days')
assert(generatorContract.generator.newCron === false, 'no new cron baseline')
assert(generatorContract.authorization.permanentGeneratorEnablementAuthorized === false, 'generator runtime still unauthorized')
assert(generatorContract.authorization.collectorIntegrationAuthorized === false, 'collector integration still unauthorized')
assert(generatorContract.authorization.historyApiCategoryAuthorized === false, 'History API still unauthorized')
assert(generatorContract.authorization.historyCategoryUiAuthorized === false, 'History UI still unauthorized')
assert(generatorContract.authorization.twitchRolloutAuthorized === false, 'Twitch still unauthorized')
assert(generatorContract.authorization.crossProviderBehaviorAuthorized === false, 'cross-provider still unauthorized')

assert(decision.dormantGeneratorBaseline.contract === generatorContractPath, 'generator contract linkage')
assert(decision.dormantGeneratorBaseline.status === generatorContract.status, 'generator status linkage')
assert(decision.dormantGeneratorBaseline.bucketMinutes === 5, 'decision bucket')
assert(decision.dormantGeneratorBaseline.retentionDays === 180, 'decision retention')
assert(decision.dormantGeneratorBaseline.categoryRowCapPerDay === 300, 'decision category cap')
assert(decision.dormantGeneratorBaseline.streamerCategoryRowCapPerDay === 1000, 'decision streamer cap')
assert(decision.dormantGeneratorBaseline.explicitStartDayRequired === true, 'decision start-day boundary')
assert(decision.dormantGeneratorBaseline.preActivationDaysEligible === false, 'decision no preactivation')
assert(decision.dormantGeneratorBaseline.newCron === false, 'decision no new cron')

assert(!kickEntry.includes('maybeGenerateKickHistoryCategoryAggregates'), 'current collector must remain unwired')
assert(!kickConfig.includes('HISTORY_CATEGORY'), 'current Kick runtime config must remain absent')
assert(kickConfig.includes('crons = ["*/5 * * * *"]'), 'existing Kick cadence remains unchanged')

const next = decision.authorizedNextWork
assert(next.createExactlyOneDormantPermanentIntegrationPackage === true, 'one dormant package authorized')
assert(next.packageMustRemainRepositoryOnly === true, 'package must remain repository-only')
assert(next.packageMergeChangesProductionRuntime === false, 'package merge cannot change production runtime')
assert(next.packageMayChangeCollectorEntry === false, 'package cannot change collector entry')
assert(next.packageMayChangeKickWranglerRuntimeConfig === false, 'package cannot change Kick runtime config')
assert(next.packageMayAddNewCron === false, 'package cannot add cron')
assert(next.packageMayBackfill === false, 'package cannot backfill')
assert(next.packageMayChangeRawRetention === false, 'package cannot change raw retention')
assert(next.providerKickOnly === true, 'Kick only')
assert(next.bucketMinutes === 5, 'five-minute buckets')
assert(next.retentionDays === 180, '180-day retention')
assert(next.categoryRowCapPerDay === 300, 'category row cap retained')
assert(next.streamerCategoryRowCapPerDay === 1000, 'streamer category row cap retained')
assert(next.explicitForwardOnlyStartDayRequired === true, 'forward-only start day')
assert(next.preActivationDaysEligible === false, 'no preactivation backfill')
assert(next.reuseExistingMaintenanceWindow === true, 'reuse maintenance window')
assert(next.failClosedCoverageAndReplacementStatesRequired === true, 'fail-close retained')
assert(next.dedicatedStaticAndDeterministicCiRequired === true, 'dedicated CI required')
assert(next.separateRuntimeEnablementDecisionRequired === true, 'separate runtime enablement decision')
assert(next.separateProductionDeploymentGateRequired === true, 'separate production deployment gate')
assert(Object.values(decision.notAuthorized).every((value) => value === true), 'all not-authorized boundaries remain true')

assert(decision.acceptance.decisionPrMustBeRepositoryOnly === true, 'decision PR repository-only')
assert(decision.acceptance.decisionPrMustChangeExactlyThreeDecisionFiles === true, 'exact three-file decision scope')
assert(decision.acceptance.decisionPrMustNotAddProductionCapableWorkflow === true, 'no production-capable workflow')
assert(decision.acceptance.decisionPrMustNotChangeCollectorOrWranglerRuntime === true, 'no runtime change')

assert(decisionWorkflow.includes('name: Analytics 12A27 Kick History Permanent Generator Decision'), 'decision workflow name')
assert(decisionWorkflow.includes('pull_request:'), 'decision workflow PR-only')
assert(decisionWorkflow.includes('scripts/verify-12a27-kick-history-category-permanent-generator-decision.mjs'), 'decision verifier wired')
for (const forbidden of [
  '\n  push:',
  'workflow_dispatch:',
  'schedule:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'wrangler@4 deploy',
  'actions/upload-artifact',
]) assert(!decisionWorkflow.includes(forbidden), `decision workflow must remain repository-only: ${forbidden}`)

console.log(JSON.stringify({
  phase: decision.phase,
  decision: decision.decision,
  sourceMainSha: decision.sourceMainSha,
  latestProductionRowsRead: accepted.rowsRead,
  rowsReadMaximum: accepted.rowsReadMaximum,
  authorizeDormantIntegrationPackageOnly: next.createExactlyOneDormantPermanentIntegrationPackage,
  currentCollectorRuntimeChanged: false,
  productionEnablementAuthorized: false,
  separateRuntimeEnablementDecisionRequired: next.separateRuntimeEnablementDecisionRequired,
  separateProductionDeploymentGateRequired: next.separateProductionDeploymentGateRequired
}, null, 2))
