import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const retirementPath = 'docs/audits/12a5-twitch-category-source-v2-observation-execution-path-retirement.json'
const evidencePath = 'docs/audits/12a5-twitch-category-source-v2-observation-success-evidence.json'
const evidenceRetirementPath = 'docs/audits/12a5-twitch-category-source-v2-observation-evidence-retirement.json'
const permanentTwitchConfig = 'workers/collector-twitch/wrangler.category-permanent.toml'
const permanentKickConfig = 'workers/collector-kick/wrangler.category-permanent.toml'
for (const path of [retirementPath, evidencePath, evidenceRetirementPath, permanentTwitchConfig, permanentKickConfig]) {
  assert.equal(existsSync(path), true, `${path}: missing`)
}

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const retirement = json(retirementPath)
const evidence = json(evidencePath)
const evidenceRetirement = json(evidenceRetirementPath)

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-category-source-v2-observation-execution-path-retirement-v1')
assert.equal(retirement.status, 'retired_on_merge')
assert.equal(retirement.phase, '12A-5B-R2')
assert.equal(retirement.trackingIssue, 659)
assert.equal(retirement.provider, 'twitch')
assert.equal(retirement.retirementPr, 698)
assert.equal(retirement.baseSha, 'b8bf65ca6ce3c9c6e2f79e93b090fa6d4158bd34')
assert.equal(retirement.sourceEvidence, evidencePath)
assert.equal(retirement.sourceEvidenceFreezePr, 697)
assert.equal(retirement.sourceEvidenceFreezeMergeSha, retirement.baseSha)

assert.equal(evidence.status, 'observation_accepted')
assert.equal(evidence.execution.workflowRunId, 30620512044)
assert.equal(evidence.execution.observeJobId, 91123756273)
assert.equal(evidence.artifact.id, 8789385200)
assert.equal(evidence.artifact.digest, 'sha256:dfff17be40f9766c5d4cc4ead6eada761e00ba760b7ce133fce0e9b4f427fc10')
assert.equal(evidence.artifact.evidenceJsonSha256, 'e2ceb0ce88dab1f03fd374004488fda9381f223a5dde6d139686c06218ce6bbe')
assert.equal(evidence.observation.snapshots.length, 2)
for (const gate of ['consecutiveSnapshotPass', 'stateIntegrityPass', 'dictionaryResolutionPass', 'providerSeparationPass', 'freshnessPass']) {
  assert.equal(evidence.observation[gate], true, `${gate}: must pass`)
}
assert.equal(evidence.rollback.attempted, true)
assert.equal(evidence.rollback.success, true)
assert.equal(evidence.decision.sourceCompletenessDemonstrated, true)

assert.equal(retirement.execution.workflowRunId, evidence.execution.workflowRunId)
assert.equal(retirement.execution.observeJobId, evidence.execution.observeJobId)
assert.equal(retirement.execution.artifactId, evidence.artifact.id)
assert.equal(retirement.execution.artifactDigest, evidence.artifact.digest)
assert.equal(retirement.execution.evidenceJsonSha256, evidence.artifact.evidenceJsonSha256)
assert.equal(retirement.execution.conclusion, 'success')
assert.equal(retirement.execution.canonicalRollbackSucceeded, true)

const expectedRetired = [
  '.github/workflows/analytics-12a5-twitch-category-source-v2-observation-execution.yml',
  'scripts/run-12a5-twitch-category-source-v2-observation.mjs',
  'scripts/build-12a5-twitch-category-source-v2-observation-worker.mjs',
  'scripts/verify-12a5-twitch-category-source-v2-observation-trigger.mjs',
  'execution-packages/twitch-category-source-v2-observation/wrangler.toml',
]
assert.deepEqual(retirement.retiredPaths, expectedRetired)
for (const path of expectedRetired) assert.equal(existsSync(path), false, `${path}: temporary execution path must be retired`)
assert.equal(existsSync('docs/audits/12a5-twitch-category-source-v2-observation-trigger.json'), false, 'consumed trigger must remain retired')
for (const path of retirement.retainedAuditPaths) assert.equal(existsSync(path), true, `${path}: retained audit path missing`)

assert.equal(evidenceRetirement.status, 'evidence_frozen_execution_path_retired')
assert.equal(evidenceRetirement.retirement.temporaryExecutionPathRetirementPending, false)
assert.equal(evidenceRetirement.retirement.executionPathRetirementPr, 698)
assert.equal(evidenceRetirement.retirement.executionPathRetirementContract, retirementPath)
assert.equal(evidenceRetirement.nextGate, retirement.nextGate)

assert.equal(retirement.runtimeAfterRetirement.canonicalTwitchConfig, permanentTwitchConfig)
assert.equal(retirement.runtimeAfterRetirement.twitchCron, '*/5 * * * *')
assert.equal(retirement.runtimeAfterRetirement.kickCron, '*/5 * * * *')
assert.equal(retirement.runtimeAfterRetirement.categorySourceV2ObservationEnabled, false)
assert.equal(retirement.runtimeAfterRetirement.productionObservationWorkflowPresent, false)
assert.equal(retirement.runtimeAfterRetirement.exactObservationTriggerPresent, false)
for (const value of Object.values(retirement.authorization)) assert.equal(value, false)

const read = (path) => readFileSync(path, 'utf8')
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
const twitch = read(permanentTwitchConfig)
const kick = read(permanentKickConfig)
assert.equal(cron(twitch), '*/5 * * * *')
assert.equal(cron(kick), '*/5 * * * *')
assert.equal(twitch.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kick.includes('CATEGORY_SOURCE_V2_OBSERVATION_ENABLED'), false)
assert.equal(kick.includes('category-source-v2-candidate'), false)

console.log(JSON.stringify({
  ok: true,
  status: retirement.status,
  retirementPr: retirement.retirementPr,
  retiredPaths: retirement.retiredPaths.length,
  workflowRunId: retirement.execution.workflowRunId,
  observeJobId: retirement.execution.observeJobId,
  artifactId: retirement.execution.artifactId,
  canonicalRollbackSucceeded: retirement.execution.canonicalRollbackSucceeded,
  semanticMappingAuthorized: false,
  stabilityClockStartAuthorized: false,
  publicCategoryUiAuthorized: false,
  nextGate: retirement.nextGate,
}, null, 2))
