import type { Env } from '../_db/env'

type Row = { bucket_minute: string; total_viewers: number; stream_count: number; payload_json: string; source_mode: string }
type RollupRow = { day: string; total_viewer_minutes: number; peak_viewers: number; peak_streamer_name: string | null; observed_snapshots: number; observed_stream_count: number; top_streamers_json: string; coverage_state: string }
type Item = Record<string, unknown>
type Day = { day: string; totalViewerMinutes: number; peakViewers: number; peakStreamerName: string | null; observedStreamCount: number; observedMinutes: number; coverageState: string }
type Stream = { streamerId: string; displayName: string; viewerMinutes: number; peakViewers: number; avgViewers: number; observedMinutes: number; rankByViewerMinutes: number; rankByPeak: number; changePct: number | null }
type Period = { from: string; to: string; label: string }

const DEFAULT_SAMPLE_MINUTES = 5
const MAX_SAMPLE_MINUTES = 5

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)
  const days = dayCount(period.from, period.to)
  if (days > 90) return error(period, metric, 'range_too_large', 'History custom range is limited to 90 days in v1.', 400)

  try {
    const rollups = await tryRollups(env, period.from, period.to)
    if (rollups.length > 0) {
      const built = fromRollups(rollups)
      return Response.json(response(period, metric, 'daily_rollups', built), { headers: { 'cache-control': 'no-store' } })
    }

    const rows = await rowsFor(env, period.from, period.to)
    const built = fromRaw(rows)
    return Response.json(response(period, metric, 'minute_snapshots', built), { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    return error(period, metric, 'history_api_error', err instanceof Error ? err.message : String(err), 500)
  }
}

async function tryRollups(env: Env, from: string, to: string): Promise<RollupRow[]> {
  try {
    const result = await env.DB_KICK_HOT.prepare(`
      SELECT day,total_viewer_minutes,peak_viewers,peak_streamer_name,observed_snapshots,observed_stream_count,top_streamers_json,coverage_state
      FROM daily_rollups
      WHERE provider = ? AND day >= ? AND day <= ?
      ORDER BY day ASC
    `).bind('kick', from, to).all<RollupRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

async function rowsFor(env: Env, from: string, to: string): Promise<Row[]> {
  const result = await env.DB_KICK_HOT.prepare(`
    SELECT bucket_minute,total_viewers,stream_count,payload_json,source_mode
    FROM minute_snapshots
    WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
    ORDER BY bucket_minute ASC
  `).bind('kick', `${from}T00:00:00.000Z`, nextDay(to)).all<Row>()
  return result.results ?? []
}

function fromRollups(rows: RollupRow[]) {
  const daily = rows.map((row) => ({ day: row.day, totalViewerMinutes: number(row.total_viewer_minutes), peakViewers: number(row.peak_viewers), peakStreamerName: row.peak_streamer_name, observedStreamCount: number(row.observed_stream_count), observedMinutes: number(row.observed_snapshots) * 5, coverageState: row.coverage_state || 'partial' }))
  return { daily, topStreamers: rank([...streamsFromRollups(rows).values()]) }
}

function streamsFromRollups(rows: RollupRow[]) {
  const streams = new Map<string, Omit<Stream, 'avgViewers' | 'rankByViewerMinutes' | 'rankByPeak' | 'changePct'>>()
  for (const row of rows) for (const item of jsonArray(row.top_streamers_json)) {
    const streamerId = slug(item.streamerId)
    if (!streamerId) continue
    const current = streams.get(streamerId) ?? { streamerId, displayName: String(item.displayName || streamerId), viewerMinutes: 0, peakViewers: 0, observedMinutes: 0 }
    current.displayName = String(item.displayName || current.displayName)
    current.viewerMinutes += number(item.viewerMinutes)
    current.peakViewers = Math.max(current.peakViewers, number(item.peakViewers))
    current.observedMinutes += number(item.observedMinutes)
    streams.set(streamerId, current)
  }
  return streams
}

function fromRaw(rows: Row[]) {
  const built = build(rows)
  return { daily: [...built.days.values()].sort((a, b) => a.day.localeCompare(b.day)), topStreamers: rank([...built.streams.values()]) }
}

function build(rows: Row[]) {
  const days = new Map<string, Day>()
  const streams = new Map<string, Omit<Stream, 'avgViewers' | 'rankByViewerMinutes' | 'rankByPeak' | 'changePct'>>()
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const weightMinutes = sampleWeightMinutes(rows, index)
    const key = row.bucket_minute.slice(0, 10)
    const day = days.get(key) ?? { day: key, totalViewerMinutes: 0, peakViewers: 0, peakStreamerName: null, observedStreamCount: 0, observedMinutes: 0, coverageState: 'partial' }
    day.totalViewerMinutes += Math.round(row.total_viewers || 0) * weightMinutes
    day.peakViewers = Math.max(day.peakViewers, Math.round(row.total_viewers || 0))
    day.observedStreamCount = Math.max(day.observedStreamCount, row.stream_count || 0)
    day.observedMinutes += weightMinutes
    day.coverageState = row.source_mode === 'demo' || row.source_mode === 'fixture' ? 'demo' : day.observedMinutes >= 60 ? 'good' : 'partial'
    for (const item of items(row.payload_json)) {
      const parsed = stream(item)
      if (!parsed) continue
      if (!day.peakStreamerName || parsed.viewers > day.peakViewers) day.peakStreamerName = parsed.displayName
      const current = streams.get(parsed.streamerId) ?? { streamerId: parsed.streamerId, displayName: parsed.displayName, viewerMinutes: 0, peakViewers: 0, observedMinutes: 0 }
      current.viewerMinutes += parsed.viewers * weightMinutes
      current.peakViewers = Math.max(current.peakViewers, parsed.viewers)
      current.observedMinutes += weightMinutes
      streams.set(parsed.streamerId, current)
    }
    days.set(key, day)
  }
  return { days, streams }
}

function response(period: Period, metric: string, readPath: string, built: { daily: Day[]; topStreamers: Stream[] }) {
  const coverage = coverageFor(period, built.daily)
  return {
    source: 'api',
    state: built.daily.length === 0 ? 'empty' : coverage.state === 'good' ? 'ok' : 'partial',
    platform: 'kick',
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    targetSource: 'unknown',
    coverageMode: 'unknown',
    sampleWeightMode: readPath === 'daily_rollups' ? 'daily_rollups_5m' : 'observed_interval_capped_5m',
    summary: summarize(built.daily, built.topStreamers),
    daily: built.daily,
    topStreamers: built.topStreamers,
    coverage,
    readPath,
    notes: ['storage=DB_KICK_HOT', `read_path=${readPath}`],
  }
}

function sampleWeightMinutes(rows: Row[], index: number): number {
  const current = rows[index]
  const next = rows[index + 1]
  const previous = rows[index - 1]
  const currentTime = Date.parse(current.bucket_minute)
  const currentDay = current.bucket_minute.slice(0, 10)
  if (next && next.bucket_minute.slice(0, 10) === currentDay) return boundedMinutes(Date.parse(next.bucket_minute) - currentTime)
  if (previous && previous.bucket_minute.slice(0, 10) === currentDay) return boundedMinutes(currentTime - Date.parse(previous.bucket_minute))
  return DEFAULT_SAMPLE_MINUTES
}

function boundedMinutes(ms: number): number { const minutes = Math.round(ms / 60000); if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_SAMPLE_MINUTES; return Math.max(1, Math.min(MAX_SAMPLE_MINUTES, minutes)) }
function items(json: string): Item[] { try { const parsed = JSON.parse(json) as unknown; if (Array.isArray(parsed)) return parsed.filter(record); if (!record(parsed)) return []; if (Array.isArray(parsed.items)) return parsed.items.filter(record); if (Array.isArray(parsed.data)) return parsed.data.filter(record) } catch {} return [] }
function jsonArray(json: string): Item[] { try { const parsed = JSON.parse(json); return Array.isArray(parsed) ? parsed.filter(record) : [] } catch { return [] } }
function stream(item: Item): { streamerId: string; displayName: string; viewers: number } | null { const channel = record(item.channel) ? item.channel : null; const live = record(item.livestream) ? item.livestream : null; const rawId = item.channelLogin ?? item.slug ?? item.username ?? item.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name; const rawName = item.displayName ?? item.name ?? item.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? rawId; const viewers = number(item.viewers ?? item.viewer_count ?? item.viewerCount ?? live?.viewer_count); const streamerId = slug(rawId ?? rawName ?? ''); if (!streamerId || viewers <= 0) return null; return { streamerId, displayName: String(rawName ?? streamerId), viewers } }
function rank(values: Array<Omit<Stream, 'avgViewers' | 'rankByViewerMinutes' | 'rankByPeak' | 'changePct'>>): Stream[] { const byMinutes = values.sort((a, b) => b.viewerMinutes - a.viewerMinutes).slice(0, 30); const peakRank = new Map([...values].sort((a, b) => b.peakViewers - a.peakViewers).map((s, i) => [s.streamerId, i + 1])); return byMinutes.map((s, i) => ({ ...s, viewerMinutes: Math.round(s.viewerMinutes), peakViewers: Math.round(s.peakViewers), avgViewers: s.observedMinutes ? Math.round(s.viewerMinutes / s.observedMinutes) : 0, rankByViewerMinutes: i + 1, rankByPeak: peakRank.get(s.streamerId) ?? i + 1, changePct: null })) }
function summarize(daily: Day[], top: Stream[]) { if (!daily.length) return null; const peakDay = daily.reduce((best, day) => day.peakViewers > best.peakViewers ? day : best, daily[0]); return { totalViewerMinutes: daily.reduce((sum, day) => sum + day.totalViewerMinutes, 0), peakViewers: peakDay.peakViewers, peakDay: peakDay.day, topStreamer: top[0] ?? null, biggestRise: null, coverageState: daily.some((day) => day.coverageState !== 'good') ? 'partial' : 'good' } }
function coverageFor(period: Period, daily: Day[]) { const total = dayCount(period.from, period.to); const partialDays = daily.filter((day) => day.coverageState !== 'good').length; const missingDays = Math.max(0, total - daily.length); return { state: daily.length === 0 ? 'missing' : missingDays || partialDays ? 'partial' : 'good', observedDays: daily.length, missingDays, partialDays, notes: [`${daily.length} of ${total} requested days have observed Kick history data.`] } }
function getPeriod(url: URL) { const from = url.searchParams.get('from'); const to = url.searchParams.get('to'); if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) return { from, to, label: `${from} to ${to}` }; const days = url.searchParams.get('period') === '7d' ? 7 : 30; const end = new Date(); const start = new Date(); start.setUTCDate(end.getUTCDate() - days + 1); return { from: day(start), to: day(end), label: days === 7 ? 'Last 7 days' : 'Last 30 days' } }
function error(period: Period, metric: string, code: string, message: string, status: number) { return Response.json({ source: 'api', state: 'error', platform: 'kick', period: { ...period, days: dayCount(period.from, period.to) }, metric, targetSource: 'unknown', coverageMode: 'unknown', sampleWeightMode: 'observed_interval_capped_5m', summary: null, daily: [], topStreamers: [], coverage: { state: 'missing', observedDays: 0, missingDays: 0, partialDays: 0, notes: [message] }, notes: ['storage=DB_KICK_HOT', 'target_source=unknown', 'coverage_mode=unknown', 'sample_weight=observed_interval_capped_5m'], error: { code, message } }, { status, headers: { 'cache-control': 'no-store' } }) }
function nextDay(value: string): string { const date = new Date(`${value}T00:00:00.000Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString() }
function dayCount(from: string, to: string): number { return Math.max(1, Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86400000) + 1) }
function day(date: Date): string { return date.toISOString().slice(0, 10) }
function record(value: unknown): value is Item { return typeof value === 'object' && value !== null }
function number(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
function slug(value: unknown): string { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') }
