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
const contract = json(contractPath)
const evidence = json(evidencePath)
const gate = json('docs/audits/12a2-current-gate-state.json')
const workflow = read(workflowPath)
const docsIndex = read('docs/README.md')

assert.equal(contract.status, 'accepted')
assert.equal(contract.provider, 'twitch')
assert.equal(contract.observedAt, '2026-07-17T16:57:55.343Z')
assert.equal(contract.acceptance.pr, 599)
assert.equal(contract.acceptance.mergeSha, '785a271a7b95808e01478b9fb3846028229faa24')
assert.equal(contract.acceptance.mergeShaRecorded, true)
assert.equal(contract.acceptance.productionWorkflowRunId, 29598193753)
assert.equal(contract.acceptance.productionWorkflowJobId, 87943655515)
assert.equal(contract.acceptance.artifactId, 8413901173)
assert.equal(contract.acceptance.allReadOnlyGatesPass, true)
assert.equal(contract.acceptance.productionMutationPerformed, false)
assert.equal(contract.acceptance.triggerCreated, false)
assert.equal(contract.acceptance.runtimeCaptureStarted, false)
assert.equal(contract.acceptance.productionObservationPathRetired, true)
assert.equal(contract.acceptance.reportingPathRetired, true)
assert.equal(contract.acceptance.allRequestFilesRetired, true)
assert.equal(contract.storage.providerCurrentMb, 325.9)
assert.equal(contract.storage.projectedNinetyDaySizeMb, 374.22)
assert.equal(contract.storage.projectedProviderHeadroomMb, 75.78)
assert.equal(contract.storage.projectedAccountWideHeadroomMb, 894.34)
assert.equal(contract.storage.pass, true)

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
assert.equal(evidence.evidence.digest, 'sha256:0c7de9e6d71027b9b040c348f017d413908e631b01718d347b72d2ae8700f943')
const { evidence: evidenceMetadata, ...digestPayload } = evidence
assert.equal(evidenceMetadata.digest, `sha256:${createHash('sha256').update(canonicalJson(digestPayload)).digest('hex')}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v20')
assert.equal(gate.status, '12a4_twitch_canary_storage_preflight_accepted_trigger_blocked_by_freshness')
assert.equal(gate.currentWorkstream.phase, '12A-4-15')
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchCanaryExecutionPackage, true)
assert.equal(gate.currentWorkstream.acceptedTwitchStoragePreflight, true)
assert.equal(gate.currentWorkstream.exactTwitchTriggerCurrent, false)
assert.equal(gate.currentWorkstream.twitchCanaryObservationActive, false)
assert.equal(gate.currentWorkstream.twitchStoragePreflightFreshForStart, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_category_capture_storage_preflight_not_fresh_for_start',
  'twitch_category_capture_exact_trigger_not_accepted',
  'twitch_category_capture_canary_not_executed',
  'runtime_category_capture_not_authorized',
])

const canonicalPreflight = gate.twitchCategoryCaptureCanaryStoragePreflight
assert.equal(canonicalPreflight.status, 'accepted')
assert.equal(canonicalPreflight.contract, contractPath)
assert.equal(canonicalPreflight.evidence, evidencePath)
assert.equal(canonicalPreflight.acceptancePr, 599)
assert.equal(canonicalPreflight.acceptanceMergeSha, contract.acceptance.mergeSha)
assert.equal(canonicalPreflight.finalizationPr, 600)
assert.equal(canonicalPreflight.finalizationMergeSha, 'b7a86ed7cc954c138d3e5a3281a5302e9bc17604')
assert.equal(canonicalPreflight.workflowRunId, contract.acceptance.productionWorkflowRunId)
assert.equal(canonicalPreflight.workflowJobId, contract.acceptance.productionWorkflowJobId)
assert.equal(canonicalPreflight.artifactId, contract.acceptance.artifactId)
assert.equal(canonicalPreflight.evidenceDigest, evidence.evidence.digest)
assert.equal(canonicalPreflight.providerCurrentMb, contract.storage.providerCurrentMb)
assert.equal(canonicalPreflight.projectedNinetyDaySizeMb, contract.storage.projectedNinetyDaySizeMb)
assert.equal(canonicalPreflight.projectedProviderHeadroomMb, contract.storage.projectedProviderHeadroomMb)
assert.equal(canonicalPreflight.projectedAccountWideHeadroomMb, contract.storage.projectedAccountWideHeadroomMb)
assert.equal(canonicalPreflight.providerLeakageRows, 0)
assert.equal(canonicalPreflight.allReadOnlyGatesPass, true)
assert.equal(canonicalPreflight.productionMutationPerformed, false)
assert.equal(canonicalPreflight.productionObservationPathsRetired, true)
assert.equal(canonicalPreflight.triggerPresent, false)
assert.equal(canonicalPreflight.runtimeCaptureAuthorized, false)
assert.equal(canonicalPreflight.freshForFutureStart, false)
assert.equal(canonicalPreflight.freshnessLimitMinutesAtStart, 60)

assert.equal(fs.existsSync('docs/audits/12a4-twitch-category-capture-canary-trigger.json'), false)
assert.equal(fs.existsSync('.github/workflows/analytics-12a4-twitch-category-capture-canary-storage-preflight-reporting.yml'), false)
for (const path of [
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-reporting-request.json',
  'docs/audits/12a4-twitch-category-capture-canary-storage-preflight-diagnostic-marker.json',
]) assert.equal(fs.existsSync(path), false)
assert.match(workflow, /^\s*pull_request:/m)
assert.equal(/^\s*push:/m.test(workflow), false)
assert.equal(/^\s*schedule:/m.test(workflow), false)
assert.equal(/^\s*workflow_dispatch:/m.test(workflow), false)
assert.equal(workflow.includes('CLOUDFLARE_API_TOKEN'), false)
assert.equal(workflow.includes('CLOUDFLARE_ACCOUNT_ID'), false)
assert.ok(docsIndex.includes('canonical gate 12A-4-15'))
assert.ok(docsIndex.includes('fresh Twitch storage evidence for start no'))
assert.ok(docsIndex.includes('Twitch category capture started no'))

console.log(JSON.stringify({
  ok: true,
  gateVersion: gate.schemaVersion,
  phase: gate.currentWorkstream.phase,
  preflightStatus: canonicalPreflight.status,
  evidenceDigest: canonicalPreflight.evidenceDigest,
  freshForFutureStart: canonicalPreflight.freshForFutureStart,
  exactTwitchTriggerCurrent: gate.currentWorkstream.exactTwitchTriggerCurrent,
  runtimeCaptureAuthorized: gate.currentWorkstream.runtimeCaptureAuthorized,
}, null, 2))
