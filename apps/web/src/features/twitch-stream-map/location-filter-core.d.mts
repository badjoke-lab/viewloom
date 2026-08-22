export type StreamMapEvidence = {
  source: string
  sourceUrl: string | null
  observedAt: string
  countryCode: string
  countryName: string | null
  region: string | null
  city: string | null
  locationType: string
  confidence: string
}

export type StreamMapMappedStream = {
  login: string
  displayName: string
  viewers: number
  url: string
  entityKind: 'person'
  location: {
    countryCode: string
    countryName: string
    regions: string[]
    cities: string[]
    locationTypes: string[]
  }
  evidence: StreamMapEvidence[]
  sources: string[]
}

export type StreamMapFilter = {
  sources: Set<string> | string[]
  types: Set<string> | string[]
}

export const STREAM_MAP_SOURCE_OPTIONS: string[]
export const STREAM_MAP_TYPE_OPTIONS: string[]

export function evidenceMatchesLocationFilter(evidence: StreamMapEvidence, filter: StreamMapFilter): boolean
export function filterMappedStreams(streams: StreamMapMappedStream[], filter: StreamMapFilter): StreamMapMappedStream[]
export function summarizeFilteredStreams(streams: StreamMapMappedStream[], observedStreams: number, observedViewers: number): {
  mappedStreams: number
  unmappedStreams: number
  mappedViewers: number
  unmappedViewers: number
  mappedCountryCount: number
  mappedPercent: number
  mappedViewerPercent: number
  currentLocationStreams: number
  currentLocationPercent: number
}
