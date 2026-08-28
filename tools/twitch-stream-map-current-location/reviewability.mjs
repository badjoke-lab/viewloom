import {
  extractTagLocationCandidates,
  extractTitleLocationCandidates,
} from '../../workers/collector-twitch/scripts/location-candidate-extractor.mjs'

const REVIEW_WINDOW_HOURS = 24
const QUALIFYING_SOURCE_CLASSES = new Set([
  'self_controlled_current_statement',
  'official_affiliated_current_statement',
  'attributable_editorial_current_statement',
  'reviewed_direct_self_statement',
])

function clean(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function normalizeLogin(value) {
  return clean(value).toLowerCase()
}

function iso(value) {
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date.toISOString() : null
}

function addHours(value, hours) {
  const date = new Date(value)
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString()
}

function dedupePlaces(candidates) {
  const map = new Map()
  for (const candidate of candidates) {
    const key = [candidate.countryCode, candidate.city ?? ''].join(':')
    if (!map.has(key)) {
      map.set(key, {
        kind: candidate.kind,
        countryCode: candidate.countryCode,
        countryName: candidate.countryName,
        city: candidate.city ?? null,
        sourceClasses: [],
      })
    }
    const row = map.get(key)
    if (!row.sourceClasses.includes(candidate.source)) row.sourceClasses.push(candidate.source)
  }
  return [...map.values()].sort((a, b) => {
    const ak = `${a.countryCode}:${a.city ?? ''}`
    const bk = `${b.countryCode}:${b.city ?? ''}`
    return ak.localeCompare(bk)
  })
}

export function buildCurrentLocationReviewQueue(streams, { observedAt } = {}) {
  const observed = iso(observedAt ?? new Date().toISOString())
  if (!observed) throw new Error('invalid_observed_at')

  const reviewQueue = []
  const rejected = []
  const invalid = []

  for (const stream of Array.isArray(streams) ? streams : []) {
    const twitchUserId = clean(stream?.twitchUserId ?? stream?.user_id)
    const userLogin = normalizeLogin(stream?.userLogin ?? stream?.user_login)
    if (!twitchUserId || !userLogin) {
      invalid.push({
        twitchUserId: twitchUserId || null,
        userLogin: userLogin || null,
        reason: 'stable_identity_or_login_unavailable',
      })
      continue
    }

    const titleResult = extractTitleLocationCandidates(stream?.title)
    const tagCandidates = extractTagLocationCandidates(stream?.tags)
    const candidates = [...titleResult.candidates, ...tagCandidates]
    const places = dedupePlaces(candidates)

    if (titleResult.rejected === 'future_or_planned_travel_wording') {
      rejected.push({
        twitchUserId,
        userLogin,
        sourceReference: `https://www.twitch.tv/${userLogin}`,
        observedAt: observed,
        reason: 'future_or_planned_travel_wording',
        candidatePlaces: places,
        rawTextRetained: false,
        acceptedCurrentPlacement: false,
      })
      continue
    }

    if (places.length === 0) continue

    reviewQueue.push({
      twitchUserId,
      userLogin,
      provider: 'twitch',
      layer: 'current',
      sourceReference: `https://www.twitch.tv/${userLogin}`,
      observedAt: observed,
      reviewWindowExpiresAt: addHours(observed, REVIEW_WINDOW_HOURS),
      reviewState: places.length > 1 ? 'candidate_conflict_review_required' : 'candidate_review_required',
      candidatePlaces: places,
      sourceClasses: [...new Set(candidates.map((candidate) => candidate.source))].sort(),
      qualifyingEvidenceRequired: true,
      candidateSourceCanAutoAccept: false,
      rawTextRetained: false,
      acceptedCurrentPlacement: false,
    })
  }

  return {
    schemaVersion: 'viewloom-twitch-stream-map-current-review-queue-v0.1',
    provider: 'twitch',
    layer: 'current',
    observedAt: observed,
    reviewWindowHours: REVIEW_WINDOW_HOURS,
    reviewQueue,
    rejected,
    invalid,
    summary: {
      inputStreams: Array.isArray(streams) ? streams.length : 0,
      reviewableCandidates: reviewQueue.length,
      rejectedFutureTravel: rejected.length,
      invalidIdentity: invalid.length,
      conflictingCandidates: reviewQueue.filter((row) => row.reviewState === 'candidate_conflict_review_required').length,
    },
    boundary: {
      titleOrTagCanAutoAccept: false,
      publicCurrentPlacementAuthorized: false,
      baseMutationAuthorized: false,
      rawTextRetained: false,
      languageUsedForPlacement: false,
    },
  }
}

export function validateCurrentLocationReviewResult(queueEntry, result, { now } = {}) {
  const reviewedAt = iso(result?.reviewedAt ?? now ?? new Date().toISOString())
  if (!reviewedAt) return invalidResult('invalid_reviewed_at')
  if (!queueEntry || typeof queueEntry !== 'object') return invalidResult('missing_queue_entry')
  if (reviewedAt >= String(queueEntry.reviewWindowExpiresAt ?? '')) return invalidResult('review_window_expired')

  const outcome = clean(result?.outcome)
  const allowedNonAccepted = new Set([
    'no_qualifying_evidence',
    'conflict_unmapped',
    'rejected_future_travel',
    'expired_before_review',
  ])

  if (allowedNonAccepted.has(outcome)) {
    return {
      ok: true,
      accepted: false,
      outcome,
      twitchUserId: queueEntry.twitchUserId,
      userLogin: queueEntry.userLogin,
      reviewedAt,
      placement: null,
      baseMutationAuthorized: false,
    }
  }

  if (!['accepted_current', 'accepted_temporary'].includes(outcome)) return invalidResult('unsupported_outcome')

  const evidence = result?.qualifyingEvidence
  if (!evidence || typeof evidence !== 'object') return invalidResult('missing_qualifying_evidence')
  const sourceClass = clean(evidence.sourceClass)
  if (!QUALIFYING_SOURCE_CLASSES.has(sourceClass)) return invalidResult('candidate_source_not_qualifying_evidence')
  const sourceUrl = clean(evidence.sourceUrl)
  if (!/^https:\/\//i.test(sourceUrl)) return invalidResult('invalid_source_url')

  const countryCode = clean(evidence.countryCode).toUpperCase()
  const city = clean(evidence.city) || null
  if (!/^[A-Z]{2}$/.test(countryCode)) return invalidResult('invalid_country_code')

  const candidateMatch = (Array.isArray(queueEntry.candidatePlaces) ? queueEntry.candidatePlaces : [])
    .some((place) => clean(place?.countryCode).toUpperCase() === countryCode && (!city || !clean(place?.city) || clean(place?.city) === city))
  if (!candidateMatch) return invalidResult('qualifying_evidence_does_not_match_candidate_place')

  const evidenceObservedAt = iso(evidence.observedAt)
  const expiresAt = iso(evidence.expiresAt)
  if (!evidenceObservedAt) return invalidResult('missing_or_invalid_observed_at')
  if (!expiresAt) return invalidResult('missing_or_invalid_expires_at')
  const startMs = Date.parse(evidenceObservedAt)
  const endMs = Date.parse(expiresAt)
  if (!(endMs > startMs)) return invalidResult('non_positive_freshness_window')

  const claimKind = outcome === 'accepted_current' ? 'current_location' : 'temporary_location'
  const maxMs = claimKind === 'current_location'
    ? 24 * 60 * 60 * 1000
    : 14 * 24 * 60 * 60 * 1000
  if (endMs - startMs > maxMs) return invalidResult('freshness_window_exceeds_contract_ceiling')

  return {
    ok: true,
    accepted: true,
    outcome,
    twitchUserId: queueEntry.twitchUserId,
    userLogin: queueEntry.userLogin,
    reviewedAt,
    claimKind,
    placement: {
      countryCode,
      countryName: clean(evidence.countryName) || countryCode,
      city,
      observedAt: evidenceObservedAt,
      expiresAt,
      sourceClass,
      sourceUrl,
      confidence: clean(evidence.confidence) || 'reviewed',
    },
    titleOrTagAcceptedAsEvidence: false,
    baseMutationAuthorized: false,
  }
}

function invalidResult(reason) {
  return {
    ok: false,
    accepted: false,
    outcome: 'invalid',
    reason,
    placement: null,
    baseMutationAuthorized: false,
  }
}
