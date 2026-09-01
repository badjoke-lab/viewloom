import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'

const dir = 'docs/audits/kick-stream-map-country-review-batches-2026-09-02'
const manifestPath = `${dir}/manifest.json`
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

assert.equal(manifest.schemaVersion, 'viewloom-kick-stream-map-country-review-batches-manifest-v0.1')
assert.equal(manifest.provider, 'kick')
assert.equal(manifest.geographyLayer, 'country_only')
assert.equal(manifest.source.workflowRunId, 33534056449)
assert.equal(manifest.source.headSha, '3b25261a2fb8d124b46c7d1961ddf904fd8aa4d3')
assert.equal(manifest.source.packageMergeSha, '2fa302663244f53f43fdfeb6056b763f52a07c4d')
assert.equal(manifest.source.artifactId, 9810903091)
assert.equal(manifest.source.artifactSha256, 'd94bc1cb86ddd86ea46f662b9f3421fddc57974ba85f6b3ffb9f45b1600a832a')
assert.equal(manifest.source.queueSha256, 'a8a75cd20bd7dff38663a4be5eb09290126c0dbaab0cc29d0f78ada3f5d0052c')
assert.equal(manifest.source.queueSchemaVersion, 'viewloom-kick-stream-map-stable-id-review-queue-v0.2')
assert.equal(manifest.source.populationAuthority, 'production_kick_stream_map_snapshot')
assert.equal(manifest.wholePopulation, 100)
assert.equal(manifest.totalQueuedPopulation, 100)
assert.equal(manifest.batchCount, 4)
assert.equal(manifest.batchSizeMax, 25)
assert.deepEqual(manifest.batchSizes, [25, 25, 25, 25])
assert.equal(manifest.reviewBudget.firstPartyProfileLookupsPerIdentity, 1)
assert.equal(manifest.reviewBudget.externalLookupsPerIdentity, 5)
assert.equal(manifest.reviewBudget.maxFirstPartyProfileLookupsPerBatch, 25)
assert.equal(manifest.reviewBudget.maxExternalLookupsPerBatch, 125)

for (const [key, expected] of Object.entries({
  providerRequestsDuringBatchBuild: 0,
  d1Writes: 0,
  productionDeployment: false,
  productionCollectorChange: false,
  cityFieldsIntroduced: false,
  currentLocationIntroduced: false,
  preciseLocationFieldsIntroduced: false,
  automaticCanonicalPromotion: false,
  slugIsStableIdentity: false,
  twitchEvidenceReuseAllowed: false,
})) assert.equal(manifest.constraints[key], expected, `manifest constraint ${key}`)

const rows = []
for (let i = 0; i < manifest.batchFiles.length; i++) {
  const path = manifest.batchFiles[i]
  const raw = fs.readFileSync(path)
  const digest = crypto.createHash('sha256').update(raw).digest('hex')
  assert.equal(digest, manifest.batchDigests[`batch-${String(i + 1).padStart(2, '0')}.json`], `batch digest ${i + 1}`)
  const batch = JSON.parse(raw)
  assert.equal(batch.schemaVersion, 'viewloom-kick-stream-map-country-review-batch-v0.1')
  assert.equal(batch.provider, 'kick')
  assert.equal(batch.geographyLayer, 'country_only')
  assert.equal(batch.batchIndex, i + 1)
  assert.equal(batch.batchCount, 4)
  assert.equal(batch.queuePopulation, 25)
  assert.equal(batch.entries.length, 25)
  assert.equal(batch.lookupBudget.firstPartyProfileLookupsPerIdentity, 1)
  assert.equal(batch.lookupBudget.externalLookupsPerIdentity, 5)
  assert.equal(batch.lookupBudget.maxFirstPartyProfileLookups, 25)
  assert.equal(batch.lookupBudget.maxExternalLookups, 125)
  assert.deepEqual(batch.constraints, manifest.constraints)
  assert.deepEqual(batch.source, manifest.source)
  rows.push(...batch.entries)
}

assert.equal(rows.length, 100)
assert.deepEqual(rows.map((row) => row.rank), Array.from({ length: 100 }, (_, i) => i + 1))
assert.equal(new Set(rows.map((row) => row.slug)).size, 100)
assert.equal(new Set(rows.map((row) => row.broadcasterUserId)).size, 100)
assert.ok(rows.every((row) => typeof row.broadcasterUserId === 'string' && row.broadcasterUserId.length > 0))
assert.ok(rows.every((row) => row.identityState === 'ready'))
assert.ok(rows.every((row) => row.reason === 'no_reviewed_country_record'))
assert.ok(rows.every((row) => typeof row.viewers === 'number' && row.viewers >= 0))
assert.ok(rows.every((row) => typeof row.observedAt === 'string' && row.observedAt === manifest.source.queueObservedAt))
assert.ok(rows.every((row, i) => i === rows.length - 1 || row.viewers >= rows[i + 1].viewers), 'viewer order must be descending')
assert.equal(rows[0].slug, 'absi')
assert.equal(rows[0].viewers, 24529)
assert.equal(rows[99].slug, 'sealstats')
assert.equal(rows[99].viewers, 1395)

for (const row of rows) {
  const keys = Object.keys(row).sort()
  assert.deepEqual(keys, ['broadcasterUserId','identityState','observedAt','rank','reason','slug','viewers'].sort())
}

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  geographyLayer: 'country_only',
  sourceRun: manifest.source.workflowRunId,
  sourceSnapshotUpdatedAt: manifest.source.sourceSnapshotUpdatedAt,
  queueObservedAt: manifest.source.queueObservedAt,
  totalQueuedPopulation: rows.length,
  batchCount: manifest.batchCount,
  batchSizes: manifest.batchSizes,
  first: { rank: rows[0].rank, slug: rows[0].slug, viewers: rows[0].viewers },
  last: { rank: rows.at(-1).rank, slug: rows.at(-1).slug, viewers: rows.at(-1).viewers },
  stableIdentityReady: rows.filter((row) => row.identityState === 'ready').length,
  providerRequestsDuringBatchBuild: manifest.constraints.providerRequestsDuringBatchBuild,
  d1Writes: manifest.constraints.d1Writes,
  productionDeployment: manifest.constraints.productionDeployment,
  automaticCanonicalPromotion: manifest.constraints.automaticCanonicalPromotion,
}, null, 2))
