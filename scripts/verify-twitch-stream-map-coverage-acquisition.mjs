import assert from 'node:assert/strict'
import fs from 'node:fs'
import worker from '../tools/twitch-stream-map-coverage-expansion/worker.mjs'

const originalFetch = globalThis.fetch

try {
  await verifyNoOverlapStaysAtThreeRequests()
  await verifyBoundaryOverlapUsesOneBoundedOverfetch()

  const wrangler = fs.readFileSync('tools/twitch-stream-map-coverage-expansion/wrangler.toml', 'utf8')
  assert.equal(/\[\[d1_databases\]\]/.test(wrangler), false)
  assert.equal(/\bcrons\s*=/.test(wrangler), false)
  assert.equal(/\[triggers\]/.test(wrangler), false)

  const workerSource = fs.readFileSync('tools/twitch-stream-map-coverage-expansion/worker.mjs', 'utf8')
  assert.equal(workerSource.includes('/helix/users'), false)
  assert.equal(workerSource.includes('const NOMINAL_PAGES = 3'), true)
  assert.equal(workerSource.includes('const MAX_PAGES = 4'), true)
  assert.equal(workerSource.includes('const PAGE_SIZE = 100'), true)

  console.log('Twitch Stream Map coverage acquisition verification passed')
} finally {
  globalThis.fetch = originalFetch
}

async function verifyNoOverlapStaysAtThreeRequests() {
  const calls = []
  globalThis.fetch = buildMockFetch({ calls, overlapAtThirdPage: false })

  const healthResponse = await worker.fetch(new Request('https://preview.example/health'), {})
  const health = await healthResponse.json()
  assert.equal(health.ok, true)
  assert.equal(health.productionDeployment, false)
  assert.equal(health.d1Writes, 0)
  assert.equal(health.nominalStreamsRequests, 3)
  assert.equal(health.maxStreamsRequests, 4)
  assert.equal(health.maxOverfetchStreamsRequests, 1)
  assert.equal(health.usersRequests, 0)

  const result = await captureResult()
  assert.equal(result.provider, 'twitch')
  assert.equal(result.mode, 'coverage_expansion_stable_identity_top300_preview')
  assert.equal(result.requestedSize, 300)
  assert.equal(result.sampleSize, 300)
  assert.equal(result.coveredPages, 3)
  assert.equal(result.hasMore, true)
  assert.equal(result.duplicateRowsSkipped, 0)
  assert.equal(result.overfetchUsed, false)
  assert.deepEqual(result.apiRequests, { token: 1, streams: 3, users: 0 })
  assertPersistence(result)
  assertIdentityShape(result)
  assert.equal(result.identities[0].twitchUserId, 'user-0-0')
  assert.equal(result.identities[299].twitchUserId, 'user-2-99')
  assertRequestCounts(calls, 3)
}

async function verifyBoundaryOverlapUsesOneBoundedOverfetch() {
  const calls = []
  globalThis.fetch = buildMockFetch({ calls, overlapAtThirdPage: true })

  const result = await captureResult()
  assert.equal(result.requestedSize, 300)
  assert.equal(result.sampleSize, 300)
  assert.equal(result.coveredPages, 4)
  assert.equal(result.hasMore, true)
  assert.equal(result.duplicateRowsSkipped, 1)
  assert.equal(result.overfetchUsed, true)
  assert.deepEqual(result.apiRequests, { token: 1, streams: 4, users: 0 })
  assertPersistence(result)
  assertIdentityShape(result)
  assert.equal(result.identities[0].twitchUserId, 'user-0-0')
  assert.equal(result.identities[299].twitchUserId, 'user-3-0')
  assertRequestCounts(calls, 4)
}

async function captureResult() {
  const response = await worker.fetch(
    new Request('https://preview.example/audit/coverage-expansion-sample', { method: 'POST' }),
    { TWITCH_CLIENT_ID: 'client', TWITCH_CLIENT_SECRET: 'secret' },
  )
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.ok, true)
  return payload.result
}

function buildMockFetch({ calls, overlapAtThirdPage }) {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    calls.push({ url: url.toString(), method: init.method ?? 'GET' })

    if (url.hostname === 'id.twitch.tv') {
      return jsonResponse({ access_token: 'test-token', expires_in: 3600, token_type: 'bearer' })
    }

    assert.equal(url.hostname, 'api.twitch.tv')
    assert.equal(url.pathname, '/helix/streams')
    assert.equal(url.searchParams.get('first'), '100')

    const after = url.searchParams.get('after') ?? ''
    const page = after === '' ? 0 : after === 'cursor-1' ? 1 : after === 'cursor-2' ? 2 : after === 'cursor-3' ? 3 : -1
    assert.notEqual(page, -1)

    return jsonResponse({
      data: Array.from({ length: 100 }, (_, index) => mockStream({ page, index, overlapAtThirdPage })),
      pagination: { cursor: `cursor-${page + 1}` },
    })
  }
}

function mockStream({ page, index, overlapAtThirdPage }) {
  const duplicateBoundaryRow = overlapAtThirdPage && page === 2 && index === 0
  const identityPage = duplicateBoundaryRow ? 1 : page
  const identityIndex = duplicateBoundaryRow ? 99 : index
  return {
    id: `stream-${page}-${index}`,
    user_id: `user-${identityPage}-${identityIndex}`,
    user_login: `login_${identityPage}_${identityIndex}`,
    user_name: `Display ${identityPage} ${identityIndex}`,
    viewer_count: 10000 - page * 100 - index,
    title: 'must not be retained',
    tags: ['Tokyo'],
    language: 'en',
    game_id: '1',
    game_name: 'Category',
  }
}

function assertPersistence(result) {
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
}

function assertIdentityShape(result) {
  assert.deepEqual(result.fieldsIncluded, ['rank', 'twitchUserId', 'login', 'displayName', 'viewers'])
  assert.equal(result.identities.length, 300)
  assert.deepEqual(Object.keys(result.identities[0]).sort(), ['displayName', 'login', 'rank', 'twitchUserId', 'viewers'].sort())
  assert.equal(new Set(result.identities.map((row) => row.twitchUserId)).size, 300)
  assert.equal(new Set(result.identities.map((row) => row.login)).size, 300)
  assert.deepEqual(result.identities.map((row) => row.rank), Array.from({ length: 300 }, (_, index) => index + 1))
}

function assertRequestCounts(calls, expectedStreams) {
  const tokenCalls = calls.filter((call) => call.url.includes('id.twitch.tv/oauth2/token'))
  const streamCalls = calls.filter((call) => call.url.includes('api.twitch.tv/helix/streams'))
  const userCalls = calls.filter((call) => call.url.includes('/helix/users'))
  assert.equal(tokenCalls.length, 1)
  assert.equal(streamCalls.length, expectedStreams)
  assert.equal(userCalls.length, 0)
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
