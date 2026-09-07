export type KickCityReferenceGeometry = {
  state: 'reference_point' | 'no_geometry'
  referenceKey: string | null
  semantics: 'city_aggregate_reference' | 'list_only'
  referencePoint: { longitude: number; latitude: number } | null
}

export type KickCityPreviewRow = {
  cityAggregateKey: string
  countryCode: string
  region: string | null
  city: string
  streams: number
  viewers: number
  referenceGeometry: KickCityReferenceGeometry
}

export type KickCityPreviewStream = {
  slug: string
  displayName: string
  viewers: number
  url: string
  cityAggregateKey: string
  countryCode: string
  region: string | null
  city: string
}

export type KickCityPreviewModel = {
  provider: 'kick'
  geographyMode: 'city'
  publicCityActivationAuthorized: boolean
  allowGeography: boolean
  contractSafe: boolean
  runtimeReady: boolean
  previewAllowed: boolean
  cityRows: KickCityPreviewRow[]
  referenceRows: KickCityPreviewRow[]
  listOnlyRows: KickCityPreviewRow[]
  mappedStreams: KickCityPreviewStream[]
  accounting: {
    observedStreams: number
    stableIdentityStreams: number
    mappedStreams: number
    unmappedStreams: number
    excludedStreams: number
    conflictStreams: number
    mappedCityAggregateCount: number
    referenceGeometryAggregates: number
    listOnlyAggregates: number
    reconciliationPasses: boolean
  }
  blockers: string[]
  semantics: {
    stableIdentity: 'broadcaster_user_id'
    creatorCoordinatesUsed: false
    twitchEvidenceReused: false
    countryInferredToCity: false
    currentLocationPromoted: false
    aggregateReferenceOnly: true
  }
}

export function buildKickCityPreviewModel(
  response: unknown,
  options?: { allowGeography?: boolean },
): KickCityPreviewModel
