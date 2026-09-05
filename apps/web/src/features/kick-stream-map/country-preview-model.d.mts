export type KickCountryPreviewRow = {
  countryCode: string
  streams: number
  viewers: number
}

export type KickCountryPreviewStream = {
  slug: string
  displayName: string
  viewers: number
  url: string
  countryCode: string
}

export type KickCountryPreviewModel = {
  provider: 'kick'
  geographyMode: 'country'
  allowGeography: boolean
  contractSafe: boolean
  countryRows: KickCountryPreviewRow[]
  mappedStreams: KickCountryPreviewStream[]
  accounting: {
    observedStreams: number
    mappedStreams: number
    unmappedStreams: number
    excludedStreams: number
    conflictStreams: number
    reconciliationPasses: boolean
  }
  semantics: {
    stableIdentity: 'broadcaster_user_id'
    creatorCoordinatesUsed: false
    twitchEvidenceReused: false
    cityInferred: false
    currentLocationPromoted: false
  }
}

export function buildKickCountryPreviewModel(
  response: unknown,
  options?: { allowGeography?: boolean },
): KickCountryPreviewModel

export function metricBucket(value: unknown, max: unknown): number
