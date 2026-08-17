import fs from 'node:fs'

const contract = JSON.parse(fs.readFileSync('docs/audits/12a35-kick-history-permanent-generator-production-enable-execution-contract.json', 'utf8'))
const decision = JSON.parse(fs.readFileSync('docs/audits/12a33-kick-history-permanent-generator-enablement-decision.json', 'utf8'))
const acceptance = JSON.parse(fs.readFileSync('docs/audits/12a32-kick-history-disabled-runtime-production-deployment-acceptance.json', 'utf8'))
const costPass = JSON.parse(fs.readFileSync('docs/audits/12a26-kick-history-category-reprobe-production-pass.json', 'utf8'))
const activeConfig = fs.readFileSync('workers/collector-kick/wrangler.category-permanent.toml', 'utf8')

function expect(value, message) {
  if (!value) throw new Error(message)
}

expect(contract.phase === '12A-35', 'phase')
expect(contract.status === 'dormant_execution_contract_not_armed', 'status')
expect(contract.provider === 'kick', 'provider')
expect(contract.trackingIssue === 910, 'tracking issue')

const prepared = contract.preparedCandidate
expect(prepared.pr === 909, 'prepared PR')
expect(prepared.headSha === 'af48cd079e859bff05671dfcfc6102311f26932c', 'prepared head')
expect(prepared.stateRequired === 'open_draft_unmerged', 'prepared state')
expect(prepared.changedFiles === 4, 'prepared file count')
expect(prepared.contractPhase === '12A-34', 'prepared contract phase')
expect(prepared.preparedHistoryCategoryGenerationEnabled === 'false', 'prepared History flag')
expect(prepared.preparedHistoryCategoryStartDayPresent === false, 'prepared startDay absent')
expect(prepared.dedicatedValidationRun === 32031563867, '12A34 run')
expect(prepared.genericDeployValidationRun === 32031563625, 'generic deploy validation run')
expect(prepared.pullRequestDeployKick === false && prepared.pullRequestDeployTwitch === false, 'PR deploy no-op')

const prereq = contract.acceptedPrerequisites
expect(prereq.costRun === 31987877725, 'cost run')
expect(prereq.rowsRead === 16117 && prereq.rowsReadMaximum === 250000 && prereq.costResult === 'PASS', 'cost PASS')
expect(prereq.disabledRuntimeDeploymentRun === 32029471351, 'disabled runtime deployment run')
expect(prereq.disabledRuntimeAcceptanceRun === 32030345735, 'disabled runtime acceptance run')
expect(prereq.disabledRuntimeAcceptanceMainSha === 'cc3a68409458462b5e3d8afbe721f6d21354f7f2', 'disabled runtime acceptance main')
expect(prereq.enablementDecisionPr === 907, 'enablement decision PR')
expect(prereq.enablementDecisionHeadSha === 'b1f65977d034f1f0a05ed41b883f33010f57def1', 'enablement decision head')
expect(prereq.enablementDecisionMainSha === '33d83a0f7eacfa1ef6c37010d6e0a6923d239a49', 'enablement decision main')

expect(costPass.performanceDetermination === 'PASS', 'canonical cost PASS')
expect(costPass.result.cost.rowsRead === 16117, 'canonical rows_read')
expect(costPass.thresholds.rowsReadMaximum === 250000, 'canonical rows_read hard max')
expect(acceptance.acceptance.deploymentPass === true, 'disabled runtime deployment accepted')
expect(acceptance.acceptance.generatorStillDisabled === true, 'disabled runtime generator state')
expect(decision.status === 'go_prepare_enablement_candidate_only', '12A33 decision')
expect(decision.authorizedNow.permanentGeneratorEnable === false, '12A33 did not authorize production enablement')

const future = contract.futureExecution
expect(future.explicitProductionEnableInstructionRequired === true, 'explicit execution instruction required')
expect(future.executionUtcCalendarDay === null, 'execution day must not be preselected')
expect(future.transformedCandidateHeadSha === null, 'transformed head must not exist yet')
expect(future.transformationPerformed === false, 'transformation must not be performed')
expect(future.readyTransitionPerformed === false, 'Ready transition must not be performed')
expect(future.mergePerformed === false, 'merge must not be performed')
expect(future.productionDeployPerformed === false, 'production deploy must not be performed')
expect(future.generatorEnablePerformed === false, 'generator enable must not be performed')

const transform = contract.atomicTransformation
expect(transform.workingPr === 909, 'working PR')
expect(transform.mustRemainDraftDuringTransformationValidation === true, 'Draft validation')
expect(transform.exactChangedFilesMustRemain === 4, 'exact transformed scope')
expect(transform.setHistoryCategoryGenerationEnabledFrom === 'false', 'transform from false')
expect(transform.setHistoryCategoryGenerationEnabledTo === 'true', 'transform to true')
expect(transform.addHistoryCategoryStartDay === true, 'add startDay')
expect(transform.startDaySource === 'utc_calendar_day_at_actual_authorized_execution_time', 'startDay source')
expect(transform.reusePreselectedOrStaleStartDay === false, 'no stale startDay')
expect(transform.transformExisting12A34ContractVerifierAndPrOnlyWorkflow === true, 'transform candidate guard files')
expect(transform.freezeExactTransformedHeadBeforeReady === true, 'freeze transformed head')

const validation = contract.requiredPreMergeValidation
expect(validation.strictRuntimeTrueCheck === true, 'strict runtime true check')
expect(validation.exactStartDayForwarding === true, 'startDay forwarding')
expect(validation.costPassRevalidated === true, 'cost revalidation')
expect(validation.rowsReadMaximum === 250000, 'rows_read max')
expect(validation.generatorSemanticsAndFixtures === true, 'generator fixtures')
expect(validation.collectorChecks === true, 'collector checks')
expect(validation.wranglerDryRunOnly === true, 'dry-run only')
expect(validation.genericPullRequestDeployPlannerNoOp === true, 'PR deploy planner no-op')
expect(validation.allApplicableCiGreen === true, 'all CI green')

const prod = contract.requiredProductionExecution
expect(prod.mergeOnlyFrozenTransformedHead === true, 'exact merge')
expect(prod.providerSelection === 'kick_only', 'Kick only deploy')
expect(prod.deployKickRequired === 'success', 'Kick deploy success')
expect(prod.deployTwitchRequired === 'skipped', 'Twitch skipped')
expect(prod.remoteSchemaRequired === 'success', 'remote schema success')
expect(prod.productionHealthReadOnlyCheck === true && prod.productionStatusReadOnlyCheck === true, 'read-only production checks')
expect(prod.firstBoundedHistoryGenerationEvidenceRequired === true, 'first generation evidence')
expect(prod.preActivationRowsAllowed === false, 'no pre-activation rows')
expect(prod.acceptanceRequiredBeforeHistoryApiUi === true, 'acceptance before API/UI')

for (const [key, value] of Object.entries(contract.failureHandling)) {
  expect(value === true, `failure handling must be true: ${key}`)
}
for (const [key, value] of Object.entries(contract.stillUnauthorized)) {
  expect(value === true, `still unauthorized must be true: ${key}`)
}

expect(activeConfig.includes('INTRADAY_GENERATION_ENABLED = "true"'), 'active intraday config')
expect(activeConfig.includes('CATEGORY_CAPTURE_ENABLED = "true"'), 'active category config')
expect(!activeConfig.includes('HISTORY_CATEGORY_GENERATION_ENABLED'), 'main must not contain prepared History flag yet')
expect(!activeConfig.includes('HISTORY_CATEGORY_START_DAY'), 'main must not contain History startDay')
expect(activeConfig.includes('crons = ["*/5 * * * *"]'), 'active cron unchanged')

console.log('12A-35 dormant Kick History production-enable execution contract verification passed.')
console.log('- prepared candidate PR: #909')
console.log('- prepared candidate head: af48cd079e859bff05671dfcfc6102311f26932c')
console.log('- execution UTC day preselected: no')
console.log('- production generator enablement performed: no')
