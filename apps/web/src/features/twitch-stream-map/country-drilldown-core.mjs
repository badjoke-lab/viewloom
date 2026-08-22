export function groupMappedStreamsByCountry(streams) {
  const groups = new Map()
  for (const stream of Array.isArray(streams) ? streams : []) {
    const countryCode = String(stream?.location?.countryCode ?? '').trim().toUpperCase()
    if (!countryCode) continue
    const countryName = String(stream?.location?.countryName ?? '').trim() || countryCode
    const current = groups.get(countryCode) ?? {
      countryCode,
      countryName,
      viewers: 0,
      streams: [],
      sourceCounts: {},
    }
    current.viewers += safeCount(stream?.viewers)
    current.streams.push(stream)
    for (const source of Array.isArray(stream?.sources) ? stream.sources : []) {
      const key = String(source ?? '').trim()
      if (!key) continue
      current.sourceCounts[key] = (current.sourceCounts[key] ?? 0) + 1
    }
    groups.set(countryCode, current)
  }
  return [...groups.values()].sort((a, b) => b.viewers - a.viewers || a.countryName.localeCompare(b.countryName))
}

export function selectCountryStreams(streams, selectedCountry) {
  const code = normalizeCountry(selectedCountry)
  if (!code) return Array.isArray(streams) ? [...streams] : []
  return (Array.isArray(streams) ? streams : []).filter((stream) => normalizeCountry(stream?.location?.countryCode) === code)
}

export function countrySelectionState(streams, selectedCountry) {
  const code = normalizeCountry(selectedCountry)
  const groups = groupMappedStreamsByCountry(streams)
  if (!code) {
    return {
      selectedCountry: null,
      selectedExists: false,
      selectedEmpty: false,
      country: null,
      visibleStreams: Array.isArray(streams) ? [...streams] : [],
    }
  }

  const country = groups.find((item) => item.countryCode === code) ?? null
  return {
    selectedCountry: code,
    selectedExists: Boolean(country),
    selectedEmpty: !country,
    country,
    visibleStreams: country ? [...country.streams] : [],
  }
}

function normalizeCountry(value) {
  const code = String(value ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(code) ? code : ''
}

function safeCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}
