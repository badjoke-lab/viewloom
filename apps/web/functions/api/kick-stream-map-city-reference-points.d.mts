export const KICK_STREAM_MAP_CITY_REFERENCE_POINTS_VERSION: string

export type KickCityReferenceGeometry = {
  state: 'reference_point' | 'no_geometry'
  referenceKey: string | null
  semantics: 'city_aggregate_reference' | 'list_only'
  referencePoint?: {
    latitude: number
    longitude: number
  }
}

export function kickCityReferenceGeometry(placement: {
  countryCode?: unknown
  region?: unknown
  city?: unknown
} | null | undefined): KickCityReferenceGeometry

export function applyKickCityReferencePoints<T extends Record<string, unknown>>(runtime: T): T & {
  cityAggregates: unknown[]
  mappedStreams: unknown[]
  coverage: Record<string, unknown>
}
