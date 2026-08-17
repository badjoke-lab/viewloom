import fs from 'node:fs'

const contract = JSON.parse(fs.readFileSync('docs/audits/12a34-kick-history-permanent-generator-enablement-candidate.json', 'utf8'))
const decision = JSON.parse(fs.readFileSync('docs/audits/12a33-kick-history-permanent-generator-enablement-decision.json', 'utf8'))
const acceptance = JSON.parse(fs.readFileSync('docs/audits/12a32-kick-history-disabled-runtime-production-deployment-acceptance.json', 'utf8'))
const config = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')
const entry = fs.readFileSync('workers/collector-kick/src/entry.ts', 'utf8')

function expect(value, message) {
  if (!value) throw new Error(message)
}

expect(contract.phase === '12A-34', 'phase')
expect(contract.status === 'draft_fail_closed_candidate_not_authorized_for_merge', 'status')
expect(contract.provider === 'kick', 'provider')
expect(contract.trackingIssue === 908, 'issue')
expect(contract.decisionIssue === 906 && contract.decisionPr === 907, 'decision authority')
expect(contract.decisionHeadSha === 'b1f65977d034f1f0a05ed41b883f33010f57def1', 'decision head')
expect(contract.decisionMergeSha === '33d83a0f7eacfa1ef6c37010d6e0a6923d239a49', 'decision merge')
expect(decision.status === 'go_prepare_enablement_candidate_only', '12A33 status')
expect(decision.authorizedNow.prepareOneEnablementCandidate === true, '12A33 candidate authority')
expect(decision.authorizedNow.productionConfigMutation === false, '12A33 production config boundary')
expect(decision.authorizedNow.productionDeploy === false, '12A33 deploy boundary')
expect(decision.authorizedNow.permanentGeneratorEnable === false, '12A33 generator boundary')

const candidate = contract.candidateConfig
expect(candidate.path === 'workers/collector-kick/wrangler.category-permanent.toml', 'candidate config path')
expect(candidate.historyCategoryGenerationEnabled === 'false', 'prepared enable value must be false')
expect(candidate.historyCategoryStartDayPresent === false, 'startDay must remain absent')
expect(candidate.failClosed === true, 'candidate must fail closed')
expect(candidate.productionGenerationWouldStartIfMergedAsPrepared === false, 'prepared candidate must not start generation')

expect(config.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'intraday remains true')
expect(config.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'category capture remains true')
expect(config.includes('HISTORY_CATEGORY_GENERATION_ENABLED = "false"'), 'History generation flag must be false')
expect(!config.includes('HISTORY_CATEGORY_START_DAY'), 'History startDay must be absent')
expect(config.includes('crons = ["*/5 * * * *"]'), 'cron unchanged')
expect(entry.includes("env.HISTORY_CATEGORY_GENERATION_ENABLED === 'true'"), 'strict runtime true check')
expect(entry.includes('startDay: env.HISTORY_CATEGORY_START_DAY'), 'runtime startDay wiring')

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

const transform = contract.laterExecutionTransformation
expect(transform.required === true, 'later transformation required')
expect(transform.pinStartDayToExecutionUtcCalendarDay === true, 'startDay pin rule')
expect(transform.setHistoryCategoryGenerationEnabledToTrue === true, 'later true transformation')
expect(transform.rerunCandidateValidationAfterTransformation === true, 'later validation')
expect(transform.exactTransformedHeadMustBeFrozenBeforeMerge === true, 'freeze transformed head')

const deploy = contract.deploymentBoundary
expect(deploy.prMustRemainDraft === true, 'Draft required')
expect(deploy.prValidationMayRunCollectorDeployWorkflow === true, 'generic deploy validation allowed')
expect(deploy.pullRequestPlannerMustDeployKick === false, 'PR Kick deploy false')
expect(deploy.pullRequestPlannerMustDeployTwitch === false, 'PR Twitch deploy false')
expect(deploy.candidateMergeAuthorized === false, 'candidate merge unauthorized')
expect(deploy.productionDeployAuthorized === false, 'production deploy unauthorized')
expect(deploy.productionGeneratorEnableAuthorized === false, 'production generator enable unauthorized')

for (const [key, value] of Object.entries(contract.forbiddenChanges)) {
  expect(value === false, `forbidden change must remain false: ${key}`)
}

expect(contract.acceptedEvidence.costRun === 31987877725, 'cost run')
expect(contract.acceptedEvidence.rowsRead === 16117, 'rows_read')
expect(contract.acceptedEvidence.rowsReadMaximum === 250000, 'rows_read max evidence')
expect(contract.acceptedEvidence.disabledRuntimeDeploymentRun === 32029471351, 'deployment run')
expect(contract.acceptedEvidence.disabledRuntimeAcceptanceRun === 32030345735, 'acceptance run')
expect(contract.acceptedEvidence.disabledRuntimeAcceptanceMainSha === 'cc3a68409458462b5e3d8afbe721f6d21354f7f2', 'acceptance main')
expect(acceptance.acceptance.deploymentPass === true, 'accepted deployment pass')
expect(acceptance.acceptance.generatorStillDisabled === true, 'accepted disabled generator')

console.log('12A-34 fail-closed Kick History generator enablement candidate verification passed.')
console.log('- prepared History generation value: false')
console.log('- production startDay present: false')
console.log('- candidate merge authorized: false')
