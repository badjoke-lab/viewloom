import type { StreamMapMappedStream } from './location-filter-core.mjs'

export type StreamMapCountryGroup = {
  countryCode: string
  countryName: string
  viewers: number
  streams: StreamMapMappedStream[]
  sourceCounts: Record<string, number>
}

export function groupMappedStreamsByCountry(streams: StreamMapMappedStream[]): StreamMapCountryGroup[]
export function selectCountryStreams(streams: StreamMapMappedStream[], selectedCountry: string | null): StreamMapMappedStream[]
export function countrySelectionState(streams: StreamMapMappedStream[], selectedCountry: string | null): {
  selectedCountry: string | null
  selectedExists: boolean
  selectedEmpty: boolean
  country: StreamMapCountryGroup | null
  visibleStreams: StreamMapMappedStream[]
}
