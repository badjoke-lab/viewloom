export type SnapshotRow = {
  bucket_minute: string
  total_viewers: number
  stream_count: number
  payload_json: string
  source_mode: string
}

export type RollupRow = {
  day: string
  total_viewer_minutes: number
  peak_viewers: number
  peak_streamer_name: string | null
  observed_snapshots: number
  observed_stream_count: number
  top_streamers_json: string
  coverage_state: string
}

export type Period = { from: string; to: string; label: string }
export type StreamAgg = { id: string; displayName: string; viewerMinutes: number; peakViewers: number; observedMinutes: number }

export type RankedStream = {
  streamerId: string
  displayName: string
  viewerMinutes: number
  peakViewers: number
  avgViewers: number
  observedMinutes: number
  rankByViewerMinutes: number
  rankByPeak: number
  changePct: number | null
  changeAbs: number | null
  comparisonState: 'comparable' | 'new' | 'insufficient'
}

export type Rise = { streamerId: string; displayName: string; changePct: number; changeAbs: number }

export type DailySummary = {
  day: string
  totalViewerMinutes: number
  peakViewers: number
  peakStreamerName: string | null
  observedStreamCount: number
  observedMinutes: number
  coverageState: string
  topStreamers: RankedStream[]
  biggestRise: Rise | null
}

export type RawDay = {
  day: string
  totalViewerMinutes: number
  peakViewers: number
  peakStreamerName: string | null
  peakStreamerViewers: number
  observedStreamCount: number
  observedMinutes: number
  sawDemo: boolean
  streams: Map<string, StreamAgg>
}

export type BuiltHistory = { daily: DailySummary[]; topStreamers: RankedStream[] }

export const DEFAULT_SAMPLE_MINUTES = 5
export const MAX_SAMPLE_MINUTES = 5
export const PERIOD_BASELINE_MINUTES = 360
export const DAILY_BASELINE_MINUTES = 60

export function ranked(
  streams: Map<string, StreamAgg>,
  previous: Map<string, StreamAgg>,
  limit: number,
  baselineMinutes: number,
): RankedStream[] {
  const values = [...streams.values()]
  const byMinutes = [...values].sort((a, b) => b.viewerMinutes - a.viewerMinutes).slice(0, limit)
  const peakRank = new Map(
    [...values]
      .sort((a, b) => b.peakViewers - a.peakViewers)
      .map((stream, index) => [stream.id, index + 1]),
  )

  return byMinutes.map((stream, index) => {
    const prev = previous.get(stream.id)
    const minimumViewerMinutes = baselineMinutes >= PERIOD_BASELINE_MINUTES
      ? Math.max(100_000, stream.viewerMinutes * 0.2)
      : Math.max(10_000, stream.viewerMinutes * 0.1)
    const comparisonState: RankedStream['comparisonState'] = !prev
      ? 'new'
      : prev.observedMinutes < baselineMinutes || prev.viewerMinutes < minimumViewerMinutes
        ? 'insufficient'
        : 'comparable'
    const changeAbs = prev
      ? Math.round(stream.viewerMinutes - prev.viewerMinutes)
      : Math.round(stream.viewerMinutes)
    const changePct = comparisonState === 'comparable' && prev && prev.viewerMinutes > 0
      ? (stream.viewerMinutes - prev.viewerMinutes) / prev.viewerMinutes
      : null

    return {
      streamerId: stream.id,
      displayName: stream.displayName,
      viewerMinutes: Math.round(stream.viewerMinutes),
      peakViewers: Math.round(stream.peakViewers),
      avgViewers: stream.observedMinutes ? Math.round(stream.viewerMinutes / stream.observedMinutes) : 0,
      observedMinutes: Math.round(stream.observedMinutes),
      rankByViewerMinutes: index + 1,
      rankByPeak: peakRank.get(stream.id) ?? index + 1,
      changePct,
      changeAbs,
      comparisonState,
    }
  })
}

export function biggestRise(streams: RankedStream[]): Rise | null {
  const candidate = streams
    .filter((stream) => stream.comparisonState === 'comparable' && typeof stream.changePct === 'number' && stream.changePct > 0)
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))[0]
  if (!candidate || candidate.changePct == null) return null
  return {
    streamerId: candidate.streamerId,
    displayName: candidate.displayName,
    changePct: candidate.changePct,
    changeAbs: candidate.changeAbs ?? 0,
  }
}

export function buildPayload(
  provider: 'twitch' | 'kick',
  period: Period,
  metric: string,
  readPath: string,
  built: BuiltHistory,
  extra: Record<string, unknown> = {},
) {
  const coverage = coverageFor(provider, period, built.daily)
  const summary = summaryFor(built.daily, built.topStreamers)
  const allDemo = built.daily.length > 0 && built.daily.every((day) => day.coverageState === 'demo')
  return {
    source: allDemo ? 'demo' : 'real',
    state: built.daily.length === 0 ? 'empty' : allDemo ? 'demo' : coverage.state === 'good' ? 'fresh' : 'partial',
    platform: provider,
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    ...extra,
    summary,
    daily: built.daily,
    topStreamers: built.topStreamers,
    coverage,
    notes: [
      `${provider === 'twitch' ? 'Twitch' : 'Kick'} History read_path=${readPath}.`,
      'Twitch and Kick history are intentionally not mixed in v1.',
    ],
  }
}

export function summaryFor(daily: DailySummary[], top: RankedStream[]) {
  if (!daily.length) return null
  const today = dayString(new Date())
  const completedGood = daily.filter((day) => day.day < today && day.coverageState === 'good')
  const historical = daily.filter((day) => day.day < today)
  const summaryDays = completedGood.length ? completedGood : historical.length ? historical : daily
  const peakDay = summaryDays.reduce(
    (best, day) => day.totalViewerMinutes > best.totalViewerMinutes ? day : best,
    summaryDays[0],
  )
  const peakViewerDay = summaryDays.reduce(
    (best, day) => day.peakViewers > best.peakViewers ? day : best,
    summaryDays[0],
  )
  return {
    totalViewerMinutes: summaryDays.reduce((sum, day) => sum + day.totalViewerMinutes, 0),
    peakViewers: peakViewerDay.peakViewers,
    peakDay: peakDay.day,
    peakDayViewerMinutes: peakDay.totalViewerMinutes,
    topStreamer: top[0] ?? null,
    biggestRise: biggestRise(top),
    coverageState: daily.some((day) => day.coverageState !== 'good' || day.day === today) ? 'partial' : 'good',
    summaryScope: summaryDays.length === daily.length ? 'all_observed_days' : 'completed_days',
  }
}

export function coverageFor(provider: 'twitch' | 'kick', period: Period, daily: DailySummary[]) {
  const totalDays = dayCount(period.from, period.to)
  const today = dayString(new Date())
  const dailyMap = new Map(daily.map((day) => [day.day, day]))
  const requestedDays = enumerateDays(period.from, period.to)
  const missing = requestedDays.filter((day) => !dailyMap.has(day))
  const inProgress = daily.filter((day) => day.day === today).map((day) => day.day)
  const partial = daily
    .filter((day) => day.day !== today && day.coverageState !== 'good' && day.coverageState !== 'demo')
    .map((day) => day.day)
  const demo = daily.filter((day) => day.coverageState === 'demo').map((day) => day.day)
  const observedMinutes = daily.reduce((sum, day) => sum + day.observedMinutes, 0)
  const expectedMinutes = requestedDays.reduce((sum, day) => sum + expectedMinutesForDay(day), 0)
  const affectedDays = [...new Set([...inProgress, ...partial, ...missing, ...demo])]
  const state = daily.length === 0
    ? 'missing'
    : demo.length === daily.length
      ? 'demo'
      : inProgress.length || missing.length || partial.length || demo.length
        ? 'partial'
        : 'good'
  const platform = provider === 'twitch' ? 'Twitch' : 'Kick'
  const notes = [
    `${daily.length} of ${totalDays} requested days have observed ${platform} history data.`,
    `${inProgress.length} in-progress day, ${partial.length} partial day${partial.length === 1 ? '' : 's'}, and ${missing.length} missing day${missing.length === 1 ? '' : 's'} were detected.`,
  ]
  return {
    state,
    observedDays: daily.length,
    missingDays: missing.length,
    partialDays: partial.length + demo.length,
    inProgressDays: inProgress.length,
    observedMinutes,
    expectedMinutes,
    affectedDays,
    notes,
  }
}

export function expectedMinutesForDay(day: string): number {
  const today = dayString(new Date())
  if (day < today) return 1440
  if (day > today) return 0
  const now = new Date()
  return now.getUTCHours() * 60 + now.getUTCMinutes() + 1
}

export function getPeriod(url: URL): Period {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (from && to && isDay(from) && isDay(to) && from <= to) return { from, to, label: `${from} to ${to}` }
  const days = url.searchParams.get('period') === '7d' ? 7 : 30
  const end = new Date()
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - days + 1)
  return { from: dayString(start), to: dayString(end), label: days === 7 ? 'Last 7 days' : 'Last 30 days' }
}

export function previousPeriod(from: string, to: string): Period {
  const days = dayCount(from, to)
  const end = new Date(`${from}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() - 1)
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - days + 1)
  return { from: dayString(start), to: dayString(end), label: 'Previous period' }
}

export function errorResponse(
  provider: 'twitch' | 'kick',
  period: Period,
  metric: string,
  code: string,
  message: string,
  status: number,
  extra: Record<string, unknown> = {},
) {
  return Response.json({
    source: 'real',
    state: 'error',
    platform: provider,
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    ...extra,
    summary: null,
    daily: [],
    topStreamers: [],
    coverage: {
      state: 'missing',
      observedDays: 0,
      missingDays: dayCount(period.from, period.to),
      partialDays: 0,
      inProgressDays: 0,
      observedMinutes: 0,
      expectedMinutes: 0,
      affectedDays: enumerateDays(period.from, period.to),
      notes: [message],
    },
    notes: [],
    error: { code, message },
  }, { status, headers: { 'cache-control': 'no-store' } })
}

export function enumerateDays(from: string, to: string): string[] {
  const days: string[] = []
  const cursor = new Date(`${from}T00:00:00.000Z`)
  const end = Date.parse(`${to}T00:00:00.000Z`)
  while (cursor.getTime() <= end) {
    days.push(dayString(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return dayString(date)
}

export function nextDayIso(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString()
}

export function dayCount(from: string, to: string): number {
  return Math.max(1, Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / 86400000) + 1)
}

export function dayString(date: Date): string { return date.toISOString().slice(0, 10) }
export function isDay(value: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(value) }
export function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
export function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value)
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }
  return 0
}
export function slug(value: unknown): string { return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '') }
