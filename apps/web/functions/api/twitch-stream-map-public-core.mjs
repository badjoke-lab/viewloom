const BASE_CITY_CLAIMS = new Set(['home_base', 'declared_location'])

export function projectTwitchStreamMapCountryOnly(model) {
  if (!model || typeof model !== 'object') return model
  return {
    ...model,
    mappedStreams: (Array.isArray(model.mappedStreams) ? model.mappedStreams : []).map(projectCountryRow),
    excludedNonPersonStreams: (Array.isArray(model.excludedNonPersonStreams) ? model.excludedNonPersonStreams : []).map(stripStableIdentity),
  }
}

export function projectTwitchStreamMapCityContract(model) {
  if (!model || typeof model !== 'object') return model

  const cityPlaceable = []
  const countryOnly = []
  const baseCityConflicts = []
  let cityPlaceableViewers = 0
  let countryOnlyViewers = 0

  for (const row of Array.isArray(model.mappedStreams) ? model.mappedStreams : []) {
    const baseEvidence = (Array.isArray(row.evidence) ? row.evidence : [])
      .filter((evidence) => BASE_CITY_CLAIMS.has(String(evidence?.locationType ?? '')))
      .filter((evidence) => Boolean(String(evidence?.countryCode ?? '').trim()))

    if (!baseEvidence.length) continue

    const countries = unique(baseEvidence.map((evidence) => String(evidence.countryCode ?? '').trim().toUpperCase()))
    if (countries.length !== 1) {
      baseCityConflicts.push(conflictSummary(row, 'base_country_conflict', baseEvidence))
      continue
    }

    const countryCode = countries[0]
    const sameCountry = baseEvidence.filter((evidence) => String(evidence.countryCode ?? '').trim().toUpperCase() === countryCode)
    const placeKeys = unique(sameCountry
      .filter((evidence) => Boolean(String(evidence.city ?? '').trim()))
      .map((evidence) => [countryCode, clean(evidence.region), clean(evidence.city)].join('|')))

    if (placeKeys.length > 1) {
      baseCityConflicts.push(conflictSummary(row, 'base_city_conflict', sameCountry))
      continue
    }

    const projectedEvidence = sameCountry.map(projectCityEvidence)
    const sources = unique(projectedEvidence.map((evidence) => evidence.source))
    const locationTypes = unique(projectedEvidence.map((evidence) => evidence.locationType))
    const countryName = projectedEvidence.map((evidence) => evidence.countryName).find(Boolean) || countryCode

    if (placeKeys.length === 0) {
      countryOnly.push({
        ...projectIdentity(row),
        location: {
          countryCode,
          countryName,
          regions: unique(projectedEvidence.map((evidence) => evidence.region)),
          cities: [],
          locationTypes,
        },
        evidence: projectedEvidence,
        sources,
        cityState: 'country_only',
      })
      countryOnlyViewers += Number(row.viewers ?? 0)
      continue
    }

    cityPlaceable.push({
      ...projectIdentity(row),
      location: {
        countryCode,
        countryName,
        regions: unique(projectedEvidence.map((evidence) => evidence.region)),
        cities: unique(projectedEvidence.map((evidence) => evidence.city)),
        locationTypes,
      },
      evidence: projectedEvidence,
      sources,
      cityState: 'mapped',
    })
    cityPlaceableViewers += Number(row.viewers ?? 0)
  }

  const observedStreams = Number(model.coverage?.observedStreams ?? 0)
  const observedViewers = Number(model.coverage?.observedViewers ?? 0)
  const stableIdentityStreams = Number(model.coverage?.stableIdentityStreams ?? 0)
  const missingStableIdentityStreams = Number(model.coverage?.missingStableIdentityStreams ?? Math.max(0, Number(model.coverage?.payloadStreams ?? 0) - stableIdentityStreams))
  const excludedNonPersonStreams = Number(model.coverage?.excludedNonPersonStreams ?? 0)
  const excludedNonPersonViewers = Number(model.coverage?.excludedNonPersonViewers ?? 0)
  const cityMappedStreams = cityPlaceable.length
  const countryOnlyStreams = countryOnly.length
  const eligibleUnmappedStreams = Math.max(0, observedStreams - cityMappedStreams - countryOnlyStreams - excludedNonPersonStreams)
  const eligibleUnmappedViewers = Math.max(0, observedViewers - cityPlaceableViewers - countryOnlyViewers - excludedNonPersonViewers)
  const upstreamCountryConflictCount = Number(model.coverage?.unmappedReasons?.conflicting_accepted_evidence ?? 0)
  const conflictUnmappedStreams = baseCityConflicts.length + upstreamCountryConflictCount
  const stableTwitchUserIdState = stableIdentityStreams <= 0
    ? 'unavailable'
    : missingStableIdentityStreams > 0 ? 'partial' : 'available'

  return {
    ...model,
    version: 'viewloom-stream-map-city-contract-v0.1',
    geographyMode: 'city',
    publicCityUiActivated: true,
    currentLocationActivated: false,
    identityContract: {
      joinKey: 'login',
      stableTwitchUserIdAvailableInMinuteSnapshot: stableIdentityStreams > 0,
      stableTwitchUserIdState,
      stableIdentityStreams,
      missingStableIdentityStreams,
      loginIsStableIdentity: false,
    },
    mappedStreams: cityPlaceable,
    countryOnlyStreams: countryOnly,
    baseCityConflicts,
    cityCoverage: {
      observedStreams,
      observedViewers,
      cityPlaceableStreams: cityMappedStreams,
      cityPlaceableViewers,
      countryOnlyStreams,
      countryOnlyViewers,
      eligibleUnmappedStreams,
      eligibleUnmappedViewers,
      excludedNonPersonStreams,
      excludedNonPersonViewers,
      conflictUnmappedStreams,
      upstreamCountryConflictCount,
      cityStreamCoverage: ratio(cityMappedStreams, observedStreams),
      cityViewerCoverage: ratio(cityPlaceableViewers, observedViewers),
      reconciliation: {
        selectedPopulation: observedStreams,
        reconciledPopulation: cityMappedStreams + countryOnlyStreams + eligibleUnmappedStreams + excludedNonPersonStreams,
        passes: cityMappedStreams + countryOnlyStreams + eligibleUnmappedStreams + excludedNonPersonStreams === observedStreams,
      },
    },
    semantics: {
      ...model.semantics,
      geographyMode: 'city',
      baseCityClaimKinds: ['home_base', 'declared_location'],
      currentLocationUsedForBaseCityPlacement: false,
      birthplaceUsedForBaseCityPlacement: false,
      eventVenueUsedForBaseCityPlacement: false,
      preciseAddressPublished: false,
      coordinatesPublished: false,
      baseCityConflictsAreMapped: false,
      loginIsStableIdentity: false,
    },
  }
}

function projectCountryRow(row) {
  const publicRow = stripStableIdentity(row)
  return {
    ...publicRow,
    location: {
      ...publicRow.location,
      regions: [],
      cities: [],
    },
    evidence: (Array.isArray(publicRow.evidence) ? publicRow.evidence : []).map((evidence) => ({
      ...evidence,
      region: null,
      city: null,
    })),
  }
}

function stripStableIdentity(row) {
  if (!row || typeof row !== 'object') return row
  const { twitchUserId: _twitchUserId, ...rest } = row
  return rest
}

function projectIdentity(row) {
  const twitchUserId = nullable(row?.twitchUserId)
  return {
    login: String(row.login ?? ''),
    displayName: String(row.displayName ?? ''),
    viewers: Number(row.viewers ?? 0),
    url: String(row.url ?? ''),
    entityKind: String(row.entityKind ?? 'person'),
    identity: {
      provider: 'twitch',
      login: String(row.login ?? ''),
      twitchUserId,
      stableIdAvailable: Boolean(twitchUserId),
    },
  }
}

function projectCityEvidence(evidence) {
  return {
    source: String(evidence?.source ?? ''),
    sourceUrl: nullable(evidence?.sourceUrl),
    observedAt: String(evidence?.observedAt ?? ''),
    countryCode: String(evidence?.countryCode ?? '').trim().toUpperCase(),
    countryName: nullable(evidence?.countryName),
    region: nullable(evidence?.region),
    city: nullable(evidence?.city),
    locationType: String(evidence?.locationType ?? ''),
    confidence: String(evidence?.confidence ?? ''),
  }
}

function conflictSummary(row, reason, evidence) {
  return {
    login: String(row.login ?? ''),
    displayName: String(row.displayName ?? ''),
    viewers: Number(row.viewers ?? 0),
    reason,
    evidence: evidence.map(projectCityEvidence),
  }
}

function unique(values) {
  return [...new Set(values.map((value) => clean(value)).filter(Boolean))]
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function nullable(value) {
  const text = clean(value)
  return text || null
}

function ratio(numerator, denominator) {
  if (!denominator) return 0
  return Number((numerator / denominator).toFixed(6))
}
