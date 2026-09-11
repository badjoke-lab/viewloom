import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { buildKickReviewedCityEvidence } from './kick-stream-map-reviewed-city-evidence-core.mjs'
import {
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA,
  KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION,
} from './kick-stream-map-reviewed-city-runtime-staging-data.mjs'

const resultFiles = readdirSync('docs/audits')
  .filter((name) => /^kick-stream-map-city-review-result-\d{4}-\d{2}-\d{2}-\d{2}\.json$/.test(name))
  .sort()

assert.ok(resultFiles.length >= 2, 'expected the original and at least one subsequent Kick City review batch')

const results = resultFiles.map((name) => JSON.parse(readFileSync(`docs/audits/${name}`, 'utf8')))
for (const result of results) {
  assert.equal(result.schemaVersion, 'viewloom-kick-stream-map-city-review-result-v0.1')
  assert.equal(result.reviewMode, 'manual_bounded_city_review')
  assert.equal(result.completed, true)
  assert.equal(result.providerRequests, 0)
  assert.equal(result.canonicalMutationApplied, false)
  assert.equal(result.productionDeployment, false)
  assert.ok(result.summary.reviewed <= result.constraints.maxIdentities)
  assert.ok(result.identities.every((row) => row.lookupsUsed <= result.constraints.maxExternalLookupsPerIdentity))
  assert.equal(result.constraints.countryOnlyPromotionAllowed, false)
  assert.equal(result.constraints.currentLocationAllowedForBaseCity, false)
  assert.equal(result.constraints.temporaryLocationAllowedForBaseCity, false)
  assert.equal(result.constraints.creatorCoordinatesAllowed, false)
  assert.equal(result.constraints.twitchEvidenceReuseAllowed, false)
  assert.equal(result.constraints.automaticRuntimePromotion, false)
}

const evidence = buildKickReviewedCityEvidence(results)
const reviewed = results.reduce((sum, result) => sum + result.summary.reviewed, 0)
const accepted = results.reduce((sum, result) => sum + result.summary.accepted, 0)
const noQualifyingEvidence = results.reduce((sum, result) => sum + result.summary.noQualifyingEvidence, 0)
const excludedNonperson = results.reduce((sum, result) => sum + result.summary.excludedNonperson, 0)
const conflictUnmapped = results.reduce((sum, result) => sum + result.summary.conflictUnmapped, 0)

assert.equal(evidence.length, reviewed)
assert.equal(evidence.filter((row) => row.outcome === 'accepted').length, accepted)
assert.equal(evidence.filter((row) => row.outcome === 'no_qualifying_evidence').length, noQualifyingEvidence)
assert.equal(evidence.filter((row) => row.outcome === 'excluded_nonperson').length, excludedNonperson)
assert.equal(evidence.filter((row) => row.outcome === 'conflict_unmapped').length, conflictUnmapped)
assert.ok(evidence.every((row) => row.provider === 'kick'))
assert.equal(new Set(evidence.map((row) => row.stableKickUserId)).size, evidence.length)

const acceptedById = new Map(evidence.filter((row) => row.outcome === 'accepted').map((row) => [row.stableKickUserId, row]))
assert.deepEqual(acceptedById.get('11096104')?.placement, { state: 'mapped', countryCode: 'TR', region: null, city: 'İstanbul' })
assert.deepEqual(acceptedById.get('190599')?.placement, { state: 'mapped', countryCode: 'PL', region: null, city: 'Wrocław' })
assert.deepEqual(acceptedById.get('75943919')?.placement, { state: 'mapped', countryCode: 'BR', region: null, city: 'Rio de Janeiro' })
assert.deepEqual(acceptedById.get('106756949')?.placement, { state: 'mapped', countryCode: 'IN', region: 'Punjab', city: 'Fazilka' })
assert.deepEqual(acceptedById.get('106763992')?.placement, { state: 'mapped', countryCode: 'IN', region: null, city: 'Mumbai' })
assert.ok([...acceptedById.values()].every((row) => row.claimKind === 'declared_location'))

const newBatchById = new Map(evidence.map((row) => [row.stableKickUserId, row]))
for (const id of ['5508767', '35467', '31377709', '68422390']) {
  assert.equal(newBatchById.get(id)?.outcome, 'no_qualifying_evidence')
}
assert.equal(newBatchById.get('68312242')?.outcome, 'excluded_nonperson')

const nonAccepted = evidence.filter((row) => row.outcome !== 'accepted')
assert.ok(nonAccepted.every((row) => row.claimKind === null && row.placement === null))

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
  'apps/web/functions/api/kick-stream-map-reviewed-city-runtime-data.mjs',
]) {
  const source = readFileSync(productionPath, 'utf8')
  assert.equal(
    source.includes('kick-stream-map-reviewed-city-runtime-staging-data'),
    false,
    `${productionPath} must not import newly reviewed City staging automatically`,
  )
}

console.log(JSON.stringify({
  ok: true,
  batches: results.map((result) => result.batchId),
  reviewed,
  accepted,
  noQualifyingEvidence,
  excludedNonperson,
  conflictUnmapped,
  acceptedCities: [...new Set(results.flatMap((result) => Object.keys(result.summary.acceptedCities ?? {})))],
  runtimeStagingVersion: KICK_REVIEWED_CITY_RUNTIME_STAGING_DATA_VERSION,
  newReviewStagingProductionConnected: false,
  providerRequests: results.reduce((sum, result) => sum + result.providerRequests, 0),
  productionDeployment: false,
}, null, 2))
