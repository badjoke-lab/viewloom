#!/usr/bin/env node

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  countrySelectionState,
  groupMappedStreamsByCountry,
  selectCountryStreams,
} from '../src/features/twitch-stream-map/country-drilldown-core.mjs'

const streams = [
  {
    login: 'alpha',
    displayName: 'Alpha',
    viewers: 100,
    url: 'https://www.twitch.tv/alpha',
    entityKind: 'person',
    location: { countryCode: 'US', countryName: 'United States', regions: [], cities: [], locationTypes: ['declared_location'] },
    sources: ['official_external', 'manual_review'],
    evidence: [],
  },
  {
    login: 'beta',
    displayName: 'Beta',
    viewers: 60,
    url: 'https://www.twitch.tv/beta',
    entityKind: 'person',
    location: { countryCode: 'JP', countryName: 'Japan', regions: [], cities: [], locationTypes: ['home_base'] },
    sources: ['account_profile'],
    evidence: [],
  },
  {
    login: 'gamma',
    displayName: 'Gamma',
    viewers: 40,
    url: 'https://www.twitch.tv/gamma',
    entityKind: 'person',
    location: { countryCode: 'US', countryName: 'United States', regions: [], cities: [], locationTypes: ['current_location'] },
    sources: ['stream_title'],
    evidence: [],
  },
]

const groups = groupMappedStreamsByCountry(streams)
assert.equal(groups.length, 2)
assert.equal(groups[0].countryCode, 'US')
assert.equal(groups[0].viewers, 140)
assert.equal(groups[0].streams.length, 2)
assert.deepEqual(groups[0].sourceCounts, {
  official_external: 1,
  manual_review: 1,
  stream_title: 1,
})
assert.equal(groups[1].countryCode, 'JP')

assert.equal(selectCountryStreams(streams, null).length, 3)
assert.equal(selectCountryStreams(streams, 'us').length, 2)
assert.equal(selectCountryStreams(streams, 'DE').length, 0)

const selected = countrySelectionState(streams, 'us')
assert.equal(selected.selectedCountry, 'US')
assert.equal(selected.selectedExists, true)
assert.equal(selected.selectedEmpty, false)
assert.equal(selected.country?.countryName, 'United States')
assert.equal(selected.visibleStreams.length, 2)

const selectedFilteredOut = countrySelectionState(streams.filter((stream) => stream.location.countryCode === 'JP'), 'US')
assert.equal(selectedFilteredOut.selectedCountry, 'US')
assert.equal(selectedFilteredOut.selectedExists, false)
assert.equal(selectedFilteredOut.selectedEmpty, true)
assert.equal(selectedFilteredOut.country, null)
assert.deepEqual(selectedFilteredOut.visibleStreams, [])

const unselected = countrySelectionState(streams, null)
assert.equal(unselected.selectedCountry, null)
assert.equal(unselected.selectedExists, false)
assert.equal(unselected.selectedEmpty, false)
assert.equal(unselected.visibleStreams.length, 3)

const page = readFileSync('twitch/map/index.html', 'utf8')
const entry = readFileSync('src/features/twitch-stream-map/stream-map-entry.ts', 'utf8')
const css = readFileSync('src/features/twitch-stream-map/stream-map.css', 'utf8')

assert.ok(page.includes('id="stream-map-selected-country"'))
assert.ok(page.includes('data-clear-selected-country'))
assert.ok(page.includes('id="stream-map-selected-country-sources"'))
assert.ok(page.includes('id="stream-map-stream-list-title"'))
assert.ok(page.includes('Select a country on the map or in the country list to drill into its currently mapped streams.'))
assert.ok(page.includes('small-country fallback controls remain aggregate selectors, not creator locations.'))
assert.equal(page.includes('Select a country marker'), false)
assert.equal(page.includes('Country markers are buttons'), false)

assert.ok(entry.includes('let selectedCountry: string | null = null'))
assert.ok(entry.includes('countrySelectionState(filtered, selectedCountry)'))
assert.ok(entry.includes("row.setAttribute('aria-pressed'"))
assert.ok(entry.includes("element.setAttribute('aria-pressed'"))
assert.ok(entry.includes('selectCountry(country.countryCode, country.countryName'))
assert.ok(entry.includes('clearCountryButton?.addEventListener'))
assert.ok(entry.includes('The selected country has no mapped streamer under the active population/evidence filters.'))
assert.ok(entry.includes('Country drilldown is active; population and source/type filters still apply.'))

assert.ok(css.includes('.stream-map-selected-country'))
assert.ok(css.includes('.stream-map-country-row.is-selected'))
assert.ok(css.includes('.stream-map-country-marker.is-selected'))
assert.ok(css.includes('.stream-map-country-row:focus-visible'))
assert.ok(css.includes('.stream-map-country-marker:focus-visible'))

console.log(JSON.stringify({
  ok: true,
  countryGrouping: true,
  selectedCountryState: true,
  filteredZeroStateRetained: true,
  countryMapOrListSelectionCopy: true,
  smallCountryFallbackBoundary: true,
  countryRowSelection: true,
  clearSelection: true,
  keyboardAndTapControls: true,
  populationFilterPreserved: true,
}, null, 2))
