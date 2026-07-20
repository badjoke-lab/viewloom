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
  implementationContract: 'docs/audits/12a4-twitch-permanent-category-capture-package-contract.json',
  implementationAcceptance: 'docs/audits/12a4-twitch-permanent-category-capture-package-acceptance.json',
  releaseContract: 'docs/audits/12a4-twitch-permanent-category-release-contract.json',
  releaseAcceptance: 'docs/audits/12a4-twitch-permanent-category-release-package-acceptance.json',
  releaseTrigger: 'docs/audits/12a4-twitch-permanent-category-release-trigger.json',
  policy: 'docs/operations/development-and-deployment-policy.md',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kick: 'workers/collector-kick/wrangler.toml',
}
for (const [name, path] of Object.entries(files)) {
  if (name !== 'releaseTrigger') assert.equal(existsSync(path), true, `${path}: missing`)
}

const spec = read(files.spec)
const plan = read(files.plan)
const roadmap = read(files.roadmap)
const schedule = read(files.schedule)
const wip = read(files.wip)
const gate = json(files.gate)
const implementationContract = json(files.implementationContract)
const implementationAcceptance = json(files.implementationAcceptance)
const releaseContract = json(files.releaseContract)
const releaseAcceptance = json(files.releaseAcceptance)
const triggerPresent = existsSync(files.releaseTrigger)

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
  'Current gate: 12A-4-21 Twitch release package accepted, exact trigger pending',
  'Current action: exact Twitch release trigger',
  'runtime category capture remains inactive',
  'Kick remains unauthorized',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)
for (const fragment of [
  '12A-4-21 Twitch permanent release package accepted',
  'Twitch permanent runtime active no',
  'Exact release trigger current no',
  'Kick permanent implementation authorized no',
  'Existing Worker cadence */5 * * * * unchanged',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)
for (const fragment of [
  '# 12A-4-21 Twitch permanent category release package accepted',
  'PR #627 is merged and accepted by PR #628',
  'Twitch permanent runtime capture remains inactive',
  'Validation run: `29723684031`',
  'Kick implementation authorized: no',
]) assert.ok(wip.includes(fragment), `WIP missing: ${fragment}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v25')
assert.equal(gate.status, '12a4_twitch_permanent_category_release_package_accepted_trigger_pending')
assert.equal(gate.currentWorkstream.phase, '12A-4-21')
assert.equal(gate.currentWorkstream.name, 'Twitch permanent category release package accepted; exact trigger pending')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.releasePackagePr, 627)
assert.equal(gate.currentWorkstream.releasePackageAcceptancePr, 628)
assert.equal(gate.currentWorkstream.releasePackageAccepted, true)
assert.equal(gate.currentWorkstream.productionExecutionIncluded, false)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.exactReleaseTriggerCurrent, false)
assert.equal(gate.currentWorkstream.freshReadOnlyPreflightRequired, true)
assert.equal(gate.currentWorkstream.initialConsecutiveCategorySnapshotsRequired, 2)
assert.equal(gate.currentWorkstream.automaticRollbackRequired, true)
assert.equal(gate.currentWorkstream.categoryUiAuthorized, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized',
])

const releaseState = gate.twitchPermanentCategoryReleasePackage
assert.equal(releaseState.status, 'accepted')
assert.equal(releaseState.packagePr, 627)
assert.equal(releaseState.packageCandidateHeadSha, 'b1250cfd16996556eb99582dbd10599d667fb730')
assert.equal(releaseState.packageMergeSha, '312f2c4d54dc4f881aa35e58140bd504b1b2229c')
assert.equal(releaseState.acceptancePr, 628)
assert.equal(releaseState.workflowRunId, 29723684031)
assert.equal(releaseState.workflowJobId, 88291928546)
assert.equal(releaseState.exactTriggerPresent, false)
assert.equal(releaseState.productionRuntimeCaptureStarted, false)
assert.equal(releaseState.productionWorkerPublished, false)
assert.equal(releaseState.remoteD1OperationPerformed, false)
assert.equal(releaseState.kickChanged, false)

assert.equal(implementationContract.status, 'accepted')
assert.equal(implementationContract.acceptance.pr, 626)
assert.equal(implementationAcceptance.status, 'accepted')
assert.equal(releaseContract.status, 'accepted')
assert.equal(releaseContract.acceptance.pr, 628)
assert.equal(releaseContract.acceptance.releasePackagePr, 627)
assert.equal(releaseContract.acceptance.mergeSha, releaseAcceptance.releasePackageMergeSha)
assert.equal(releaseContract.acceptance.workflowRunId, releaseAcceptance.validationWorkflowRunId)
assert.equal(releaseContract.acceptance.workflowJobId, releaseAcceptance.validationWorkflowJobId)
assert.equal(releaseContract.acceptance.triggerPresent, false)
assert.equal(releaseContract.acceptance.productionRuntimeCaptureStarted, false)
assert.equal(releaseContract.acceptance.productionWorkerPublished, false)
assert.equal(releaseContract.acceptance.remoteD1OperationPerformed, false)
assert.equal(releaseContract.acceptance.kickChanged, false)
assert.equal(releaseAcceptance.status, 'accepted')
assert.equal(releaseAcceptance.acceptancePr, 628)
assert.equal(Object.values(releaseAcceptance.productionBoundary).every((value) => value === false), true)

if (triggerPresent) {
  const trigger = json(files.releaseTrigger)
  assert.equal(trigger.schemaVersion, releaseContract.trigger.schemaVersion)
  assert.equal(trigger.status, 'armed')
  assert.equal(trigger.provider, 'twitch')
  assert.equal(trigger.oneTime, true)
  assert.equal(trigger.confirmation, releaseContract.trigger.confirmation)
  assert.equal(trigger.implementationPr, 625)
  assert.equal(trigger.implementationMergeSha, '66f2b544e22dafc52e76d684cc2844c734eb8c09')
  assert.equal(trigger.acceptancePr, 626)
  assert.equal(trigger.acceptanceMergeSha, '3bf0b407d27eac9de1f8b2480a223d244f3f1a30')
  assert.equal(trigger.releasePackagePr, 627)
  assert.equal(trigger.releasePackageMergeSha, '312f2c4d54dc4f881aa35e58140bd504b1b2229c')
  assert.equal(Number.isFinite(Date.parse(trigger.startAt)), true)
}

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
  trackingIssue: 623,
  implementationPackageAccepted: true,
  releasePackageAccepted: true,
  exactReleaseTriggerPresent: triggerPresent,
  twitchRuntimeActive: false,
  kickAuthorized: false,
  nextAction: 'exact-one-file-release-trigger',
}, null, 2))
