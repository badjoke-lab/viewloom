const NATURAL_EARTH_NO_MATCH_REASON = 'natural_earth_v5_1_2_no_matching_reference_feature'

const NATURAL_EARTH_POPULATED_PLACES = Object.freeze({
  provider: 'Natural Earth',
  dataset: 'ne_10m_populated_places_simple',
  version: '5.1.2',
  url: 'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_populated_places_simple.geojson',
  geometrySemantics: 'populated_place_point',
})

export const KICK_REVIEWED_CITY_REFERENCE_GEOMETRY_VERSION = 'viewloom-kick-reviewed-city-reference-geometry-v0.1'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalized(value) {
  return text(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function kickCityAggregateKeyFromParts({ countryCode, region, city }) {
  return `${text(countryCode).toUpperCase()}|${normalized(region) || '__none__'}|${normalized(city)}`
}

function noGeometry(countryCode, region, city, reason) {
  return Object.freeze({
    key: kickCityAggregateKeyFromParts({ countryCode, region, city }),
    countryCode,
    region: region || null,
    city,
    geometryStatus: 'no_geometry',
    referenceRole: null,
    referencePoint: null,
    source: null,
    reason,
  })
}

function reviewedReferencePoint(countryCode, region, city, {
  longitude,
  latitude,
  featureId,
  featureName,
  sourceCountryName,
  sourceRegionName,
  featureClass,
  matchBasis,
}) {
  return Object.freeze({
    key: kickCityAggregateKeyFromParts({ countryCode, region, city }),
    countryCode,
    region: region || null,
    city,
    geometryStatus: 'reference_point',
    referenceRole: 'city_aggregate_reference',
    referencePoint: Object.freeze({ longitude, latitude }),
    source: Object.freeze({
      ...NATURAL_EARTH_POPULATED_PLACES,
      featureId,
      featureName,
      sourceCountryCode: countryCode,
      sourceCountryName,
      sourceRegionName,
      featureClass,
      countryNameMatchCount: 1,
      matchBasis,
      canonicalRegionMatch: region ? sourceRegionName === region : null,
    }),
    reason: null,
  })
}

export const KICK_REVIEWED_CITY_REFERENCE_GEOMETRY = Object.freeze([
  reviewedReferencePoint('TR', null, 'İstanbul', {
    longitude: 28.974277,
    latitude: 41.017602,
    featureId: 1159151579,
    featureName: 'Istanbul',
    sourceCountryName: 'Turkey',
    sourceRegionName: 'Istanbul',
    featureClass: 'Admin-1 capital',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('PL', null, 'Wrocław', {
    longitude: 17.030009,
    latitude: 51.110432,
    featureId: 1159139051,
    featureName: 'Wrocław',
    sourceCountryName: 'Poland',
    sourceRegionName: 'Lower Silesian',
    featureClass: 'Admin-1 capital',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('BR', null, 'Rio de Janeiro', {
    longitude: -43.212117,
    latitude: -22.907308,
    featureId: 1159151619,
    featureName: 'Rio de Janeiro',
    sourceCountryName: 'Brazil',
    sourceRegionName: 'Rio de Janeiro',
    featureClass: 'Admin-1 capital',
    matchBasis: 'country_city_unique',
  }),
  noGeometry('IN', 'Punjab', 'Fazilka', NATURAL_EARTH_NO_MATCH_REASON),
  reviewedReferencePoint('IN', null, 'Mumbai', {
    longitude: 72.875839,
    latitude: 19.068408,
    featureId: 1159151611,
    featureName: 'Mumbai',
    sourceCountryName: 'India',
    sourceRegionName: 'Maharashtra',
    featureClass: 'Admin-1 capital',
    matchBasis: 'country_city_unique',
  }),
])

export function kickReviewedCityReferenceGeometryByKey(key) {
  return KICK_REVIEWED_CITY_REFERENCE_GEOMETRY.find((entry) => entry.key === key) ?? null
}
