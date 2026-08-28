import assert from 'node:assert/strict'
import fs from 'node:fs'

const auditPath = 'docs/audits/twitch-stream-map-current-review-queue-live-result-2026-08-28.json'
const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))

assert.equal(audit.schemaVersion, 'viewloom-twitch-stream-map-current-review-queue-live-result-v0.1')
assert.equal(audit.provider, 'twitch')
assert.equal(audit.layer, 'current')
assert.equal(audit.mode, 'current_location_review_queue_top300_preview')

assert.equal(audit.source.workflowRunId, 33182676137)
assert.equal(audit.source.mainSha, '75183763720e24985d560127f932da6043bf5985')
assert.equal(audit.source.probePackageMergeSha, 'f27fe218951b8acd5b004e16f6f5bb6be1b01dc8')
assert.equal(audit.source.artifactId, 9690366453)
assert.equal(audit.source.artifactSha256, '35ab75ef74ecf75205277d9901256add450087055b3ef3003e5dfcce7db08118')

assert.equal(audit.population.requestedSize, 300)
assert.equal(audit.population.sampleSize, 300)
assert.equal(audit.population.coveredPages, 3)
assert.equal(audit.population.stableIdentity, 'twitchUserId')
assert.equal(audit.population.stableIdentityUnique, true)

assert.equal(audit.apiRequests.token, 1)
assert.equal(audit.apiRequests.streams, 3)
assert.equal(audit.apiRequests.users, 0)

assert.equal(audit.persistence.d1Writes, 0)
assert.equal(audit.persistence.productionDeployment, false)
assert.equal(audit.persistence.rawTitleStored, false)
assert.equal(audit.persistence.rawTagsStored, false)
assert.equal(audit.persistence.rawLanguageStored, false)
assert.equal(audit.persistence.rawTextArtifactAllowed, false)
assert.equal(audit.persistence.canonicalMutationApplied, false)

assert.equal(audit.decision.status, 'review_queue_only')
assert.equal(audit.decision.acceptanceAuthorized, false)
assert.equal(audit.decision.publicCurrentPlacementAuthorized, false)
assert.equal(audit.decision.baseMutationAuthorized, false)
assert.equal(audit.decision.languageUsedForPlacement, false)

assert.equal(audit.reviewBoundary.titleOrTagCanAutoAccept, false)
assert.equal(audit.reviewBoundary.publicCurrentPlacementAuthorized, false)
assert.equal(audit.reviewBoundary.baseMutationAuthorized, false)
assert.equal(audit.reviewBoundary.rawTextRetained, false)
assert.equal(audit.reviewBoundary.languageUsedForPlacement, false)

assert.equal(audit.reviewQueue.length, audit.summary.reviewableCandidates)
assert.equal(audit.rejected.length, audit.summary.rejectedFutureTravel)
assert.equal(audit.invalid.length, audit.summary.invalidIdentity)
assert.equal(audit.summary.inputStreams, 300)
assert.equal(audit.summary.reviewableCandidates, 10)
assert.equal(audit.summary.rejectedFutureTravel, 3)
assert.equal(audit.summary.invalidIdentity, 0)
assert.equal(audit.summary.conflictingCandidates, 0)

const expectedLogins = [
  'alois_nl',
  'jinnytty',
  'bean',
  'sera_promisu',
  'j0beats',
  'peter',
  'deadlyslob',
  'rayasianboy',
  'berticuss',
  'sick_nerd',
]
assert.deepEqual(audit.reviewQueue.map((row) => row.userLogin), expectedLogins)

const seenIds = new Set()
for (const row of audit.reviewQueue) {
  assert.match(row.twitchUserId, /^\d+$/)
  assert.equal(seenIds.has(row.twitchUserId), false)
  seenIds.add(row.twitchUserId)
  assert.equal(row.provider, 'twitch')
  assert.equal(row.layer, 'current')
  assert.equal(row.sourceReference, `https://www.twitch.tv/${row.userLogin}`)
  assert.equal(row.observedAt, audit.observedAt)
  assert.ok(Date.parse(row.reviewWindowExpiresAt) > Date.parse(row.observedAt))
  assert.equal(row.reviewState, 'candidate_review_required')
  assert.equal(row.qualifyingEvidenceRequired, true)
  assert.equal(row.candidateSourceCanAutoAccept, false)
  assert.equal(row.rawTextRetained, false)
  assert.equal(row.acceptedCurrentPlacement, false)
  assert.ok(Array.isArray(row.candidatePlaces) && row.candidatePlaces.length > 0)
  assert.ok(Array.isArray(row.sourceClasses) && row.sourceClasses.length > 0)
  assert.ok(row.sourceClasses.every((sourceClass) => ['stream_title', 'stream_tag'].includes(sourceClass)))
  for (const place of row.candidatePlaces) {
    assert.equal(place.kind, 'country')
    assert.match(place.countryCode, /^[A-Z]{2}$/)
    assert.equal(typeof place.countryName, 'string')
    assert.equal(place.city, null)
    assert.ok(place.sourceClasses.every((sourceClass) => row.sourceClasses.includes(sourceClass)))
  }
}

for (const row of audit.rejected) {
  assert.match(row.twitchUserId, /^\d+$/)
  assert.equal(row.sourceReference, `https://www.twitch.tv/${row.userLogin}`)
  assert.equal(row.observedAt, audit.observedAt)
  assert.equal(row.reason, 'future_or_planned_travel_wording')
  assert.deepEqual(row.candidatePlaces, [])
  assert.equal(row.rawTextRetained, false)
  assert.equal(row.acceptedCurrentPlacement, false)
}

function assertNoForbiddenRawOrPreciseKeys(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenRawOrPreciseKeys(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(
      ['title', 'tags', 'language', 'address', 'latitude', 'longitude', 'gps'].includes(key),
      false,
      `forbidden raw/precise key ${path}.${key}`,
    )
    assertNoForbiddenRawOrPreciseKeys(child, `${path}.${key}`)
  }
}
assertNoForbiddenRawOrPreciseKeys(audit)

const accepted = audit.reviewQueue.filter((row) => row.acceptedCurrentPlacement === true)
assert.equal(accepted.length, 0)

console.log(JSON.stringify({
  ok: true,
  workflowRunId: audit.source.workflowRunId,
  observedAt: audit.observedAt,
  population: audit.population.sampleSize,
  reviewableCandidates: audit.summary.reviewableCandidates,
  rejectedFutureTravel: audit.summary.rejectedFutureTravel,
  conflictingCandidates: audit.summary.conflictingCandidates,
  invalidIdentity: audit.summary.invalidIdentity,
  acceptedCurrentPlacements: accepted.length,
  rawTextRetained: false,
  productionMutationAuthorized: false,
}, null, 2))
