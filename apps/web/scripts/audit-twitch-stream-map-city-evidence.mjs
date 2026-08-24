import { TWITCH_REVIEWED_LOCATION_RECORDS } from '../functions/api/twitch-stream-map-reviewed-evidence.mjs'

const BASE_CLAIMS = new Set(['home_base', 'declared_location'])
const CURRENT_CLAIMS = new Set(['current_location', 'temporary_location'])
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

const normalized = []
const preciseKeys = new Set()

for (const record of TWITCH_REVIEWED_LOCATION_RECORDS) {
  collectPreciseKeys(record, preciseKeys)
  for (const evidence of Array.isArray(record.evidences) ? record.evidences : []) {
    const row = {
      streamerLogin: text(record.streamerLogin),
      entityKind: text(record.entityKind),
      source: text(evidence.source),
      observedAt: text(evidence.observedAt),
      countryCode: text(evidence.countryCode) || null,
      countryName: text(evidence.countryName) || null,
      region: text(evidence.region) || null,
      city: text(evidence.city) || null,
      claimKind: text(evidence.claimKind),
      confidence: text(evidence.confidence),
      status: text(evidence.status),
    }
    normalized.push(row)
  }
}

const accepted = normalized.filter((row) => row.status === 'accepted')
const acceptedPersons = accepted.filter((row) => row.entityKind === 'person')
const cityBearingAccepted = acceptedPersons.filter((row) => row.city)
const regionOrCityBearingAccepted = acceptedPersons.filter((row) => row.city || row.region)
const baseEligibleAccepted = acceptedPersons.filter((row) => BASE_CLAIMS.has(row.claimKind))
const baseEligibleCity = baseEligibleAccepted.filter((row) => row.city)
const currentOnlyCity = acceptedPersons.filter((row) => CURRENT_CLAIMS.has(row.claimKind) && row.city)
const contextOnly = normalized.filter((row) => row.status === 'context_only')
const contextOnlyRegionOrCity = contextOnly.filter((row) => row.city || row.region)

const conflicts = []
for (const login of [...new Set(baseEligibleAccepted.map((row) => row.streamerLogin))].sort()) {
  const rows = baseEligibleAccepted.filter((row) => row.streamerLogin === login)
  const places = [...new Set(rows.map((row) => [row.countryCode ?? '', row.region ?? '', row.city ?? ''].join('|')))]
  if (places.length > 1) {
    conflicts.push({ streamerLogin: login, places })
  }
}

const uniqueCities = [...new Set(baseEligibleCity.map((row) => cityKey(row)).filter(Boolean))].sort()
const baseEligibleCityPersons = [...new Set(baseEligibleCity.map((row) => row.streamerLogin))].sort()

const output = {
  schemaVersion: 'viewloom-stream-map-city-evidence-audit-v0.1',
  source: 'TWITCH_REVIEWED_LOCATION_RECORDS',
  generatedAt: new Date().toISOString(),
  counts: {
    reviewedEntities: TWITCH_REVIEWED_LOCATION_RECORDS.length,
    evidenceRows: normalized.length,
    acceptedEvidenceRows: accepted.length,
    acceptedPersonEvidenceRows: acceptedPersons.length,
    acceptedPersonRowsWithCity: cityBearingAccepted.length,
    acceptedPersonRowsWithRegionOrCity: regionOrCityBearingAccepted.length,
    baseEligibleAcceptedRows: baseEligibleAccepted.length,
    baseEligibleCityRows: baseEligibleCity.length,
    baseEligibleCityPersons: baseEligibleCityPersons.length,
    uniqueBaseEligibleCities: uniqueCities.length,
    currentOrTemporaryCityRows: currentOnlyCity.length,
    contextOnlyEvidenceRows: contextOnly.length,
    contextOnlyRowsWithRegionOrCity: contextOnlyRegionOrCity.length,
    basePlacementConflicts: conflicts.length,
  },
  claimSemantics: {
    baseEligible: [...BASE_CLAIMS],
    currentOnly: [...CURRENT_CLAIMS],
    contextOnlyDoesNotPlace: true,
  },
  baseEligibleCities: uniqueCities,
  baseEligibleCityPersons,
  cityRows: baseEligibleCity
    .map((row) => ({
      streamerLogin: row.streamerLogin,
      countryCode: row.countryCode,
      countryName: row.countryName,
      region: row.region,
      city: row.city,
      claimKind: row.claimKind,
      source: row.source,
      observedAt: row.observedAt,
    }))
    .sort((a, b) => a.streamerLogin.localeCompare(b.streamerLogin)),
  contextOnlyRows: contextOnlyRegionOrCity
    .map((row) => ({
      streamerLogin: row.streamerLogin,
      countryCode: row.countryCode,
      region: row.region,
      city: row.city,
      claimKind: row.claimKind,
      status: row.status,
    }))
    .sort((a, b) => a.streamerLogin.localeCompare(b.streamerLogin)),
  conflicts,
  privacy: {
    preciseLocationKeysFound: [...preciseKeys].sort(),
    publicAddressOrCoordinatePublicationAllowed: false,
    passesStaticKeyCheck: preciseKeys.size === 0,
  },
}

if (conflicts.length > 0) {
  console.error(JSON.stringify(output, null, 2))
  throw new Error(`city evidence audit found ${conflicts.length} base-placement conflict(s)`)
}

if (preciseKeys.size > 0) {
  console.error(JSON.stringify(output, null, 2))
  throw new Error(`city evidence audit found precise-location key(s): ${[...preciseKeys].join(', ')}`)
}

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)

function cityKey(row) {
  const city = text(row.city)
  if (!city) return ''
  return [text(row.countryCode), text(row.region), city].filter(Boolean).join(' / ')
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

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}
