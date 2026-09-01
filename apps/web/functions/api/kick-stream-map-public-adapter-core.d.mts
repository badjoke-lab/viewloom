import type { KickStreamMapSnapshotItem } from './kick-stream-map-snapshot-source-core.mjs'

export const KICK_STREAM_MAP_PUBLIC_ADAPTER_VERSION: 'viewloom-kick-stream-map-public-adapter-v0.1'

export type KickStreamMapPublicAdapter = {
  version: 'viewloom-kick-stream-map-public-adapter-v0.1'
  platform: 'kick'
  provider: 'kick'
  source: 'real'
  sourceMode: string
  geographyMode: 'country'
  implementationState: 'public_adapter_staged'
  publicActivationAuthorized: false
  state: 'empty' | 'blocked_stable_identity' | 'blocked_reviewed_evidence'
  updatedAt: string | null
  coverage: {
    observedStreams: number
    observedViewers: number
    stableIdentityStreams: number
    stableIdentityViewers: number
    stableIdentityPercent: number
    mappedStreams: 0
    mappedViewers: 0
    mappedCountryCount: 0
    unmappedStreams: number
    unmappedViewers: number
    unmappedReasons: Record<string, number>
  }
  identity: {
    stableKey: 'broadcaster_user_id'
    stableIdentityCoverageState: 'empty' | 'unavailable' | 'partial' | 'observed'
    stableIdentityStreams: number
    missingStableIdentityStreams: number
    slugIsStableIdentity: false
    loginDisplayMetadataOnly: true
  }
  activation: {
    publicCountryActivationReady: false
    blockers: string[]
  }
  mappedStreams: []
  unmappedStreams: Array<{
    slug: string
    displayName: string
    viewers: number
    url: string
    reason: 'stable_identity_unavailable' | 'reviewed_evidence_unavailable'
  }>
  semantics: {
    stableIdentity: 'broadcaster_user_id'
    slugIsStableIdentity: false
    twitchEvidenceReuseAllowed: false
    twitchCreatorKeyReuseAllowed: false
    providerAggregationAllowed: false
    automaticGeographyPromotionAllowed: false
    cityInferenceAllowed: false
    currentLocationPromotionAllowed: false
    preciseAddressAllowed: false
    preciseCoordinatesAllowed: false
    geographyPublishedWhileActivationBlocked: false
  }
}

export function buildKickStreamMapPublicAdapter(input?: {
  snapshotItems?: KickStreamMapSnapshotItem[]
  updatedAt?: string | null
  sourceMode?: string
}): KickStreamMapPublicAdapter
