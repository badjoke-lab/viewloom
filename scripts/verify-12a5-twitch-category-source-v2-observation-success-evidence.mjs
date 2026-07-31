import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const paths = {
  evidence: 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json',
  retirement: 'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json',
  trigger: 'docs/audits/12a5-twitch-category-source-v2-observation-trigger.json',
  workflow: '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  runner: 'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  generator: 'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  config: 'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
  twitchPermanent: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kickPermanent: 'workers/collector-kick/wrangler.category-permanent.toml',
}
for (const [key, path] of Object.entries(paths)) {
  if (key === 'trigger') continue
  assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(paths.trigger), false, `${paths.trigger}: consumed trigger must be retired`)

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const evidence = json(paths.evidence)
const retirement = json(paths.retirement)

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-success-evidence-v1')
assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.phase, '12A-5B-R2')
assert.equal(evidence.trackingIssue, 659)
assert.equal(evidence.provider, 'twitch')

assert.equal(evidence.trigger.pr, 695)
assert.equal(evidence.trigger.mergeSha, '78cf5759840aa7819b34c153d7521dab7df6bacc')
assert.equal(evidence.trigger.confirmation, 'RERUN_TWITCH_CATEGORY_SOURCE_V2_OBSERVATION_AFTER_RECOVERY')
assert.equal(evidence.trigger.executeImmediately, true)
assert.equal(evidence.trigger.startAtPresent, false)
assert.equal(evidence.trigger.packagePr, 692)
assert.equal(evidence.trigger.packageMergeSha, '19e2d5b44a0088dce046b8e34f028efebf1d7d24')
assert.equal(evidence.trigger.acceptancePr, 693)
assert.equal(evidence.trigger.policyPr, 694)
assert.equal(evidence.trigger.policyMergeSha, '65c78019411410ae6fd4ac7fea110727c03ff794')

assert.equal(evidence.sourceFailure.workflowRunId, 30608982443)
assert.equal(evidence.sourceFailure.observeJobId, 91087362002)
assert.equal(evidence.sourceFailure.artifactId, 8784691101)
assert.equal(evidence.sourceFailure.candidateActivated, false)
assert.equal(evidence.sourceFailure.snapshots, 0)
assert.equal(evidence.sourceFailure.canonicalRollbackSucceeded, true)

assert.equal(evidence.execution.workflowId, 323959988)
assert.equal(evidence.execution.workflowRunId, 30620512044)
assert.equal(evidence.execution.workflowRunNumber, 17)
assert.equal(evidence.execution.runAttempt, 1)
assert.equal(evidence.execution.runConclusion, 'success')
assert.equal(evidence.execution.headSha, evidence.trigger.mergeSha)
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
assert.equal(evidence.preflight.lastError, null)

assert.equal(evidence.generation.outputDirectory, 'workers/collector-twitch/.generated-v2-observation')
assert.equal(evidence.generation.contractVersion, 'category-source-v2-candidate')
assert.deepEqual(evidence.generation.generatedFiles, ['entry.ts', 'index-category.ts'])
assert.equal(evidence.generation.v1DefaultPreserved, true)
assert.equal(evidence.generation.activeSourceModified, false)

assert.equal(evidence.candidateDeployment.attempted, true)
assert.equal(evidence.candidateDeployment.success, true)
assert.equal(evidence.candidateDeployment.worker, 'viewloom-collector-twitch')
assert.equal(evidence.candidateDeployment.cron, '*/5 * * * *')
assert.equal(evidence.candidateDeployment.versionId, '58c5c7a7-ef19-4f11-b23f-c6c4f93085d9')
assert.equal(evidence.candidateDeployment.categorySourceV2ObservationEnabled, true)

assert.equal(evidence.observation.pollIntervalMs, 30000)
assert.equal(evidence.observation.maximumObservationMs, 960000)
assert.equal(evidence.observation.polls, 18)
assert.equal(evidence.observation.snapshots.length, 2)
const [first, second] = evidence.observation.snapshots
assert.equal(first.bucketMinute, '2026-07-31T09:40:00.000Z')
assert.equal(second.bucketMinute, '2026-07-31T09:45:00.000Z')
for (const snapshot of evidence.observation.snapshots) {
  assert.equal(snapshot.streamCount, 300)
  assert.equal(snapshot.sourceMode, 'real')
  assert.equal(snapshot.payloadProvider, 'twitch')
  assert.equal(snapshot.categoryContractVersion, 'category-source-v2-candidate')
  assert.equal(snapshot.stateEncodingFormat, '2bit-hex-v1')
  assert.equal(snapshot.stateItemCount, 300)
  assert.equal(snapshot.packedHexCharacters, 150)
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
assert.equal(first.categoryIdCount, 84)
assert.equal(first.payloadBytes, 39334)
assert.equal(second.categoryIdCount, 85)
assert.equal(second.payloadBytes, 39474)
for (const gate of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(evidence.observation[gate], true, `${gate}: must pass`)
}

assert.equal(evidence.rollback.attempted, true)
assert.equal(evidence.rollback.success, true)
assert.equal(evidence.rollback.worker, 'viewloom-collector-twitch')
assert.equal(evidence.rollback.config, paths.twitchPermanent)
assert.equal(evidence.rollback.cron, '*/5 * * * *')
assert.equal(evidence.rollback.versionId, 'bf25c4ad-a6df-456d-aa5c-090ac0cf7b2c')
assert.equal(evidence.rollback.categorySourceV2ObservationEnabled, false)

assert.equal(evidence.decision.observationAccepted, true)
assert.equal(evidence.decision.sourceCompletenessDemonstrated, true)
for (const key of ['semanticMappingAuthorized', 'stabilityClockStartAuthorized', 'finalModeAuthorized', 'publicCategoryUiAuthorized']) {
  assert.equal(evidence.decision[key], false, `${key}: must remain false`)
}
assert.deepEqual(evidence.boundaries.directD1Statements, ['SELECT', 'WITH'])
for (const key of ['kickChanged', 'twitchCadenceChanged', 'kickCadenceChanged', 'retentionChanged', 'backfillPerformed', 'crossProviderIdentityAllowed', 'combinedProviderRankingAllowed']) {
  assert.equal(evidence.boundaries[key], false, `${key}: must remain false`)
}

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-evidence-retirement-v1')
assert.equal(retirement.status, 'evidence_frozen_trigger_retired')
assert.equal(retirement.phase, evidence.phase)
assert.equal(retirement.trackingIssue, evidence.trackingIssue)
assert.equal(retirement.provider, evidence.provider)
assert.equal(retirement.sourceEvidence, paths.evidence)
assert.equal(retirement.execution.workflowRunId, evidence.execution.workflowRunId)
assert.equal(retirement.execution.observeJobId, evidence.execution.observeJobId)
assert.equal(retirement.execution.artifactId, evidence.artifact.id)
assert.equal(retirement.execution.artifactDigest, evidence.artifact.digest)
assert.equal(retirement.execution.evidenceJsonSha256, evidence.artifact.evidenceJsonSha256)
assert.equal(retirement.execution.conclusion, 'success')
assert.equal(retirement.retirement.consumedTriggerPath, paths.trigger)
assert.equal(retirement.retirement.consumedTriggerRetiredOnMerge, true)
assert.equal(retirement.retirement.temporaryExecutionPathRetirementPending, true)
assert.equal(retirement.acceptedResult.twoConsecutiveSnapshots, true)
assert.equal(retirement.acceptedResult.canonicalRollbackSucceeded, true)
for (const value of Object.values(retirement.pendingDecisions)) assert.equal(value, true)
for (const value of Object.values(retirement.authorizedNow)) assert.equal(value, false)

const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(cron(read(paths.twitchPermanent)), '*/5 * * * *')
assert.equal(cron(read(paths.kickPermanent)), '*/5 * * * *')
assert.equal(read(paths.twitchPermanent).includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(read(paths.kickPermanent).includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)

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
  temporaryExecutionPathRetirementPending: true,
  semanticMappingAuthorized: false,
  stabilityClockStartAuthorized: false,
  publicCategoryUiAuthorized: false,
}, null, 2))
