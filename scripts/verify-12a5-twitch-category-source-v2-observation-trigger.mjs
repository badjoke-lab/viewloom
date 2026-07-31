import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  failure: 'docs/audits/12a5-twitch-category-source-v2-observation-failure-evidence.json',
  recoveryContract: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-contract.json',
  recoveryAcceptance: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-acceptance.json',
  rerunTriggerContract: 'docs/audits/12a5-twitch-category-source-v2-observation-rerun-trigger-contract.json',
  dormantContract: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-contract.json',
  dormantAcceptance: 'docs/audits/12a5-twitch-category-source-v2-completeness-package-acceptance.json',
  workflow: '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  twitchPermanentConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickPermanentConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const trigger = json(files.trigger)
const failure = json(files.failure)
const recovery = json(files.recoveryContract)
const acceptance = json(files.recoveryAcceptance)
const rerunContract = json(files.rerunTriggerContract)
const dormantContract = json(files.dormantContract)
const dormantAcceptance = json(files.dormantAcceptance)
const workflow = read(files.workflow)

assert.equal(failure.status, 'observation_failed_before_candidate_deployment')
assert.equal(failure.execution.workflowRunId, 30608982443)
assert.equal(failure.execution.observeJobId, 91087362002)
assert.equal(failure.artifact.id, 8784691101)
assert.equal(failure.failure.candidateWorkerActivated, false)
assert.equal(failure.failure.snapshots, 0)
assert.equal(failure.rollback.attempted, true)
assert.equal(failure.rollback.success, true)
assert.equal(failure.decision.automaticRerunAuthorized, false)
assert.equal(failure.decision.semanticMappingAuthorized, false)
assert.equal(failure.decision.stabilityClockStartAuthorized, false)
assert.equal(failure.decision.finalModeAuthorized, false)
assert.equal(failure.decision.publicCategoryUiAuthorized, false)

assert.equal(recovery.status, 'accepted')
assert.equal(recovery.phase, '12A-5B-R2')
assert.equal(recovery.trackingIssue, 659)
assert.equal(recovery.provider, 'twitch')
assert.equal(recovery.packageIdentity.packagePr, 692)
assert.equal(recovery.packageIdentity.packageCandidateHeadSha, '7efa0b682d182fced55bc8f96c928daaef58ca24')
assert.equal(recovery.packageIdentity.packageMergeSha, '19e2d5b44a0088dce046b8e34f028efebf1d7d24')
assert.equal(recovery.packageIdentity.acceptancePr, 693)
assert.equal(recovery.packageIdentity.validationRunId, 30619716971)
assert.equal(recovery.packageIdentity.validationJobId, 91121126929)
assert.equal(recovery.packageIdentity.productionExecutionPerformedByPackagePr, false)
assert.equal(recovery.correction.removeObserveJobOutputDirEnvironment, true)
assert.equal(recovery.correction.wranglerConfigChanged, false)
assert.equal(recovery.correction.generatorChanged, false)
assert.equal(recovery.correction.candidateSourceChanged, false)
assert.equal(recovery.correction.canonicalRollbackConfigChanged, false)
assert.equal(recovery.rerunBoundary.acceptanceCompleted, true)
assert.equal(recovery.rerunBoundary.newExactOneFileTriggerRequired, true)
assert.equal(recovery.rerunBoundary.automaticRerunAuthorized, false)
assert.equal(recovery.rerunBoundary.startAtAllowed, false)
assert.equal(recovery.rerunBoundary.preStartSleepAllowed, false)
assert.equal(recovery.rerunBoundary.maximumObservationMinutes, 16)
assert.equal(recovery.rerunBoundary.canonicalRollbackRequired, true)

assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.acceptancePr, recovery.packageIdentity.acceptancePr)
assert.equal(acceptance.packagePr, recovery.packageIdentity.packagePr)
assert.equal(acceptance.packageMergeSha, recovery.packageIdentity.packageMergeSha)
assert.equal(acceptance.validation.workflowRunId, recovery.packageIdentity.validationRunId)
assert.equal(acceptance.validation.workflowJobId, recovery.packageIdentity.validationJobId)
assert.equal(acceptance.validation.conclusion, 'success')
assert.equal(acceptance.validation.productionObservationSkippedOnPullRequest, true)
assert.equal(acceptance.acceptedCorrection.observeJobOutputDirEnvironmentRemoved, true)
assert.equal(acceptance.acceptedBoundary.newExactOneFileTriggerRequired, true)
assert.equal(acceptance.acceptedBoundary.startAtAllowed, false)
assert.equal(acceptance.acceptedBoundary.preStartSleepAllowed, false)
assert.equal(acceptance.acceptedBoundary.canonicalRollbackRequired, true)
for (const key of [
  'automaticRerunAuthorized',
  'semanticMappingAuthorized',
  'stabilityClockStartAuthorized',
  'finalModeAuthorized',
  'publicCategoryUiAuthorized',
  'kickChanged',
  'cadenceChanged',
  'retentionChanged',
  'backfillAuthorized',
]) assert.equal(acceptance.acceptedBoundary[key], false, `${key}: must remain false`)

assert.equal(rerunContract.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-rerun-trigger-contract-v1')
assert.equal(rerunContract.status, 'accepted')
assert.equal(rerunContract.phase, recovery.phase)
assert.equal(rerunContract.trackingIssue, recovery.trackingIssue)
assert.equal(rerunContract.provider, recovery.provider)
assert.equal(rerunContract.sourceFailure.workflowRunId, failure.execution.workflowRunId)
assert.equal(rerunContract.sourceFailure.observeJobId, failure.execution.observeJobId)
assert.equal(rerunContract.sourceFailure.artifactId, failure.artifact.id)
assert.equal(rerunContract.sourceFailure.candidateActivated, false)
assert.equal(rerunContract.sourceFailure.canonicalRollbackSucceeded, true)
assert.equal(rerunContract.correctedPackageIdentity.packagePr, recovery.packageIdentity.packagePr)
assert.equal(rerunContract.correctedPackageIdentity.packageCandidateHeadSha, recovery.packageIdentity.packageCandidateHeadSha)
assert.equal(rerunContract.correctedPackageIdentity.packageMergeSha, recovery.packageIdentity.packageMergeSha)
assert.equal(rerunContract.correctedPackageIdentity.acceptancePr, recovery.packageIdentity.acceptancePr)
assert.equal(rerunContract.correctedPackageIdentity.acceptanceMergeSha, 'e2091765dc4d6350da1ca5d8484e559d3bba1cd6')
assert.equal(rerunContract.correctedPackageIdentity.validationRunId, recovery.packageIdentity.validationRunId)
assert.equal(rerunContract.correctedPackageIdentity.validationJobId, recovery.packageIdentity.validationJobId)
assert.equal(rerunContract.trigger.exactOneFilePrRequired, true)
assert.equal(rerunContract.trigger.executeImmediately, true)
assert.equal(rerunContract.trigger.startAtAllowed, false)
assert.equal(rerunContract.trigger.packagePr, recovery.packageIdentity.packagePr)
assert.equal(rerunContract.trigger.packageMergeSha, recovery.packageIdentity.packageMergeSha)
assert.equal(rerunContract.trigger.acceptancePr, recovery.packageIdentity.acceptancePr)
assert.equal(rerunContract.executionBoundary.provider, 'twitch')
assert.equal(rerunContract.executionBoundary.maximumObservationMinutes, 16)
assert.equal(rerunContract.executionBoundary.jobTimeoutMinutes, 50)
assert.equal(rerunContract.executionBoundary.canonicalRollbackRequired, true)
assert.deepEqual(rerunContract.executionBoundary.directD1Statements, ['SELECT', 'WITH'])
for (const key of [
  'newCronAllowed',
  'kickChangeAllowed',
  'retentionChangeAllowed',
  'backfillAllowed',
  'semanticMappingAllowed',
  'stabilityClockStartAllowed',
  'finalModeAllowed',
  'publicCategoryUiAllowed',
]) assert.equal(rerunContract.executionBoundary[key], false, `${key}: must remain false`)

assert.equal(dormantContract.status, 'accepted')
assert.equal(dormantContract.packageIdentity.packagePr, 682)
assert.equal(dormantContract.packageIdentity.acceptancePr, 684)
assert.equal(dormantAcceptance.status, 'accepted')
assert.equal(dormantAcceptance.acceptedCapabilities.productionActivationAccepted, false)

const expectedKeys = [
  'acceptancePr',
  'confirmation',
  'executeImmediately',
  'mode',
  'oneTime',
  'packageMergeSha',
  'packagePr',
  'phase',
  'provider',
  'schemaVersion',
  'status',
  'trackingIssue',
].sort()
assert.deepEqual(Object.keys(trigger).sort(), expectedKeys)
assert.equal(Object.hasOwn(trigger, 'startAt'), false)
assert.equal(trigger.schemaVersion, rerunContract.trigger.schemaVersion)
assert.equal(trigger.status, rerunContract.trigger.status)
assert.equal(trigger.phase, recovery.phase)
assert.equal(trigger.trackingIssue, recovery.trackingIssue)
assert.equal(trigger.provider, 'twitch')
assert.equal(trigger.mode, 'category_source_v2_observation')
assert.equal(trigger.oneTime, true)
assert.equal(trigger.executeImmediately, true)
assert.equal(trigger.confirmation, rerunContract.trigger.confirmation)
assert.equal(trigger.packagePr, recovery.packageIdentity.packagePr)
assert.equal(trigger.packageMergeSha, recovery.packageIdentity.packageMergeSha)
assert.equal(trigger.acceptancePr, recovery.packageIdentity.acceptancePr)

assert.ok(workflow.includes("const recoveryContract = JSON.parse(fs.readFileSync('docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-contract.json', 'utf8'))"))
assert.ok(workflow.includes("const recoveryAcceptance = JSON.parse(fs.readFileSync('docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-acceptance.json', 'utf8'))"))
assert.ok(workflow.includes("const rerunContract = JSON.parse(fs.readFileSync('docs/audits/12a5-twitch-category-source-v2-observation-rerun-trigger-contract.json', 'utf8'))"))
assert.ok(workflow.includes('recovery_package_not_accepted'))
assert.ok(workflow.includes('recovery_acceptance_not_accepted'))
assert.ok(workflow.includes('rerun_trigger_contract_not_accepted'))
assert.ok(workflow.includes('corrected_package_identity_mismatch'))
assert.equal(workflow.includes('OUTPUT_DIR: artifacts/12a5-twitch-category-source-v2-observation/run'), false)

const twitchPermanent = read(files.twitchPermanentConfig)
const kickPermanent = read(files.kickPermanentConfig)
assert.equal(twitchPermanent.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kickPermanent.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kickPermanent.includes('category-source-v2-candidate'), false)

console.log(JSON.stringify({
  ok: true,
  trigger: 'exact_immediate_one_file_corrected_rerun',
  provider: trigger.provider,
  packagePr: trigger.packagePr,
  packageMergeSha: trigger.packageMergeSha,
  acceptancePr: trigger.acceptancePr,
  sourceFailureRunId: failure.execution.workflowRunId,
  correctedValidationRunId: recovery.packageIdentity.validationRunId,
  correctedValidationJobId: recovery.packageIdentity.validationJobId,
  startAtPresent: false,
  productionExecutionOnPullRequest: false,
  publicCategoryUiAuthorized: false,
}, null, 2))
