export type CityAggregateStream = {
  login?: string
  displayName?: string
  viewers?: number
  sources?: string[]
  location?: {
    countryCode?: string
    countryName?: string
    regions?: string[]
    cities?: string[]
  }
}

export type CityAggregateLocationParts = {
  countryCode?: string | null
  region?: string | null
  city?: string | null
}

export type CityAggregate<T extends CityAggregateStream = CityAggregateStream> = {
  key: string
  city: string
  region: string | null
  countryCode: string
  countryName: string
  label: string
  streams: T[]
  viewers: number
  sourceCounts: Record<string, number>
}

export type CitySelectionState<T extends CityAggregateStream = CityAggregateStream> = {
  selectedKey: string | null
  selectedExists: boolean
  selectedEmpty: boolean
  aggregate: CityAggregate<T> | null
  aggregates: CityAggregate<T>[]
  visibleStreams: T[]
}

export function cityAggregateKeyFromParts(parts?: CityAggregateLocationParts): string
export function cityAggregateKeyFromStream<T extends CityAggregateStream>(stream: T): string
export function groupCityMappedStreams<T extends CityAggregateStream>(streams: T[]): CityAggregate<T>[]
export function citySelectionState<T extends CityAggregateStream>(streams: T[], selectedKey: string | null | undefined): CitySelectionState<T>
