import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'

const manifestPath = 'docs/audits/twitch-stream-map-country-coverage-review-manifest-2026-08-31.json'
const manifest = readJson(manifestPath)
const EXPECTED_HEAD = '9be1e5228abfdcc62592a7f5cdc485ff2dc82d69'
const EXPECTED_RUN = 33348159697
const EXPECTED_ARTIFACT_SHA256 = '85f2928ed654a9f2ff7fba8a141ac2ab20203e9c5a08f85e3251bb7f625f0e23'
const EXPECTED_BATCH_SIZES = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 22]
const FORBIDDEN_ENTRY_KEYS = new Set(['city','region','address','street','postalcode','zipcode','coordinates','coordinate','latitude','longitude','lat','lng','lon','currentlocation','rawtitle','rawtags','rawtext','quote','quotation'])

assert.equal(manifest.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-manifest-v0.1')
assert.equal(manifest.provider, 'twitch')
assert.equal(manifest.geographyLayer, 'country_only')
assertSource(manifest.source)
assert.equal(manifest.wholeTop300Population, 300)
assert.equal(manifest.totalQueuedPopulation, 297)
assert.equal(manifest.excludedFreshEvidence, 2)
assert.equal(manifest.excludedNonPerson, 1)
assert.equal(manifest.batchCount, 12)
assert.equal(manifest.maxBatchSize, 25)
assert.deepEqual(manifest.batchSizes, EXPECTED_BATCH_SIZES)
assert.equal(manifest.reviewBudget?.profileLookupsPerIdentity, 1)
assert.equal(manifest.reviewBudget?.externalLookupsPerIdentity, 5)
assert.equal(manifest.reviewBudget?.maxProfileLookupsAllBatches, 297)
assert.equal(manifest.reviewBudget?.maxExternalLookupsAllBatches, 1485)
assertBoundaries(manifest.boundaries)
assert.equal(manifest.boundaries?.weeklyMaintenanceControlsExecution, false)

const batchRows = []
const seenIds = new Set()
const seenLogins = new Set()
assert.equal(manifest.batches?.length, 12)
for (let index = 0; index < manifest.batches.length; index += 1) {
  const meta = manifest.batches[index]
  const expectedIndex = index + 1
  const expectedSize = EXPECTED_BATCH_SIZES[index]
  const expectedId = `2026-08-31-${String(expectedIndex).padStart(2, '0')}`
  const expectedPath = `docs/audits/twitch-stream-map-country-coverage-review-batch-2026-08-31-${String(expectedIndex).padStart(2, '0')}.json`
  assert.equal(meta.batchId, expectedId)
  assert.equal(meta.path, expectedPath)
  assert.equal(meta.queuePopulation, expectedSize)
  const batch = readJson(meta.path)
  assert.equal(batch.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-batch-v0.1')
  assert.equal(batch.provider, 'twitch')
  assert.equal(batch.geographyLayer, 'country_only')
  assertSource(batch.source)
  assert.equal(batch.batchId, expectedId)
  assert.equal(batch.batchIndex, expectedIndex)
  assert.equal(batch.batchCount, 12)
  assert.equal(batch.wholeTop300Population, 300)
  assert.equal(batch.totalQueuedPopulation, 297)
  assert.equal(batch.queuePopulation, expectedSize)
  assert.equal(batch.entries?.length, expectedSize)
  assert.equal(batch.lookupBudget?.profileLookupsPerIdentity, 1)
  assert.equal(batch.lookupBudget?.externalLookupsPerIdentity, 5)
  assert.equal(batch.lookupBudget?.maxProfileLookups, expectedSize)
  assert.equal(batch.lookupBudget?.maxExternalLookups, expectedSize * 5)
  assertBoundaries(batch.constraints)
  assert.equal(meta.firstRank, batch.entries[0].rank)
  assert.equal(meta.lastRank, batch.entries.at(-1).rank)
  for (const row of batch.entries) {
    assert.deepEqual(Object.keys(row).sort(), ['displayName','login','rank','reason','twitchUserId','viewers'].sort())
    assert.equal(row.reason, 'no_reviewed_record')
    assert.match(String(row.twitchUserId), /^\d+$/)
    assert.match(String(row.login), /^[a-z0-9_]+$/)
    assert.equal(typeof row.displayName, 'string')
    assert.ok(row.displayName.length > 0)
    assert.ok(Number.isInteger(row.rank) && row.rank >= 1 && row.rank <= 300)
    assert.ok(Number.isInteger(row.viewers) && row.viewers >= 0)
    assert.equal(seenIds.has(row.twitchUserId), false, `duplicate_twitch_user_id:${row.twitchUserId}`)
    assert.equal(seenLogins.has(row.login), false, `duplicate_login:${row.login}`)
    seenIds.add(row.twitchUserId)
    seenLogins.add(row.login)
    assertNoForbiddenKeys(row)
    batchRows.push(row)
  }
}
assert.equal(batchRows.length, 297)
assert.equal(seenIds.size, 297)
assert.equal(seenLogins.size, 297)
for (let index = 1; index < batchRows.length; index += 1) assert.ok(batchRows[index].rank > batchRows[index - 1].rank, `rank_order_changed:${batchRows[index - 1].rank}:${batchRows[index].rank}`)
assert.equal(sha256(JSON.stringify(batchRows)), manifest.queueSha256)
console.log(JSON.stringify({ok:true,sourceRunId:EXPECTED_RUN,sourceHead:EXPECTED_HEAD,queued:batchRows.length,batches:manifest.batches.length,batchSizes:EXPECTED_BATCH_SIZES,uniqueStableIds:seenIds.size,uniqueLogins:seenLogins.size,queueSha256:manifest.queueSha256,providerRequestsDuringBatchBuild:0,d1Writes:0,productionDeployment:false}, null, 2))

function assertSource(source) {
  assert.equal(source?.workflowRunId, EXPECTED_RUN)
  assert.equal(source?.headSha, EXPECTED_HEAD)
  assert.equal(source?.observedAt, '2026-08-31T01:38:27.145Z')
  assert.equal(source?.artifactSha256, EXPECTED_ARTIFACT_SHA256)
  assert.equal(source?.countryQueueSchemaVersion, 'viewloom-twitch-stream-map-coverage-queue-v0.1')
}
function assertBoundaries(value) {
  assert.equal(value?.providerRequestsDuringBatchBuild, 0)
  assert.equal(value?.d1Writes, 0)
  assert.equal(value?.productionDeployment, false)
  assert.equal(value?.cityFieldsIntroduced, false)
  assert.equal(value?.currentLocationIntroduced, false)
  assert.equal(value?.preciseLocationFieldsIntroduced, false)
  assert.equal(value?.automaticCanonicalPromotion, false)
}
function assertNoForbiddenKeys(value) {
  if (Array.isArray(value)) { for (const item of value) assertNoForbiddenKeys(item); return }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
    assert.equal(FORBIDDEN_ENTRY_KEYS.has(normalized), false, `forbidden_entry_key:${key}`)
    assertNoForbiddenKeys(child)
  }
}
function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex') }
function readJson(path) { return JSON.parse(fs.readFileSync(path, 'utf8')) }
