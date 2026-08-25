#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  projectTwitchStreamMapCityContract,
  projectTwitchStreamMapCountryOnly,
} from '../functions/api/twitch-stream-map-public-core.mjs'

const evidence = (locationType, countryCode, countryName, city = null, region = null, source = 'manual_review') => ({
  source,
  sourceUrl: `https://example.com/${countryCode}/${city ?? 'country'}`,
  observedAt: '2026-08-24T00:00:00.000Z',
  countryCode,
  countryName,
  region,
  city,
  locationType,
  confidence: 'explicit',
})

const row = (login, viewers, evidences) => ({
  login,
  displayName: login,
  viewers,
  url: `https://www.twitch.tv/${login}`,
  entityKind: 'person',
  location: {
    countryCode: evidences[0]?.countryCode ?? '',
    countryName: evidences[0]?.countryName ?? '',
    regions: evidences.map((item) => item.region).filter(Boolean),
    cities: evidences.map((item) => item.city).filter(Boolean),
    locationTypes: evidences.map((item) => item.locationType),
  },
  evidence: evidences,
  sources: [...new Set(evidences.map((item) => item.source))],
})

const model = {
  version: 'viewloom-stream-map-live-v1',
  platform: 'twitch',
  source: 'real',
  sourceMode: 'official',
  updatedAt: '2026-08-24T00:00:00.000Z',
  coverage: {
    topLimit: 5,
    observedStreams: 5,
    observedViewers: 500,
    payloadStreams: 5,
    missingPayloadStreams: 0,
    mappedStreams: 4,
    unmappedStreams: 1,
    eligibleUnmappedStreams: 0,
    excludedNonPersonStreams: 1,
    mappedPercent: 0.8,
    mappedViewers: 450,
    unmappedViewers: 50,
    excludedNonPersonViewers: 50,
    mappedViewerPercent: 0.9,
    mappedCountryCount: 2,
    currentLocationStreams: 1,
    currentLocationPercent: 0.2,
    coveredPages: 1,
    hasMore: false,
    mappedBySource: {},
    unmappedReasons: {},
  },
  mappedStreams: [
    row('alpha', 150, [evidence('declared_location', 'US', 'United States', 'Austin', 'Texas', 'official_external')]),
    row('beta', 120, [evidence('home_base', 'JP', 'Japan', null, null, 'account_profile')]),
    row('gamma', 100, [evidence('current_location', 'US', 'United States', 'New York', 'New York', 'stream_title')]),
    row('delta', 80, [
      evidence('declared_location', 'US', 'United States', 'Los Angeles', 'California'),
      evidence('home_base', 'US', 'United States', 'San Francisco', 'California'),
    ]),
  ],
  excludedNonPersonStreams: [
    { login: 'event', displayName: 'Event', viewers: 50, url: 'https://www.twitch.tv/event', entityKind: 'event_broadcast' },
  ],
  semantics: {
    languageUsedForPlacement: false,
    candidateOnlyPlacementAllowed: false,
    nonPersonPlacementAllowed: false,
    conflictingAcceptedCountriesAreMapped: false,
    mappedPlusUnmappedEqualsObserved: true,
    excludedNonPersonIsSubsetOfUnmapped: true,
    evidenceSourcesRemainDistinct: true,
  },
}

const country = projectTwitchStreamMapCountryOnly(model)
assert.equal(country.version, 'viewloom-stream-map-live-v1')
assert.equal(country.mappedStreams.length, 4)
assert.deepEqual(country.mappedStreams[0].location.cities, [])
assert.equal(country.mappedStreams[0].evidence[0].city, null)
assert.equal('countryOnlyStreams' in country, false)
assert.equal('cityCoverage' in country, false)

const city = projectTwitchStreamMapCityContract(model)
assert.equal(city.version, 'viewloom-stream-map-city-contract-v0.1')
assert.equal(city.geographyMode, 'city')
assert.equal(city.publicCityUiActivated, false)
assert.equal(city.currentLocationActivated, false)
assert.equal(city.identityContract.joinKey, 'login')
assert.equal(city.identityContract.stableTwitchUserIdAvailableInMinuteSnapshot, false)
assert.equal(city.mappedStreams.length, 1)
assert.equal(city.mappedStreams[0].login, 'alpha')
assert.deepEqual(city.mappedStreams[0].location.cities, ['Austin'])
assert.deepEqual(city.mappedStreams[0].location.locationTypes, ['declared_location'])
assert.equal(city.mappedStreams[0].identity.twitchUserId, null)
assert.equal(city.mappedStreams[0].identity.stableIdAvailable, false)
assert.equal(city.countryOnlyStreams.length, 1)
assert.equal(city.countryOnlyStreams[0].login, 'beta')
assert.equal(city.baseCityConflicts.length, 1)
assert.equal(city.baseCityConflicts[0].login, 'delta')
assert.equal(city.baseCityConflicts[0].reason, 'base_city_conflict')
assert.equal(city.mappedStreams.some((item) => item.login === 'gamma'), false)
assert.equal(city.countryOnlyStreams.some((item) => item.login === 'gamma'), false)
assert.equal(city.cityCoverage.cityPlaceableStreams, 1)
assert.equal(city.cityCoverage.countryOnlyStreams, 1)
assert.equal(city.cityCoverage.eligibleUnmappedStreams, 2)
assert.equal(city.cityCoverage.excludedNonPersonStreams, 1)
assert.equal(city.cityCoverage.conflictUnmappedStreams, 1)
assert.equal(city.cityCoverage.reconciliation.selectedPopulation, 5)
assert.equal(city.cityCoverage.reconciliation.reconciledPopulation, 5)
assert.equal(city.cityCoverage.reconciliation.passes, true)
assert.equal(city.semantics.currentLocationUsedForBaseCityPlacement, false)
assert.equal(city.semantics.birthplaceUsedForBaseCityPlacement, false)
assert.equal(city.semantics.eventVenueUsedForBaseCityPlacement, false)
assert.equal(city.semantics.preciseAddressPublished, false)
assert.equal(city.semantics.coordinatesPublished, false)

const serialized = JSON.stringify(city)
assert.equal(serialized.includes('latitude'), false)
assert.equal(serialized.includes('longitude'), false)
assert.equal(serialized.includes('address'), false)

const api = readFileSync('functions/api/twitch-stream-map.ts', 'utf8')
assert.ok(api.includes("url.searchParams.get('geography')"))
assert.ok(api.includes("normalized === 'city'"))
assert.ok(api.includes("normalized === 'country'"))
assert.ok(api.includes('invalid_geography_mode'))
assert.ok(api.includes('projectTwitchStreamMapCityContract(model)'))
assert.ok(api.includes('projectTwitchStreamMapCountryOnly(model)'))

console.log(JSON.stringify({
  ok: true,
  defaultCountryCompatible: true,
  explicitCityBoundary: true,
  baseClaimsOnly: true,
  currentLocationExcluded: true,
  countryOnlyExplicit: true,
  conflictFailClosed: true,
  exactReconciliation: true,
  preciseLocationExcluded: true,
  stableIdGapExplicit: true,
  publicCityUiActivated: false,
}, null, 2))
