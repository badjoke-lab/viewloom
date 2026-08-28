import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runCurrentLocationReviewQueueProbe } from '../tools/twitch-stream-map-current-review-queue-live-probe/worker.mjs'

const workerSource = readFileSync('tools/twitch-stream-map-current-review-queue-live-probe/worker.mjs', 'utf8')
const wranglerSource = readFileSync('tools/twitch-stream-map-current-review-queue-live-probe/wrangler.toml', 'utf8')
const workflowSource = readFileSync('.github/workflows/twitch-stream-map-current-review-queue-live-probe.yml', 'utf8')

const calls = []
const responses = [
  new Response(JSON.stringify({ access_token: 'test-token' }), { status: 200 }),
  new Response(JSON.stringify({
    data: [
      { user_id: '1', user_login: 'tokyo_live', title: 'IRL live in Tokyo', tags: [], language: 'en' },
      { user_id: '2', user_login: 'japan_tag', title: 'regular stream', tags: ['Japan'], language: 'ja' },
      { user_id: '3', user_login: 'future_trip', title: 'Japan trip tomorrow', tags: ['Japan'], language: 'en' },
      { user_id: '4', user_login: 'no_location', title: 'just chatting', tags: [], language: 'en' }
    ],
    pagination: {}
  }), { status: 200 }),
]

const fetchImpl = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method ?? 'GET' })
  const response = responses.shift()
  if (!response) throw new Error(`unexpected_fetch:${url}`)
  return response
}

const result = await runCurrentLocationReviewQueueProbe({
  env: { TWITCH_CLIENT_ID: 'client', TWITCH_CLIENT_SECRET: 'secret' },
  fetchImpl,
  now: () => new Date('2026-08-28T11:00:00.000Z'),
})

assert.equal(result.schemaVersion, 'viewloom-twitch-stream-map-current-review-queue-live-probe-v0.1')
assert.equal(result.provider, 'twitch')
assert.equal(result.mode, 'current_location_review_queue_top300_preview')
assert.equal(result.requestedSize, 300)
assert.equal(result.sampleSize, 4)
assert.equal(result.coveredPages, 1)
assert.equal(result.stableIdentity, 'twitchUserId')
assert.equal(result.stableIdentityUnique, true)
assert.equal(result.apiRequests.token, 1)
assert.equal(result.apiRequests.streams, 1)
assert.equal(result.apiRequests.users, 0)
assert.equal(calls.length, 2)
assert.ok(calls[0].url.startsWith('https://id.twitch.tv/oauth2/token'))
assert.ok(calls[1].url.startsWith('https://api.twitch.tv/helix/streams'))
assert.equal(calls.some((call) => call.url.includes('/helix/users')), false)

assert.equal(result.persistence.d1Writes, 0)
assert.equal(result.persistence.productionDeployment, false)
assert.equal(result.persistence.rawTitleStored, false)
assert.equal(result.persistence.rawTagsStored, false)
assert.equal(result.persistence.rawLanguageStored, false)
assert.equal(result.persistence.rawTextArtifactAllowed, false)
assert.equal(result.persistence.canonicalMutationApplied, false)
assert.equal(result.decision.status, 'review_queue_only')
assert.equal(result.decision.acceptanceAuthorized, false)
assert.equal(result.decision.publicCurrentPlacementAuthorized, false)
assert.equal(result.decision.baseMutationAuthorized, false)
assert.equal(result.decision.languageUsedForPlacement, false)

assert.equal(result.review.summary.reviewableCandidates, 2)
assert.equal(result.review.summary.rejectedFutureTravel, 1)
assert.deepEqual(result.review.reviewQueue.map((row) => row.userLogin), ['tokyo_live', 'japan_tag'])
assert.equal(result.review.rejected[0]?.userLogin, 'future_trip')
assert.equal(result.review.boundary.titleOrTagCanAutoAccept, false)
assert.equal(result.review.boundary.rawTextRetained, false)

const serializedResult = JSON.stringify(result)
const serializedReview = JSON.stringify(result.review)
for (const rawTitle of ['IRL live in Tokyo', 'regular stream', 'Japan trip tomorrow', 'just chatting']) {
  assert.equal(serializedResult.includes(rawTitle), false, `raw title leaked: ${rawTitle}`)
}
for (const rawField of ['title', 'tags', 'language']) {
  assert.equal(serializedReview.includes(`\"${rawField}\"`), false, `raw field returned in review payload: ${rawField}`)
}

assert.ok(workerSource.includes('MAX_PAGES = 3'))
assert.ok(workerSource.includes("users: 0"))
assert.equal(workerSource.includes("https://api.twitch.tv/helix/users"), false)
assert.ok(wranglerSource.includes('no D1 binding'))
assert.ok(wranglerSource.includes('MUST NOT be used with `wrangler deploy`'))
assert.ok(workflowSource.includes('wrangler@4 versions upload'))
assert.ok(workflowSource.includes('--preview-alias'))
assert.equal(/wrangler@4\s+deploy(?!\s+--dry-run)/.test(workflowSource), false)
assert.ok(workflowSource.includes('exact one-file'))
assert.ok(workflowSource.includes('rawTextArtifactAllowed == false'))
assert.ok(workflowSource.includes('automaticAcceptanceAuthorized == false'))
assert.ok(workflowSource.includes('publicCurrentPlacementAuthorized == false'))

console.log(JSON.stringify({
  ok: true,
  sampleSize: result.sampleSize,
  reviewableCandidates: result.review.summary.reviewableCandidates,
  rejectedFutureTravel: result.review.summary.rejectedFutureTravel,
  tokenRequests: result.apiRequests.token,
  streamsRequests: result.apiRequests.streams,
  usersRequests: result.apiRequests.users,
  rawTextArtifactAllowed: result.persistence.rawTextArtifactAllowed,
  acceptanceAuthorized: result.decision.acceptanceAuthorized,
  productionDeployment: result.persistence.productionDeployment
}, null, 2))
