import { cityAggregateKeyFromParts } from './city-aggregate-core.mjs'

const NO_GEOMETRY_REASON = 'reference_geometry_not_reviewed'
const NATURAL_EARTH_POPULATED_PLACES = Object.freeze({
  provider: 'Natural Earth',
  dataset: 'ne_10m_populated_places_simple',
  version: '5.1.2',
  url: 'https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_10m_populated_places_simple.geojson',
  geometrySemantics: 'populated_place_point',
})

function noGeometry(countryCode, region, city) {
  return Object.freeze({
    key: cityAggregateKeyFromParts({ countryCode, region, city }),
    countryCode,
    region: region || null,
    city,
    geometryStatus: 'no_geometry',
    referenceRole: null,
    referencePoint: null,
    source: null,
    reason: NO_GEOMETRY_REASON,
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
      exactFeatureMatchCount: 1,
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
  }),
  noGeometry('DE', null, 'Cologne'),
  noGeometry('ES', null, 'Sant Cugat del Valles'),
  reviewedReferencePoint('JP', null, 'Tokyo', {
    longitude: 139.749462,
    latitude: 35.686963,
    featureId: 1159151609,
    featureName: 'Tokyo',
    sourceCountryName: 'Japan',
    sourceRegionName: 'Tokyo',
    featureClass: 'Admin-0 capital',
  }),
  noGeometry('RU', null, 'Moscow'),
  noGeometry('US', null, 'Austin'),
  noGeometry('US', null, 'Los Angeles'),
  noGeometry('US', null, 'Miami'),
  reviewedReferencePoint('US', 'Texas', 'Dallas', {
    longitude: -96.794687,
    latitude: 32.771958,
    featureId: 1159151235,
    featureName: 'Dallas',
    sourceCountryName: 'United States of America',
    sourceRegionName: 'Texas',
    featureClass: 'Populated place',
  }),
])

export function cityReferenceGeometryByKey(key) {
  return TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.key === key) ?? null
}
