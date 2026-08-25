import fs from 'node:fs'

const contractPath = 'docs/audits/twitch-stream-map-country-review-result-contract-v0.1.json'
const batchContractPath = 'docs/audits/twitch-stream-map-country-review-batch-contract-v0.1.json'
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'))
const batchContract = JSON.parse(fs.readFileSync(batchContractPath, 'utf8'))
const fail = (message) => { throw new Error(message) }

const parts = batchContract.parts.map((path) => JSON.parse(fs.readFileSync(path, 'utf8')))
const batches = parts.flatMap((part) => part.batches)
const batchById = new Map(batches.map((batch) => [batch.batchId, batch]))
const allowedOutcomes = new Set(contract.requiredTerminalOutcomes)
const allowedClaims = new Set(contract.acceptedPlacementClaimKinds)

function validateResult(result) {
  if (result.schemaVersion !== 'viewloom-twitch-stream-map-country-review-result-v0.1') fail('result schema')
  if (result.sourceRunId !== contract.sourceRunId) fail('source run')
  const batch = batchById.get(result.batchId)
  if (!batch) fail('unknown batch')
  if (result.reviewMode !== 'manual_review') fail('review mode')
  if (result.canonicalMutationApplied !== false) fail('canonical mutation must remain false')
  if (!Number.isFinite(result.wallClockMinutes) || result.wallClockMinutes < 0 || result.wallClockMinutes > contract.budgets.wallClockMinutesMax) fail('wall clock budget')
  if (result.providerRequests !== 0) fail('provider requests budget')
  if (!Array.isArray(result.identities) || result.identities.length !== batch.identities.length) fail('identity count')

  let lookupTotal = 0
  const seenIds = new Set()
  for (let index = 0; index < batch.identities.length; index += 1) {
    const expected = batch.identities[index]
    const row = result.identities[index]
    if (!row || row.rank !== expected.rank || row.twitchUserId !== expected.twitchUserId || row.login !== expected.login) fail(`identity mismatch ${index}`)
    if (seenIds.has(row.twitchUserId)) fail(`duplicate twitch id ${row.twitchUserId}`)
    seenIds.add(row.twitchUserId)
    if (!allowedOutcomes.has(row.outcome)) fail(`invalid outcome ${row.login}`)
    if (!Number.isInteger(row.lookupsUsed) || row.lookupsUsed < 0 || row.lookupsUsed > contract.budgets.externalLookupsPerIdentityMax) fail(`identity lookup budget ${row.login}`)
    lookupTotal += row.lookupsUsed
    const evidence = Array.isArray(row.evidence) ? row.evidence : []

    if (row.outcome === 'accepted') {
      if (!evidence.length) fail(`accepted without evidence ${row.login}`)
      const qualifying = evidence.filter(isQualifyingBaseEvidence)
      if (!qualifying.length) fail(`accepted without qualifying base evidence ${row.login}`)
      const countries = unique(qualifying.map((item) => item.countryCode))
      if (countries.length !== 1) fail(`accepted country conflict ${row.login}`)
      if (row.placement?.countryCode !== countries[0]) fail(`accepted placement mismatch ${row.login}`)
      if (row.placement?.state !== 'mapped') fail(`accepted placement state ${row.login}`)
    } else if (row.outcome === 'conflict_unmapped') {
      const qualifying = evidence.filter(isQualifyingBaseEvidence)
      const countries = unique(qualifying.map((item) => item.countryCode))
      if (countries.length < 2) fail(`conflict lacks contradictory base evidence ${row.login}`)
      if (row.placement !== null) fail(`conflict must be unmapped ${row.login}`)
    } else if (row.outcome === 'excluded_nonperson') {
      if (!['organization', 'event_broadcast'].includes(String(row.entityKind ?? ''))) fail(`nonperson kind ${row.login}`)
      if (!Array.isArray(row.classificationReferences) || row.classificationReferences.length < 1 || !row.classificationReferences.every(isHttpUrl)) fail(`nonperson references ${row.login}`)
      if (row.placement !== null) fail(`nonperson placement ${row.login}`)
    } else if (row.outcome === 'no_qualifying_evidence') {
      if (evidence.some(isQualifyingBaseEvidence)) fail(`no-evidence outcome has qualifying evidence ${row.login}`)
      if (row.placement !== null) fail(`no-evidence placement ${row.login}`)
    }
  }

  if (lookupTotal > contract.budgets.externalLookupsPerBatchMax) fail('batch lookup budget')
  if (result.externalLookupsUsed !== lookupTotal) fail('batch lookup reconciliation')
  if (result.externalLookupsUsed > contract.budgets.externalLookupsPerBatchMax) fail('batch lookup max')
  if (result.completed !== true) fail('batch not completed')
  if (!isIsoTime(result.startedAt) || !isIsoTime(result.completedAt)) fail('batch timestamps')
  if (Date.parse(result.completedAt) < Date.parse(result.startedAt)) fail('timestamp order')

  return {
    ok: true,
    batchId: batch.batchId,
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
  const countryCode = String(item.countryCode ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(countryCode)) return false
  if (!String(item.countryName ?? '').trim()) return false
  if (!isHttpUrl(item.sourceUrl)) return false
  if (!String(item.sourceClass ?? '').trim()) return false
  if (!isIsoTime(item.observedAt)) return false
  return true
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value ?? ''))
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

function isIsoTime(value) {
  const text = String(value ?? '')
  return Boolean(text) && Number.isFinite(Date.parse(text))
}

function unique(values) {
  return [...new Set(values.map((value) => String(value ?? '').trim().toUpperCase()).filter(Boolean))]
}

function countOutcomes(rows) {
  const counts = {}
  for (const row of rows) counts[row.outcome] = (counts[row.outcome] ?? 0) + 1
  return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)))
}

function selfTest() {
  const batch = batchById.get('A')
  const identities = batch.identities.map((identity, index) => ({
    ...identity,
    outcome: 'no_qualifying_evidence',
    lookupsUsed: 0,
    evidence: [],
    placement: null,
  }))
  identities[0] = {
    ...identities[0],
    outcome: 'accepted',
    lookupsUsed: 1,
    evidence: [{ sourceClass: 'official_external', sourceUrl: 'https://example.com/a', observedAt: '2026-08-24T00:00:00Z', countryCode: 'JP', countryName: 'Japan', claimKind: 'declared_location', confidence: 'explicit' }],
    placement: { state: 'mapped', countryCode: 'JP' },
  }
  identities[1] = {
    ...identities[1],
    outcome: 'excluded_nonperson',
    lookupsUsed: 1,
    entityKind: 'organization',
    classificationReferences: ['https://example.com/org'],
    evidence: [],
    placement: null,
  }
  identities[2] = {
    ...identities[2],
    outcome: 'conflict_unmapped',
    lookupsUsed: 2,
    evidence: [
      { sourceClass: 'official_external', sourceUrl: 'https://example.com/us', observedAt: '2026-08-24T00:00:00Z', countryCode: 'US', countryName: 'United States', claimKind: 'home_base', confidence: 'explicit' },
      { sourceClass: 'official_external', sourceUrl: 'https://example.com/ca', observedAt: '2026-08-24T00:00:00Z', countryCode: 'CA', countryName: 'Canada', claimKind: 'declared_location', confidence: 'explicit' },
    ],
    placement: null,
  }
  return validateResult({
    schemaVersion: 'viewloom-twitch-stream-map-country-review-result-v0.1',
    sourceRunId: contract.sourceRunId,
    batchId: 'A',
    reviewMode: 'manual_review',
    startedAt: '2026-08-24T00:00:00Z',
    completedAt: '2026-08-24T00:30:00Z',
    wallClockMinutes: 30,
    externalLookupsUsed: 4,
    providerRequests: 0,
    canonicalMutationApplied: false,
    completed: true,
    identities,
  })
}

const args = process.argv.slice(2)
if (args.includes('--self-test')) {
  console.log(JSON.stringify(selfTest(), null, 2))
} else {
  const path = args[0]
  if (!path) fail('result path required')
  console.log(JSON.stringify(validateResult(JSON.parse(fs.readFileSync(path, 'utf8'))), null, 2))
}
