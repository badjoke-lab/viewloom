import type { Env } from '../_db/env'

type RangeMode = 'today' | 'rolling24h' | 'yesterday' | 'date'
type MetricMode = 'volume' | 'share'
type BucketSize = 5 | 10

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  total_viewers: number
  payload_json: string
  source_mode: string
}

type Item = {
  channelLogin?: string
  displayName?: string
  title?: string
  url?: string
  viewers?: number
}

type Band = {
  streamerId: string
  name: string
  title?: string
  url?: string
  isOthers?: boolean
  totalViewerMinutes: number
  peakViewers: number
  avgViewers: number
  peakShare: number
  biggestRiseBucket: string | null
  biggestRiseValue: number
  firstSeen: string | null
  lastSeen: string | null
  buckets: Array<{
    viewers: number
    share: number
    activity: number
    activityAvailable: boolean
    peak: boolean
    rise: boolean
  }>
}

const TOP_DEFAULT = 20

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const topN = normalizeTop(url.searchParams.get('top'))
  const bucketSize = normalizeBucket(url.searchParams.get('bucket'))
  const valueMode = normalizeMetric(url.searchParams.get('metric') ?? url.searchParams.get('mode'))
  const period = buildPeriod(url)

  try {
    const result = await env.DB_TWITCH_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute <= ?
      ORDER BY bucket_minute ASC
    `).bind('twitch', period.windowStart, period.windowEnd).all<SnapshotRow>()

    return Response.json(buildPayload(result.results ?? [], period, topN, bucketSize, valueMode), {
      headers: { 'cache-control': period.rangeMode === 'today' || period.rangeMode === 'rolling24h' ? 'no-store' : 'public, max-age=300' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Day Flow API failed.'
    return Response.json({
      ok: false,
      source: 'api',
      state: 'error',
      status: 'Error',
      note: message,
      coverageNote: 'Day Flow could not read ViewLoom-owned D1 snapshots.',
      partialNote: message,
      lastUpdated: new Date().toISOString(),
      selectedDate: period.selectedDate,
      bucketSize,
      topN,
      valueMode,
      rangeMode: period.rangeMode,
      windowStart: period.windowStart,
      windowEnd: period.windowEnd,
      isRolling: period.isRolling,
      buckets: [],
      totalViewersByBucket: [],
      bands: [],
      activity: { available: false, note: 'Activity unavailable because the API request failed.' },
      error: { code: 'day_flow_api_error', message },
    }, { status: 500 })
  }
}

function buildPayload(rows: SnapshotRow[], period: ReturnType<typeof buildPeriod>, topN: 10 | 20 | 50, bucketSize: BucketSize, valueMode: MetricMode) {
  const buckets = buildBuckets(period.windowStart, period.windowEnd, bucketSize)
  const bucketIndex = new Map(buckets.map((bucket, index) => [bucket, index]))
  const totals = Array<number>(buckets.length).fill(0)
  const streams = new Map<string, { name: string; title: string; url: string; values: number[] }>()
  let demoRows = 0
  let lastUpdated = rows.at(-1)?.collected_at ?? new Date().toISOString()

  for (const row of rows) {
    const bucket = floorToBucket(row.bucket_minute, bucketSize)
    const index = bucketIndex.get(bucket)
    if (index == null) continue
    if (row.source_mode === 'demo') demoRows += 1
    totals[index] = Math.max(totals[index] ?? 0, safeNumber(row.total_viewers))
    lastUpdated = row.collected_at ?? row.bucket_minute ?? lastUpdated

    for (const item of readItems(row.payload_json)) {
      const id = slug(item.channelLogin ?? item.displayName ?? '')
      if (!id) continue
      const entry = streams.get(id) ?? {
        name: String(item.displayName ?? item.channelLogin ?? id),
        title: String(item.title ?? ''),
        url: String(item.url ?? (item.channelLogin ? `https://www.twitch.tv/${item.channelLogin}` : '')),
        values: Array<number>(buckets.length).fill(0),
      }
      entry.values[index] = Math.max(entry.values[index] ?? 0, safeNumber(item.viewers))
      streams.set(id, entry)
    }
  }

  const ranked = [...streams.entries()]
    .map(([id, stream]) => toBand(id, stream, buckets, totals, bucketSize))
    .sort((a, b) => b.totalViewerMinutes - a.totalViewerMinutes)
  const topBands = ranked.slice(0, topN)
  const topIds = new Set(topBands.map((band) => band.streamerId))
  const others = buildOthersBand(streams, topIds, buckets, totals, bucketSize)
  const bands = others.totalViewerMinutes > 0 || topBands.length > 0 ? [...topBands, others] : topBands
  const nonZeroBuckets = totals.filter((value) => value > 0).length
  const source = demoRows > 0 && demoRows >= Math.max(1, rows.length / 2) ? 'demo' : 'api'
  const state = rows.length === 0 ? 'empty' : nonZeroBuckets < Math.max(1, Math.ceil(buckets.length * 0.2)) ? 'partial' : 'ok'
  const biggestRise = topBands.reduce<Band | null>((best, band) => {
    if (!band.biggestRiseBucket) return best
    return !best || band.biggestRiseValue > best.biggestRiseValue ? band : best
  }, null)

  return {
    ok: true,
    source,
    state,
    status: state === 'empty' ? 'Empty' : state === 'partial' ? 'Partial' : 'Fresh',
    note: 'ViewLoom-owned Day Flow payload generated from observed minute snapshots.',
    coverageNote: rows.length === 0 ? 'No observed Twitch snapshots exist for this Day Flow window.' : `${nonZeroBuckets} of ${buckets.length} ${bucketSize}m buckets contain observed Twitch snapshots.`,
    partialNote: state === 'partial' ? 'This Day Flow window is based on partial observed snapshots.' : undefined,
    lastUpdated,
    selectedDate: period.selectedDate,
    bucketSize,
    topN,
    valueMode,
    rangeMode: period.rangeMode,
    windowStart: period.windowStart,
    windowEnd: period.windowEnd,
    isRolling: period.isRolling,
    summary: {
      peakLeader: topBands[0]?.name,
      longestDominance: topBands[0]?.name,
      highestActivity: undefined,
      biggestRise: biggestRise?.name,
    },
    buckets,
    totalViewersByBucket: totals,
    bands,
    focusSnapshot: { highestActivity: undefined },
    detailPanelSource: {
      defaultStreamerId: topBands[0]?.streamerId ?? null,
      streamers: topBands.map((band) => ({
        streamerId: band.streamerId,
        name: band.name,
        title: band.title ?? '',
        url: band.url ?? '',
        peakViewers: band.peakViewers,
        avgViewers: band.avgViewers,
        viewerMinutes: band.totalViewerMinutes,
        peakShare: band.peakShare,
        biggestRiseTime: band.biggestRiseBucket,
        biggestRiseValue: band.biggestRiseValue,
        firstSeen: band.firstSeen,
        lastSeen: band.lastSeen,
      })),
    },
    activity: {
      available: false,
      note: 'Activity is not yet available in the ViewLoom-owned Day Flow payload. Viewer volume and share remain available.',
    },
  }
}

function toBand(id: string, stream: { name: string; title: string; url: string; values: number[] }, buckets: string[], totals: number[], bucketSize: BucketSize): Band {
  const peakViewers = Math.max(0, ...stream.values)
  const observedIndexes = stream.values.map((value, index) => value > 0 ? index : -1).filter((index) => index >= 0)
  const totalViewerMinutes = stream.values.reduce((sum, value) => sum + value * bucketSize, 0)
  const rise = biggestRise(stream.values, buckets)
  return {
    streamerId: id,
    name: stream.name,
    title: stream.title,
    url: stream.url,
    isOthers: false,
    totalViewerMinutes: Math.round(totalViewerMinutes),
    peakViewers,
    avgViewers: observedIndexes.length > 0 ? Math.round(totalViewerMinutes / Math.max(1, observedIndexes.length * bucketSize)) : 0,
    peakShare: Math.max(0, ...stream.values.map((value, index) => totals[index] > 0 ? value / totals[index] : 0)),
    biggestRiseBucket: rise.bucket,
    biggestRiseValue: rise.value,
    firstSeen: observedIndexes.length > 0 ? buckets[observedIndexes[0]] : null,
    lastSeen: observedIndexes.length > 0 ? buckets[observedIndexes.at(-1) ?? 0] : null,
    buckets: stream.values.map((viewers, index) => ({ viewers, share: totals[index] > 0 ? viewers / totals[index] : 0, activity: 0, activityAvailable: false, peak: viewers === peakViewers && viewers > 0, rise: rise.index === index })),
  }
}

function buildOthersBand(streams: Map<string, { values: number[] }>, topIds: Set<string>, buckets: string[], totals: number[], bucketSize: BucketSize): Band {
  const values = buckets.map((_, index) => {
    const topTotal = [...streams.entries()].reduce((sum, [id, stream]) => topIds.has(id) ? sum + (stream.values[index] ?? 0) : sum, 0)
    return Math.max(0, (totals[index] ?? 0) - topTotal)
  })
  const band = toBand('others', { name: 'Others', title: '', url: '', values }, buckets, totals, bucketSize)
  return { ...band, isOthers: true }
}

function biggestRise(values: number[], buckets: string[]): { index: number | null; bucket: string | null; value: number } {
  let bestIndex: number | null = null
  let bestValue = 0
  let previous = values[0] ?? 0
  for (let index = 1; index < values.length; index += 1) {
    const current = values[index] ?? 0
    const delta = current - previous
    if (delta > bestValue) {
      bestValue = delta
      bestIndex = index
    }
    previous = current
  }
  return { index: bestIndex, bucket: bestIndex === null ? null : buckets[bestIndex], value: bestValue }
}

function buildPeriod(url: URL) {
  const rangeMode = normalizeRange(url.searchParams.get('rangeMode') ?? url.searchParams.get('day'))
  const selectedDate = normalizeDate(url.searchParams.get('date'))
  const now = new Date()
  if (rangeMode === 'rolling24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return { rangeMode, selectedDate: now.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: now.toISOString(), isRolling: true }
  }
  if (rangeMode === 'yesterday') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1, 23, 59, 59, 999))
    return { rangeMode, selectedDate: start.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: end.toISOString(), isRolling: false }
  }
  if (rangeMode === 'date') {
    return { rangeMode, selectedDate, windowStart: `${selectedDate}T00:00:00.000Z`, windowEnd: `${selectedDate}T23:59:59.999Z`, isRolling: false }
  }
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
  return { rangeMode: 'today' as const, selectedDate: start.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: now.toISOString(), isRolling: false }
}

function buildBuckets(fromIso: string, toIso: string, bucketSize: BucketSize): string[] {
  const buckets: string[] = []
  let cursor = Date.parse(floorToBucket(fromIso, bucketSize))
  const end = Date.parse(toIso)
  const step = bucketSize * 60 * 1000
  while (cursor <= end) {
    buckets.push(new Date(cursor).toISOString())
    cursor += step
  }
  return buckets.length > 0 ? buckets : [floorToBucket(fromIso, bucketSize)]
}

function floorToBucket(iso: string, bucketSize: BucketSize): string {
  const date = new Date(iso)
  const minutes = date.getUTCMinutes()
  date.setUTCMinutes(minutes - (minutes % bucketSize), 0, 0)
  return date.toISOString()
}

function readItems(payloadJson: string): Item[] {
  try {
    const parsed = JSON.parse(payloadJson) as { items?: Item[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

function normalizeRange(value: unknown): RangeMode {
  return value === 'rolling24h' || value === 'yesterday' || value === 'date' ? value : 'today'
}

function normalizeTop(value: unknown): 10 | 20 | 50 {
  const n = Number(value)
  if (n === 10 || n === 50) return n
  return TOP_DEFAULT
}

function normalizeBucket(value: unknown): BucketSize {
  return Number(value) === 10 ? 10 : 5
}

function normalizeMetric(value: unknown): MetricMode {
  return value === 'share' ? 'share' : 'volume'
}

function normalizeDate(value: string | null): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? String(value) : new Date().toISOString().slice(0, 10)
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
