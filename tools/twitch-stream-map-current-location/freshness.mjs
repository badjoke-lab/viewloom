const CURRENT_CLAIMS = new Set(['current_location', 'temporary_location'])

export function evaluateCurrentLocationEvidence(evidences, nowInput) {
  const now = parseTime(nowInput)
  if (!now) throw new Error('invalid_now')

  const evaluated = (Array.isArray(evidences) ? evidences : [])
    .filter((evidence) => CURRENT_CLAIMS.has(String(evidence?.claimKind ?? '')))
    .map((evidence) => evaluateClaim(evidence, now))

  const fresh = evaluated.filter((item) => item.state === 'fresh')
  const freshPlaces = unique(fresh.map(placeKey).filter(Boolean))
  const hasConflict = freshPlaces.length > 1

  if (hasConflict) {
    return {
      state: 'conflict',
      placement: null,
      reason: 'conflicting_current_location',
      evaluated,
      freshClaimCount: fresh.length,
    }
  }

  if (fresh.length === 0) {
    const reason = evaluated.some((item) => item.state === 'expired')
      ? 'no_fresh_current_location'
      : evaluated.some((item) => item.state === 'future')
        ? 'current_location_not_started'
        : evaluated.length
          ? 'invalid_current_location'
          : 'no_current_location_evidence'
    return {
      state: 'unknown',
      placement: null,
      reason,
      evaluated,
      freshClaimCount: 0,
    }
  }

  const place = fresh[0]
  return {
    state: 'fresh',
    placement: {
      countryCode: place.countryCode,
      countryName: place.countryName,
      region: place.region,
      city: place.city,
      observedAt: place.observedAt,
      expiresAt: place.expiresAt,
      locationType: place.claimKind,
      sourceClass: place.source,
    },
    reason: null,
    evaluated,
    freshClaimCount: fresh.length,
  }
}

function evaluateClaim(evidence, now) {
  const claimKind = String(evidence?.claimKind ?? '')
  const source = String(evidence?.source ?? '').trim()
  const sourceUrl = String(evidence?.sourceUrl ?? '').trim()
  const countryCode = String(evidence?.countryCode ?? '').trim().toUpperCase()
  const countryName = nullable(evidence?.countryName)
  const region = nullable(evidence?.region)
  const city = nullable(evidence?.city)
  const status = String(evidence?.status ?? '')
  const confidence = String(evidence?.confidence ?? '')
  const observedAtMs = parseTime(evidence?.observedAt)
  const expiresAtMs = parseTime(evidence?.expiresAt)
  const explicitStartAtMs = evidence?.explicitStartAt == null ? null : parseTime(evidence.explicitStartAt)

  const valid = status === 'accepted' &&
    confidence !== 'candidate_only' &&
    CURRENT_CLAIMS.has(claimKind) &&
    Boolean(source) &&
    Boolean(sourceUrl) &&
    Boolean(countryCode) &&
    Boolean(observedAtMs) &&
    Boolean(expiresAtMs) &&
    expiresAtMs > observedAtMs &&
    (explicitStartAtMs == null || explicitStartAtMs <= expiresAtMs)

  let state = 'invalid'
  if (valid) {
    if (explicitStartAtMs != null && now < explicitStartAtMs) state = 'future'
    else if (now >= expiresAtMs) state = 'expired'
    else state = 'fresh'
  }

  return {
    state,
    claimKind,
    source,
    countryCode,
    countryName,
    region,
    city,
    observedAt: nullable(evidence?.observedAt),
    expiresAt: nullable(evidence?.expiresAt),
  }
}

function placeKey(item) {
  if (!item.countryCode) return ''
  return [item.countryCode, item.region ?? '', item.city ?? ''].join('|')
}

function parseTime(value) {
  const ms = Date.parse(String(value ?? ''))
  return Number.isFinite(ms) ? ms : null
}

function nullable(value) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

function unique(values) {
  return [...new Set(values)]
}
