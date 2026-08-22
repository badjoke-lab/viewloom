export const STREAM_MAP_SOURCE_OPTIONS = [
  'account_profile',
  'stream_title',
  'stream_tag',
  'channel_profile',
  'official_external',
  'manual_review',
]

export const STREAM_MAP_TYPE_OPTIONS = [
  'home_base',
  'declared_location',
  'current_location',
]

export function evidenceMatchesLocationFilter(evidence, filter) {
  const sources = filter?.sources instanceof Set ? filter.sources : new Set(filter?.sources ?? [])
  const types = filter?.types instanceof Set ? filter.types : new Set(filter?.types ?? [])
  const sourceMatches = sources.size === 0 || sources.has(String(evidence?.source ?? ''))
  const typeMatches = types.size === 0 || types.has(String(evidence?.locationType ?? ''))
  return sourceMatches && typeMatches
}

export function filterMappedStreams(streams, filter) {
  const rows = Array.isArray(streams) ? streams : []
  return rows.map((stream) => {
    const evidence = (Array.isArray(stream?.evidence) ? stream.evidence : [])
      .filter((item) => evidenceMatchesLocationFilter(item, filter))
    if (evidence.length === 0) return null

    return {
      ...stream,
      evidence,
      sources: [...new Set(evidence.map((item) => String(item.source ?? '')).filter(Boolean))],
      location: {
        ...stream.location,
        locationTypes: [...new Set(evidence.map((item) => String(item.locationType ?? '')).filter(Boolean))],
      },
    }
  }).filter(Boolean)
}

export function summarizeFilteredStreams(streams, observedStreams, observedViewers) {
  const rows = Array.isArray(streams) ? streams : []
  const mappedStreams = rows.length
  const mappedViewers = rows.reduce((sum, stream) => sum + safeCount(stream?.viewers), 0)
  const mappedCountries = new Set(rows.map((stream) => String(stream?.location?.countryCode ?? '')).filter(Boolean))
  const currentLocationStreams = rows.filter((stream) => (stream?.evidence ?? []).some((item) => item?.locationType === 'current_location')).length
  const observedStreamCount = safeCount(observedStreams)
  const observedViewerCount = safeCount(observedViewers)

  return {
    mappedStreams,
    unmappedStreams: Math.max(0, observedStreamCount - mappedStreams),
    mappedViewers,
    unmappedViewers: Math.max(0, observedViewerCount - mappedViewers),
    mappedCountryCount: mappedCountries.size,
    mappedPercent: observedStreamCount > 0 ? mappedStreams / observedStreamCount : 0,
    mappedViewerPercent: observedViewerCount > 0 ? mappedViewers / observedViewerCount : 0,
    currentLocationStreams,
    currentLocationPercent: observedStreamCount > 0 ? currentLocationStreams / observedStreamCount : 0,
  }
}

function safeCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}
