import assert from 'node:assert/strict'
import fs from 'node:fs'
import { classifyCityEvidence, classifyCityEvidenceSet } from '../tools/twitch-stream-map-city-confidence/classifier.mjs'
import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence.mjs'

const fixturePath = 'docs/audits/twitch-stream-map-city-confidence-fixture-v0.1.json'
const retainedAuditPath = 'docs/audits/twitch-stream-map-city-evidence-audit-2026-08-24.json'
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
const retainedAudit = JSON.parse(fs.readFileSync(retainedAuditPath, 'utf8'))

assert.equal(fixture.schemaVersion, 'viewloom-stream-map-city-confidence-fixture-v0.1')
assert.equal(fixture.cases.length, 8)

for (const testCase of fixture.cases) {
  const output = classifyCityEvidence(testCase.record)
  for (const [key, expected] of Object.entries(testCase.expected)) {
    if (key === 'city') assert.equal(output.placement?.city, expected, testCase.name)
    else if (key === 'countryCode') assert.equal(output.placement?.countryCode, expected, testCase.name)
    else assert.deepEqual(output[key], expected, testCase.name)
  }
}

const fixtureSet = classifyCityEvidenceSet(fixture.cases.map((row) => row.record))
assert.equal(fixtureSet.provider, 'twitch')
assert.equal(fixtureSet.geographyMode, 'city')
assert.equal(fixtureSet.confidenceMeaning, 'evidence_consistency_not_probability')
assert.equal(fixtureSet.currentLocationUsedForBaseCityPlacement, false)
assert.equal(fixtureSet.countryUsedToInferCity, false)
assert.equal(fixtureSet.preciseLocationPublicationAllowed, false)
assert.equal(fixtureSet.twitchKickAggregationAllowed, false)
assert.deepEqual(fixtureSet.counts, {
  mapped: 2,
  conflict: 1,
  country_only: 1,
  current_only: 1,
  context_only: 1,
  privacy_invalid: 1,
  excluded_non_person: 1,
})

const retained = classifyCityEvidenceSet(TWITCH_REVIEWED_LOCATION_RECORDS)
assert.equal(retained.rows.length, retainedAudit.counts.reviewedEntities)
assert.equal(retained.counts.mapped ?? 0, retainedAudit.counts.baseEligibleCityPersons)
assert.equal(retained.counts.conflict ?? 0, retainedAudit.counts.basePlacementConflicts)
assert.equal(retained.counts.privacy_invalid ?? 0, 0)
assert.equal(retained.currentLocationUsedForBaseCityPlacement, false)
assert.equal(retained.countryUsedToInferCity, false)
assert.equal(retained.twitchKickAggregationAllowed, false)

for (const row of retained.rows) {
  if (row.cityState === 'mapped') {
    assert.equal(row.publicPlacementEligible, true)
    assert.ok(row.placement?.city)
    assert.ok(['single_explicit_base_city', 'consistent_multiple_explicit_base_city_rows'].includes(row.confidenceClass))
  } else {
    assert.equal(row.publicPlacementEligible, false)
  }
  if (row.cityState === 'current_only') assert.equal(row.placement, null)
  if (row.cityState === 'conflict') assert.equal(row.placement, null)
  if (row.cityState === 'privacy_invalid') assert.equal(row.placement, null)
}

const retainedMapped = retained.rows.filter((row) => row.cityState === 'mapped')
const singleExplicit = retainedMapped.filter((row) => row.confidenceClass === 'single_explicit_base_city').length
const multipleConsistent = retainedMapped.filter((row) => row.confidenceClass === 'consistent_multiple_explicit_base_city_rows').length
assert.equal(singleExplicit + multipleConsistent, retainedAudit.counts.baseEligibleCityPersons)

console.log(JSON.stringify({
  ok: true,
  fixtureCases: fixture.cases.length,
  retainedEntities: retained.rows.length,
  retainedMappedCities: retainedMapped.length,
  singleExplicitBaseCity: singleExplicit,
  consistentMultipleBaseCityRows: multipleConsistent,
  conflicts: retained.counts.conflict ?? 0,
  countryOnly: retained.counts.country_only ?? 0,
  currentOnly: retained.counts.current_only ?? 0,
  privacyInvalid: retained.counts.privacy_invalid ?? 0,
  confidenceMeaning: retained.confidenceMeaning,
  currentToBaseAllowed: false,
  countryToCityInferenceAllowed: false,
}, null, 2))
