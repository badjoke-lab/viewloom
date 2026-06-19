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

export type BuiltHistory = {
  daily: DailySummary[]
  previousDaily: DailySummary[]
  topStreamers: RankedStream[]
  comparisonAvailable: boolean
}

export type PeriodComparisonState = 'comparable' | 'partial' | 'unavailable'

export type PeriodComparisonSide = {
  requestedFrom: string
  requestedTo: string
  from: string | null
  to: string | null
  selectedDays: number
  totalViewerMinutes: number
  peakViewers: number
  averageViewers: number
  observedMinutes: number
  coverageState: string
}

export const DEFAULT_SAMPLE_MINUTES = 5
export const MAX_SAMPLE_MINUTES = 5
export const PERIOD_BASELINE_MINUTES = 360
export const DAILY_BASELINE_MINUTES = 60

export function ranked(
  streams: Map<string, StreamAgg>,
  previous: Map<string, StreamAgg>,
  limit: number,
  baselineMinutes: number,
  previousPeriodAvailable = true,
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
    const comparisonState: RankedStream['comparisonState'] = !previousPeriodAvailable
      ? 'insufficient'
      : !prev
        ? 'new'
        : prev.observedMinutes < baselineMinutes || prev.viewerMinutes < minimumViewerMinutes
          ? 'insufficient'
          : 'comparable'
    const changeAbs = prev
      ? Math.round(stream.viewerMinutes - prev.viewerMinutes)
      : previousPeriodAvailable
        ? Math.round(stream.viewerMinutes)
        : null
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
  const daily = fillMissingDays(period, built.daily)
  const coverage = coverageFor(provider, period, daily)
  const summary = summaryFor(daily, built.topStreamers)
  const periodComparison = periodComparisonFor(provider, period, daily, built.previousDaily, built.comparisonAvailable)
  const observed = daily.filter((day) => day.coverageState !== 'missing')
  const allDemo = observed.length > 0 && observed.every((day) => day.coverageState === 'demo')
  return {
    source: allDemo ? 'demo' : 'real',
    state: observed.length === 0 ? 'empty' : allDemo ? 'demo' : coverage.state === 'good' ? 'fresh' : 'partial',
    platform: provider,
    period: { ...period, days: dayCount(period.from, period.to) },
    metric,
    ...extra,
    comparison: {
      previousPeriodAvailable: built.comparisonAvailable,
      period: periodComparison,
    },
    periodComparison,
    summary,
    daily,
    topStreamers: built.topStreamers,
    coverage,
    notes: [
      `${provider === 'twitch' ? 'Twitch' : 'Kick'} History read_path=${readPath}.`,
      'Twitch and Kick history are intentionally not mixed in v1.',
    ],
  }
}

export function summaryDaysFor(daily: DailySummary[]): DailySummary[] {
  const observedDaily = daily.filter((day) => day.coverageState !== 'missing')
  if (!observedDaily.length) return []
  const today = dayString(new Date())
  const completedGood = observedDaily.filter((day) => day.day < today && day.coverageState === 'good')
  const historical = observedDaily.filter((day) => day.day < today)
  return completedGood.length ? completedGood : historical.length ? historical : observedDaily
}

export function summaryFor(daily: DailySummary[], top: RankedStream[]) {
  const observedDaily = daily.filter((day) => day.coverageState !== 'missing')
  const summaryDays = summaryDaysFor(daily)
  if (!summaryDays.length) return null
  const today = dayString(new Date())
  const peakDay = summaryDays.reduce(
    (best, day) => day.totalViewerMinutes > best.totalViewerMinutes ? day : best,
    summaryDays[0],
  )
  const peakViewerDay = summaryDays.reduce(
    (best, day) => day.peakViewers > best.peakViewers ? day : best,
    summaryDays[0],
  )
  const totalViewerMinutes = summaryDays.reduce((sum, day) => sum + day.totalViewerMinutes, 0)
  const observedMinutes = summaryDays.reduce((sum, day) => sum + day.observedMinutes, 0)
  return {
    totalViewerMinutes,
    peakViewers: peakViewerDay.peakViewers,
    peakDay: peakDay.day,
    peakDayViewerMinutes: peakDay.totalViewerMinutes,
    topStreamer: top[0] ?? null,
    biggestRise: biggestRise(top),
    averageViewers: observedMinutes > 0 ? Math.round(totalViewerMinutes / observedMinutes) : 0,
    observedMinutes,
    summaryDayCount: summaryDays.length,
    summaryFrom: summaryDays[0]?.day ?? null,
    summaryTo: summaryDays.at(-1)?.day ?? null,
    coverageState: daily.some((day) => day.coverageState !== 'good' || day.day === today) ? 'partial' : 'good',
    summaryScope: summaryDays.length === observedDaily.length ? 'all_observed_days' : 'completed_days',
  }
}

export function periodComparisonFor(
  provider: 'twitch' | 'kick',
  period: Period,
  currentDaily: DailySummary[],
  previousDaily: DailySummary[],
  previousPeriodAvailable = true,
) {
  const previousRequestedPeriod = previousPeriod(period.from, period.to)
  const currentSelected = summaryDaysFor(currentDaily)
  const previousFilled = fillMissingDays(previousRequestedPeriod, previousDaily)
  const previousCandidates = summaryDaysFor(previousFilled)
  const previousSelected = currentSelected.length > 0 ? previousCandidates.slice(-currentSelected.length) : []
  const current = comparisonSide(period, currentSelected)
  const previous = comparisonSide(previousRequestedPeriod, previousSelected)
  const alignedDayCount = current.selectedDays > 0 && current.selectedDays === previous.selectedDays
  const completeCoverage = current.coverageState === 'good' && previous.coverageState === 'good'
  const state: PeriodComparisonState = !previousPeriodAvailable || current.selectedDays === 0 || previous.selectedDays === 0
    ? 'unavailable'
    : alignedDayCount && completeCoverage
      ? 'comparable'
      : 'partial'
  const reason = state === 'comparable'
    ? 'Equal completed-day scopes with complete coverage.'
    : !previousPeriodAvailable || previous.selectedDays === 0
      ? 'The immediately preceding period does not have enough retained observations.'
      : !alignedDayCount
        ? `Current and previous scopes contain ${current.selectedDays} and ${previous.selectedDays} selected days.`
        : 'One or both selected scopes use partial or demo coverage; percentage changes are withheld.'

  return {
    state,
    scope: 'completed_observed_days',
    provider,
    providerSeparated: true,
    inProgressDayExcluded: true,
    alignedDayCount,
    reason,
    current,
    previous,
    changes: state === 'comparable'
      ? {
          totalViewerMinutes: comparisonChange(current.totalViewerMinutes, previous.totalViewerMinutes),
          peakViewers: comparisonChange(current.peakViewers, previous.peakViewers),
          averageViewers: comparisonChange(current.averageViewers, previous.averageViewers),
        }
      : null,
  }
}

function comparisonSide(requestedPeriod: Period, selectedDays: DailySummary[]): PeriodComparisonSide {
  const totalViewerMinutes = selectedDays.reduce((sum, day) => sum + day.totalViewerMinutes, 0)
  const observedMinutes = selectedDays.reduce((sum, day) => sum + day.observedMinutes, 0)
  const peakViewers = selectedDays.reduce((peak, day) => Math.max(peak, day.peakViewers), 0)
  const allGood = selectedDays.length > 0 && selectedDays.every((day) => day.coverageState === 'good')
  const allDemo = selectedDays.length > 0 && selectedDays.every((day) => day.coverageState === 'demo')
  return {
    requestedFrom: requestedPeriod.from,
    requestedTo: requestedPeriod.to,
    from: selectedDays[0]?.day ?? null,
    to: selectedDays.at(-1)?.day ?? null,
    selectedDays: selectedDays.length,
    totalViewerMinutes: Math.round(totalViewerMinutes),
    peakViewers: Math.round(peakViewers),
    averageViewers: observedMinutes > 0 ? Math.round(totalViewerMinutes / observedMinutes) : 0,
    observedMinutes: Math.round(observedMinutes),
    coverageState: allGood ? 'good' : allDemo ? 'demo' : selectedDays.length ? 'partial' : 'missing',
  }
}

function comparisonChange(current: number, previous: number) {
  return {
    absolute: Math.round(current - previous),
    pct: previous > 0 ? (current - previous) / previous : null,
  }
}

export function coverageFor(provider: 'twitch' | 'kick', period: Period, daily: DailySummary[]) {
  const totalDays = dayCount(period.from, period.to)
  const today = dayString(new Date())
  const requestedDays = enumerateDays(period.from, period.to)
  const dailyMap = new Map(daily.map((day) => [day.day, day]))
  const missing = requestedDays.filter((day) => dailyMap.get(day)?.coverageState === 'missing' || !dailyMap.has(day))
  const inProgress = daily.filter((day) => day.day === today && day.coverageState !== 'missing').map((day) => day.day)
  const partial = daily
    .filter((day) => day.day !== today && day.coverageState !== 'good' && day.coverageState !== 'demo' && day.coverageState !== 'missing')
    .map((day) => day.day)
  const demo = daily.filter((day) => day.coverageState === 'demo').map((day) => day.day)
  const observedDays = daily.filter((day) => day.coverageState !== 'missing').length
  const observedMinutes = daily.reduce((sum, day) => sum + day.observedMinutes, 0)
  const expectedMinutes = requestedDays.reduce((sum, day) => sum + expectedMinutesForDay(day), 0)
  const affectedDays = [...new Set([...inProgress, ...partial, ...missing, ...demo])]
  const state = observedDays === 0
    ? 'missing'
    : demo.length === observedDays
      ? 'demo'
      : inProgress.length || missing.length || partial.length || demo.length
        ? 'partial'
        : 'good'
  const platform = provider === 'twitch' ? 'Twitch' : 'Kick'
  const notes = [
    `${observedDays} of ${totalDays} requested days have observed ${platform} history data.`,
    `${inProgress.length} in-progress day, ${partial.length} partial day${partial.length === 1 ? '' : 's'}, and ${missing.length} missing day${missing.length === 1 ? '' : 's'} were detected.`,
  ]
  return {
    state,
    observedDays,
    missingDays: missing.length,
    partialDays: partial.length + demo.length,
    inProgressDays: inProgress.length,
    observedMinutes,
    expectedMinutes,
    affectedDays,
    inProgressDates: inProgress,
    partialDates: partial,
    missingDates: missing,
    demoDates: demo,
    notes,
  }
}

export function fillMissingDays(period: Period, daily: DailySummary[]): DailySummary[] {
  const byDay = new Map(daily.map((day) => [day.day, day]))
  return enumerateDays(period.from, period.to).map((day) => byDay.get(day) ?? {
    day,
    totalViewerMinutes: 0,
    peakViewers: 0,
    peakStreamerName: null,
    observedStreamCount: 0,
    observedMinutes: 0,
    coverageState: 'missing',
    topStreamers: [],
    biggestRise: null,
  })
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
  const missingDates = enumerateDays(period.from, period.to)
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
    periodComparison: null,
    comparison: { previousPeriodAvailable: false, period: null },
    coverage: {
      state: 'missing',
      observedDays: 0,
      missingDays: missingDates.length,
      partialDays: 0,
      inProgressDays: 0,
      observedMinutes: 0,
      expectedMinutes: 0,
      affectedDays: missingDates,
      inProgressDates: [],
      partialDates: [],
      missingDates,
      demoDates: [],
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
