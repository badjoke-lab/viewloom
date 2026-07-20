import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const files = {
  spec: 'docs/product/category-capture-permanent-rollout-spec.md',
  plan: 'docs/product/category-capture-permanent-rollout-plan.md',
  roadmap: 'docs/product/current-roadmap.md',
  schedule: 'docs/product/current-schedule.md',
  gate: 'docs/audits/12a2-current-gate-state.json',
  wip: 'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  packageContract: 'docs/audits/12a4-twitch-permanent-category-capture-package-contract.json',
  packageAcceptance: 'docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json',
  policy: 'docs/operations/development-and-deployment-policy.md',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kick: 'workers/collector-kick/wrangler.toml',
}
for (const path of Object.values(files)) assert.equal(existsSync(path), true, `${path}: missing`)

const spec = read(files.spec)
const plan = read(files.plan)
const roadmap = read(files.roadmap)
const schedule = read(files.schedule)
const wip = read(files.wip)
const gate = json(files.gate)
const contract = json(files.packageContract)
const acceptance = json(files.packageAcceptance)

for (const fragment of [
  'Decision PR: #624',
  'Twitch and Kick remain separate data products',
  'preserve the existing `*/5 * * * *` Worker cron',
  'Kick permanent category capture is not authorized',
  'at least seven stable days',
]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)
for (const fragment of [
  'Phase 12A-4-20 — Twitch implementation package',
  'Phase 12A-4-21 — exact Twitch deployment',
  'Phase 12A-4-22 — Twitch 24–48 hour observation',
  'A temporary GitHub Actions observation schedule is allowed, but no new Worker cron is allowed',
]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)
for (const fragment of [
  'Current gate: 12A-4-20 Twitch permanent package accepted, deployment pending',
  'Next gate: 12A-4-21 exact Twitch production deployment',
  'Runtime category capture is still inactive',
  'Kick permanent category capture is not authorized',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)
for (const fragment of [
  '12A-4-20 Twitch permanent implementation package accepted',
  'Twitch permanent runtime active no',
  'Exact release trigger current no',
  'Kick permanent implementation authorized no',
  'Existing Worker cadence */5 * * * * unchanged',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

const acceptedPackageWip = [
  '# 12A-4-20 Twitch permanent category capture package accepted',
  'PR #625 is merged',
  'Twitch permanent runtime capture is still inactive',
  'Validation run: `29721764872`',
  'Kick implementation authorized: no',
].every((fragment) => wip.includes(fragment))
const releasePackageWip = [
  '# 12A-4-21 Twitch permanent category release package candidate',
  'Production release from PR #627: no',
  'Exact one-file trigger present: no',
  'Twitch runtime active: no',
  'Kick implementation authorized: no',
].every((fragment) => wip.includes(fragment))
assert.equal(acceptedPackageWip || releasePackageWip, true, 'WIP must describe the accepted package or the authorized dormant release candidate')

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v24')
assert.equal(gate.status, '12a4_twitch_permanent_category_package_accepted_deployment_pending')
assert.equal(gate.currentWorkstream.phase, '12A-4-20')
assert.equal(gate.currentWorkstream.name, 'Twitch permanent category capture package accepted; deployment pending')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.packagePr, 625)
assert.equal(gate.currentWorkstream.packageAcceptancePr, 626)
assert.equal(gate.currentWorkstream.packageAccepted, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.exactDeploymentTriggerCurrent, false)
assert.equal(gate.currentWorkstream.rollbackConfigAccepted, true)
assert.equal(gate.currentWorkstream.observerAccepted, true)
assert.equal(gate.currentWorkstream.categoryUiAuthorized, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized',
])
assert.ok(gate.closedBlockers.includes('twitch_permanent_category_capture_not_implemented'))

const packageState = gate.twitchPermanentCategoryCapturePackage
assert.equal(packageState.status, 'accepted')
assert.equal(packageState.packagePr, 625)
assert.equal(packageState.packageCandidateHeadSha, 'e975d1b886736efac8d7d6ca8872f533fb249aed')
assert.equal(packageState.packageMergeSha, '66f2b544e22dafc52e76d684cc2844c734eb8c09')
assert.equal(packageState.acceptancePr, 626)
assert.equal(packageState.workflowRunId, 29721764872)
assert.equal(packageState.workflowJobId, 88286067503)
assert.equal(packageState.artifactId, 8452621374)
assert.equal(packageState.artifactDigest, 'sha256:08f2ad41f4b0a72835060553d23aa685bcdd101e8e503a4bd3c1f91e200411fa')
assert.equal(packageState.productionDeploymentIncluded, false)
assert.equal(packageState.runtimeCaptureStarted, false)
assert.equal(packageState.remoteD1OperationPerformed, false)
assert.equal(packageState.kickChanged, false)

assert.equal(contract.status, 'accepted')
assert.equal(contract.acceptance.pr, 626)
assert.equal(contract.acceptance.packagePr, 625)
assert.equal(contract.acceptance.packageMergeSha, acceptance.packageMergeSha)
assert.equal(contract.acceptance.workflowRunId, acceptance.packageWorkflowRunId)
assert.equal(contract.acceptance.workflowJobId, acceptance.packageWorkflowJobId)
assert.equal(contract.acceptance.artifactId, acceptance.packageArtifactId)
assert.equal(contract.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(contract.acceptance.productionWorkerDeployed, false)
assert.equal(contract.acceptance.remoteD1OperationPerformed, false)
assert.equal(contract.acceptance.kickChanged, false)
assert.equal(acceptance.status, 'accepted')
assert.equal(acceptance.acceptancePr, 626)
assert.equal(Object.values(acceptance.productionBoundary).every((value) => value === false), true)

const normal = read(files.normalTwitch)
const permanent = read(files.permanentTwitch)
const kick = read(files.kick)
const toml = (source, key) => source.match(new RegExp(`^${key}\\s*=\\s*"([^"]+)"$`, 'm'))?.[1] ?? null
const cron = (source) => source.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1] ?? null
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(normal), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=\s*"true"/.test(permanent), true)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kick), false)
assert.equal(cron(normal), '*/5 * * * *')
assert.equal(cron(permanent), cron(normal))
assert.equal(toml(permanent, 'name'), toml(normal, 'name'))
assert.equal(toml(permanent, 'database_id'), toml(normal, 'database_id'))
assert.notEqual(toml(permanent, 'database_id'), toml(kick, 'database_id'))

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  activeWip: releasePackageWip ? '12A-4-21-release-package-candidate' : '12A-4-20-package-accepted',
  trackingIssue: 623,
  packageAccepted: true,
  packagePr: 625,
  acceptancePr: 626,
  twitchRuntimeActive: false,
  exactReleaseTriggerCurrent: false,
  kickAuthorized: false,
  nextPhase: '12A-4-21',
}, null, 2))
