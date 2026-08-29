import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { extractTwitchCurrentSnapshotItems } from '../apps/web/functions/api/twitch-stream-map-current-snapshot-source-core.mjs'
import { buildTwitchCurrentResponse } from './twitch-stream-map-current-response-core.mjs'

const fixture = JSON.parse(
  readFileSync('docs/audits/twitch-stream-map-current-response-fixture-v0.1.json', 'utf8'),
)

const payloadItems = fixture.snapshotItems.map((row) => ({
  channelLogin: row.userLogin,
  displayName: row.displayName,
  viewers: row.viewers,
  twitchUserId: row.twitchUserId,
  title: 'raw title must be discarded',
  tags: ['Japan'],
  language: 'en',
  latitude: 1.23,
  longitude: 4.56,
  sourceUrl: 'https://example.com/raw-source',
}))

const snapshotItems = extractTwitchCurrentSnapshotItems(JSON.stringify({ items: payloadItems }))
assert.equal(snapshotItems.length, fixture.snapshotItems.length)
assert.equal(snapshotItems.find((row) => row.userLogin === 'fresh')?.twitchUserId, '1001')
assert.equal(snapshotItems.find((row) => row.userLogin === 'missing-id')?.twitchUserId, null)

const serializedSource = JSON.stringify(snapshotItems)
for (const forbidden of [
  'raw title must be discarded',
  '"tags"',
  '"language"',
  '"latitude"',
  '"longitude"',
  'sourceUrl',
  'example.com/raw-source',
]) {
  assert.equal(serializedSource.includes(forbidden), false, `snapshot source leaked forbidden field/value: ${forbidden}`)
}

assert.deepEqual(extractTwitchCurrentSnapshotItems('{not-json'), [])
assert.deepEqual(extractTwitchCurrentSnapshotItems(''), [])

const noFallback = extractTwitchCurrentSnapshotItems(JSON.stringify({
  items: [{ channelLogin: 'login-only', displayName: 'Login Only', viewers: 1, user_id: '999' }],
}))
assert.equal(noFallback[0]?.twitchUserId, null, 'raw user_id or login must not substitute for retained snapshot twitchUserId')

const response = buildTwitchCurrentResponse({
  snapshotItems,
  reviewedEvidence: fixture.reviewedEvidence,
  evaluatedAt: fixture.evaluatedAt,
})
for (const key of [
  'observedStreams',
  'observedViewers',
  'mappedStreams',
  'mappedViewers',
  'unmappedStreams',
  'unmappedViewers',
  'conflictStreams',
  'conflictViewers',
  'streamCoverage',
  'viewerCoverage',
]) {
  assert.equal(response.coverage[key], fixture.expected[key], `coverage mismatch after source adapter: ${key}`)
}
assert.equal(response.coverage.reconciliation.passes, true)
assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.semantics.stableIdentity, 'twitchUserId')
assert.equal(response.semantics.loginIsStableIdentity, false)

const sourceModule = readFileSync(
  'apps/web/functions/api/twitch-stream-map-current-snapshot-source-core.mjs',
  'utf8',
)
assert.equal(sourceModule.includes('export const onRequest'), false, 'source core must not become a public route')
assert.equal(sourceModule.includes('D1Database'), false, 'source core must remain production-independent')
assert.ok(sourceModule.includes('identifier(row.twitchUserId)'), 'stable identity must come from retained twitchUserId')
assert.equal(sourceModule.includes('identifier(row.user_id)'), false, 'raw Helix user_id is not the stored snapshot contract')

console.log(JSON.stringify({
  ok: true,
  provider: 'twitch',
  layer: 'current',
  sourceItems: snapshotItems.length,
  mappedStreams: response.coverage.mappedStreams,
  unmappedStreams: response.coverage.unmappedStreams,
  conflictStreams: response.coverage.conflictStreams,
  stableIdentity: response.semantics.stableIdentity,
  loginIsStableIdentity: response.semantics.loginIsStableIdentity,
  publicActivationAuthorized: response.publicActivationAuthorized,
  runtimeRouteAdded: false,
}, null, 2))
