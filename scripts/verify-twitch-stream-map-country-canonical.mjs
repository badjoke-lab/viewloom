import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildTwitchStreamMapLiveModel } from '../apps/web/functions/api/twitch-stream-map-core.mjs'
import { projectTwitchStreamMapCityContract, projectTwitchStreamMapCountryOnly } from '../apps/web/functions/api/twitch-stream-map-public-core.mjs'

const apiDir = 'apps/web/functions/api'
const auditDir = 'docs/audits'
const endpointPath = `${apiDir}/twitch-stream-map.ts`
const endpoint = fs.readFileSync(endpointPath, 'utf8')

const moduleFiles = fs.readdirSync(apiDir)
  .filter((name) => /^twitch-stream-map-reviewed-evidence-batch-[a-l]\.mjs$/.test(name))
  .sort()

assert.ok(moduleFiles.length > 0, 'no canonical batch modules')

const summaries = []
for (const moduleFile of moduleFiles) {
  const match = moduleFile.match(/batch-([a-l])\.mjs$/)
  assert.ok(match)
  const lower = match[1]
  const batchId = lower.toUpperCase()
  const resultPath = uniqueAudit(`twitch-stream-map-country-review-result-${lower}-`)
  const applyPath = uniqueAudit(`twitch-stream-map-country-review-apply-${lower}-`)
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  const apply = JSON.parse(fs.readFileSync(applyPath, 'utf8'))
  const exportName = `TWITCH_REVIEWED_LOCATION_BATCH_${batchId}`
  const moduleUrl = pathToFileURL(path.resolve(apiDir, moduleFile)).href
  const imported = await import(moduleUrl)
  const canonical = imported[exportName]

  assert.ok(Array.isArray(canonical), `${batchId}: canonical export`)
  assert.equal(result.batchId, batchId, `${batchId}: result batch`)
  assert.equal(result.canonicalMutationApplied, false, `${batchId}: result mutation boundary`)

  const accepted = result.identities.filter((row) => row.outcome === 'accepted')
  const excluded = result.identities.filter((row) => row.outcome === 'excluded_nonperson')
  const rejected = result.identities.filter((row) => row.outcome === 'no_qualifying_evidence' || row.outcome === 'conflict_unmapped')
  const expectedApplied = [...accepted, ...excluded]

  assert.equal(canonical.length, expectedApplied.length, `${batchId}: canonical record count`)
  const canonicalByLogin = new Map(canonical.map((row) => [row.streamerLogin, row]))
  assert.equal(canonicalByLogin.size, canonical.length, `${batchId}: duplicate canonical login`)

  for (const row of accepted) {
    const record = canonicalByLogin.get(row.login)
    assert.ok(record, `${batchId}: accepted row missing ${row.login}`)
    assert.equal(record.entityKind, 'person', `${batchId}: accepted entity kind ${row.login}`)
    assert.ok(Array.isArray(record.evidences) && record.evidences.length > 0, `${batchId}: accepted evidences ${row.login}`)
    assert.ok(Array.isArray(record.classificationReferences) && record.classificationReferences.length > 0, `${batchId}: accepted refs ${row.login}`)
    for (const evidence of row.evidence ?? []) {
      assert.ok(record.classificationReferences.includes(evidence.sourceUrl), `${batchId}: accepted ref alignment ${row.login}`)
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
      assert.ok(matched, `${batchId}: accepted evidence alignment ${row.login}`)
    }
  }

  for (const row of excluded) {
    const record = canonicalByLogin.get(row.login)
    assert.ok(record, `${batchId}: excluded row missing ${row.login}`)
    assert.equal(record.entityKind, row.entityKind, `${batchId}: excluded entity kind ${row.login}`)
    assert.deepEqual(record.evidences, [], `${batchId}: excluded evidences ${row.login}`)
    assert.ok(Array.isArray(record.classificationReferences) && record.classificationReferences.length > 0, `${batchId}: excluded refs ${row.login}`)
    assert.ok((row.classificationReferences ?? []).some((url) => record.classificationReferences.includes(url)), `${batchId}: excluded ref alignment ${row.login}`)
  }

  for (const row of rejected) {
    assert.equal(canonicalByLogin.has(row.login), false, `${batchId}: rejected row applied ${row.login}`)
  }

  assert.equal(apply.schemaVersion, 'viewloom-twitch-stream-map-country-review-apply-v0.1', `${batchId}: apply schema`)
  assert.equal(apply.sourceResult, resultPath, `${batchId}: apply source result`)
  assert.equal(apply.batchId, batchId, `${batchId}: apply batch`)
  assert.equal(apply.canonicalModule, `${apiDir}/${moduleFile}`, `${batchId}: apply canonical module`)
  assert.equal(apply.acceptedPlacementRecordsApplied, accepted.length, `${batchId}: accepted apply count`)
  assert.equal(apply.excludedNonPersonRecordsApplied, excluded.length, `${batchId}: excluded apply count`)
  assert.equal(apply.noQualifyingEvidenceRecordsApplied, 0, `${batchId}: no-evidence apply count`)
  assert.equal(apply.conflictRecordsApplied, 0, `${batchId}: conflict apply count`)
  assert.equal(apply.countryOnly, true, `${batchId}: country-only boundary`)
  assert.equal(apply.cityFieldsIntroduced, false, `${batchId}: city boundary`)
  assert.equal(apply.currentLocationIntroduced, false, `${batchId}: current-location boundary`)
  assert.equal(apply.addressOrCoordinatesIntroduced, false, `${batchId}: precise-location boundary`)
  assert.equal(apply.providerRequests, 0, `${batchId}: provider request boundary`)
  assert.equal(apply.d1Mutation, false, `${batchId}: D1 boundary`)
  assert.equal(apply.productionDeployRequested, false, `${batchId}: production boundary`)

  assert.ok(endpoint.includes(`import { ${exportName} } from './${moduleFile}'`), `${batchId}: endpoint import`)
  assert.ok(endpoint.includes(`...${exportName}`), `${batchId}: endpoint spread`)
  assert.ok(endpoint.includes('evidenceRecords: reviewedLocationRecords'), `${batchId}: endpoint evidence wiring`)

  const syntheticItems = result.identities.map((row, index) => ({
    channelLogin: row.login,
    displayName: row.login,
    viewers: 5000 - index * 100,
  }))
  const live = buildTwitchStreamMapLiveModel({
    snapshot: {
      bucketMinute: '2026-08-26T00:00:00.000Z',
      collectedAt: '2026-08-26T00:00:30.000Z',
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

  assert.equal(live.coverage.observedStreams, result.identities.length, `${batchId}: observed synthetic`)
  assert.equal(live.coverage.mappedStreams, accepted.length, `${batchId}: mapped synthetic`)
  assert.equal(live.coverage.excludedNonPersonStreams, excluded.length, `${batchId}: excluded synthetic`)
  assert.equal(live.coverage.unmappedStreams, excluded.length + rejected.length, `${batchId}: unmapped synthetic`)
  assert.equal(live.coverage.eligibleUnmappedStreams, rejected.length, `${batchId}: eligible-unmapped synthetic`)
  assert.equal(live.coverage.currentLocationStreams, 0, `${batchId}: current-location synthetic`)

  const country = projectTwitchStreamMapCountryOnly(live)
  assert.equal(country.mappedStreams.length, accepted.length, `${batchId}: country mapped`)
  assert.equal(country.excludedNonPersonStreams.length, excluded.length, `${batchId}: country excluded`)

  const city = projectTwitchStreamMapCityContract(live)
  assert.equal(city.mappedStreams.length, 0, `${batchId}: city mapped`)
  assert.equal(city.countryOnlyStreams.length, accepted.length, `${batchId}: country-only city projection`)
  assert.equal(city.cityCoverage.excludedNonPersonStreams, excluded.length, `${batchId}: city excluded`)
  assert.equal(city.currentLocationActivated, false, `${batchId}: current-location activation`)
  assert.equal(city.cityCoverage.reconciliation.passes, true, `${batchId}: city reconciliation`)

  summaries.push({
    batchId,
    acceptedApplied: accepted.length,
    excludedNonPersonApplied: excluded.length,
    rejectedApplied: 0,
    cityMapped: 0,
    currentLocationApplied: 0,
  })
}

console.log(JSON.stringify({
  ok: true,
  validatedBatches: summaries.length,
  batches: summaries,
  d1Mutation: false,
  productionDeployRequested: false,
}, null, 2))

function uniqueAudit(prefix) {
  const matches = fs.readdirSync(auditDir).filter((name) => name.startsWith(prefix) && name.endsWith('.json')).sort()
  assert.equal(matches.length, 1, `${prefix}: expected exactly one audit file`)
  return `${auditDir}/${matches[0]}`
}
