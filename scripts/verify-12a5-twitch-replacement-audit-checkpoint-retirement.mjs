import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const evidencePath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-evidence.json'
const retirementPath = 'docs/audits/12a5-twitch-replacement-audit-checkpoint-retirement.json'
const retiredPaths = [
  'docs/audits/12a5-twitch-replacement-audit-checkpoint-trigger.json',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint.yml',
  '.github/workflows/analytics-12a5-twitch-replacement-audit-checkpoint-reporter.yml',
]
for (const path of [evidencePath, retirementPath]) assert.equal(existsSync(path), true, `${path}: missing`)
for (const path of retiredPaths) assert.equal(existsSync(path), false, `${path}: must be retired`)
const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const evidence = json(evidencePath)
const retirement = json(retirementPath)

assert.equal(evidence.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-evidence-v1')
assert.equal(evidence.status, 'checkpoint_failed')
assert.equal(evidence.mode, 'checkpoint')
assert.equal(evidence.trigger.pr, 667)
assert.equal(evidence.trigger.mergeSha, 'ee8125ecd12f7ec620af13fd78d9a3c3c7e18f98')
assert.equal(evidence.execution.workflowRunId, 30478338654)
assert.equal(evidence.execution.checkpointJobId, 90665697236)
assert.equal(evidence.execution.artifactId, 8734980337)
assert.equal(evidence.execution.artifactDigest, 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b')
assert.equal(evidence.execution.evidenceJsonSha256, '041f942501f1740f2ea0f3c7a77b04aeea0d084906af0faf625f370c01178f6f')
assert.equal(evidence.window.expectedSlots, 154)
assert.equal(evidence.slotContinuity.observedDistinctSlots, 151)
assert.equal(evidence.slotContinuity.coverageRatio, 0.980519)
assert.deepEqual(evidence.slotContinuity.missingSlots, ['2026-07-29T07:20:00.000Z', '2026-07-29T07:25:00.000Z', '2026-07-29T07:30:00.000Z'])
assert.equal(evidence.slotContinuity.maximumConsecutiveMissingSlots, 3)
assert.equal(evidence.categoryIntegrity.totalCategoryRefs, 45287)
assert.equal(evidence.categoryIntegrity.presentCategoryRefs, 45039)
assert.equal(evidence.categoryIntegrity.missingCategoryRefs, 248)
assert.equal(evidence.categoryIntegrity.invalidCategoryRefs, 0)
assert.equal(evidence.categoryIntegrity.unresolvedCategoryIds, 0)
assert.equal(evidence.categoryIntegrity.categoryReferenceCoverageRatio, 0.994524)
assert.deepEqual(evidence.failedHardStops, ['slotCoveragePass', 'consecutiveMissingSlotsPass', 'categoryReferenceCoveragePass'])
assert.equal(evidence.runtimeIntegrity.readOnly, true)
assert.equal(evidence.runtimeIntegrity.cadencePass, true)
assert.equal(evidence.runtimeIntegrity.twitchPermanentBindingPass, true)
assert.equal(evidence.runtimeIntegrity.kickPermanentBaselinePass, true)
assert.equal(evidence.runtimeIntegrity.twitchProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.kickProviderLeakageRows, 0)
assert.equal(evidence.runtimeIntegrity.publicExposureStillUnauthorized, true)
assert.equal(evidence.storage.providerPass, true)
assert.equal(evidence.storage.accountPass, true)
assert.equal(evidence.decision.auditAccepted, false)
assert.equal(evidence.decision.publicCutoverAuthorized, false)
assert.equal(evidence.decision.productionMutationPerformed, false)
assert.equal(evidence.decision.kickMutationPerformed, false)
assert.equal(evidence.decision.automaticClockResetAuthorized, false)

assert.equal(retirement.schemaVersion, 'viewloom-12a5-twitch-replacement-audit-checkpoint-retirement-v1')
assert.equal(retirement.checkpointOutcome, 'checkpoint_failed')
assert.equal(retirement.execution.workflowRunId, evidence.execution.workflowRunId)
assert.equal(retirement.execution.checkpointJobId, evidence.execution.checkpointJobId)
assert.equal(retirement.execution.artifactId, evidence.execution.artifactId)
assert.deepEqual(retirement.retiredPaths, retiredPaths)
assert.equal(retirement.boundaries.rerunAuthorized, false)
assert.equal(retirement.boundaries.automaticRecoveryAuthorized, false)
assert.equal(retirement.boundaries.automaticClockResetAuthorized, false)
assert.equal(retirement.boundaries.kickChanged, false)
assert.equal(retirement.boundaries.publicCategoryUiAuthorized, false)

if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_HEAD_REF === 'work-659-twitch-category-source-v2-observation-rerun-run-recovery') {
  const targetSha = '78cf5759840aa7819b34c153d7521dab7df6bacc'
  const base = 'https://api.github.com/repos/badjoke-lab/viewloom'
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'viewloom-observation-rerun-recovery',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  const get = async (url) => {
    const response = await fetch(url, { headers })
    const body = await response.text()
    if (!response.ok) throw new Error(`github_api_${response.status}:${body.slice(0, 500)}`)
    return JSON.parse(body)
  }
  const runs = await get(`${base}/actions/workflows/323959988/runs?branch=main&event=push&per_page=30`)
  const target = (runs.workflow_runs || []).find((run) => run.head_sha === targetSha && run.event === 'push')
  const jobs = target ? await get(`${base}/actions/runs/${target.id}/jobs?per_page=100`) : { jobs: [] }
  const artifacts = target ? await get(`${base}/actions/runs/${target.id}/artifacts?per_page=100`) : { artifacts: [] }
  console.log(`VIEWLOOM_OBSERVATION_RERUN_RECOVERY=${JSON.stringify({
    targetFound: Boolean(target),
    target: target ? {
      id: target.id,
      runNumber: target.run_number,
      runAttempt: target.run_attempt,
      status: target.status,
      conclusion: target.conclusion,
      event: target.event,
      headSha: target.head_sha,
      createdAt: target.created_at,
      updatedAt: target.updated_at,
    } : null,
    jobs: (jobs.jobs || []).map((job) => ({ id: job.id, name: job.name, status: job.status, conclusion: job.conclusion })),
    artifacts: (artifacts.artifacts || []).map((artifact) => ({
      id: artifact.id,
      name: artifact.name,
      sizeBytes: artifact.size_in_bytes,
      expired: artifact.expired,
      digest: artifact.digest,
      createdAt: artifact.created_at,
      expiresAt: artifact.expires_at,
    })),
  })}`)
}

console.log(JSON.stringify({
  ok: true,
  outcome: evidence.status,
  failedHardStops: evidence.failedHardStops,
  checkpointPathRetired: true,
  publicCutoverAuthorized: false,
}, null, 2))
