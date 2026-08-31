import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildTwitchStreamMapLiveModel } from '../apps/web/functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCityContract, projectTwitchStreamMapCountryOnly } from '../apps/web/functions/api/twitch-stream-map-public-core.mjs'

const sourceRunId = 33348159697
const auditDir = 'docs/audits'
const canonicalPath = 'apps/web/functions/api/twitch-stream-map-reviewed-evidence-fresh-2026-08-31.mjs'
const applyPath = `${auditDir}/twitch-stream-map-country-coverage-review-apply-2026-08-31.json`
const endpointPath = 'apps/web/functions/api/twitch-stream-map.ts'
const exportName = 'TWITCH_REVIEWED_LOCATION_FRESH_2026_08_31'

const resultPaths = fs.readdirSync(auditDir)
  .filter((name) => /^twitch-stream-map-country-coverage-review-result-2026-08-31-\d{2}\.json$/.test(name))
  .sort()
  .map((name) => `${auditDir}/${name}`)

assert.equal(resultPaths.length, 12, 'fresh result batch count')
const results = resultPaths.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')))
for (let index = 0; index < results.length; index += 1) {
  const result = results[index]
  assert.equal(result.sourceRunId, sourceRunId, `source run:${index + 1}`)
  assert.equal(result.batchId, `2026-08-31-${String(index + 1).padStart(2, '0')}`, `batch id:${index + 1}`)
  assert.equal(result.completed, true, `completed:${index + 1}`)
  assert.equal(result.providerRequests, 0, `provider requests:${index + 1}`)
  assert.equal(result.canonicalMutationApplied, false, `source canonical boundary:${index + 1}`)
}

const identities = results.flatMap((result) => result.identities)
assert.equal(identities.length, 297, 'reviewed population')
const stableIds = new Set(identities.map((row) => row.twitchUserId))
assert.equal(stableIds.size, identities.length, 'duplicate stable Twitch ID in fresh results')

const accepted = identities.filter((row) => row.outcome === 'accepted')
const excluded = identities.filter((row) => row.outcome === 'excluded_nonperson')
const rejected = identities.filter((row) => row.outcome === 'no_qualifying_evidence' || row.outcome === 'conflict_unmapped')
assert.equal(accepted.length, 15, 'accepted count')
assert.equal(excluded.length, 15, 'excluded count')
assert.equal(rejected.length, 267, 'rejected count')

const imported = await import(pathToFileURL(path.resolve(canonicalPath)).href)
const canonical = imported[exportName]
assert.ok(Array.isArray(canonical), 'fresh canonical export')
assert.equal(canonical.length, accepted.length + excluded.length, 'fresh canonical record count')
const canonicalByLogin = new Map(canonical.map((row) => [row.streamerLogin, row]))
assert.equal(canonicalByLogin.size, canonical.length, 'duplicate fresh canonical login')

for (const row of accepted) {
  const record = canonicalByLogin.get(row.login)
  assert.ok(record, `accepted row missing:${row.login}`)
  assert.equal(record.entityKind, 'person', `accepted entity kind:${row.login}`)
  assert.ok(Array.isArray(record.classificationReferences) && record.classificationReferences.length > 0, `accepted refs:${row.login}`)
  assert.ok(Array.isArray(record.evidences) && record.evidences.length > 0, `accepted evidences:${row.login}`)
  for (const evidence of row.evidence ?? []) {
    assert.ok(record.classificationReferences.includes(evidence.sourceUrl), `accepted ref alignment:${row.login}`)
    const matched = record.evidences.some((item) =>
      item.sourceUrl === evidence.sourceUrl &&
      item.countryCode === evidence.countryCode &&
      item.countryName === evidence.countryName &&
      item.claimKind === evidence.claimKind &&
      item.confidence === evidence.confidence &&
      item.status === 'accepted' &&
      item.region === null &&
      item.city === null
    )
    assert.ok(matched, `accepted evidence alignment:${row.login}`)
  }
}

for (const row of excluded) {
  const record = canonicalByLogin.get(row.login)
  assert.ok(record, `excluded row missing:${row.login}`)
  assert.equal(record.entityKind, row.entityKind, `excluded kind:${row.login}`)
  assert.deepEqual(record.evidences, [], `excluded evidences:${row.login}`)
  assert.ok(Array.isArray(record.classificationReferences) && record.classificationReferences.length > 0, `excluded refs:${row.login}`)
  assert.ok((row.classificationReferences ?? []).some((url) => record.classificationReferences.includes(url)), `excluded ref alignment:${row.login}`)
}

for (const row of rejected) {
  assert.equal(canonicalByLogin.has(row.login), false, `rejected row applied:${row.login}`)
}

for (const record of canonical) {
  for (const evidence of record.evidences ?? []) {
    assert.equal(evidence.region, null, `region introduced:${record.streamerLogin}`)
    assert.equal(evidence.city, null, `city introduced:${record.streamerLogin}`)
    assert.notEqual(evidence.claimKind, 'current_location', `current location introduced:${record.streamerLogin}`)
  }
}

const apply = JSON.parse(fs.readFileSync(applyPath, 'utf8'))
assert.equal(apply.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-apply-v0.1', 'apply schema')
assert.equal(apply.sourceRunId, sourceRunId, 'apply source run')
assert.deepEqual(apply.sourceResults, resultPaths, 'apply source results')
assert.equal(apply.reviewedPopulation, identities.length, 'apply reviewed population')
assert.equal(apply.canonicalModule, canonicalPath, 'apply canonical module')
assert.equal(apply.acceptedPlacementRecordsApplied, accepted.length, 'apply accepted count')
assert.equal(apply.excludedNonPersonRecordsApplied, excluded.length, 'apply excluded count')
assert.equal(apply.noQualifyingEvidenceRecordsApplied, 0, 'apply rejected boundary')
assert.equal(apply.conflictRecordsApplied, 0, 'apply conflict boundary')
assert.equal(apply.countryOnly, true, 'apply country-only boundary')
assert.equal(apply.cityFieldsIntroduced, false, 'apply city boundary')
assert.equal(apply.currentLocationIntroduced, false, 'apply current boundary')
assert.equal(apply.addressOrCoordinatesIntroduced, false, 'apply precise-location boundary')
assert.equal(apply.providerRequests, 0, 'apply provider requests')
assert.equal(apply.d1Mutation, false, 'apply D1 boundary')
assert.equal(apply.schemaChanged, false, 'apply schema boundary')
assert.equal(apply.collectorCadenceChanged, false, 'apply cadence boundary')
assert.equal(apply.productionDeployRequested, false, 'apply production boundary')

const endpoint = fs.readFileSync(endpointPath, 'utf8')
const importText = `import { ${exportName} } from './twitch-stream-map-reviewed-evidence-fresh-2026-08-31.mjs'`
assert.ok(endpoint.includes(importText), 'endpoint fresh import')
assert.ok(endpoint.includes(`...${exportName}`), 'endpoint fresh spread')
assert.ok(endpoint.indexOf(`...${exportName}`) > endpoint.indexOf('...TWITCH_REVIEWED_LOCATION_BATCH_L'), 'fresh evidence must override older reviewed records')

const syntheticItems = identities.map((row, index) => ({
  channelLogin: row.login,
  displayName: row.login,
  viewers: 10000 - index,
}))
const live = buildTwitchStreamMapLiveModel({
  snapshot: {
    bucketMinute: '2026-08-31T15:00:00Z',
    collectedAt: '2026-08-31T15:00:30Z',
    streamCount: syntheticItems.length,
    totalViewers: syntheticItems.reduce((sum, item) => sum + item.viewers, 0),
    payloadJson: JSON.stringify({ provider: 'twitch', items: syntheticItems }),
    sourceMode: 'real',
    coveredPages: 3,
    hasMore: true,
  },
  evidenceRecords: canonical,
  topLimit: 300,
})
assert.equal(live.coverage.observedStreams, 297, 'synthetic observed')
assert.equal(live.coverage.mappedStreams, accepted.length, 'synthetic mapped')
assert.equal(live.coverage.excludedNonPersonStreams, excluded.length, 'synthetic excluded')
assert.equal(live.coverage.eligibleUnmappedStreams, rejected.length, 'synthetic eligible unmapped')
assert.equal(live.coverage.currentLocationStreams, 0, 'synthetic current location')

const country = projectTwitchStreamMapCountryOnly(live)
assert.equal(country.mappedStreams.length, accepted.length, 'country mapped')
assert.equal(country.excludedNonPersonStreams.length, excluded.length, 'country excluded')
const city = projectTwitchStreamMapCityContract(live)
assert.equal(city.mappedStreams.length, 0, 'city mapped')
assert.equal(city.countryOnlyStreams.length, accepted.length, 'city country-only')
assert.equal(city.cityCoverage.excludedNonPersonStreams, excluded.length, 'city excluded')
assert.equal(city.currentLocationActivated, false, 'city current location')
assert.equal(city.cityCoverage.reconciliation.passes, true, 'city reconciliation')

console.log(JSON.stringify({
  ok: true,
  sourceRunId,
  batches: results.length,
  reviewedPopulation: identities.length,
  acceptedApplied: accepted.length,
  excludedNonPersonApplied: excluded.length,
  rejectedApplied: 0,
  cityMapped: 0,
  currentLocationApplied: 0,
  providerRequests: 0,
  d1Mutation: false,
  productionDeployRequested: false
}, null, 2))
