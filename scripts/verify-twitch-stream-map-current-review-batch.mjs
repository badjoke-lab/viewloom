import assert from 'node:assert/strict'
import fs from 'node:fs'

const auditPath = 'docs/audits/twitch-stream-map-current-review-queue-live-result-2026-08-28.json'
const batchPath = 'docs/audits/twitch-stream-map-current-review-batch-2026-08-28.json'
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'))

assert.equal(batch.schemaVersion, 'viewloom-twitch-stream-map-current-review-batch-v0.1')
assert.equal(batch.provider, 'twitch')
assert.equal(batch.layer, 'current')
assert.equal(batch.source.auditPath, auditPath)
assert.equal(batch.source.workflowRunId, audit.source.workflowRunId)
assert.equal(batch.source.artifactId, audit.source.artifactId)
assert.equal(batch.source.observedAt, audit.observedAt)

const sourceExpiry = new Set(audit.reviewQueue.map((row) => row.reviewWindowExpiresAt))
assert.equal(sourceExpiry.size, 1)
assert.equal(batch.source.reviewWindowExpiresAt, [...sourceExpiry][0])

const policy = batch.reviewPolicy
assert.equal(policy.candidateInputsQualifyAsCurrentEvidence, false)
assert.equal(policy.requiresAttributableTemporalEvidence, true)
assert.equal(policy.autoAcceptanceAuthorized, false)
assert.equal(policy.publicCurrentPlacementAuthorized, false)
assert.equal(policy.baseMutationAuthorized, false)
assert.equal(policy.twitchKickAggregationAuthorized, false)
assert.equal(policy.defaultOpenEndedTtlHours, 24)
assert.deepEqual(policy.publicPrecision, ['country', 'city'])

for (const required of [
  'self_controlled_current_statement',
  'official_affiliated_current_statement',
  'attributable_editorial_current_statement',
  'reviewed_direct_self_statement_transcript',
]) assert.ok(policy.acceptedEvidenceClasses.includes(required))

for (const candidateOnly of ['stream_title', 'stream_tag', 'search_snippet']) {
  assert.ok(policy.candidateOnlyEvidenceClasses.includes(candidateOnly))
}
for (const rejected of ['language', 'timezone', 'ip_inference', 'planned_future_travel']) {
  assert.ok(policy.standaloneRejectedClasses.includes(rejected))
}

assert.equal(batch.entries.length, audit.reviewQueue.length)
assert.equal(batch.summary.candidateCount, audit.reviewQueue.length)

const sourceById = new Map(audit.reviewQueue.map((row) => [row.twitchUserId, row]))
assert.equal(sourceById.size, audit.reviewQueue.length)

const allowedStatuses = new Set([
  'pending_review',
  'qualifying_current_evidence',
  'no_qualifying_evidence',
  'expired',
  'conflict',
  'invalid',
])

const counts = {
  pendingReview: 0,
  acceptedCurrent: 0,
  noQualifyingEvidence: 0,
  expired: 0,
  conflict: 0,
  invalid: 0,
}

for (const entry of batch.entries) {
  assert.match(entry.twitchUserId, /^\d+$/)
  assert.ok(allowedStatuses.has(entry.reviewStatus))
  const source = sourceById.get(entry.twitchUserId)
  assert.ok(source, `unknown source identity ${entry.twitchUserId}`)
  assert.equal(entry.userLogin, source.userLogin)
  assert.deepEqual(entry.candidate, {
    countryCode: source.candidatePlaces[0].countryCode,
    countryName: source.candidatePlaces[0].countryName,
    city: source.candidatePlaces[0].city,
    sourceClass: source.sourceClasses[0],
  })
  assert.ok(policy.candidateOnlyEvidenceClasses.includes(entry.candidate.sourceClass))
  assert.ok(Array.isArray(entry.qualifyingEvidence))

  const decision = entry.decision
  assert.equal(typeof decision.acceptedCurrentPlacement, 'boolean')

  if (entry.reviewStatus === 'pending_review') {
    counts.pendingReview += 1
    assert.deepEqual(entry.qualifyingEvidence, [])
    assert.equal(decision.acceptedCurrentPlacement, false)
    assert.equal(decision.countryCode, null)
    assert.equal(decision.countryName, null)
    assert.equal(decision.city, null)
    assert.equal(decision.observedAt, null)
    assert.equal(decision.expiresAt, null)
    assert.equal(decision.sourceClass, null)
    assert.equal(decision.reason, 'qualifying_current_evidence_not_yet_reviewed')
    continue
  }

  if (entry.reviewStatus === 'qualifying_current_evidence') {
    counts.acceptedCurrent += 1
    assert.equal(decision.acceptedCurrentPlacement, true)
    assert.ok(entry.qualifyingEvidence.length >= 1)
    assert.match(decision.countryCode, /^[A-Z]{2}$/)
    assert.equal(typeof decision.countryName, 'string')
    assert.ok(decision.city === null || typeof decision.city === 'string')
    assert.ok(policy.acceptedEvidenceClasses.includes(decision.sourceClass))
    assert.ok(Number.isFinite(Date.parse(decision.observedAt)))
    assert.ok(Number.isFinite(Date.parse(decision.expiresAt)))
    assert.ok(Date.parse(decision.expiresAt) > Date.parse(decision.observedAt))
    const maxTemporaryMs = 14 * 24 * 60 * 60 * 1000
    assert.ok(Date.parse(decision.expiresAt) - Date.parse(decision.observedAt) <= maxTemporaryMs)
    for (const evidence of entry.qualifyingEvidence) {
      assert.ok(policy.acceptedEvidenceClasses.includes(evidence.sourceClass))
      assert.match(evidence.sourceReference, /^https:\/\//)
      assert.ok(Number.isFinite(Date.parse(evidence.observedAt)))
      assert.ok(Number.isFinite(Date.parse(evidence.expiresAt)))
      assert.ok(Date.parse(evidence.expiresAt) > Date.parse(evidence.observedAt))
      assert.equal(evidence.rawTextRetained, false)
    }
    continue
  }

  assert.equal(decision.acceptedCurrentPlacement, false)
  if (entry.reviewStatus === 'no_qualifying_evidence') counts.noQualifyingEvidence += 1
  if (entry.reviewStatus === 'expired') counts.expired += 1
  if (entry.reviewStatus === 'conflict') counts.conflict += 1
  if (entry.reviewStatus === 'invalid') counts.invalid += 1
}

assert.deepEqual(batch.summary, {
  candidateCount: batch.entries.length,
  ...counts,
})

function assertNoForbiddenKeys(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(
      ['title', 'tags', 'language', 'address', 'latitude', 'longitude', 'gps', 'gpsTrace', 'preciseTravelPath'].includes(key),
      false,
      `forbidden raw/precise key ${path}.${key}`,
    )
    assertNoForbiddenKeys(child, `${path}.${key}`)
  }
}
assertNoForbiddenKeys(batch)

assert.equal(batch.reviewPolicy.publicCurrentPlacementAuthorized, false)
assert.equal(batch.reviewPolicy.baseMutationAuthorized, false)

console.log(JSON.stringify({
  ok: true,
  workflowRunId: batch.source.workflowRunId,
  candidateCount: batch.entries.length,
  reviewWindowExpiresAt: batch.source.reviewWindowExpiresAt,
  ...counts,
  publicCurrentPlacementAuthorized: false,
  baseMutationAuthorized: false,
}, null, 2))
