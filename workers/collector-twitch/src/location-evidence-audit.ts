export type TwitchLocationEvidenceInput = {
  title?: unknown
  tags?: unknown
  language?: unknown
}

export type LocationEvidenceCollectionStatus =
  | 'collected_not_persisted'
  | 'not_collected'

export type LocationEvidenceUse =
  | 'direct_candidate_source'
  | 'supporting_only'
  | 'unavailable'

export const TWITCH_LOCATION_EVIDENCE_SOURCE_STATUS = {
  title: {
    endpoint: '/helix/streams',
    collectionStatus: 'collected_not_persisted' as const,
    additionalApiRequestRequired: false,
    evidenceUse: 'direct_candidate_source' as const,
  },
  tags: {
    endpoint: '/helix/streams',
    collectionStatus: 'collected_not_persisted' as const,
    additionalApiRequestRequired: false,
    evidenceUse: 'direct_candidate_source' as const,
  },
  language: {
    endpoint: '/helix/streams',
    collectionStatus: 'collected_not_persisted' as const,
    additionalApiRequestRequired: false,
    evidenceUse: 'supporting_only' as const,
  },
  description: {
    endpoint: '/helix/users',
    collectionStatus: 'not_collected' as const,
    additionalApiRequestRequired: true,
    evidenceUse: 'unavailable' as const,
  },
} as const

export function buildTwitchLocationEvidenceSourceAudit(streams: TwitchLocationEvidenceInput[]) {
  let title = 0
  let tags = 0
  let language = 0
  let titleAndTags = 0
  let titleAndLanguage = 0
  let tagsAndLanguage = 0
  let allThree = 0
  let anyZeroExtraApiEvidence = 0

  for (const stream of streams) {
    const hasTitle = nonEmptyText(stream.title)
    const hasTags = nonEmptyTextArray(stream.tags)
    const hasLanguage = nonEmptyText(stream.language)

    if (hasTitle) title += 1
    if (hasTags) tags += 1
    if (hasLanguage) language += 1
    if (hasTitle && hasTags) titleAndTags += 1
    if (hasTitle && hasLanguage) titleAndLanguage += 1
    if (hasTags && hasLanguage) tagsAndLanguage += 1
    if (hasTitle && hasTags && hasLanguage) allThree += 1
    if (hasTitle || hasTags || hasLanguage) anyZeroExtraApiEvidence += 1
  }

  return {
    totalStreams: streams.length,
    sourceStatus: TWITCH_LOCATION_EVIDENCE_SOURCE_STATUS,
    availableCounts: {
      title,
      tags,
      language,
      description: null,
    },
    overlaps: {
      titleAndTags,
      titleAndLanguage,
      tagsAndLanguage,
      allThree,
    },
    anyZeroExtraApiEvidence,
    description: {
      count: null,
      reason: 'not_collected_requires_helix_users',
    },
    candidateExtraction: {
      status: 'not_implemented',
      note: 'Presence of title or tags is evidence availability only; it is not itself a geographic match.',
    },
  }
}

function nonEmptyText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function nonEmptyTextArray(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => nonEmptyText(item))
}
