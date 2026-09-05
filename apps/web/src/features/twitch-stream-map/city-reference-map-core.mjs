import { TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY } from './city-reference-geometry-registry.mjs'

export function cityAggregateReferenceMapState(
  aggregates,
  registry = TWITCH_CITY_REFERENCE_GEOMETRY_REGISTRY,
) {
  const listAggregates = [...(Array.isArray(aggregates) ? aggregates : [])]
  const registryByKey = new Map(
    (Array.isArray(registry) ? registry : [])
      .filter((entry) => typeof entry?.key === 'string' && entry.key)
      .map((entry) => [entry.key, entry]),
  )

  const mapPoints = []
  const listOnlyKeys = []

  for (const aggregate of listAggregates) {
    const key = typeof aggregate?.key === 'string' ? aggregate.key : ''
    if (!key) continue

    const geometry = registryByKey.get(key)
    if (!usableCityAggregateReferencePoint(geometry)) {
      listOnlyKeys.push(key)
      continue
    }

    mapPoints.push(Object.freeze({
      key,
      city: stringValue(aggregate?.city),
      region: stringValue(aggregate?.region) || null,
      countryCode: stringValue(aggregate?.countryCode).toUpperCase(),
      countryName: stringValue(aggregate?.countryName),
      label: stringValue(aggregate?.label) || key,
      streamCount: Array.isArray(aggregate?.streams) ? aggregate.streams.length : 0,
      viewers: nonNegativeNumber(aggregate?.viewers),
      longitude: geometry.referencePoint.longitude,
      latitude: geometry.referencePoint.latitude,
      referenceRole: 'city_aggregate_reference',
      geometrySource: geometry.source,
    }))
  }

  return Object.freeze({
    listAggregates,
    mapPoints,
    listOnlyKeys,
  })
}

function usableCityAggregateReferencePoint(entry) {
  if (entry?.geometryStatus !== 'reference_point') return false
  if (entry?.referenceRole !== 'city_aggregate_reference') return false
  const longitude = Number(entry?.referencePoint?.longitude)
  const latitude = Number(entry?.referencePoint?.latitude)
  return Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function nonNegativeNumber(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}
