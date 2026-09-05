import { cityAggregateKeyFromParts } from './city-aggregate-core.mjs'

const NO_GEOMETRY_REASON = 'reference_geometry_not_reviewed'

function noGeometry(countryCode, region, city) {
  return Object.freeze({
    key: cityAggregateKeyFromParts({ countryCode, region, city }),
    countryCode,
    region: region || null,
    city,
    geometryStatus: 'no_geometry',
    referencePoint: null,
    source: null,
    reason: NO_GEOMETRY_REASON,
  })
}

export const TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY = Object.freeze([
  noGeometry('DE', 'Berlin', 'Berlin'),
  noGeometry('DE', null, 'Cologne'),
  noGeometry('ES', null, 'Sant Cugat del Valles'),
  noGeometry('JP', null, 'Tokyo'),
  noGeometry('RU', null, 'Moscow'),
  noGeometry('US', null, 'Austin'),
  noGeometry('US', null, 'Los Angeles'),
  noGeometry('US', null, 'Miami'),
  noGeometry('US', 'Texas', 'Dallas'),
])

export function cityReferenceGeometryByKey(key) {
  return TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY.find((entry) => entry.key === key) ?? null
}
