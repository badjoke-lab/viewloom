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
  startAcceptance: 'docs/audits/12a4-twitch-permanent-category-start-acceptance.json',
  observationContract: 'docs/audits/12a4-twitch-permanent-category-observation-contract.json',
  releaseTrigger: 'docs/audits/12a4-twitch-permanent-category-release-trigger.json',
  releaseWorkflow: '.github/workflows/analytics-12a4-twitch-permanent-category-release.yml',
  observationWorkflow: '.github/workflows/analytics-12a4-twitch-permanent-category-observation.yml',
  evaluator: 'scripts/evaluate-12a4-twitch-permanent-category-observation.mjs',
  rollback: 'scripts/run-12a4-twitch-permanent-category-observation-rollback.mjs',
  normalTwitch: 'workers/collector-twitch/wrangler.toml',
  permanentTwitch: 'workers/collector-twitch/wrangler.category-permanent.toml',
  kick: 'workers/collector-kick/wrangler.toml',
}
for (const [name, path] of Object.entries(files)) {
  if (!['releaseTrigger', 'releaseWorkflow'].includes(name)) assert.equal(existsSync(path), true, `${path}: missing`)
}
assert.equal(existsSync(files.releaseTrigger), false, 'exact release trigger must be retired')
assert.equal(existsSync(files.releaseWorkflow), false, 'release execution workflow must be retired')

const spec = read(files.spec)
const plan = read(files.plan)
const roadmap = read(files.roadmap)
const schedule = read(files.schedule)
const wip = read(files.wip)
const gate = json(files.gate)
const start = json(files.startAcceptance)
const observation = json(files.observationContract)
const workflow = read(files.observationWorkflow)
const evaluator = read(files.evaluator)
const rollback = read(files.rollback)

for (const fragment of [
  'Decision PR: #624',
  'Twitch and Kick remain separate data products',
  'preserve the existing `*/5 * * * *` Worker cron',
  'Kick permanent category capture is not authorized',
  'at least seven stable days',
]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)
for (const fragment of [
  'Phase 12A-4-22 — Twitch 24–48 hour observation',
  'A temporary GitHub Actions observation schedule is allowed, but no new Worker cron is allowed',
]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)
for (const fragment of [
  'Current gate: 12A-4-22 Twitch permanent observation active',
  'Twitch permanent category capture started at 2026-07-20 20:40 JST',
  'Kick permanent category capture is not authorized',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)
for (const fragment of [
  '12A-4-22 Twitch permanent observation active',
  'Twitch permanent runtime active yes',
  'Exact release trigger current no',
  'Temporary GitHub observation schedule active yes',
  'Existing Worker cadence */5 * * * * unchanged',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)
for (const fragment of [
  '# 12A-4-22 Twitch permanent category observation active',
  'Verification run: `29739415464`',
  'Twitch runtime active: yes',
  'Kick implementation authorized: no',
]) assert.ok(wip.includes(fragment), `WIP missing: ${fragment}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v26')
assert.equal(gate.status, '12a4_twitch_permanent_category_capture_active_observation_pending')
assert.equal(gate.currentWorkstream.phase, '12A-4-22')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.releaseTriggerPr, 630)
assert.equal(gate.currentWorkstream.releaseStartAcceptancePr, 632)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, true)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.exactReleaseTriggerCurrent, false)
assert.equal(gate.currentWorkstream.observationActive, true)
assert.equal(gate.currentWorkstream.observationPackagePr, 632)
assert.equal(gate.currentWorkstream.automaticRollbackOnObservationHardStop, true)
assert.deepEqual(gate.openBlockers, [
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized',
])
assert.ok(gate.closedBlockers.includes('twitch_permanent_category_capture_not_deployed'))

assert.equal(gate.categoryCapture.runtimeCaptureStarted, true)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, true)
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, true)
assert.equal(gate.categoryCapture.twitchPermanentExactReleaseTriggerAccepted, true)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.categoryUiAuthorized, false)

assert.equal(gate.twitchPermanentCategoryStart.status, 'accepted')
assert.equal(gate.twitchPermanentCategoryStart.releaseTriggerPr, 630)
assert.equal(gate.twitchPermanentCategoryStart.verificationRunId, 29739415464)
assert.equal(gate.twitchPermanentCategoryStart.verificationJobId, 88342486922)
assert.equal(gate.twitchPermanentCategoryStart.artifactId, 8459811639)
assert.equal(gate.twitchPermanentCategoryStart.categoryPayloadRowsSinceStart, 2)
assert.equal(gate.twitchPermanentCategoryStart.providerLeakageRows, 0)
assert.equal(gate.twitchPermanentCategoryStart.collectorErrorRunsSinceStart, 0)
assert.equal(gate.twitchPermanentCategoryStart.allInitialGatesPass, true)
assert.equal(gate.twitchPermanentCategoryObservation.status, 'active')
assert.equal(gate.twitchPermanentCategoryObservation.packagePr, 632)
assert.equal(gate.twitchPermanentCategoryObservation.temporaryGitHubScheduleActive, true)
assert.equal(gate.twitchPermanentCategoryObservation.newWorkerCronAdded, false)

assert.equal(start.status, 'accepted')
assert.equal(start.releaseTriggerPr, 630)
assert.equal(start.verification.workflowRunId, 29739415464)
assert.equal(start.verification.workflowJobId, 88342486922)
assert.equal(start.verification.artifactId, 8459811639)
assert.equal(start.runtime.permanentCaptureEnabled, true)
assert.equal(start.initialObservation.categoryPayloadRowsSinceStart, 2)
assert.equal(start.initialObservation.providerLeakageRows, 0)
assert.equal(start.initialObservation.collectorErrorRunsSinceStart, 0)
assert.equal(Object.values(start.boundaries).every((value) => value === false), true)

assert.equal(observation.status, 'active')
assert.equal(observation.packagePr, 632)
assert.equal(observation.provider, 'twitch')
assert.equal(observation.monitor.temporaryGitHubSchedule, true)
assert.equal(observation.monitor.newWorkerCronAdded, false)
assert.equal(observation.rollback.automaticOnHardStop, true)
assert.equal(observation.acceptance.minimumHours, 24)
assert.equal(observation.acceptance.extendToHoursOnWarning, 48)
assert.equal(Object.values(observation.boundaries).every((value) => value === false), true)

assert.match(workflow, /^\s*schedule:/m)
assert.ok(workflow.includes("cron: '17 * * * *'"))
assert.ok(workflow.includes("github.event_name != 'pull_request' && github.ref == 'refs/heads/main'"))
assert.ok(workflow.includes('Run read-only Twitch production observation'))
assert.ok(workflow.includes('Restore normal Twitch config on hard stop'))
assert.ok(workflow.includes('Upload sanitized observation evidence'))
assert.ok(evaluator.includes("classification = hardStops.length > 0"))
assert.ok(evaluator.includes("'eligible_for_acceptance'"))
assert.ok(rollback.includes("'wrangler@4', 'deploy', '--config', contract.rollback.config"))
assert.ok(rollback.includes("MODE: 'rollback'"))

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
  twitchRuntimeActive: true,
  observationActive: true,
  temporaryGitHubSchedule: true,
  newWorkerCronAdded: false,
  kickAuthorized: false,
  nextAction: 'minimum-24-hour-observation',
}, null, 2))
