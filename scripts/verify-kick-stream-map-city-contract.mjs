import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildKickCityContractResponse } from './kick-stream-map-city-contract-core.mjs'

const fixture = JSON.parse(readFileSync('docs/audits/kick-stream-map-city-contract-fixture-v0.1.json', 'utf8'))
assert.equal(fixture.schemaVersion, 'viewloom-kick-stream-map-city-contract-fixture-v0.1')

const response = buildKickCityContractResponse(fixture)
const expected = fixture.expected

assert.equal(response.version, 'viewloom-kick-stream-map-city-contract-v0.1')
assert.equal(response.provider, 'kick')
assert.equal(response.geographyMode, 'city')
assert.equal(response.observedAt, fixture.observedAt)
assert.equal(response.publicActivationAuthorized, false)

for (const key of [
  'observedStreams',
  'observedViewers',
  'mappedStreams',
  'mappedViewers',
  'unmappedStreams',
  'unmappedViewers',
  'excludedStreams',
  'excludedViewers',
  'conflictStreams',
  'conflictViewers',
  'mappedCityAggregateCount',
  'referenceGeometryAggregates',
  'listOnlyAggregates',
  'streamCoverage',
  'viewerCoverage',
]) {
  assert.equal(response.coverage[key], expected[key], `coverage mismatch: ${key}`)
}

assert.equal(response.coverage.reconciliation.selectedPopulation, 8)
assert.equal(response.coverage.reconciliation.reconciledPopulation, 8)
assert.equal(response.coverage.reconciliation.passes, true)

const losAngeles = response.cityAggregates.find((row) => row.city === 'Los Angeles')
assert.ok(losAngeles)
assert.equal(losAngeles.cityAggregateKey, 'US|ca|los angeles')
assert.equal(losAngeles.streams, 2)
assert.equal(losAngeles.viewers, 130)
assert.equal(losAngeles.referenceGeometry.state, 'reference_point')
assert.equal(losAngeles.referenceGeometry.referenceKey, 'US|CA|Los Angeles')
assert.equal(losAngeles.referenceGeometry.semantics, 'city_aggregate_reference')

const santCugat = response.cityAggregates.find((row) => row.city === 'Sant Cugat del Valles')
assert.ok(santCugat)
assert.equal(santCugat.streams, 1)
assert.equal(santCugat.viewers, 90)
assert.equal(santCugat.referenceGeometry.state, 'no_geometry')
assert.equal(santCugat.referenceGeometry.referenceKey, null)
assert.equal(santCugat.referenceGeometry.semantics, 'list_only')

const countryOnly = response.unmappedStreams.find((row) => row.slug === 'country-only')
assert.equal(countryOnly?.geography.reason, 'country_only_evidence')
assert.equal(countryOnly?.geography.countryCode, 'JP')
assert.equal(countryOnly?.geography.city, null)

const currentOnly = response.unmappedStreams.find((row) => row.slug === 'current-only')
assert.equal(currentOnly?.geography.reason, 'current_or_temporary_not_base_city')
assert.equal(currentOnly?.geography.city, null)

const missingId = response.unmappedStreams.find((row) => row.slug === 'missing-id')
assert.equal(missingId?.geography.reason, 'stable_identity_unavailable')

const conflict = response.conflictStreams.find((row) => row.slug === 'city-conflict')
assert.equal(conflict?.geography.reason, 'reviewed_city_conflict')

const excluded = response.excludedStreams.find((row) => row.slug === 'excluded-channel')
assert.equal(excluded?.geography.reason, 'reviewed_nonperson_exclusion')

assert.deepEqual(response.semantics.acceptedBaseCityClaimKinds, ['home_base', 'declared_location'])
for (const key of [
  'stableIdentityPublished',
  'slugIsStableIdentity',
  'twitchEvidenceReuseAllowed',
  'providerAggregationAllowed',
  'automaticGeographyPromotionAllowed',
  'countryInferenceToCityAllowed',
  'currentLocationUsedForBaseCity',
  'temporaryLocationUsedForBaseCity',
  'preciseAddressPublished',
  'creatorCoordinatesPublished',
]) {
  assert.equal(response.semantics[key], false, `${key} must remain false`)
}
assert.equal(response.semantics.reviewedAggregateReferenceOnly, true)
assert.equal(response.semantics.noGeometryListOnly, true)
assert.equal(response.semantics.stableIdentity, 'broadcaster_user_id')

const serialized = JSON.stringify(response)
for (const forbiddenKey of [
  'stableKickUserId',
  'broadcaster_user_id\":',
  '\"latitude\"',
  '\"longitude\"',
  '\"coordinates\"',
  '\"address\"',
  '\"currentLocation\"',
]) {
  assert.equal(serialized.includes(forbiddenKey), false, `public City contract must not expose ${forbiddenKey}`)
}

const duplicateFixture = structuredClone(fixture)
duplicateFixture.reviewedCityEvidence.push({
  stableKickUserId: '101',
  outcome: 'accepted',
  claimKind: 'home_base',
  placement: { countryCode: 'US', region: 'NY', city: 'New York' },
})
const duplicateResponse = buildKickCityContractResponse(duplicateFixture)
const duplicate = duplicateResponse.conflictStreams.find((row) => row.slug === 'los-angeles-a')
assert.equal(duplicate?.geography.reason, 'duplicate_reviewed_city_identity')
assert.equal(duplicateResponse.coverage.reconciliation.passes, true)

console.log(JSON.stringify({
  ok: true,
  version: response.version,
  provider: response.provider,
  geographyMode: response.geographyMode,
  observedStreams: response.coverage.observedStreams,
  mappedStreams: response.coverage.mappedStreams,
  mappedCityAggregateCount: response.coverage.mappedCityAggregateCount,
  referenceGeometryAggregates: response.coverage.referenceGeometryAggregates,
  listOnlyAggregates: response.coverage.listOnlyAggregates,
  reconciliationPasses: response.coverage.reconciliation.passes,
  stableIdentityPublished: response.semantics.stableIdentityPublished,
  countryInferenceToCityAllowed: response.semantics.countryInferenceToCityAllowed,
  currentLocationUsedForBaseCity: response.semantics.currentLocationUsedForBaseCity,
}, null, 2))
