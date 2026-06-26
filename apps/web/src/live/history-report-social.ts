import {
  historyReportCoverage,
  metricLabel,
  metricTopStreamer,
  metricUnit,
  reportMetric,
  streamerMetricValue,
  topMetricDay,
  type HistoryReportPayload,
  type HistoryReportProvider,
} from './history-report-text-state'

const MAX_POST_LENGTH = 280

export function historyShortPostText(
  payload: HistoryReportPayload,
  provider: HistoryReportProvider,
  currentUrl: string,
): string {
  const coverage = historyReportCoverage(payload)
  const summary = payload.summary
  const metric = reportMetric(payload)
  const topStreamer = metricTopStreamer(payload, metric)
  const metricDay = topMetricDay(payload, metric)
  const biggestRise = summary?.biggestRise ?? null
  const optional: string[] = []

  if (topStreamer?.displayName) {
    const amount = streamerMetricValue(topStreamer, metric)
    optional.push(`Top by ${metricLabel(metric)}: ${shortName(topStreamer.displayName)}${finite(amount) ? ` · ${compact(amount)} ${metricUnit(metric)}` : ''}`)
  }
  if (metric === 'peak_viewers' && finite(summary?.peakViewers)) {
    const day = validDay(metricDay?.day) ? ` · ${shortDay(metricDay.day)}` : ''
    optional.push(`Highest peak: ${compact(summary.peakViewers)} viewers${day}`)
  }
  if (metric === 'viewer_minutes' && biggestRise?.displayName) {
    const change = finite(biggestRise.changePct)
      ? ` ${signed(biggestRise.changePct)}%`
      : finite(biggestRise.changeAbs)
        ? ` ${signed(biggestRise.changeAbs)}`
        : ''
    optional.push(`Rise: ${shortName(biggestRise.displayName)}${change}`)
  }

  const state = normalize(payload.state)
  const source = normalize(payload.source)
  const start = [
    `ViewLoom | ${provider === 'kick' ? 'Kick' : 'Twitch'} History snapshot`,
    `${periodLabel(payload)} UTC · ${metricLabel(metric)}`,
  ]
  const end = [
    `Coverage: ${coverage.observedDays}/${coverage.totalDays} days observed${coverage.attentionDays ? ` · ${coverage.attentionDays} partial` : ''}`,
    `${source === 'demo' || state === 'demo' ? 'Demo' : 'Observed'} ViewLoom data; not provider-wide.`,
    shareUrl(currentUrl, provider),
  ]

  while (optional.length && length([...start, ...optional, ...end].join('\n')) > MAX_POST_LENGTH) {
    optional.pop()
  }

  const text = [...start, ...optional, ...end].join('\n')
  if (length(text) > MAX_POST_LENGTH) throw new Error('Required short-post fields exceed the length contract.')
  return text
}

export function historyShortPostLength(text: string): number {
  return length(text)
}

function periodLabel(payload: HistoryReportPayload): string {
  const from = validDay(payload.period?.from) ? payload.period.from : null
  const to = validDay(payload.period?.to) ? payload.period.to : null
  if (from && to) return `${from}–${to}`
  return shortName(payload.period?.label ?? 'Current period', 36)
}

function shareUrl(value: string, provider: HistoryReportProvider): string {
  try {
    const url = new URL(value)
    const retained = new URLSearchParams()
    for (const key of ['period', 'from', 'to', 'metric']) {
      const item = url.searchParams.get(key)
      if (item) retained.set(key, item)
    }
    url.pathname = `/${provider}/history/`
    url.search = retained.toString()
    url.hash = ''
    return url.toString()
  } catch {
    return `/${provider}/history/`
  }
}

function shortDay(day: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${day}T00:00:00.000Z`))
}

function compact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function signed(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded > 0 ? `+${rounded}` : String(rounded)
}

function shortName(value: string, limit = 28): string {
  const clean = value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
  const points = [...clean]
  return points.length <= limit ? clean : `${points.slice(0, Math.max(1, limit - 1)).join('')}…`
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function length(value: string): number {
  return [...value].length
}
