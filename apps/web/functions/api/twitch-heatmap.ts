import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'

type SnapshotRow = {
  provider: string
  bucket_minute: string
  collected_at: string
  covered_pages: number
  has_more: number
  stream_count: number
  total_viewers: number
  payload_json: string
  source_mode: string
}

type StatusRow = {
  provider: string
  status: string
  last_attempt_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_error: string | null
  latest_bucket_minute: string | null
  latest_collected_at: string | null
  latest_stream_count: number
  latest_total_viewers: number
  covered_pages: number
  has_more: number
  updated_at: string
}

type CategoryRow = {
  category_id: string
  category_name: string
  contract_version: string
}

type HeatmapItem = {
  id: string
  name: string
  title: string
  viewers: number
  momentum: number
  activity: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
  url: string
  categoryId: string | null
  categoryName: string | null
}

type CategoryOption = {
  id: string
  name: string
  streamCount: number
  totalViewers: number
}

type State = 'not_ready' | 'empty' | 'stale' | 'live' | 'error'
type CategoryFilterState = 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
type CategoryCoverageState = 'observed' | 'partial' | 'unavailable'

type ParsedPayload = {
  rawItems: unknown[]
  bucketMinutes: number | null
  payloadBucketMinute: string | null
  categoryContractVersion: string | null
  categoryIds: string[]
  categoryRefs: Array<number | null>
}

const runtime = providerRuntime('twitch')
const ACTIVITY_UNAVAILABLE_REASON = 'chat_sampling_not_connected'
const CATEGORY_CONTRACT_VERSION = 'category-source-v1'
const ALLOWED_TOP_VALUES = new Set([20, 50, 100])

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const latest = await env.DB_TWITCH_HOT.prepare(
      `
      SELECT
        provider,
        bucket_minute,
        collected_at,
        covered_pages,
        has_more,
        stream_count,
        total_viewers,
        payload_json,
        source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
      `
    )
      .bind('twitch')
      .first<SnapshotRow>()

    const status = await env.DB_TWITCH_HOT.prepare(
      `
      SELECT
        provider,
        status,
        last_attempt_at,
        last_success_at,
        last_failure_at,
        last_error,
        latest_bucket_minute,
        latest_collected_at,
        latest_stream_count,
        latest_total_viewers,
        covered_pages,
        has_more,
        updated_at
      FROM collector_status
      WHERE provider = ?
      LIMIT 1
      `
    )
      .bind('twitch')
      .first<StatusRow>()

    const parsed = parsePayload(latest?.payload_json ?? '')
    const dictionaryResult = parsed.categoryIds.length > 0
      ? await env.DB_TWITCH_HOT.prepare(
        `
        SELECT category_id, category_name, contract_version
        FROM provider_category_dictionary
        WHERE provider = ?
        ORDER BY category_name COLLATE NOCASE, category_id
        `
      ).bind('twitch').all<CategoryRow>()
      : { results: [] as CategoryRow[] }
    const dictionaryRows = Array.isArray(dictionaryResult.results) ? dictionaryResult.results : []
    const categoryNames = new Map(dictionaryRows.map((row) => [row.category_id, row.category_name]))
    const allItems = normalizeItems(parsed, categoryNames).sort((a, b) => b.viewers - a.viewers || a.name.localeCompare(b.name))
    const availableCategories = summarizeCategories(allItems)
    const categoryAvailable = parsed.categoryContractVersion === CATEGORY_CONTRACT_VERSION
      && parsed.categoryRefs.length === parsed.rawItems.length
    const categoryObservedItems = allItems.filter((value) => value.categoryId !== null).length
    const categoryMissingItems = Math.max(0, allItems.length - categoryObservedItems)
    const dictionaryMissingItems = allItems.filter((value) => value.categoryId !== null && !categoryNames.has(value.categoryId)).length
    const categoryCoverageState: CategoryCoverageState = !categoryAvailable
      ? 'unavailable'
      : categoryMissingItems > 0 || dictionaryMissingItems > 0
        ? 'partial'
        : 'observed'

    const url = new URL(request.url)
    const requestedCategory = normalizeCategory(url.searchParams.get('category'))
    const requestedTop = normalizeTop(url.searchParams.get('top'))
    const knownCategory = requestedCategory === 'all'
      || availableCategories.some((option) => option.id === requestedCategory)
    const categoryFilterState: CategoryFilterState = requestedCategory === 'all'
      ? categoryAvailable ? 'all' : 'category_unavailable'
      : !categoryAvailable
        ? 'category_unavailable'
        : knownCategory
          ? 'selected'
          : 'unknown_category'

    const categoryFilteredItems = categoryFilterState === 'selected'
      ? allItems.filter((value) => value.categoryId === requestedCategory)
      : categoryFilterState === 'unknown_category'
        ? []
        : categoryFilterState === 'category_unavailable' && requestedCategory !== 'all'
          ? []
          : allItems
    const items = requestedTop === null ? categoryFilteredItems : categoryFilteredItems.slice(0, requestedTop)

    const updatedAt = latest?.collected_at || latest?.bucket_minute || status?.latest_collected_at || status?.latest_bucket_minute || new Date().toISOString()
    const stale = Date.now() - new Date(updatedAt).getTime() > runtime.staleAfterMinutes * 60 * 1000
    const state: State = !latest ? 'empty' : allItems.length === 0 ? 'empty' : stale ? 'stale' : 'live'
    const hasMore = Boolean(latest?.has_more ?? status?.has_more)
    const coveredPages = latest?.covered_pages ?? status?.covered_pages ?? 0
    const streamCount = latest?.stream_count ?? status?.latest_stream_count ?? allItems.length
    const totalViewers = latest?.total_viewers ?? status?.latest_total_viewers ?? allItems.reduce((sum, value) => sum + value.viewers, 0)
    const bucketAligned = latest ? isAligned(latest.bucket_minute, runtime.collectionCadenceMinutes) : false
    const ingestFreshnessWarning = warnings(state, latest, parsed, bucketAligned)

    return Response.json({
      ok: true,
      source: 'api',
      provider: 'twitch',
      platform: 'twitch',
      state,
      status: state,
      updatedAt,
      valueMode: 'viewers',
      targetSource: 'twitch-helix-streams',
      coverageMode: hasMore ? 'partial-top-pages' : 'observed-top-pages',
      expectedBucketMinutes: runtime.collectionCadenceMinutes,
      bucketMinutes: parsed.bucketMinutes,
      payloadBucketMinute: parsed.payloadBucketMinute,
      bucketAligned,
      ingestFreshnessWarning,
      activityAvailable: false,
      activitySampled: false,
      activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
      items,
      categoryFilter: {
        implementationState: 'hidden',
        publicExposureAuthorized: false,
        contractVersion: parsed.categoryContractVersion,
        available: categoryAvailable,
        coverageState: categoryCoverageState,
        selectedCategory: requestedCategory,
        state: categoryFilterState,
        filterBeforeTopN: true,
        requestedTop,
        observedItems: categoryObservedItems,
        missingItems: categoryMissingItems,
        dictionaryMissingItems,
        availableCategories,
      },
      availableCategories,
      coverageNote: latest
        ? `${items.length} visible of ${allItems.length} normalized Twitch streams from latest observed snapshot. covered_pages=${coveredPages}. has_more=${hasMore ? 1 : 0}. category=${requestedCategory}. category_state=${categoryFilterState}.`
        : 'No Twitch snapshots exist in DB_TWITCH_HOT yet.',
      notes: [
        'storage=DB_TWITCH_HOT',
        `source_mode=${latest?.source_mode || 'unknown'}`,
        `bucket_minute=${latest?.bucket_minute || 'none'}`,
        `payload_bucket_minute=${parsed.payloadBucketMinute || 'none'}`,
        `bucket_minutes=${parsed.bucketMinutes ?? 'unknown'}`,
        `expected_bucket_minutes=${runtime.collectionCadenceMinutes}`,
        `bucket_aligned=${bucketAligned}`,
        ...ingestFreshnessWarning.map((value) => `warning=${value}`),
        `covered_pages=${coveredPages}`,
        `has_more=${hasMore ? 1 : 0}`,
        `stream_count=${streamCount}`,
        `total_viewers=${totalViewers}`,
        `top_limit=${runtime.topLimit}`,
        'target_source=twitch-helix-streams',
        `coverage_mode=${hasMore ? 'partial-top-pages' : 'observed-top-pages'}`,
        'activity_available=false',
        `activity_unavailable_reason=${ACTIVITY_UNAVAILABLE_REASON}`,
        `category_contract_version=${parsed.categoryContractVersion || 'none'}`,
        `category_available=${categoryAvailable}`,
        `category_coverage_state=${categoryCoverageState}`,
        `category_filter_state=${categoryFilterState}`,
        `category_selected=${requestedCategory}`,
        `category_filter_before_top_n=true`,
        `category_requested_top=${requestedTop ?? 'none'}`,
        'category_filter_public_exposure=false',
      ],
      latest,
      collectorStatus: status,
      statusRecord: status,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return Response.json({
      ok: false,
      source: 'api',
      provider: 'twitch',
      platform: 'twitch',
      state: 'error',
      status: 'error',
      updatedAt: new Date().toISOString(),
      valueMode: 'viewers',
      targetSource: 'twitch-helix-streams',
      coverageMode: 'unknown',
      expectedBucketMinutes: runtime.collectionCadenceMinutes,
      bucketMinutes: null,
      payloadBucketMinute: null,
      bucketAligned: false,
      ingestFreshnessWarning: ['api_read_error'],
      activityAvailable: false,
      activitySampled: false,
      activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
      items: [] as HeatmapItem[],
      categoryFilter: {
        implementationState: 'hidden',
        publicExposureAuthorized: false,
        contractVersion: null,
        available: false,
        coverageState: 'unavailable',
        selectedCategory: 'all',
        state: 'category_unavailable',
        filterBeforeTopN: true,
        requestedTop: null,
        observedItems: 0,
        missingItems: 0,
        dictionaryMissingItems: 0,
        availableCategories: [] as CategoryOption[],
      },
      availableCategories: [] as CategoryOption[],
      coverageNote: 'Twitch Heatmap API could not read DB_TWITCH_HOT snapshots.',
      notes: [error instanceof Error ? error.message : String(error)],
      latest: null,
      collectorStatus: null,
      statusRecord: null,
    }, { status: 500, headers: { 'cache-control': 'no-store' } })
  }
}

function parsePayload(payloadJson: string): ParsedPayload {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  const rawBucketMinutes = record?.bucketMinutes
  const bucketMinutes = typeof rawBucketMinutes === 'number' && Number.isFinite(rawBucketMinutes) ? rawBucketMinutes : null
  const payloadBucketMinute = str(record?.bucketMinute) || null
  const categoryContractVersion = str(record?.categoryContractVersion) || null
  const categoryIds = Array.isArray(record?.categoryIds)
    ? record.categoryIds.map((value) => str(value)).filter(Boolean)
    : []
  const categoryRefs = Array.isArray(record?.categoryRefs)
    ? record.categoryRefs.map((value) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null)
    : []
  return { rawItems, bucketMinutes, payloadBucketMinute, categoryContractVersion, categoryIds, categoryRefs }
}

function normalizeItems(payload: ParsedPayload, categoryNames: Map<string, string>): HeatmapItem[] {
  return payload.rawItems.map((raw, index) => {
    const ref = payload.categoryRefs[index]
    const categoryId = typeof ref === 'number' ? payload.categoryIds[ref] || null : null
    const categoryName = categoryId ? categoryNames.get(categoryId) || categoryId : null
    return item(raw, categoryId, categoryName)
  }).filter((value): value is HeatmapItem => value !== null)
}

function summarizeCategories(items: HeatmapItem[]): CategoryOption[] {
  const summary = new Map<string, CategoryOption>()
  for (const value of items) {
    if (!value.categoryId || !value.categoryName) continue
    const current = summary.get(value.categoryId) ?? {
      id: value.categoryId,
      name: value.categoryName,
      streamCount: 0,
      totalViewers: 0,
    }
    current.streamCount += 1
    current.totalViewers += value.viewers
    summary.set(value.categoryId, current)
  }
  return [...summary.values()].sort((a, b) => b.totalViewers - a.totalViewers || b.streamCount - a.streamCount || a.name.localeCompare(b.name))
}

function warnings(state: State, latest: SnapshotRow | null, payload: ParsedPayload, bucketAligned: boolean): string[] {
  const result: string[] = []
  if (!latest) return ['no_twitch_snapshot']
  if (state === 'stale') result.push('twitch_collector_stale')
  if (!bucketAligned) result.push(`latest_bucket_not_${runtime.collectionCadenceMinutes}m_aligned`)
  if (payload.bucketMinutes !== runtime.collectionCadenceMinutes) result.push(`payload_bucket_minutes_missing_or_not_${runtime.collectionCadenceMinutes}`)
  if (payload.payloadBucketMinute && latest.bucket_minute !== payload.payloadBucketMinute) result.push('row_and_payload_bucket_mismatch')
  if (payload.categoryContractVersion !== CATEGORY_CONTRACT_VERSION) result.push('category_contract_unavailable')
  if (payload.categoryContractVersion === CATEGORY_CONTRACT_VERSION && payload.categoryRefs.length !== payload.rawItems.length) result.push('category_refs_length_mismatch')
  return result
}

function normalizeCategory(value: string | null): string {
  const normalized = str(value)
  return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160)
}

function normalizeTop(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && ALLOWED_TOP_VALUES.has(parsed) ? parsed : null
}

function isAligned(value: string, bucketMinutes: number): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0 && date.getUTCMinutes() % bucketMinutes === 0
}

function item(raw: unknown, categoryId: string | null, categoryName: string | null): HeatmapItem | null {
  const record = object(raw)
  if (!record) return null
  const id = slugify(str(record.channelLogin ?? record.id ?? record.login ?? record.user_login ?? record.name))
  const name = str(record.displayName ?? record.name ?? record.user_name ?? record.channelLogin ?? id)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount)
  if (!id || viewers <= 0) return null
  return {
    id,
    name: name || id,
    title: str(record.title ?? record.streamTitle ?? record.gameName),
    viewers,
    momentum: number(record.momentum),
    activity: 0,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    url: str(record.url) || `https://www.twitch.tv/${id}`,
    categoryId,
    categoryName,
  }
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function number(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(-9999, Math.min(9999, value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(-9999, Math.min(9999, parsed)) : 0
  }
  return 0
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}