import type { Env } from '../_db/env'

type SnapshotRow = {
  bucket_minute: string
  total_viewers: number
  stream_count: number
  payload_json: string
  source_mode: string
}

type HeatmapItem = {
  channelLogin?: string
  displayName?: string
  viewers?: number
}

type StreamAgg = {
  id: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
  observedMinutes: number
}

type DayAgg = {
  day: string
  totalViewerMinutes: number
  peakViewers: number
  peakStreamerName: string | null
  peakStreamerViewers: number
  observedStreamCount: number
  observedMinutes: number
  coverageState: string
  demoCount: number
}

type PublicDay = Omit<DayAgg, 'demoCount' | 'peakStreamerViewers'>

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)
  const requestedDays = dayCount(period.from, period.to)

  if (requestedDays > 90) {
    return errorResponse(period, metric, 'range_too_large', 'History custom range is limited to 90 days in v1.', 400)
  }

  try {
    const rows = await fetchRows(env, period.from, period.to)
    const previous = previousPeriod(period.from, period.to)
    const previousRows = await fetchRows(env, previous.from, previous.to)
    const built = buildHistory(rows)
    const previousBuilt = buildHistory(previousRows)
    const daily = [...built.days.values()].map(toPublicDay).sort((a, b) => a.day.localeCompare(b.day))
    const topStreamers = buildTopStreamers(built.streams, previousBuilt.streams)
    const summary = buildSummary(daily, topStreamers)
    const coverage = buildCoverage(period, daily)
    const coverageState = coverage.state

    return Response.json({
      source: 'api',
      state: daily.length === 0 ? 'empty' : coverageState === 'good' ? 'ok' : 'partial',
      platform: 'twitch',
      period: { ...period, days: requestedDays },
      metric,
      summary,
      daily,
      topStreamers,
      coverage,
      notes: [
        'Twitch History uses observed minute snapshots and payload-level streamer aggregation.',
        'Twitch and Kick history are intentionally not mixed in v1.',
      ],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'History API failed.'
    return errorResponse(period, metric, 'history_api_error', message, 500)
  }
}

async function fetchRows(env: Env, from: string, to: string): Promise<SnapshotRow[]> {
  const result = await env.DB_TWITCH_HOT.prepare(`
    SELECT bucket_minute, total_viewers, stream_count, payload_json, source_mode
    FROM minute_snapshots
    WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
    ORDER BY bucket_minute ASC
  `).bind('twitch', `${from}T00:00:00.000Z`, nextDayIso(to)).all<SnapshotRow>()
  return result.results ?? []
}

function buildHistory(rows: SnapshotRow[]): { days: Map<string, DayAgg>; streams: Map<string, StreamAgg> } {
  const days = new Map<string, DayAgg>()
  const streams = new Map<string, StreamAgg>()

  for (const row of rows) {
    const dayKey = row.bucket_minute.slice(0, 10)
    const day = ensureDay(days, dayKey)
    const items = readItems(row.payload_json)
    day.totalViewerMinutes += Math.round(row.total_viewers ?? 0)
    day.peakViewers = Math.max(day.peakViewers, Math.round(row.total_viewers ?? 0))
    day.observedMinutes += 1
    day.observedStreamCount = Math.max(day.observedStreamCount, row.stream_count ?? items.length)
    if (row.source_mode === 'demo') day.demoCount += 1

    for (const item of items) {
      const viewers = safeNumber(item.viewers)
      const id = slug(item.channelLogin ?? item.displayName ?? '')
      if (!id) continue
      const displayName = String(item.displayName ?? item.channelLogin ?? id)
      if (viewers > day.peakStreamerViewers) {
        day.peakStreamerViewers = viewers
        day.peakStreamerName = displayName
      }
      const stream = ensureStream(streams, id, displayName)
      stream.viewerMinutes += viewers
      stream.peakViewers = Math.max(stream.peakViewers, viewers)
      stream.observedMinutes += 1
    }
  }

  return { days, streams }
}

function readItems(payloadJson: string): HeatmapItem[] {
  try {
    const parsed = JSON.parse(payloadJson) as { items?: HeatmapItem[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

function buildTopStreamers(streams: Map<string, StreamAgg>, previous: Map<string, StreamAgg>) {
  const ranked = [...streams.values()].sort((a, b) => b.viewerMinutes - a.viewerMinutes).slice(0, 30)
  const peakOrder = [...streams.values()].sort((a, b) => b.peakViewers - a.peakViewers)
  const peakRank = new Map(peakOrder.map((stream, index) => [stream.id, index + 1]))
  return ranked.map((stream, index) => {
    const prev = previous.get(stream.id)
    const changePct = prev && prev.viewerMinutes > 0 ? (stream.viewerMinutes - prev.viewerMinutes) / prev.viewerMinutes : null
    return {
      streamerId: stream.id,
      displayName: stream.displayName,
      viewerMinutes: Math.round(stream.viewerMinutes),
      peakViewers: Math.round(stream.peakViewers),
      avgViewers: stream.observedMinutes > 0 ? Math.round(stream.viewerMinutes / stream.observedMinutes) : 0,
      observedMinutes: stream.observedMinutes,
      rankByViewerMinutes: index + 1,
      rankByPeak: peakRank.get(stream.id) ?? index + 1,
      changePct,
    }
  })
}

function buildSummary(daily: PublicDay[], topStreamers: ReturnType<typeof buildTopStreamers>) {
  if (daily.length === 0) return null
  const totalViewerMinutes = daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0)
  const peakDay = daily.reduce((best, day) => day.peakViewers > best.peakViewers ? day : best, daily[0])
  const risers = topStreamers.filter((stream) => stream.changePct !== null)
  const biggestRise = risers.sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0]
  const coverageState = daily.some((day) => day.coverageState !== 'good') ? 'partial' : 'good'
  return {
    totalViewerMinutes,
    peakViewers: peakDay.peakViewers,
    peakDay: peakDay.day,
    topStreamer: topStreamers[0] ?? null,
    biggestRise: biggestRise ? {
      id: biggestRise.streamerId,
      displayName: biggestRise.displayName,
      changePct: biggestRise.changePct ?? 0,
      changeAbs: biggestRise.viewerMinutes,
    } : null,
    coverageState,
  }
}

function buildCoverage(period: { from: string; to: string }, daily: PublicDay[]) {
  const days = dayCount(period.from, period.to)
  const observedDays = daily.length
  const partialDays = daily.filter((day) => day.coverageState !== 'good').length
  const missingDays = Math.max(0, days - observedDays)
  const state = daily.length === 0 ? 'missing' : missingDays > 0 || partialDays > 0 ? 'partial' : 'good'
  return {
    state,
    observedDays,
    missingDays,
    partialDays,
    notes: [`${observedDays} of ${days} requested days have observed Twitch snapshots.`],
  }
}

function toPublicDay(day: DayAgg): PublicDay {
  return {
    day: day.day,
    totalViewerMinutes: Math.round(day.totalViewerMinutes),
    peakViewers: Math.round(day.peakViewers),
    peakStreamerName: day.peakStreamerName,
    observedStreamCount: day.observedStreamCount,
    observedMinutes: day.observedMinutes,
    coverageState: day.demoCount > 0 ? 'demo' : day.observedMinutes >= 60 ? 'good' : 'partial',
  }
}

function ensureDay(map: Map<string, DayAgg>, key: string): DayAgg {
  const existing = map.get(key)
  if (existing) return existing
  const created: DayAgg = { day: key, totalViewerMinutes: 0, peakViewers: 0, peakStreamerName: null, peakStreamerViewers: 0, observedStreamCount: 0, observedMinutes: 0, coverageState: 'partial', demoCount: 0 }
  map.set(key, created)
  return created
}

function ensureStream(map: Map<string, StreamAgg>, id: string, displayName: string): StreamAgg {
  const existing = map.get(id)
  if (existing) return existing
  const created: StreamAgg = { id, displayName, viewerMinutes: 0, peakViewers: 0, observedMinutes: 0 }
  map.set(id, created)
  return created
}

function getPeriod(url: URL): { from: string; to: string; label: string } {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (from && to && isDay(from) && isDay(to)) return { from, to, label: `${from} to ${to}` }
  const days = url.searchParams.get('period') === '7d' ? 7 : 30
  const end = new Date()
  const start = new Date()
  start.setUTCDate(end.getUTCDate() - days + 1)
  return { from: dayString(start), to: dayString(end), label: days === 7 ? 'Last 7 days' : 'Last 30 days' }
}

function previousPeriod(from: string, to: string): { from: string; to: string } {
  const days = dayCount(from, to)
  const end = new Date(`${from}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - days + 1)
  return { from: dayString(start), to: dayString(end) }
}

function errorResponse(period: { from: string; to: string; label: string }, metric: string, code: string, message: string, status: number) {
  return Response.json({
    source: 'api',
    state: 'error',
    platform: 'twitch',
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    summary: null,
    daily: [],
    topStreamers: [],
    coverage: { state: 'missing', observedDays: 0, missingDays: 0, partialDays: 0, notes: [message] },
    notes: [],
    error: { code, message },
  }, { status })
}

function nextDayIso(day: string): string { const date = new Date(`${day}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString() }
function dayCount(from: string, to: string): number { return Math.max(1, Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86400000) + 1) }
function dayString(date: Date): string { return date.toISOString().slice(0, 10) }
function isDay(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) }
function safeNumber(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0 }
function slug(value: unknown): string { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') }
