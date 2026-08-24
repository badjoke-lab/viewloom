const NON_PERSON_ENTITY_KINDS = new Set(['organization', 'event_broadcast'])
const BASE_PLACEABLE_CLAIMS = new Set(['home_base', 'declared_location'])
const DEFAULT_FRESH_EVIDENCE_DAYS = 180

export function buildCoverageExpansionQueue({
  capturedAt,
  identities,
  reviewedRecords,
  suppressedStableUserIds = [],
  freshEvidenceDays = DEFAULT_FRESH_EVIDENCE_DAYS,
}) {
  const capturedMs = Date.parse(String(capturedAt ?? ''))
  if (!Number.isFinite(capturedMs)) throw new Error('invalid_captured_at')
  if (!Number.isInteger(freshEvidenceDays) || freshEvidenceDays < 1) throw new Error('invalid_fresh_evidence_days')

  const population = normalizeIdentities(identities)
  const reviewedByLogin = new Map(
    (Array.isArray(reviewedRecords) ? reviewedRecords : [])
      .map((record) => [normalizeLogin(record?.streamerLogin), record])
      .filter(([login]) => Boolean(login)),
  )
  const suppressedIds = new Set(
    (Array.isArray(suppressedStableUserIds) ? suppressedStableUserIds : [])
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  )

  const queue = []
  const excludedFreshEvidence = []
  const excludedNonPerson = []
  const excludedStableHistory = []
  const unresolvedEntity = []

  for (const identity of population) {
    if (suppressedIds.has(identity.twitchUserId)) {
      excludedStableHistory.push({ ...identity, reason: 'stable_history_suppressed' })
      continue
    }

    const record = reviewedByLogin.get(identity.login)
    if (!record) {
      queue.push({ ...identity, reason: 'no_reviewed_record' })
      continue
    }

    const entityKind = String(record.entityKind ?? 'unknown').trim()
    if (NON_PERSON_ENTITY_KINDS.has(entityKind)) {
      excludedNonPerson.push({ ...identity, entityKind, reason: 'known_nonperson' })
      continue
    }

    if (entityKind !== 'person') {
      unresolvedEntity.push({ ...identity, entityKind, reason: 'entity_kind_unresolved' })
      queue.push({ ...identity, reason: 'entity_kind_unresolved' })
      continue
    }

    const acceptedBaseEvidence = (Array.isArray(record.evidences) ? record.evidences : [])
      .filter((evidence) => isAcceptedBaseEvidence(evidence))

    const freshest = acceptedBaseEvidence
      .map((evidence) => ({ evidence, observedMs: Date.parse(String(evidence.observedAt ?? '')) }))
      .filter((row) => Number.isFinite(row.observedMs) && row.observedMs <= capturedMs)
      .sort((left, right) => right.observedMs - left.observedMs)[0]

    if (freshest) {
      const ageDays = (capturedMs - freshest.observedMs) / 86_400_000
      if (ageDays < freshEvidenceDays) {
        excludedFreshEvidence.push({
          ...identity,
          reason: 'fresh_accepted_base_evidence',
          evidenceObservedAt: freshest.evidence.observedAt,
          evidenceAgeDays: Number(ageDays.toFixed(3)),
        })
        continue
      }

      queue.push({
        ...identity,
        reason: 'accepted_base_evidence_re_review_due',
        evidenceObservedAt: freshest.evidence.observedAt,
        evidenceAgeDays: Number(ageDays.toFixed(3)),
      })
      continue
    }

    queue.push({ ...identity, reason: 'eligible_unmapped_person' })
  }

  queue.sort(compareIdentity)

  return {
    schemaVersion: 'viewloom-twitch-stream-map-coverage-queue-v0.1',
    provider: 'twitch',
    capturedAt: new Date(capturedMs).toISOString(),
    stableIdentityKey: 'twitchUserId',
    reviewedEvidenceJoinKey: 'currentSampleLogin',
    freshnessDays: freshEvidenceDays,
    counts: {
      population: population.length,
      queued: queue.length,
      excludedFreshEvidence: excludedFreshEvidence.length,
      excludedNonPerson: excludedNonPerson.length,
      excludedStableHistory: excludedStableHistory.length,
      unresolvedEntity: unresolvedEntity.length,
    },
    queue,
    excludedFreshEvidence: excludedFreshEvidence.sort(compareIdentity),
    excludedNonPerson: excludedNonPerson.sort(compareIdentity),
    excludedStableHistory: excludedStableHistory.sort(compareIdentity),
    unresolvedEntity: unresolvedEntity.sort(compareIdentity),
    invariants: {
      stableIdDeduped: true,
      loginCollisionFailsClosed: true,
      nonPersonExcluded: true,
      freshAcceptedBaseEvidenceExcluded: true,
      currentLocationDoesNotSuppressBaseReview: true,
      calendarWeekControlsQueue: false,
    },
  }
}

function normalizeIdentities(values) {
  if (!Array.isArray(values)) throw new Error('identities_must_be_array')
  const rows = values.map((value, index) => normalizeIdentity(value, index))
  const seenIds = new Set()
  const loginToId = new Map()

  for (const row of rows) {
    if (seenIds.has(row.twitchUserId)) throw new Error(`duplicate_twitch_user_id:${row.twitchUserId}`)
    seenIds.add(row.twitchUserId)

    const priorId = loginToId.get(row.login)
    if (priorId && priorId !== row.twitchUserId) {
      throw new Error(`login_identity_collision:${row.login}`)
    }
    loginToId.set(row.login, row.twitchUserId)
  }

  return rows.sort(compareIdentity)
}

function normalizeIdentity(value, index) {
  const twitchUserId = String(value?.twitchUserId ?? value?.user_id ?? '').trim()
  const login = normalizeLogin(value?.login ?? value?.user_login)
  const displayName = String(value?.displayName ?? value?.user_name ?? login).trim()
  const viewers = finiteNonNegative(value?.viewers ?? value?.viewer_count)
  const rank = positiveInteger(value?.rank) || index + 1

  if (!twitchUserId) throw new Error(`missing_twitch_user_id_rank_${rank}`)
  if (!login) throw new Error(`missing_login_rank_${rank}`)
  if (!displayName) throw new Error(`missing_display_name_rank_${rank}`)

  return { rank, twitchUserId, login, displayName, viewers }
}

function isAcceptedBaseEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return false
  if (String(evidence.status ?? '') !== 'accepted') return false
  if (String(evidence.confidence ?? '') === 'candidate_only') return false
  if (!BASE_PLACEABLE_CLAIMS.has(String(evidence.claimKind ?? ''))) return false
  return Boolean(String(evidence.countryCode ?? '').trim())
}

function normalizeLogin(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function finiteNonNegative(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return 0
  return Math.round(number)
}

function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : 0
}

function compareIdentity(left, right) {
  return left.rank - right.rank || right.viewers - left.viewers || left.twitchUserId.localeCompare(right.twitchUserId)
}
