import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const files = {
  failure: 'docs/audits/12a5-twitch-category-source-v2-observation-failure-evidence.json',
  recovery: 'docs/audits/12a5-twitch-category-source-v2-observation-recovery-package-contract.json',
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  workflow: '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  generator: 'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  runner: 'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  config: 'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
  rollbackConfig: 'workers/collector-twitch/wrangler.category-permanent.toml',
  normalDeploy: '.github/workflows/deploy-collector-workers.yml',
  twitchConfig: 'workers/collector-twitch/wrangler.toml',
  kickConfig: 'workers/collector-kick/wrangler.toml',
  kickPermanentConfig: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const [key, file] of Object.entries(files)) {
  if (key === 'trigger') continue
  assert.equal(existsSync(file), true, `${file}: missing`)
}
assert.equal(existsSync(files.trigger), false, `${files.trigger}: consumed trigger must be retired`)

const read = (file) => readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const failure = json(files.failure)
const recovery = json(files.recovery)
const workflow = read(files.workflow)
const generator = read(files.generator)
const runner = read(files.runner)
const config = read(files.config)
const rollbackConfig = read(files.rollbackConfig)
const normalDeploy = read(files.normalDeploy)

assert.equal(failure.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-failure-evidence-v1')
assert.equal(failure.status, 'observation_failed_before_candidate_deployment')
assert.equal(failure.phase, '12A-5B-R2')
assert.equal(failure.trackingIssue, 659)
assert.equal(failure.provider, 'twitch')
assert.equal(failure.trigger.pr, 689)
assert.equal(failure.trigger.mergeSha, 'd4a55ac3960dff978dfabd5ee77307477ab5268d')
assert.equal(failure.execution.workflowId, 323959988)
assert.equal(failure.execution.workflowRunId, 30608982443)
assert.equal(failure.execution.workflowRunNumber, 7)
assert.equal(failure.execution.runAttempt, 1)
assert.equal(failure.execution.runConclusion, 'failure')
assert.equal(failure.execution.observeJobId, 91087362002)
assert.equal(failure.execution.observeJobConclusion, 'failure')
assert.equal(failure.artifact.id, 8784691101)
assert.equal(failure.artifact.name, 'analytics-12a5-twitch-category-source-v2-observation')
assert.equal(failure.artifact.sizeBytes, 1979)
assert.equal(failure.artifact.digest, 'sha256:a4244d7f20021ce799cee7a4beace3ce85117381669ef3833e5fb8b02ef24fa6')
assert.equal(failure.artifact.evidenceJsonSha256, '3625aa33c07aab3b8098a44a31a4a23545d283212c372b61296c20683b779391')
assert.equal(failure.preflight.streamCount, 300)
assert.equal(failure.preflight.sourceMode, 'real')
assert.equal(failure.preflight.categoryContractVersion, 'category-source-v1')
assert.equal(failure.preflight.payloadProvider, 'twitch')
assert.equal(failure.preflight.collectorStatus, 'ok')
assert.equal(failure.failure.stage, 'candidate_deployment')
assert.equal(failure.failure.candidateDeploymentAttempted, true)
assert.equal(failure.failure.candidateDeploymentSucceeded, false)
assert.equal(failure.failure.candidateWorkerActivated, false)
assert.equal(failure.failure.observationStarted, false)
assert.equal(failure.failure.polls, 0)
assert.equal(failure.failure.snapshots, 0)
assert.equal(failure.failure.errorCode, 'generated_entry_point_not_found')
assert.equal(failure.rollback.attempted, true)
assert.equal(failure.rollback.success, true)
assert.equal(failure.rollback.config, files.rollbackConfig)
assert.equal(failure.rollback.worker, 'viewloom-collector-twitch')
assert.equal(failure.rollback.cron, '*/5 * * * *')
assert.equal(failure.rollback.versionId, 'ccca4cf4-0b0e-42e5-8c47-39d17c05f02a')
assert.equal(failure.decision.observationAccepted, false)
assert.equal(failure.decision.correctedPackageRequired, true)
assert.equal(failure.decision.automaticRerunAuthorized, false)
assert.equal(failure.decision.semanticMappingAuthorized, false)
assert.equal(failure.decision.stabilityClockStartAuthorized, false)
assert.equal(failure.decision.finalModeAuthorized, false)
assert.equal(failure.decision.publicCategoryUiAuthorized, false)
for (const value of Object.values(failure.boundaries)) assert.equal(value, false)

assert.equal(recovery.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-recovery-package-v1')
assert.equal(recovery.status, 'candidate')
assert.equal(recovery.phase, failure.phase)
assert.equal(recovery.trackingIssue, failure.trackingIssue)
assert.equal(recovery.provider, failure.provider)
assert.equal(recovery.packageIdentity.packagePr, 692)
assert.equal(recovery.packageIdentity.baseSha, failure.trigger.mergeSha)
assert.equal(recovery.packageIdentity.sourceFailureRunId, failure.execution.workflowRunId)
assert.equal(recovery.packageIdentity.sourceFailureObserveJobId, failure.execution.observeJobId)
assert.equal(recovery.packageIdentity.sourceFailureArtifactId, failure.artifact.id)
assert.equal(recovery.packageIdentity.productionExecutionPerformedByPackagePr, false)
assert.equal(recovery.sourceEvidence, files.failure)
assert.equal(recovery.defect.code, 'generator_output_directory_overridden_by_observe_job')
assert.equal(recovery.defect.generatorDefaultDirectory, 'workers/collector-twitch/.generated-v2-observation')
assert.equal(recovery.defect.acceptedWranglerEntryPoint, '../../workers/collector-twitch/.generated-v2-observation/entry.ts')
assert.equal(recovery.correction.removeObserveJobOutputDirEnvironment, true)
assert.equal(recovery.correction.runnerDefaultEvidenceDirectoryPreserved, 'artifacts/12a5-twitch-category-source-v2-observation/run')
assert.equal(recovery.correction.generatorDefaultDirectoryPreserved, 'workers/collector-twitch/.generated-v2-observation')
for (const key of ['wranglerConfigChanged', 'generatorChanged', 'candidateSourceChanged', 'canonicalRollbackConfigChanged']) {
  assert.equal(recovery.correction[key], false, `${key}: must remain false`)
}
assert.equal(Object.values(recovery.validationRequired).every((value) => value === true), true)
assert.equal(recovery.rerunBoundary.packagePrCanExecuteProduction, false)
assert.equal(recovery.rerunBoundary.acceptancePrRequired, true)
assert.equal(recovery.rerunBoundary.newExactOneFileTriggerRequired, true)
assert.equal(recovery.rerunBoundary.automaticRerunAuthorized, false)
assert.equal(recovery.rerunBoundary.startAtAllowed, false)
assert.equal(recovery.rerunBoundary.preStartSleepAllowed, false)
assert.equal(recovery.rerunBoundary.maximumObservationMinutes, 16)
assert.equal(recovery.rerunBoundary.canonicalRollbackRequired, true)
assert.equal(recovery.unchangedBoundaries.twitchCron, '*/5 * * * *')
assert.equal(recovery.unchangedBoundaries.kickCron, '*/5 * * * *')
for (const key of ['kickChanged', 'retentionChanged', 'backfillAuthorized', 'crossProviderIdentityAllowed', 'combinedProviderRankingAllowed', 'semanticMappingAuthorized', 'stabilityClockStartAuthorized', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) {
  assert.equal(recovery.unchangedBoundaries[key], false, `${key}: must remain false`)
}

assert.ok(generator.includes("const OUTPUT_DIR = process.env.OUTPUT_DIR || 'workers/collector-twitch/.generated-v2-observation'"))
assert.ok(runner.includes("const GENERATED_DIR = 'workers/collector-twitch/.generated-v2-observation'"))
assert.ok(runner.includes("const OUTPUT_DIR = process.env.OUTPUT_DIR || 'artifacts/12a5-twitch-category-source-v2-observation/run'"))
assert.ok(config.includes('main = "../../workers/collector-twitch/.generated-v2-observation/entry.ts"'))
assert.equal(workflow.includes('OUTPUT_DIR: artifacts/12a5-twitch-category-source-v2-observation/run'), false)
assert.ok(workflow.includes('path: artifacts/12a5-twitch-category-source-v2-observation/run/evidence.json'))
assert.ok(workflow.includes("github.event_name == 'push'"))
assert.ok(workflow.includes("needs.classify.outputs.trigger_present == 'true'"))
assert.equal(workflow.includes('workflow_dispatch:'), false)
assert.equal(workflow.includes('schedule:'), false)
assert.equal(normalDeploy.includes("'execution-packages/**'"), false)
assert.equal(normalDeploy.includes('run-12a5-twitch-category-source-v2-observation.mjs'), false)
assert.equal(rollbackConfig.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(read(files.twitchConfig)), '*/5 * * * *')
assert.equal(cron(rollbackConfig), '*/5 * * * *')
assert.equal(cron(read(files.kickConfig)), '*/5 * * * *')
assert.equal(cron(read(files.kickPermanentConfig)), '*/5 * * * *')

console.log(JSON.stringify({
  ok: true,
  status: recovery.status,
  packagePr: recovery.packageIdentity.packagePr,
  failedRunId: failure.execution.workflowRunId,
  observeJobId: failure.execution.observeJobId,
  artifactId: failure.artifact.id,
  candidateActivated: failure.failure.candidateWorkerActivated,
  rollbackSucceeded: failure.rollback.success,
  correctedDirectorySeparation: true,
  productionExecution: false,
  nextGate: recovery.nextGate,
}, null, 2))
