import { cityAggregateKeyFromParts } from './city-aggregate-core.mjs'
import { cityReferenceGeometryByKey } from './city-reference-geometry-registry.mjs'

export function cityReferencePointForAggregate(aggregate = {}) {
  const key = typeof aggregate?.key === 'string' && aggregate.key.trim()
    ? aggregate.key.trim()
    : cityAggregateKeyFromParts({
        countryCode: aggregate?.countryCode,
        region: aggregate?.region,
        city: aggregate?.city,
      })
  if (!key) return null

  const geometry = cityReferenceGeometryByKey(key)
  if (!geometry || geometry.geometryStatus !== 'reference_point') return null
  if (geometry.referenceRole !== 'city_aggregate_reference') return null

  const longitude = Number(geometry.referencePoint?.longitude)
  const latitude = Number(geometry.referencePoint?.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null

  return Object.freeze({
    key,
    longitude,
    latitude,
    referenceRole: geometry.referenceRole,
    source: geometry.source ?? null,
  })
}

export function cityReferencePointAggregates(aggregates) {
  const result = []
  for (const aggregate of Array.isArray(aggregates) ? aggregates : []) {
    const referencePoint = cityReferencePointForAggregate(aggregate)
    if (!referencePoint) continue
    result.push(Object.freeze({ aggregate, referencePoint }))
  }
  return result
}
