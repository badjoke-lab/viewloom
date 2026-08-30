import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  normalizeStreamMapGeographyMode,
  STREAM_MAP_PUBLIC_GEOGRAPHY_MODES,
  STREAM_MAP_CURRENT_IRL_UI_ACTIVE,
} from '../apps/web/src/features/twitch-stream-map/geography-mode-core.mjs'
import {
  STREAM_MAP_SOURCE_OPTIONS,
  STREAM_MAP_TYPE_OPTIONS,
} from '../apps/web/src/features/twitch-stream-map/location-filter-core.mjs'
import { buildKickCountryResponse } from './kick-stream-map-country-response-core.mjs'

const matrixPath = 'docs/audits/stream-map-provider-geography-boundary-v0.1.json'
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'))

assert.equal(matrix.schemaVersion, 'viewloom-stream-map-provider-geography-boundary-v0.1')

assert.deepEqual(STREAM_MAP_PUBLIC_GEOGRAPHY_MODES, matrix.twitch.publicGeographyModes)
assert.equal(normalizeStreamMapGeographyMode(undefined), matrix.twitch.defaultGeographyMode)
assert.equal(normalizeStreamMapGeographyMode('country'), 'country')
assert.equal(normalizeStreamMapGeographyMode('city'), 'city')
assert.equal(normalizeStreamMapGeographyMode('current'), 'country')
assert.equal(STREAM_MAP_CURRENT_IRL_UI_ACTIVE, matrix.twitch.currentIrlUiActive)
assert.equal(matrix.twitch.currentIrlUiActive, false)
assert.deepEqual(STREAM_MAP_SOURCE_OPTIONS, matrix.twitch.evidenceSourceOptions)
assert.deepEqual(STREAM_MAP_TYPE_OPTIONS, matrix.twitch.locationTypeOptions)
assert.equal(matrix.twitch.currentTypeFilterActivatesCurrentGeography, false)

const kick = buildKickCountryResponse({ snapshotItems: [], reviewedEvidence: [], observedAt: '2026-08-28T00:00:00Z' })
assert.equal(kick.provider, 'kick')
assert.equal(kick.geographyMode, 'country')
assert.equal(kick.publicActivationAuthorized, false)
assert.deepEqual(matrix.kick.preparedGeographyModes, ['country'])
assert.equal(matrix.kick.publicMapControlsActive, false)
assert.equal(matrix.kick.publicActivationAuthorized, kick.publicActivationAuthorized)
assert.equal(matrix.kick.evidenceSourceControlState, 'not_publicly_wired')
assert.equal(matrix.kick.stableIdentity, kick.semantics.stableIdentity)
assert.equal(matrix.kick.slugIsStableIdentity, kick.semantics.slugIsStableIdentity)
assert.equal(matrix.kick.twitchEvidenceReuseAllowed, kick.semantics.twitchEvidenceReuseAllowed)

assert.equal(matrix.sharedBoundaries.providerAggregationAllowed, kick.semantics.providerAggregationAllowed)
assert.equal(matrix.sharedBoundaries.countryToCityInferenceAllowed, kick.semantics.cityInferenceFromCountryAllowed)
assert.equal(matrix.sharedBoundaries.currentToBasePlacementAllowed, kick.semantics.currentLocationUsedForBasePlacement)
assert.equal(matrix.sharedBoundaries.sourceFilterStateMayActivateProvider, false)
assert.equal(matrix.sharedBoundaries.sourceFilterStateMayActivateGeography, false)

console.log(JSON.stringify({
  ok: true,
  twitchPublicGeographies: matrix.twitch.publicGeographyModes,
  twitchCurrentIrlUiActive: matrix.twitch.currentIrlUiActive,
  twitchEvidenceSources: matrix.twitch.evidenceSourceOptions.length,
  kickPreparedGeographies: matrix.kick.preparedGeographyModes,
  kickPublicMapControlsActive: matrix.kick.publicMapControlsActive,
  kickPublicActivationAuthorized: matrix.kick.publicActivationAuthorized,
  kickEvidenceSourceControlState: matrix.kick.evidenceSourceControlState,
  providerAggregationAllowed: false,
  sourceFiltersCanActivateProviderOrGeography: false,
}, null, 2))
