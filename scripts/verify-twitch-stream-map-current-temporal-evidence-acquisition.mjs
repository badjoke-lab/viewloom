import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { buildCurrentTemporalEvidenceAcquisitionQueue } from '../tools/twitch-stream-map-current-location/temporal-evidence-acquisition.mjs'
import { CURRENT_ACCEPTED_EVIDENCE_CLASSES } from '../workers/collector-twitch/scripts/current-location-evidence-eligibility.mjs'

const plan = JSON.parse(readFileSync(
  'docs/audits/twitch-stream-map-current-temporal-evidence-acquisition-plan-2026-08-29.json',
  'utf8',
))
const reviewBatch = JSON.parse(readFileSync(plan.sourceReviewBatch, 'utf8'))

assert.equal(
  plan.schemaVersion,
  'viewloom-twitch-stream-map-current-temporal-evidence-acquisition-plan-v0.1',
)
assert.equal(reviewBatch.provider, 'twitch')
assert.equal(reviewBatch.layer, 'current')
assert.equal(reviewBatch.summary.candidateCount, 10)
assert.equal(reviewBatch.summary.pendingReview, 0)
assert.equal(reviewBatch.summary.acceptedCurrent, 0)
assert.equal(reviewBatch.summary.noQualifyingEvidence, 10)

const queue = buildCurrentTemporalEvidenceAcquisitionQueue(reviewBatch, { createdAt: plan.createdAt })

for (const [key, value] of Object.entries(plan.expected)) {
  if (key === 'logins') continue
  assert.equal(queue.summary[key], value, `summary mismatch: ${key}`)
}
assert.deepEqual(queue.identities.map((row) => row.userLogin), plan.expected.logins)
assert.deepEqual(queue.acceptedEvidenceClasses, CURRENT_ACCEPTED_EVIDENCE_CLASSES)
assert.equal(queue.lookupTasks.length, 40)
assert.equal(new Set(queue.lookupTasks.map((task) => task.taskId)).size, 40)

for (const identity of queue.identities) {
  const tasks = queue.lookupTasks.filter((task) => task.twitchUserId === identity.twitchUserId)
  assert.equal(tasks.length, CURRENT_ACCEPTED_EVIDENCE_CLASSES.length)
  assert.deepEqual(tasks.map((task) => task.sourceClass), CURRENT_ACCEPTED_EVIDENCE_CLASSES)
  assert.ok(tasks.every((task) => task.reviewRequired === true))
  assert.ok(tasks.every((task) => task.automaticAcceptanceAuthorized === false))
  assert.ok(tasks.every((task) => task.candidate.countryCode === identity.candidate.countryCode))
}

assert.deepEqual(queue.boundary, plan.boundary)
assert.equal(queue.freshness.openEndedCurrentTtlHours, 24)
assert.equal(queue.freshness.temporaryMaxDays, 14)
assert.equal(queue.freshness.evidenceMustBeFreshAtReview, true)

const serialized = JSON.stringify(queue)
for (const forbiddenKey of [
  'title',
  'tags',
  'language',
  'address',
  'latitude',
  'longitude',
  'gps',
]) {
  assert.equal(serialized.includes(`\"${forbiddenKey}\"`), false, `forbidden field leaked: ${forbiddenKey}`)
}

for (const rejectedClass of [
  'stream_title',
  'stream_tag',
  'profile_location_without_current_time_meaning',
  'search_snippet',
  'planned_future_travel',
]) {
  assert.equal(queue.acceptedEvidenceClasses.includes(rejectedClass), false)
}

console.log(JSON.stringify({
  ok: true,
  identities: queue.summary.identities,
  acceptedEvidenceClasses: queue.summary.acceptedEvidenceClasses,
  lookupTasks: queue.summary.lookupTasks,
  maxLookupsPerIdentity: queue.summary.maxLookupsPerIdentity,
  maxExternalLookups: queue.summary.maxExternalLookups,
  providerRequests: queue.summary.providerRequests,
  publicCurrentPlacementAuthorized: queue.boundary.publicCurrentPlacementAuthorized,
  automaticAcceptanceAuthorized: queue.boundary.automaticAcceptanceAuthorized,
}, null, 2))
