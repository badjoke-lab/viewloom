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

verifyStableIdentityState({
  label: 'unavailable',
  items: [
    { channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 },
    { channelLogin: 'legacy', displayName: 'Legacy', viewers: 50 },
  ],
  expectedState: 'unavailable',
  expectedStable: 0,
  expectedMissing: 2,
  expectedAlphaId: null,
})

verifyStableIdentityState({
  label: 'partial',
  items: [
    { twitchUserId: '12345', channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 },
    { channelLogin: 'legacy', displayName: 'Legacy', viewers: 50 },
  ],
  expectedState: 'partial',
  expectedStable: 1,
  expectedMissing: 1,
  expectedAlphaId: '12345',
})

verifyStableIdentityState({
  label: 'available',
  items: [
    { user_id: '12345', channelLogin: 'alpha', displayName: 'Alpha', viewers: 100 },
    { twitchUserId: '67890', channelLogin: 'legacy', displayName: 'Legacy', viewers: 50 },
  ],
  expectedState: 'available',
  expectedStable: 2,
  expectedMissing: 0,
  expectedAlphaId: '12345',
})

function verifyStableIdentityState({
  label,
  items,
  expectedState,
  expectedStable,
  expectedMissing,
  expectedAlphaId,
}) {
  const model = buildTwitchStreamMapLiveModel({
    snapshot: {
      streamCount: items.length,
      totalViewers: items.reduce((sum, item) => sum + Number(item.viewers ?? 0), 0),
      payloadJson: JSON.stringify({ items }),
      sourceMode: 'fixture',
    },
    evidenceRecords,
  })

  assert.equal(model.coverage.stableIdentityStreams, expectedStable, `${label}: stable stream count`)
  assert.equal(model.coverage.missingStableIdentityStreams, expectedMissing, `${label}: missing stable stream count`)

  const city = projectTwitchStreamMapCityContract(model)
  assert.equal(city.identityContract.stableTwitchUserIdAvailableInMinuteSnapshot, expectedStable > 0, `${label}: stable-ID availability`)
  assert.equal(city.identityContract.stableTwitchUserIdState, expectedState, `${label}: stable-ID state`)
  assert.equal(city.identityContract.stableIdentityStreams, expectedStable, `${label}: projected stable stream count`)
  assert.equal(city.identityContract.missingStableIdentityStreams, expectedMissing, `${label}: projected missing stable stream count`)
  assert.equal(city.identityContract.loginIsStableIdentity, false, `${label}: login must not become stable identity`)
  assert.equal(city.mappedStreams[0].identity.twitchUserId, expectedAlphaId, `${label}: mapped Twitch stable ID`)
  assert.equal(city.mappedStreams[0].identity.stableIdAvailable, Boolean(expectedAlphaId), `${label}: mapped stable-ID flag`)
  assert.equal(city.publicCityUiActivated, false, `${label}: City public activation remains off`)
  assert.equal(city.currentLocationActivated, false, `${label}: Current activation remains off`)

  const country = projectTwitchStreamMapCountryOnly(model)
  assert.equal(Object.hasOwn(country.mappedStreams[0], 'twitchUserId'), false, `${label}: Country row strips stable ID`)
  assert.equal(JSON.stringify(country).includes('12345'), false, `${label}: Country response must not expose Twitch user ID`)
  assert.equal(JSON.stringify(country).includes('67890'), false, `${label}: Country response must not expose alternate Twitch user ID`)
}

console.log('twitch stream map city stable-ID state-matrix verification passed')
