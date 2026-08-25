import assert from 'node:assert/strict'
import fs from 'node:fs'
import { TWITCH_REVIEWED_LOCATION_BATCH_A } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence-batch-a.mjs'
import { buildTwitchStreamMapLiveModel } from '../apps/web/functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCityContract, projectTwitchStreamMapCountryOnly } from '../apps/web/functions/api/twitch-stream-map-public-core.mjs'

const resultPath = 'docs/audits/twitch-stream-map-country-review-result-a-2026-08-25.json'
const applyPath = 'docs/audits/twitch-stream-map-country-review-apply-a-2026-08-25.json'
const endpointPath = 'apps/web/functions/api/twitch-stream-map.ts'
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
const apply = JSON.parse(fs.readFileSync(applyPath, 'utf8'))
const endpoint = fs.readFileSync(endpointPath, 'utf8')

const accepted = result.identities.filter((row) => row.outcome === 'accepted')
const excluded = result.identities.filter((row) => row.outcome === 'excluded_nonperson')
const rejected = result.identities.filter((row) => row.outcome === 'no_qualifying_evidence' || row.outcome === 'conflict_unmapped')
const expectedApplied = [...accepted, ...excluded]

assert.equal(result.batchId, 'A')
assert.equal(result.canonicalMutationApplied, false, 'review-result artifact must remain immutable and pre-apply')
assert.equal(accepted.length, 6)
assert.equal(excluded.length, 2)
assert.equal(rejected.length, 17)
assert.equal(TWITCH_REVIEWED_LOCATION_BATCH_A.length, expectedApplied.length)

const canonicalByLogin = new Map(TWITCH_REVIEWED_LOCATION_BATCH_A.map((record) => [record.streamerLogin, record]))
assert.equal(canonicalByLogin.size, TWITCH_REVIEWED_LOCATION_BATCH_A.length, 'canonical batch must not duplicate logins')

for (const row of accepted) {
  const canonical = canonicalByLogin.get(row.login)
  assert.ok(canonical, `accepted row missing from canonical: ${row.login}`)
  assert.equal(canonical.entityKind, 'person', `accepted row must remain person: ${row.login}`)
  assert.ok(Array.isArray(canonical.evidences) && canonical.evidences.length >= 1, `accepted evidence missing: ${row.login}`)
  const expectedEvidence = row.evidence.filter((item) => ['home_base', 'declared_location'].includes(item.claimKind))
  assert.ok(expectedEvidence.length >= 1, `accepted result has no qualifying evidence: ${row.login}`)
  const expectedCountries = [...new Set(expectedEvidence.map((item) => item.countryCode))]
  assert.deepEqual(expectedCountries, [row.placement.countryCode], `result placement conflict: ${row.login}`)

  for (const evidence of canonical.evidences) {
    assert.equal(evidence.status, 'accepted', `canonical evidence status: ${row.login}`)
    assert.ok(['home_base', 'declared_location'].includes(evidence.claimKind), `canonical base claim kind: ${row.login}`)
    assert.equal(evidence.countryCode, row.placement.countryCode, `canonical country: ${row.login}`)
    assert.equal(evidence.region, null, `Batch A must not introduce region: ${row.login}`)
    assert.equal(evidence.city, null, `Batch A must not introduce city: ${row.login}`)
    assert.equal(evidence.confidence, 'explicit', `canonical confidence: ${row.login}`)
    assert.ok(expectedEvidence.some((item) => item.sourceUrl === evidence.sourceUrl), `canonical source not in validated result: ${row.login}`)
    assert.ok(canonical.classificationReferences.includes(evidence.sourceUrl), `source must remain auditable: ${row.login}`)
  }
}

for (const row of excluded) {
  const canonical = canonicalByLogin.get(row.login)
  assert.ok(canonical, `excluded non-person missing from canonical: ${row.login}`)
  assert.equal(canonical.entityKind, row.entityKind, `non-person kind mismatch: ${row.login}`)
  assert.deepEqual(canonical.evidences, [], `non-person must not receive placement evidence: ${row.login}`)
  assert.ok(Array.isArray(canonical.classificationReferences) && canonical.classificationReferences.length >= 1, `non-person classification refs missing: ${row.login}`)
  assert.ok(row.classificationReferences.some((url) => canonical.classificationReferences.includes(url)), `validated non-person source missing: ${row.login}`)
}

for (const row of rejected) {
  assert.equal(canonicalByLogin.has(row.login), false, `unaccepted result must not be applied: ${row.login}`)
}

assert.equal(apply.sourceResult, resultPath)
assert.equal(apply.batchId, 'A')
assert.equal(apply.acceptedPlacementRecordsApplied, accepted.length)
assert.equal(apply.excludedNonPersonRecordsApplied, excluded.length)
assert.equal(apply.noQualifyingEvidenceRecordsApplied, 0)
assert.equal(apply.conflictRecordsApplied, 0)
assert.equal(apply.countryOnly, true)
assert.equal(apply.cityFieldsIntroduced, false)
assert.equal(apply.currentLocationIntroduced, false)
assert.equal(apply.addressOrCoordinatesIntroduced, false)
assert.equal(apply.d1Mutation, false)
assert.equal(apply.productionDeployRequested, false)

assert.ok(endpoint.includes("import { TWITCH_REVIEWED_LOCATION_BATCH_A } from './twitch-stream-map-reviewed-evidence-batch-a.mjs'"), 'endpoint must import Batch A canonical module')
assert.ok(endpoint.includes('...TWITCH_REVIEWED_LOCATION_RECORDS'))
assert.ok(endpoint.includes('...TWITCH_REVIEWED_LOCATION_BATCH_A'))
assert.ok(endpoint.includes('evidenceRecords: reviewedLocationRecords'))

const syntheticItems = result.identities.map((row, index) => ({
  channelLogin: row.login,
  displayName: row.login,
  viewers: 2500 - index * 50,
}))
const live = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-25T01:30:00.000Z',
    collectedAt: '2026-08-25T01:30:30.000Z',
    streamCount: syntheticItems.length,
    totalViewers: syntheticItems.reduce((sum, item) => sum + item.viewers, 0),
    payloadJson: JSON.stringify({ provider: 'twitch', items: syntheticItems }),
    sourceMode: 'real',
    coveredPages: 3,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_BATCH_A,
  topLimit: 300,
})

assert.equal(live.coverage.observedStreams, 25)
assert.equal(live.coverage.mappedStreams, 6)
assert.equal(live.coverage.excludedNonPersonStreams, 2)
assert.equal(live.coverage.unmappedStreams, 19)
assert.equal(live.coverage.eligibleUnmappedStreams, 17)
assert.equal(live.coverage.currentLocationStreams, 0)
assert.deepEqual(live.mappedStreams.map((row) => row.login).sort(), accepted.map((row) => row.login).sort())
assert.deepEqual(live.excludedNonPersonStreams.map((row) => row.login).sort(), excluded.map((row) => row.login).sort())

const country = projectTwitchStreamMapCountryOnly(live)
assert.equal(country.mappedStreams.length, 6)
assert.equal(country.excludedNonPersonStreams.length, 2)
assert.ok(country.mappedStreams.every((row) => row.location.cities.length === 0 && row.location.regions.length === 0))

const city = projectTwitchStreamMapCityContract(live)
assert.equal(city.mappedStreams.length, 0, 'Country-only Batch A evidence must not fabricate City placement')
assert.equal(city.countryOnlyStreams.length, 6)
assert.equal(city.cityCoverage.excludedNonPersonStreams, 2)
assert.equal(city.currentLocationActivated, false)
assert.equal(city.cityCoverage.reconciliation.passes, true)

const serialized = JSON.stringify(TWITCH_REVIEWED_LOCATION_BATCH_A)
for (const forbidden of ['latitude', 'longitude', 'address', 'current_location']) {
  assert.equal(serialized.includes(forbidden), false, `forbidden precise/current field: ${forbidden}`)
}

console.log(JSON.stringify({
  ok: true,
  batchId: 'A',
  acceptedApplied: accepted.length,
  excludedNonPersonApplied: excluded.length,
  rejectedApplied: 0,
  countryMappedInSyntheticGate: country.mappedStreams.length,
  cityMappedInSyntheticGate: city.mappedStreams.length,
  cityCountryOnlyInSyntheticGate: city.countryOnlyStreams.length,
  currentLocationApplied: 0,
  d1Mutation: false,
  productionDeployRequested: false
}, null, 2))
