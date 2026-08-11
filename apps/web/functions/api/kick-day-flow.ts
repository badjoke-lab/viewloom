import type { Env } from '../_db/env'
import { projectDayFlowCategory } from './day-flow-category-core.mjs'

type State = 'not_ready' | 'empty' | 'partial' | 'stale' | 'live' | 'error'
type Metric = 'volume' | 'share'
type RangeMode = 'today' | 'rolling24h' | 'yesterday' | 'date'
type Row = { bucket_minute: string; collected_at: string; total_viewers: number; payload_json: string; source_mode: string }
type CategoryRow = { category_id: string; category_name: string; contract_version: string }
type Stream = { id: string; name: string; title: string; url: string; viewers: number }
type Acc = { stream: Stream; sums: number[]; counts: number[]; firstSeen: string | null; lastSeen: string | null }
type Band = {
  streamerId: string
  name: string
  title: string
  url: string
  isOthers?: boolean
  totalViewerMinutes: number
  peakViewers: number
  avgViewers: number
  peakShare: number
  biggestRiseBucket: string | null
  biggestRiseValue: number
  firstSeen: string | null
  lastSeen: string | null
  buckets: Array<{ viewers: number; share: number; activity: number; activityAvailable: boolean; peak: boolean; rise: boolean }>
}

type Built = { bands: Band[]; streamers: ReturnType<typeof streamer>[]; totals: number[]; observed: number }

const MINUTE = 60 * 1000
const STALE_AFTER_MS = 10 * MINUTE
const MAX_ROWS = 1600
const CATEGORY_CONTRACT_VERSION = 'category-source-v1'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const bucketSize: 5 | 10 = Number(url.searchParams.get('bucket')) === 10 ? 10 : 5
  const topN = top(url.searchParams.get('top'))
  const valueMode: Metric = url.searchParams.get('metric') === 'share' || url.searchParams.get('mode') === 'share' ? 'share' : 'volume'
  const range = getRange(url, now)
  const bucketLabels = buckets(range.start, range.end, bucketSize)
  const categoryCandidateRequested = url.searchParams.has('category')
  const requestedCategory = normalizeCategory(url.searchParams.get('category'))

  try {
    const result = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      ORDER BY bucket_minute ASC
      LIMIT ${MAX_ROWS}
    `).bind('kick', range.start.toISOString(), range.end.toISOString()).all<Row>()

    const rows = result.results ?? []
    if (rows.length === 0) {
      const base = empty('empty', 'No Kick snapshots exist in the selected Day Flow window.', 'No observed Kick snapshots exist for this Day Flow window.', '', now.toISOString(), range, bucketSize, topN, valueMode, bucketLabels)
      return json(categoryCandidateRequested ? withUnavailableCategory(base, requestedCategory) : base)
    }

    const built = build(rows, bucketLabels, bucketSize, topN)
    const latest = rows[rows.length - 1]
    const meta = latest ? collectorMeta(latest.payload_json) : null
    const targetSource = str(meta?.targetSource) || 'unknown'
    const coverageMode = str(meta?.coverageMode) || 'unknown'
    const lastUpdated = latest?.collected_at || latest?.bucket_minute || now.toISOString()
    const stale = isLiveRange(range.mode) && Date.now() - parseTime(lastUpdated).getTime() > STALE_AFTER_MS

    if (!categoryCandidateRequested) {
      return json(responsePayload({ built, stale, range, bucketSize, topN, valueMode, targetSource, coverageMode, lastUpdated }))
    }

    const dictionary = await env.DB_KICK_HOT.prepare(`
      SELECT category_id, category_name, contract_version
      FROM provider_category_dictionary
      WHERE provider = ?
      ORDER BY category_name COLLATE NOCASE, category_id
    `).bind('kick').all<CategoryRow>()
    const categoryNames = new Map(
      (dictionary.results ?? [])
        .filter((row) => row.contract_version === CATEGORY_CONTRACT_VERSION)
        .map((row) => [row.category_id, row.category_name]),
    )
    const projection = projectDayFlowCategory({
      rows,
      buckets: bucketLabels,
      bucketSize,
      selectedCategory: requestedCategory,
      categoryNames,
      provider: 'kick',
      bucketAggregation: 'average',
    })
    const categoryBuilt = requestedCategory === 'all'
      ? built
      : buildSelectedCategory(projection.streams, projection.totals, bucketLabels, bucketSize, topN, built.observed, projection.categoryFilter.state)
    const base = responsePayload({ built: categoryBuilt, stale, range, bucketSize, topN, valueMode, targetSource, coverageMode, lastUpdated })
    const counts = projection.categoryFilter.coverageCounts
    const categoryState = projection.categoryFilter.state.replaceAll('_', ' ')

    return json({
      ...base,
      note: requestedCategory === 'all'
        ? base.note
        : `ViewLoom hidden Kick Day Flow category candidate · ${categoryState}.`,
      coverageNote: `${base.coverageNote} Category ${categoryState}; category bucket coverage observed=${counts.observed}, partial=${counts.partial}, unavailable=${counts.unavailable}.`,
      partialNote: projection.categoryFilter.coverageState === 'partial'
        ? 'Category metadata is partial for part of this Kick Day Flow window. Missing category metadata is not interpreted as zero category viewers.'
        : projection.categoryFilter.coverageState === 'unavailable'
          ? 'Category metadata is unavailable for this Kick Day Flow window. No selected-category zero is inferred.'
          : base.partialNote,
      categoryFilter: {
        implementationState: 'hidden_candidate',
        publicExposureAuthorized: false,
        ...projection.categoryFilter,
      },
      availableCategories: projection.categoryFilter.availableCategories,
      notes: [
        ...base.notes,
        'category_filter=true',
        'category_implementation_state=hidden_candidate',
        'category_public_exposure=false',
        `category_selected=${requestedCategory}`,
        `category_filter_state=${projection.categoryFilter.state}`,
        `category_coverage_state=${projection.categoryFilter.coverageState}`,
        'category_membership=per_observed_snapshot',
        'category_latest_back_projection=false',
        'category_filter_before_top_n=true',
        'category_bucket_aggregation=average_observed_stream_viewers',
        'category_full_share_denominator=all_observed_kick_viewers_per_bucket',
        'category_top_focus_share_denominator=displayed_selected_category_top_n_viewers_per_bucket',
        `category_bucket_observed=${counts.observed}`,
        `category_bucket_partial=${counts.partial}`,
        `category_bucket_unavailable=${counts.unavailable}`,
      ],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const base = empty('error', 'Kick Day Flow API could not read observed snapshots.', message, '', now.toISOString(), range, bucketSize, topN, valueMode, bucketLabels)
    return json(categoryCandidateRequested ? withUnavailableCategory(base, requestedCategory) : base, 500)
  }
}

function responsePayload(options: {
  built: Built
  stale: boolean
  range: ReturnType<typeof getRange>
  bucketSize: 5 | 10
  topN: number
  valueMode: Metric
  targetSource: string
  coverageMode: string
  lastUpdated: string
}): Record<string, any> {
  const { built, stale, range, bucketSize, topN, valueMode, targetSource, coverageMode, lastUpdated } = options
  const state = getState(built.bands.length > 0, stale, built.observed, built.totals.length)
  const partialNote = state === 'partial' ? `Only ${built.observed}/${built.totals.length} Day Flow buckets have observed Kick samples in this window.` : ''
  return {
    ok: true,
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    note: note(state, built.bands.length),
    coverageNote: `${built.observed}/${built.totals.length} buckets contain observed Kick snapshots.`,
    partialNote,
    lastUpdated,
    selectedDate: range.selectedDate,
    bucketSize,
    topN,
    valueMode,
    targetSource,
    coverageMode,
    rangeMode: range.mode,
    windowStart: range.start.toISOString(),
    windowEnd: range.end.toISOString(),
    isRolling: range.isRolling,
    buckets: buckets(range.start, range.end, bucketSize),
    totalViewersByBucket: built.totals,
    bands: built.bands,
    summary: summarize(built.bands),
    detailPanelSource: { defaultStreamerId: built.streamers[0]?.streamerId ?? null, streamers: built.streamers },
    activity: { available: false, note: 'Kick activity data is not connected yet. Day Flow bands use observed viewer counts only.' },
    notes: ['storage=DB_KICK_HOT', `target_source=${targetSource}`, `coverage_mode=${coverageMode}`],
  }
}

function build(rows: Row[], labels: string[], bucketSize: 5 | 10, topN: number): Built {
  const indexByLabel = new Map(labels.map((label, index) => [label, index]))
  const streams = new Map<string, Acc>()
  const totalSums = labels.map(() => 0)
  const totalCounts = labels.map(() => 0)
  const observed = new Set<number>()

  for (const row of rows) {
    const index = indexByLabel.get(floor(row.bucket_minute, bucketSize))
    if (index === undefined) continue
    const items = normalize(row.payload_json)
    if (items.length === 0) continue
    observed.add(index)
    totalSums[index] += items.reduce((sum, item) => sum + item.viewers, 0)
    totalCounts[index] += 1
    for (const item of items) {
      const acc = streams.get(item.id) ?? { stream: item, sums: labels.map(() => 0), counts: labels.map(() => 0), firstSeen: null, lastSeen: null }
      acc.stream = item
      acc.sums[index] += item.viewers
      acc.counts[index] += 1
      acc.firstSeen = min(acc.firstSeen, row.bucket_minute)
      acc.lastSeen = max(acc.lastSeen, row.bucket_minute)
      streams.set(item.id, acc)
    }
  }

  const totals = totalSums.map((sum, index) => totalCounts[index] > 0 ? Math.round(sum / totalCounts[index]) : 0)
  const all = [...streams.values()].map((acc) => {
    const viewers = acc.sums.map((sum, index) => acc.counts[index] > 0 ? Math.round(sum / acc.counts[index]) : 0)
    return makeBand(acc.stream, viewers, labels, totals, bucketSize, acc.firstSeen, acc.lastSeen)
  }).filter((band) => band.totalViewerMinutes > 0).sort((a, b) => b.totalViewerMinutes - a.totalViewerMinutes)

  const topBands = all.slice(0, topN)
  const rest = all.slice(topN)
  const others = rest.length > 0 ? makeOthers(rest, labels, totals, bucketSize) : null
  const bands = others ? [...topBands, others] : topBands
  return { bands, streamers: topBands.map(streamer), totals, observed: observed.size }
}

function buildSelectedCategory(
  projectedStreams: Array<{ id: string; name: string; title: string; url: string; values: number[] }>,
  totals: number[],
  labels: string[],
  bucketSize: 5 | 10,
  topN: number,
  observed: number,
  filterState: 'all' | 'selected' | 'unknown_category' | 'category_unavailable',
): Built {
  if (filterState !== 'selected') return { bands: [], streamers: [], totals, observed }
  const ranked = projectedStreams.map((projected) => {
    const nonZero = projected.values.map((value, index) => value > 0 ? index : -1).filter((index) => index >= 0)
    return makeBand(
      { id: projected.id, name: projected.name, title: projected.title, url: projected.url, viewers: 0 },
      projected.values,
      labels,
      totals,
      bucketSize,
      nonZero.length ? labels[nonZero[0]] : null,
      nonZero.length ? labels[nonZero[nonZero.length - 1]] : null,
    )
  }).filter((band) => band.totalViewerMinutes > 0).sort((a, b) => b.totalViewerMinutes - a.totalViewerMinutes)
  const topBands = ranked.slice(0, topN)
  const others = makeGlobalOthers(topBands, labels, totals, bucketSize)
  const bands = others.totalViewerMinutes > 0 || topBands.length > 0 ? [...topBands, others] : topBands
  return { bands, streamers: topBands.map(streamer), totals, observed }
}

function makeBand(stream: Stream, viewers: number[], labels: string[], totals: number[], bucketSize: 5 | 10, firstSeen: string | null, lastSeen: string | null): Band {
  const peak = Math.max(0, ...viewers)
  const nonZero = viewers.filter((value) => value > 0)
  const shares = viewers.map((value, index) => totals[index] > 0 ? value / totals[index] : 0)
  const rise = biggestRise(viewers, labels)
  return {
    streamerId: stream.id,
    name: stream.name,
    title: stream.title,
    url: stream.url,
    totalViewerMinutes: viewers.reduce((sum, value) => sum + value * bucketSize, 0),
    peakViewers: peak,
    avgViewers: nonZero.length ? Math.round(nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length) : 0,
    peakShare: Math.max(0, ...shares),
    biggestRiseBucket: rise.bucket,
    biggestRiseValue: rise.value,
    firstSeen,
    lastSeen,
    buckets: viewers.map((value, index) => ({ viewers: value, share: shares[index], activity: 0, activityAvailable: false, peak: value > 0 && value === peak, rise: index === rise.index && rise.value > 0 })),
  }
}

function makeOthers(bands: Band[], labels: string[], totals: number[], bucketSize: 5 | 10): Band {
  const viewers = labels.map((_, index) => bands.reduce((sum, band) => sum + band.buckets[index].viewers, 0))
  return { ...makeBand({ id: 'others', name: 'Others', title: 'Observed Kick streams outside the selected Top N.', url: '', viewers: 0 }, viewers, labels, totals, bucketSize, null, null), isOthers: true }
}

function makeGlobalOthers(topBands: Band[], labels: string[], totals: number[], bucketSize: 5 | 10): Band {
  const viewers = labels.map((_, index) => Math.max(0, (totals[index] ?? 0) - topBands.reduce((sum, band) => sum + (band.buckets[index]?.viewers ?? 0), 0)))
  return { ...makeBand({ id: 'others', name: 'Others', title: 'All other observed Kick viewers outside the displayed selected-category Top N.', url: '', viewers: 0 }, viewers, labels, totals, bucketSize, null, null), isOthers: true }
}

function summarize(bands: Band[]): { peakLeader: string | null; longestDominance: string | null; biggestRise: string | null; highestActivity: null } {
  const topBands = bands.filter((band) => !band.isOthers)
  const peakLeader = [...topBands].sort((a, b) => b.peakViewers - a.peakViewers)[0]?.name ?? null
  const biggestRise = [...topBands].sort((a, b) => b.biggestRiseValue - a.biggestRiseValue)[0]?.name ?? null
  const wins = new Map<string, number>()
  const bucketCount = Math.max(0, ...topBands.map((band) => band.buckets.length))
  for (let index = 0; index < bucketCount; index += 1) {
    const leader = topBands.reduce<Band | null>((best, band) => !best || band.buckets[index]?.viewers > best.buckets[index]?.viewers ? band : best, null)
    if (leader && leader.buckets[index]?.viewers > 0) wins.set(leader.streamerId, (wins.get(leader.streamerId) ?? 0) + 1)
  }
  const longestId = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  return {
    peakLeader,
    longestDominance: topBands.find((band) => band.streamerId === longestId)?.name ?? null,
    biggestRise: biggestRise && topBands.some((band) => band.biggestRiseValue > 0) ? biggestRise : null,
    highestActivity: null,
  }
}

function normalize(payloadJson: string): Stream[] {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(stream).filter((item): item is Stream => item !== null)
}

function collectorMeta(payloadJson: string): Record<string, unknown> | null {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  return object(record?.collectorMeta)
}

function stream(raw: unknown): Stream | null {
  const record = object(raw)
  if (!record) return null
  const channel = object(record.channel)
  const live = object(record.livestream)
  const slug = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? slug)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount ?? live?.viewer_count)
  const id = slugify(slug || name)
  if (!id || viewers <= 0) return null
  return { id, name: name || id, title: str(record.title ?? record.session_title ?? record.stream_title ?? live?.session_title), viewers, url: str(record.url) || `https://kick.com/${id}` }
}

function streamer(band: Band) {
  return { streamerId: band.streamerId, name: band.name, title: band.title, url: band.url, peakViewers: band.peakViewers, avgViewers: band.avgViewers, viewerMinutes: band.totalViewerMinutes, peakShare: band.peakShare, biggestRiseTime: band.biggestRiseBucket, biggestRiseValue: band.biggestRiseValue, firstSeen: band.firstSeen, lastSeen: band.lastSeen }
}

function empty(state: State, noteText: string, coverageNote: string, partialNote: string, lastUpdated: string, range: ReturnType<typeof getRange>, bucketSize: 5 | 10, topN: number, valueMode: Metric, labels: string[]): Record<string, any> {
  return { ok: state !== 'error', source: 'api', platform: 'kick', state, status: state, note: noteText, coverageNote, partialNote, lastUpdated, selectedDate: range.selectedDate, bucketSize, topN, valueMode, targetSource: 'unknown', coverageMode: 'unknown', rangeMode: range.mode, windowStart: range.start.toISOString(), windowEnd: range.end.toISOString(), isRolling: range.isRolling, buckets: labels, totalViewersByBucket: labels.map(() => 0), bands: [] as Band[], summary: { peakLeader: null, longestDominance: null, biggestRise: null, highestActivity: null }, detailPanelSource: { defaultStreamerId: null as string | null, streamers: [] as ReturnType<typeof streamer>[] }, activity: { available: false, note: 'Kick activity data is not connected yet.' }, notes: ['storage=DB_KICK_HOT', 'target_source=unknown', 'coverage_mode=unknown'] }
}

function withUnavailableCategory(base: Record<string, any>, requestedCategory: string): Record<string, any> {
  return {
    ...base,
    categoryFilter: {
      implementationState: 'hidden_candidate',
      publicExposureAuthorized: false,
      contractVersion: null,
      selectedCategory: requestedCategory,
      state: 'category_unavailable',
      coverageState: 'unavailable',
      observedItems: 0,
      missingItems: 0,
      dictionaryMissingItems: 0,
      filterBeforeTopN: true,
      membershipEvaluation: 'per_observed_snapshot',
      latestCategoryBackProjectionAllowed: false,
      fullShareDenominator: 'all_observed_kick_viewers_per_bucket',
      topFocusShareDenominator: 'displayed_selected_category_top_n_viewers_per_bucket',
      availableCategories: [],
      bucketCoverage: [],
      coverageCounts: { observed: 0, partial: 0, unavailable: 0 },
    },
    availableCategories: [],
    notes: [...(Array.isArray(base.notes) ? base.notes : []), 'category_implementation_state=hidden_candidate', 'category_public_exposure=false'],
  }
}

function getRange(url: URL, now: Date): { selectedDate: string; mode: RangeMode; start: Date; end: Date; isRolling: boolean } {
  const today = now.toISOString().slice(0, 10)
  const requested = url.searchParams.get('rangeMode')
  const mode: RangeMode = requested === 'rolling24h' ? 'rolling24h' : requested === 'yesterday' || url.searchParams.get('day') === 'yesterday' ? 'yesterday' : requested === 'date' ? 'date' : 'today'
  if (mode === 'rolling24h') return { selectedDate: today, mode, start: new Date(now.getTime() - 24 * 60 * MINUTE), end: now, isRolling: true }
  const selectedDate = mode === 'yesterday' ? shift(today, -1) : mode === 'date' ? validDate(url.searchParams.get('date')) ?? today : today
  const start = new Date(`${selectedDate}T00:00:00.000Z`)
  const end = mode === 'today' ? now : new Date(start.getTime() + 24 * 60 * MINUTE)
  return { selectedDate, mode, start, end, isRolling: false }
}

function buckets(start: Date, end: Date, bucketSize: 5 | 10): string[] {
  const labels: string[] = []
  for (let time = floorDate(start, bucketSize).getTime(); time < end.getTime(); time += bucketSize * MINUTE) labels.push(new Date(time).toISOString())
  return labels
}

function getState(hasBands: boolean, stale: boolean, observed: number, expected: number): State { if (!hasBands) return 'empty'; if (stale) return 'stale'; if (expected > 0 && observed / expected < 0.5) return 'partial'; return 'live' }
function note(state: State, count: number): string { return state === 'live' ? `${count} Kick Day Flow bands from observed snapshots.` : state === 'partial' ? `${count} Kick Day Flow bands from a sparse observed window.` : state === 'stale' ? `${count} Kick Day Flow bands are available, but the latest snapshot is stale.` : 'Observed Kick rows exist, but no usable Day Flow bands were found.' }
function biggestRise(values: number[], labels: string[]) { let index = -1; let value = 0; for (let i = 1; i < values.length; i += 1) { const delta = values[i] - values[i - 1]; if (delta > value) { index = i; value = delta } } return { index, value, bucket: index >= 0 ? labels[index] : null } }
function json(payload: unknown, status = 200): Response { return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } }) }
function floor(value: string, bucketSize: 5 | 10): string { return floorDate(parseTime(value), bucketSize).toISOString() }
function floorDate(date: Date, bucketSize: 5 | 10): Date { const copy = new Date(date); copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / bucketSize) * bucketSize, 0, 0); return copy }
function parseTime(value: string): Date { return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`) }
function top(value: string | null): number { const parsed = Number(value); return parsed === 10 || parsed === 20 || parsed === 50 ? parsed : 20 }
function normalizeCategory(value: string | null): string { const normalized = value?.trim() ?? ''; return !normalized || normalized.toLowerCase() === 'all' ? 'all' : normalized.slice(0, 160) }
function validDate(value: string | null): string | null { return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null }
function shift(date: string, days: number): string { const parsed = new Date(`${date}T00:00:00.000Z`); parsed.setUTCDate(parsed.getUTCDate() + days); return parsed.toISOString().slice(0, 10) }
function isLiveRange(mode: RangeMode): boolean { return mode === 'today' || mode === 'rolling24h' }
function min(a: string | null, b: string | null): string | null { if (!a) return b; if (!b) return a; return a < b ? a : b }
function max(a: string | null, b: string | null): string | null { if (!a) return b; if (!b) return a; return a > b ? a : b }
function safeJson(value: string): unknown { try { return JSON.parse(value) } catch { return null } }
function object(value: unknown): Record<string, unknown> | null { return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null }
function str(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function num(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '') }
