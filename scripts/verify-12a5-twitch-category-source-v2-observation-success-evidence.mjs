import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const paths = {
  evidence: 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  retirement: 'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json',
  executionRetirement: 'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json',
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  twitchPermanent: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickPermanent: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const [key, path] of Object.entries(paths)) {
  if (key === 'trigger') continue
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(paths.trigger), false, `${paths.trigger}: consumed trigger must remain retired`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const evidence = json(paths.evidence)
const retirement = json(paths.retirement)
const executionRetirement = json(paths.executionRetirement)

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-success-evidence-v1')
assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.phase, '12A-5B-R2')
assert.equal(evidence.trackingIssue, 659)
assert.equal(evidence.provider, 'twitch')
assert.equal(evidence.trigger.pr, 695)
assert.equal(evidence.trigger.mergeSha, '78cf5759840aa7819b34c153d7521dab7df6bacc')
assert.equal(evidence.trigger.startAtPresent, false)
assert.equal(evidence.trigger.packagePr, 692)
assert.equal(evidence.trigger.packageMergeSha, '19e2d5b44a0088dce046b8e34f028efebf1d7d24')
assert.equal(evidence.trigger.acceptancePr, 693)
assert.equal(evidence.trigger.policyPr, 694)

assert.equal(evidence.execution.workflowId, 323959988)
assert.equal(evidence.execution.workflowRunId, 30620512044)
assert.equal(evidence.execution.workflowRunNumber, 17)
assert.equal(evidence.execution.runAttempt, 1)
assert.equal(evidence.execution.runConclusion, 'success')
assert.equal(evidence.execution.classifyJobId, 91123702046)
assert.equal(evidence.execution.validateTriggerJobId, 91123725389)
assert.equal(evidence.execution.observeJobId, 91123756273)
assert.equal(evidence.execution.observeJobConclusion, 'success')
assert.equal(evidence.artifact.id, 8789385200)
assert.equal(evidence.artifact.name, 'analytics-12a5-twitch-category-source-v2-observation')
assert.equal(evidence.artifact.sizeBytes, 2152)
assert.equal(evidence.artifact.digest, 'sha256:dfff17be40f9766c5d4cc4ead6eada761e00ba760b7ce133fce0e9b4f427fc10')
assert.equal(evidence.artifact.evidenceJsonSha256, 'e2ceb0ce88dab1f03fd374004488fda9381f223a5dde6d139686c06218ce6bbe')

assert.equal(evidence.preflight.streamCount, 300)
assert.equal(evidence.preflight.sourceMode, 'real')
assert.equal(evidence.preflight.categoryContractVersion, 'category-source-v1')
assert.equal(evidence.preflight.payloadProvider, 'twitch')
assert.equal(evidence.preflight.collectorStatus, 'ok')
assert.equal(evidence.generation.contractVersion, 'category-source-v2-candidate')
assert.equal(evidence.generation.v1DefaultPreserved, true)
assert.equal(evidence.generation.activeSourceModified, false)
assert.equal(evidence.candidateDeployment.attempted, true)
assert.equal(evidence.candidateDeployment.success, true)
assert.equal(evidence.candidateDeployment.cron, '*/5 * * * *')
assert.equal(evidence.observation.polls, 18)
assert.equal(evidence.observation.snapshots.length, 2)
for (const snapshot of evidence.observation.snapshots) {
  assert.equal(snapshot.streamCount, 300)
  assert.equal(snapshot.sourceMode, 'real')
  assert.equal(snapshot.payloadProvider, 'twitch')
  assert.equal(snapshot.categoryContractVersion, 'category-source-v2-candidate')
  assert.equal(snapshot.stateEncodingFormat, '2bit-hex-v1')
  assert.equal(snapshot.stateItemCount, 300)
  assert.equal(snapshot.bothPresent, 300)
  assert.equal(snapshot.bothEmpty, 0)
  assert.equal(snapshot.providerIdOnly, 0)
  assert.equal(snapshot.categoryNameOnly, 0)
  assert.equal(snapshot.categoryRefCount, 300)
  assert.equal(snapshot.nullRefCount, 0)
  assert.equal(snapshot.presentRefCount, 300)
  assert.equal(snapshot.invalidRefCount, 0)
  assert.equal(snapshot.unresolvedCategoryIds, 0)
}
assert.equal(evidence.observation.snapshots[0].bucketMinute, '2026-07-31T09:40:00.000Z')
assert.equal(evidence.observation.snapshots[1].bucketMinute, '2026-07-31T09:45:00.000Z')
for (const gate of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(evidence.observation[gate], true, `${gate}: must pass`)
}
assert.equal(evidence.rollback.attempted, true)
assert.equal(evidence.rollback.success, true)
assert.equal(evidence.rollback.config, paths.twitchPermanent)
assert.equal(evidence.rollback.cron, '*/5 * * * *')
assert.equal(evidence.rollback.categorySourceV2ObservationEnabled, false)
assert.equal(evidence.decision.observationAccepted, true)
assert.equal(evidence.decision.sourceCompletenessDemonstrated, true)
for (const key of ['semanticMappingAuthorized', 'stabilityClockStartAuthorized', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) {
  assert.equal(evidence.decision[key], false, `${key}: must remain false`)
}
for (const key of ['kickChanged', 'twitchCadenceChanged', 'kickCadenceChanged', 'retentionChanged', 'backfillPerformed', 'crossProviderIdentityAllowed', 'combinedProviderRankingAllowed']) {
  assert.equal(evidence.boundaries[key], false, `${key}: must remain false`)
}

assert.equal(retirement.status, 'evidence_frozen_execution_path_retired')
assert.equal(retirement.sourceEvidence, paths.evidence)
assert.equal(retirement.execution.workflowRunId, evidence.execution.workflowRunId)
assert.equal(retirement.execution.observeJobId, evidence.execution.observeJobId)
assert.equal(retirement.execution.artifactId, evidence.artifact.id)
assert.equal(retirement.execution.artifactDigest, evidence.artifact.digest)
assert.equal(retirement.execution.evidenceJsonSha256, evidence.artifact.evidenceJsonSha256)
assert.equal(retirement.retirement.consumedTriggerRetiredOnMerge, true)
assert.equal(retirement.retirement.temporaryExecutionPathRetirementPending, false)
assert.equal(retirement.retirement.executionPathRetirementPr, 698)
assert.equal(retirement.retirement.executionPathRetirementContract, paths.executionRetirement)
assert.equal(retirement.pendingDecisions.temporaryExecutionPathRetirement, false)
assert.equal(retirement.pendingDecisions.semanticMapping, true)
assert.equal(retirement.pendingDecisions.newStabilityClock, true)
for (const value of Object.values(retirement.authorizedNow)) assert.equal(value, false)
assert.equal(executionRetirement.status, 'retired_on_merge')

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const twitch = read(paths.twitchPermanent)
const kick = read(paths.kickPermanent)
assert.equal(cron(twitch), '*/5 * * * *')
assert.equal(cron(kick), '*/5 * * * *')
assert.equal(twitch.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kick.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)

console.log(JSON.stringify({
  ok: true,
  status: evidence.status,
  workflowRunId: evidence.execution.workflowRunId,
  observeJobId: evidence.execution.observeJobId,
  artifactId: evidence.artifact.id,
  snapshots: evidence.observation.snapshots.length,
  allObservationGatesPass: true,
  canonicalRollbackSucceeded: evidence.rollback.success,
  triggerRetired: true,
  executionPathRetired: true,
  semanticMappingAuthorized: false,
  stabilityClockStartAuthorized: false,
  publicCategoryUiAuthorized: false,
}, null, 2))
