import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

const collectorSource = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')
const homeSource = readFileSync('apps/web/functions/_home/model.ts', 'utf8')

// Public Kick Country must not activate until BOTH snapshot persistence and the
// public snapshot/API path retain the official Channels broadcaster_user_id.
// Slug remains a lookup/display key only and is never promoted to stable identity.
const collectorRetainsStableId = /broadcaster_user_id/.test(collectorSource)
const publicSnapshotRetainsStableId = /broadcaster_user_id/.test(homeSource)

const slugOnly = deriveKickCountryLiveStates({
  liveRows: [{ provider: 'kick', channel: { slug: 'example' } }],
  channelRows: [{ provider: 'kick', slug: 'example' }],
  reviewedEvidence: [{ provider: 'kick', stableKickUserId: '42', outcome: 'accepted', placement: { state: 'mapped', countryCode: 'US' } }],
})
assert.deepEqual(slugOnly.map(({ state, reason, stableKickUserId }) => ({ state, reason, stableKickUserId })), [
  { state: 'unmapped', reason: 'stable_identity_unavailable', stableKickUserId: null },
])

const stableJoin = deriveKickCountryLiveStates({
  liveRows: [{ provider: 'kick', channel: { slug: 'example' } }],
  channelRows: [{ provider: 'kick', slug: 'example', broadcaster_user_id: 42 }],
  reviewedEvidence: [{ provider: 'kick', stableKickUserId: '42', outcome: 'accepted', placement: { state: 'mapped', countryCode: 'US' } }],
})
assert.deepEqual(stableJoin.map(({ state, reason, stableKickUserId, placement }) => ({ state, reason, stableKickUserId, placement })), [
  { state: 'mapped', reason: 'reviewed_country_accepted', stableKickUserId: '42', placement: { countryCode: 'US' } },
])

const readiness = {
  schemaVersion: 'viewloom-kick-stream-map-country-public-readiness-v0.2',
  provider: 'kick',
  publicCountryActivationReady: collectorRetainsStableId && publicSnapshotRetainsStableId,
  blockers: [
    !collectorRetainsStableId ? 'production_livestream_snapshot_does_not_retain_broadcaster_user_id' : null,
    !publicSnapshotRetainsStableId ? 'public_snapshot_contract_does_not_expose_stable_kick_identity' : null,
  ].filter(Boolean),
  stages: {
    collectorStableIdentityPersistence: collectorRetainsStableId ? 'ready_in_code' : 'blocked',
    publicStableIdentityExposure: publicSnapshotRetainsStableId ? 'ready_in_code' : 'blocked',
  },
  invariant: {
    stableIdentity: 'broadcaster_user_id',
    slugIsStableIdentity: false,
    twitchEvidenceReuseAllowed: false,
    automaticGeographyPromotionAllowed: false,
    providerAggregationAllowed: false,
  },
}

assert.equal(readiness.publicCountryActivationReady, collectorRetainsStableId && publicSnapshotRetainsStableId)
assert.equal(readiness.blockers.length, Number(!collectorRetainsStableId) + Number(!publicSnapshotRetainsStableId))
assert.equal(readiness.invariant.slugIsStableIdentity, false)
assert.equal(readiness.invariant.twitchEvidenceReuseAllowed, false)
assert.equal(readiness.invariant.automaticGeographyPromotionAllowed, false)
assert.equal(readiness.invariant.providerAggregationAllowed, false)
console.log(JSON.stringify(readiness, null, 2))
