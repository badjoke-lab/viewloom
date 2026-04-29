import type { Env } from '../_db/env'

type DailyRow = {
  day: string
  total_viewer_minutes: number
  peak_viewers: number
  snapshot_count: number
  max_stream_count: number
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)

  try {
    const result = await env.DB_TWITCH_HOT.prepare(`
      SELECT
        substr(bucket_minute, 1, 10) AS day,
        SUM(total_viewers) AS total_viewer_minutes,
        MAX(total_viewers) AS peak_viewers,
        COUNT(*) AS snapshot_count,
        MAX(stream_count) AS max_stream_count
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      GROUP BY substr(bucket_minute, 1, 10)
      ORDER BY day ASC
    `).bind('twitch', `${period.from}T00:00:00.000Z`, nextDayIso(period.to)).all<DailyRow>()

    const rows = result.results ?? []
    const daily = rows.map((row) => ({
      day: row.day,
      totalViewerMinutes: Math.round(row.total_viewer_minutes ?? 0),
      peakViewers: Math.round(row.peak_viewers ?? 0),
      peakStreamerName: null,
      observedStreamCount: row.max_stream_count ?? 0,
      observedMinutes: row.snapshot_count ?? 0,
      coverageState: (row.snapshot_count ?? 0) >= 60 ? 'good' : 'partial',
    }))

    const peakDay = daily.reduce((best, row) => row.peakViewers > best.peakViewers ? row : best, daily[0] ?? null)
    const totalViewerMinutes = daily.reduce((sum, row) => sum + row.totalViewerMinutes, 0)
    const partialDays = daily.filter((row) => row.coverageState !== 'good').length
    const requestedDays = dayCount(period.from, period.to)
    const missingDays = Math.max(0, requestedDays - daily.length)
    const coverageState = daily.length === 0 ? 'missing' : partialDays > 0 || missingDays > 0 ? 'partial' : 'good'

    return Response.json({
      source: 'api',
      state: daily.length === 0 ? 'empty' : coverageState === 'good' ? 'ok' : 'partial',
      platform: 'twitch',
      period: { ...period, days: requestedDays },
      metric,
      summary: daily.length === 0 ? null : {
        totalViewerMinutes,
        peakViewers: peakDay?.peakViewers ?? 0,
        peakDay: peakDay?.day ?? null,
        topStreamer: null,
        biggestRise: null,
        coverageState,
      },
      daily,
      topStreamers: [],
      coverage: {
        state: coverageState,
        observedDays: daily.length,
        missingDays,
        partialDays,
        notes: [`${daily.length} of ${requestedDays} requested days have observed Twitch snapshots.`],
      },
      notes: ['Twitch History v0 uses day-level totals from minute snapshots.', 'Streamer ranking will be expanded after payload-level aggregation is added.'],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'History API failed.'
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
      error: { code: 'history_api_error', message },
    }, { status: 500 })
  }
}

function getPeriod(url: URL): { from: string; to: string; label: string } {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (from && to) return { from, to, label: `${from} to ${to}` }
  const days = url.searchParams.get('period') === '7d' ? 7 : 30
  const end = new Date()
  const start = new Date()
  start.setUTCDate(end.getUTCDate() - days + 1)
  return { from: dayString(start), to: dayString(end), label: days === 7 ? 'Last 7 days' : 'Last 30 days' }
}

function nextDayIso(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

function dayCount(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00.000Z`)
  const end = Date.parse(`${to}T00:00:00.000Z`)
  return Math.max(1, Math.round((end - start) / 86400000) + 1)
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}
