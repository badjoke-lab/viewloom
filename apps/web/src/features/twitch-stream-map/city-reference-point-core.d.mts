export type CityReferencePointAggregate = {
  key?: string
  countryCode?: string
  region?: string | null
  city?: string
  streams?: unknown[]
  viewers?: number
  label?: string
}

export type CityAggregateReferencePoint = {
  key: string
  longitude: number
  latitude: number
  referenceRole: 'city_aggregate_reference'
  source: Record<string, unknown> | null
}

export function cityReferencePointForAggregate(
  aggregate?: CityReferencePointAggregate,
): CityAggregateReferencePoint | null

export function cityReferencePointAggregates<T extends CityReferencePointAggregate>(
  aggregates: T[] | null | undefined,
): Array<{ aggregate: T; referencePoint: CityAggregateReferencePoint }>
