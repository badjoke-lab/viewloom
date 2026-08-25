import assert from 'node:assert/strict'
import fs from 'node:fs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'
import { evaluateCurrentLocationEvidence } from '../tools/twitch-stream-map-current-location/freshness.mjs'

const audit = JSON.parse(fs.readFileSync('docs/audits/twitch-stream-map-current-location-audit-2026-08-25.json', 'utf8'))
const contract = fs.readFileSync('docs/product/stream-map-current-location-irl-contract-v0.1.md', 'utf8')

const records = TWITCH_REVIEWED_LOCATION_RECORDS
const people = records.filter((record) => record.entityKind === 'person')
const nonPeople = records.filter((record) => record.entityKind !== 'person')
const evidences = records.flatMap((record) => Array.isArray(record.evidences) ? record.evidences : [])
const acceptedBase = evidences.filter((evidence) => evidence.status === 'accepted' && ['home_base', 'declared_location'].includes(evidence.claimKind))
const contextOnly = evidences.filter((evidence) => evidence.status === 'context_only')
const current = evidences.filter((evidence) => evidence.claimKind === 'current_location')
const temporary = evidences.filter((evidence) => evidence.claimKind === 'temporary_location')
const acceptedCurrent = [...current, ...temporary].filter((evidence) => evidence.status === 'accepted')

assert.equal(audit.schemaVersion, 'viewloom-twitch-stream-map-current-location-audit-v0.1')
assert.equal(audit.counts.entities, records.length)
assert.equal(audit.counts.personEntities, people.length)
assert.equal(audit.counts.nonPersonEntities, nonPeople.length)
assert.equal(audit.counts.evidences, evidences.length)
assert.equal(audit.counts.acceptedBaseEvidences, acceptedBase.length)
assert.equal(audit.counts.contextOnlyEvidences, contextOnly.length)
assert.equal(audit.counts.currentLocationEvidences, current.length)
assert.equal(audit.counts.temporaryLocationEvidences, temporary.length)
assert.equal(audit.counts.acceptedCurrentOrTemporaryEvidences, acceptedCurrent.length)
assert.equal(records.length, 28)
assert.equal(people.length, 16)
assert.equal(nonPeople.length, 12)
assert.equal(evidences.length, 17)
assert.equal(acceptedBase.length, 16)
assert.equal(contextOnly.length, 1)
assert.equal(current.length, 0)
assert.equal(temporary.length, 0)
assert.equal(audit.decision.publicCurrentLayerReady, false)
assert.equal(audit.decision.reason, 'no_retained_current_or_temporary_claims')
assert.equal(audit.decision.baseLayerUnaffected, true)
assert.equal(audit.privacy.preciseAddressPublished, false)
assert.equal(audit.privacy.coordinatesPublished, false)
assert.equal(audit.privacy.gpsTracePublished, false)

for (const required of ['observedAt', 'expiresAt', 'TTL = 24 hours', 'maximum accepted temporary span = 14 days', 'conflicting_current_location', 'Current layer placement stops immediately']) {
  assert.ok(contract.includes(required), `contract missing ${required}`)
}

const base = {
  source: 'manual_review',
  sourceUrl: 'https://example.com/source',
  confidence: 'explicit',
  status: 'accepted',
  countryCode: 'JP',
  countryName: 'Japan',
  region: null,
  city: 'Tokyo',
  observedAt: '2026-08-24T00:00:00.000Z',
  expiresAt: '2026-08-25T00:00:00.000Z',
}

const fresh = evaluateCurrentLocationEvidence([{ ...base, claimKind: 'current_location' }], '2026-08-24T12:00:00.000Z')
assert.equal(fresh.state, 'fresh')
assert.equal(fresh.placement.city, 'Tokyo')

const expired = evaluateCurrentLocationEvidence([{ ...base, claimKind: 'current_location' }], '2026-08-25T00:00:00.000Z')
assert.equal(expired.state, 'unknown')
assert.equal(expired.reason, 'no_fresh_current_location')
assert.equal(expired.placement, null)

const future = evaluateCurrentLocationEvidence([{ ...base, claimKind: 'temporary_location', explicitStartAt: '2026-08-24T18:00:00.000Z' }], '2026-08-24T12:00:00.000Z')
assert.equal(future.state, 'unknown')
assert.equal(future.reason, 'current_location_not_started')

const invalidNoExpiry = evaluateCurrentLocationEvidence([{ ...base, expiresAt: undefined, claimKind: 'current_location' }], '2026-08-24T12:00:00.000Z')
assert.equal(invalidNoExpiry.state, 'unknown')
assert.equal(invalidNoExpiry.reason, 'invalid_current_location')

const conflict = evaluateCurrentLocationEvidence([
  { ...base, claimKind: 'current_location' },
  { ...base, claimKind: 'temporary_location', countryCode: 'US', countryName: 'United States', city: 'Austin' },
], '2026-08-24T12:00:00.000Z')
assert.equal(conflict.state, 'conflict')
assert.equal(conflict.reason, 'conflicting_current_location')
assert.equal(conflict.placement, null)

const none = evaluateCurrentLocationEvidence([], '2026-08-24T12:00:00.000Z')
assert.equal(none.state, 'unknown')
assert.equal(none.reason, 'no_current_location_evidence')

console.log(JSON.stringify({
  ok: true,
  retainedEntities: records.length,
  retainedCurrentOrTemporaryClaims: current.length + temporary.length,
  publicCurrentLayerReady: false,
  freshnessEvaluator: true,
  expiryReturnsUnknown: true,
  conflictFailsClosed: true,
  baseLayerUnaffected: true,
}, null, 2))
