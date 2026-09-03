import assert from 'node:assert/strict'

import { adaptTwitchCurrentSnapshotItems } from './twitch-stream-map-current-snapshot-adapter-core.mjs'
import { buildTwitchCurrentResponse } from './twitch-stream-map-current-response-core.mjs'

const items = adaptTwitchCurrentSnapshotItems(JSON.stringify({
  provider: 'twitch',
  items: [
    {
      twitchUserId: '12345',
      channelLogin: 'Stable_User',
      displayName: 'Stable User',
      viewers: 120,
    },
    {
      channelLogin: 'legacy_login_only',
      displayName: 'Legacy Login Only',
      viewers: 80,
    },
    {
      user_id: '67890',
      user_login: 'helix_shape',
      user_name: 'Helix Shape',
      viewer_count: 40,
    },
  ],
}))

assert.equal(items.length, 3)
assert.deepEqual(items[0], {
  twitchUserId: '12345',
  userLogin: 'stable_user',
  displayName: 'Stable User',
  viewers: 120,
  url: 'https://www.twitch.tv/stable_user',
})
assert.equal(items[1].twitchUserId, null, 'login must never be promoted to stable Twitch identity')
assert.equal(items[1].userLogin, 'legacy_login_only')
assert.equal(items[2].twitchUserId, '67890')
assert.equal(items[2].userLogin, 'helix_shape')
assert.deepEqual(adaptTwitchCurrentSnapshotItems('{bad-json'), [])

const response = buildTwitchCurrentResponse({
  snapshotItems: items,
  reviewedEvidence: [],
  evaluatedAt: '2026-09-03T00:00:00.000Z',
})

assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.coverage.observedStreams, 3)
assert.equal(response.coverage.mappedStreams, 0)
assert.equal(response.coverage.unmappedStreams, 3)
assert.equal(response.coverage.reconciliation.passes, true)

const stableNoEvidence = response.unmappedStreams.find((row) => row.userLogin === 'stable_user')
const legacyNoStableId = response.unmappedStreams.find((row) => row.userLogin === 'legacy_login_only')
const helixNoEvidence = response.unmappedStreams.find((row) => row.userLogin === 'helix_shape')

assert.equal(stableNoEvidence?.geography.reason, 'no_reviewed_current_evidence')
assert.equal(legacyNoStableId?.geography.reason, 'stable_identity_unavailable')
assert.equal(helixNoEvidence?.geography.reason, 'no_reviewed_current_evidence')
assert.equal(response.semantics.stableIdentity, 'twitchUserId')
assert.equal(response.semantics.loginIsStableIdentity, false)
assert.equal(response.semantics.baseMutationAuthorized, false)
assert.equal(response.semantics.providerAggregationAllowed, false)

console.log(JSON.stringify({
  ok: true,
  adapted: items.length,
  stableIdsPresent: items.filter((row) => row.twitchUserId).length,
  legacyLoginOnly: items.filter((row) => !row.twitchUserId).length,
  publicActivationAuthorized: response.publicActivationAuthorized,
  stableIdentity: response.semantics.stableIdentity,
}, null, 2))
