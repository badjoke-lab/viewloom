#!/usr/bin/env node
import fs from 'node:fs'

const decisionPath = 'docs/audits/12a31-kick-history-disabled-runtime-production-deployment-decision.json'
const evidencePath = 'docs/audits/12a26-kick-history-category-reprobe-production-pass.json'
const deployWorkflowPath = '.github/workflows/deploy-collector-workers.yml'
const workflowPath = '.github/workflows/analytics-12a31-kick-history-disabled-runtime-production-deployment-decision.yml'

const read = (path) => fs.readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const assert = (value, message) => { if (!value) throw new Error(message) }

const decision = json(decisionPath)
const evidence = json(evidencePath)
const deployWorkflow = read(deployWorkflowPath)
const workflow = read(workflowPath)

assert(decision.schemaVersion === 'viewloom-12a31-kick-history-disabled-runtime-production-deployment-decision-v1', 'decision schema')
assert(decision.phase === '12A-31', 'phase')
assert(decision.provider === 'kick', 'provider')
assert(decision.trackingIssue === 901, 'tracking issue')
assert(decision.sourceMainSha === '09784eb48d026242c6ca43631aecd503b8765a95', 'source main')
assert(decision.status === 'deployment_candidate_accepted_execution_still_requires_explicit_instruction', 'status')
assert(decision.decision === 'yes_exact_disabled_runtime_candidate_is_eligible_for_one_production_deployment', 'decision')

const candidate = decision.candidate
assert(candidate.pr === 898, 'candidate PR')
assert(candidate.headSha === '6b4e95da258476ba104e4e3598ae5793f9153dcd', 'candidate head')
assert(candidate.baseMainSha === '09784eb48d026242c6ca43631aecd503b8765a95', 'candidate base')
assert(candidate.mustRemainDraftUntilExecutionInstruction === true, 'Draft boundary')
assert(candidate.exactChangedFileCount === 4, 'exact file count')
assert(candidate.wranglerChanged === false, 'wrangler must be unchanged')
assert(candidate.activeHistoryCategoryRuntimeConfigCommitted === false, 'active History config forbidden')
assert(candidate.disabledByDefault === true, 'disabled by default')
assert(candidate.categoryCaptureAlsoRequired === true, 'category capture prerequisite')
assert(candidate.missingOrNonTrueEnableMeansDisabled === true, 'missing enable boundary')
assert(candidate.missingStartDayCannotGenerate === true, 'missing startDay boundary')

const validation = decision.validationEvidence
assert(validation.dedicatedCandidateRun === 31996004510, 'candidate run')
assert(validation.dedicatedCandidateConclusion === 'success', 'candidate run conclusion')
assert(validation.collectorDeploymentPrRun === 31996004545, 'deploy PR run')
assert(validation.collectorDeploymentPrConclusion === 'success', 'deploy PR run conclusion')
assert(validation.prDeployTwitch === 'skipped', 'PR Twitch deploy')
assert(validation.prDeployKick === 'skipped', 'PR Kick deploy')
assert(validation.allApplicableCiGreen === true, 'all applicable CI')

assert(evidence.schemaVersion === 'viewloom-12a26-kick-history-category-reprobe-production-pass-v1', 'evidence schema')
assert(evidence.performanceDetermination === 'PASS', 'production performance determination')
assert(evidence.production.run === 31987877725, 'production evidence run')
assert(evidence.result.cost.rowsRead === 16117, 'rows_read')
assert(evidence.thresholds.rowsReadMaximum === 250000, 'rows_read max')
assert(evidence.result.cost.rowsWritten === 1164, 'rows_written')
assert(evidence.result.cost.changes === 583, 'changes')
assert(evidence.result.cost.statements === 24, 'statements')
assert(evidence.result.cost.wallMs === 2178, 'wall time')
assert(evidence.postCleanup.aggregateRows === 0, 'post-cleanup aggregate rows')
assert(evidence.postCleanup.providerLeakageRows === 0, 'post-cleanup leakage rows')
assert(evidence.postDeleteHttpStatus === 404, 'temporary Worker final 404')

const frozen = decision.acceptedProductionCostEvidence
assert(frozen.runId === evidence.production.run, 'frozen run')
assert(frozen.rowsRead === evidence.result.cost.rowsRead, 'frozen rows_read')
assert(frozen.rowsReadMaximum === evidence.thresholds.rowsReadMaximum, 'frozen rows_read max')
assert(frozen.rowsWritten === evidence.result.cost.rowsWritten, 'frozen rows_written')
assert(frozen.changes === evidence.result.cost.changes, 'frozen changes')
assert(frozen.statements === evidence.result.cost.statements, 'frozen statements')
assert(frozen.workerWallMs === evidence.result.cost.wallMs, 'frozen wall')
assert(frozen.postCleanupAggregateRows === evidence.postCleanup.aggregateRows, 'frozen cleanup rows')
assert(frozen.leakageRows === evidence.postCleanup.providerLeakageRows, 'frozen leakage')
assert(frozen.temporaryWorkerFinalHttpStatus === evidence.postDeleteHttpStatus, 'frozen Worker status')

const boundary = decision.deploymentBoundary
assert(boundary.mainMergeOfCandidateTriggersProductionCollectorDeployment === true, 'main merge deploy coupling')
assert(boundary.decisionPrMergeTriggersProductionCollectorDeployment === false, 'decision PR must not deploy')
assert(boundary.decisionPrContainsCollectorPathChanges === false, 'decision PR collector changes forbidden')
assert(boundary.decisionPrContainsCloudflareCredentials === false, 'decision PR Cloudflare credentials forbidden')
assert(boundary.decisionPrContainsDeployCommand === false, 'decision PR deploy command forbidden')
assert(boundary.productionDeploymentExecutionAuthorizedByThisDecisionArtifactAlone === false, 'artifact cannot execute production')
assert(boundary.explicitOperatorExecutionInstructionStillRequired === true, 'explicit execution instruction required')
assert(boundary.executionMustUseExactCandidateHead === true, 'exact head required')
assert(boundary.executionMustReauditCurrentMainAndCiFirst === true, 'reaudit required')
assert(boundary.expectedProductionDeployProvider === 'kick', 'Kick-only deploy')
assert(boundary.twitchDeploymentMustRemainUnselected === true, 'Twitch deploy forbidden')

for (const [key, value] of Object.entries(decision.stillUnauthorized)) {
  assert(value === true, `${key} must remain unauthorized`)
}

assert(decision.executionAcceptance.markCandidateReadyOnlyAfterExplicitExecutionInstruction === true, 'Ready gate')
assert(decision.executionAcceptance.mergeOnlyExactCandidateHead === true, 'exact merge gate')
assert(decision.executionAcceptance.followMainPushDeployWorkflow === true, 'follow deploy workflow')
assert(decision.executionAcceptance.kickDeployMustSucceed === true, 'Kick deploy success required')
assert(decision.executionAcceptance.twitchDeployMustBeSkipped === true, 'Twitch deploy must skip')
assert(decision.executionAcceptance.historyGeneratorMustRemainDisabled === true, 'generator must remain disabled')
assert(decision.executionAcceptance.freezeDeploymentEvidenceAfterward === true, 'deployment evidence freeze required')

assert(deployWorkflow.includes("- 'workers/collector-kick/**'"), 'Kick collector main deploy path missing')
assert(deployWorkflow.includes('\n  push:'), 'main push deploy trigger missing')
assert(deployWorkflow.includes('deploy-kick:'), 'Kick deploy job missing')
assert(deployWorkflow.includes('deploy-twitch:'), 'Twitch deploy job missing')

assert(workflow.includes('name: Analytics 12A31 Kick History Disabled Runtime Production Deployment Decision'), 'workflow name')
assert(workflow.includes('pull_request:'), 'decision workflow must be PR-only')
for (const forbidden of [
  '\n  ' + 'push:',
  'workflow_' + 'dispatch:',
  'sched' + 'ule:',
  'CLOUDFLARE_' + 'API_TOKEN',
  'CLOUDFLARE_' + 'ACCOUNT_ID',
  'wrangler ' + 'deploy',
  'wrangler@4 ' + 'deploy',
  'workers/collector-kick/src/',
  'workers/collector-kick/wrangler.toml',
]) assert(!workflow.includes(forbidden), `decision workflow production surface: ${forbidden}`)

console.log(JSON.stringify({
  phase: decision.phase,
  status: decision.status,
  decision: decision.decision,
  candidatePr: candidate.pr,
  candidateHead: candidate.headSha,
  productionCostRowsRead: frozen.rowsRead,
  productionCostRowsReadMaximum: frozen.rowsReadMaximum,
  executionInstructionStillRequired: boundary.explicitOperatorExecutionInstructionStillRequired,
  generatorEnablementAuthorized: false,
  nextGate: decision.executionAcceptance.nextGate,
}, null, 2))
