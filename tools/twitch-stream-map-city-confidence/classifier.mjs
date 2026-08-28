const BASE_CLAIMS = new Set(['home_base', 'declared_location'])
const CURRENT_ONLY_CLAIMS = new Set(['current_location', 'temporary_location', 'event_presence', 'travel_location'])
const NON_PERSON_ENTITY_KINDS = new Set(['organization', 'event_broadcast'])
const PRECISE_LOCATION_KEYS = new Set([
  'address', 'street', 'streetaddress', 'postalcode', 'zipcode',
  'coordinates', 'coordinate', 'latitude', 'longitude', 'lat', 'lng', 'lon', 'gps', 'gpstrace',
])

export function classifyCityEvidence(record) {
  const login = normalizeLogin(record?.streamerLogin ?? record?.login)
  const entityKind = text(record?.entityKind) || 'person'
  const preciseKeys = new Set()
  collectPreciseKeys(record, preciseKeys)

  const evidence = Array.isArray(record?.evidences) ? record.evidences : []
  const accepted = evidence.filter((row) => text(row?.status) === 'accepted')
  const base = accepted.filter((row) => BASE_CLAIMS.has(claimKind(row)))
  const currentOnly = accepted.filter((row) => CURRENT_ONLY_CLAIMS.has(claimKind(row)))
  const contextOnly = evidence.filter((row) =>
    text(row?.status) === 'context_only' ||
    (text(row?.status) === 'accepted' && !BASE_CLAIMS.has(claimKind(row)) && !CURRENT_ONLY_CLAIMS.has(claimKind(row))))

  const common = {
    provider: 'twitch',
    login: login || null,
    entityKind,
    evidenceCounts: {
      acceptedBase: base.length,
      acceptedCurrentOnly: currentOnly.length,
      acceptedContextOnly: contextOnly.length,
    },
    currentEvidenceExcludedFromBase: currentOnly.length > 0,
    preciseLocationKeysFound: [...preciseKeys].sort(),
  }

  if (NON_PERSON_ENTITY_KINDS.has(entityKind)) {
    return result(common, 'excluded_non_person', 'not_applicable', 'confirmed_non_person', false)
  }

  if (preciseKeys.size > 0) {
    return result(common, 'privacy_invalid', 'invalid', 'precise_location_key_present', false)
  }

  const countries = unique(base.map((row) => upper(row?.countryCode)).filter(Boolean))
  const cityRows = base.filter((row) => text(row?.city))
  const cityKeys = unique(cityRows.map(cityKey).filter(Boolean))

  if (countries.length > 1 || cityKeys.length > 1) {
    return {
      ...result(common, 'conflict', 'conflict', 'base_placement_conflict', false),
      countryCodes: countries,
      cityKeys,
    }
  }

  if (cityRows.length > 0) {
    const selected = selectLatest(cityRows)
    const consistencyClass = cityRows.length === 1
      ? 'single_explicit_base_city'
      : 'consistent_multiple_explicit_base_city_rows'
    return {
      ...result(common, 'mapped', consistencyClass, 'explicit_base_city', true),
      placement: {
        countryCode: upper(selected?.countryCode) || null,
        countryName: text(selected?.countryName) || null,
        region: text(selected?.region) || null,
        city: text(selected?.city) || null,
      },
      acceptedBaseCityRows: cityRows.length,
      sourceClasses: unique(cityRows.map((row) => text(row?.source)).filter(Boolean)),
      claimKinds: unique(cityRows.map((row) => claimKind(row)).filter(Boolean)),
      confidenceMeaning: 'evidence_consistency_not_probability',
    }
  }

  const countryRows = base.filter((row) => upper(row?.countryCode))
  if (countryRows.length > 0) {
    const selected = selectLatest(countryRows)
    return {
      ...result(common, 'country_only', 'country_only', 'country_only_at_city_resolution', false),
      placement: {
        countryCode: upper(selected?.countryCode),
        countryName: text(selected?.countryName) || null,
        region: null,
        city: null,
      },
    }
  }

  if (currentOnly.some((row) => text(row?.city))) {
    return result(common, 'current_only', 'current_only', 'current_location_not_base_city', false)
  }

  if (contextOnly.some((row) => text(row?.city) || upper(row?.countryCode))) {
    return result(common, 'context_only', 'context_only', 'context_evidence_not_base_city', false)
  }

  return result(common, 'unmapped', 'unmapped', 'no_explicit_base_city_evidence', false)
}

export function classifyCityEvidenceSet(records) {
  const rows = Array.isArray(records) ? records.map(classifyCityEvidence) : []
  const counts = rows.reduce((acc, row) => {
    acc[row.cityState] = (acc[row.cityState] ?? 0) + 1
    return acc
  }, {})
  return {
    schemaVersion: 'viewloom-stream-map-city-confidence-v0.1',
    provider: 'twitch',
    geographyMode: 'city',
    confidenceMeaning: 'evidence_consistency_not_probability',
    currentLocationUsedForBaseCityPlacement: false,
    countryUsedToInferCity: false,
    preciseLocationPublicationAllowed: false,
    twitchKickAggregationAllowed: false,
    rows,
    counts,
  }
}

function result(common, cityState, confidenceClass, ambiguityReason, publicPlacementEligible) {
  return {
    ...common,
    cityState,
    confidenceClass,
    ambiguityReason,
    publicPlacementEligible,
    placement: null,
  }
}

function cityKey(row) {
  const city = text(row?.city)
  if (!city) return ''
  return [upper(row?.countryCode), text(row?.region), city].join('|')
}

function selectLatest(rows) {
  return [...rows].sort((a, b) => timestamp(b?.observedAt) - timestamp(a?.observedAt))[0]
}

function timestamp(value) {
  const parsed = Date.parse(text(value))
  return Number.isFinite(parsed) ? parsed : -Infinity
}

function collectPreciseKeys(value, found) {
  if (Array.isArray(value)) {
    for (const item of value) collectPreciseKeys(item, found)
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, '')
    if (PRECISE_LOCATION_KEYS.has(normalized)) found.add(key)
    collectPreciseKeys(child, found)
  }
}

function claimKind(row) { return text(row?.claimKind ?? row?.locationType) }
function normalizeLogin(value) { return text(value).toLowerCase() }
function upper(value) { return text(value).toUpperCase() }
function text(value) { return typeof value === 'string' ? value.trim() : '' }
function unique(values) { return [...new Set(values)] }
