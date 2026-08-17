import fs from 'node:fs'

const contract = JSON.parse(fs.readFileSync('docs/audits/12a34-kick-history-permanent-generator-enablement-candidate.json', 'utf8'))
const decision = JSON.parse(fs.readFileSync('docs/audits/12a33-kick-history-permanent-generator-enablement-decision.json', 'utf8'))
const acceptance = JSON.parse(fs.readFileSync('docs/audits/12a32-kick-history-disabled-runtime-production-deployment-acceptance.json', 'utf8'))
const executionContract = JSON.parse(fs.readFileSync('docs/audits/12a35-kick-history-permanent-generator-production-enable-execution-contract.json', 'utf8'))
const config = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')

function expect(value, message) {
  if (!value) throw new Error(message)
}

expect(contract.schemaVersion === 'viewloom-12a34-kick-history-permanent-generator-enablement-execution-v1', 'schema')
expect(contract.phase === '12A-34', 'phase')
expect(contract.status === 'draft_execution_ready_candidate_validating', 'status')
expect(contract.provider === 'kick', 'provider')
expect(contract.trackingIssue === 912, 'execution issue')
expect(contract.preparationIssue === 908, 'preparation issue')
expect(contract.decisionIssue === 906 && contract.decisionPr === 907, 'decision authority')
expect(contract.decisionHeadSha === 'b1f65977d034f1f0a05ed41b883f33010f57def1', 'decision head')
expect(contract.decisionMergeSha === '33d83a0f7eacfa1ef6c37010d6e0a6923d239a49', 'decision merge')
expect(contract.executionContractIssue === 910 && contract.executionContractPr === 911, 'execution contract authority')
expect(contract.executionContractMergeSha === 'a5aced34f1145647f26ff979afe1601fd59a9be8', 'execution contract merge')
expect(contract.candidatePr === 909, 'candidate PR')

expect(decision.status === 'go_prepare_enablement_candidate_only', '12A33 accepted decision')
expect(executionContract.status === 'dormant_execution_contract_not_armed', '12A35 accepted dormant contract')
expect(executionContract.atomicTransformation.workingPr === 909, '12A35 working PR')
expect(executionContract.atomicTransformation.exactChangedFilesMustRemain === 4, '12A35 exact scope')
expect(executionContract.atomicTransformation.setHistoryCategoryGenerationEnabledFrom === 'false', '12A35 from false')
expect(executionContract.atomicTransformation.setHistoryCategoryGenerationEnabledTo === 'true', '12A35 to true')
expect(executionContract.atomicTransformation.addHistoryCategoryStartDay === true, '12A35 add startDay')
expect(executionContract.atomicTransformation.startDaySource === 'utc_calendar_day_at_actual_authorized_execution_time', '12A35 startDay source')
expect(executionContract.atomicTransformation.freezeExactTransformedHeadBeforeReady === true, '12A35 freeze rule')

const execution = contract.execution
expect(execution.utcStartDay === '2026-08-17', 'execution UTC startDay')
expect(execution.historyCategoryGenerationEnabled === 'true', 'execution enable value')
expect(execution.historyCategoryStartDayPresent === true, 'execution startDay present')
expect(execution.startDayPinnedToExecutionUtcCalendarDay === true, 'execution day pin')
expect(execution.preActivationDaysIneligible === true, 'execution pre-activation boundary')

const candidate = contract.candidateConfig
expect(candidate.path === 'workers/collector-kick/wrangler.category-permanent.toml', 'candidate config path')
expect(candidate.historyCategoryGenerationEnabled === 'true', 'candidate enable value')
expect(candidate.historyCategoryStartDay === '2026-08-17', 'candidate startDay')
expect(candidate.historyCategoryStartDayPresent === true, 'candidate startDay present')
expect(candidate.productionGenerationWouldStartIfMerged === true, 'merged candidate must enable generation')

expect(config.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'intraday remains true')
expect(config.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'category capture remains true')
expect(config.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "true"'), 'History generation flag must be true')
expect(!config.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "false"'), 'History generation false must be absent')
expect(config.includes('HISTORY_CATEGORY_START_DAY = "2026-08-17"'), 'History startDay exact')
expect(config.includes('crons = ["*/5 * * * *"]'), 'cron unchanged')
expect((config.match(/HISTORY_CATEGORY_GENERATION_ENABLED/g) ?? []).length === 1, 'exactly one History enable value')
expect((config.match(/HISTORY_CATEGORY_START_DAY/g) ?? []).length === 1, 'exactly one History startDay')
expect(entry.includes("env.HISTORY_CATEGORY_GENERATION_ENABLED === 'true'"), 'strict runtime true check')
expect(entry.includes("const historyCategoryStartDay = env.HISTORY_CATEGORY_START_DAY?.trim() ?? ''"), 'runtime startDay normalization')
expect(entry.includes('startDay: historyCategoryStartDay'), 'runtime startDay forwarding')

const semantics = contract.fixedSemantics
expect(semantics.kickOnly === true, 'Kick only')
expect(semantics.bucketMinutes === 5, 'bucket')
expect(semantics.aggregateRetentionDays === 180, 'retention')
expect(semantics.categoryRowCapPerDay === 300, 'category cap')
expect(semantics.streamerCategoryRowCapPerDay === 1000, 'streamer-category cap')
expect(semantics.cron === '*/5 * * * *', 'cron contract')
expect(JSON.stringify(semantics.maintenanceWindowsUtc) === JSON.stringify(['00:20-00:24', '12:20-12:24']), 'maintenance windows')
expect(semantics.preActivationDaysIneligible === true, 'pre-activation boundary')
expect(semantics.rowsReadMaximum === 250000, 'rows_read max')

const boundary = contract.executionBoundary
expect(boundary.prMustRemainDraftWhileValidating === true, 'Draft during validation')
expect(boundary.exactFourFileScopeRequired === true, 'exact four-file scope')
expect(boundary.pullRequestPlannerMustDeployKick === false, 'PR Kick deploy false')
expect(boundary.pullRequestPlannerMustDeployTwitch === false, 'PR Twitch deploy false')
expect(boundary.exactTransformedHeadMustBeFrozenInIssue912BeforeReady === true, 'freeze before Ready')
expect(boundary.readyAllowedOnlyAfterAllApplicableCiGreen === true, 'Ready after green')
expect(boundary.mergeOnlyFrozenExactHead === true, 'merge frozen exact head')
expect(boundary.mainPushExpectedToDeployKick === true, 'main push Kick deploy')
expect(boundary.mainPushExpectedToDeployTwitch === false, 'main push Twitch skip')
expect(boundary.postDeployAcceptanceIssue === 913, 'acceptance issue')

for (const [key, value] of Object.entries(contract.forbiddenChanges)) {
  expect(value === false, `forbidden change must remain false: ${key}`)
}

expect(contract.acceptedEvidence.costRun === 31987877725, 'cost run')
expect(contract.acceptedEvidence.rowsRead === 16117, 'rows_read')
expect(contract.acceptedEvidence.rowsReadMaximum === 250000, 'rows_read max evidence')
expect(contract.acceptedEvidence.disabledRuntimeDeploymentRun === 32029471351, 'disabled deployment run')
expect(contract.acceptedEvidence.disabledRuntimeAcceptanceRun === 32030345735, 'disabled acceptance run')
expect(contract.acceptedEvidence.disabledRuntimeAcceptanceMainSha === 'cc3a68409458462b5e3d8afbe721f6d21354f7f2', 'disabled acceptance main')
expect(contract.acceptedEvidence.preparedCandidateRun === 32031563867, 'prepared candidate run')
expect(contract.acceptedEvidence.preparedDeployValidationRun === 32031563625, 'prepared deploy validation run')
expect(contract.acceptedEvidence.executionContractRun === 32031955100, 'execution contract run')
expect(acceptance.acceptance.deploymentPass === true, 'accepted disabled runtime deployment pass')
expect(acceptance.acceptance.generatorStillDisabled === true, 'accepted pre-execution disabled baseline')

console.log('12A-34 Kick History generator execution-ready candidate verification passed.')
console.log('- execution UTC startDay: 2026-08-17')
console.log('- History generation value: true')
console.log('- exact four-file scope required: true')
console.log('- freeze transformed head in #912 before Ready: true')
