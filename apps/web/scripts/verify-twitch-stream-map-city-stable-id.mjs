import assert from 'node:assert/strict'
import { buildTwitchStreamMapLiveModel } from '../functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCityContract, projectTwitchStreamMapCountryOnly } from '../functions/api/twitch-stream-map-public-core.mjs'

const evidenceRecords = [{
  streamerLogin: 'alpha',
  entityKind: 'person',
  evidences: [{
    source: 'official_external',
    sourceUrl: 'https://example.com/alpha',
    observedAt: '2026-09-03T00:00:00Z',
    countryCode: 'JP',
    countryName: 'Japan',
    region: 'Tokyo',
    city: 'Tokyo',
    claimKind: 'declared_location',
    confidence: 'explicit',
    status: 'accepted',
  }],
}]

const model = buildTwitchStreamMapLiveModel({
  snapshot: {
    streamCount: 2,
    totalViewers: 150,
    payloadJson: JSON.stringify({ items: [
      { twitchUserId: '12345', channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 },
      { channelLogin: 'legacy', displayName: 'Legacy', viewers: 50 },
    ] }),
    sourceMode: 'fixture',
  },
  evidenceRecords,
})

assert.equal(model.coverage.stableIdentityStreams, 1)
assert.equal(model.coverage.missingStableIdentityStreams, 1)
assert.equal(model.mappedStreams[0].twitchUserId, '12345')

const city = projectTwitchStreamMapCityContract(model)
assert.equal(city.identityContract.stableTwitchUserIdAvailableInMinuteSnapshot, true)
assert.equal(city.identityContract.stableTwitchUserIdState, 'partial')
assert.equal(city.identityContract.stableIdentityStreams, 1)
assert.equal(city.identityContract.missingStableIdentityStreams, 1)
assert.equal(city.identityContract.loginIsStableIdentity, false)
assert.equal(city.mappedStreams[0].identity.twitchUserId, '12345')
assert.equal(city.mappedStreams[0].identity.stableIdAvailable, true)
assert.equal(city.publicCityUiActivated, false)
assert.equal(city.currentLocationActivated, false)

const country = projectTwitchStreamMapCountryOnly(model)
assert.equal(Object.hasOwn(country.mappedStreams[0], 'twitchUserId'), false)
assert.equal(JSON.stringify(country).includes('12345'), false)

console.log('twitch stream map city stable-ID verification passed')
