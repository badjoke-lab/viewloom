export const KICK_STREAM_MAP_CITY_REFERENCE_POINTS_VERSION = 'viewloom-kick-city-reference-points-v0.1'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalized(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function keyFromParts({ countryCode, region, city }) {
  return `${text(countryCode).toUpperCase()}|${normalized(region) || '__none__'}|${normalized(city)}`
}

const POINTS = Object.freeze([
  Object.freeze({ countryCode: 'TR', region: null, city: 'İstanbul', latitude: 41.0082, longitude: 28.9784 }),
  Object.freeze({ countryCode: 'PL', region: null, city: 'Wrocław', latitude: 51.1079, longitude: 17.0385 }),
  Object.freeze({ countryCode: 'BR', region: null, city: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729 }),
  Object.freeze({ countryCode: 'IN', region: 'Punjab', city: 'Fazilka', latitude: 30.403648, longitude: 74.027962 }),
  Object.freeze({ countryCode: 'IN', region: null, city: 'Mumbai', latitude: 19.076, longitude: 72.8777 }),
  // Natural Earth v5.1.2 ne_10m_populated_places_simple: ne_id 1159151621.
  // This is a City aggregate reference point, never a creator coordinate.
  Object.freeze({ countryCode: 'BR', region: null, city: 'São Paulo', latitude: -23.556734, longitude: -46.626966 }),
])

const POINT_BY_KEY = new Map(POINTS.map((point) => [keyFromParts(point), point]))

export function kickCityReferenceGeometry(placement) {
  const key = keyFromParts(placement ?? {})
  const point = POINT_BY_KEY.get(key)

  if (!point) {
    return {
      state: 'no_geometry',
      referenceKey: null,
      semantics: 'list_only',
    }
  }

  return {
    state: 'reference_point',
    referenceKey: key,
    semantics: 'city_aggregate_reference',
    referencePoint: {
      latitude: point.latitude,
      longitude: point.longitude,
    },
  }
}

export function applyKickCityReferencePoints(runtime) {
  const source = runtime && typeof runtime === 'object' ? runtime : {}
  const rawAggregates = Array.isArray(source.cityAggregates) ? source.cityAggregates : []

  // Reference geometry belongs to the City aggregate only. Never duplicate a
  // reference point into a creator/stream row, where latitude/longitude could
  // be misread as creator precision even though the point is aggregate-only.
  const cityAggregates = rawAggregates.map((aggregate) => ({
    ...aggregate,
    referenceGeometry: kickCityReferenceGeometry(aggregate),
  }))

  const referenceGeometryAggregates = cityAggregates.filter(
    (aggregate) => aggregate.referenceGeometry?.state === 'reference_point',
  ).length

  return {
    ...source,
    coverage: {
      ...(source.coverage ?? {}),
      referenceGeometryAggregates,
      listOnlyAggregates: Math.max(0, cityAggregates.length - referenceGeometryAggregates),
    },
    cityAggregates,
  }
}
