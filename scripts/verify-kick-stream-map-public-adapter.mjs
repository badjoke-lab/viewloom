import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extractKickStreamMapSnapshotItems } from '../apps/web/functions/api/kick-stream-map-snapshot-source-core.mjs'
import { buildKickStreamMapPublicAdapter } from '../apps/web/functions/api/kick-stream-map-public-adapter-core.mjs'

const slugOnly = extractKickStreamMapSnapshotItems(JSON.stringify({
  items: [{ slug: 'slug-only', viewer_count: 12 }],
}))
const slugOnlyResponse = buildKickStreamMapPublicAdapter({
  snapshotItems: slugOnly,
  updatedAt: '2026-09-01T00:00:00.000Z',
  sourceMode: 'official-livestreams',
})
assert.equal(slugOnlyResponse.publicActivationAuthorized, false)
assert.equal(slugOnlyResponse.state, 'blocked_stable_identity')
assert.equal(slugOnlyResponse.coverage.observedStreams, 1)
assert.equal(slugOnlyResponse.coverage.mappedStreams, 0)
assert.equal(slugOnlyResponse.coverage.unmappedStreams, 1)
assert.equal(slugOnlyResponse.coverage.unmappedReasons.stable_identity_unavailable, 1)
assert.equal(slugOnlyResponse.identity.stableIdentityStreams, 0)
assert.equal(slugOnlyResponse.unmappedStreams[0].reason, 'stable_identity_unavailable')
assert.equal('countryCode' in slugOnlyResponse.unmappedStreams[0], false)

const stable = extractKickStreamMapSnapshotItems(JSON.stringify({
  items: [{ slug: 'stable', displayName: 'Stable', viewer_count: 34, broadcaster_user_id: 42 }],
}))
const stableResponse = buildKickStreamMapPublicAdapter({
  snapshotItems: stable,
  updatedAt: '2026-09-01T00:00:00.000Z',
  sourceMode: 'official-livestreams',
})
assert.equal(stableResponse.publicActivationAuthorized, false)
assert.equal(stableResponse.state, 'blocked_reviewed_evidence')
assert.equal(stableResponse.coverage.observedStreams, 1)
assert.equal(stableResponse.coverage.stableIdentityStreams, 1)
assert.equal(stableResponse.coverage.mappedStreams, 0)
assert.equal(stableResponse.coverage.unmappedReasons.reviewed_evidence_unavailable, 1)
assert.equal(stableResponse.unmappedStreams[0].reason, 'reviewed_evidence_unavailable')
assert.equal('stableKickUserId' in stableResponse.unmappedStreams[0], false)
assert.equal('countryCode' in stableResponse.unmappedStreams[0], false)

const mixed = buildKickStreamMapPublicAdapter({
  snapshotItems: [...slugOnly, ...stable],
  sourceMode: 'official-livestreams',
})
assert.equal(mixed.identity.stableIdentityCoverageState, 'partial')
assert.equal(mixed.coverage.observedStreams, 2)
assert.equal(mixed.coverage.mappedStreams, 0)
assert.equal(mixed.coverage.unmappedStreams, 2)
assert.equal(mixed.coverage.unmappedReasons.stable_identity_unavailable, 1)
assert.equal(mixed.coverage.unmappedReasons.reviewed_evidence_unavailable, 1)
assert.equal(mixed.semantics.twitchEvidenceReuseAllowed, false)
assert.equal(mixed.semantics.slugIsStableIdentity, false)
assert.equal(mixed.semantics.automaticGeographyPromotionAllowed, false)
assert.equal(mixed.semantics.geographyPublishedWhileActivationBlocked, false)

const empty = buildKickStreamMapPublicAdapter()
assert.equal(empty.state, 'empty')
assert.equal(empty.coverage.observedStreams, 0)
assert.equal(empty.coverage.mappedStreams, 0)
assert.equal(empty.coverage.unmappedStreams, 0)

const routeSource = readFileSync('apps/web/functions/api/kick-stream-map.ts', 'utf8')
assert.match(routeSource, /DB_KICK_HOT/)
assert.match(routeSource, /SELECT bucket_minute, collected_at, payload_json, source_mode/)
assert.match(routeSource, /WHERE provider = \?/)
assert.match(routeSource, /\.bind\('kick'\)/)
assert.doesNotMatch(routeSource, /\b(?:INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|CREATE)\b/i)
assert.doesNotMatch(routeSource, /DB_TWITCH/)
assert.doesNotMatch(routeSource, /twitch-stream-map-reviewed-evidence/)

console.log(JSON.stringify({
  schemaVersion: 'viewloom-kick-stream-map-public-adapter-verification-v0.1',
  route: '/api/kick-stream-map',
  publicActivationAuthorized: false,
  slugOnlyState: slugOnlyResponse.state,
  stableIdentityState: stableResponse.state,
  mappedStreamsWithStableIdentityButNoReviewedEvidence: stableResponse.coverage.mappedStreams,
  d1MutationAllowed: false,
  twitchEvidenceReuseAllowed: false,
}, null, 2))
