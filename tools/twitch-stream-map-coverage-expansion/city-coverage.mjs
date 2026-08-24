const NON_PERSON_ENTITY_KINDS = new Set(['organization', 'event_broadcast'])
const BASE_CLAIMS = new Set(['home_base', 'declared_location'])
const PRECISE_LOCATION_KEYS = new Set([
  'address',
  'street',
  'streetaddress',
  'postalcode',
  'zipcode',
  'coordinates',
  'coordinate',
  'latitude',
  'longitude',
  'lat',
  'lng',
  'lon',
])

export function measureCityCoverage({ populationArtifact, reviewedRecords }) {
  const identities = normalizePopulation(populationArtifact)
  const capturedAt = text(populationArtifact?.observedAt) || text(populationArtifact?.capturedAt)
  if (!capturedAt || !Number.isFinite(Date.parse(capturedAt))) throw new Error('invalid_population_observed_at')

  const reviewed = Array.isArray(reviewedRecords) ? reviewedRecords : []
  const reviewedByLogin = new Map()
  for (const record of reviewed) {
    const login = normalizeLogin(record?.streamerLogin)
    if (!login) continue
    if (reviewedByLogin.has(login)) throw new Error(`duplicate_reviewed_login:${login}`)
    reviewedByLogin.set(login, record)
  }

  const preciseKeys = new Set()
  for (const record of reviewed) collectPreciseKeys(record, preciseKeys)

  const cityPlaceable = []
  const countryOnly = []
  const eligibleUnmappedPersons = []
  const excludedNonPerson = []
  const baseCityConflicts = []

  for (const identity of identities) {
    const record = reviewedByLogin.get(identity.login)
    const entityKind = text(record?.entityKind) || 'unreviewed'

    if (NON_PERSON_ENTITY_KINDS.has(entityKind)) {
      excludedNonPerson.push({ ...identity, entityKind, reason: 'confirmed_non_person' })
      continue
    }

    if (!record || entityKind !== 'person') {
      eligibleUnmappedPersons.push({
        ...identity,
        entityKind,
        reason: record ? 'entity_kind_unresolved' : 'no_reviewed_record',
      })
      continue
    }

    const acceptedBase = (Array.isArray(record.evidences) ? record.evidences : [])
      .filter((row) => text(row?.status) === 'accepted' && BASE_CLAIMS.has(text(row?.claimKind)))

    const countries = unique(acceptedBase.map((row) => upper(row?.countryCode)).filter(Boolean))
    const cityRows = acceptedBase.filter((row) => text(row?.city))
    const cityKeys = unique(cityRows.map(cityKey).filter(Boolean))

    if (countries.length > 1 || cityKeys.length > 1) {
      const conflict = {
        ...identity,
        reason: 'base_placement_conflict',
        countryCodes: countries,
        cities: cityKeys,
      }
      baseCityConflicts.push(conflict)
      eligibleUnmappedPersons.push(conflict)
      continue
    }

    if (cityRows.length > 0) {
      const row = selectLatest(cityRows)
      cityPlaceable.push({
        ...identity,
        countryCode: upper(row.countryCode) || null,
        countryName: text(row.countryName) || null,
        region: text(row.region) || null,
        city: text(row.city),
        claimKind: text(row.claimKind),
        source: text(row.source) || null,
        evidenceObservedAt: text(row.observedAt) || null,
      })
      continue
    }

    const countryRows = acceptedBase.filter((row) => upper(row?.countryCode))
    if (countryRows.length > 0) {
      const row = selectLatest(countryRows)
      countryOnly.push({
        ...identity,
        countryCode: upper(row.countryCode),
        countryName: text(row.countryName) || null,
        claimKind: text(row.claimKind),
        source: text(row.source) || null,
        evidenceObservedAt: text(row.observedAt) || null,
      })
      continue
    }

    eligibleUnmappedPersons.push({ ...identity, entityKind, reason: 'eligible_unmapped_person' })
  }

  const populationSize = identities.length
  const totalViewers = sumViewers(identities)
  const cityPlaceableViewers = sumViewers(cityPlaceable)
  const countryOnlyViewers = sumViewers(countryOnly)
  const countryPlaceableStreams = cityPlaceable.length + countryOnly.length
  const countryPlaceableViewers = cityPlaceableViewers + countryOnlyViewers
  const personEligiblePopulation = populationSize - excludedNonPerson.length

  const reconciliationCount = cityPlaceable.length + countryOnly.length + eligibleUnmappedPersons.length + excludedNonPerson.length
  const reconciliationPasses = reconciliationCount === populationSize

  const decisionCriteria = {
    minimumLiveCityPlaceableStreams: 1,
    requireZeroBaseCityConflicts: true,
    requireNoPreciseLocationKeys: true,
    requireExactPopulationReconciliation: true,
  }
  const cityApiGo =
    cityPlaceable.length >= decisionCriteria.minimumLiveCityPlaceableStreams &&
    baseCityConflicts.length === 0 &&
    preciseKeys.size === 0 &&
    reconciliationPasses

  return {
    schemaVersion: 'viewloom-stream-map-city-live-coverage-v0.1',
    source: {
      population: text(populationArtifact?.schemaVersion) || 'unknown',
      reviewedEvidence: 'TWITCH_REVIEWED_LOCATION_RECORDS',
    },
    capturedAt,
    populationSize,
    totalViewers,
    personEligiblePopulation,
    cityPlaceableStreams: cityPlaceable.length,
    cityPlaceableViewers,
    cityStreamCoveragePct: percent(cityPlaceable.length, populationSize),
    cityViewerCoveragePct: percent(cityPlaceableViewers, totalViewers),
    countryPlaceableStreams,
    countryPlaceableViewers,
    countryStreamCoveragePct: percent(countryPlaceableStreams, populationSize),
    countryViewerCoveragePct: percent(countryPlaceableViewers, totalViewers),
    cityPlaceableByCity: aggregateCities(cityPlaceable),
    eligibleUnmappedPersons,
    baseCityConflicts,
    excludedNonPerson,
    countryOnly,
    reconciliation: {
      cityPlaceable: cityPlaceable.length,
      countryOnly: countryOnly.length,
      eligibleUnmapped: eligibleUnmappedPersons.length,
      excludedNonPerson: excludedNonPerson.length,
      selectedPopulation: populationSize,
      reconciledPopulation: reconciliationCount,
      passes: reconciliationPasses,
    },
    privacy: {
      preciseLocationKeysFound: [...preciseKeys].sort(),
      addressOrPreciseCoordinatePublicationAllowed: false,
      passesStaticKeyCheck: preciseKeys.size === 0,
    },
    decision: {
      criteria: decisionCriteria,
      recommendation: cityApiGo ? 'go_city_api_contract' : 'no_go_city_api_contract',
      publicCityFieldsActivated: false,
      currentLocationActivated: false,
    },
  }
}

function normalizePopulation(artifact) {
  const identities = Array.isArray(artifact?.identities) ? artifact.identities : []
  if (identities.length === 0) throw new Error('empty_population')

  const ids = new Set()
  const logins = new Set()
  return identities.map((row, index) => {
    const twitchUserId = text(row?.twitchUserId)
    const login = normalizeLogin(row?.login)
    const rank = Number(row?.rank)
    const viewers = Number(row?.viewers)
    if (!twitchUserId) throw new Error(`missing_twitch_user_id:${index}`)
    if (!login) throw new Error(`missing_login:${index}`)
    if (!Number.isInteger(rank) || rank < 1) throw new Error(`invalid_rank:${login}`)
    if (!Number.isFinite(viewers) || viewers < 0) throw new Error(`invalid_viewers:${login}`)
    if (ids.has(twitchUserId)) throw new Error(`duplicate_twitch_user_id:${twitchUserId}`)
    if (logins.has(login)) throw new Error(`duplicate_login:${login}`)
    ids.add(twitchUserId)
    logins.add(login)
    return {
      rank,
      twitchUserId,
      login,
      displayName: text(row?.displayName) || login,
      viewers,
    }
  }).sort((a, b) => a.rank - b.rank)
}

function aggregateCities(rows) {
  const groups = new Map()
  for (const row of rows) {
    const key = cityKey(row)
    const current = groups.get(key) ?? {
      countryCode: row.countryCode,
      region: row.region,
      city: row.city,
      streams: 0,
      viewers: 0,
    }
    current.streams += 1
    current.viewers += row.viewers
    groups.set(key, current)
  }
  return [...groups.values()].sort((a, b) =>
    b.viewers - a.viewers ||
    b.streams - a.streams ||
    String(a.countryCode ?? '').localeCompare(String(b.countryCode ?? '')) ||
    String(a.region ?? '').localeCompare(String(b.region ?? '')) ||
    String(a.city ?? '').localeCompare(String(b.city ?? ''))
  )
}

function cityKey(row) {
  const city = text(row?.city)
  if (!city) return ''
  return [upper(row?.countryCode), text(row?.region), city].join('|')
}

function selectLatest(rows) {
  return [...rows].sort((a, b) => {
    const left = Date.parse(text(a?.observedAt))
    const right = Date.parse(text(b?.observedAt))
    return (Number.isFinite(right) ? right : -Infinity) - (Number.isFinite(left) ? left : -Infinity)
  })[0]
}

function collectPreciseKeys(value, found) {
  if (Array.isArray(value)) {
    for (const item of value) collectPreciseKeys(item, found)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '')
    if (PRECISE_LOCATION_KEYS.has(normalizedKey)) found.add(key)
    collectPreciseKeys(child, found)
  }
}

function sumViewers(rows) {
  return rows.reduce((sum, row) => sum + Number(row.viewers || 0), 0)
}

function percent(value, total) {
  if (!total) return 0
  return Number(((value / total) * 100).toFixed(3))
}

function unique(values) {
  return [...new Set(values)]
}

function normalizeLogin(value) {
  return text(value).toLowerCase()
}

function upper(value) {
  return text(value).toUpperCase()
}

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}
