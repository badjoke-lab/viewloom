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

const FUTURE_TRAVEL_PATTERN = /\b(tomorrow|next\s+(?:week|month|year)|soon|planning\s+(?:a\s+)?trip|going\s+to|heading\s+to|travel(?:ing|ling)?\s+to)\b/i

const COUNTRY_ALIASES = [
  ['JP', 'Japan', ['japan']],
  ['KR', 'South Korea', ['south korea', 'korea']],
  ['US', 'United States', ['united states', 'usa', 'u.s.a.']],
  ['GB', 'United Kingdom', ['united kingdom', 'uk', 'u.k.']],
  ['DE', 'Germany', ['germany']],
  ['FR', 'France', ['france']],
  ['CA', 'Canada', ['canada']],
  ['AU', 'Australia', ['australia']],
  ['BR', 'Brazil', ['brazil']],
  ['MX', 'Mexico', ['mexico']],
  ['ES', 'Spain', ['spain']],
  ['IT', 'Italy', ['italy']],
  ['NL', 'Netherlands', ['netherlands']],
  ['SE', 'Sweden', ['sweden']],
  ['NO', 'Norway', ['norway']],
  ['FI', 'Finland', ['finland']],
  ['DK', 'Denmark', ['denmark']],
  ['PL', 'Poland', ['poland']],
  ['TR', 'Turkey', ['turkey', 'türkiye']],
  ['TH', 'Thailand', ['thailand']],
  ['PH', 'Philippines', ['philippines']],
  ['ID', 'Indonesia', ['indonesia']],
  ['SG', 'Singapore', ['singapore']],
  ['TW', 'Taiwan', ['taiwan']],
  ['IN', 'India', ['india']],
  ['AR', 'Argentina', ['argentina']],
  ['CL', 'Chile', ['chile']],
  ['CO', 'Colombia', ['colombia']],
] as const

const CITY_ALIASES = [
  ['Tokyo', 'JP', 'Japan', ['tokyo']],
  ['Osaka', 'JP', 'Japan', ['osaka']],
  ['Seoul', 'KR', 'South Korea', ['seoul']],
  ['Berlin', 'DE', 'Germany', ['berlin']],
  ['Paris', 'FR', 'France', ['paris']],
  ['London', 'GB', 'United Kingdom', ['london']],
  ['New York City', 'US', 'United States', ['new york city', 'nyc']],
  ['San Francisco', 'US', 'United States', ['san francisco']],
  ['Toronto', 'CA', 'Canada', ['toronto']],
  ['Vancouver', 'CA', 'Canada', ['vancouver']],
  ['Sydney', 'AU', 'Australia', ['sydney']],
  ['Melbourne', 'AU', 'Australia', ['melbourne']],
  ['Bangkok', 'TH', 'Thailand', ['bangkok']],
  ['Manila', 'PH', 'Philippines', ['manila']],
  ['Jakarta', 'ID', 'Indonesia', ['jakarta']],
  ['Singapore', 'SG', 'Singapore', ['singapore']],
  ['Taipei', 'TW', 'Taiwan', ['taipei']],
  ['Hong Kong', 'HK', 'Hong Kong', ['hong kong']],
  ['Mumbai', 'IN', 'India', ['mumbai']],
  ['Delhi', 'IN', 'India', ['delhi', 'new delhi']],
  ['São Paulo', 'BR', 'Brazil', ['são paulo', 'sao paulo']],
  ['Mexico City', 'MX', 'Mexico', ['mexico city']],
] as const

const TITLE_LOCATION_CUES = [
  'live from',
  'live in',
  'irl from',
  'irl in',
  'streaming from',
  'streaming in',
  'currently in',
  'right now in',
  'from',
  'in',
  'at',
] as const

type CandidateRecord = {
  kind: 'country' | 'city'
  countryCode: string
  countryName: string
  city: string | null
  alias: string
}

type LocationCandidate = {
  source: 'stream_title' | 'stream_tag'
  kind: 'country' | 'city'
  countryCode: string
  countryName: string
  city: string | null
  confidence: 'candidate_only'
}

function normalize(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-US')
    .replace(/[._/\\|()[\]{}:;!?]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasBoundaryTerm(text: string, term: string): boolean {
  const escaped = escapeRegex(normalize(term))
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i').test(` ${normalize(text)} `)
}

function locationRecords(): CandidateRecord[] {
  const records: CandidateRecord[] = []
  for (const [countryCode, countryName, aliases] of COUNTRY_ALIASES) {
    for (const alias of aliases) {
      records.push({ kind: 'country', countryCode, countryName, city: null, alias })
    }
  }
  for (const [city, countryCode, countryName, aliases] of CITY_ALIASES) {
    for (const alias of aliases) {
      records.push({ kind: 'city', countryCode, countryName, city, alias })
    }
  }
  return records.sort((a, b) => b.alias.length - a.alias.length)
}

const LOCATION_RECORDS = locationRecords()

function dedupeCandidates(candidates: LocationCandidate[]): LocationCandidate[] {
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const key = [candidate.source, candidate.kind, candidate.countryCode, candidate.city ?? ''].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function extractTitleLocationCandidates(title: unknown): {
  candidates: LocationCandidate[]
  rejected: 'future_or_planned_travel_wording' | null
} {
  const raw = String(title ?? '').trim()
  if (!raw) return { candidates: [], rejected: null }
  if (FUTURE_TRAVEL_PATTERN.test(raw)) {
    return { candidates: [], rejected: 'future_or_planned_travel_wording' }
  }

  const text = normalize(raw)
  const candidates: LocationCandidate[] = []
  for (const record of LOCATION_RECORDS) {
    if (!hasBoundaryTerm(text, record.alias)) continue

    const alias = normalize(record.alias)
    const cueMatched = TITLE_LOCATION_CUES.some((cue) => {
      const pattern = new RegExp(`(?:^|\\s)${escapeRegex(cue)}\\s+(?:the\\s+)?${escapeRegex(alias)}(?:$|\\s)`, 'i')
      return pattern.test(` ${text} `)
    })
    if (!cueMatched) continue

    candidates.push({
      source: 'stream_title',
      kind: record.kind,
      countryCode: record.countryCode,
      countryName: record.countryName,
      city: record.city,
      confidence: 'candidate_only',
    })
  }

  return { candidates: dedupeCandidates(candidates), rejected: null }
}

export function extractTagLocationCandidates(tags: unknown): LocationCandidate[] {
  if (!Array.isArray(tags)) return []
  const candidates: LocationCandidate[] = []

  for (const tagValue of tags) {
    const tag = normalize(tagValue)
    if (!tag) continue
    for (const record of LOCATION_RECORDS) {
      if (tag !== normalize(record.alias)) continue
      candidates.push({
        source: 'stream_tag',
        kind: record.kind,
        countryCode: record.countryCode,
        countryName: record.countryName,
        city: record.city,
        confidence: 'candidate_only',
      })
    }
  }

  return dedupeCandidates(candidates)
}

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
  }
}

export function auditLocationCandidates(streams: TwitchLocationEvidenceInput[]) {
  const counts = {
    titleCandidateStreams: 0,
    tagCandidateStreams: 0,
    titleAndTagCandidateStreams: 0,
    anyCandidateStreams: 0,
    rejectedFutureTravelTitles: 0,
    countryCandidateStreams: 0,
    cityCandidateStreams: 0,
    multipleLocationCandidateStreams: 0,
  }
  const sourceYield = { stream_title: 0, stream_tag: 0 }
  const countries = new Map<string, number>()

  for (const stream of streams) {
    const titleResult = extractTitleLocationCandidates(stream?.title)
    const tagCandidates = extractTagLocationCandidates(stream?.tags)
    const titleCandidates = titleResult.candidates
    const allCandidates = dedupeCandidates([...titleCandidates, ...tagCandidates])

    if (titleResult.rejected === 'future_or_planned_travel_wording') counts.rejectedFutureTravelTitles += 1
    if (titleCandidates.length > 0) counts.titleCandidateStreams += 1
    if (tagCandidates.length > 0) counts.tagCandidateStreams += 1
    if (titleCandidates.length > 0 && tagCandidates.length > 0) counts.titleAndTagCandidateStreams += 1
    if (allCandidates.length === 0) continue

    counts.anyCandidateStreams += 1
    sourceYield.stream_title += titleCandidates.length > 0 ? 1 : 0
    sourceYield.stream_tag += tagCandidates.length > 0 ? 1 : 0

    const placeKeys = new Set(allCandidates.map((candidate) => `${candidate.countryCode}:${candidate.city ?? ''}`))
    if (placeKeys.size > 1) counts.multipleLocationCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.kind === 'country')) counts.countryCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.kind === 'city')) counts.cityCandidateStreams += 1

    const countryCodes = new Set(allCandidates.map((candidate) => candidate.countryCode))
    for (const code of countryCodes) countries.set(code, (countries.get(code) ?? 0) + 1)
  }

  return {
    status: 'candidate_only' as const,
    acceptanceStatus: 'not_implemented' as const,
    languageUsedForPlacement: false,
    counts,
    sourceYield,
    candidateCountries: Object.fromEntries([...countries.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))),
    note: 'Candidates are conservative text/tag matches for audit only. They are not accepted geographic placements.',
  }
}

export function auditTwitchLocationEvidence(streams: TwitchLocationEvidenceInput[]) {
  return {
    sourceAvailability: buildTwitchLocationEvidenceSourceAudit(streams),
    candidateExtraction: auditLocationCandidates(streams),
  }
}

function nonEmptyText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function nonEmptyTextArray(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => nonEmptyText(item))
}
