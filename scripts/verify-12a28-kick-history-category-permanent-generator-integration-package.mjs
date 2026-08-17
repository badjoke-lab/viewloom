#!/usr/bin/env node
import fs from 'node:fs'

const contractPath = 'docs/audits/12a28-kick-history-category-permanent-generator-integration-package.json'
const decisionPath = 'docs/audits/12a27-kick-history-category-permanent-generator-decision.json'
const passPath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'
const generatorContractPath = 'docs/audits/12a15-kick-history-category-aggregate-generator-contract.json'
const integrationPath = 'workers/dormant/history-category-aggregate-integration.ts'
const collectorEntryPath = 'workers/collector-kick/src/entry.ts'
const kickWranglerPath = 'workers/collector-kick/wrangler.toml'
const deployWorkflowPath = '.github/workflows/deploy-collector-workers.yml'
const workflowPath = '.github/workflows/analytics-12a28-kick-history-category-permanent-generator-integration-package.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const contract = json(contractPath)
const decision = json(decisionPath)
const pass = json(passPath)
const generatorContract = json(generatorContractPath)
const integration = read(integrationPath)
const collectorEntry = read(collectorEntryPath)
const kickWrangler = read(kickWranglerPath)
const deployWorkflow = read(deployWorkflowPath)
const workflow = read(workflowPath)

assert(contract.schemaVersion === 'viewloom-12a28-kick-history-category-permanent-generator-integration-package-v1', 'contract schema')
assert(contract.status === 'dormant_repository_only_no_runtime_wiring', 'contract status')
assert(contract.phase === '12A-28', 'phase')
assert(contract.provider === 'kick', 'provider')
assert(contract.trackingIssue === 893, 'tracking issue')
assert(contract.decisionIssue === 891, 'decision issue')
assert(contract.decisionPr === 892, 'decision PR')
assert(contract.decisionHeadSha === '3071a037136d6822087f9614657b1903b93ffe64', 'decision head')
assert(contract.decisionMergeMainSha === 'af544417429321b3674330fcdd17bc3e5db1ddfa', 'decision merge main')

assert(decision.schemaVersion === 'viewloom-12a27-kick-history-category-permanent-generator-decision-v1', 'decision schema')
assert(decision.status === 'repository_only_decision_no_runtime_enablement', 'decision status')
assert(decision.trackingIssue === 891, 'decision tracking issue')
assert(decision.decision === 'yes_authorize_exactly_one_dormant_permanent_generator_integration_package_only', 'package not authorized by decision')
assert(decision.authorizedNextWork.createExactlyOneDormantPermanentIntegrationPackage === true, 'one dormant package authority missing')
assert(decision.authorizedNextWork.packageMustRemainRepositoryOnly === true, 'package repository-only boundary')
assert(decision.authorizedNextWork.packageMergeChangesProductionRuntime === false, 'package merge runtime boundary')
assert(decision.authorizedNextWork.packageMayChangeCollectorEntry === false, 'collector entry change forbidden')
assert(decision.authorizedNextWork.packageMayChangeKickWranglerRuntimeConfig === false, 'Kick wrangler change forbidden')
assert(decision.authorizedNextWork.packageMayAddNewCron === false, 'new cron forbidden')
assert(decision.authorizedNextWork.packageMayBackfill === false, 'backfill forbidden')
assert(decision.authorizedNextWork.packageMayChangeRawRetention === false, 'raw retention change forbidden')
assert(decision.authorizedNextWork.separateRuntimeEnablementDecisionRequired === true, 'runtime decision gate required')
assert(decision.authorizedNextWork.separateProductionDeploymentGateRequired === true, 'deployment gate required')

const evidence = contract.acceptedProductionEvidence
assert(evidence.audit === passPath, 'PASS audit path')
assert(evidence.productionPr === 885, 'production PR')
assert(evidence.productionHeadSha === '33819c2ceff36c819d727d0399f85bbd789ba920', 'production head')
assert(evidence.workflowRun === 31987877725, 'production run')
assert(evidence.result === 'PASS', 'production result')
assert(evidence.rowsRead === 16117 && evidence.rowsRead <= evidence.rowsReadMaximum, 'rows-read PASS')
assert(evidence.rowsReadMaximum === 250000, 'rows-read maximum')
assert(evidence.cleanupExitCode === 0, 'cleanup exit')
assert(evidence.postCleanupAggregateRows === 0, 'post-cleanup aggregate rows')
assert(evidence.postCleanupProviderLeakageRows === 0, 'post-cleanup provider leakage')
assert(evidence.temporaryWorkerDeleted === true, 'temporary Worker deleted')
assert(evidence.postDeleteHttpStatus === 404, 'final Worker 404')

assert(pass.schemaVersion === 'viewloom-12a26-kick-history-category-reprobe-production-pass-v1', 'PASS schema')
assert(pass.status === 'production_pass_cleanup_safe_authority_retired', 'PASS status')
assert(pass.performanceDetermination === 'PASS', 'PASS determination')
assert(pass.production.run === evidence.workflowRun, 'PASS run linkage')
assert(pass.production.headSha === evidence.productionHeadSha, 'PASS head linkage')
assert(pass.result.cost.rowsRead === evidence.rowsRead, 'PASS rows-read linkage')
assert(pass.thresholds.rowsReadMaximum === evidence.rowsReadMaximum, 'PASS rows-read threshold linkage')
assert(pass.result.cleanupExitCode === 0, 'PASS cleanup linkage')
assert(pass.postCleanup.aggregateRows === 0, 'PASS aggregate cleanup linkage')
assert(pass.postCleanup.providerLeakageRows === 0, 'PASS leakage cleanup linkage')
assert(pass.temporaryWorkerDeleted === true && pass.postDeleteHttpStatus === 404, 'PASS Worker retirement linkage')

assert(generatorContract.schemaVersion === 'viewloom-12a15-kick-history-category-aggregate-generator-contract-v1', 'generator contract schema')
assert(generatorContract.status === 'dormant_package_candidate_no_production_execution', 'generator baseline status')
assert(generatorContract.provider === 'kick', 'generator provider')
assert(generatorContract.generator.bucketMinutes === 5, 'generator bucket')
assert(generatorContract.generator.retentionDays === 180, 'generator retention')
assert(generatorContract.generator.categoryRowCapPerDay === 300, 'generator category cap')
assert(generatorContract.generator.streamerCategoryRowCapPerDay === 1000, 'generator streamer-category cap')
assert(generatorContract.generator.explicitStartDayRequired === true, 'generator startDay boundary')
assert(generatorContract.generator.preActivationDaysEligible === false, 'generator preactivation boundary')
assert(generatorContract.generator.newCron === false, 'generator new-cron boundary')
assert(generatorContract.authorization.permanentGeneratorEnablementAuthorized === false, 'generator runtime still unauthorized')
assert(generatorContract.authorization.collectorIntegrationAuthorized === false, 'collector integration still unauthorized')
assert(generatorContract.authorization.historyApiCategoryAuthorized === false, 'History API still unauthorized')
assert(generatorContract.authorization.historyCategoryUiAuthorized === false, 'History UI still unauthorized')
assert(generatorContract.authorization.twitchRolloutAuthorized === false, 'Twitch still unauthorized')
assert(generatorContract.authorization.crossProviderBehaviorAuthorized === false, 'cross-provider still unauthorized')

const pkg = contract.integration
assert(pkg.module === integrationPath, 'integration module path')
assert(pkg.version === 'kick-history-category-aggregate-integration-v1', 'integration version')
assert(pkg.delegatesTo === 'workers/shared/history-category-aggregate.ts', 'generator delegation')
assert(pkg.provider === 'kick', 'integration provider')
assert(pkg.bucketMinutes === 5, 'integration bucket')
assert(pkg.retentionDays === 180, 'integration retention')
assert(pkg.categoryRowCapPerDay === 300, 'integration category cap')
assert(pkg.streamerCategoryRowCapPerDay === 1000, 'integration streamer-category cap')
assert(pkg.explicitStartDayRequired === true, 'integration startDay')
assert(pkg.preActivationDaysEligible === false, 'integration preactivation')
assert(pkg.newCron === false, 'integration no new cron')
assert(pkg.usesExistingMaintenanceWindow === true, 'existing maintenance window')
assert(pkg.allowsCapOverride === false, 'cap override forbidden')
assert(pkg.allowsBucketOverride === false, 'bucket override forbidden')
assert(pkg.parsesEnvironment === false, 'environment parsing forbidden')
assert(pkg.containsScheduledHandler === false, 'scheduled handler forbidden')
assert(pkg.containsFetchHandler === false, 'fetch handler forbidden')
assert(pkg.containsDirectSqlExecution === false, 'direct SQL forbidden')
assert(pkg.containsDeploymentPath === false, 'deploy path forbidden')
assert(pkg.currentRuntimeImportIncluded === false, 'runtime import forbidden')
assert(pkg.collectorDeployWorkflowPathMatchedOnMainPush === false, 'adapter must avoid collector deploy path')
assert(pkg.packageSpecificTypecheckRequired === true, 'adapter-specific typecheck required')

for (const fragment of [
  "HISTORY_CATEGORY_BUCKET_MINUTES",
  "HISTORY_CATEGORY_RETENTION_DAYS",
  "HISTORY_CATEGORY_ROW_CAP",
  "HISTORY_CATEGORY_STREAMER_ROW_CAP",
  "maybeGenerateKickHistoryCategoryAggregates",
  "KICK_HISTORY_CATEGORY_INTEGRATION_VERSION",
  "'kick-history-category-aggregate-integration-v1'",
  "provider: 'kick'",
  "requiresExplicitStartDay: true",
  "preActivationDaysEligible: false",
  "newCron: false",
  "currentRuntimeWiringIncluded: false",
  "buildKickHistoryCategoryPermanentGenerationConfig",
  "maybeRunKickHistoryCategoryPermanentIntegration",
  "categoryRowCap: HISTORY_CATEGORY_ROW_CAP",
  "streamerCategoryRowCap: HISTORY_CATEGORY_STREAMER_ROW_CAP",
  "bucketMinutes: HISTORY_CATEGORY_BUCKET_MINUTES",
]) assert(integration.includes(fragment), `integration fragment missing: ${fragment}`)
assert(integration.includes("from '../shared/history-category-aggregate'"), 'dormant adapter must delegate to shared audited generator')

for (const forbidden of [
  'process.env',
  'env.',
  'scheduled' + '(',
  'async sched' + 'uled',
  'fetch' + '(',
  'async fet' + 'ch',
  '.prepare' + '(',
  'db.batch' + '(',
  'wrangler@4 ' + 'deploy',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
]) assert(!integration.includes(forbidden), `integration contains forbidden runtime surface: ${forbidden}`)

const runtime = contract.currentRuntimeBoundary
assert(runtime.collectorEntry === collectorEntryPath, 'collector entry path')
assert(runtime.collectorEntryMayChangeInPackage === false, 'collector entry change boundary')
assert(runtime.collectorImportsIntegration === false, 'collector import boundary')
assert(runtime.collectorCallsIntegration === false, 'collector call boundary')
assert(runtime.kickWrangler === kickWranglerPath, 'Kick wrangler path')
assert(runtime.kickWranglerMayChangeInPackage === false, 'Kick wrangler change boundary')
assert(runtime.historyCategoryRuntimeConfigPresent === false, 'History runtime config boundary')
assert(runtime.existingCron === '*/5 * * * *', 'existing cron contract')
assert(runtime.cronMayChangeInPackage === false, 'cron change boundary')
assert(runtime.packageMergeChangesProductionRuntime === false, 'package merge runtime boundary')
assert(runtime.packageMergeTriggersCollectorDeployWorkflow === false, 'package merge collector deploy boundary')

for (const fragment of [
  'history-category-aggregate-integration',
  'maybeRunKickHistoryCategoryPermanentIntegration',
  'maybeGenerateKickHistoryCategoryAggregates',
]) assert(!collectorEntry.includes(fragment), `current collector must remain unwired: ${fragment}`)
assert(!kickWrangler.includes('HISTORY_CATEGORY'), 'Kick wrangler History Category config must remain absent')
assert(kickWrangler.includes('crons = ["*/5 * * * *"]'), 'existing Kick cron must remain unchanged')

assert(deployWorkflow.includes("- 'workers/shared/**'"), 'collector deploy workflow shared trigger expected')
assert(deployWorkflow.includes("- 'workers/collector-twitch/**'"), 'collector deploy Twitch trigger expected')
assert(deployWorkflow.includes("- 'workers/collector-kick/**'"), 'collector deploy Kick trigger expected')
assert(!deployWorkflow.includes("workers/dormant/**"), 'dormant adapter path must not trigger collector deploy workflow')
assert(!deployWorkflow.includes(integrationPath), 'exact dormant adapter path must not trigger collector deploy workflow')

const semantics = contract.retainedGeneratorSemantics
assert(semantics.sourceContract === generatorContractPath, 'generator semantics linkage')
assert(semantics.topKStored === false, 'no Top-K storage')
assert(semantics.rankingDuringGeneration === false, 'no generation ranking')
assert(semantics.latestCategoryBackProjection === false, 'no latest-category backprojection')
assert(semantics.nameOnlyIdentity === false, 'no name-only identity')
assert(semantics.missingAsZero === false, 'no missing-as-zero')
assert(semantics.failClosedCoverageStates === true, 'fail-close coverage')
assert(semantics.failClosedReplacementState === true, 'fail-close replacement')
assert(semantics.retentionDays === 180, 'retained retention')

assert(contract.authorization.repositoryIntegrationPackageAuthorized === true, 'repository package authority')
assert(contract.authorization.packageMergeAuthorizedAfterCi === true, 'package merge after CI')
for (const [key, value] of Object.entries(contract.authorization)) {
  if (['repositoryIntegrationPackageAuthorized', 'packageMergeAuthorizedAfterCi'].includes(key)) continue
  assert(value === false, `${key} must remain false`)
}

const expectedFiles = [
  '.github/workflows/analytics-12a28-kick-history-category-permanent-generator-integration-package.yml',
  'docs/audits/12a28-kick-history-category-permanent-generator-integration-package.json',
  'scripts/verify-12a28-kick-history-category-permanent-generator-integration-package.mjs',
  'workers/dormant/history-category-aggregate-integration.ts',
]
assert(JSON.stringify(contract.acceptance.exactChangedFiles) === JSON.stringify(expectedFiles), 'exact package file contract')
assert(contract.acceptance.dedicatedVerifierRequired === true, 'dedicated verifier')
assert(contract.acceptance.packageSpecificTypecheckRequired === true, 'package-specific typecheck')
assert(contract.acceptance.existingGeneratorFixturesRequired === true, 'existing generator fixtures')
assert(contract.acceptance.collectorAndWranglerMustRemainUnchanged === true, 'collector/wrangler unchanged')
assert(contract.acceptance.collectorDeployWorkflowMustNotRunOnPackageMerge === true, 'collector deploy must not run on package merge')
assert(contract.acceptance.productionCapableWorkflowForbidden === true, 'production workflow forbidden')
assert(contract.acceptance.nextGate === 'open_separate_permanent_generator_runtime_enablement_decision_after_package_acceptance', 'next gate')

assert(workflow.includes('name: Analytics 12A28 Kick History Permanent Generator Integration Package'), 'workflow name')
assert(workflow.includes('pull_request:'), 'workflow PR-only event')
assert(workflow.includes('scripts/verify-12a28-kick-history-category-permanent-generator-integration-package.mjs'), 'package verifier wired')
assert(workflow.includes(integrationPath), 'dormant integration path must be in package workflow')
assert(workflow.includes('pnpm exec tsc'), 'package-specific TypeScript check must be wired')
for (const forbidden of [
  '\n  ' + 'push:',
  'workflow_' + 'dispatch:',
  'sched' + 'ule:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'wrangler@4 ' + 'deploy',
  'actions/' + 'upload-artifact',
]) assert(!workflow.includes(forbidden), `package workflow contains production-capable surface: ${forbidden}`)

console.log(JSON.stringify({
  phase: contract.phase,
  status: contract.status,
  provider: contract.provider,
  latestProductionRowsRead: evidence.rowsRead,
  rowsReadMaximum: evidence.rowsReadMaximum,
  integrationModule: pkg.module,
  collectorRuntimeWired: false,
  kickRuntimeConfigPresent: false,
  packageMergeChangesProductionRuntime: runtime.packageMergeChangesProductionRuntime,
  packageMergeTriggersCollectorDeployWorkflow: runtime.packageMergeTriggersCollectorDeployWorkflow,
  runtimeEnablementAuthorized: contract.authorization.permanentGeneratorRuntimeEnablementAuthorized,
  nextGate: contract.acceptance.nextGate,
}, null, 2))
