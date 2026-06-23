import {
  historyReportCoverage,
  type HistoryReportPayload,
  type HistoryReportProvider,
} from './history-report-text-state'
import { finiteNumberOrNull } from '../shared/output/values.js'

type ExportDayInput = {
  day?: string
  coverageState?: string
  totalViewerMinutes?: number
  peakViewers?: number
  peakStreamerName?: string
  observedStreamCount?: number
  observedMinutes?: number
}

type ExportStreamerInput = {
  streamerId?: string
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  observedMinutes?: number
}

export type HistoryExportDay = {
  provider: HistoryReportProvider
  day: string
  coverage_state: string
  viewer_minutes: number | null
  peak_viewers: number | null
  peak_streamer: string | null
  observed_stream_count: number | null
  observed_minutes: number | null
}

export type HistoryExportModel = {
  schema: 'viewloom-history-export-v1'
  project: 'ViewLoom'
  provider: HistoryReportProvider
  view_url: string
  period: { from: string; to: string; label: string; days: number }
  metric: 'viewer_minutes' | 'peak_viewers'
  source: string
  state: string
  coverage: {
    total_days: number
    observed_days: number
    missing_days: number
    attention_days: number
  }
  daily: HistoryExportDay[]
  top_streamers: Array<{
    streamer_id: string | null
    display_name: string | null
    viewer_minutes: number | null
    peak_viewers: number | null
    observed_minutes: number | null
  }>
  limitation: 'Observed ViewLoom data; not a provider-wide total.'
}

export function historyExportModel(
  payload: HistoryReportPayload,
  provider: HistoryReportProvider,
  currentUrl: string,
): HistoryExportModel {
  const inputs = (payload.daily ?? []) as ExportDayInput[]
  const supplied = new Map<string, ExportDayInput>()
  for (const row of inputs) if (validDay(row.day)) supplied.set(row.day, row)

  const suppliedDays = [...supplied.keys()].sort()
  const from = validDay(payload.period?.from) ? payload.period.from : suppliedDays[0] ?? 'unknown'
  const to = validDay(payload.period?.to) ? payload.period.to : suppliedDays.at(-1) ?? 'unknown'
  const days = from !== 'unknown' && to !== 'unknown' && from <= to
    ? utcDays(from, to, 186)
    : suppliedDays.slice(0, 186)

  const daily = days.map((day): HistoryExportDay => normalizeDay(provider, day, supplied.get(day)))
  const coverage = historyReportCoverage(payload)
  const topStreamers = (payload.topStreamers ?? []) as ExportStreamerInput[]

  return {
    schema: 'viewloom-history-export-v1',
    project: 'ViewLoom',
    provider,
    view_url: providerUrl(currentUrl, provider),
    period: {
      from,
      to,
      label: clean(payload.period?.label) || (from !== 'unknown' && to !== 'unknown' ? `${from} – ${to}` : 'Current retained period'),
      days: daily.length,
    },
    metric: payload.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes',
    source: normalize(payload.source) || 'unknown',
    state: normalize(payload.state) || normalize(payload.coverage?.state) || 'unknown',
    coverage: {
      total_days: coverage.totalDays,
      observed_days: coverage.observedDays,
      missing_days: coverage.missingDays,
      attention_days: coverage.attentionDays,
    },
    daily,
    top_streamers: topStreamers.slice(0, 100).map((streamer) => ({
      streamer_id: cleanOrNull(streamer.streamerId),
      display_name: cleanOrNull(streamer.displayName),
      viewer_minutes: finiteNumberOrNull(streamer.viewerMinutes),
      peak_viewers: finiteNumberOrNull(streamer.peakViewers),
      observed_minutes: finiteNumberOrNull(streamer.observedMinutes),
    })),
    limitation: 'Observed ViewLoom data; not a provider-wide total.',
  }
}

function normalizeDay(
  provider: HistoryReportProvider,
  day: string,
  source: ExportDayInput | undefined,
): HistoryExportDay {
  const coverage = normalize(source?.coverageState) || (source ? 'partial' : 'missing')
  const observed = Boolean(source) && coverage !== 'missing'
  return {
    provider,
    day,
    coverage_state: observed ? coverage : 'missing',
    viewer_minutes: observed ? finiteNumberOrNull(source?.totalViewerMinutes) : null,
    peak_viewers: observed ? finiteNumberOrNull(source?.peakViewers) : null,
    peak_streamer: observed ? cleanOrNull(source?.peakStreamerName) : null,
    observed_stream_count: observed ? finiteNumberOrNull(source?.observedStreamCount) : null,
    observed_minutes: observed ? finiteNumberOrNull(source?.observedMinutes) : null,
  }
}

function providerUrl(value: string, provider: HistoryReportProvider): string {
  try {
    const url = new URL(value)
    url.pathname = `/${provider}/history/`
    url.hash = ''
    return url.toString()
  } catch {
    return `/${provider}/history/`
  }
}

function utcDays(from: string, to: string, limit: number): string[] {
  const result: string[] = []
  const cursor = new Date(`${from}T00:00:00.000Z`)
  const end = new Date(`${to}T00:00:00.000Z`)
  while (cursor <= end && result.length < limit) {
    result.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

function cleanOrNull(value: unknown): string | null {
  return clean(value) || null
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
