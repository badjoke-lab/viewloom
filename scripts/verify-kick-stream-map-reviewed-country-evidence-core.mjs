import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

import { buildKickReviewedCountryEvidence } from './kick-stream-map-reviewed-country-evidence-core.mjs'
import { buildKickCountryResponse } from './kick-stream-map-country-response-core.mjs'

const auditDir = 'docs/audits'
const resultFiles = fs.readdirSync(auditDir)
  .filter((name) => /^kick-stream-map-country-review-result-2026-09-02-\d{2}\.json$/.test(name))
  .sort()

assert.ok(resultFiles.length >= 1, 'at least one completed Kick Country review result is required')
const results = resultFiles.map((name) => JSON.parse(fs.readFileSync(path.join(auditDir, name), 'utf8')))
const reviewedRows = results.flatMap((result) => result.identities)
const evidence = buildKickReviewedCountryEvidence(results)

assert.equal(evidence.length, reviewedRows.length)
assert.equal(new Set(evidence.map((row) => row.stableKickUserId)).size, evidence.length)
assert.ok(evidence.every((row) => row.provider === 'kick'))
assert.ok(evidence.every((row) => typeof row.stableKickUserId === 'string' && row.stableKickUserId.length > 0))
assert.ok(evidence.every((row) => !Object.hasOwn(row, 'slug')))
assert.ok(evidence.every((row) => !Object.hasOwn(row, 'viewers')))
assert.ok(evidence.every((row) => !Object.hasOwn(row, 'evidence')))

const accepted = evidence.filter((row) => row.outcome === 'accepted')
const excluded = evidence.filter((row) => row.outcome === 'excluded_nonperson')
const noQualifying = evidence.filter((row) => row.outcome === 'no_qualifying_evidence')
const conflicts = evidence.filter((row) => row.outcome === 'conflict_unmapped')

assert.ok(accepted.every((row) => row.placement?.state === 'mapped' && /^[A-Z]{2}$/.test(row.placement.countryCode)))
assert.ok(evidence.filter((row) => row.outcome !== 'accepted').every((row) => row.placement === null))

const sourceByStableId = new Map(reviewedRows.map((row) => [String(row.broadcasterUserId), row]))
const snapshotItems = evidence.map((row) => {
  const source = sourceByStableId.get(row.stableKickUserId)
  assert.ok(source, `source row missing for ${row.stableKickUserId}`)
  return {
    slug: source.slug,
    displayName: source.slug,
    viewer_count: 1,
    broadcaster_user_id: row.stableKickUserId,
    url: `https://kick.com/${source.slug}`,
  }
})

const response = buildKickCountryResponse({
  snapshotItems,
  reviewedEvidence: evidence,
  observedAt: '2026-09-02T00:00:00.000Z',
})

assert.equal(response.publicActivationAuthorized, false)
assert.equal(response.coverage.observedStreams, evidence.length)
assert.equal(response.coverage.mappedStreams, accepted.length)
assert.equal(response.coverage.excludedStreams, excluded.length)
assert.equal(response.coverage.conflictStreams, conflicts.length)
assert.equal(response.coverage.unmappedStreams, noQualifying.length)
assert.equal(response.coverage.reconciliation.passes, true)
assert.ok(response.unmappedStreams.every((row) => row.geography.reason === 'no_qualifying_reviewed_country'))
assert.ok(response.mappedStreams.every((row) => row.geography.reason === 'reviewed_country_accepted'))
assert.ok(response.excludedStreams.every((row) => row.geography.reason === 'reviewed_nonperson_exclusion'))

const serialized = JSON.stringify(evidence)
for (const forbidden of ['slug','displayName','viewer_count','viewers','title','tags','description','city','latitude','longitude','coordinates','currentLocation']) {
  assert.equal(serialized.includes(`\"${forbidden}\"`), false, `runtime reviewed evidence must omit ${forbidden}`)
}

console.log(JSON.stringify({
  ok: true,
  resultFiles: resultFiles.length,
  reviewed: evidence.length,
  accepted: accepted.length,
  excludedNonperson: excluded.length,
  noQualifyingEvidence: noQualifying.length,
  conflictUnmapped: conflicts.length,
  publicActivationAuthorized: response.publicActivationAuthorized,
  stableIdentity: response.semantics.stableIdentity,
  reconciliationPasses: response.coverage.reconciliation.passes,
}, null, 2))
