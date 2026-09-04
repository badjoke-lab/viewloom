export type CityCentroidRecord = {
  countryCode: string
  city: string
  region?: string | null
  longitude: number
  latitude: number
  aliases?: string[]
  sourceId?: string | number | null
}

export type CityCentroidQuery = {
  countryCode?: string | null
  city?: string | null
  region?: string | null
}

export type CityCentroidResolution =
  | { state: 'resolved'; record: CityCentroidRecord; match: 'city+country' | 'city+region+country' }
  | { state: 'unresolved'; reason: 'missing-country' | 'missing-city' | 'not-found' | 'ambiguous' }

export function resolveCityCentroid(
  records: CityCentroidRecord[],
  query: CityCentroidQuery,
): CityCentroidResolution {
  const countryCode = normalizeCountryCode(query.countryCode)
  if (!countryCode) return { state: 'unresolved', reason: 'missing-country' }

  const city = normalizePlace(query.city)
  if (!city) return { state: 'unresolved', reason: 'missing-city' }

  const candidates = records.filter((record) => {
    if (normalizeCountryCode(record.countryCode) !== countryCode) return false
    return cityNames(record).some((name) => normalizePlace(name) === city)
  })

  if (candidates.length === 0) return { state: 'unresolved', reason: 'not-found' }
  if (candidates.length === 1) {
    return { state: 'resolved', record: candidates[0], match: 'city+country' }
  }

  const region = normalizePlace(query.region)
  if (!region) return { state: 'unresolved', reason: 'ambiguous' }

  const regional = candidates.filter((record) => normalizePlace(record.region) === region)
  if (regional.length !== 1) return { state: 'unresolved', reason: 'ambiguous' }

  return { state: 'resolved', record: regional[0], match: 'city+region+country' }
}

function cityNames(record: CityCentroidRecord): string[] {
  return [record.city, ...(Array.isArray(record.aliases) ? record.aliases : [])].filter(Boolean)
}

function normalizeCountryCode(value: unknown): string {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function normalizePlace(value: unknown): string {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US')
    : ''
}
