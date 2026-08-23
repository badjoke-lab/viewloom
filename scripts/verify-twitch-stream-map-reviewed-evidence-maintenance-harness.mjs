import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(path, 'utf8')

const acquisition = read('.github/workflows/twitch-stream-map-reviewed-evidence-maintenance.yml')
const finish = read('.github/workflows/twitch-stream-map-reviewed-evidence-review-finish.yml')
const worker = read('workers/collector-twitch/src/reviewed-evidence-maintenance.ts')
const wrangler = read('workers/collector-twitch/wrangler.reviewed-evidence-maintenance.toml')
const runbook = read('docs/operations/twitch-stream-map-reviewed-evidence-maintenance-runbook-v0.1.md')

function assertManualOnlyWorkflow(text, label) {
  assert.match(text, /^\s{2}workflow_dispatch:\s*$/m, `${label} must expose workflow_dispatch`)
  for (const forbidden of ['schedule', 'push', 'pull_request', 'repository_dispatch']) {
    assert.doesNotMatch(text, new RegExp(`^\\s{2}${forbidden}:\\s*$`, 'm'), `${label} must not expose ${forbidden}`)
  }
}

assertManualOnlyWorkflow(acquisition, 'acquisition workflow')
assertManualOnlyWorkflow(finish, 'finish workflow')

for (const token of [
  'viewloom-maintenance-authorization-v0.1',
  'provider: twitch',
  'topN: 20',
  'oneRunOnly: true',
  'automaticSchedule: false',
]) {
  assert.ok(acquisition.includes(token), `acquisition missing authorization token ${token}`)
  assert.ok(finish.includes(token), `finish missing authorization token ${token}`)
  assert.ok(runbook.includes(token), `runbook missing authorization token ${token}`)
}

for (const fragment of [
  'const sevenDays = 7 * 24 * 60 * 60 * 1000',
  'const thirtyDays = 30 * 24 * 60 * 60 * 1000',
  'withinSeven.length > 0',
  'withinThirty.length >= 4',
  'event=workflow_dispatch',
  'viewloom-maintenance-run-reservation-v0.1',
  'authorization issue already has a maintenance run reservation',
]) assert.ok(acquisition.includes(fragment), `acquisition cadence/one-run guard missing ${fragment}`)

const sampleStepStart = acquisition.indexOf('- name: Capture exactly one fixed Top 20 sample')
const sampleStepEnd = acquisition.indexOf('- name: Persist durable pre-research start marker')
assert.ok(sampleStepStart >= 0 && sampleStepEnd > sampleStepStart, 'sample step boundaries missing')
const sampleStep = acquisition.slice(sampleStepStart, sampleStepEnd)
assert.equal((sampleStep.match(/\/audit\/reviewed-evidence-maintenance-sample/g) || []).length, 1, 'sample endpoint must be invoked exactly once')
const sampleCurlLines = sampleStep.split(/\r?\n/).filter((line) => /^\s*curl\b/.test(line))
assert.equal(sampleCurlLines.length, 1, 'sample step must contain exactly one executable curl command')
assert.doesNotMatch(sampleStep, /--retry\b/, 'sample endpoint must never auto-retry')

assert.match(acquisition, /wrangler versions upload/)
assert.doesNotMatch(acquisition, /\bwrangler\s+deploy\b/, 'production wrangler deploy is forbidden')
assert.ok(acquisition.includes('--preview-alias'))
assert.ok(acquisition.includes('wrangler.reviewed-evidence-maintenance.toml'))
assert.ok(acquisition.includes('.result.apiRequests.token == 1'))
assert.ok(acquisition.includes('.result.apiRequests.streams == 1'))
assert.ok(acquisition.includes('.result.apiRequests.users == 0'))
assert.ok(acquisition.includes('.result.persistence.d1Writes == 0'))
assert.ok(acquisition.includes('.result.persistence.productionDeployment == false'))
assert.ok(acquisition.includes('.result.fieldsIncluded == ["rank", "twitchUserId", "login", "displayName", "viewers"]'))
assert.ok(acquisition.includes('researchMayBeginAfterThisMarker: true'))
assert.ok(acquisition.includes('viewloom-review-start-marker-v0.1'))

assert.match(wrangler, /^main = "src\/reviewed-evidence-maintenance\.ts"$/m)
assert.match(wrangler, /^keep_vars = true$/m)
assert.match(wrangler, /^\[secrets\]$/m)
assert.match(wrangler, /^required = \["TWITCH_CLIENT_ID", "TWITCH_CLIENT_SECRET"\]$/m)
assert.doesNotMatch(wrangler, /^\s*\[triggers\]\s*$/m, 'maintenance config must not have triggers')
assert.doesNotMatch(wrangler, /^\s*\[\[d1_databases\]\]\s*$/m, 'maintenance config must not have D1 databases')
assert.doesNotMatch(wrangler, /^\s*binding\s*=\s*"DB_TWITCH_/m, 'maintenance config must not have Twitch D1 binding')

assert.equal((worker.match(/await fetch\(/g) || []).length, 2, 'maintenance worker must have exactly token + streams fetches')
assert.ok(worker.includes("https://id.twitch.tv/oauth2/token"))
assert.ok(worker.includes("https://api.twitch.tv/helix/streams?first=20"))
assert.ok(worker.includes('tokenRequests += 1'))
assert.ok(worker.includes('streamsRequests += 1'))
assert.doesNotMatch(worker, /\/helix\/users/, 'maintenance worker must not call /helix/users')
assert.doesNotMatch(worker, /DB_TWITCH_HOT|\.prepare\(|\.batch\(/, 'maintenance worker must not access D1')

for (const forbiddenAccess of [
  /row\.title\b/,
  /row\.tags\b/,
  /row\.language\b/,
  /row\.game_id\b/,
  /row\.game_name\b/,
  /row\.description\b/,
]) assert.doesNotMatch(worker, forbiddenAccess, `maintenance worker accesses forbidden Twitch field: ${forbiddenAccess}`)

assert.ok(worker.includes("fieldsIncluded: ['rank', 'twitchUserId', 'login', 'displayName', 'viewers']"))
for (const fragment of [
  'd1Writes: 0',
  'productionDeployment: false',
  'rawTitleStored: false',
  'rawTagsStored: false',
  'rawLanguageStored: false',
  'rawProfileDescriptionStored: false',
  'rawCategoryStored: false',
  'geographyStored: false',
  'coordinatesStored: false',
  'addressStored: false',
  'identitySampleArtifactOnly: true',
]) assert.ok(worker.includes(fragment), `worker missing persistence invariant ${fragment}`)

for (const fragment of [
  'viewloom-review-start-marker-v0.1',
  'viewloom-review-finish-marker-v0.1',
  'twenty_terminal_outcomes_complete',
  'acknowledge_no_reconstructed_timing',
  'expected exactly one start marker',
  'finish marker already exists for sample run',
  'wall_clock_minutes',
  'minutes > 120',
]) assert.ok(finish.includes(fragment), `finish workflow missing ${fragment}`)

const finishPersistIndex = finish.indexOf('viewloom-review-finish-marker-v0.1')
const finishCeilingIndex = finish.indexOf('- name: Enforce wall-clock ceiling after durable persistence')
assert.ok(finishPersistIndex >= 0 && finishCeilingIndex > finishPersistIndex, 'finish marker must be persisted before 120-minute enforcement')

for (const fragment of [
  'viewloom-maintenance-run-reservation-v0.1',
  'viewloom-review-start-marker-v0.1',
  'viewloom-review-finish-marker-v0.1',
  'age < 180 days',
  'age >= 180 days',
  'age >= 365 days',
  'Maximum distinct search rounds: **5 per reviewed identity**',
  '120-minute',
  'without refill',
  'Conflicting accepted countries remain **unmapped**',
  'Current Location / IRL remains blocked',
  'wrangler versions upload --preview-alias',
  '`wrangler deploy` is forbidden',
  'no scheduled trigger',
]) assert.ok(runbook.includes(fragment), `runbook missing ${fragment}`)

const countryOnlyOutput = execFileSync(process.execPath, [
  'apps/web/scripts/verify-twitch-stream-map-top20-reviewed-evidence.mjs',
], { encoding: 'utf8' })
assert.ok(countryOnlyOutput.includes('twitch stream map fixed Top 20 reviewed evidence verification passed'))

console.log(JSON.stringify({
  ok: true,
  manualDispatchOnly: true,
  automaticSchedule: false,
  tokenRequestsMax: 1,
  streamsRequestsMax: 1,
  usersRequestsExact: 0,
  d1WritesExact: 0,
  productionDeployment: false,
  fixedTopN: 20,
  searchRoundsPerIdentityMax: 5,
  wallClockMinutesMax: 120,
  countryOnlyProjectionVerified: true,
}, null, 2))
