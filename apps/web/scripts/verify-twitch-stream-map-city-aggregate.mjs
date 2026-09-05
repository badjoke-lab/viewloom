#!/usr/bin/env node

import assert from 'node:assert/strict'
import {
  cityAggregateKeyFromStream,
  citySelectionState,
  groupCityMappedStreams,
} from '../src/features/twitch-stream-map/city-aggregate-core.mjs'

const stream = (login, viewers, countryCode, countryName, city, region, sources = ['manual_review']) => ({
  login,
  displayName: login,
  viewers,
  url: `https://www.twitch.tv/${login}`,
  entityKind: 'person',
  location: {
    countryCode,
    countryName,
    regions: region ? [region] : [],
    cities: city ? [city] : [],
    locationTypes: ['declared_location'],
  },
  evidence: [],
  sources,
})

const rows = [
  stream('alpha', 100, 'US', 'United States', 'Springfield', 'Illinois', ['manual_review', 'official_external']),
  stream('beta', 60, 'US', 'United States', 'Springfield', 'Illinois', ['manual_review']),
  stream('gamma', 90, 'US', 'United States', 'Springfield', 'Massachusetts', ['account_profile']),
  stream('delta', 70, 'CA', 'Canada', 'London', 'Ontario', ['official_external']),
  stream('epsilon', 50, 'GB', 'United Kingdom', 'London', null, ['manual_review']),
]

const aggregates = groupCityMappedStreams(rows)
assert.equal(aggregates.length, 4)

const illinois = aggregates.find((item) => item.city === 'Springfield' && item.region === 'Illinois')
assert.ok(illinois)
assert.equal(illinois.streams.length, 2)
assert.equal(illinois.viewers, 160)
assert.deepEqual(illinois.sourceCounts, { manual_review: 2, official_external: 1 })

const massachusetts = aggregates.find((item) => item.city === 'Springfield' && item.region === 'Massachusetts')
assert.ok(massachusetts)
assert.notEqual(massachusetts.key, illinois.key)

const canadaLondon = aggregates.find((item) => item.city === 'London' && item.countryCode === 'CA')
const ukLondon = aggregates.find((item) => item.city === 'London' && item.countryCode === 'GB')
assert.ok(canadaLondon)
assert.ok(ukLondon)
assert.notEqual(canadaLondon.key, ukLondon.key)
assert.match(ukLondon.key, /__none__/)

assert.equal(cityAggregateKeyFromStream(stream('no-city', 1, 'US', 'United States', '', 'Texas')), '')
assert.equal(cityAggregateKeyFromStream(stream('no-country', 1, '', '', 'Austin', 'Texas')), '')

const selected = citySelectionState(rows, illinois.key)
assert.equal(selected.selectedExists, true)
assert.equal(selected.selectedEmpty, false)
assert.equal(selected.aggregate?.viewers, 160)
assert.deepEqual(selected.visibleStreams.map((item) => item.login).sort(), ['alpha', 'beta'])

const retainedZero = citySelectionState(rows.filter((item) => item.login !== 'alpha' && item.login !== 'beta'), illinois.key)
assert.equal(retainedZero.selectedKey, illinois.key)
assert.equal(retainedZero.selectedExists, false)
assert.equal(retainedZero.selectedEmpty, true)
assert.equal(retainedZero.aggregate, null)
assert.deepEqual(retainedZero.visibleStreams, [])

const all = citySelectionState(rows, null)
assert.equal(all.selectedKey, null)
assert.equal(all.visibleStreams.length, rows.length)

console.log(JSON.stringify({
  ok: true,
  aggregateCount: aggregates.length,
  sameCitySameRegionGrouped: true,
  sameCityDifferentRegionSeparated: true,
  sameNameDifferentCountrySeparated: true,
  missingRegionExplicit: true,
  selectedDrilldown: true,
  retainedZeroState: true,
}, null, 2))
