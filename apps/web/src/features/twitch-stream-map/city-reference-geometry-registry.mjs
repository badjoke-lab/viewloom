import { cityAggregateKeyFromParts } from './city-aggregate-core.mjs'

const NO_GEOMETRY_REASON = 'reference_geometry_not_reviewed'
const NATURAL_EARTH_NO_MATCH_REASON = 'natural_earth_v5_1_2_no_matching_reference_feature'
const NATURAL_EARTH_POPULATED_PLACES = Object.freeze({
  provider: 'Natural Earth',
  dataset: 'ne_10m_populated_places_simple',
  version: '5.1.2',
  url: 'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_populated_places_simple.geojson',
  geometrySemantics: 'populated_place_point',
})

function noGeometry(countryCode, region, city, reason = NO_GEOMETRY_REASON) {
  return Object.freeze({
    key: cityAggregateKeyFromParts({ countryCode, region, city }),
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
    key: cityAggregateKeyFromParts({ countryCode, region, city }),
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

export const TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY = Object.freeze([
  reviewedReferencePoint('DE', 'Berlin', 'Berlin', {
    longitude: 13.399603,
    latitude: 52.523764,
    featureId: 1159151529,
    featureName: 'Berlin',
    sourceCountryName: 'Germany',
    sourceRegionName: 'Berlin',
    featureClass: 'Admin-0 capital',
    matchBasis: 'country_city_region',
  }),
  reviewedReferencePoint('DE', null, 'Cologne', {
    longitude: 6.948059,
    latitude: 50.93195,
    featureId: 1159148451,
    featureName: 'Cologne',
    sourceCountryName: 'Germany',
    sourceRegionName: 'Nordrhein-Westfalen',
    featureClass: 'Populated place',
    matchBasis: 'country_city_unique',
  }),
  noGeometry('ES', null, 'Sant Cugat del Valles', NATURAL_EARTH_NO_MATCH_REASON),
  reviewedReferencePoint('JP', null, 'Tokyo', {
    longitude: 139.749462,
    latitude: 35.686963,
    featureId: 1159151609,
    featureName: 'Tokyo',
    sourceCountryName: 'Japan',
    sourceRegionName: 'Tokyo',
    featureClass: 'Admin-0 capital',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('RU', null, 'Moscow', {
    longitude: 37.613577,
    latitude: 55.75411,
    featureId: 1159151585,
    featureName: 'Moscow',
    sourceCountryName: 'Russia',
    sourceRegionName: 'Moskva',
    featureClass: 'Admin-0 capital',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('US', null, 'Austin', {
    longitude: -97.744724,
    latitude: 30.268895,
    featureId: 1159149261,
    featureName: 'Austin',
    sourceCountryName: 'United States of America',
    sourceRegionName: 'Texas',
    featureClass: 'Admin-1 capital',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('US', null, 'Los Angeles', {
    longitude: -118.231986,
    latitude: 34.049219,
    featureId: 1159151569,
    featureName: 'Los Angeles',
    sourceCountryName: 'United States of America',
    sourceRegionName: 'California',
    featureClass: 'Populated place',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('US', null, 'Miami', {
    longitude: -80.226052,
    latitude: 25.789557,
    featureId: 1159151487,
    featureName: 'Miami',
    sourceCountryName: 'United States of America',
    sourceRegionName: 'Florida',
    featureClass: 'Populated place',
    matchBasis: 'country_city_unique',
  }),
  reviewedReferencePoint('US', 'Texas', 'Dallas', {
    longitude: -96.794687,
    latitude: 32.771958,
    featureId: 1159151235,
    featureName: 'Dallas',
    sourceCountryName: 'United States of America',
    sourceRegionName: 'Texas',
    featureClass: 'Populated place',
    matchBasis: 'country_city_region',
  }),
])

export function cityReferenceGeometryByKey(key) {
  return TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.key === key) ?? null
}
