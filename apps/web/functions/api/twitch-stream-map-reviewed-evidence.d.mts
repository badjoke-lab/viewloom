export type TwitchMapEntityKind = 'person' | 'organization' | 'event_broadcast' | 'unknown'
export type TwitchMapEvidenceSource = 'account_profile' | 'stream_title' | 'stream_tag' | 'channel_profile' | 'official_external' | 'manual_review'
export type TwitchMapClaimKind = 'home_base' | 'declared_location' | 'current_location' | 'birthplace' | 'event_venue' | 'organization_headquarters' | 'nationality'
export type TwitchMapEvidenceConfidence = 'candidate_only' | 'explicit' | 'corroborated' | 'reviewed'
export type TwitchMapEvidenceStatus = 'accepted' | 'context_only' | 'candidate_only' | 'rejected'

export type TwitchReviewedLocationEvidence = {
  source: TwitchMapEvidenceSource
  sourceUrl: string | null
  observedAt: string
  countryCode: string | null
  countryName: string | null
  region: string | null
  city: string | null
  claimKind: TwitchMapClaimKind
  confidence: TwitchMapEvidenceConfidence
  status: TwitchMapEvidenceStatus
}

export type TwitchReviewedLocationRecord = {
  streamerLogin: string
  entityKind: TwitchMapEntityKind
  classificationReferences: string[]
  evidences: TwitchReviewedLocationEvidence[]
}

export const TWITCH_REVIEWED_LOCATION_RECORDS: TwitchReviewedLocationRecord[]
