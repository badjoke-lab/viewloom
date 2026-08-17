import fs from 'node:fs'

const decision = JSON.parse(fs.readFileSync('docs/audits/12a33-kick-history-permanent-generator-enablement-decision.json', 'utf8'))
const acceptance = JSON.parse(fs.readFileSync('docs/audits/12a32-kick-history-disabled-runtime-production-deployment-acceptance.json', 'utf8'))
const costPass = JSON.parse(fs.readFileSync('docs/audits/12a26-kick-history-category-reprobe-production-pass.json', 'utf8'))
const config = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function expect(value, message) {
  if (!value) throw new Error(message)
}

expect(decision.phase === '12A-33', 'phase')
expect(decision.status === 'go_prepare_enablement_candidate_only', 'status')
expect(decision.provider === 'kick', 'provider')
expect(decision.trackingIssue === 906, 'issue')
expect(decision.decision === 'GO', 'decision')

const now = decision.authorizedNow
expect(now.prepareOneEnablementCandidate === true, 'candidate preparation authority')
expect(now.productionConfigMutation === false, 'production config must remain unauthorized')
expect(now.productionDeploy === false, 'production deploy must remain unauthorized')
expect(now.permanentGeneratorEnable === false, 'generator enable must remain unauthorized')
expect(now.historyApiUiCutover === false, 'API/UI cutover')
expect(now.twitchRollout === false, 'Twitch rollout')

const prereq = decision.acceptedPrerequisites
expect(prereq.costRun === 31987877725, 'cost run')
expect(prereq.rowsRead === 16117 && prereq.rowsReadMaximum === 250000 && prereq.costResult === 'PASS', 'cost PASS')
expect(prereq.disabledRuntimeCandidatePr === 898, 'runtime PR')
expect(prereq.disabledRuntimeProductionMainSha === 'acdb274ee03887d3247fb9498acda85fabfebcd5', 'runtime production main')
expect(prereq.deploymentRun === 32029471351 && prereq.deploymentResult === 'success', 'deployment PASS')
expect(prereq.acceptancePr === 905, 'acceptance PR')
expect(prereq.acceptanceHeadSha === '409b77584980cdc1f1f522fbedea6ac52806cd04', 'acceptance head')
expect(prereq.acceptanceMainSha === 'cc3a68409458462b5e3d8afbe721f6d21354f7f2', 'acceptance main')
expect(prereq.acceptanceRun === 32030345735 && prereq.acceptanceJob === 95388719806, 'acceptance CI')
expect(prereq.liveHealthAccepted === true && prereq.liveStatusAccepted === true, 'live acceptance')
expect(prereq.generatorStillDisabled === true, 'generator disabled prerequisite')

expect(acceptance.status === 'production_deployment_pass_generator_still_disabled', '12A32 accepted deployment')
expect(acceptance.acceptance.deploymentPass === true, '12A32 deployment PASS')
expect(acceptance.acceptance.generatorStillDisabled === true, '12A32 generator disabled')
expect(acceptance.acceptance.generatorEnableAuthorizedByThisAcceptance === false, '12A32 did not authorize generator enable')
expect(costPass.performanceDetermination === 'PASS', '12A26 PASS')
expect(costPass.result.cost.rowsRead === 16117, '12A26 rows_read')
expect(costPass.thresholds.rowsReadMaximum === 250000, '12A26 hard max')

const current = decision.currentProductionConfig
expect(current.path === 'workers/collector-kick/wrangler.category-permanent.toml', 'config path')
expect(current.intradayGenerationEnabled === true && current.categoryCaptureEnabled === true, 'existing production flags')
expect(current.historyCategoryGenerationEnabledPresent === false, 'History enable must still be absent')
expect(current.historyCategoryStartDayPresent === false, 'History startDay must still be absent')
expect(current.cron === '*/5 * * * *', 'cron')
expect(config.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'intraday config')
expect(config.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'category capture config')
expect(config.includes('crons = ["*/5 * * * *"]'), 'active cron')
expect(!config.includes('HISTORY_CATEGORY_GENERATION_ENABLED'), 'History enable not yet committed')
expect(!config.includes('HISTORY_CATEGORY_START_DAY'), 'History startDay not yet committed')

const req = decision.candidateRequirements
expect(req.kickOnly === true, 'Kick only')
expect(req.historyCategoryGenerationEnabledValueAtExecution === 'true', 'future enable value')
expect(req.historyCategoryStartDayRule === 'pin_to_utc_calendar_day_of_later_authorized_production_enablement_execution', 'startDay rule')
expect(req.startDayPinnedByDecision === false, 'Decision must not pin stale startDay')
expect(req.preActivationDaysIneligible === true, 'pre-activation boundary')
expect(req.newCron === false && req.backfill === false && req.rawRetentionChange === false, 'storage/cadence boundary')
expect(req.historyApiUiCutover === false && req.twitchChange === false && req.crossProviderChange === false, 'product/provider boundary')
expect(req.rowsReadMaximum === 250000, 'rows_read max')
expect(req.categoryRowCapPerDay === 300 && req.streamerCategoryRowCapPerDay === 1000, 'row caps')
expect(req.bucketMinutes === 5 && req.aggregateRetentionDays === 180, 'bucket/retention')
expect(JSON.stringify(req.maintenanceWindowsUtc) === JSON.stringify(['00:20-00:24', '12:20-12:24']), 'maintenance windows')

const boundary = decision.executionBoundary
expect(boundary.decisionPrExecutesProduction === false, 'Decision production')
expect(boundary.candidatePreparationExecutesProduction === false, 'candidate prep production')
expect(boundary.candidateMergeAuthorizedByDecision === false, 'candidate merge authority')
expect(boundary.productionEnablementRequiresLaterIndependentExecutionGate === true, 'later execution gate')
expect(boundary.startDayMustBeFrozenImmediatelyBeforeThatExecution === true, 'startDay freeze timing')

console.log('12A-33 permanent Kick History generator enablement Decision verification passed.')
console.log('- decision: GO for candidate preparation only')
console.log('- production generator enabled now: false')
console.log('- future startDay pinned now: false')
