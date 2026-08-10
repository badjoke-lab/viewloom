import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  total_viewers: number
  payload_json: string
  source_mode: string
}

type CategoryRow = {
  category_id: string
  category_name: string
  contract_version: string
}

type NormalizedStream = {
  id: string
  name: string
  title: string
  viewers: number
  momentum: number
  momentumAvailable: boolean
  momentumUnavailableReason: string
  activity: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
  url: string
  startedAt?: string
  categoryId: string | null
  categoryName: string | null
}

type CategoryOption = {
  id: string
  name: string
  streamCount: number
  totalViewers: number
}

type KickHeatmapState = 'not_ready' | 'empty' | 'stale' | 'live' | 'error'
type CategoryFilterState = 'all' | 'selected' | 'unknown_category' | 'category_unavailable'
type CategoryCoverageState = 'observed' | 'partial' | 'unavailable'

type ParsedPayload = {
  rawItems: unknown[]
  categoryContractVersion: string | null
  categoryIds: string[]
  categoryRefs: Array<number | null>
  collectorMeta: Record<string, unknown> | null
}

type PreviousObservation = {
  viewers: number
  categoryId: string | null
  categoryCompatible: boolean
}

type CategoryFilter = {
  implementationState: 'public'
  publicExposureAuthorized: true
  contractVersion: string | null
  available: boolean
  coverageState: CategoryCoverageState
  selectedCategory: string
  state: CategoryFilterState
  filterBeforeTopN: true
  requestedTop: number | null
  observedItems: number
  missingItems: number
  dictionaryMissingItems: number
  availableCategories: CategoryOption[]
  sourceMode: string
  targetSource: string
  momentumScope: 'stream' | 'selected_category_compatible_observations'
}

type KickHeatmapPayload = {
  source: 'api'
  platform: 'kick'
  state: KickHeatmapState
  status: KickHeatmapState
  updatedAt: string
  valueMode: 'viewers'
  expectedBucketMinutes: number
  bucketMinutes: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
  targetSource: string
  coverageMode: string
  items: NormalizedStream[]
  availableCategories: CategoryOption[]
  categoryFilter: CategoryFilter
  coverageNote: string
  notes: string[]
}

const runtime = providerRuntime('kick')
const ACTIVITY_UNAVAILABLE_REASON = 'chat_sampling_not_connected'
const CATEGORY_CONTRACT_VERSION = 'category-source-v1'
const ALLOWED_TOP_VALUES = new Set([20, 50, 100])

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url)
  const requestedCategory = normalizeCategory(url.searchParams.get('category'))
  const requestedTop = normalizeTop(url.searchParams.get('top'))

  if (!env.DB_KICK_HOT) {
    return jsonPayload({
      state: 'not_ready',
      updatedAt: new Date().toISOString(),
      items: [],
      availableCategories: [],
      categoryFilter: unavailableCategoryFilter(requestedCategory, requestedTop),
      coverageNote: 'Kick storage is not configured. Create D1 `vl_kick_hot` and bind it as `DB_KICK_HOT`.',
      notes: ['missing_binding=DB_KICK_HOT'],
      status: 503,
    })
  }

  try {
    const result = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 2
    `).bind('kick').all<SnapshotRow>()

    const rows = result.results ?? []
    const latest = rows[0]
    const previous = rows[1]

    if (!latest) {
      return jsonPayload({
        state: 'empty',
        updatedAt: new Date().toISOString(),
        items: [],
        availableCategories: [],
        categoryFilter: unavailableCategoryFilter(requestedCategory, requestedTop),
        coverageNote: 'No Kick snapshots exist in DB_KICK_HOT yet.',
        notes: ['provider=kick returned no rows in vl_kick_hot.'],
      })
    }

    const parsed = parsePayload(latest.payload_json)
    const previousParsed = previous ? parsePayload(previous.payload_json) : emptyParsedPayload()
    const dictionaryResult = parsed.categoryIds.length > 0
      ? await env.DB_KICK_HOT.prepare(`
        SELECT category_id, category_name, contract_version
        FROM provider_category_dictionary
        WHERE provider = ?
        ORDER BY category_name COLLATE NOCASE, category_id
      `).bind('kick').all<CategoryRow>()
      : { results: [] as CategoryRow[] }
    const dictionaryRows = Array.isArray(dictionaryResult.results) ? dictionaryResult.results : []
    const categoryNames = new Map(dictionaryRows.map((row) => [row.category_id, row.category_name]))
    const previousIndex = previousObservationMap(previousParsed)
    const previousViewers = new Map([...previousIndex.entries()].map(([id, value]) => [id, value.viewers]))
    const allItems = normalizePayload(parsed, previousViewers, categoryNames)
      .sort((a, b) => b.viewers - a.viewers || a.name.localeCompare(b.name))

    const sourceMode = str(parsed.collectorMeta?.sourceMode) || latest.source_mode || 'unknown'
    const targetSource = str(parsed.collectorMeta?.targetSource) || 'unknown'
    const coverageMode = str(parsed.collectorMeta?.coverageMode) || 'unknown'
    const contractUsable = parsed.categoryContractVersion === CATEGORY_CONTRACT_VERSION
      && parsed.categoryRefs.length === parsed.rawItems.length
    const categoryObservedItems = allItems.filter((value) => value.categoryId !== null).length
    const categoryMissingItems = Math.max(0, allItems.length - categoryObservedItems)
    const dictionaryMissingItems = allItems.filter((value) => value.categoryId !== null && !categoryNames.has(value.categoryId)).length
    const categoryAvailable = contractUsable && categoryObservedItems > 0
    const acceptedPrimarySource = sourceMode === 'official-livestreams'
    const categoryCoverageState: CategoryCoverageState = !categoryAvailable
      ? 'unavailable'
      : !acceptedPrimarySource || categoryMissingItems > 0 || dictionaryMissingItems > 0
        ? 'partial'
        : 'observed'
    const availableCategories = summarizeCategories(allItems)
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
      ? allItems
        .filter((value) => value.categoryId === requestedCategory)
        .map((value) => selectedCategoryMomentum(value, previousIndex, requestedCategory))
      : categoryFilterState === 'unknown_category'
        ? []
        : categoryFilterState === 'category_unavailable' && requestedCategory !== 'all'
          ? []
          : allItems
    const items = requestedTop === null ? categoryFilteredItems : categoryFilteredItems.slice(0, requestedTop)

    const updatedAt = latest.collected_at || latest.bucket_minute || new Date().toISOString()
    const age = Date.now() - new Date(updatedAt).getTime()
    const state: KickHeatmapState = allItems.length === 0 ? 'empty' : age > runtime.staleAfterMinutes * 60 * 1000 ? 'stale' : 'live'
    const categoryFilter: CategoryFilter = {
      implementationState: 'public',
      publicExposureAuthorized: true,
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
      sourceMode,
      targetSource,
      momentumScope: categoryFilterState === 'selected' ? 'selected_category_compatible_observations' : 'stream',
    }
    const note = state === 'live'
      ? `${items.length} visible of ${allItems.length} normalized Kick streams from latest observed snapshot.`
      : state === 'stale'
        ? `${items.length} visible of ${allItems.length} normalized Kick streams, but latest snapshot is stale.`
        : 'Latest Kick snapshot exists but has no usable normalized streams.'

    return jsonPayload({
      state,
      updatedAt,
      items,
      availableCategories,
      categoryFilter,
      coverageNote: note,
      targetSource,
      coverageMode,
      notes: [
        'storage=DB_KICK_HOT',
        `source_mode=${latest.source_mode || 'unknown'}`,
        `category_source_mode=${sourceMode}`,
        `target_source=${targetSource}`,
        `coverage_mode=${coverageMode}`,
        `bucket_minute=${latest.bucket_minute}`,
        `previous_bucket_minute=${previous?.bucket_minute || 'none'}`,
        `bucket_minutes=${runtime.collectionCadenceMinutes}`,
        `expected_bucket_minutes=${runtime.collectionCadenceMinutes}`,
        `top_limit=${runtime.topLimit}`,
        'momentum_source=viewer_delta',
        `momentum_scope=${categoryFilter.momentumScope}`,
        'activity_available=false',
        `activity_unavailable_reason=${ACTIVITY_UNAVAILABLE_REASON}`,
        `total_viewers=${latest.total_viewers}`,
        `category_contract_version=${parsed.categoryContractVersion || 'none'}`,
        `category_available=${categoryAvailable}`,
        `category_coverage_state=${categoryCoverageState}`,
        `category_filter_state=${categoryFilterState}`,
        `category_selected=${requestedCategory}`,
        `category_filter_before_top_n=true`,
        `category_requested_top=${requestedTop ?? 'none'}`,
        'category_filter_public_exposure=true',
      ],
    })
  } catch (error) {
    return jsonPayload({
      state: 'error',
      updatedAt: new Date().toISOString(),
      items: [],
      availableCategories: [],
      categoryFilter: unavailableCategoryFilter(requestedCategory, requestedTop),
      coverageNote: 'Kick Heatmap API could not read DB_KICK_HOT snapshots.',
      notes: [error instanceof Error ? error.message : String(error)],
      status: 500,
    })
  }
}

function jsonPayload(input: {
  state: KickHeatmapState
  updatedAt: string
  items: NormalizedStream[]
  availableCategories: CategoryOption[]
  categoryFilter: CategoryFilter
  coverageNote: string
  notes: string[]
  status?: number
  targetSource?: string
  coverageMode?: string
}): Response {
  const payload: KickHeatmapPayload = {
    source: 'api',
    platform: 'kick',
    state: input.state,
    status: input.state,
    updatedAt: input.updatedAt,
    valueMode: 'viewers',
    expectedBucketMinutes: runtime.collectionCadenceMinutes,
    bucketMinutes: runtime.collectionCadenceMinutes,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    targetSource: input.targetSource ?? 'unknown',
    coverageMode: input.coverageMode ?? 'unknown',
    items: input.items,
    availableCategories: input.availableCategories,
    categoryFilter: input.categoryFilter,
    coverageNote: input.coverageNote,
    notes: input.notes,
  }
  return Response.json(payload, { status: input.status ?? 200, headers: { 'cache-control': 'no-store' } })
}

function parsePayload(payloadJson: string): ParsedPayload {
  const parsed = safeJson(payloadJson)
  const record = asRecord(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  const categoryContractVersion = str(record?.categoryContractVersion) || null
  const categoryIds = Array.isArray(record?.categoryIds)
    ? record.categoryIds.map((value) => str(value)).filter(Boolean)
    : []
  const categoryRefs = Array.isArray(record?.categoryRefs)
    ? record.categoryRefs.map((value) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null)
    : []
  return {
    rawItems,
    categoryContractVersion,
    categoryIds,
    categoryRefs,
    collectorMeta: asRecord(record?.collectorMeta),
  }
}

function emptyParsedPayload(): ParsedPayload {
  return { rawItems: [], categoryContractVersion: null, categoryIds: [], categoryRefs: [], collectorMeta: null }
}

function normalizePayload(payload: ParsedPayload, previousViewers: Map<string, number>, categoryNames: Map<string, string>): NormalizedStream[] {
  return payload.rawItems.map((raw, index) => {
    const ref = payload.categoryRefs[index]
    const categoryId = typeof ref === 'number' ? payload.categoryIds[ref] || null : null
    const categoryName = categoryId ? categoryNames.get(categoryId) || categoryId : null
    return normalizeStream(raw, previousViewers, categoryId, categoryName)
  }).filter((item): item is NormalizedStream => item !== null)
}

function previousObservationMap(payload: ParsedPayload): Map<string, PreviousObservation> {
  const map = new Map<string, PreviousObservation>()
  const compatibleContract = payload.categoryContractVersion === CATEGORY_CONTRACT_VERSION
    && payload.categoryRefs.length === payload.rawItems.length
  payload.rawItems.forEach((raw, index) => {
    const base = streamBase(raw)
    if (!base) return
    const ref = payload.categoryRefs[index]
    const categoryId = compatibleContract && typeof ref === 'number' ? payload.categoryIds[ref] || null : null
    map.set(base.id, {
      viewers: base.viewers,
      categoryId,
      categoryCompatible: compatibleContract && categoryId !== null,
    })
  })
  return map
}

function summarizeCategories(items: NormalizedStream[]): CategoryOption[] {
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

function selectedCategoryMomentum(item: NormalizedStream, previous: Map<string, PreviousObservation>, selectedCategory: string): NormalizedStream {
  const prior = previous.get(item.id)
  if (!prior) {
    return { ...item, momentum: 0, momentumAvailable: false, momentumUnavailableReason: 'previous_stream_not_observed_in_selected_category' }
  }
  if (!prior.categoryCompatible || prior.categoryId !== selectedCategory) {
    return { ...item, momentum: 0, momentumAvailable: false, momentumUnavailableReason: 'previous_category_missing_or_different' }
  }
  return { ...item, momentum: momentum(item.viewers, prior.viewers), momentumAvailable: true, momentumUnavailableReason: '' }
}

function normalizeStream(raw: unknown, previousViewers: Map<string, number>, categoryId: string | null, categoryName: string | null): NormalizedStream | null {
  const base = streamBase(raw)
  if (!base) return null
  const previous = previousViewers.get(base.id) ?? 0
  return {
    id: base.id,
    name: base.name,
    title: base.title,
    viewers: base.viewers,
    momentum: momentum(base.viewers, previous),
    momentumAvailable: previous > 0,
    momentumUnavailableReason: previous > 0 ? '' : 'previous_stream_not_observed',
    activity: 0,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    url: base.url,
    startedAt: base.startedAt,
    categoryId,
    categoryName,
  }
}

function streamBase(raw: unknown): { id: string; name: string; title: string; viewers: number; url: string; startedAt?: string } | null {
  const record = asRecord(raw)
  if (!record) return null
  const channel = asRecord(record.channel)
  const livestream = asRecord(record.livestream)
  const slug = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? slug)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount ?? livestream?.viewer_count)
  const id = slugify(slug || name)
  if (!id || viewers <= 0) return null
  return {
    id,
    name: name || id,
    title: str(record.title ?? record.session_title ?? record.stream_title ?? livestream?.session_title),
    viewers,
    url: str(record.url) || `https://kick.com/${id}`,
    startedAt: str(record.startedAt ?? record.started_at ?? record.start_time ?? livestream?.created_at) || undefined,
  }
}

function unavailableCategoryFilter(category: string, top: number | null): CategoryFilter {
  return {
    implementationState: 'public',
    publicExposureAuthorized: true,
    contractVersion: null,
    available: false,
    coverageState: 'unavailable',
    selectedCategory: category,
    state: 'category_unavailable',
    filterBeforeTopN: true,
    requestedTop: top,
    observedItems: 0,
    missingItems: 0,
    dictionaryMissingItems: 0,
    availableCategories: [],
    sourceMode: 'unknown',
    targetSource: 'unknown',
    momentumScope: category === 'all' ? 'stream' : 'selected_category_compatible_observations',
  }
}

function normalizeCategory(value: string | null): string {
  const normalized = str(value)
  return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160)
}

function normalizeTop(value: string | null): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && ALLOWED_TOP_VALUES.has(parsed) ? parsed : null
}

function momentum(current: number, previous: number): number {
  if (previous <= 0 || current <= 0) return 0
  const raw = (current - previous) / previous
  return Math.max(-3, Math.min(3, raw))
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function asRecord(value: unknown): Record<string, unknown> | null {
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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
