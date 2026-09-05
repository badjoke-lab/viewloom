export const KICK_STREAM_MAP_PREVIEW_MODEL_VERSION: string

export type KickStreamMapPreviewReasonRow = {
  reason: string
  count: number
}

export type KickStreamMapPreviewModel = {
  version: string
  provider: 'kick'
  geographyMode: 'country'
  previewOnly: true
  sourceState: string
  updatedAt: string | null
  publicActivationAuthorized: boolean
  publicCountryActivationReady: boolean
  canRenderCountryGeography: boolean
  stableIdentityContractValid: boolean
  coverage: {
    observedStreams: number
    observedViewers: number
    stableIdentityStreams: number
    missingStableIdentityStreams: number
    mappedStreams: number
    mappedViewers: number
    mappedCountryCount: number
    unmappedStreams: number
    unmappedViewers: number
    reasonRows: KickStreamMapPreviewReasonRow[]
  }
  blockers: string[]
  presentation: {
    state: 'country_ready_for_preview' | 'country_blocked'
    heading: string
    detail: string
  }
}

export function buildKickStreamMapPreviewModel(payload: unknown): KickStreamMapPreviewModel
