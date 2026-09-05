import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync('workers/collector-twitch/src/index-category.ts', 'utf8')
const categorySource = readFileSync('workers/shared/category-capture.ts', 'utf8')

for (const required of [
  'twitchUserId: string | null',
  'user_id?: string',
  "const twitchUserId = String(stream.user_id ?? '').trim()",
  'twitchUserId: twitchUserId || null',
  "new URL('https://api.twitch.tv/helix/streams')",
  'const storedItems = stripCategorySourceFields(input.items)',
]) {
  assert.ok(source.includes(required), `missing Twitch stable-ID persistence guard: ${required}`)
}

assert.equal(source.includes('/helix/users'), false, 'stable-ID persistence must not add a /helix/users request')
assert.ok(source.includes('const MAX_PAGES = 3'), 'Top300 Twitch collection ceiling must remain 3 pages')
assert.ok(source.includes('const PAGE_SIZE = 100'), 'Twitch page size must remain 100')
assert.ok(source.includes('const TWITCH_BUCKET_MINUTES = 5'), 'collector cadence contract must remain 5-minute bucket based')
assert.ok(source.includes("unixepoch('now', '-30 days')"), 'raw snapshot retention must remain 30 days')
assert.ok(source.includes("unixepoch('now', '-180 days')"), 'daily rollup retention must remain 180 days')
assert.ok(categorySource.includes('...stored'), 'category source stripping must preserve non-category fields such as twitchUserId')
assert.equal(source.includes('latitude'), false)
assert.equal(source.includes('longitude'), false)

console.log(JSON.stringify({
  ok: true,
  provider: 'twitch',
  stableIdentity: 'helix_streams.user_id',
  storedField: 'twitchUserId',
  additionalProviderRequests: 0,
  usersEndpointRequests: 0,
  maxStreamsRequests: 3,
  schemaChange: false,
  cadenceChange: false,
  retentionChange: false,
  productionDeploymentAuthorized: false,
}, null, 2))
