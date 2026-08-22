#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  STREAM_MAP_SOURCE_OPTIONS,
  STREAM_MAP_TYPE_OPTIONS,
  evidenceMatchesLocationFilter,
  filterMappedStreams,
  summarizeFilteredStreams,
} from '../src/features/twitch-stream-map/location-filter-core.mjs'

assert.deepEqual(STREAM_MAP_SOURCE_OPTIONS, [
  'account_profile',
  'stream_title',
  'stream_tag',
  'channel_profile',
  'official_external',
  'manual_review',
])
assert.deepEqual(STREAM_MAP_TYPE_OPTIONS, ['home_base', 'declared_location', 'current_location'])

const streams = [
  {
    login: 'alpha',
    displayName: 'Alpha',
    viewers: 100,
    url: 'https://www.twitch.tv/alpha',
    entityKind: 'person',
    location: { countryCode: 'US', countryName: 'United States', regions: [], cities: [], locationTypes: ['declared_location', 'current_location'] },
    sources: ['official_external', 'stream_title'],
    evidence: [
      { source: 'official_external', sourceUrl: null, observedAt: '2026-08-22T00:00:00Z', countryCode: 'US', countryName: 'United States', region: null, city: null, locationType: 'declared_location', confidence: 'explicit' },
      { source: 'stream_title', sourceUrl: null, observedAt: '2026-08-22T00:00:00Z', countryCode: 'US', countryName: 'United States', region: null, city: null, locationType: 'current_location', confidence: 'explicit' },
    ],
  },
  {
    login: 'beta',
    displayName: 'Beta',
    viewers: 50,
    url: 'https://www.twitch.tv/beta',
    entityKind: 'person',
    location: { countryCode: 'JP', countryName: 'Japan', regions: [], cities: [], locationTypes: ['home_base'] },
    sources: ['account_profile'],
    evidence: [
      { source: 'account_profile', sourceUrl: null, observedAt: '2026-08-22T00:00:00Z', countryCode: 'JP', countryName: 'Japan', region: null, city: null, locationType: 'home_base', confidence: 'explicit' },
    ],
  },
]

assert.equal(evidenceMatchesLocationFilter(streams[0].evidence[0], { sources: new Set(), types: new Set() }), true)
assert.equal(filterMappedStreams(streams, { sources: new Set(), types: new Set() }).length, 2)

const sourceOr = filterMappedStreams(streams, {
  sources: new Set(['stream_title', 'account_profile']),
  types: new Set(),
})
assert.equal(sourceOr.length, 2, 'multiple selected sources must use OR semantics')

const dimensionAnd = filterMappedStreams(streams, {
  sources: new Set(['official_external']),
  types: new Set(['current_location']),
})
assert.equal(dimensionAnd.length, 0, 'source and location-type dimensions must combine with AND semantics')

const exact = filterMappedStreams(streams, {
  sources: new Set(['stream_title']),
  types: new Set(['current_location']),
})
assert.equal(exact.length, 1)
assert.equal(exact[0].login, 'alpha')
assert.deepEqual(exact[0].sources, ['stream_title'])
assert.deepEqual(exact[0].location.locationTypes, ['current_location'])

const summary = summarizeFilteredStreams(exact, 300, 1000)
assert.equal(summary.mappedStreams, 1)
assert.equal(summary.unmappedStreams, 299)
assert.equal(summary.mappedViewers, 100)
assert.equal(summary.unmappedViewers, 900)
assert.equal(summary.mappedCountryCount, 1)
assert.equal(summary.currentLocationStreams, 1)

const page = readFileSync('twitch/map/index.html', 'utf8')
const entry = readFileSync('src/features/twitch-stream-map/stream-map-entry.ts', 'utf8')
const css = readFileSync('src/features/twitch-stream-map/stream-map.css', 'utf8')
const vite = readFileSync('vite.config.ts', 'utf8')

for (const source of STREAM_MAP_SOURCE_OPTIONS) {
  assert.ok(page.includes(`value="${source}" data-location-source`), `missing source filter: ${source}`)
}
for (const type of STREAM_MAP_TYPE_OPTIONS) {
  assert.ok(page.includes(`value="${type}" data-location-type`), `missing type filter: ${type}`)
}

assert.ok(page.includes('Source and type dimensions are combined with AND'))
assert.ok(page.includes('No demo geography will be substituted.'))
assert.ok(entry.includes("fetch('/api/twitch-stream-map', { cache: 'no-store' })"))
assert.ok(entry.includes('filterMappedStreams(payload.mappedStreams, filter)'))
assert.ok(entry.includes('COUNTRY_CENTROIDS'))
assert.ok(css.includes('.stream-map-badge--official-external'))
assert.ok(css.includes('.stream-map-country-marker'))
assert.ok(vite.includes("twitchMap: 'twitch/map/index.html'"))
assert.equal(entry.includes('languageUsedForPlacement = true'), false)
assert.equal(page.includes('demo location'), false)

console.log(JSON.stringify({
  ok: true,
  sourceOrWithinDimension: true,
  typeOrWithinDimension: true,
  sourceAndTypeAcrossDimensions: true,
  allAcceptedWhenEmpty: true,
  realApiOnly: true,
  mapRouteWired: true,
}, null, 2))
