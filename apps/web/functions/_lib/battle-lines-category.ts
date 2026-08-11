import {
  buildTimeline,
  normalizeDisplayBucket,
  type BattlePeriod,
  type BattleSourceItem,
  type BattleSourceRow,
  type RequestedBattleBucket,
} from './battle-lines-core'

export const BATTLE_CATEGORY_CONTRACT_VERSION = 'category-source-v1'

export type KickBattleCategorySnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

export type KickBattleCategoryDictionaryRow = {
  category_id: string
  category_name: string
  contract_version: string
}

export type BattleCategoryState = 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
export type BattleCategoryCoverageState = 'observed' | 'partial' | 'unavailable'

export type BattleCategoryOption = {
  id: string
  name: string
  streamCount: number
  viewerMinutes: number
  peakViewers: number
  observedBuckets: number
}

export type BattleCategoryBucketCoverage = {
  bucket: string
  state: BattleCategoryCoverageState
  observedRows: number
  partialRows: number
  unavailableRows: number
  totalRows: number
}

export type KickBattleCategoryProjection = {
  rows: BattleSourceRow[]
  selectedCategory: string
  state: BattleCategoryState
  coverageState: BattleCategoryCoverageState
  availableCategories: BattleCategoryOption[]
  bucketCoverage: BattleCategoryBucketCoverage[]
  coverageCounts: { observed: number; partial: number; unavailable: number }
  candidateCount: number
  retainedItemCount: number
  observedItems: number
  missingItems: number
  dictionaryMissingItems: number
  contractRows: number
}

type ParsedPayload = {
  rawItems: unknown[]
  categoryContractVersion: string | null
  categoryIds: string[]
  categoryRefs: Array<number | null>
}

type NormalizedItem = BattleSourceItem & { rawIndex: number }
type ResolvedItem = NormalizedItem & { categoryId: string | null; categoryAvailable: boolean }
type ParsedRow = {
  source: KickBattleCategorySnapshotRow
  items: ResolvedItem[]
  contractAvailable: boolean
  rowCoverage: BattleCategoryCoverageState
}

type CategoryAccumulator = {
  id: string
  name: string
  streamIds: Set<string>
  viewerMinutes: number
  peakByBucket: Map<string, number>
  observedBuckets: Set<string>
}

export function normalizeBattleCategory(value: string | null): string {
  const normalized = value?.trim() ?? ''
  return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160)
}

export function projectKickBattleLinesCategory(options: {
  rows: KickBattleCategorySnapshotRow[]
  dictionaryRows: KickBattleCategoryDictionaryRow[]
  selectedCategory: string
  requestedBucket: RequestedBattleBucket
  period: BattlePeriod
  sampleIntervalMinutes?: number
}): KickBattleCategoryProjection {
  const sampleIntervalMinutes = options.sampleIntervalMinutes ?? 5
  const displayBucket = normalizeDisplayBucket(options.requestedBucket, sampleIntervalMinutes)
  const displayBucketMinutes = displayBucket === '10m' ? 10 : 5
  const timeline = buildTimeline(options.period.from, options.period.to, displayBucketMinutes)
  const bucketIndex = new Map(timeline.map((bucket, index) => [bucket, index]))
  const dictionary = new Map(
    options.dictionaryRows
      .filter((row) => row.contract_version === BATTLE_CATEGORY_CONTRACT_VERSION && string(row.category_id))
      .map((row) => [string(row.category_id), string(row.category_name) || string(row.category_id)]),
  )
  const knownCategoryIds = new Set(dictionary.keys())
  const categoryStats = new Map<string, CategoryAccumulator>()
  const bucketStats = timeline.map(() => ({ rows: 0, observed: 0, partial: 0, unavailable: 0 }))
  const parsedRows: ParsedRow[] = []
  let observedItems = 0
  let missingItems = 0
  let dictionaryMissingItems = 0
  let contractRows = 0

  for (const source of options.rows) {
    const parsed = parsePayload(source.payload_json)
    const normalized = normalizeItems(parsed.rawItems)
    const contractAvailable = parsed.categoryContractVersion === BATTLE_CATEGORY_CONTRACT_VERSION
      && parsed.categoryRefs.length === parsed.rawItems.length
    let rowPartial = false
    if (contractAvailable) contractRows += 1

    const items = normalized.map((item): ResolvedItem => {
      if (!contractAvailable) {
        missingItems += 1
        return { ...item, categoryId: null, categoryAvailable: false }
      }
      const ref = parsed.categoryRefs[item.rawIndex]
      const categoryId = Number.isInteger(ref) && (ref ?? -1) >= 0 ? parsed.categoryIds[ref as number] || null : null
      if (!categoryId) {
        missingItems += 1
        rowPartial = true
        return { ...item, categoryId: null, categoryAvailable: false }
      }
      knownCategoryIds.add(categoryId)
      observedItems += 1
      if (!dictionary.has(categoryId)) {
        dictionaryMissingItems += 1
        rowPartial = true
      }
      updateCategory(categoryStats, categoryId, dictionary.get(categoryId) ?? categoryId, item, source.bucket_minute, sampleIntervalMinutes)
      return { ...item, categoryId, categoryAvailable: true }
    })

    const rowCoverage: BattleCategoryCoverageState = !contractAvailable
      ? 'unavailable'
      : rowPartial
        ? 'partial'
        : 'observed'
    parsedRows.push({ source, items, contractAvailable, rowCoverage })

    const displayKey = floorToBucket(source.bucket_minute, displayBucketMinutes)
    const index = bucketIndex.get(displayKey)
    if (index !== undefined) {
      bucketStats[index].rows += 1
      bucketStats[index][rowCoverage] += 1
    }
  }

  const bucketCoverage: BattleCategoryBucketCoverage[] = bucketStats.map((stats, index) => ({
    bucket: timeline[index],
    state: bucketCoverageState(stats),
    observedRows: stats.observed,
    partialRows: stats.partial,
    unavailableRows: stats.unavailable,
    totalRows: stats.rows,
  }))
  const coverageCounts = {
    observed: bucketCoverage.filter((bucket) => bucket.state === 'observed').length,
    partial: bucketCoverage.filter((bucket) => bucket.state === 'partial').length,
    unavailable: bucketCoverage.filter((bucket) => bucket.state === 'unavailable').length,
  }
  const coverageState = aggregateCoverageState(bucketCoverage)
  const availableCategories = summarizeCategories(categoryStats)
  const state: BattleCategoryState = options.selectedCategory === 'all'
    ? 'all'
    : coverageState === 'unavailable'
      ? 'category_unavailable'
      : knownCategoryIds.has(options.selectedCategory)
        ? 'selected'
        : 'unknown_category'

  const candidateIds = new Set<string>()
  if (state === 'selected') {
    for (const row of parsedRows) {
      for (const item of row.items) {
        if (item.categoryAvailable && item.categoryId === options.selectedCategory) candidateIds.add(item.id)
      }
    }
  }

  let retainedItemCount = 0
  const projectedRows: BattleSourceRow[] = parsedRows.map((row) => {
    const items: BattleSourceItem[] = []
    if (state === 'selected') {
      for (const item of row.items) {
        if (!candidateIds.has(item.id)) continue
        const pointState = !item.categoryAvailable
          ? 'category_unavailable' as const
          : item.categoryId === options.selectedCategory
            ? undefined
            : 'outside_category' as const
        items.push({
          id: item.id,
          name: item.name,
          title: item.title,
          url: item.url,
          viewers: item.viewers,
          ...(pointState ? { pointState } : {}),
        })
      }
    }
    retainedItemCount += items.length
    return {
      bucketMinute: row.source.bucket_minute,
      collectedAt: row.source.collected_at,
      sourceMode: row.source.source_mode,
      items,
    }
  })

  return {
    rows: projectedRows,
    selectedCategory: options.selectedCategory,
    state,
    coverageState,
    availableCategories,
    bucketCoverage,
    coverageCounts,
    candidateCount: candidateIds.size,
    retainedItemCount,
    observedItems,
    missingItems,
    dictionaryMissingItems,
    contractRows,
  }
}

function parsePayload(payloadJson: string): ParsedPayload {
  const parsed = safeJson(payloadJson)
  const record = object(parsed) ?? {}
  return {
    rawItems: Array.isArray(record.items) ? record.items : Array.isArray(record.data) ? record.data : [],
    categoryContractVersion: string(record.categoryContractVersion) || null,
    categoryIds: Array.isArray(record.categoryIds) ? record.categoryIds.map((value) => string(value)).filter(Boolean) : [],
    categoryRefs: Array.isArray(record.categoryRefs)
      ? record.categoryRefs.map((value) => Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null)
      : [],
  }
}

function normalizeItems(rawItems: unknown[]): NormalizedItem[] {
  const output: NormalizedItem[] = []
  rawItems.forEach((raw, rawIndex) => {
    const record = object(raw)
    if (!record) return
    const channel = object(record.channel)
    const live = object(record.livestream)
    const rawId = string(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
    const id = slug(rawId || string(record.displayName ?? record.name))
    const viewers = safeViewer(record.viewers ?? record.viewer_count ?? record.viewerCount ?? live?.viewer_count)
    if (!id || viewers <= 0) return
    output.push({
      rawIndex,
      id,
      name: string(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? id) || id,
      title: string(record.title ?? record.session_title ?? record.stream_title ?? live?.session_title),
      url: string(record.url) || `https://kick.com/${id}`,
      viewers,
    })
  })
  return output
}

function updateCategory(
  categories: Map<string, CategoryAccumulator>,
  categoryId: string,
  categoryName: string,
  item: NormalizedItem,
  bucketMinute: string,
  sampleIntervalMinutes: number,
): void {
  const category = categories.get(categoryId) ?? {
    id: categoryId,
    name: categoryName,
    streamIds: new Set<string>(),
    viewerMinutes: 0,
    peakByBucket: new Map<string, number>(),
    observedBuckets: new Set<string>(),
  }
  category.name = categoryName
  category.streamIds.add(item.id)
  category.viewerMinutes += item.viewers * sampleIntervalMinutes
  category.peakByBucket.set(bucketMinute, (category.peakByBucket.get(bucketMinute) ?? 0) + item.viewers)
  category.observedBuckets.add(bucketMinute)
  categories.set(categoryId, category)
}

function summarizeCategories(categories: Map<string, CategoryAccumulator>): BattleCategoryOption[] {
  return [...categories.values()]
    .map((category) => ({
      id: category.id,
      name: category.name,
      streamCount: category.streamIds.size,
      viewerMinutes: Math.round(category.viewerMinutes),
      peakViewers: Math.max(0, ...category.peakByBucket.values()),
      observedBuckets: category.observedBuckets.size,
    }))
    .filter((category) => category.viewerMinutes > 0)
    .sort((a, b) => b.viewerMinutes - a.viewerMinutes || b.peakViewers - a.peakViewers || a.name.localeCompare(b.name))
}

function bucketCoverageState(stats: { rows: number; observed: number; partial: number; unavailable: number }): BattleCategoryCoverageState {
  if (stats.rows === 0 || stats.unavailable === stats.rows) return 'unavailable'
  if (stats.partial > 0 || stats.unavailable > 0) return 'partial'
  return 'observed'
}

function aggregateCoverageState(bucketCoverage: BattleCategoryBucketCoverage[]): BattleCategoryCoverageState {
  if (bucketCoverage.length === 0 || bucketCoverage.every((bucket) => bucket.state === 'unavailable')) return 'unavailable'
  if (bucketCoverage.some((bucket) => bucket.state !== 'observed')) return 'partial'
  return 'observed'
}

function floorToBucket(iso: string, minutes: number): string {
  const date = new Date(iso)
  const minute = date.getUTCMinutes()
  date.setUTCMinutes(minute - (minute % minutes), 0, 0)
  return date.toISOString()
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function object(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : null
}

function string(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function safeViewer(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
