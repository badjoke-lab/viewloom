function object(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function rows(value) {
  return Array.isArray(value) ? value : []
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function integer(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function countryCode(value) {
  const code = text(value).toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function coordinate(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null
}

function referenceGeometry(value) {
  const source = object(value)
  const state = text(source.state)
  if (state === 'no_geometry') {
    return {
      state: 'no_geometry',
      referenceKey: null,
      semantics: 'list_only',
      referencePoint: null,
    }
  }

  if (state !== 'reference_point') {
    return {
      state: 'no_geometry',
      referenceKey: null,
      semantics: 'list_only',
      referencePoint: null,
    }
  }

  const point = object(source.referencePoint)
  const longitude = coordinate(point.longitude, -180, 180)
  const latitude = coordinate(point.latitude, -90, 90)
  const referenceKey = text(source.referenceKey)
  if (longitude === null || latitude === null || !referenceKey) {
    return {
      state: 'no_geometry',
      referenceKey: null,
      semantics: 'list_only',
      referencePoint: null,
    }
  }

  return {
    state: 'reference_point',
    referenceKey,
    semantics: 'city_aggregate_reference',
    referencePoint: { longitude, latitude },
  }
}

/**
 * KC4 preview-only City visualization model.
 *
 * Public City activation is deliberately NOT required here because the owning
 * route is the non-public preview surface. Stable-identity readiness and every
 * City safety semantic still fail closed. Creator coordinates are never
 * accepted; only reviewed City aggregate reference points may enter the map.
 */
export function buildKickCityPreviewModel(response, { allowGeography = true } = {}) {
  const source = object(response)
  const provider = text(source.provider).toLowerCase()
  const geographyMode = text(source.geographyMode).toLowerCase()
  if (provider !== 'kick') throw new Error('Kick City preview requires provider=kick')
  if (geographyMode !== 'city') throw new Error('Kick City preview requires geographyMode=city')

  const coverage = object(source.coverage)
  const reconciliation = object(coverage.reconciliation)
  const identity = object(source.identity)
  const activation = object(source.activation)
  const semantics = object(source.semantics)

  const contractSafe = identity.stableKey === 'broadcaster_user_id'
    && identity.slugIsStableIdentity !== true
    && semantics.stableIdentityPublished !== true
    && semantics.twitchEvidenceReuseAllowed !== true
    && semantics.twitchCreatorKeyReuseAllowed !== true
    && semantics.providerAggregationAllowed !== true
    && semantics.automaticGeographyPromotionAllowed !== true
    && semantics.countryInferenceToCityAllowed !== true
    && semantics.currentLocationUsedForBaseCity !== true
    && semantics.temporaryLocationUsedForBaseCity !== true
    && semantics.currentLocationPromotionAllowed !== true
    && semantics.preciseAddressAllowed !== true
    && semantics.preciseCoordinatesAllowed !== true
    && semantics.creatorCoordinatesAllowed !== true
    && semantics.reviewedAggregateReferenceOnly === true
    && semantics.noGeometryListOnly === true

  const runtimeReady = activation.publicCityActivationReady === true
  const previewAllowed = Boolean(allowGeography && contractSafe && runtimeReady)
  const aggregates = previewAllowed ? rows(source.cityAggregates) : []
  const mapped = previewAllowed ? rows(source.mappedStreams) : []
  const cityRows = []
  const aggregateKeys = new Set()

  for (const raw of aggregates) {
    const aggregate = object(raw)
    const key = text(aggregate.cityAggregateKey)
    const code = countryCode(aggregate.countryCode)
    const city = text(aggregate.city)
    if (!key || !code || !city || aggregateKeys.has(key)) continue
    aggregateKeys.add(key)
    cityRows.push({
      cityAggregateKey: key,
      countryCode: code,
      region: text(aggregate.region) || null,
      city,
      streams: integer(aggregate.streams),
      viewers: integer(aggregate.viewers),
      referenceGeometry: referenceGeometry(aggregate.referenceGeometry),
    })
  }

  cityRows.sort((a, b) => b.viewers - a.viewers || b.streams - a.streams || a.cityAggregateKey.localeCompare(b.cityAggregateKey))

  const mappedStreams = []
  for (const raw of mapped) {
    const stream = object(raw)
    const geography = object(stream.geography)
    const key = text(geography.cityAggregateKey)
    const code = countryCode(geography.countryCode)
    const city = text(geography.city)
    if (text(geography.state) !== 'mapped' || !key || !code || !city || !aggregateKeys.has(key)) continue
    mappedStreams.push({
      slug: text(stream.slug).toLowerCase(),
      displayName: text(stream.displayName) || text(stream.slug),
      viewers: integer(stream.viewers),
      url: text(stream.url),
      cityAggregateKey: key,
      countryCode: code,
      region: text(geography.region) || null,
      city,
    })
  }

  const referenceRows = cityRows.filter((row) => row.referenceGeometry.state === 'reference_point')
  const listOnlyRows = cityRows.filter((row) => row.referenceGeometry.state === 'no_geometry')

  return {
    provider: 'kick',
    geographyMode: 'city',
    publicCityActivationAuthorized: source.publicCityActivationAuthorized === true,
    allowGeography: Boolean(allowGeography),
    contractSafe,
    runtimeReady,
    previewAllowed,
    cityRows,
    referenceRows,
    listOnlyRows,
    mappedStreams,
    accounting: {
      observedStreams: integer(coverage.observedStreams),
      stableIdentityStreams: integer(coverage.stableIdentityStreams),
      mappedStreams: previewAllowed ? mappedStreams.length : 0,
      unmappedStreams: integer(coverage.unmappedStreams),
      excludedStreams: integer(coverage.excludedStreams),
      conflictStreams: integer(coverage.conflictStreams),
      mappedCityAggregateCount: previewAllowed ? cityRows.length : 0,
      referenceGeometryAggregates: previewAllowed ? referenceRows.length : 0,
      listOnlyAggregates: previewAllowed ? listOnlyRows.length : 0,
      reconciliationPasses: reconciliation.passes === true,
    },
    blockers: rows(activation.blockers).map((value) => text(value)).filter(Boolean),
    semantics: {
      stableIdentity: 'broadcaster_user_id',
      creatorCoordinatesUsed: false,
      twitchEvidenceReused: false,
      countryInferredToCity: false,
      currentLocationPromoted: false,
      aggregateReferenceOnly: true,
    },
  }
}
