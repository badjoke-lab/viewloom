export type TwitchLocationEvidenceInput = {
  userId?: unknown
  title?: unknown
  tags?: unknown
  language?: unknown
  profileDescription?: unknown
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
    evidenceUse: 'direct_candidate_source' as const,
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

type LocationClaimType = 'home_or_base' | 'declared_country' | 'current_location' | 'ambiguous'

type LocationCue = {
  cue: string
  claimType: LocationClaimType
}

const TITLE_LOCATION_CUES: readonly LocationCue[] = [
  { cue: 'live from', claimType: 'current_location' },
  { cue: 'live in', claimType: 'current_location' },
  { cue: 'irl from', claimType: 'current_location' },
  { cue: 'irl in', claimType: 'current_location' },
  { cue: 'streaming from', claimType: 'current_location' },
  { cue: 'streaming in', claimType: 'current_location' },
  { cue: 'currently in', claimType: 'current_location' },
  { cue: 'right now in', claimType: 'current_location' },
]

const PROFILE_LOCATION_CUES: readonly LocationCue[] = [
  { cue: 'based in', claimType: 'home_or_base' },
  { cue: 'based out of', claimType: 'home_or_base' },
  { cue: 'located in', claimType: 'home_or_base' },
  { cue: 'living in', claimType: 'home_or_base' },
  { cue: 'live in', claimType: 'home_or_base' },
  { cue: 'from', claimType: 'declared_country' },
]

type CandidateRecord = {
  kind: 'country' | 'city'
  countryCode: string
  countryName: string
  city: string | null
  alias: string
}

type LocationCandidate = {
  source: 'account_profile' | 'stream_title' | 'stream_tag'
  kind: 'country' | 'city'
  countryCode: string
  countryName: string
  city: string | null
  claimType: LocationClaimType
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
    const key = [candidate.source, candidate.claimType, candidate.kind, candidate.countryCode, candidate.city ?? ''].join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function hasLocationConflict(candidates: LocationCandidate[]): boolean {
  const byClaimType = new Map<LocationClaimType, LocationCandidate[]>()
  for (const candidate of candidates) {
    const group = byClaimType.get(candidate.claimType) ?? []
    group.push(candidate)
    byClaimType.set(candidate.claimType, group)
  }

  for (const group of byClaimType.values()) {
    const countryCodes = new Set(group.map((candidate) => candidate.countryCode))
    if (countryCodes.size > 1) return true

    const cities = new Set(group
      .map((candidate) => candidate.city)
      .filter((city): city is string => typeof city === 'string' && city.length > 0))
    if (cities.size > 1) return true
  }
  return false
}

function extractCueLocationCandidates(
  value: unknown,
  source: LocationCandidate['source'],
  cues: readonly LocationCue[],
): LocationCandidate[] {
  const raw = String(value ?? '').trim()
  if (!raw) return []
  const text = normalize(raw)
  const candidates: LocationCandidate[] = []

  for (const record of LOCATION_RECORDS) {
    if (!hasBoundaryTerm(text, record.alias)) continue
    const alias = normalize(record.alias)

    for (const cue of cues) {
      const pattern = new RegExp(`(?:^|\\s)${escapeRegex(cue.cue)}\\s+(?:the\\s+)?${escapeRegex(alias)}(?:$|\\s)`, 'i')
      if (!pattern.test(` ${text} `)) continue

      candidates.push({
        source,
        kind: record.kind,
        countryCode: record.countryCode,
        countryName: record.countryName,
        city: record.city,
        claimType: cue.claimType,
        confidence: 'candidate_only',
      })
    }
  }

  return dedupeCandidates(candidates)
}

export function extractProfileLocationCandidates(description: unknown): LocationCandidate[] {
  return extractCueLocationCandidates(description, 'account_profile', PROFILE_LOCATION_CUES)
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
  return {
    candidates: extractCueLocationCandidates(raw, 'stream_title', TITLE_LOCATION_CUES),
    rejected: null,
  }
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
        claimType: 'ambiguous',
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
  let description = 0
  let titleAndTags = 0
  let titleAndLanguage = 0
  let tagsAndLanguage = 0
  let allThree = 0
  let anyZeroExtraApiEvidence = 0

  for (const stream of streams) {
    const hasTitle = nonEmptyText(stream.title)
    const hasTags = nonEmptyTextArray(stream.tags)
    const hasLanguage = nonEmptyText(stream.language)
    const hasDescription = nonEmptyText(stream.profileDescription)

    if (hasTitle) title += 1
    if (hasTags) tags += 1
    if (hasLanguage) language += 1
    if (hasDescription) description += 1
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
      description,
    },
    overlaps: {
      titleAndTags,
      titleAndLanguage,
      tagsAndLanguage,
      allThree,
    },
    anyZeroExtraApiEvidence,
    description: {
      count: description,
      reason: description > 0 ? 'audit_fetched_via_helix_users' : 'not_collected_requires_helix_users',
    },
  }
}

export function auditLocationCandidates(streams: TwitchLocationEvidenceInput[]) {
  const counts = {
    profileCandidateStreams: 0,
    titleCandidateStreams: 0,
    tagCandidateStreams: 0,
    profileOnlyCandidateStreams: 0,
    titleOnlyCandidateStreams: 0,
    tagOnlyCandidateStreams: 0,
    profileAndTitleCandidateStreams: 0,
    profileAndTagCandidateStreams: 0,
    titleAndTagCandidateStreams: 0,
    allThreeCandidateStreams: 0,
    anyCandidateStreams: 0,
    rejectedFutureTravelTitles: 0,
    countryCandidateStreams: 0,
    cityCandidateStreams: 0,
    homeOrBaseCandidateStreams: 0,
    declaredCountryCandidateStreams: 0,
    currentLocationCandidateStreams: 0,
    ambiguousCandidateStreams: 0,
    multipleLocationCandidateStreams: 0,
    unknownStreams: 0,
    acceptedCountryStreams: 0,
    acceptedCityStreams: 0,
  }
  const sourceYield = { account_profile: 0, stream_title: 0, stream_tag: 0 }
  const countries = new Map<string, number>()

  for (const stream of streams) {
    const profileCandidates = extractProfileLocationCandidates(stream?.profileDescription)
    const titleResult = extractTitleLocationCandidates(stream?.title)
    const tagCandidates = extractTagLocationCandidates(stream?.tags)
    const titleCandidates = titleResult.candidates
    const allCandidates = dedupeCandidates([...profileCandidates, ...titleCandidates, ...tagCandidates])

    const hasProfile = profileCandidates.length > 0
    const hasTitle = titleCandidates.length > 0
    const hasTag = tagCandidates.length > 0
    const sourceCount = Number(hasProfile) + Number(hasTitle) + Number(hasTag)

    if (titleResult.rejected === 'future_or_planned_travel_wording') counts.rejectedFutureTravelTitles += 1
    if (hasProfile) counts.profileCandidateStreams += 1
    if (hasTitle) counts.titleCandidateStreams += 1
    if (hasTag) counts.tagCandidateStreams += 1
    if (hasProfile && !hasTitle && !hasTag) counts.profileOnlyCandidateStreams += 1
    if (!hasProfile && hasTitle && !hasTag) counts.titleOnlyCandidateStreams += 1
    if (!hasProfile && !hasTitle && hasTag) counts.tagOnlyCandidateStreams += 1
    if (hasProfile && hasTitle) counts.profileAndTitleCandidateStreams += 1
    if (hasProfile && hasTag) counts.profileAndTagCandidateStreams += 1
    if (hasTitle && hasTag) counts.titleAndTagCandidateStreams += 1
    if (sourceCount === 3) counts.allThreeCandidateStreams += 1

    if (allCandidates.length === 0) {
      counts.unknownStreams += 1
      continue
    }

    counts.anyCandidateStreams += 1
    sourceYield.account_profile += hasProfile ? 1 : 0
    sourceYield.stream_title += hasTitle ? 1 : 0
    sourceYield.stream_tag += hasTag ? 1 : 0

    if (hasLocationConflict(allCandidates)) counts.multipleLocationCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.kind === 'country')) counts.countryCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.kind === 'city')) counts.cityCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.claimType === 'home_or_base')) counts.homeOrBaseCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.claimType === 'declared_country')) counts.declaredCountryCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.claimType === 'current_location')) counts.currentLocationCandidateStreams += 1
    if (allCandidates.some((candidate) => candidate.claimType === 'ambiguous')) counts.ambiguousCandidateStreams += 1

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
    note: 'Candidates preserve claim type. Profile origin, home/base, current-location and ambiguous tag claims are not collapsed together.',
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
