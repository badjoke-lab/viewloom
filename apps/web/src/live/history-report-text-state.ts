export type HistoryReportProvider = 'twitch' | 'kick'
export type HistoryReportMetric = 'viewer_minutes' | 'peak_viewers'

export type HistoryReportStreamer = {
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
}

export type HistoryReportRise = {
  displayName?: string
  changePct?: number | null
  changeAbs?: number | null
}

export type HistoryReportDay = {
  day?: string
  coverageState?: string
}

export type HistoryReportPayload = {
  source?: string
  state?: string
  metric?: string
  period?: { from?: string; to?: string; label?: string; days?: number }
  summary?: {
    totalViewerMinutes?: number
    peakViewers?: number
    peakDay?: string
    coverageState?: string
    topStreamer?: HistoryReportStreamer | null
    biggestRise?: HistoryReportRise | null
  } | null
  daily?: HistoryReportDay[]
  topStreamers?: HistoryReportStreamer[]
  coverage?: {
    state?: string
    observedDays?: number
    missingDays?: number
    partialDays?: number
  }
  error?: { message?: string }
}

export type HistoryReportCoverage = {
  totalDays: number
  observedDays: number
  missingDays: number
  attentionDays: number
}

let currentPayload: HistoryReportPayload | null = null

export function installHistoryReportPayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as HistoryReportPayload
      } catch {
        currentPayload = null
      }
      onChange()
    }
    return response
  }) as typeof window.fetch
}

export function historyReportPayload(): HistoryReportPayload | null {
  return currentPayload
}

export function historyReportCoverage(payload: HistoryReportPayload): HistoryReportCoverage {
  const daily = new Map<string, HistoryReportDay>()
  for (const row of payload.daily ?? []) {
    if (validDay(row.day)) daily.set(row.day, row)
  }

  const suppliedDays = [...daily.keys()].sort()
  const from = validDay(payload.period?.from) ? payload.period!.from! : suppliedDays[0]
  const to = validDay(payload.period?.to) ? payload.period!.to! : suppliedDays.at(-1)
  const days = from && to && from <= to ? utcDays(from, to, 186) : suppliedDays

  let observedDays = 0
  let missingDays = 0
  let attentionDays = 0
  for (const day of days) {
    const row = daily.get(day)
    const coverage = normalize(row?.coverageState)
    if (!row || coverage === 'missing') {
      missingDays += 1
      continue
    }
    observedDays += 1
    if (!['good', 'complete', 'fresh'].includes(coverage)) attentionDays += 1
  }

  return {
    totalDays: days.length,
    observedDays,
    missingDays,
    attentionDays,
  }
}

export function historyReportText(
  payload: HistoryReportPayload,
  provider: HistoryReportProvider,
  currentUrl: string,
): string {
  const coverage = historyReportCoverage(payload)
  const metric = payload.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const summary = payload.summary
  const topStreamer = summary?.topStreamer ?? payload.topStreamers?.[0] ?? null
  const biggestRise = summary?.biggestRise ?? null
  const lines = [
    `ViewLoom — ${providerLabel(provider)} History & Trends`,
    `${periodLabel(payload)} (UTC)`,
    `Metric: ${metricLabel(metric)}`,
    `Observed days: ${coverage.observedDays} of ${coverage.totalDays}${coverage.missingDays ? ` · ${coverage.missingDays} missing` : ''}${coverage.attentionDays ? ` · ${coverage.attentionDays} need attention` : ''}`,
  ]

  if (finite(summary?.totalViewerMinutes)) {
    lines.push(`Total observed: ${formatNumber(summary!.totalViewerMinutes!)} viewer-minutes`)
  }
  if (finite(summary?.peakViewers)) {
    const peakDay = validDay(summary?.peakDay) ? ` on ${formatDay(summary!.peakDay!)}` : ''
    lines.push(`Peak: ${formatNumber(summary!.peakViewers!)} viewers${peakDay}`)
  }
  if (topStreamer?.displayName) {
    const amount = finite(topStreamer.viewerMinutes)
      ? ` — ${formatNumber(topStreamer.viewerMinutes!)} viewer-minutes`
      : ''
    lines.push(`Top streamer: ${clean(topStreamer.displayName)}${amount}`)
  }
  if (biggestRise?.displayName) {
    const change = finite(biggestRise.changePct)
      ? ` (${signed(biggestRise.changePct!)}%)`
      : finite(biggestRise.changeAbs)
        ? ` (${signed(biggestRise.changeAbs!)})`
        : ''
    lines.push(`Biggest rise: ${clean(biggestRise.displayName)}${change}`)
  } else {
    lines.push('Biggest rise: unavailable for this period')
  }

  const state = normalize(payload.state)
  const source = normalize(payload.source)
  const coverageState = normalize(payload.coverage?.state ?? summary?.coverageState)
  lines.push(`Data state: ${humanLabel(state || coverageState || 'unknown')} · Source: ${source === 'demo' || state === 'demo' ? 'Demo' : 'Real observed data'}`)
  lines.push('Coverage note: observed ViewLoom data; not a provider-wide total.')
  lines.push(cleanUrl(currentUrl, provider))
  return lines.join('\n')
}

function periodLabel(payload: HistoryReportPayload): string {
  const from = validDay(payload.period?.from) ? payload.period!.from! : null
  const to = validDay(payload.period?.to) ? payload.period!.to! : null
  if (from && to) return `${formatDay(from)} – ${formatDay(to)}`
  return clean(payload.period?.label ?? 'Current retained period')
}

function cleanUrl(value: string, provider: HistoryReportProvider): string {
  try {
    const url = new URL(value)
    url.hash = ''
    if (!url.pathname.startsWith(`/${provider}/history/`)) url.pathname = `/${provider}/history/`
    return url.toString()
  } catch {
    return `/${provider}/history/`
  }
}

function providerLabel(provider: HistoryReportProvider): string {
  return provider === 'kick' ? 'Kick' : 'Twitch'
}

function metricLabel(metric: HistoryReportMetric): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}

function formatDay(day: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00.000Z`))
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US')
}

function signed(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded > 0 ? `+${rounded}` : String(rounded)
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function clean(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
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
