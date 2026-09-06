import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const collectorSource = readFileSync('workers/collector-kick/src/official-livestreams.ts', 'utf8')
const categoryCaptureSource = readFileSync('workers/shared/category-capture.ts', 'utf8')
const kickCollectorSource = readFileSync('workers/collector-kick/src/index-category.ts', 'utf8')

for (const required of [
  'broadcaster_user_id: string | null',
  'const broadcasterUserId = asIdentifier(raw.broadcaster_user_id)',
  'broadcaster_user_id: broadcasterUserId || null',
  "new URL('https://api.kick.com/public/v1/livestreams')",
]) {
  assert.ok(collectorSource.includes(required), `missing direct stable-ID persistence guard: ${required}`)
}

assert.equal(
  collectorSource.includes('api.kick.com/public/v1/channels'),
  false,
  'K2 direct persistence must not add a Channels lookup',
)
assert.equal(
  collectorSource.includes('kick.com/api/v2/channels'),
  false,
  'K2 stable identity must not use the legacy public fallback',
)
assert.ok(
  kickCollectorSource.includes('writeSnapshot(env, official.streams'),
  'official livestream rows must continue directly into the snapshot writer',
)
assert.ok(
  kickCollectorSource.includes('const storedItems = stripCategorySourceFields(items)'),
  'snapshot writer must continue using category-field stripping only',
)
assert.ok(
  categoryCaptureSource.includes('categoryProviderId: _categoryProviderId') &&
    categoryCaptureSource.includes('categoryName: _categoryName') &&
    categoryCaptureSource.includes('...stored'),
  'category stripping must preserve non-category fields such as broadcaster_user_id',
)

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  sourceEndpoint: '/public/v1/livestreams',
  stableIdentity: 'broadcaster_user_id',
  additionalKickApiRequests: 0,
  channelLookupAdded: false,
  legacyFallbackUsedForStableIdentity: false,
  d1SchemaChangeRequired: false,
  publicActivationAuthorizedByThisChange: false,
}, null, 2))
