import type { CityAggregate, CityAggregateStream } from './city-aggregate-core.mjs'

export type CityReferenceGeometryEntry = {
  key: string
  countryCode: string
  region: string | null
  city: string
  geometryStatus: 'no_geometry' | 'review_needed' | 'reference_point'
  referenceRole: 'city_aggregate_reference' | null
  referencePoint: { longitude: number; latitude: number } | null
  source: Record<string, unknown> | null
  reason: string | null
}

export type CityAggregateReferenceMapPoint = {
  key: string
  city: string
  region: string | null
  countryCode: string
  countryName: string
  label: string
  streamCount: number
  viewers: number
  longitude: number
  latitude: number
  referenceRole: 'city_aggregate_reference'
  geometrySource: Record<string, unknown>
}

export type CityAggregateReferenceMapState<T extends CityAggregateStream = CityAggregateStream> = {
  listAggregates: CityAggregate<T>[]
  mapPoints: CityAggregateReferenceMapPoint[]
  listOnlyKeys: string[]
}

export function cityAggregateReferenceMapState<T extends CityAggregateStream = CityAggregateStream>(
  aggregates: CityAggregate<T>[],
  registry?: CityReferenceGeometryEntry[],
): CityAggregateReferenceMapState<T>
