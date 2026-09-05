const MISSING_REGION = '__none__'

export function cityAggregateKeyFromStream(stream) {
  const city = clean(stream?.location?.cities?.[0])
  if (!city) return ''
  const countryCode = clean(stream?.location?.countryCode).toUpperCase()
  if (!countryCode) return ''
  const region = clean(stream?.location?.regions?.[0])
  return [countryCode, normalize(region) || MISSING_REGION, normalize(city)].join('|')
}

export function groupCityMappedStreams(streams) {
  const groups = new Map()

  for (const stream of Array.isArray(streams) ? streams : []) {
    const key = cityAggregateKeyFromStream(stream)
    if (!key) continue

    const city = clean(stream?.location?.cities?.[0])
    const region = clean(stream?.location?.regions?.[0])
    const countryCode = clean(stream?.location?.countryCode).toUpperCase()
    const countryName = clean(stream?.location?.countryName) || countryCode
    const current = groups.get(key) ?? {
      key,
      city,
      region: region || null,
      countryCode,
      countryName,
      label: [city, region, countryName].filter(Boolean).join(' · '),
      streams: [],
      viewers: 0,
      sourceCounts: {},
    }

    current.streams.push(stream)
    current.viewers += count(stream?.viewers)
    for (const source of uniqueStrings(stream?.sources)) {
      current.sourceCounts[source] = (current.sourceCounts[source] ?? 0) + 1
    }
    groups.set(key, current)
  }

  return [...groups.values()].sort((a, b) => b.viewers - a.viewers || a.label.localeCompare(b.label) || a.key.localeCompare(b.key))
}

export function citySelectionState(streams, selectedKey) {
  const aggregates = groupCityMappedStreams(streams)
  const normalizedSelected = clean(selectedKey)
  if (!normalizedSelected) {
    return {
      selectedKey: null,
      selectedExists: false,
      selectedEmpty: false,
      aggregate: null,
      aggregates,
      visibleStreams: [...(Array.isArray(streams) ? streams : [])],
    }
  }

  const aggregate = aggregates.find((item) => item.key === normalizedSelected) ?? null
  return {
    selectedKey: normalizedSelected,
    selectedExists: Boolean(aggregate),
    selectedEmpty: !aggregate,
    aggregate,
    aggregates,
    visibleStreams: aggregate ? [...aggregate.streams] : [],
  }
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(clean).filter(Boolean))]
}

function normalize(value) {
  return clean(value).normalize('NFKC').toLocaleLowerCase('en-US')
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function count(value) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}
