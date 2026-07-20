import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')
const json = (path) => JSON.parse(read(path))
const required = [
  'docs/product/category-capture-permanent-rollout-spec.md',
  'docs/product/category-capture-permanent-rollout-plan.md',
  'docs/product/current-roadmap.md',
  'docs/product/current-schedule.md',
  'docs/audits/12a2-current-gate-state.json',
  'docs/work-in-progress/phase12a4-twitch-permanent-category-capture.md',
  'docs/operations/development-and-deployment-policy.md',
  'workers/collector-twitch/wrangler.toml',
  'workers/collector-kick/wrangler.toml',
]
for (const path of required) assert.equal(existsSync(path), true, `${path}: missing`)

const spec = read(required[0])
const plan = read(required[1])
const roadmap = read(required[2])
const schedule = read(required[3])
const wip = read(required[5])
const gate = json(required[4])

for (const fragment of [
  'Decision PR: #624',
  'Twitch and Kick remain separate data products',
  'preserve the existing `*/5 * * * *` Worker cron',
  'projected Twitch 90-day size at or below `440 MB`',
  'projected account-wide D1 headroom at or above `500 MB`',
  'Kick permanent category capture is not authorized',
  'at least seven stable days',
  'Every category implementation, deployment, observation, acceptance, rollback, and UI PR must read and cite',
]) assert.ok(spec.includes(fragment), `spec missing: ${fragment}`)

for (const fragment of [
  'Phase 12A-4-20 — Twitch implementation package',
  'Phase 12A-4-21 — exact Twitch deployment',
  'Phase 12A-4-22 — Twitch 24–48 hour observation',
  'Phase 12A-4-23 — Twitch acceptance or rollback closeout',
  'Phase 12A-4-24 — Kick decision',
  'A temporary GitHub Actions observation schedule is allowed, but no new Worker cron is allowed',
]) assert.ok(plan.includes(fragment), `plan missing: ${fragment}`)

for (const fragment of [
  'Current gate: 12A-4-19 Twitch permanent capture authorized, implementation pending',
  'Next gate: 12A-4-20 Twitch implementation package',
  'Kick permanent category capture is not authorized',
  'No new Worker cron, backfill, or raw-retention expansion is authorized',
]) assert.ok(roadmap.includes(fragment), `roadmap missing: ${fragment}`)

for (const fragment of [
  '12A-4-19 permanent rollout decision accepted',
  'Twitch permanent runtime active no',
  'Kick permanent implementation authorized no',
  'Existing Worker cadence */5 * * * * unchanged',
  'Observe for at least 24 hours; extend to 48 hours on warning',
  'Every category PR must read and cite',
]) assert.ok(schedule.includes(fragment), `schedule missing: ${fragment}`)

for (const fragment of [
  'Twitch permanent category capture is authorized for implementation but is not yet implemented, deployed, or active',
  'Prepare Phase 12A-4-20',
  'Kick implementation authorized: no',
]) assert.ok(wip.includes(fragment), `active WIP missing: ${fragment}`)

assert.equal(gate.schemaVersion, 'viewloom-12a2-current-gate-state-v23')
assert.equal(gate.status, '12a4_twitch_permanent_category_capture_authorized_pending_implementation')
assert.equal(gate.currentWorkstream.phase, '12A-4-19')
assert.equal(gate.currentWorkstream.trackingIssue, 623)
assert.equal(gate.currentWorkstream.decisionPr, 624)
assert.equal(gate.currentWorkstream.runtimeCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.runtimeCaptureStarted, false)
assert.equal(gate.currentWorkstream.authorizationScope, 'twitch_only')
assert.equal(gate.currentWorkstream.twitchPermanentCaptureAuthorized, true)
assert.equal(gate.currentWorkstream.twitchPermanentCaptureActive, false)
assert.equal(gate.currentWorkstream.kickPermanentCaptureAuthorized, false)
assert.equal(gate.currentWorkstream.existingFiveMinuteCronPreserved, true)
assert.equal(gate.currentWorkstream.categoryUiAuthorized, false)
assert.equal(gate.categoryCapture.runtimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.runtimeCaptureStarted, false)
assert.equal(gate.categoryCapture.categoryCaptureFlagPresent, false)
assert.equal(gate.categoryCapture.authorizationScope, 'twitch_only')
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureAuthorized, true)
assert.equal(gate.categoryCapture.twitchPermanentRuntimeCaptureActive, false)
assert.equal(gate.categoryCapture.kickPermanentRuntimeCaptureAuthorized, false)
assert.equal(gate.categoryCapture.newCronAuthorized, false)
assert.equal(gate.categoryCapture.backfillAuthorized, false)
assert.equal(gate.categoryCapture.retentionExpansionAuthorized, false)
assert.equal(gate.categoryCapture.categoryUiAuthorized, false)
assert.deepEqual(gate.openBlockers, [
  'twitch_permanent_category_capture_not_implemented',
  'twitch_permanent_category_capture_not_deployed',
  'twitch_permanent_category_capture_observation_not_accepted',
  'kick_permanent_category_capture_not_authorized',
])

const rollout = gate.permanentCategoryCaptureRolloutDecision
assert.equal(rollout.status, 'accepted')
assert.equal(rollout.trackingIssue, 623)
assert.equal(rollout.decisionPr, 624)
assert.equal(rollout.authorizationScope, 'twitch_only')
assert.equal(rollout.twitchPermanentCaptureAuthorized, true)
assert.equal(rollout.twitchRuntimeCaptureActive, false)
assert.equal(rollout.kickPermanentCaptureAuthorized, false)
assert.equal(rollout.kickAutomaticStartAuthorized, false)
assert.equal(rollout.existingCollectorCronRequired, '*/5 * * * *')
assert.equal(rollout.newWorkerCronAuthorized, false)
assert.equal(rollout.backfillAuthorized, false)
assert.equal(rollout.retentionExpansionAuthorized, false)
assert.equal(rollout.categoryUiAuthorized, false)
assert.equal(rollout.crossProviderIdentityAllowed, false)
assert.equal(rollout.combinedProviderRankingAllowed, false)
assert.equal(rollout.freshReadOnlyPreflightRequired, true)
assert.equal(rollout.twitchMinimumObservationHours, 24)
assert.equal(rollout.twitchWarningObservationHours, 48)
assert.equal(rollout.stableAccumulationDaysBeforeUi, 7)
assert.equal(rollout.rollbackRequiredOnHardStop, true)

const twitchConfig = read('workers/collector-twitch/wrangler.toml')
const kickConfig = read('workers/collector-kick/wrangler.toml')
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(twitchConfig), false)
assert.equal(/CATEGORY_CAPTURE_ENABLED\s*=/.test(kickConfig), false)
assert.equal(twitchConfig.match(/crons\s*=\s*\[\s*"([^"]+)"\s*\]/)?.[1], '*/5 * * * *')
assert.notEqual(
  twitchConfig.match(/database_id = "([^"]+)"/)?.[1],
  kickConfig.match(/database_id = "([^"]+)"/)?.[1],
)

console.log(JSON.stringify({
  ok: true,
  phase: gate.currentWorkstream.phase,
  trackingIssue: gate.currentWorkstream.trackingIssue,
  decisionPr: gate.currentWorkstream.decisionPr,
  twitchImplementationAuthorized: true,
  twitchRuntimeActive: false,
  kickAuthorized: false,
  nextPhase: '12A-4-20',
}, null, 2))
