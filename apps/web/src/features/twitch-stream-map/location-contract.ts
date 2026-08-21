export const LOCATION_EVIDENCE_SOURCES = [
  'account_profile',
  'stream_title',
  'stream_tag',
  'channel_profile',
  'official_external',
  'manual_review',
] as const

export type LocationEvidenceSource = (typeof LOCATION_EVIDENCE_SOURCES)[number]

export const LOCATION_TYPES = [
  'home_base',
  'declared_location',
  'current_location',
] as const

export type LocationType = (typeof LOCATION_TYPES)[number]

export const LOCATION_CONFIDENCE_LEVELS = [
  'explicit',
  'corroborated',
  'reviewed',
] as const

export type LocationConfidence = (typeof LOCATION_CONFIDENCE_LEVELS)[number]

export type LocationEvidence = {
  source: LocationEvidenceSource
  sourceText: string
  sourceUrl?: string | null
  observedAt: string
  countryCode?: string | null
  countryName?: string | null
  region?: string | null
  city?: string | null
  locationType: LocationType
  confidence: LocationConfidence
}

export type StreamerLocationRecord = {
  provider: 'twitch' | 'kick'
  streamerId: string
  evidences: LocationEvidence[]
}

export type LocationSourceFilter = {
  sources: ReadonlySet<LocationEvidenceSource>
  types: ReadonlySet<LocationType>
}

export function evidenceMatchesFilter(
  evidence: LocationEvidence,
  filter: LocationSourceFilter,
): boolean {
  const sourceMatches = filter.sources.size === 0 || filter.sources.has(evidence.source)
  const typeMatches = filter.types.size === 0 || filter.types.has(evidence.locationType)
  return sourceMatches && typeMatches
}

export function recordMatchesFilter(
  record: StreamerLocationRecord,
  filter: LocationSourceFilter,
): boolean {
  return record.evidences.some((evidence) => evidenceMatchesFilter(evidence, filter))
}

export function evidenceSourceLabel(source: LocationEvidenceSource): string {
  switch (source) {
    case 'account_profile': return 'Account/Profile'
    case 'stream_title': return 'Stream title'
    case 'stream_tag': return 'Stream tag'
    case 'channel_profile': return 'Channel profile'
    case 'official_external': return 'Official external'
    case 'manual_review': return 'Manual review'
  }
}

export function locationTypeLabel(type: LocationType): string {
  switch (type) {
    case 'home_base': return 'Home / base'
    case 'declared_location': return 'Declared location'
    case 'current_location': return 'Current location'
  }
}
