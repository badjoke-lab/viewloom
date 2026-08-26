import assert from 'node:assert/strict'
import {
  STREAM_MAP_CURRENT_IRL_UI_ACTIVE,
  STREAM_MAP_PUBLIC_GEOGRAPHY_MODES,
  applyStreamMapGeographyMode,
  geographyModeLabel,
  normalizeStreamMapGeographyMode,
} from '../apps/web/src/features/twitch-stream-map/geography-mode-core.mjs'

assert.deepEqual(STREAM_MAP_PUBLIC_GEOGRAPHY_MODES, ['country', 'city'])
assert.equal(STREAM_MAP_CURRENT_IRL_UI_ACTIVE, false)
assert.equal(normalizeStreamMapGeographyMode(null), 'country')
assert.equal(normalizeStreamMapGeographyMode('country'), 'country')
assert.equal(normalizeStreamMapGeographyMode('city'), 'city')
assert.equal(normalizeStreamMapGeographyMode('current'), 'country')
assert.equal(geographyModeLabel('country'), 'Country')
assert.equal(geographyModeLabel('city'), 'City')

const base = '/api/twitch-stream-map?top=300&min_viewers=0&category=all'
assert.equal(
  applyStreamMapGeographyMode(base, 'country'),
  '/api/twitch-stream-map?top=300&min_viewers=0&category=all',
)
assert.equal(
  applyStreamMapGeographyMode(base, 'city'),
  '/api/twitch-stream-map?top=300&min_viewers=0&category=all&geography=city',
)
assert.equal(
  applyStreamMapGeographyMode(`${base}&geography=city`, 'country'),
  '/api/twitch-stream-map?top=300&min_viewers=0&category=all',
)

console.log(JSON.stringify({
  ok: true,
  publicModes: STREAM_MAP_PUBLIC_GEOGRAPHY_MODES,
  countryDefaultHasNoGeographyParam: true,
  cityIsExplicit: true,
  currentIrlUiActive: STREAM_MAP_CURRENT_IRL_UI_ACTIVE,
}, null, 2))
