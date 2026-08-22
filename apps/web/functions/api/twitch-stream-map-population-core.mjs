const CATEGORY_CONTRACT_VERSION = 'category-source-v1'
const ALLOWED_TOP_VALUES = new Set([20, 50, 100, 300])
const DEFAULT_TOP = 300

export function normalizeTwitchStreamMapPopulationQuery(input = {}) {
  const requestedTop = Number(input.top)
  const selectedTop = Number.isInteger(requestedTop) && ALLOWED_TOP_VALUES.has(requestedTop)
    ? requestedTop
    : DEFAULT_TOP
  const rawMinViewers = Number(input.minViewers)
  const minViewers = Number.isFinite(rawMinViewers) ? Math.max(0, Math.floor(rawMinViewers)) : 0
  const rawCategory = cleanString(input.category)
  const selectedCategory = !rawCategory || rawCategory.toLowerCase() === 'all'
    ? 'all'
    : rawCategory.slice(0, 160)
  return { selectedTop, minViewers, selectedCategory }
}

export function twitchStreamMapPopulationNeedsCategoryDictionary(payloadJson) {
  const payload = parsePayload(payloadJson)
  return payload.categoryContractVersion === CATEGORY_CONTRACT_VERSION && payload.categoryIds.length > 0
}

export function selectTwitchStreamMapPopulation({
  payloadJson,
  top,
  minViewers,
  category,
  categoryNames = new Map(),
}) {
  const query = normalizeTwitchStreamMapPopulationQuery({ top, minViewers, category })
  const payload = parsePayload(payloadJson)
  const categoryAvailable = payload.categoryContractVersion === CATEGORY_CONTRACT_VERSION
    && payload.categoryRefs.length === payload.rawItems.length

  const rows = payload.rawItems
    .map((raw, index) => normalizeRow(raw, index, payload, categoryNames))
    .filter(Boolean)
    .sort((left, right) => right.viewers - left.viewers || left.channelLogin.localeCompare(right.channelLogin))

  const topRows = rows.slice(0, query.selectedTop)
  const preCategoryRows = topRows.filter((row) => row.viewers >= query.minViewers)
  const availableCategories = summarizeCategories(preCategoryRows)
  const unknownCategoryStreams = preCategoryRows.filter((row) => !row.categoryId).length
  const dictionaryMissingItems = preCategoryRows.filter((row) => row.categoryId && !row.categoryNameResolved).length
  const categoryCoverageState = !categoryAvailable
    ? 'unavailable'
    : unknownCategoryStreams > 0 || dictionaryMissingItems > 0
      ? 'partial'
      : 'observed'

  const knownCategory = query.selectedCategory === 'all'
    || preCategoryRows.some((row) => row.categoryId === query.selectedCategory)
  const categoryState = query.selectedCategory === 'all'
    ? categoryAvailable ? 'all' : 'category_unavailable'
    : !categoryAvailable
      ? 'category_unavailable'
      : knownCategory
        ? 'selected'
        : 'unknown_category'

  const selectedRows = query.selectedCategory === 'all'
    ? preCategoryRows
    : categoryState === 'selected'
      ? preCategoryRows.filter((row) => row.categoryId === query.selectedCategory)
      : []

  const selectedPopulationViewers = selectedRows.reduce((sum, row) => sum + row.viewers, 0)
  const selectedPayload = {
    provider: payload.provider || 'twitch',
    bucketMinute: payload.bucketMinute,
    bucketMinutes: payload.bucketMinutes,
    items: selectedRows.map((row) => ({
      channelLogin: row.channelLogin,
      displayName: row.displayName,
      viewers: row.viewers,
    })),
  }

  return {
    payloadJson: JSON.stringify(selectedPayload),
    streamCount: selectedRows.length,
    totalViewers: selectedPopulationViewers,
    metadata: {
      implementationState: 'public',
      order: ['overall_top_n', 'min_viewers', 'category', 'placement', 'evidence_filters', 'country_drilldown'],
      baseObservedStreams: rows.length,
      selectedTop: query.selectedTop,
      minViewers: query.minViewers,
      selectedCategory: query.selectedCategory,
      selectedCategoryName: query.selectedCategory === 'all'
        ? 'All categories'
        : availableCategories.find((option) => option.id === query.selectedCategory)?.name ?? null,
      categoryState,
      categoryAvailable,
      categoryCoverageState,
      categoryContractVersion: payload.categoryContractVersion,
      topScopedStreams: topRows.length,
      preCategoryStreams: preCategoryRows.length,
      preCategoryViewers: preCategoryRows.reduce((sum, row) => sum + row.viewers, 0),
      selectedPopulationStreams: selectedRows.length,
      selectedPopulationViewers,
      unknownCategoryStreams,
      dictionaryMissingItems,
      availableCategories,
      languageFilterAvailable: false,
      languageUsedForPopulationFiltering: false,
    },
  }
}

function parsePayload(payloadJson) {
  let parsed = null
  try { parsed = JSON.parse(String(payloadJson ?? '')) } catch { parsed = null }
  const payload = object(parsed) ?? {}
  const rawItems = Array.isArray(payload.items) ? payload.items : Array.isArray(payload.data) ? payload.data : []
  const categoryIds = Array.isArray(payload.categoryIds)
    ? payload.categoryIds.map((value) => cleanString(value))
    : []
  const categoryRefs = Array.isArray(payload.categoryRefs)
    ? payload.categoryRefs.map((value) => Number.isInteger(value) && value >= 0 ? value : null)
    : []
  return {
    provider: cleanString(payload.provider),
    bucketMinute: cleanString(payload.bucketMinute) || null,
    bucketMinutes: nonNegativeIntegerOrNull(payload.bucketMinutes),
    rawItems,
    categoryContractVersion: cleanString(payload.categoryContractVersion) || null,
    categoryIds,
    categoryRefs,
  }
}

function normalizeRow(raw, index, payload, categoryNames) {
  const record = object(raw)
  if (!record) return null
  const channelLogin = normalizeLogin(record.channelLogin ?? record.user_login ?? record.login)
  const displayName = cleanString(record.displayName ?? record.user_name ?? record.name ?? channelLogin) || channelLogin || 'Unknown'
  const viewers = nonNegativeInteger(record.viewers ?? record.viewer_count ?? record.viewerCount)
  if (viewers <= 0) return null

  const ref = payload.categoryRefs[index]
  const categoryId = typeof ref === 'number' ? cleanString(payload.categoryIds[ref]) || null : null
  const resolvedName = categoryId ? cleanString(categoryNames.get(categoryId)) : ''
  return {
    channelLogin,
    displayName,
    viewers,
    categoryId,
    categoryName: categoryId ? resolvedName || categoryId : null,
    categoryNameResolved: Boolean(resolvedName),
  }
}

function summarizeCategories(rows) {
  const summary = new Map()
  for (const row of rows) {
    if (!row.categoryId) continue
    const current = summary.get(row.categoryId) ?? {
      id: row.categoryId,
      name: row.categoryName || row.categoryId,
      streamCount: 0,
      totalViewers: 0,
    }
    current.streamCount += 1
    current.totalViewers += row.viewers
    summary.set(row.categoryId, current)
  }
  return [...summary.values()].sort((left, right) =>
    right.totalViewers - left.totalViewers
    || right.streamCount - left.streamCount
    || left.name.localeCompare(right.name)
    || left.id.localeCompare(right.id))
}

function object(value) {
  return typeof value === 'object' && value !== null ? value : null
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeLogin(value) {
  return cleanString(value).toLowerCase().replace(/[^a-z0-9_]/g, '')
}

function nonNegativeInteger(value) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function nonNegativeIntegerOrNull(value) {
  if (value == null) return null
  return nonNegativeInteger(value)
}
