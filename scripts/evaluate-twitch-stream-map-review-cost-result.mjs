import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const path = process.argv[2]
if (!path) {
  console.error('usage: node scripts/evaluate-twitch-stream-map-review-cost-result.mjs <result.json>')
  process.exit(2)
}

const input = JSON.parse(readFileSync(path, 'utf8'))
const invalidReasons = []
const invalidate = (reason) => { if (!invalidReasons.includes(reason)) invalidReasons.push(reason) }
const isoMs = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) {
    invalidate(`${field}_missing`)
    return NaN
  }
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) invalidate(`${field}_invalid`)
  return parsed
}
const sameNumber = (actual, expected, epsilon = 1e-9) =>
  typeof actual === 'number' && Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon

if (input.schemaVersion !== 'viewloom-twitch-stream-map-review-cost-result-v0.1') invalidate('schema_version_invalid')
if (input.provider !== 'twitch') invalidate('provider_invalid')
if (input.sampleNotBeforeAt !== '2026-08-23T08:28:43.300Z') invalidate('sample_not_before_contract_changed')

const sampleCapturedMs = isoMs(input.sampleCapturedAt, 'sampleCapturedAt')
const notBeforeMs = Date.parse('2026-08-23T08:28:43.300Z')
if (Number.isFinite(sampleCapturedMs) && sampleCapturedMs < notBeforeMs) invalidate('sample_captured_before_not_before')

const reviewStartedMs = isoMs(input.reviewStartedAt, 'reviewStartedAt')
const reviewFinishedMs = isoMs(input.reviewFinishedAt, 'reviewFinishedAt')
if (input.researchStartedAfterDurableStartMarker !== true) invalidate('research_not_proven_after_durable_start_marker')
if (Number.isFinite(reviewStartedMs) && Number.isFinite(sampleCapturedMs) && reviewStartedMs < sampleCapturedMs) invalidate('review_started_before_sample')
if (Number.isFinite(reviewFinishedMs) && Number.isFinite(reviewStartedMs) && reviewFinishedMs < reviewStartedMs) invalidate('review_finished_before_start')

const sample = Array.isArray(input.sampleIdentities) ? input.sampleIdentities : []
if (sample.length !== 20) invalidate('sample_identity_count_not_20')
const expectedRanks = Array.from({ length: 20 }, (_, i) => i + 1)
const sampleRanks = sample.map((row) => row.rank)
if (JSON.stringify(sampleRanks) !== JSON.stringify(expectedRanks)) invalidate('sample_ranks_not_exact_1_to_20')
const allowedSampleKeys = ['rank', 'twitchUserId', 'login', 'displayName', 'viewers']
for (const row of sample) {
  if (!row || typeof row !== 'object') { invalidate('sample_row_invalid'); continue }
  const keys = Object.keys(row).sort()
  if (JSON.stringify(keys) !== JSON.stringify([...allowedSampleKeys].sort())) invalidate(`sample_fields_invalid_rank_${row.rank ?? 'unknown'}`)
  if (typeof row.twitchUserId !== 'string' || !row.twitchUserId) invalidate(`sample_twitch_user_id_missing_rank_${row.rank ?? 'unknown'}`)
  if (typeof row.login !== 'string' || !row.login) invalidate(`sample_login_missing_rank_${row.rank ?? 'unknown'}`)
  if (typeof row.displayName !== 'string' || !row.displayName) invalidate(`sample_display_name_missing_rank_${row.rank ?? 'unknown'}`)
  if (!Number.isFinite(row.viewers) || row.viewers < 0) invalidate(`sample_viewers_invalid_rank_${row.rank ?? 'unknown'}`)
}

const reviews = Array.isArray(input.identityReviews) ? input.identityReviews : []
if (reviews.length !== 20) invalidate('identity_review_count_not_20')
const reviewRanks = reviews.map((row) => row.rank).sort((a, b) => a - b)
if (JSON.stringify(reviewRanks) !== JSON.stringify(expectedRanks)) invalidate('review_ranks_not_exact_1_to_20')

const allowedEntityKinds = new Set(['person', 'organization', 'event_broadcast', 'unresolved'])
const allowedOutcomes = new Set(['accepted', 'no_qualifying_evidence', 'excluded_nonperson', 'conflict_unmapped'])
const allowedSources = new Set(['official_external', 'manual_review'])
const allowedLocationTypes = new Set(['home_base', 'declared_location'])
const acceptedRows = []
const excludedRows = []
const conflictRows = []
let acceptedExplicitAttributable = 0
let currentLocationAccepted = 0
let silentCountryConflicts = 0
let totalSearchAttempts = 0

for (const review of reviews) {
  const rank = review?.rank ?? 'unknown'
  if (!allowedEntityKinds.has(review?.entityKind)) invalidate(`entity_kind_invalid_rank_${rank}`)
  if (!allowedOutcomes.has(review?.terminalOutcome)) invalidate(`terminal_outcome_invalid_rank_${rank}`)
  if (!Number.isInteger(review?.searchAttempts) || review.searchAttempts < 0 || review.searchAttempts > 5) invalidate(`search_attempts_invalid_rank_${rank}`)
  else totalSearchAttempts += review.searchAttempts

  const sampleRow = sample.find((row) => row.rank === review.rank)
  if (!sampleRow) invalidate(`review_without_sample_rank_${rank}`)
  else {
    if (review.twitchUserId !== sampleRow.twitchUserId) invalidate(`review_twitch_user_id_mismatch_rank_${rank}`)
    if (review.login !== sampleRow.login) invalidate(`review_login_mismatch_rank_${rank}`)
  }

  if (review.terminalOutcome === 'excluded_nonperson') {
    excludedRows.push(review)
    if (!['organization', 'event_broadcast'].includes(review.entityKind)) invalidate(`excluded_nonperson_kind_invalid_rank_${rank}`)
  }

  if (review.terminalOutcome === 'conflict_unmapped') {
    conflictRows.push(review)
    if (review.countryConflictDetected !== true) invalidate(`conflict_not_declared_rank_${rank}`)
  }

  if (review.silentCountryConflict === true) silentCountryConflicts += 1

  if (review.terminalOutcome === 'accepted') {
    acceptedRows.push(review)
    if (review.entityKind !== 'person') invalidate(`accepted_nonperson_rank_${rank}`)
    if (!allowedSources.has(review.acceptedSource)) invalidate(`accepted_source_invalid_rank_${rank}`)
    if (!allowedLocationTypes.has(review.acceptedLocationType)) {
      if (review.acceptedLocationType === 'current_location') currentLocationAccepted += 1
      invalidate(`accepted_location_type_invalid_rank_${rank}`)
    }
    if (typeof review.acceptedCountryCode !== 'string' || !/^[A-Z]{2}$/.test(review.acceptedCountryCode)) invalidate(`accepted_country_invalid_rank_${rank}`)
    if (typeof review.evidenceUrl !== 'string' || !/^https:\/\//.test(review.evidenceUrl)) invalidate(`accepted_evidence_url_invalid_rank_${rank}`)
    if (review.evidenceExplicitAttributable === true) acceptedExplicitAttributable += 1
    else invalidate(`accepted_evidence_not_explicit_attributable_rank_${rank}`)
    if (review.countryConflictDetected === true) invalidate(`accepted_row_has_country_conflict_rank_${rank}`)
  }
}

const sampleViewers = sample.reduce((sum, row) => sum + (Number.isFinite(row.viewers) ? row.viewers : 0), 0)
const acceptedIdentities = acceptedRows.length
const excludedNonPersonIdentities = excludedRows.length
const personEligibleIdentities = 20 - excludedNonPersonIdentities
const conflictUnmappedIdentities = conflictRows.length
const eligibleUnmappedIdentities = personEligibleIdentities - acceptedIdentities
const reviewedIdentities = reviews.length
const mappedViewerCount = acceptedRows.reduce((sum, row) => {
  const match = sample.find((sampleRow) => sampleRow.rank === row.rank)
  return sum + (match?.viewers ?? 0)
}, 0)
const wallClockReviewMinutes = Number.isFinite(reviewStartedMs) && Number.isFinite(reviewFinishedMs)
  ? (reviewFinishedMs - reviewStartedMs) / 60000
  : NaN
const minutesPerReviewedIdentity = Number.isFinite(wallClockReviewMinutes) && reviewedIdentities > 0
  ? wallClockReviewMinutes / reviewedIdentities
  : null
const minutesPerAcceptedIdentity = Number.isFinite(wallClockReviewMinutes) && acceptedIdentities > 0
  ? wallClockReviewMinutes / acceptedIdentities
  : null
const rawAcceptedCoverage = acceptedIdentities / 20
const personEligibleAcceptedCoverage = personEligibleIdentities > 0 ? acceptedIdentities / personEligibleIdentities : 0
const mappedViewerCoverage = sampleViewers > 0 ? mappedViewerCount / sampleViewers : 0
const explicitAttributableRatio = acceptedIdentities > 0 ? acceptedExplicitAttributable / acceptedIdentities : 0
const acceptedSourceMix = {
  official_external: acceptedRows.filter((row) => row.acceptedSource === 'official_external').length,
  manual_review: acceptedRows.filter((row) => row.acceptedSource === 'manual_review').length,
}

if (acceptedIdentities === 0) invalidate('zero_accepted_identities_cost_metric_undefined')
if (currentLocationAccepted !== 0) invalidate('current_location_acceptance_not_authorized')
if (silentCountryConflicts !== 0) invalidate('silent_country_conflict_present')

const declaredChecks = [
  ['sampleViewers', sampleViewers],
  ['reviewedIdentities', reviewedIdentities],
  ['acceptedIdentities', acceptedIdentities],
  ['excludedNonPersonIdentities', excludedNonPersonIdentities],
  ['eligibleUnmappedIdentities', eligibleUnmappedIdentities],
  ['conflictUnmappedIdentities', conflictUnmappedIdentities],
  ['currentLocationAcceptedIdentities', currentLocationAccepted],
  ['acceptedExplicitAttributableIdentities', acceptedExplicitAttributable],
  ['silentCountryConflicts', silentCountryConflicts],
]
for (const [field, expected] of declaredChecks) {
  if (input[field] !== null && input[field] !== expected) invalidate(`${field}_does_not_match_derived`)
}
const declaredFloatChecks = [
  ['wallClockReviewMinutes', wallClockReviewMinutes],
  ['minutesPerReviewedIdentity', minutesPerReviewedIdentity],
  ['minutesPerAcceptedIdentity', minutesPerAcceptedIdentity],
  ['rawAcceptedCoverage', rawAcceptedCoverage],
  ['personEligibleAcceptedCoverage', personEligibleAcceptedCoverage],
  ['mappedViewerCoverage', mappedViewerCoverage],
]
for (const [field, expected] of declaredFloatChecks) {
  if (input[field] !== null && expected !== null && !sameNumber(input[field], expected, 1e-6)) invalidate(`${field}_does_not_match_derived`)
}
if (input.acceptedSourceMix?.official_external !== null && input.acceptedSourceMix?.official_external !== acceptedSourceMix.official_external) invalidate('accepted_source_mix_official_external_mismatch')
if (input.acceptedSourceMix?.manual_review !== null && input.acceptedSourceMix?.manual_review !== acceptedSourceMix.manual_review) invalidate('accepted_source_mix_manual_review_mismatch')

const measurementValid = invalidReasons.length === 0
const thresholdChecks = {
  rawAcceptedCountryCoverage: rawAcceptedCoverage >= 0.10,
  personEligibleAcceptedCountryCoverage: personEligibleAcceptedCoverage >= 0.15,
  wallClockReviewMinutes: Number.isFinite(wallClockReviewMinutes) && wallClockReviewMinutes <= 120,
  minutesPerAcceptedIdentity: minutesPerAcceptedIdentity !== null && minutesPerAcceptedIdentity <= 30,
  acceptedEvidenceExplicitAttributableRatio: explicitAttributableRatio === 1,
  silentCountryConflicts: silentCountryConflicts === 0,
}
const recurringProposalGatePassed = measurementValid && Object.values(thresholdChecks).every(Boolean)

const output = {
  ...input,
  status: 'measured',
  sampleViewers,
  wallClockReviewMinutes: Number.isFinite(wallClockReviewMinutes) ? wallClockReviewMinutes : null,
  reviewedIdentities,
  acceptedIdentities,
  excludedNonPersonIdentities,
  eligibleUnmappedIdentities,
  conflictUnmappedIdentities,
  currentLocationAcceptedIdentities: currentLocationAccepted,
  acceptedExplicitAttributableIdentities: acceptedExplicitAttributable,
  silentCountryConflicts,
  totalSearchAttempts,
  minutesPerReviewedIdentity,
  minutesPerAcceptedIdentity,
  acceptedSourceMix,
  rawAcceptedCoverage,
  personEligibleAcceptedCoverage,
  mappedViewerCoverage,
  acceptedEvidenceExplicitAttributableRatio: explicitAttributableRatio,
  thresholdChecks,
  measurementValid,
  invalidReasons,
  recurringProposalGatePassed,
}

console.log(JSON.stringify(output, null, 2))
if (!measurementValid) process.exitCode = 1
