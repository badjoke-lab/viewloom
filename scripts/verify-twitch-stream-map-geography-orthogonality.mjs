import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  STREAM_MAP_CURRENT_IRL_UI_ACTIVE,
  STREAM_MAP_PUBLIC_GEOGRAPHY_MODES,
  applyStreamMapGeographyMode,
  normalizeStreamMapGeographyMode,
} from '../apps/web/src/features/twitch-stream-map/geography-mode-core.mjs'

const base = '/api/twitch-stream-map?top=300&min_viewers=50&category=all&sources=official_external%2Cmanual_review&types=home_base%2Cdeclared_location&population=top300'
const countryUrl = new URL(applyStreamMapGeographyMode(base, 'country'), 'https://viewloom.invalid')
const cityUrl = new URL(applyStreamMapGeographyMode(base, 'city'), 'https://viewloom.invalid')

assert.equal(countryUrl.pathname, '/api/twitch-stream-map')
assert.equal(cityUrl.pathname, '/api/twitch-stream-map')
assert.equal(countryUrl.searchParams.has('geography'), false, 'Country must remain the default API contract')
assert.equal(cityUrl.searchParams.get('geography'), 'city', 'City must be explicit')

for (const key of ['top', 'min_viewers', 'category', 'sources', 'types', 'population']) {
  assert.equal(cityUrl.searchParams.get(key), countryUrl.searchParams.get(key), `${key} must stay orthogonal to geography`)
}

const resetFromCity = new URL(
  applyStreamMapGeographyMode('/api/twitch-stream-map?geography=city&sources=stream_title&types=home_base', 'country'),
  'https://viewloom.invalid',
)
assert.equal(resetFromCity.searchParams.has('geography'), false)
assert.equal(resetFromCity.searchParams.get('sources'), 'stream_title')
assert.equal(resetFromCity.searchParams.get('types'), 'home_base')

assert.equal(normalizeStreamMapGeographyMode('CITY'), 'city')
assert.equal(normalizeStreamMapGeographyMode('current'), 'country', 'Current / IRL is not a public geography mode yet')
assert.deepEqual([...STREAM_MAP_PUBLIC_GEOGRAPHY_MODES], ['country', 'city'])
assert.equal(STREAM_MAP_CURRENT_IRL_UI_ACTIVE, false)

const bootstrap = readFileSync('apps/web/src/features/twitch-stream-map/geography-ui-bootstrap.ts', 'utf8')
for (const marker of [
  'country_only_at_city_resolution',
  'base_city_conflict',
  'City uses accepted home/base or declared-location evidence only.',
  'Current / IRL remains unavailable.',
  'currentLocationStreams: 0',
  'currentLocationPercent: 0',
]) {
  assert.ok(bootstrap.includes(marker), `geography UI boundary missing: ${marker}`)
}

assert.equal(bootstrap.includes("request.searchParams.set('geography', 'city')"), true)
assert.equal(bootstrap.includes("request.searchParams.delete('geography')"), true)

console.log(JSON.stringify({
  ok: true,
  countryDefault: true,
  cityExplicit: true,
  populationPreserved: true,
  evidenceSourcePreserved: true,
  evidenceTypePreserved: true,
  countryOnlyAtCityResolutionPreserved: true,
  baseCityConflictPreserved: true,
  currentIrlPublicUiActive: false,
}, null, 2))
