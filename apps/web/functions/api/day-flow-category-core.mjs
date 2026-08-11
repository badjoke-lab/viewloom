const CATEGORY_CONTRACT_VERSION = 'category-source-v1'

export function projectDayFlowCategory({
  rows,
  buckets,
  bucketSize,
  selectedCategory,
  categoryNames,
  provider = 'twitch',
  bucketAggregation = 'max',
}) {
  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket, index]))
  const totals = Array(buckets.length).fill(0)
  const totalSums = Array(buckets.length).fill(0)
  const totalCounts = Array(buckets.length).fill(0)
  const allStreams = new Map()
  const selectedStreams = new Map()
  const categoryStreams = new Map()
  const bucketStats = buckets.map(() => ({ rows: 0, observed: 0, partial: 0, unavailable: 0 }))
  let observedItems = 0
  let missingItems = 0
  let dictionaryMissingItems = 0
  let contractRows = 0

  for (const row of rows) {
    const bucket = floorToBucket(row.bucket_minute, bucketSize)
    const index = bucketIndex.get(bucket)
    if (index == null) continue

    const parsed = parsePayload(row.payload_json)
    const normalized = normalizeItems(parsed.rawItems, provider)
    if (bucketAggregation === 'average') {
      if (normalized.length > 0) {
        totalSums[index] += normalized.reduce((sum, item) => sum + item.viewers, 0)
        totalCounts[index] += 1
      }
    } else {
      totals[index] = Math.max(totals[index] ?? 0, safeViewer(row.total_viewers))
    }
    bucketStats[index].rows += 1

    for (const item of normalized) updateStream(allStreams, item, index, buckets.length, bucketAggregation)

    const contractAvailable = parsed.categoryContractVersion === CATEGORY_CONTRACT_VERSION
      && parsed.categoryRefs.length === parsed.rawItems.length
    if (!contractAvailable) {
      bucketStats[index].unavailable += 1
      missingItems += normalized.length
      continue
    }

    contractRows += 1
    let rowPartial = false
    for (const item of normalized) {
      const ref = parsed.categoryRefs[item.rawIndex]
      const categoryId = Number.isInteger(ref) && ref >= 0 ? parsed.categoryIds[ref] || null : null
      if (!categoryId) {
        missingItems += 1
        rowPartial = true
        continue
      }
      const categoryName = categoryNames.get(categoryId)
      if (!categoryName) {
        dictionaryMissingItems += 1
        rowPartial = true
        continue
      }

      observedItems += 1
      updateCategoryStream(categoryStreams, categoryId, categoryName, item, index, buckets.length, bucketAggregation)
      if (selectedCategory !== 'all' && categoryId === selectedCategory) {
        updateStream(selectedStreams, item, index, buckets.length, bucketAggregation)
      }
    }

    if (rowPartial) bucketStats[index].partial += 1
    else bucketStats[index].observed += 1
  }

  if (bucketAggregation === 'average') {
    for (let index = 0; index < totals.length; index += 1) {
      totals[index] = totalCounts[index] > 0 ? Math.round(totalSums[index] / totalCounts[index]) : 0
    }
  }

  const bucketCoverage = bucketStats.map((stats, index) => ({
    bucket: buckets[index],
    state: coverageState(stats),
    observedRows: stats.observed,
    partialRows: stats.partial,
    unavailableRows: stats.unavailable,
    totalRows: stats.rows,
  }))
  const availableCategories = summarizeCategories(categoryStreams, bucketSize, bucketAggregation)
  const categoryBuckets = bucketCoverage.filter((bucket) => bucket.state !== 'unavailable').length
  const filterState = selectedCategory === 'all'
    ? 'all'
    : categoryBuckets === 0
      ? 'category_unavailable'
      : availableCategories.some((category) => category.id === selectedCategory)
        ? 'selected'
        : 'unknown_category'
  const streams = selectedCategory === 'all'
    ? [...allStreams.entries()].map((entry) => toStreamRecord(entry, bucketAggregation))
    : filterState === 'selected'
      ? [...selectedStreams.entries()].map((entry) => toStreamRecord(entry, bucketAggregation))
      : []
  const aggregateCoverage = aggregateCoverageState(bucketCoverage)

  return {
    totals,
    streams,
    categoryFilter: {
      contractVersion: contractRows > 0 ? CATEGORY_CONTRACT_VERSION : null,
      selectedCategory,
      state: filterState,
      coverageState: aggregateCoverage,
      observedItems,
      missingItems,
      dictionaryMissingItems,
      filterBeforeTopN: true,
      membershipEvaluation: 'per_observed_snapshot',
      latestCategoryBackProjectionAllowed: false,
      fullShareDenominator: `all_observed_${provider}_viewers_per_bucket`,
      topFocusShareDenominator: 'displayed_selected_category_top_n_viewers_per_bucket',
      availableCategories,
      bucketCoverage,
      coverageCounts: {
        observed: bucketCoverage.filter((bucket) => bucket.state === 'observed').length,
        partial: bucketCoverage.filter((bucket) => bucket.state === 'partial').length,
        unavailable: bucketCoverage.filter((bucket) => bucket.state === 'unavailable').length,
      },
    },
  }
}

export function parsePayload(payloadJson) {
  let parsed
  try { parsed = JSON.parse(payloadJson) } catch { parsed = {} }
  const record = parsed && typeof parsed === 'object' ? parsed : {}
  return {
    rawItems: Array.isArray(record.items) ? record.items : Array.isArray(record.data) ? record.data : [],
    categoryContractVersion: string(record.categoryContractVersion) || null,
    categoryIds: Array.isArray(record.categoryIds) ? record.categoryIds.map((value) => string(value)).filter(Boolean) : [],
    categoryRefs: Array.isArray(record.categoryRefs)
      ? record.categoryRefs.map((value) => Number.isInteger(value) && value >= 0 ? value : null)
      : [],
  }
}

function normalizeItems(rawItems, provider) {
  const result = []
  rawItems.forEach((raw, rawIndex) => {
    if (!raw || typeof raw !== 'object') return
    const channel = raw.channel && typeof raw.channel === 'object' ? raw.channel : {}
    const live = raw.livestream && typeof raw.livestream === 'object' ? raw.livestream : {}
    const identity = provider === 'kick'
      ? raw.channelLogin ?? raw.slug ?? raw.username ?? raw.user_slug ?? channel.slug ?? channel.username ?? channel.name
      : raw.channelLogin ?? raw.id ?? raw.login ?? raw.user_login ?? raw.name
    const id = slug(string(identity))
    const viewers = safeViewer(provider === 'kick'
      ? raw.viewers ?? raw.viewer_count ?? raw.viewerCount ?? live.viewer_count
      : raw.viewers ?? raw.viewer_count ?? raw.viewerCount)
    if (!id || viewers <= 0) return
    const name = provider === 'kick'
      ? string(raw.displayName ?? raw.name ?? raw.username ?? channel.displayName ?? channel.name ?? channel.username ?? id) || id
      : string(raw.displayName ?? raw.name ?? raw.user_name ?? raw.channelLogin ?? id) || id
    const title = provider === 'kick'
      ? string(raw.title ?? raw.session_title ?? raw.stream_title ?? live.session_title)
      : string(raw.title ?? raw.streamTitle ?? raw.gameName)
    const url = string(raw.url) || (provider === 'kick' ? `https://kick.com/${id}` : `https://www.twitch.tv/${id}`)
    result.push({ rawIndex, id, name, title, url, viewers })
  })
  return result
}

function updateStream(map, item, index, bucketCount, bucketAggregation) {
  const entry = map.get(item.id) ?? {
    name: item.name,
    title: item.title,
    url: item.url,
    values: Array(bucketCount).fill(0),
    sums: Array(bucketCount).fill(0),
    counts: Array(bucketCount).fill(0),
  }
  entry.name = item.name
  entry.title = item.title
  entry.url = item.url
  if (bucketAggregation === 'average') {
    entry.sums[index] += item.viewers
    entry.counts[index] += 1
  } else {
    entry.values[index] = Math.max(entry.values[index] ?? 0, item.viewers)
  }
  map.set(item.id, entry)
}

function streamValues(stream, bucketAggregation) {
  if (bucketAggregation !== 'average') return stream.values
  return stream.sums.map((sum, index) => stream.counts[index] > 0 ? Math.round(sum / stream.counts[index]) : 0)
}

function updateCategoryStream(categoryStreams, categoryId, categoryName, item, index, bucketCount, bucketAggregation) {
  const category = categoryStreams.get(categoryId) ?? { id: categoryId, name: categoryName, streams: new Map() }
  updateStream(category.streams, item, index, bucketCount, bucketAggregation)
  categoryStreams.set(categoryId, category)
}

function summarizeCategories(categoryStreams, bucketSize, bucketAggregation) {
  return [...categoryStreams.values()].map((category) => {
    const streams = [...category.streams.values()].map((stream) => ({ ...stream, values: streamValues(stream, bucketAggregation) }))
    const bucketCount = streams[0]?.values.length ?? 0
    const totals = Array.from({ length: bucketCount }, (_, index) => streams.reduce((sum, stream) => sum + (stream.values[index] ?? 0), 0))
    return {
      id: category.id,
      name: category.name,
      streamCount: streams.length,
      viewerMinutes: Math.round(streams.reduce((sum, stream) => sum + stream.values.reduce((inner, viewers) => inner + viewers * bucketSize, 0), 0)),
      peakViewers: Math.max(0, ...totals),
      observedBuckets: totals.filter((value) => value > 0).length,
    }
  }).filter((category) => category.viewerMinutes > 0)
    .sort((a, b) => b.viewerMinutes - a.viewerMinutes || b.peakViewers - a.peakViewers || a.name.localeCompare(b.name))
}

function coverageState(stats) {
  if (stats.rows === 0 || stats.unavailable === stats.rows) return 'unavailable'
  if (stats.partial > 0 || stats.unavailable > 0) return 'partial'
  return 'observed'
}

function aggregateCoverageState(bucketCoverage) {
  if (bucketCoverage.length === 0 || bucketCoverage.every((bucket) => bucket.state === 'unavailable')) return 'unavailable'
  if (bucketCoverage.some((bucket) => bucket.state !== 'observed')) return 'partial'
  return 'observed'
}

function toStreamRecord([id, stream], bucketAggregation) {
  return {
    id,
    name: stream.name,
    title: stream.title,
    url: stream.url,
    values: streamValues(stream, bucketAggregation),
  }
}

function floorToBucket(iso, bucketSize) {
  const date = new Date(iso)
  const minutes = date.getUTCMinutes()
  date.setUTCMinutes(minutes - (minutes % bucketSize), 0, 0)
  return date.toISOString()
}

function safeViewer(value) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function string(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function slug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
