import { evaluateCurrentLocationEvidence } from '../workers/collector-twitch/scripts/current-location-evidence-eligibility.mjs'

function text(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function viewers(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function normalizeStream(value) {
  if (!value || typeof value !== 'object') return null
  const userLogin = text(value.userLogin ?? value.user_login).toLowerCase()
  if (!userLogin) return null
  return {
    twitchUserId: text(value.twitchUserId ?? value.user_id) || null,
    userLogin,
    displayName: text(value.displayName ?? value.user_name ?? value.name) || userLogin,
    viewers: viewers(value.viewers ?? value.viewer_count),
    url: text(value.url) || `https://www.twitch.tv/${userLogin}`,
  }
}

function normalizeEvidence(value) {
  if (!value || typeof value !== 'object') return null
  const provider = text(value.provider).toLowerCase()
  const twitchUserId = text(value.twitchUserId ?? value.twitch_user_id)
  const countryCode = text(value.countryCode ?? value.country_code).toUpperCase()
  const claimKind = text(value.claimKind ?? value.claim_kind)
  const status = text(value.status)
  if (provider !== 'twitch' || !twitchUserId || !countryCode) return null
  if (!['current_location', 'temporary_location'].includes(claimKind)) return null
  if (status !== 'accepted') return null
  return {
    provider: 'twitch',
    twitchUserId,
    userLogin: text(value.userLogin ?? value.user_login).toLowerCase() || null,
    status,
    claimKind,
    countryCode,
    countryName: text(value.countryName ?? value.country_name) || countryCode,
    city: text(value.city) || null,
    evidenceClass: text(value.evidenceClass ?? value.sourceClass),
    sourceUrl: text(value.sourceUrl ?? value.source_url),
    attributableTemporalEvidence: value.attributableTemporalEvidence === true,
    observedAt: text(value.observedAt ?? value.observed_at),
    expiresAt: text(value.expiresAt ?? value.expires_at) || null,
  }
}

function placeKey(evidence) {
  return `${evidence.countryCode}|${evidence.city ?? ''}`
}

function reasonForNoFreshEvidence(evaluated) {
  if (evaluated.length === 0) return 'no_reviewed_current_evidence'
  if (evaluated.some((row) => row.result.reason === 'observation_is_in_future')) return 'current_location_not_started'
  if (evaluated.some((row) => row.result.reason === 'expired_current_evidence')) return 'no_fresh_current_location'
  return 'no_qualifying_current_evidence'
}

export function buildTwitchCurrentResponse({ snapshotItems = [], reviewedEvidence = [], evaluatedAt }) {
  const streams = (Array.isArray(snapshotItems) ? snapshotItems : []).map(normalizeStream).filter(Boolean)
  const evidence = (Array.isArray(reviewedEvidence) ? reviewedEvidence : []).map(normalizeEvidence).filter(Boolean)
  const evidenceById = new Map()
  for (const row of evidence) {
    const list = evidenceById.get(row.twitchUserId) ?? []
    list.push(row)
    evidenceById.set(row.twitchUserId, list)
  }

  const mappedStreams = []
  const unmappedStreams = []
  const conflictStreams = []

  for (const stream of streams) {
    if (!stream.twitchUserId) {
      unmappedStreams.push({
        ...stream,
        geography: { state: 'unmapped', reason: 'stable_identity_unavailable' },
      })
      continue
    }

    const reviewed = evidenceById.get(stream.twitchUserId) ?? []
    const evaluated = reviewed.map((row) => ({
      evidence: row,
      result: evaluateCurrentLocationEvidence(row, { evaluatedAt }),
    }))
    const fresh = evaluated.filter((row) => row.result.eligible)
    const freshPlaces = new Map()
    for (const row of fresh) {
      const key = placeKey(row.evidence)
      const list = freshPlaces.get(key) ?? []
      list.push(row)
      freshPlaces.set(key, list)
    }

    if (freshPlaces.size > 1) {
      conflictStreams.push({
        ...stream,
        geography: {
          state: 'conflict',
          reason: 'conflicting_current_location',
          freshPlaceCount: freshPlaces.size,
        },
      })
      continue
    }

    if (freshPlaces.size === 1) {
      const rows = [...freshPlaces.values()][0]
      const first = rows[0].evidence
      const expiries = rows.map((row) => row.result.effectiveExpiresAt).filter(Boolean).sort()
      mappedStreams.push({
        ...stream,
        geography: {
          state: 'mapped',
          layer: 'current',
          claimKinds: [...new Set(rows.map((row) => row.evidence.claimKind))].sort(),
          countryCode: first.countryCode,
          countryName: first.countryName,
          city: first.city,
          observedAt: rows.map((row) => row.evidence.observedAt).sort().at(-1) ?? null,
          expiresAt: expiries[0] ?? null,
          evidenceClasses: [...new Set(rows.map((row) => row.evidence.evidenceClass))].sort(),
          evidenceCount: rows.length,
        },
      })
      continue
    }

    unmappedStreams.push({
      ...stream,
      geography: {
        state: 'unmapped',
        reason: reasonForNoFreshEvidence(evaluated),
      },
    })
  }

  const sumViewers = (rows) => rows.reduce((sum, row) => sum + viewers(row.viewers), 0)
  const observedStreams = streams.length
  const observedViewers = sumViewers(streams)
  const mappedViewers = sumViewers(mappedStreams)
  const unmappedViewers = sumViewers(unmappedStreams)
  const conflictViewers = sumViewers(conflictStreams)

  return {
    version: 'viewloom-twitch-stream-map-current-response-core-v0.1',
    provider: 'twitch',
    layer: 'current',
    evaluatedAt,
    publicActivationAuthorized: false,
    coverage: {
      observedStreams,
      observedViewers,
      mappedStreams: mappedStreams.length,
      mappedViewers,
      unmappedStreams: unmappedStreams.length,
      unmappedViewers,
      conflictStreams: conflictStreams.length,
      conflictViewers,
      streamCoverage: observedStreams > 0 ? Number((mappedStreams.length / observedStreams).toFixed(6)) : 0,
      viewerCoverage: observedViewers > 0 ? Number((mappedViewers / observedViewers).toFixed(6)) : 0,
      reconciliation: {
        passes: mappedStreams.length + unmappedStreams.length + conflictStreams.length === observedStreams &&
          mappedViewers + unmappedViewers + conflictViewers === observedViewers,
      },
    },
    mappedStreams,
    unmappedStreams,
    conflictStreams,
    semantics: {
      stableIdentity: 'twitchUserId',
      stableTwitchUserIdRequired: true,
      loginIsStableIdentity: false,
      titleOrTagCanPlaceCurrent: false,
      candidateOnlyPlacementAllowed: false,
      baseMutationAuthorized: false,
      currentFromBaseInferenceAllowed: false,
      providerAggregationAllowed: false,
      preciseAddressPublished: false,
      coordinatesPublished: false,
      expiredEvidenceCanPlaceCurrent: false,
    },
  }
}
