const PLACEABLE_CLAIMS = new Set(['home_base', 'declared_location', 'current_location'])
const NON_PERSON_ENTITY_KINDS = new Set(['organization', 'event_broadcast'])

export function buildTwitchStreamMapLiveModel({ snapshot, evidenceRecords, topLimit = 300 }) {
  const streams = parseSnapshotStreams(snapshot?.payloadJson)
  const evidenceByLogin = new Map(
    (Array.isArray(evidenceRecords) ? evidenceRecords : [])
      .map((record) => [normalizeLogin(record?.streamerLogin), record])
      .filter(([login]) => Boolean(login)),
  )

  const mappedStreams = []
  const excludedNonPersonStreams = []
  const unmappedReasonCounts = new Map()
  const mappedCountries = new Set()
  const mappedSources = new Map()
  let mappedViewers = 0
  let excludedNonPersonViewers = 0
  let currentLocationStreams = 0

  for (const stream of streams) {
    const record = stream.login ? evidenceByLogin.get(stream.login) : null
    if (!stream.login) {
      increment(unmappedReasonCounts, 'missing_stable_identity')
      continue
    }
    if (!record) {
      increment(unmappedReasonCounts, 'no_reviewed_evidence')
      continue
    }

    const entityKind = String(record.entityKind ?? 'unknown')
    if (NON_PERSON_ENTITY_KINDS.has(entityKind)) {
      excludedNonPersonStreams.push({
        login: stream.login,
        displayName: stream.displayName,
        viewers: stream.viewers,
        url: stream.url,
        entityKind,
      })
      excludedNonPersonViewers += stream.viewers
      increment(unmappedReasonCounts, 'excluded_nonperson')
      continue
    }
    if (entityKind !== 'person') {
      increment(unmappedReasonCounts, 'entity_kind_unresolved')
      continue
    }

    const accepted = (Array.isArray(record.evidences) ? record.evidences : []).filter(isAcceptedPlacementEvidence)
    if (!accepted.length) {
      increment(unmappedReasonCounts, 'context_only_or_unaccepted_evidence')
      continue
    }

    const countries = [...new Set(accepted.map((evidence) => String(evidence.countryCode ?? '').trim().toUpperCase()).filter(Boolean))]
    if (countries.length !== 1) {
      increment(unmappedReasonCounts, countries.length > 1 ? 'conflicting_accepted_evidence' : 'accepted_evidence_without_country')
      continue
    }

    const countryCode = countries[0]
    const sameCountryEvidence = accepted.filter((evidence) => String(evidence.countryCode ?? '').trim().toUpperCase() === countryCode)
    const countryName = sameCountryEvidence.map((evidence) => String(evidence.countryName ?? '').trim()).find(Boolean) || countryCode
    const regions = uniqueStrings(sameCountryEvidence.map((evidence) => evidence.region))
    const cities = uniqueStrings(sameCountryEvidence.map((evidence) => evidence.city))
    const sources = uniqueStrings(sameCountryEvidence.map((evidence) => evidence.source))
    const locationTypes = uniqueStrings(sameCountryEvidence.map((evidence) => evidence.claimKind))

    mappedStreams.push({
      login: stream.login,
      displayName: stream.displayName,
      viewers: stream.viewers,
      url: stream.url,
      entityKind: 'person',
      location: {
        countryCode,
        countryName,
        regions,
        cities,
        locationTypes,
      },
      evidence: sameCountryEvidence.map(projectEvidence),
      sources,
    })
    mappedViewers += stream.viewers
    mappedCountries.add(countryCode)
    if (locationTypes.includes('current_location')) currentLocationStreams += 1
    for (const source of sources) increment(mappedSources, source)
  }

  const reportedObservedStreams = positiveInteger(snapshot?.streamCount)
  const reportedObservedViewers = positiveInteger(snapshot?.totalViewers)
  const observedStreams = reportedObservedStreams || streams.length
  const parsedViewers = streams.reduce((sum, stream) => sum + stream.viewers, 0)
  const observedViewers = reportedObservedViewers || parsedViewers
  const missingPayloadStreams = Math.max(0, observedStreams - streams.length)
  if (missingPayloadStreams > 0) increment(unmappedReasonCounts, 'missing_payload_rows', missingPayloadStreams)

  const mappedCount = mappedStreams.length
  const excludedCount = excludedNonPersonStreams.length
  const unmappedStreams = Math.max(0, observedStreams - mappedCount)
  const eligibleUnmappedStreams = Math.max(0, unmappedStreams - excludedCount)
  const unmappedViewers = Math.max(0, observedViewers - mappedViewers)

  return {
    version: 'viewloom-stream-map-live-v1',
    platform: 'twitch',
    source: 'real',
    sourceMode: String(snapshot?.sourceMode ?? 'missing'),
    updatedAt: stringOrNull(snapshot?.collectedAt ?? snapshot?.bucketMinute),
    coverage: {
      topLimit,
      observedStreams,
      observedViewers,
      payloadStreams: streams.length,
      missingPayloadStreams,
      mappedStreams: mappedCount,
      unmappedStreams,
      eligibleUnmappedStreams,
      excludedNonPersonStreams: excludedCount,
      mappedPercent: ratio(mappedCount, observedStreams),
      mappedViewers,
      unmappedViewers,
      excludedNonPersonViewers,
      mappedViewerPercent: ratio(mappedViewers, observedViewers),
      mappedCountryCount: mappedCountries.size,
      currentLocationStreams,
      currentLocationPercent: ratio(currentLocationStreams, observedStreams),
      coveredPages: nullableInteger(snapshot?.coveredPages),
      hasMore: Boolean(snapshot?.hasMore),
      mappedBySource: Object.fromEntries([...mappedSources.entries()].sort(([left], [right]) => left.localeCompare(right))),
      unmappedReasons: Object.fromEntries([...unmappedReasonCounts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    },
    mappedStreams: mappedStreams.sort((left, right) => right.viewers - left.viewers || left.login.localeCompare(right.login)),
    excludedNonPersonStreams: excludedNonPersonStreams.sort((left, right) => right.viewers - left.viewers || left.login.localeCompare(right.login)),
    semantics: {
      languageUsedForPlacement: false,
      candidateOnlyPlacementAllowed: false,
      nonPersonPlacementAllowed: false,
      conflictingAcceptedCountriesAreMapped: false,
      mappedPlusUnmappedEqualsObserved: true,
      excludedNonPersonIsSubsetOfUnmapped: true,
      evidenceSourcesRemainDistinct: true,
    },
  }
}

function parseSnapshotStreams(payloadJson) {
  let payload = null
  try { payload = JSON.parse(String(payloadJson ?? '')) } catch { payload = null }
  const items = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []
  return items.map(parseStream).filter(Boolean)
}

function parseStream(value) {
  if (!value || typeof value !== 'object') return null
  const login = normalizeLogin(value.channelLogin ?? value.user_login ?? value.login)
  const displayName = cleanString(value.displayName ?? value.user_name ?? value.name ?? login) || login || 'Unknown'
  const viewers = positiveInteger(value.viewers ?? value.viewer_count ?? value.viewerCount)
  if (viewers <= 0) return null
  return {
    login,
    displayName,
    viewers,
    url: login ? `https://www.twitch.tv/${login}` : '',
  }
}

function isAcceptedPlacementEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') return false
  if (String(evidence.status ?? '') !== 'accepted') return false
  if (String(evidence.confidence ?? '') === 'candidate_only') return false
  if (!PLACEABLE_CLAIMS.has(String(evidence.claimKind ?? ''))) return false
  return Boolean(String(evidence.countryCode ?? '').trim())
}

function projectEvidence(evidence) {
  return {
    source: String(evidence.source ?? ''),
    sourceUrl: stringOrNull(evidence.sourceUrl),
    observedAt: String(evidence.observedAt ?? ''),
    countryCode: String(evidence.countryCode ?? '').trim().toUpperCase(),
    countryName: stringOrNull(evidence.countryName),
    region: stringOrNull(evidence.region),
    city: stringOrNull(evidence.city),
    locationType: String(evidence.claimKind ?? ''),
    confidence: String(evidence.confidence ?? ''),
  }
}

function normalizeLogin(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringOrNull(value) {
  const text = cleanString(value)
  return text || null
}

function uniqueStrings(values) {
  return [...new Set(values.map(cleanString).filter(Boolean))]
}

function positiveInteger(value) {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0
}

function nullableInteger(value) {
  if (value == null) return null
  return positiveInteger(value)
}

function ratio(numerator, denominator) {
  if (!denominator) return 0
  return Number((numerator / denominator).toFixed(6))
}

function increment(map, key, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount)
}
