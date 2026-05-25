import type { Env } from '../_db/env'

type SnapshotRow = { bucket_minute: string; total_viewers: number; stream_count: number; payload_json: string; source_mode: string }
type RollupRow = { day: string; total_viewer_minutes: number; peak_viewers: number; peak_streamer_name: string | null; observed_snapshots: number; observed_stream_count: number; top_streamers_json: string; coverage_state: string }
type StreamAgg = { id: string; displayName: string; viewerMinutes: number; peakViewers: number; observedMinutes: number }

type Period = { from: string; to: string; label: string }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)
  const days = dayCount(period.from, period.to)
  if (days > 90) return errorResponse(period, metric, 'range_too_large', 'History custom range is limited to 90 days in v1.', 400)

  try {
    const previous = previousPeriod(period.from, period.to)
    const rollups = await tryRollups(env, period.from, period.to)
    if (rollups.length > 0) {
      const previousRollups = await tryRollups(env, previous.from, previous.to)
      return Response.json(payload(period, metric, 'daily_rollups', fromRollups(rollups, previousRollups)), { headers: { 'cache-control': 'no-store' } })
    }

    const rows = await fetchRows(env, period.from, period.to)
    const previousRows = await fetchRows(env, previous.from, previous.to)
    return Response.json(payload(period, metric, 'minute_snapshots', fromRaw(rows, previousRows)), { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return errorResponse(period, metric, 'history_api_error', error instanceof Error ? error.message : 'History API failed.', 500)
  }
}

async function tryRollups(env: Env, from: string, to: string): Promise<RollupRow[]> {
  try {
    const result = await env.DB_TWITCH_HOT.prepare(`
      SELECT day,total_viewer_minutes,peak_viewers,peak_streamer_name,observed_snapshots,observed_stream_count,top_streamers_json,coverage_state
      FROM daily_rollups
      WHERE provider = ? AND day >= ? AND day <= ?
      ORDER BY day ASC
    `).bind('twitch', from, to).all<RollupRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

async function fetchRows(env: Env, from: string, to: string): Promise<SnapshotRow[]> {
  const result = await env.DB_TWITCH_HOT.prepare(`
    SELECT bucket_minute,total_viewers,stream_count,payload_json,source_mode
    FROM minute_snapshots
    WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
    ORDER BY bucket_minute ASC
  `).bind('twitch', `${from}T00:00:00.000Z`, nextDayIso(to)).all<SnapshotRow>()
  return result.results ?? []
}

function fromRollups(rows: RollupRow[], previous: RollupRow[]) {
  const daily = rows.map((row) => ({
    day: row.day,
    totalViewerMinutes: num(row.total_viewer_minutes),
    peakViewers: num(row.peak_viewers),
    peakStreamerName: row.peak_streamer_name,
    observedStreamCount: num(row.observed_stream_count),
    observedMinutes: num(row.observed_snapshots) * 5,
    coverageState: row.coverage_state || 'partial',
  }))
  return { daily, topStreamers: ranked(streamsFromRollups(rows), streamsFromRollups(previous)) }
}

function streamsFromRollups(rows: RollupRow[]): Map<string, StreamAgg> {
  const map = new Map<string, StreamAgg>()
  for (const row of rows) for (const raw of jsonArray(row.top_streamers_json)) {
    const id = slug(raw.streamerId)
    if (!id) continue
    const current = map.get(id) ?? { id, displayName: String(raw.displayName || id), viewerMinutes: 0, peakViewers: 0, observedMinutes: 0 }
    current.displayName = String(raw.displayName || current.displayName)
    current.viewerMinutes += num(raw.viewerMinutes)
    current.peakViewers = Math.max(current.peakViewers, num(raw.peakViewers))
    current.observedMinutes += num(raw.observedMinutes)
    map.set(id, current)
  }
  return map
}

function fromRaw(rows: SnapshotRow[], previousRows: SnapshotRow[]) {
  const built = buildRaw(rows)
  const previous = buildRaw(previousRows)
  return { daily: [...built.days.values()].sort((a, b) => a.day.localeCompare(b.day)), topStreamers: ranked(built.streams, previous.streams) }
}

function buildRaw(rows: SnapshotRow[]) {
  const days = new Map<string, { day: string; totalViewerMinutes: number; peakViewers: number; peakStreamerName: string | null; observedStreamCount: number; observedMinutes: number; coverageState: string }>()
  const streams = new Map<string, StreamAgg>()
  for (const row of rows) {
    const dayKey = row.bucket_minute.slice(0, 10)
    const items = readItems(row.payload_json)
    const day = days.get(dayKey) ?? { day: dayKey, totalViewerMinutes: 0, peakViewers: 0, peakStreamerName: null, observedStreamCount: 0, observedMinutes: 0, coverageState: 'partial' }
    day.totalViewerMinutes += num(row.total_viewers)
    day.peakViewers = Math.max(day.peakViewers, num(row.total_viewers))
    day.observedMinutes += 1
    day.observedStreamCount = Math.max(day.observedStreamCount, num(row.stream_count))
    day.coverageState = row.source_mode === 'demo' ? 'demo' : day.observedMinutes >= 60 ? 'good' : 'partial'
    for (const item of items) {
      const id = slug(item.channelLogin ?? item.displayName)
      if (!id) continue
      const viewers = num(item.viewers)
      const name = String(item.displayName ?? item.channelLogin ?? id)
      if (!day.peakStreamerName || viewers >= day.peakViewers) day.peakStreamerName = name
      const stream = streams.get(id) ?? { id, displayName: name, viewerMinutes: 0, peakViewers: 0, observedMinutes: 0 }
      stream.viewerMinutes += viewers
      stream.peakViewers = Math.max(stream.peakViewers, viewers)
      stream.observedMinutes += 1
      streams.set(id, stream)
    }
    days.set(dayKey, day)
  }
  return { days, streams }
}

function payload(period: Period, metric: string, readPath: string, built: { daily: any[]; topStreamers: any[] }) {
  const coverage = coverageFor(period, built.daily)
  const summary = summaryFor(built.daily, built.topStreamers)
  return {
    source: 'api',
    state: built.daily.length === 0 ? 'empty' : coverage.state === 'good' ? 'ok' : 'partial',
    platform: 'twitch',
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    summary,
    daily: built.daily,
    topStreamers: built.topStreamers,
    coverage,
    readPath,
    notes: [`Twitch History read_path=${readPath}.`, 'Twitch and Kick history are intentionally not mixed in v1.'],
  }
}

function ranked(streams: Map<string, StreamAgg>, previous: Map<string, StreamAgg>) {
  const rankedByMinutes = [...streams.values()].sort((a, b) => b.viewerMinutes - a.viewerMinutes).slice(0, 30)
  const peakRank = new Map([...streams.values()].sort((a, b) => b.peakViewers - a.peakViewers).map((s, i) => [s.id, i + 1]))
  return rankedByMinutes.map((s, i) => {
    const prev = previous.get(s.id)
    return { streamerId: s.id, displayName: s.displayName, viewerMinutes: Math.round(s.viewerMinutes), peakViewers: Math.round(s.peakViewers), avgViewers: s.observedMinutes ? Math.round(s.viewerMinutes / s.observedMinutes) : 0, observedMinutes: s.observedMinutes, rankByViewerMinutes: i + 1, rankByPeak: peakRank.get(s.id) ?? i + 1, changePct: prev && prev.viewerMinutes > 0 ? (s.viewerMinutes - prev.viewerMinutes) / prev.viewerMinutes : null }
  })
}

function summaryFor(daily: any[], top: any[]) { if (!daily.length) return null; const peakDay = daily.reduce((best, day) => day.peakViewers > best.peakViewers ? day : best, daily[0]); return { totalViewerMinutes: daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0), peakViewers: peakDay.peakViewers, peakDay: peakDay.day, topStreamer: top[0] ?? null, biggestRise: null, coverageState: daily.some((day) => day.coverageState !== 'good') ? 'partial' : 'good' } }
function coverageFor(period: Period, daily: any[]) { const days = dayCount(period.from, period.to); const partialDays = daily.filter((day) => day.coverageState !== 'good').length; const missingDays = Math.max(0, days - daily.length); return { state: daily.length === 0 ? 'missing' : missingDays || partialDays ? 'partial' : 'good', observedDays: daily.length, missingDays, partialDays, notes: [`${daily.length} of ${days} requested days have observed Twitch history data.`] } }
function readItems(json: string): any[] { try { const parsed = JSON.parse(json); return Array.isArray(parsed?.items) ? parsed.items : [] } catch { return [] } }
function jsonArray(json: string): Array<Record<string, unknown>> { try { const parsed = JSON.parse(json); return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'object' && item !== null) : [] } catch { return [] } }
function getPeriod(url: URL): Period { const from = url.searchParams.get('from'); const to = url.searchParams.get('to'); if (from && to && isDay(from) && isDay(to)) return { from, to, label: `${from} to ${to}` }; const days = url.searchParams.get('period') === '7d' ? 7 : 30; const end = new Date(); const start = new Date(); start.setUTCDate(end.getUTCDate() - days + 1); return { from: dayString(start), to: dayString(end), label: days === 7 ? 'Last 7 days' : 'Last 30 days' } }
function previousPeriod(from: string, to: string): Period { const days = dayCount(from, to); const end = new Date(`${from}T00:00:00.000Z`); end.setUTCDate(end.getUTCDate() - 1); const start = new Date(end); start.setUTCDate(end.getUTCDate() - days + 1); return { from: dayString(start), to: dayString(end), label: 'Previous period' } }
function errorResponse(period: Period, metric: string, code: string, message: string, status: number) { return Response.json({ source: 'api', state: 'error', platform: 'twitch', period: { ...period, days: dayCount(period.from, period.to) }, metric, summary: null, daily: [], topStreamers: [], coverage: { state: 'missing', observedDays: 0, missingDays: 0, partialDays: 0, notes: [message] }, notes: [], error: { code, message } }, { status }) }
function nextDayIso(day: string): string { const date = new Date(`${day}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString() }
function dayCount(from: string, to: string): number { return Math.max(1, Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86400000) + 1) }
function dayString(date: Date): string { return date.toISOString().slice(0, 10) }
function isDay(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) }
function num(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
function slug(value: unknown): string { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') }
