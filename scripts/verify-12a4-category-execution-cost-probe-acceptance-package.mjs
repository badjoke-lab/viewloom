import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const json = (file) => JSON.parse(read(file))
const diagnosticsPath = path.join(root, 'artifacts/12a4-category-execution-cost-probe-acceptance/package-diagnostics.json')

const contract = json('docs/audits/12a4-category-execution-cost-probe-acceptance-contract.json')
const failure = json('docs/audits/12a4-category-execution-cost-probe-attempt-1-failure-evidence.json')
const trigger = json('docs/audits/12a4-category-execution-cost-probe-trigger.json')
const execution = json('docs/audits/12a4-category-execution-cost-probe-execution-contract.json')
const workflow = read('.github/workflows/analytics-12a4-category-execution-cost-probe-acceptance.yml')

const checks = {
  contractSchema: contract.schemaVersion === 'viewloom-12a4-category-execution-cost-probe-acceptance-contract-v1',
  contractStatus: contract.status === 'accepted_failure_evidence_ready_for_merge',
  trackingIssue: contract.trackingIssue === 519,
  triggerPr: contract.trigger.pr === 549,
  triggerMergeSha: contract.trigger.mergeSha === '9637f4927fbc5e4674e3a78e285d7ea6c5049cfa',
  sourceRun: contract.source.workflowRunId === 29339859588,
  sourceArtifact: contract.source.artifactId === 8313547082,
  sourceFailure: contract.source.conclusion === 'failure',
  failureEvidencePath: contract.acceptance.failureEvidence === 'docs/audits/12a4-category-execution-cost-probe-attempt-1-failure-evidence.json',
  failureEvidenceAccepted: contract.acceptance.failureEvidenceAccepted === true,
  attemptNotAcceptedAsSuccess: contract.acceptance.attemptAcceptedAsSuccess === false,
  sameTriggerCannotRearm: contract.sameTriggerMayRearm === false,
  readOnlyBoundary: contract.readOnlyBoundary === true,
  categoryCaptureNotAuthorized: contract.categoryCaptureAuthorized === false,
  triggerIdentity: trigger.expectedExecutionPackageMergeSha === '219d79351388a15a599e72f8e85228d498488f11',
  executionAccepted: execution.status === 'accepted' && execution.acceptance?.pr === 548,
  failureSchema: failure.schemaVersion === 'viewloom-12a4-category-execution-cost-probe-failure-evidence-v1',
  failureStatus: failure.status === 'accepted_failure_evidence',
  exactRunMatched: failure.gate.exactTriggerPushRunMatched === true,
  sourceArtifactRecovered: failure.gate.sourceArtifactRecovered === true,
  twitchAttempted: failure.providers.twitch.attempted === true,
  twitchInspect500: failure.providers.twitch.inspectHttpStatus === 500,
  twitchProbeNotCalled: failure.providers.twitch.probeEndpointCalled === false,
  twitchNoReservedWrites: failure.providers.twitch.reservedProbeWritesPerformed === false,
  twitchWorkerDeleted: failure.providers.twitch.finalTemporaryWorkerHttpStatus === 404 && failure.providers.twitch.temporaryWorkerAbsentAfterRun === true,
  kickNotAttempted: failure.providers.kick.attempted === false,
  kickProbeNotCalled: failure.providers.kick.probeEndpointCalled === false,
  kickNoReservedWrites: failure.providers.kick.reservedProbeWritesPerformed === false,
  noProbeWrites: failure.gate.reservedProbeWritesPerformed === false,
  attemptNotSuccess: failure.gate.attemptAcceptedAsSuccess === false,
  runnerFixRequired: failure.failureClassification.newRunnerPackageRequired === true,
  inspectRetryRequired: failure.groundedRemediation.inspectReadinessRetryRequired === true,
  workflowFrozenEvidence: workflow.includes('12a4-category-execution-cost-probe-attempt-1-failure-evidence.json'),
  workflowNoSourceMutation: !workflow.includes('CLOUDFLARE_API_TOKEN') && !workflow.includes('CLOUDFLARE_ACCOUNT_ID') && !workflow.toLowerCase().includes('wrangler'),
  workflowNoPushTrigger: !/^\s*push:/m.test(workflow),
  workflowNoSchedule: !/^\s*schedule:/m.test(workflow),
}

const failed = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name)
const diagnostics = {
  ok: failed.length === 0,
  workstream: contract.workstream,
  status: contract.status,
  failed,
  checks,
  sourceRunId: contract.source.workflowRunId,
  sourceArtifactId: contract.source.artifactId,
  failureStage: failure.failureClassification.stage,
  twitchWorkerFinalHttpStatus: failure.providers.twitch.finalTemporaryWorkerHttpStatus,
  categoryCaptureAuthorized: contract.categoryCaptureAuthorized,
}

fs.mkdirSync(path.dirname(diagnosticsPath), { recursive: true })
fs.writeFileSync(diagnosticsPath, `${JSON.stringify(diagnostics, null, 2)}\n`)
console.log(JSON.stringify(diagnostics, null, 2))
assert.equal(failed.length, 0, `acceptance package failures: ${failed.join(', ')}`)
