import assert from 'node:assert/strict'
import fs from 'node:fs'

const contractPath = 'docs/audits/kick-stream-map-country-review-result-contract-v0.1.json'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

assert.equal(contract.schemaVersion, 'viewloom-kick-stream-map-country-review-result-contract-v0.1')
assert.equal(contract.provider, 'kick')
assert.equal(contract.geographyLayer, 'country_only')
assert.equal(contract.budgets.maxIdentities, 25)
assert.equal(contract.budgets.maxExternalLookupsPerIdentity, 5)
assert.equal(contract.budgets.maxExternalLookupsPerBatch, 125)
assert.equal(contract.budgets.providerRequestsMax, 0)
assert.equal(contract.mutation.canonicalMutationAllowedDuringReview, false)
assert.equal(contract.mutation.d1WritesAllowed, false)
assert.equal(contract.mutation.productionDeploymentAllowed, false)
assert.equal(contract.mutation.productionCollectorChangeAllowed, false)
assert.equal(contract.mutation.automaticCanonicalPromotionAllowed, false)
assert.equal(contract.providerIsolation.twitchEvidenceReuseAllowed, false)
assert.equal(contract.providerIsolation.slugIsStableIdentity, false)
assert.equal(contract.providerIsolation.stableIdentity, 'broadcaster_user_id')

if (process.argv.includes('--self-test')) {
  console.log(JSON.stringify({ ok: true, mode: 'self-test', provider: 'kick' }))
  process.exit(0)
}

const resultPath = process.argv[2]
assert.ok(resultPath, 'result path required')
const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'))
const batch = JSON.parse(fs.readFileSync(result.sourceBatchFile, 'utf8'))

assert.equal(result.schemaVersion, contract.resultSchemaVersion)
assert.equal(batch.schemaVersion, contract.sourceBatchSchemaVersion)
assert.equal(batch.provider, 'kick')
assert.equal(batch.geographyLayer, 'country_only')
assert.equal(result.sourceRunId, batch.source.workflowRunId)
assert.equal(result.batchId, batch.batchId)
assert.equal(result.reviewMode, 'manual_bounded_review')
assert.equal(result.completed, true)
assert.equal(result.providerRequests, 0)
assert.equal(result.canonicalMutationApplied, false)
assert.equal(result.productionDeployment, false)
assert.equal(result.identities.length, batch.entries.length)
assert.ok(result.identities.length <= contract.budgets.maxIdentities)
assert.equal(result.externalLookupsUsed, result.identities.reduce((sum, row) => sum + row.lookupsUsed, 0))
assert.ok(result.externalLookupsUsed <= contract.budgets.maxExternalLookupsPerBatch)

const allowedOutcomes = new Set(contract.allowedOutcomes)
const allowedSourceClasses = new Set(contract.acceptedEvidence.allowedSourceClasses)
const allowedClaimKinds = new Set(contract.acceptedEvidence.allowedClaimKinds)
const countryCode = /^[A-Z]{2}$/

for (let index = 0; index < batch.entries.length; index++) {
  const source = batch.entries[index]
  const row = result.identities[index]
  assert.equal(row.rank, source.rank, `rank mismatch at ${index}`)
  assert.equal(row.broadcasterUserId, source.broadcasterUserId, `stable identity mismatch at rank ${source.rank}`)
  assert.equal(row.slug, source.slug, `slug mismatch at rank ${source.rank}`)
  assert.ok(Number.isInteger(row.lookupsUsed) && row.lookupsUsed >= 0 && row.lookupsUsed <= contract.budgets.maxExternalLookupsPerIdentity, `lookup budget rank ${source.rank}`)
  assert.ok(allowedOutcomes.has(row.outcome), `invalid outcome rank ${source.rank}`)
  assert.ok(Array.isArray(row.evidence), `evidence array rank ${source.rank}`)
  assert.equal(typeof row.researchNote, 'string', `research note rank ${source.rank}`)
  assert.ok(row.researchNote.length > 0, `empty research note rank ${source.rank}`)

  if (row.outcome === 'accepted') {
    assert.ok(row.evidence.length >= 1, `accepted evidence required rank ${source.rank}`)
    assert.equal(row.placement?.state, 'mapped', `accepted placement rank ${source.rank}`)
    assert.match(row.placement?.countryCode ?? '', countryCode, `accepted country rank ${source.rank}`)
    for (const evidence of row.evidence) {
      assert.ok(allowedSourceClasses.has(evidence.sourceClass), `source class rank ${source.rank}`)
      assert.ok(/^https:\/\//.test(evidence.sourceUrl), `https evidence rank ${source.rank}`)
      assert.ok(allowedClaimKinds.has(evidence.claimKind), `claim kind rank ${source.rank}`)
      assert.equal(evidence.confidence, contract.acceptedEvidence.requiredConfidence, `confidence rank ${source.rank}`)
      assert.match(evidence.countryCode ?? '', countryCode, `evidence country rank ${source.rank}`)
      assert.equal(evidence.countryCode, row.placement.countryCode, `evidence/placement country rank ${source.rank}`)
    }
  } else {
    assert.equal(row.placement, null, `non-accepted placement must be null rank ${source.rank}`)
    assert.equal(row.evidence.length, 0, `non-accepted evidence must be empty rank ${source.rank}`)
  }
}

const summary = {
  reviewed: result.identities.length,
  accepted: result.identities.filter((row) => row.outcome === 'accepted').length,
  excludedNonperson: result.identities.filter((row) => row.outcome === 'excluded_nonperson').length,
  noQualifyingEvidence: result.identities.filter((row) => row.outcome === 'no_qualifying_evidence').length,
  conflictUnmapped: result.identities.filter((row) => row.outcome === 'conflict_unmapped').length,
}
for (const [key, value] of Object.entries(summary)) assert.equal(result.summary[key], value, `summary ${key}`)

const acceptedCountries = {}
for (const row of result.identities.filter((row) => row.outcome === 'accepted')) {
  const code = row.placement.countryCode
  acceptedCountries[code] = (acceptedCountries[code] ?? 0) + 1
}
assert.deepEqual(result.summary.acceptedCountries, Object.fromEntries(Object.entries(acceptedCountries).sort()))

for (const [key, expected] of Object.entries({
  maxIdentities: 25,
  maxExternalLookupsPerIdentity: 5,
  maxExternalLookupsPerBatch: 125,
  countryOnly: true,
  cityFieldsAllowed: false,
  currentLocationAllowed: false,
  preciseLocationAllowed: false,
  automaticCanonicalPromotion: false,
  nationalityAsPlacementAllowed: false,
  birthplaceAsPlacementAllowed: false,
  languageAsPlacementAllowed: false,
  currentTravelAsBaseAllowed: false,
  thirdPartyResidenceAnalyticsAllowed: false,
  twitchEvidenceReuseAllowed: false,
})) assert.equal(result.constraints[key], expected, `result constraint ${key}`)

const serialized = JSON.stringify(result)
for (const forbidden of ['cityCode','cityName','latitude','longitude','coordinates','currentLocation','preciseAddress']) {
  assert.equal(serialized.includes(`\"${forbidden}\"`), false, `forbidden geography field ${forbidden}`)
}

console.log(JSON.stringify({
  ok: true,
  provider: 'kick',
  batchId: result.batchId,
  reviewed: summary.reviewed,
  accepted: summary.accepted,
  noQualifyingEvidence: summary.noQualifyingEvidence,
  excludedNonperson: summary.excludedNonperson,
  conflictUnmapped: summary.conflictUnmapped,
  externalLookupsUsed: result.externalLookupsUsed,
  providerRequests: result.providerRequests,
  canonicalMutationApplied: result.canonicalMutationApplied,
  acceptedCountries: result.summary.acceptedCountries,
}, null, 2))
