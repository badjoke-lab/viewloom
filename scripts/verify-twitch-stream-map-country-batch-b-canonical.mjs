import assert from 'node:assert/strict'
import fs from 'node:fs'
import { TWITCH_REVIEWED_LOCATION_BATCH_B } from '../apps/web/functions/api/twitch-stream-map-reviewed-evidence-batch-b.mjs'
import { buildTwitchStreamMapLiveModel } from '../apps/web/functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCityContract, projectTwitchStreamMapCountryOnly } from '../apps/web/functions/api/twitch-stream-map-public-core.mjs'

const resultPath = 'docs/audits/twitch-stream-map-country-review-result-b-2026-08-25.json'
const applyPath = 'docs/audits/twitch-stream-map-country-review-apply-b-2026-08-25.json'
const endpointPath = 'apps/web/functions/api/twitch-stream-map.ts'
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
const apply = JSON.parse(fs.readFileSync(applyPath, 'utf8'))
const endpoint = fs.readFileSync(endpointPath, 'utf8')

const accepted = result.identities.filter((row) => row.outcome === 'accepted')
const excluded = result.identities.filter((row) => row.outcome === 'excluded_nonperson')
const rejected = result.identities.filter((row) => row.outcome === 'no_qualifying_evidence' || row.outcome === 'conflict_unmapped')

assert.equal(result.batchId, 'B')
assert.equal(result.canonicalMutationApplied, false)
assert.equal(accepted.length, 0)
assert.equal(excluded.length, 1)
assert.equal(rejected.length, 24)
assert.equal(TWITCH_REVIEWED_LOCATION_BATCH_B.length, 1)

const canonical = TWITCH_REVIEWED_LOCATION_BATCH_B[0]
assert.equal(canonical.streamerLogin, excluded[0].login)
assert.equal(canonical.entityKind, excluded[0].entityKind)
assert.deepEqual(canonical.evidences, [])
assert.ok(canonical.classificationReferences.includes('https://www.twitch.tv/jynxzi247'))
assert.ok(excluded[0].classificationReferences.some((url) => canonical.classificationReferences.includes(url)))

const canonicalLogins = new Set(TWITCH_REVIEWED_LOCATION_BATCH_B.map((row) => row.streamerLogin))
for (const row of rejected) assert.equal(canonicalLogins.has(row.login), false, `rejected row applied: ${row.login}`)

assert.equal(apply.sourceResult, resultPath)
assert.equal(apply.batchId, 'B')
assert.equal(apply.acceptedPlacementRecordsApplied, 0)
assert.equal(apply.excludedNonPersonRecordsApplied, 1)
assert.equal(apply.noQualifyingEvidenceRecordsApplied, 0)
assert.equal(apply.conflictRecordsApplied, 0)
assert.equal(apply.cityFieldsIntroduced, false)
assert.equal(apply.currentLocationIntroduced, false)
assert.equal(apply.addressOrCoordinatesIntroduced, false)
assert.equal(apply.d1Mutation, false)
assert.equal(apply.productionDeployRequested, false)

assert.ok(endpoint.includes("import { TWITCH_REVIEWED_LOCATION_BATCH_B } from './twitch-stream-map-reviewed-evidence-batch-b.mjs'"))
assert.ok(endpoint.includes('...TWITCH_REVIEWED_LOCATION_BATCH_B'))
assert.ok(endpoint.includes('evidenceRecords: reviewedLocationRecords'))

const syntheticItems = result.identities.map((row, index) => ({
  channelLogin: row.login,
  displayName: row.login,
  viewers: 2500 - index * 50,
}))
const live = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-25T01:40:00.000Z',
    collectedAt: '2026-08-25T01:40:30.000Z',
    streamCount: syntheticItems.length,
    totalViewers: syntheticItems.reduce((sum, item) => sum + item.viewers, 0),
    payloadJson: JSON.stringify({ provider: 'twitch', items: syntheticItems }),
    sourceMode: 'real',
    coveredPages: 3,
    hasMore: true,
  },
  evidenceRecords: TWITCH_REVIEWED_LOCATION_BATCH_B,
  topLimit: 300,
})

assert.equal(live.coverage.observedStreams, 25)
assert.equal(live.coverage.mappedStreams, 0)
assert.equal(live.coverage.excludedNonPersonStreams, 1)
assert.equal(live.coverage.unmappedStreams, 25)
assert.equal(live.coverage.eligibleUnmappedStreams, 24)
assert.equal(live.coverage.currentLocationStreams, 0)
assert.deepEqual(live.excludedNonPersonStreams.map((row) => row.login), ['jynxzi247'])

const country = projectTwitchStreamMapCountryOnly(live)
assert.equal(country.mappedStreams.length, 0)
assert.equal(country.excludedNonPersonStreams.length, 1)

const city = projectTwitchStreamMapCityContract(live)
assert.equal(city.mappedStreams.length, 0)
assert.equal(city.countryOnlyStreams.length, 0)
assert.equal(city.cityCoverage.excludedNonPersonStreams, 1)
assert.equal(city.currentLocationActivated, false)
assert.equal(city.cityCoverage.reconciliation.passes, true)

console.log(JSON.stringify({
  ok: true,
  batchId: 'B',
  acceptedApplied: 0,
  excludedNonPersonApplied: 1,
  rejectedApplied: 0,
  countryMappedInSyntheticGate: 0,
  cityMappedInSyntheticGate: 0,
  currentLocationApplied: 0,
  d1Mutation: false,
  productionDeployRequested: false
}, null, 2))
