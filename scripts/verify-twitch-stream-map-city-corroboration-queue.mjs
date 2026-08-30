import assert from 'node:assert/strict'
import fs from 'node:fs'
import { classifyCityEvidenceSet } from '../tools/twitch-stream-map-city-confidence/classifier.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const queuePath = 'docs/audits/twitch-stream-map-city-corroboration-queue-2026-08-28.json'
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'))
const classified = classifyCityEvidenceSet(TWITCH_REVIEWED_LOCATION_RECORDS)
const singleExplicit = classified.rows
  .filter((row) => row.cityState === 'mapped')
  .filter((row) => row.confidenceClass === 'single_explicit_base_city')
  .sort((a, b) => a.login.localeCompare(b.login))

assert.equal(queue.schemaVersion, 'viewloom-twitch-stream-map-city-corroboration-queue-v0.1')
assert.equal(queue.provider, 'twitch')
assert.equal(queue.geographyLayer, 'base_city')
assert.equal(queue.status, 'active_evidence_strengthening_queue')
assert.equal(queue.policy.existingSingleExplicitMappingRemainsValidWithoutSecondaryEvidence, true)
assert.equal(queue.policy.secondaryEvidenceAutomaticallyAccepted, false)
assert.equal(queue.policy.secondaryEvidenceMustUseBaseClaimKind, true)
assert.deepEqual(queue.policy.acceptedBaseClaimKinds, ['home_base', 'declared_location'])
assert.equal(queue.policy.countryMayInferCity, false)
assert.equal(queue.policy.currentMayMutateBaseCity, false)
assert.equal(queue.policy.conflictingSecondaryEvidenceFailsClosed, true)
assert.equal(queue.policy.latestEvidenceSilentlyWinsConflict, false)
assert.equal(queue.policy.preciseLocationAllowed, false)
assert.equal(queue.policy.twitchKickAggregationAllowed, false)

assert.equal(queue.entries.length, singleExplicit.length)
assert.equal(queue.summary.queued, queue.entries.length)
assert.equal(queue.summary.singleExplicit, singleExplicit.length)
assert.equal(queue.summary.consistentMultiple, 0)
assert.equal(queue.summary.conflicts, classified.counts.conflict ?? 0)
assert.equal(queue.summary.completed, 0)

const queueByLogin = new Map()
for (const entry of queue.entries) {
  assert.equal(queueByLogin.has(entry.streamerLogin), false, `duplicate queue login ${entry.streamerLogin}`)
  queueByLogin.set(entry.streamerLogin, entry)
  assert.match(entry.countryCode, /^[A-Z]{2}$/)
  assert.ok(entry.region === null || typeof entry.region === 'string')
  assert.equal(typeof entry.city, 'string')
  assert.ok(entry.city.length > 0)
  assert.equal(entry.currentConfidenceClass, 'single_explicit_base_city')
  assert.equal(entry.reviewStatus, 'needs_secondary_explicit_base_evidence')
}

for (const row of singleExplicit) {
  const entry = queueByLogin.get(row.login)
  assert.ok(entry, `missing queue entry ${row.login}`)
  assert.equal(entry.countryCode, row.placement.countryCode)
  assert.equal(entry.region, row.placement.region)
  assert.equal(entry.city, row.placement.city)
  assert.equal(row.publicPlacementEligible, true)
  assert.equal(row.currentEvidenceExcludedFromBase, false)
}

function assertNoForbiddenKeys(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(
      ['address', 'street', 'postalCode', 'zipCode', 'coordinates', 'latitude', 'longitude', 'lat', 'lng', 'gps', 'gpsTrace', 'preciseTravelPath'].includes(key),
      false,
      `forbidden precise-location key ${path}.${key}`,
    )
    assertNoForbiddenKeys(child, `${path}.${key}`)
  }
}
assertNoForbiddenKeys(queue)

console.log(JSON.stringify({
  ok: true,
  queued: queue.entries.length,
  currentSingleExplicit: singleExplicit.length,
  currentConsistentMultiple: classified.rows.filter((row) => row.confidenceClass === 'consistent_multiple_explicit_base_city_rows').length,
  currentConflicts: classified.counts.conflict ?? 0,
  autoAcceptanceAllowed: false,
  countryToCityInferenceAllowed: false,
  currentToBaseAllowed: false,
}, null, 2))
