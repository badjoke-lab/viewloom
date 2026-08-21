import type { TwitchReviewedLocationRecord } from './twitch-stream-map-reviewed-evidence.mjs'

export type TwitchStreamMapSnapshotInput = {
  bucketMinute: string | null
  collectedAt: string | null
  streamCount: number | null
  totalViewers: number | null
  payloadJson: string | null
  sourceMode: string | null
  coveredPages: number | null
  hasMore: boolean
}

export type TwitchStreamMapLiveModel = {
  version: 'viewloom-stream-map-live-v1'
  platform: 'twitch'
  source: 'real'
  sourceMode: string
  updatedAt: string | null
  coverage: {
    topLimit: number
    observedStreams: number
    observedViewers: number
    payloadStreams: number
    missingPayloadStreams: number
    mappedStreams: number
    unmappedStreams: number
    eligibleUnmappedStreams: number
    excludedNonPersonStreams: number
    mappedPercent: number
    mappedViewers: number
    unmappedViewers: number
    excludedNonPersonViewers: number
    mappedViewerPercent: number
    mappedCountryCount: number
    currentLocationStreams: number
    currentLocationPercent: number
    coveredPages: number | null
    hasMore: boolean
    mappedBySource: Record<string, number>
    unmappedReasons: Record<string, number>
  }
  mappedStreams: Array<{
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
    evidence: Array<{
      source: string
      sourceUrl: string | null
      observedAt: string
      countryCode: string
      countryName: string | null
      region: string | null
      city: string | null
      locationType: string
      confidence: string
    }>
    sources: string[]
  }>
  excludedNonPersonStreams: Array<{
    login: string
    displayName: string
    viewers: number
    url: string
    entityKind: string
  }>
  semantics: {
    languageUsedForPlacement: false
    candidateOnlyPlacementAllowed: false
    nonPersonPlacementAllowed: false
    conflictingAcceptedCountriesAreMapped: false
    mappedPlusUnmappedEqualsObserved: true
    excludedNonPersonIsSubsetOfUnmapped: true
    evidenceSourcesRemainDistinct: true
  }
}

export function buildTwitchStreamMapLiveModel(input: {
  snapshot: TwitchStreamMapSnapshotInput
  evidenceRecords: TwitchReviewedLocationRecord[]
  topLimit?: number
}): TwitchStreamMapLiveModel
