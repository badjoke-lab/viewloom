import assert from 'node:assert/strict'
import { measureCityCoverage } from '../tools/twitch-stream-map-coverage-expansion/city-coverage.mjs'

const populationArtifact = {
  schemaVersion: 'viewloom-twitch-stream-map-top300-stable-identity-artifact-v0.1',
  observedAt: '2026-08-24T04:00:00.000Z',
  identities: [
    { rank: 1, twitchUserId: '1', login: 'city_person', displayName: 'City Person', viewers: 100 },
    { rank: 2, twitchUserId: '2', login: 'country_person', displayName: 'Country Person', viewers: 80 },
    { rank: 3, twitchUserId: '3', login: 'unreviewed_person', displayName: 'Unreviewed', viewers: 60 },
    { rank: 4, twitchUserId: '4', login: 'event_channel', displayName: 'Event Channel', viewers: 40 },
    { rank: 5, twitchUserId: '5', login: 'conflict_person', displayName: 'Conflict Person', viewers: 20 },
  ],
}

const reviewedRecords = [
  {
    streamerLogin: 'city_person',
    entityKind: 'person',
    evidences: [{
      status: 'accepted',
      claimKind: 'home_base',
      countryCode: 'JP',
      countryName: 'Japan',
      region: null,
      city: 'Tokyo',
      source: 'manual_review',
      observedAt: '2026-08-23T00:00:00.000Z',
    }],
  },
  {
    streamerLogin: 'country_person',
    entityKind: 'person',
    evidences: [{
      status: 'accepted',
      claimKind: 'declared_location',
      countryCode: 'DE',
      countryName: 'Germany',
      city: null,
      source: 'official_external',
      observedAt: '2026-08-23T00:00:00.000Z',
    }],
  },
  { streamerLogin: 'event_channel', entityKind: 'event_broadcast', evidences: [] },
  {
    streamerLogin: 'conflict_person',
    entityKind: 'person',
    evidences: [
      {
        status: 'accepted',
        claimKind: 'home_base',
        countryCode: 'US',
        city: 'Los Angeles',
        observedAt: '2026-08-22T00:00:00.000Z',
      },
      {
        status: 'accepted',
        claimKind: 'declared_location',
        countryCode: 'US',
        city: 'Miami',
        observedAt: '2026-08-23T00:00:00.000Z',
      },
    ],
  },
]

const result = measureCityCoverage({ populationArtifact, reviewedRecords })
assert.equal(result.schemaVersion, 'viewloom-stream-map-city-live-coverage-v0.1')
assert.equal(result.populationSize, 5)
assert.equal(result.totalViewers, 300)
assert.equal(result.personEligiblePopulation, 4)
assert.equal(result.cityPlaceableStreams, 1)
assert.equal(result.cityPlaceableViewers, 100)
assert.equal(result.cityStreamCoveragePct, 20)
assert.equal(result.cityViewerCoveragePct, 33.333)
assert.equal(result.countryPlaceableStreams, 2)
assert.equal(result.countryPlaceableViewers, 180)
assert.equal(result.countryStreamCoveragePct, 40)
assert.equal(result.countryViewerCoveragePct, 60)
assert.equal(result.eligibleUnmappedPersons.length, 2)
assert.equal(result.baseCityConflicts.length, 1)
assert.equal(result.excludedNonPerson.length, 1)
assert.equal(result.reconciliation.cityPlaceable, 1)
assert.equal(result.reconciliation.countryOnly, 1)
assert.equal(result.reconciliation.eligibleUnmapped, 2)
assert.equal(result.reconciliation.excludedNonPerson, 1)
assert.equal(result.reconciliation.reconciledPopulation, 5)
assert.equal(result.reconciliation.passes, true)
assert.equal(result.privacy.passesStaticKeyCheck, true)
assert.equal(result.decision.recommendation, 'no_go_city_api_contract')
assert.equal(result.decision.publicCityFieldsActivated, false)
assert.equal(result.decision.currentLocationActivated, false)
assert.deepEqual(result.cityPlaceableByCity, [{
  countryCode: 'JP',
  region: null,
  city: 'Tokyo',
  streams: 1,
  viewers: 100,
}])

const noConflictRecords = reviewedRecords.map((record) =>
  record.streamerLogin === 'conflict_person'
    ? { ...record, evidences: [record.evidences[0]] }
    : record
)
const go = measureCityCoverage({ populationArtifact, reviewedRecords: noConflictRecords })
assert.equal(go.baseCityConflicts.length, 0)
assert.equal(go.cityPlaceableStreams, 2)
assert.equal(go.reconciliation.passes, true)
assert.equal(go.decision.recommendation, 'go_city_api_contract')

const currentOnly = measureCityCoverage({
  populationArtifact: {
    schemaVersion: 'fixture',
    observedAt: '2026-08-24T04:00:00.000Z',
    identities: [{ rank: 1, twitchUserId: '10', login: 'traveler', displayName: 'Traveler', viewers: 50 }],
  },
  reviewedRecords: [{
    streamerLogin: 'traveler',
    entityKind: 'person',
    evidences: [{
      status: 'accepted',
      claimKind: 'current_location',
      countryCode: 'JP',
      city: 'Tokyo',
      observedAt: '2026-08-24T03:00:00.000Z',
    }],
  }],
})
assert.equal(currentOnly.cityPlaceableStreams, 0)
assert.equal(currentOnly.countryPlaceableStreams, 0)
assert.equal(currentOnly.eligibleUnmappedPersons.length, 1)
assert.equal(currentOnly.decision.recommendation, 'no_go_city_api_contract')

assert.throws(() => measureCityCoverage({
  populationArtifact: {
    observedAt: '2026-08-24T04:00:00.000Z',
    identities: [
      { rank: 1, twitchUserId: 'dup', login: 'one', viewers: 1 },
      { rank: 2, twitchUserId: 'dup', login: 'two', viewers: 1 },
    ],
  },
  reviewedRecords: [],
}), /duplicate_twitch_user_id/)

console.log('Twitch Stream Map City live coverage verification passed')
console.log(JSON.stringify({
  populationSize: result.populationSize,
  cityPlaceableStreams: result.cityPlaceableStreams,
  countryPlaceableStreams: result.countryPlaceableStreams,
  reconciliationPasses: result.reconciliation.passes,
  conflictDecision: result.decision.recommendation,
  cleanDecision: go.decision.recommendation,
}, null, 2))
