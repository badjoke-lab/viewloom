import assert from 'node:assert/strict'
import fs from 'node:fs'

const contractPath = 'docs/audits/twitch-stream-map-country-coverage-review-result-contract-v0.1.json'
const contract = readJson(contractPath)
const manifest = readJson(contract.batchManifest)
const allowedOutcomes = new Set(contract.requiredTerminalOutcomes)
const allowedClaims = new Set(contract.acceptedPlacementClaimKinds)
const forbiddenKeys = new Set(['city','region','address','street','postalcode','zipcode','coordinates','coordinate','latitude','longitude','lat','lng','lon','currentlocation','rawtitle','rawtags','rawtext','quote','quotation'])

assert.equal(contract.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-result-contract-v0.1')
assert.equal(manifest.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-manifest-v0.1')
assert.equal(manifest.source?.workflowRunId, contract.sourceRunId)
assert.equal(manifest.source?.headSha, contract.sourceHeadSha)
assert.equal(manifest.provider, 'twitch')
assert.equal(manifest.geographyLayer, 'country_only')

const batchById = new Map()
for (const meta of manifest.batches) {
  const batch = readJson(meta.path)
  assert.equal(batch.batchId, meta.batchId)
  batchById.set(batch.batchId, batch)
}

function validateResult(result) {
  assert.equal(result.schemaVersion, 'viewloom-twitch-stream-map-country-coverage-review-result-v0.1', 'result schema')
  assert.equal(result.sourceRunId, contract.sourceRunId, 'source run')
  const batch = batchById.get(result.batchId)
  assert.ok(batch, `unknown batch:${result.batchId}`)
  assert.equal(result.reviewMode, 'manual_review', 'review mode')
  assert.equal(result.canonicalMutationApplied, false, 'canonical mutation must remain false')
  assert.equal(result.providerRequests, 0, 'provider requests budget')
  assert.equal(result.completed, true, 'batch not completed')
  assert.ok(Number.isFinite(result.wallClockMinutes) && result.wallClockMinutes >= 0 && result.wallClockMinutes <= contract.budgets.wallClockMinutesMax, 'wall clock budget')
  assert.ok(isIsoTime(result.startedAt) && isIsoTime(result.completedAt), 'batch timestamps')
  assert.ok(Date.parse(result.completedAt) >= Date.parse(result.startedAt), 'timestamp order')
  assert.ok(Array.isArray(result.identities), 'identity array')
  assert.equal(result.identities.length, batch.entries.length, 'identity count')
  assert.ok(result.identities.length <= contract.budgets.identitiesMax, 'identity max')

  let lookupTotal = 0
  const seen = new Set()
  for (let index = 0; index < batch.entries.length; index += 1) {
    const expected = batch.entries[index]
    const row = result.identities[index]
    assert.ok(row, `missing identity:${index}`)
    assert.equal(row.rank, expected.rank, `rank mismatch:${index}`)
    assert.equal(row.twitchUserId, expected.twitchUserId, `twitch id mismatch:${index}`)
    assert.equal(row.login, expected.login, `login mismatch:${index}`)
    assert.equal(seen.has(row.twitchUserId), false, `duplicate twitch id:${row.twitchUserId}`)
    seen.add(row.twitchUserId)
    assert.ok(allowedOutcomes.has(row.outcome), `invalid outcome:${row.login}`)
    assert.ok(Number.isInteger(row.lookupsUsed) && row.lookupsUsed >= 0 && row.lookupsUsed <= contract.budgets.externalLookupsPerIdentityMax, `identity lookup budget:${row.login}`)
    lookupTotal += row.lookupsUsed
    const evidence = Array.isArray(row.evidence) ? row.evidence : []
    assertNoForbiddenKeys(row)

    if (row.outcome === 'accepted') {
      assert.ok(evidence.length > 0, `accepted without evidence:${row.login}`)
      const qualifying = evidence.filter(isQualifyingBaseEvidence)
      assert.ok(qualifying.length > 0, `accepted without qualifying base evidence:${row.login}`)
      const countries = unique(qualifying.map((item) => item.countryCode))
      assert.equal(countries.length, 1, `accepted country conflict:${row.login}`)
      assert.equal(row.placement?.state, 'mapped', `accepted placement state:${row.login}`)
      assert.equal(row.placement?.countryCode, countries[0], `accepted placement mismatch:${row.login}`)
    } else if (row.outcome === 'conflict_unmapped') {
      const qualifying = evidence.filter(isQualifyingBaseEvidence)
      const countries = unique(qualifying.map((item) => item.countryCode))
      assert.ok(countries.length >= 2, `conflict lacks contradictory base evidence:${row.login}`)
      assert.equal(row.placement, null, `conflict must be unmapped:${row.login}`)
    } else if (row.outcome === 'excluded_nonperson') {
      assert.ok(['organization','event_broadcast'].includes(String(row.entityKind ?? '')), `nonperson kind:${row.login}`)
      assert.ok(Array.isArray(row.classificationReferences) && row.classificationReferences.length > 0 && row.classificationReferences.every(isHttpUrl), `nonperson references:${row.login}`)
      assert.equal(row.placement, null, `nonperson placement:${row.login}`)
    } else {
      assert.equal(row.outcome, 'no_qualifying_evidence')
      assert.equal(evidence.some(isQualifyingBaseEvidence), false, `no-evidence outcome has qualifying evidence:${row.login}`)
      assert.equal(row.placement, null, `no-evidence placement:${row.login}`)
    }
  }

  assert.equal(result.externalLookupsUsed, lookupTotal, 'batch lookup reconciliation')
  assert.ok(lookupTotal <= batch.lookupBudget.maxExternalLookups, 'batch lookup budget')
  assert.ok(lookupTotal <= contract.budgets.externalLookupsPerBatchMax, 'contract batch lookup max')
  return {
    ok: true,
    batchId: result.batchId,
    identities: result.identities.length,
    externalLookupsUsed: lookupTotal,
    providerRequests: result.providerRequests,
    canonicalMutationApplied: result.canonicalMutationApplied,
    outcomes: countOutcomes(result.identities),
  }
}

function isQualifyingBaseEvidence(item) {
  if (!item || typeof item !== 'object') return false
  if (!allowedClaims.has(String(item.claimKind ?? ''))) return false
  if (String(item.confidence ?? '') === 'candidate_only') return false
  const code = String(item.countryCode ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return false
  if (!String(item.countryName ?? '').trim()) return false
  if (!String(item.sourceClass ?? '').trim()) return false
  if (!isHttpUrl(item.sourceUrl)) return false
  if (!isIsoTime(item.observedAt)) return false
  return true
}

function assertNoForbiddenKeys(value) {
  if (Array.isArray(value)) {
    for (const item of value) assertNoForbiddenKeys(item)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
    assert.equal(forbiddenKeys.has(normalized), false, `forbidden location key:${key}`)
    assertNoForbiddenKeys(child)
  }
}

function selfTest() {
  const batch = batchById.get('2026-08-31-01')
  assert.ok(batch, 'self-test batch missing')
  const identities = batch.entries.map((row) => ({
    rank: row.rank,
    twitchUserId: row.twitchUserId,
    login: row.login,
    lookupsUsed: 0,
    outcome: 'no_qualifying_evidence',
    evidence: [],
    placement: null,
  }))
  const result = {
    schemaVersion: 'viewloom-twitch-stream-map-country-coverage-review-result-v0.1',
    sourceRunId: contract.sourceRunId,
    batchId: batch.batchId,
    reviewMode: 'manual_review',
    startedAt: '2026-08-31T00:00:00Z',
    completedAt: '2026-08-31T00:01:00Z',
    wallClockMinutes: 1,
    externalLookupsUsed: 0,
    providerRequests: 0,
    canonicalMutationApplied: false,
    completed: true,
    identities,
  }
  const ok = validateResult(result)
  const broken = structuredClone(result)
  broken.identities[0].twitchUserId = '0'
  assert.throws(() => validateResult(broken), /twitch id mismatch/)
  return ok
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ''))
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
function isIsoTime(value) { return Boolean(String(value ?? '')) && Number.isFinite(Date.parse(String(value))) }
function unique(values) { return [...new Set(values.map((value) => String(value ?? '').trim().toUpperCase()).filter(Boolean))] }
function countOutcomes(rows) {
  const counts = {}
  for (const row of rows) counts[row.outcome] = (counts[row.outcome] ?? 0) + 1
  return Object.fromEntries(Object.entries(counts).sort(([a],[b]) => a.localeCompare(b)))
}
function readJson(path) { return JSON.parse(fs.readFileSync(path, 'utf8')) }

const args = process.argv.slice(2)
if (args.includes('--self-test')) console.log(JSON.stringify(selfTest(), null, 2))
else {
  const path = args[0]
  assert.ok(path, 'result path required')
  console.log(JSON.stringify(validateResult(readJson(path)), null, 2))
}
