import type { Env } from '../_db/env'

type RangeMode = 'today' | 'rolling24h' | 'yesterday' | 'date'
type MetricMode = 'volume' | 'share'
type BucketSize = 5 | 10

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  payload_json: string
  source_mode: string
}

type HeatmapItem = {
  channelLogin?: string
  displayName?: string
  title?: string
  url?: string
  viewers?: number
  activity?: number
  momentum?: number
}

type StreamAgg = {
  id: string
  name: string
  title: string
  url: string
  viewerMinutes: number
  peakViewers: number
  observations: number
  firstSeen: string | null
  lastSeen: string | null
  biggestRiseBucket: string | null
  biggestRiseValue: number
  previousViewers: number | null
}

type BucketAgg = {
  bucketIso: string
  totalViewers: number
  streams: Map<string, number>
  demoCount: number
  rowCount: number
}

type Period = {
  rangeMode: RangeMode
  selectedDate: string
  windowStart: string
  windowEnd: string
  isRolling: boolean
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const rangeMode = normalizeRange(url.searchParams.get('rangeMode') ?? url.searchParams.get('day'))
  const bucketSize = normalizeBucket(url.searchParams.get('bucket'))
  const topN = normalizeTop(url.searchParams.get('top'))
  const valueMode = normalizeMetric(url.searchParams.get('metric') ?? url.searchParams.get('mode'))
  const selectedDate = normalizeDate(url.searchParams.get('date'))
  const period = buildPeriod(rangeMode, selectedDate)

  try {
    const rows = await fetchRows(env, period.windowStart, period.windowEnd)
    const payload = buildPayload({ rows, period, bucketSize, topN, valueMode })
    return Response.json(payload, {
      headers: {
        'cache-control': period.rangeMode === 'today' || period.rangeMode === 'rolling24h'
          ? 'no-store'
          : 'public, max-age=300',
      },
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

async function fetchRows(env: Env, fromIso: string, toIso: string): Promise<SnapshotRow[]> {
  const result = await env.DB_TWITCH_HOT.prepare(`
    SELECT bucket_minute, collected_at, stream_count, total_viewers, payload_json, source_mode
    FROM minute_snapshots
    WHERE provider = ? AND bucket_minute >= ? AND bucket_minute <= ?
    ORDER BY bucket_minute ASC
  `).bind('twitch', fromIso, toIso).all<SnapshotRow>()
  return result.results ?? []
}

function buildPayload(input: {
  rows: SnapshotRow[]
  period: Period
  bucketSize: BucketSize
  topN: 10 | 20 | 50
  valueMode: MetricMode
}) {
  const { rows, period, bucketSize, topN, valueMode } = input
  const bucketIso = buildBucketList(period.windowStart, period.windowEnd, bucketSize)
  const bucketAggs = bucketIso.map((bucket) => ({
    bucketIso: bucket,
    totalViewers: 0,
    streams: new Map<string, number>(),
    demoCount: 0,
    rowCount: 0,
  } satisfies BucketAgg))
  const bucketIndex = new Map(bucketIso.map((bucket, index) => [bucket, index]))
  const streams = new Map<string, StreamAgg>()
  let latestUpdated = rows.at(-1)?.collected_at ?? rows.at(-1)?.bucket_minute ?? new Date().toISOString()
  let demoRows = 0

  for (const row of rows) {
    const bucket = floorToBucket(row.bucket_minute, bucketSize)
    const index = bucketIndex.get(bucket)
    if (index == null) continue
    const agg = bucketAggs[index]
    const items = readItems(row.payload_json)
    const snapshotTotal = safeNumber(row.total_viewers)
    agg.totalViewers = Math.max(agg.totalViewers, snapshotTotal)
    agg.rowCount += 1
    if (row.source_mode === 'demo') {
      demoRows += 1
      agg.demoCount += 1
    }
    latestUpdated = row.collected_at ?? row.bucket_minute ?? latestUpdated

    for (const item of items) {
      const viewers = safeNumber(item.viewers)
      const id = slug(item.channelLogin ?? item.displayName ?? '')
      if (!id) continue
      const displayName = String(item.displayName ?? item.channelLogin ?? id)
      const stream = ensureStream(streams, id, displayName, item)
      stream.viewerMinutes += viewers * bucketSize
      stream.peakViewers = Math.max(stream.peakViewers, viewers)
      stream.observations += 1
      stream.firstSeen ??= bucket
      stream.lastSeen = bucket
      if (stream.previousViewers !== null) {
        const rise = viewers - stream.previousViewers
        if (rise > stream.biggestRiseValue) {
          stream.biggestRiseValue = rise
          stream.biggestRiseBucket = bucket
        }
      }
      stream.previousViewers = viewers
      agg.streams.set(id, Math.max(agg.streams.get(id) ?? 0, viewers))
    }
  }

  const ranked = [...streams.values()].sort((a, b) => b.viewerMinutes - a.viewerMinutes)
  const topStreams = ranked.slice(0, topN)
  const topIds = new Set(topStreams.map((stream) => stream.id))
  const totalViewersByBucket = bucketAggs.map((bucket) => bucket.totalViewers)
  const bands = topStreams.map((stream) => buildBand(stream, bucketAggs, bucketSize, totalViewersByBucket))
  const others = buildOthersBand(bucketAggs, topIds, totalViewersByBucket)
  if (others.totalViewerMinutes > 0 || bands.length > 0) bands.push(others)

  const nonZeroBuckets = totalViewersByBucket.filter((value) => value > 0).length
  const source = demoRows > 0 && demoRows >= Math.max(1, rows.length / 2) ? 'demo' : 'api'
  const state = rows.length === 0 ? 'empty' : nonZeroBuckets < Math.max(1, Math.ceil(bucketAggs.length * 0.2)) ? 'partial' : 'ok'
  const coverageNote = rows.length === 0
    ? 'No observed Twitch snapshots exist for this Day Flow window.'
    : `${nonZeroBuckets} of ${bucketAggs.length} ${bucketSize}m buckets contain observed Twitch snapshots.`
  const topLeader = topStreams[0]
  const peakLeader = topStreams.reduce<StreamAgg | null>((best, stream) => !best || stream.peakViewers > best.peakViewers ? stream : best, null)
  const biggestRise = topStreams.reduce<StreamAgg | null>((best, stream) => !best || stream.biggestRiseValue > best.biggestRiseValue ? stream : best, null)

  return {
    ok: true,
    source,
    state,
    status: state === 'empty' ? 'Empty' : state === 'partial' ? 'Partial' : 'Fresh',
    note: 'ViewLoom-owned Day Flow payload generated from observed minute snapshots.',
    coverageNote,
    partialNote: state === 'partial' ? 'This Day Flow window is based on partial observed snapshots.' : undefined,
    lastUpdated: latestUpdated,
    selectedDate: period.selectedDate,
    bucketSize,
    topN,
    valueMode,
    rangeMode: period.rangeMode,
    windowStart: period.windowStart,
    windowEnd: period.windowEnd,
    isRolling: period.isRolling,
    summary: {
      peakLeader: peakLeader?.name,
      longestDominance: topLeader?.name,
      highestActivity: undefined,
      biggestRise: biggestRise?.biggestRiseBucket ? biggestRise.name : undefined,
    },
    buckets: bucketIso,
    totalViewersByBucket,
    bands,
    focusSnapshot: { highestActivity: undefined },
    detailPanelSource: {
      defaultStreamerId: topStreams[0]?.id ?? null,
      streamers: topStreams.map((stream) => ({
        streamerId: stream.id,
        name: stream.name,
        title: stream.title,
        url: stream.url,
        peakViewers: Math.round(stream.peakViewers),
        avgViewers: stream.observations > 0 ? Math.round(stream.viewerMinutes / Math.max(1, stream.observations * bucketSize)) : 0,
        viewerMinutes: Math.round(stream.viewerMinutes),
        peakShare: maxShare(stream.id, bucketAggs, totalViewersByBucket),
        biggestRiseTime: stream.biggestRiseBucket,
        firstSeen: stream.firstSeen,
        lastSeen: stream.lastSeen,
      })),
    },
    activity: {
      available: false,
      note: 'Activity is not yet available in the ViewLoom-owned Day Flow payload. Viewer volume and share remain available.',
    },
  }
}

function buildBand(stream: StreamAgg, buckets: BucketAgg[], bucketSize: BucketSize, totals: number[]) {
  const bucketValues = buckets.map((bucket, index) => {
    const viewers = bucket.streams.get(stream.id) ?? 0
    return {
      viewers,
      share: totals[index] > 0 ? viewers / totals[index] : 0,
      activity: 0,
      activityAvailable: false,
      peak: viewers === stream.peakViewers && viewers > 0,
      rise: stream.biggestRiseBucket === bucket.bucketIso,
    }
  })
  return {
    streamerId: stream.id,
    name: stream.name,
    title: stream.title,
    url: stream.url,
    isOthers: false,
    totalViewerMinutes: Math.round(stream.viewerMinutes),
    peakViewers: Math.round(stream.peakViewers),
    avgViewers: stream.observations > 0 ? Math.round(stream.viewerMinutes / Math.max(1, stream.observations * bucketSize)) : 0,
    peakShare: maxShare(stream.id, buckets, totals),
    biggestRiseBucket: stream.biggestRiseBucket,
    firstSeen: stream.firstSeen,
    lastSeen: stream.lastSeen,
    buckets: bucketValues,
  }
}

function buildOthersBand(buckets: BucketAgg[], topIds: Set<string>, totals: number[]) {
  let viewerMinutes = 0
  let peakViewers = 0
  const values = buckets.map((bucket, index) => {
    const topTotal = [...bucket.streams.entries()].reduce((sum, [id, viewers]) => topIds.has(id) ? sum + viewers : sum, 0)
    const viewers = Math.max(0, bucket.totalViewers - topTotal)
    viewerMinutes += viewers
    peakViewers = Math.max(peakViewers, viewers)
    return {
      viewers,
      share: totals[index] > 0 ? viewers / totals[index] : 0,
      activity: 0,
      activityAvailable: false,
      peak: false,
      rise: false,
    }
  })
  return {
    streamerId: 'others',
    name: 'Others',
    isOthers: true,
    totalViewerMinutes: Math.round(viewerMinutes),
    peakViewers: Math.round(peakViewers),
    avgViewers: buckets.length > 0 ? Math.round(viewerMinutes / buckets.length) : 0,
    peakShare: Math.max(0, ...values.map((bucket) => bucket.share)),
    biggestRiseBucket: null,
    firstSeen: null,
    lastSeen: null,
    buckets: values,
  }
}

function ensureStream(map: Map<string, StreamAgg>, id: string, displayName: string, item: HeatmapItem): StreamAgg {
  const existing = map.get(id)
  if (existing) return existing
  const url = item.url || (item.channelLogin ? `https://www.twitch.tv/${encodeURIComponent(item.channelLogin)}` : '')
  const created: StreamAgg = {
    id,
    name: displayName,
    title: String(item.title ?? ''),
    url,
    viewerMinutes: 0,
    peakViewers: 0,
    observations: 0,
    firstSeen: null,
    lastSeen: null,
    biggestRiseBucket: null,
    biggestRiseValue: 0,
    previousViewers: null,
  }
  map.set(id, created)
  return created
}

function readItems(payloadJson: string): HeatmapItem[] {
  try {
    const parsed = JSON.parse(payloadJson) as { items?: HeatmapItem[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

function buildPeriod(rangeMode: RangeMode, selectedDate: string): Period {
  const now = new Date()
  if (rangeMode === 'rolling24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return { rangeMode, selectedDate: now.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: now.toISOString(), isRolling: true }
  }
  if (rangeMode === 'yesterday') {
    const start = startOfUtcDay(now)
    start.setUTCDate(start.getUTCDate() - 1)
    const end = new Date(start)
    end.setUTCHours(23, 59, 59, 999)
    return { rangeMode, selectedDate: start.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: end.toISOString(), isRolling: false }
  }
  if (rangeMode === 'date') {
    const start = new Date(`${selectedDate}T00:00:00.000Z`)
    const end = new Date(`${selectedDate}T23:59:59.999Z`)
    return { rangeMode, selectedDate, windowStart: start.toISOString(), windowEnd: end.toISOString(), isRolling: false }
  }
  const start = startOfUtcDay(now)
  return { rangeMode: 'today', selectedDate: start.toISOString().slice(0, 10), windowStart: start.toISOString(), windowEnd: now.toISOString(), isRolling: false }
}

function buildBucketList(fromIso: string, toIso: string, bucketSize: BucketSize): string[] {
  const buckets: string[] = []
  const step = bucketSize * 60 * 1000
  let cursor = Date.parse(floorToBucket(fromIso, bucketSize))
  const end = Date.parse(toIso)
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

function maxShare(streamId: string, buckets: BucketAgg[], totals: number[]): number {
  return Math.max(0, ...buckets.map((bucket, index) => {
    const viewers = bucket.streams.get(streamId) ?? 0
    return totals[index] > 0 ? viewers / totals[index] : 0
  }))
}

function normalizeRange(value: unknown): RangeMode {
  return value === 'rolling24h' || value === 'yesterday' || value === 'date' ? value : 'today'
}

function normalizeMetric(value: unknown): MetricMode {
  return value === 'share' ? 'share' : 'volume'
}

function normalizeTop(value: unknown): 10 | 20 | 50 {
  const n = Number(value)
  if (n === 10 || n === 50) return n
  return 20
}

function normalizeBucket(value: unknown): BucketSize {
  return Number(value) === 10 ? 10 : 5
}

function normalizeDate(value: string | null): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ? String(value) : new Date().toISOString().slice(0, 10)
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0))
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
