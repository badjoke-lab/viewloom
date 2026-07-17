import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'

const read = (file) => fs.readFileSync(file, 'utf8')
const json = (file) => JSON.parse(read(file))
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

const contractPath = 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-contract.json'
const evidencePath = 'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-evidence.json'
const workflowPath = '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight.yml'
const reportingWorkflowPath = '.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight-reporting.yml'
const requestPaths = [
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-reporting-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-diagnostic-marker.json',
]

const contract = json(contractPath)
const evidence = json(evidencePath)
const execution = json('docs/audits/12a4-twitch-category-capture-canary-execution-contract.json')
const packageContract = json('docs/audits/12a4-twitch-category-capture-canary-package-contract.json')
const gate = json('docs/audits/12a2-current-gate-state.json')
const workflow = read(workflowPath)
const note = read('docs/work-in-progress/phase12a4-twitch-category-capture-canary-storage-preflight.md')
const normalConfig = read('workers/collector-twitch/wrangler.toml')

assert.equal(contract.schemaVersion, 'viewloom-12a4-twitch-category-capture-canary-storage-preflight-v1')
assert.equal(contract.status, 'accepted')
assert.equal(contract.trackingIssue, 519)
assert.equal(contract.provider, 'twitch')
assert.equal(contract.observedAt, '2026-07-17T16:57:55.343Z')
assert.equal(contract.acceptedInputs.twitchPackagePr, 590)
assert.equal(contract.acceptedInputs.twitchExecutionPr, 591)
assert.equal(contract.acceptedInputs.executionAcceptancePr, 592)
assert.equal(contract.workflow.pullRequestValidationOnly, true)
assert.equal(contract.workflow.productionObservationRetired, true)
assert.equal(contract.workflow.reportingWorkflowRetired, true)
assert.equal(contract.workflow.allRequestFilesRetired, true)
assert.equal(contract.workflow.pushEvent, false)
assert.equal(contract.workflow.scheduleEvent, false)
assert.equal(contract.workflow.workflowDispatchProductionAllowed, false)

assert.deepEqual(contract.readOnlyBoundary.cloudflareApiMethods, ['GET'])
assert.deepEqual(contract.readOnlyBoundary.d1Statements, ['SELECT'])
for (const key of [
  'workerDeployment',
  'workerDeletion',
  'workerSettingsMutation',
  'remoteMigration',
  'runtimeFlagMutation',
  'categoryRowsWritten',
  'collectorCadenceChanged',
  'backfillPerformed',
  'retentionChanged',
  'kickChanged',
  'triggerCreated',
  'runtimeCaptureStarted',
]) assert.equal(contract.readOnlyBoundary[key], false, `${key} must remain false`)

assert.equal(contract.storage.providerCurrentMb, 325.9)
assert.equal(contract.storage.accountCurrentMb, 3665.34)
assert.equal(contract.storage.projectedNinetyDaySizeMb, 374.22)
assert.equal(contract.storage.projectedProviderHeadroomMb, 75.78)
assert.equal(contract.storage.projectedAccountWideSizeMb, 3713.66)
assert.equal(contract.storage.projectedAccountWideHeadroomMb, 894.34)
assert.equal(contract.storage.providerPass, true)
assert.equal(contract.storage.accountPass, true)
assert.equal(contract.storage.pass, true)

assert.equal(contract.evidence.repositoryEvidencePath, evidencePath)
assert.equal(contract.evidence.digest, 'sha256:0c7de9e6d71027b9b040c348f017d413908e631b01718d347b72d2ae8700f943')
assert.equal(contract.acceptance.pr, 599)
assert.equal(contract.acceptance.mergeSha, '785a271a7b95808e01478b9fb3846028229faa24')
assert.equal(contract.acceptance.mergeShaRecorded, true)
assert.equal(contract.acceptance.packagePr, 594)
assert.equal(contract.acceptance.parserFixPr, 598)
assert.equal(contract.acceptance.parserFixMergeSha, 'a8af5e3d3bad24e1994312f2877e470276b3f517')
assert.equal(contract.acceptance.productionWorkflowRunId, 29598193753)
assert.equal(contract.acceptance.productionWorkflowJobId, 87943655515)
assert.equal(contract.acceptance.artifactId, 8413901173)
assert.equal(contract.acceptance.artifactDigest, 'sha256:ec0bd67698f93f104120aa626a854df027cb6d8a013469a4b6e8dd26a58f3225')
assert.equal(contract.acceptance.observedAt, contract.observedAt)
assert.equal(contract.acceptance.evidenceDigest, contract.evidence.digest)
for (const key of [
  'storagePass',
  'providerStoragePass',
  'accountStoragePass',
  'schemaPass',
  'providerLeakagePass',
  'bindingsPass',
  'latestSnapshotPass',
  'allReadOnlyGatesPass',
  'productionObservationPathRetired',
  'reportingPathRetired',
  'allRequestFilesRetired',
]) assert.equal(contract.acceptance[key], true, `${key} must be true`)
for (const key of ['productionMutationPerformed', 'triggerCreated', 'runtimeCaptureStarted']) {
  assert.equal(contract.acceptance[key], false, `${key} must be false`)
}
assert.equal(Object.values(contract.pullRequestBoundary).every((value) => value === false), true)

assert.equal(evidence.provider, 'twitch')
assert.equal(evidence.observedAt, contract.observedAt)
assert.deepEqual(evidence.storage, contract.storage)
assert.equal(evidence.providerLeakageRows, 0)
assert.equal(evidence.providerLeakagePass, true)
assert.equal(evidence.schema.pass, true)
assert.equal(evidence.bindings.pass, true)
assert.equal(evidence.bindings.categoryCaptureDirectFlagPresent, false)
assert.equal(evidence.latestSnapshot.streamCount, 300)
assert.equal(evidence.latestSnapshot.totalViewers, 1347962)
assert.equal(evidence.latestSnapshot.sourceMode, 'real')
assert.equal(evidence.latestSnapshot.freshnessMinutes, 1.93)
assert.equal(evidence.latestSnapshot.authenticated, true)
assert.equal(evidence.latestSnapshot.nonempty, true)
assert.equal(evidence.latestSnapshot.pass, true)
assert.equal(evidence.gates.allReadOnlyGatesPass, true)
assert.equal(evidence.gates.productionMutationPerformed, false)
assert.equal(evidence.gates.triggerCreated, false)
assert.equal(evidence.gates.runtimeCaptureStarted, false)
assert.equal(evidence.evidence.digest, contract.evidence.digest)
const { evidence: evidenceMetadata, ...digestPayload } = evidence
assert.equal(
  evidenceMetadata.digest,
  `sha256:${createHash('sha256').update(canonicalJson(digestPayload)).digest('hex')}`,
)

assert.equal(packageContract.status, 'accepted')
assert.equal(packageContract.acceptance.pr, 590)
assert.equal(execution.status, 'accepted')
assert.equal(execution.acceptance.pr, 591)
assert.equal(execution.acceptance.mergeShaRecorded, true)
assert.equal(execution.trigger.storagePreflightContract, contractPath)
assert.equal(execution.trigger.storagePreflightStatusRequired, 'accepted')
assert.equal(execution.trigger.maximumPreflightAgeMinutesAtStart, 60)
assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v19')
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.twitchCanaryAutomaticallyAuthorized, false)

assert.equal(fs.existsSync('docs/audits/12a4-twitch-category-capture-canary-trigger.json'), false)
assert.equal(fs.existsSync(reportingWorkflowPath), false)
for (const requestPath of requestPaths) assert.equal(fs.existsSync(requestPath), false)
assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(/^\s*workflow_dispatch:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.equal(workflow.includes('observe-readonly'), false)
assert.equal(workflow.includes('observe-and-report'), false)
assert.equal(workflow.includes('inspect-request'), false)

assert.ok(note.includes('Accepted. PR #599 froze the exact successful evidence'))
assert.ok(note.includes('785a271a7b95808e01478b9fb3846028229faa24'))
assert.ok(note.includes('final contract status: `accepted`'))
assert.ok(note.includes('The trigger inspector still rejects evidence older than 60 minutes'))
assert.ok(normalConfig.includes('name = "viewloom-collector-twitch"'))
assert.ok(normalConfig.includes('crons = ["*/5 * * * *"]'))
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normalConfig), false)

console.log(JSON.stringify({
  ok: true,
  status: contract.status,
  acceptancePr: contract.acceptance.pr,
  acceptanceMergeSha: contract.acceptance.mergeSha,
  mergeShaRecorded: contract.acceptance.mergeShaRecorded,
  observedAt: contract.observedAt,
  evidenceDigest: contract.evidence.digest,
  currentTwitchMb: contract.storage.providerCurrentMb,
  projectedNinetyDayMb: contract.storage.projectedNinetyDaySizeMb,
  projectedProviderHeadroomMb: contract.storage.projectedProviderHeadroomMb,
  projectedAccountHeadroomMb: contract.storage.projectedAccountWideHeadroomMb,
  allReadOnlyGatesPass: contract.acceptance.allReadOnlyGatesPass,
  productionObservationPathRetired: contract.acceptance.productionObservationPathRetired,
  triggerPresent: false,
  runtimeCaptureAuthorized: false,
}, null, 2))
