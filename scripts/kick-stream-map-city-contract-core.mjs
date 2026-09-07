const ACCEPTED_BASE_CITY_CLAIM_KINDS = new Set(['home_base', 'declared_location'])
const REVIEW_OUTCOMES = new Set(['accepted', 'no_qualifying_evidence', 'conflict_unmapped', 'excluded_nonperson'])

function clean(value) {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function normalizeText(value) {
  return clean(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeSlug(value) {
  return normalizeText(value)
}

function normalizeStableId(value) {
  const text = clean(value)
  return text || null
}

function normalizeViewers(value) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0
}

function normalizeCountryCode(value) {
  const code = clean(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : null
}

function cityAggregateKey({ countryCode, region, city }) {
  const normalizedRegion = normalizeText(region) || '__none__'
  return `${countryCode}|${normalizedRegion}|${normalizeText(city)}`
}

function publicStream(item, geography) {
  return {
    provider: 'kick',
    slug: item.slug,
    displayName: item.displayName || item.slug,
    viewers: item.viewers,
    url: item.url || `https://kick.com/${item.slug}`,
    geography,
  }
}

function normalizedReferenceGeometry(review) {
  const raw = review?.referenceGeometry ?? {}
  const state = clean(raw.state || review?.geometryState)
  const referenceKey = clean(raw.referenceKey || review?.referenceKey)
  if (state === 'reference_point' && referenceKey) {
    return {
      state: 'reference_point',
      referenceKey,
      semantics: 'city_aggregate_reference',
    }
  }
  return {
    state: 'no_geometry',
    referenceKey: null,
    semantics: 'list_only',
  }
}

function reviewIndex(reviewedCityEvidence) {
  const index = new Map()
  for (const raw of reviewedCityEvidence) {
    const stableKickUserId = normalizeStableId(raw?.stableKickUserId ?? raw?.broadcaster_user_id)
    if (!stableKickUserId) continue
    const current = index.get(stableKickUserId)
    if (current) {
      index.set(stableKickUserId, { duplicate: true })
      continue
    }
    index.set(stableKickUserId, {
      stableKickUserId,
      outcome: clean(raw?.outcome),
      reason: clean(raw?.reason),
      claimKind: clean(raw?.claimKind),
      placement: raw?.placement ?? null,
      referenceGeometry: raw?.referenceGeometry ?? null,
      geometryState: clean(raw?.geometryState),
      referenceKey: clean(raw?.referenceKey),
    })
  }
  return index
}

function classifyItem(item, review) {
  if (!item.stableKickUserId) {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: 'stable_identity_unavailable',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (!review) {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: 'no_reviewed_kick_city_evidence',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (review.duplicate) {
    return publicStream(item, {
      mode: 'city',
      state: 'conflict',
      reason: 'duplicate_reviewed_city_identity',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (!REVIEW_OUTCOMES.has(review.outcome)) {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: 'invalid_reviewed_city_outcome',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (review.outcome === 'excluded_nonperson') {
    return publicStream(item, {
      mode: 'city',
      state: 'excluded',
      reason: 'reviewed_nonperson_exclusion',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (review.outcome === 'conflict_unmapped') {
    return publicStream(item, {
      mode: 'city',
      state: 'conflict',
      reason: 'reviewed_city_conflict',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (review.outcome === 'no_qualifying_evidence') {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: review.reason || 'no_qualifying_reviewed_city',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  if (!ACCEPTED_BASE_CITY_CLAIM_KINDS.has(review.claimKind)) {
    const reason = review.claimKind === 'current_location' || review.claimKind === 'temporary_location'
      ? 'current_or_temporary_not_base_city'
      : 'unsupported_base_city_claim_kind'
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason,
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  const countryCode = normalizeCountryCode(review.placement?.countryCode)
  const region = clean(review.placement?.region) || null
  const city = clean(review.placement?.city)
  if (countryCode && !city) {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: 'country_only_evidence',
      countryCode,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }
  if (!countryCode || !city) {
    return publicStream(item, {
      mode: 'city',
      state: 'unmapped',
      reason: 'invalid_reviewed_city_placement',
      countryCode: null,
      region: null,
      city: null,
      cityAggregateKey: null,
      referenceGeometry: null,
    })
  }

  const aggregateKey = cityAggregateKey({ countryCode, region, city })
  return publicStream(item, {
    mode: 'city',
    state: 'mapped',
    reason: 'reviewed_city_accepted',
    countryCode,
    region,
    city,
    cityAggregateKey: aggregateKey,
    referenceGeometry: normalizedReferenceGeometry(review),
  })
}

function buildCityAggregates(mappedStreams) {
  const aggregates = new Map()
  for (const stream of mappedStreams) {
    const key = stream.geography.cityAggregateKey
    const existing = aggregates.get(key)
    if (existing) {
      existing.streams += 1
      existing.viewers += stream.viewers
      continue
    }
    aggregates.set(key, {
      cityAggregateKey: key,
      countryCode: stream.geography.countryCode,
      region: stream.geography.region,
      city: stream.geography.city,
      streams: 1,
      viewers: stream.viewers,
      referenceGeometry: stream.geography.referenceGeometry,
    })
  }
  return [...aggregates.values()].sort((a, b) => b.viewers - a.viewers || a.cityAggregateKey.localeCompare(b.cityAggregateKey))
}

export function buildKickCityContractResponse({ snapshotItems = [], reviewedCityEvidence = [], observedAt = null } = {}) {
  const items = snapshotItems
    .map((raw, index) => ({
      index,
      slug: normalizeSlug(raw?.slug ?? raw?.channel?.slug),
      displayName: clean(raw?.displayName ?? raw?.name ?? raw?.username ?? raw?.slug ?? raw?.channel?.slug),
      viewers: normalizeViewers(raw?.viewer_count ?? raw?.viewers),
      url: clean(raw?.url),
      stableKickUserId: normalizeStableId(raw?.broadcaster_user_id),
    }))
    .filter((item) => item.slug)

  const reviewed = reviewIndex(reviewedCityEvidence)
  const rows = items.map((item) => classifyItem(item, reviewed.get(item.stableKickUserId)))
  const mappedStreams = rows.filter((row) => row.geography.state === 'mapped')
  const unmappedStreams = rows.filter((row) => row.geography.state === 'unmapped')
  const excludedStreams = rows.filter((row) => row.geography.state === 'excluded')
  const conflictStreams = rows.filter((row) => row.geography.state === 'conflict')
  const cityAggregates = buildCityAggregates(mappedStreams)

  const observedStreams = rows.length
  const observedViewers = rows.reduce((sum, row) => sum + row.viewers, 0)
  const mappedViewers = mappedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const unmappedViewers = unmappedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const excludedViewers = excludedStreams.reduce((sum, row) => sum + row.viewers, 0)
  const conflictViewers = conflictStreams.reduce((sum, row) => sum + row.viewers, 0)
  const reconciledPopulation = mappedStreams.length + unmappedStreams.length + excludedStreams.length + conflictStreams.length

  return {
    version: 'viewloom-kick-stream-map-city-contract-v0.1',
    provider: 'kick',
    geographyMode: 'city',
    observedAt: clean(observedAt) || null,
    publicActivationAuthorized: false,
    cityAggregates,
    mappedStreams,
    unmappedStreams,
    excludedStreams,
    conflictStreams,
    coverage: {
      observedStreams,
      observedViewers,
      mappedStreams: mappedStreams.length,
      mappedViewers,
      unmappedStreams: unmappedStreams.length,
      unmappedViewers,
      excludedStreams: excludedStreams.length,
      excludedViewers,
      conflictStreams: conflictStreams.length,
      conflictViewers,
      mappedCityAggregateCount: cityAggregates.length,
      referenceGeometryAggregates: cityAggregates.filter((row) => row.referenceGeometry?.state === 'reference_point').length,
      listOnlyAggregates: cityAggregates.filter((row) => row.referenceGeometry?.state === 'no_geometry').length,
      streamCoverage: observedStreams ? Number((mappedStreams.length / observedStreams).toFixed(6)) : 0,
      viewerCoverage: observedViewers ? Number((mappedViewers / observedViewers).toFixed(6)) : 0,
      reconciliation: {
        selectedPopulation: observedStreams,
        reconciledPopulation,
        passes: reconciledPopulation === observedStreams,
      },
    },
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      stableIdentityPublished: false,
      slugIsStableIdentity: false,
      acceptedBaseCityClaimKinds: ['home_base', 'declared_location'],
      twitchEvidenceReuseAllowed: false,
      providerAggregationAllowed: false,
      automaticGeographyPromotionAllowed: false,
      countryInferenceToCityAllowed: false,
      currentLocationUsedForBaseCity: false,
      temporaryLocationUsedForBaseCity: false,
      preciseAddressPublished: false,
      creatorCoordinatesPublished: false,
      reviewedAggregateReferenceOnly: true,
      noGeometryListOnly: true,
    },
  }
}
