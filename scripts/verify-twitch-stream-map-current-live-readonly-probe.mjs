import assert from 'node:assert/strict'
import { runCurrentLocationLiveProbe } from '../tools/twitch-stream-map-current-location-live-probe/worker.mjs'

const calls = []
const pageBodies = [
  {
    data: [
      { user_id: '1', title: 'IRL live from Seoul', tags: ['Seoul'], language: 'ko' },
      { user_id: '2', title: 'Japan trip tomorrow', tags: ['English'], language: 'en' },
    ],
    pagination: { cursor: 'page-2' },
  },
  {
    data: [
      { user_id: '3', title: 'regular stream', tags: ['Tokyo'], language: 'ja' },
      { user_id: '4', title: 'ranked games', tags: ['Just Chatting'], language: 'en' },
    ],
    pagination: {},
  },
]
let streamPage = 0

const fetchImpl = async (input, init = {}) => {
  const url = new URL(String(input))
  calls.push({ url: url.toString(), method: init.method ?? 'GET' })
  if (url.hostname === 'id.twitch.tv') {
    return new Response(JSON.stringify({ access_token: 'fixture-token' }), { status: 200 })
  }
  if (url.hostname === 'api.twitch.tv' && url.pathname === '/helix/streams') {
    const body = pageBodies[streamPage]
    streamPage += 1
    return new Response(JSON.stringify(body), { status: 200 })
  }
  return new Response('{}', { status: 404 })
}

const result = await runCurrentLocationLiveProbe({
  env: { TWITCH_CLIENT_ID: 'fixture-client', TWITCH_CLIENT_SECRET: 'fixture-secret' },
  fetchImpl,
  now: () => new Date('2026-08-28T00:00:00.000Z'),
})

assert.equal(result.provider, 'twitch')
assert.equal(result.mode, 'current_location_candidate_coverage_top300_preview')
assert.equal(result.sampleSize, 4)
assert.equal(result.coveredPages, 2)
assert.equal(result.stableIdentity, 'twitchUserId')
assert.equal(result.stableIdentityUnique, true)
assert.deepEqual(result.apiRequests, { token: 1, streams: 2, users: 0 })
assert.equal(result.persistence.d1Writes, 0)
assert.equal(result.persistence.productionDeployment, false)
assert.equal(result.persistence.rawTitleStored, false)
assert.equal(result.persistence.rawTagsStored, false)
assert.equal(result.persistence.rawLanguageStored, false)
assert.equal(result.persistence.rawTextArtifactAllowed, false)
assert.equal(result.persistence.canonicalMutationApplied, false)
assert.equal(result.decision.status, 'candidate_only')
assert.equal(result.decision.acceptanceAuthorized, false)
assert.equal(result.decision.publicCurrentPlacementAuthorized, false)
assert.equal(result.decision.baseMutationAuthorized, false)
assert.equal(result.decision.languageUsedForPlacement, false)
assert.deepEqual(result.fieldsReturned, ['aggregate_candidate_counts', 'source_yield', 'candidate_countries'])
assert.equal(result.measurement.population, 4)
assert.equal(result.measurement.candidateStreams, 2)
assert.equal(result.measurement.candidateCoverage, 0.5)
assert.equal(result.measurement.counts.titleCandidateStreams, 1)
assert.equal(result.measurement.counts.tagCandidateStreams, 2)
assert.equal(result.measurement.counts.rejectedFutureTravelTitles, 1)
assert.deepEqual(result.measurement.candidateCountries, { JP: 1, KR: 1 })

const serialized = JSON.stringify(result)
for (const raw of ['IRL live from Seoul', 'Japan trip tomorrow', 'regular stream', 'ranked games', 'Seoul', 'Tokyo']) {
  assert.equal(serialized.includes(raw), false, `raw stream text leaked into result: ${raw}`)
}
assert.equal(calls.filter((call) => call.url.includes('/oauth2/token')).length, 1)
assert.equal(calls.filter((call) => call.url.includes('/helix/streams')).length, 2)
assert.equal(calls.some((call) => call.url.includes('/helix/users')), false)

console.log(JSON.stringify({
  ok: true,
  provider: result.provider,
  mode: result.mode,
  apiRequests: result.apiRequests,
  rawTextRetained: false,
  productionDeployment: false,
  d1Writes: 0,
  publicCurrentPlacementAuthorized: false,
}, null, 2))
