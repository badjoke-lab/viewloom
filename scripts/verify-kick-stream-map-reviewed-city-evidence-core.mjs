import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickReviewedCityEvidence } from './kick-stream-map-reviewed-city-evidence-core.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA,
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION,
} from './kick-stream-map-reviewed-city-runtime-staging-data.mjs'

const result = JSON.parse(readFileSync('docs/audits/kick-stream-map-city-review-result-2026-09-07-01.json', 'utf8'))
const evidence = buildKickReviewedCityEvidence([result])

assert.equal(result.schemaVersion, 'viewloom-kick-stream-map-city-review-result-v0.1')
assert.equal(result.completed, true)
assert.equal(result.providerRequests, 0)
assert.equal(result.canonicalMutationApplied, false)
assert.equal(result.productionDeployment, false)
assert.equal(result.summary.reviewed, 7)
assert.equal(result.summary.accepted, 5)
assert.equal(result.summary.noQualifyingEvidence, 2)
assert.equal(result.summary.excludedNonperson, 0)
assert.equal(result.summary.conflictUnmapped, 0)

assert.equal(evidence.length, 7)
assert.equal(evidence.filter((row) => row.outcome === 'accepted').length, 5)
assert.equal(evidence.filter((row) => row.outcome === 'no_qualifying_evidence').length, 2)
assert.ok(evidence.every((row) => row.provider === 'kick'))
assert.equal(new Set(evidence.map((row) => row.stableKickUserId)).size, 7)

const acceptedById = new Map(evidence.filter((row) => row.outcome === 'accepted').map((row) => [row.stableKickUserId, row]))
assert.deepEqual(acceptedById.get('11096104')?.placement, { state: 'mapped', countryCode: 'TR', region: null, city: 'İstanbul' })
assert.deepEqual(acceptedById.get('190599')?.placement, { state: 'mapped', countryCode: 'PL', region: null, city: 'Wrocław' })
assert.deepEqual(acceptedById.get('75943919')?.placement, { state: 'mapped', countryCode: 'BR', region: null, city: 'Rio de Janeiro' })
assert.deepEqual(acceptedById.get('106756949')?.placement, { state: 'mapped', countryCode: 'IN', region: 'Punjab', city: 'Fazilka' })
assert.deepEqual(acceptedById.get('106763992')?.placement, { state: 'mapped', countryCode: 'IN', region: null, city: 'Mumbai' })
assert.ok([...acceptedById.values()].every((row) => row.claimKind === 'declared_location'))

const nonAccepted = evidence.filter((row) => row.outcome !== 'accepted')
assert.ok(nonAccepted.every((row) => row.claimKind === null && row.placement === null))
assert.deepEqual(nonAccepted.map((row) => row.stableKickUserId).sort(), ['27894320', '37423182'])

assert.equal(KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION, 'viewloom-kick-reviewed-city-runtime-staging-data-v0.1')
const runtimeComparable = KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA.map((row) => ({
  provider: 'kick',
  stableKickUserId: row.stableKickUserId,
  outcome: row.outcome,
  claimKind: row.claimKind,
  placement: row.placement,
}))
assert.deepEqual(runtimeComparable, evidence)

const runtimeSerialized = JSON.stringify(KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA)
for (const forbidden of [
  '\"slug\"',
  '\"sourceUrl\"',
  '\"researchNote\"',
  '\"current_location\"',
  '\"temporary_location\"',
  '\"latitude\"',
  '\"longitude\"',
  '\"coordinates\"',
  '\"address\"',
]) {
  assert.equal(runtimeSerialized.includes(forbidden), false, `runtime City staging must not retain ${forbidden}`)
}

for (const productionPath of [
  'apps/web/functions/api/kick-stream-map.ts',
  'apps/web/functions/api/kick-stream-map-country-runtime-core.mjs',
  'apps/web/functions/api/kick-stream-map-public-adapter-core.mjs',
]) {
  const source = readFileSync(productionPath, 'utf8')
  assert.equal(
    source.includes('kick-stream-map-reviewed-city-runtime-staging-data'),
    false,
    `${productionPath} must not connect KC2 City staging before KC3`,
  )
}

assert.equal(result.constraints.countryOnlyPromotionAllowed, false)
assert.equal(result.constraints.currentLocationAllowedForBaseCity, false)
assert.equal(result.constraints.temporaryLocationAllowedForBaseCity, false)
assert.equal(result.constraints.creatorCoordinatesAllowed, false)
assert.equal(result.constraints.twitchEvidenceReuseAllowed, false)
assert.equal(result.constraints.automaticRuntimePromotion, false)

console.log(JSON.stringify({
  ok: true,
  batchId: result.batchId,
  reviewed: result.summary.reviewed,
  accepted: result.summary.accepted,
  noQualifyingEvidence: result.summary.noQualifyingEvidence,
  acceptedCities: Object.keys(result.summary.acceptedCities),
  runtimeDataVersion: KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION,
  productionConnected: false,
  providerRequests: result.providerRequests,
  productionDeployment: result.productionDeployment,
}, null, 2))
