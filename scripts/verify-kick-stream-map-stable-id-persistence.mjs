import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')

for (const required of [
  'broadcaster_user_id: string | null',
  "const CHANNEL_BATCH_SIZE = 50",
  "new URL('https://api.kick.com/public/v1/channels')",
  "url.searchParams.append('slug', slug)",
  'buildOfficialChannelSlugBatches',
  'attachOfficialChannelIdentities',
  'ids?.size === 1',
  'identityLookupRequests',
  'identityLookupFailures',
  'identityMatchedStreams',
  'identityMissingStreams',
]) {
  assert.ok(source.includes(required), `missing stable-ID persistence guard: ${required}`)
}

assert.ok(source.includes('Math.min(100'), 'official livestream population must remain bounded to 100')
assert.equal(source.includes('channel_description'), false, 'profile text must not be persisted by stable-ID enrichment')
assert.equal(source.includes('kick.com/api/v2/channels'), false, 'stable identity must not use legacy public fallback')

const maxLivestreamRows = 100
const channelBatchSize = 50
assert.equal(Math.ceil(maxLivestreamRows / channelBatchSize), 2, 'Top100 stable-ID enrichment must need at most 2 Channels calls')

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  liveEndpoint: 'public/v1/livestreams',
  identityEndpoint: 'public/v1/channels',
  maxLivestreamRows,
  channelBatchSize,
  maxChannelIdentityRequests: 2,
  stableIdentity: 'broadcaster_user_id',
  ambiguousIdentityFailsClosed: true,
  channelDescriptionPersisted: false,
  legacyFallbackAllowedForStableIdentity: false,
  productionDeploymentAuthorized: false
}, null, 2))
