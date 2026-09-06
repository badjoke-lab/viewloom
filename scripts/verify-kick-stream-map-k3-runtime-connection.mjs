import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import {
  KICK_REVIEWED_COUNTRY_RUNTIME_DATA,
  KICK_REVIEWED_COUNTRY_RUNTIME_DATA_VERSION,
} from '../apps/web/functions/api/kick-stream-map-reviewed-country-runtime-data.mjs'
import {
  buildKickStreamMapCountryRuntime,
  KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION,
} from '../apps/web/functions/api/kick-stream-map-country-runtime-core.mjs'

function collectKeys(value, target = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, target)
    return target
  }
  if (!value || typeof value !== 'object') return target
  for (const [key, child] of Object.entries(value)) {
    target.add(key)
    collectKeys(child, target)
  }
  return target
}

const auditDir = 'docs/audits'
const resultFiles = fs.readdirSync(auditDir)
  .filter((name) => /^kick-stream-map-country-review-result-2026-09-02-\d{2}\.json$/.test(name))
  .sort()

assert.equal(resultFiles.length, 4)

const expected = resultFiles
  .flatMap((name) => JSON.parse(fs.readFileSync(path.join(auditDir, name), 'utf8')).identities)
  .map((row) => ({
    stableKickUserId: String(row.broadcasterUserId),
    outcome: row.outcome,
    countryCode: row.outcome === 'accepted' ? row.placement?.countryCode ?? null : null,
  }))

assert.deepEqual(KICK_REVIEWED_COUNTRY_RUNTIME_DATA, expected)
assert.equal(KICK_REVIEWED_COUNTRY_RUNTIME_DATA_VERSION, 'viewloom-kick-reviewed-country-runtime-data-v0.1')
assert.equal(KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION, 'viewloom-kick-stream-map-country-runtime-v0.1')
assert.equal(new Set(KICK_REVIEWED_COUNTRY_RUNTIME_DATA.map((row) => row.stableKickUserId)).size, 100)
assert.equal(KICK_REVIEWED_COUNTRY_RUNTIME_DATA.filter((row) => row.outcome === 'accepted').length, 7)
assert.equal(KICK_REVIEWED_COUNTRY_RUNTIME_DATA.filter((row) => row.outcome === 'excluded_nonperson').length, 3)
assert.equal(KICK_REVIEWED_COUNTRY_RUNTIME_DATA.filter((row) => row.outcome === 'no_qualifying_evidence').length, 90)
assert.equal(KICK_REVIEWED_COUNTRY_RUNTIME_DATA.filter((row) => row.outcome === 'conflict_unmapped').length, 0)

for (const row of KICK_REVIEWED_COUNTRY_RUNTIME_DATA) {
  assert.deepEqual(Object.keys(row).sort(), ['countryCode', 'outcome', 'stableKickUserId'])
  assert.ok(row.stableKickUserId.length > 0)
  assert.equal(typeof row.outcome, 'string')
  if (row.outcome === 'accepted') assert.match(row.countryCode, /^[A-Z]{2}$/)
  else assert.equal(row.countryCode, null)
}

const snapshotItems = [
  { slug: 'accepted', displayName: 'Accepted', viewer_count: 100, broadcaster_user_id: '27894320', url: 'https://kick.com/accepted' },
  { slug: 'no-evidence', displayName: 'No Evidence', viewer_count: 80, broadcaster_user_id: '30701976', url: 'https://kick.com/no-evidence' },
  { slug: 'excluded', displayName: 'Excluded', viewer_count: 60, broadcaster_user_id: '4959', url: 'https://kick.com/excluded' },
  { slug: 'unreviewed', displayName: 'Unreviewed', viewer_count: 40, broadcaster_user_id: '999999999', url: 'https://kick.com/unreviewed' },
]

const response = buildKickStreamMapCountryRuntime({
  snapshotItems,
  updatedAt: '2026-09-06T00:00:00.000Z',
  sourceMode: 'official',
})

assert.equal(response.version, KICK_STREAM_MAP_COUNTRY_RUNTIME_VERSION)
assert.equal(response.provider, 'kick')
assert.equal(response.platform, 'kick')
assert.equal(response.publicActivationAuthorized, false, 'K3 runtime must remain fail-closed by default')
assert.equal(response.state, 'blocked_public_activation')
assert.equal(response.implementationState, 'reviewed_country_runtime_connected')
assert.equal(response.activation.publicCountryActivationReady, true)
assert.deepEqual(response.activation.blockers, ['public_country_activation_not_authorized'])
assert.equal(response.coverage.observedStreams, 4)
assert.equal(response.coverage.stableIdentityStreams, 4)
assert.equal(response.coverage.reviewedEvidenceCatalogSize, 100)
assert.equal(response.coverage.reviewedIdentityStreams, 3)
assert.equal(response.coverage.unreviewedStableIdentityStreams, 1)
assert.equal(response.coverage.mappedStreams, 1)
assert.equal(response.coverage.unmappedStreams, 2)
assert.equal(response.coverage.excludedStreams, 1)
assert.equal(response.coverage.conflictStreams, 0)
assert.equal(response.coverage.mappedCountryCount, 1)
assert.equal(response.coverage.reconciliation.passes, true)
assert.deepEqual(response.mappedStreams[0].geography, {
  mode: 'country',
  state: 'mapped',
  reason: 'reviewed_country_accepted',
  countryCode: 'JO',
})
assert.equal(response.unmappedStreams.some((row) => row.geography.reason === 'no_qualifying_reviewed_country'), true)
assert.equal(response.unmappedStreams.some((row) => row.geography.reason === 'no_reviewed_kick_evidence'), true)
assert.equal(response.excludedStreams[0].geography.reason, 'reviewed_nonperson_exclusion')

const authorized = buildKickStreamMapCountryRuntime({
  snapshotItems,
  updatedAt: '2026-09-06T00:00:00.000Z',
  sourceMode: 'official',
  publicActivationAuthorized: true,
})
assert.equal(authorized.publicActivationAuthorized, true)
assert.equal(authorized.state, 'ready')
assert.equal(authorized.activation.publicCountryActivationReady, true)
assert.deepEqual(authorized.activation.blockers, [])
assert.deepEqual(authorized.coverage, response.coverage, 'K4 authorization must not alter reviewed accounting')
assert.deepEqual(authorized.mappedStreams, response.mappedStreams, 'K4 authorization must not alter reviewed geography rows')

for (const candidate of [response, authorized]) {
  const publicKeys = collectKeys(candidate)
  for (const forbiddenKey of ['stableKickUserId', 'broadcaster_user_id']) {
    assert.equal(publicKeys.has(forbiddenKey), false, `public response must omit key ${forbiddenKey}`)
  }
  for (const forbiddenKey of ['city', 'latitude', 'longitude', 'coordinates', 'currentLocation', 'evidence', 'sourceUrl']) {
    assert.equal(publicKeys.has(forbiddenKey), false, `public response must omit key ${forbiddenKey}`)
  }

  assert.equal(candidate.semantics.stableIdentity, 'broadcaster_user_id')
  assert.equal(candidate.semantics.slugIsStableIdentity, false)
  assert.equal(candidate.semantics.twitchEvidenceReuseAllowed, false)
  assert.equal(candidate.semantics.providerAggregationAllowed, false)
  assert.equal(candidate.semantics.automaticGeographyPromotionAllowed, false)
  assert.equal(candidate.semantics.reviewedEvidenceRuntimeConnected, true)
  assert.equal(candidate.semantics.stableIdentityPublished, false)
  assert.equal(candidate.semantics.cityInferenceAllowed, false)
  assert.equal(candidate.semantics.currentLocationPromotionAllowed, false)
  assert.equal(candidate.semantics.preciseAddressAllowed, false)
  assert.equal(candidate.semantics.preciseCoordinatesAllowed, false)
}

const missingStable = buildKickStreamMapCountryRuntime({
  snapshotItems: [{ slug: 'missing', displayName: 'Missing', viewer_count: 1, broadcaster_user_id: null }],
  publicActivationAuthorized: true,
})
assert.equal(missingStable.state, 'blocked_stable_identity', 'K4 must not override incomplete stable identity')
assert.equal(missingStable.activation.publicCountryActivationReady, false)
assert.deepEqual(missingStable.activation.blockers, [
  'production_livestream_snapshot_missing_broadcaster_user_id',
])
assert.equal(missingStable.coverage.reconciliation.passes, true)

const routeSource = fs.readFileSync('apps/web/functions/api/kick-stream-map.ts', 'utf8')
assert.ok(routeSource.includes("from './kick-stream-map-country-runtime-core.mjs'"))
assert.ok(routeSource.includes('buildKickStreamMapCountryRuntime({'))
assert.ok(routeSource.includes('const K4_PUBLIC_ACTIVATION_AUTHORIZED = true'))
assert.equal(fs.existsSync('apps/web/kick/map/index.html'), true)

console.log(JSON.stringify({
  ok: true,
  resultFiles: resultFiles.length,
  reviewedEvidenceCatalogSize: KICK_REVIEWED_COUNTRY_RUNTIME_DATA.length,
  accepted: 7,
  excludedNonperson: 3,
  noQualifyingEvidence: 90,
  conflictUnmapped: 0,
  routeConnected: true,
  stableIdentityPublished: false,
  defaultPublicActivationAuthorized: response.publicActivationAuthorized,
  authorizedPublicActivationAuthorized: authorized.publicActivationAuthorized,
  authorizedState: authorized.state,
  publicPagePresent: true,
}, null, 2))
