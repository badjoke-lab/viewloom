import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { deriveKickCountryLiveStates } from './kick-stream-map-country-live-join-core.mjs'

const collectorSource = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')
const homeSource = readFileSync('apps/web/functions/_home/model.ts', 'utf8')

// Public Kick Country must not activate while the production live snapshot path
// still represents a stream by slug/display metadata instead of a retained
// broadcaster_user_id. Slug is allowed only as the bounded Channels lookup key.
const collectorRetainsStableId = /broadcaster_user_id/.test(collectorSource)
const publicSnapshotRetainsStableId = /broadcaster_user_id/.test(homeSource)

assert.equal(collectorRetainsStableId, false, 'current Kick livestream normalizer unexpectedly changed; re-audit stable-ID persistence before public activation')
assert.equal(publicSnapshotRetainsStableId, false, 'current public snapshot model unexpectedly changed; re-audit stable-ID persistence before public activation')

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
  schemaVersion: 'viewloom-kick-stream-map-country-public-readiness-v0.1',
  provider: 'kick',
  publicCountryActivationReady: collectorRetainsStableId && publicSnapshotRetainsStableId,
  blockers: [
    !collectorRetainsStableId ? 'production_livestream_snapshot_does_not_retain_broadcaster_user_id' : null,
    !publicSnapshotRetainsStableId ? 'public_snapshot_contract_does_not_expose_stable_kick_identity' : null,
  ].filter(Boolean),
  invariant: {
    stableIdentity: 'broadcaster_user_id',
    slugIsStableIdentity: false,
    twitchEvidenceReuseAllowed: false,
    automaticGeographyPromotionAllowed: false,
    providerAggregationAllowed: false,
  },
}

assert.equal(readiness.publicCountryActivationReady, false)
assert.equal(readiness.blockers.length, 2)
console.log(JSON.stringify(readiness, null, 2))
