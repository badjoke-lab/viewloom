import assert from 'node:assert/strict'
import fs from 'node:fs'
import worker from '../tools/twitch-stream-map-coverage-expansion/worker.mjs'

const originalFetch = globalThis.fetch
const calls = []

try {
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    calls.push({ url: url.toString(), method: init.method ?? 'GET' })

    if (url.hostname === 'id.twitch.tv') {
      return jsonResponse({ access_token: 'test-token', expires_in: 3600, token_type: 'bearer' })
    }

    assert.equal(url.hostname, 'api.twitch.tv')
    assert.equal(url.pathname, '/helix/streams')
    assert.equal(url.searchParams.get('first'), '100')

    const after = url.searchParams.get('after') ?? ''
    const page = after === '' ? 0 : after === 'cursor-1' ? 1 : after === 'cursor-2' ? 2 : -1
    assert.notEqual(page, -1)

    return jsonResponse({
      data: Array.from({ length: 100 }, (_, index) => ({
        id: `stream-${page}-${index}`,
        user_id: `user-${page}-${index}`,
        user_login: `login_${page}_${index}`,
        user_name: `Display ${page} ${index}`,
        viewer_count: 10000 - page * 100 - index,
        title: 'must not be retained',
        tags: ['Tokyo'],
        language: 'en',
        game_id: '1',
        game_name: 'Category',
      })),
      pagination: { cursor: `cursor-${page + 1}` },
    })
  }

  const healthResponse = await worker.fetch(new Request('https://preview.example/health'), {})
  const health = await healthResponse.json()
  assert.equal(health.ok, true)
  assert.equal(health.productionDeployment, false)
  assert.equal(health.d1Writes, 0)
  assert.equal(health.maxStreamsRequests, 3)
  assert.equal(health.usersRequests, 0)

  const response = await worker.fetch(
    new Request('https://preview.example/audit/coverage-expansion-sample', { method: 'POST' }),
    { TWITCH_CLIENT_ID: 'client', TWITCH_CLIENT_SECRET: 'secret' },
  )
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)

  const result = payload.result
  assert.equal(result.provider, 'twitch')
  assert.equal(result.mode, 'coverage_expansion_stable_identity_top300_preview')
  assert.equal(result.requestedSize, 300)
  assert.equal(result.sampleSize, 300)
  assert.equal(result.coveredPages, 3)
  assert.equal(result.hasMore, true)
  assert.deepEqual(result.apiRequests, { token: 1, streams: 3, users: 0 })
  assert.equal(result.persistence.d1Writes, 0)
  assert.equal(result.persistence.productionDeployment, false)
  assert.equal(result.persistence.rawTitleStored, false)
  assert.equal(result.persistence.rawTagsStored, false)
  assert.equal(result.persistence.rawLanguageStored, false)
  assert.equal(result.persistence.rawProfileDescriptionStored, false)
  assert.equal(result.persistence.rawCategoryStored, false)
  assert.equal(result.persistence.geographyStored, false)
  assert.equal(result.persistence.coordinatesStored, false)
  assert.equal(result.persistence.addressStored, false)
  assert.deepEqual(result.fieldsIncluded, ['rank', 'twitchUserId', 'login', 'displayName', 'viewers'])
  assert.equal(result.identities.length, 300)
  assert.deepEqual(Object.keys(result.identities[0]).sort(), ['displayName', 'login', 'rank', 'twitchUserId', 'viewers'].sort())
  assert.equal(result.identities[0].twitchUserId, 'user-0-0')
  assert.equal(result.identities[299].twitchUserId, 'user-2-99')
  assert.equal(new Set(result.identities.map((row) => row.twitchUserId)).size, 300)
  assert.equal(new Set(result.identities.map((row) => row.login)).size, 300)

  const tokenCalls = calls.filter((call) => call.url.includes('id.twitch.tv/oauth2/token'))
  const streamCalls = calls.filter((call) => call.url.includes('api.twitch.tv/helix/streams'))
  const userCalls = calls.filter((call) => call.url.includes('/helix/users'))
  assert.equal(tokenCalls.length, 1)
  assert.equal(streamCalls.length, 3)
  assert.equal(userCalls.length, 0)

  const wrangler = fs.readFileSync('tools/twitch-stream-map-coverage-expansion/wrangler.toml', 'utf8')
  assert.equal(/\[\[d1_databases\]\]/.test(wrangler), false)
  assert.equal(/\bcrons\s*=/.test(wrangler), false)
  assert.equal(/\[triggers\]/.test(wrangler), false)

  const workerSource = fs.readFileSync('tools/twitch-stream-map-coverage-expansion/worker.mjs', 'utf8')
  assert.equal(workerSource.includes('/helix/users'), false)
  assert.equal(workerSource.includes("const MAX_PAGES = 3"), true)
  assert.equal(workerSource.includes("const PAGE_SIZE = 100"), true)

  console.log('Twitch Stream Map coverage acquisition verification passed')
  console.log(JSON.stringify({
    tokenRequests: tokenCalls.length,
    streamsRequests: streamCalls.length,
    usersRequests: userCalls.length,
    identities: result.identities.length,
    hasMore: result.hasMore,
  }, null, 2))
} finally {
  globalThis.fetch = originalFetch
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
