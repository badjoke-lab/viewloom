import '../history-period-highlights.css'
import {
  dayMetricValue,
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

type PeriodHighlight = {
  kind: 'high' | 'leader' | 'rise' | 'coverage'
  eyebrow: string
  title: string
  detail: string
  day?: string
}

export function renderHistoryPeriodHighlights(payload: HistoryReportPayload): void {
  const provider: HistoryReportProvider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const metric = reportMetric(payload)
  const coverage = historyReportCoverage(payload)
  const highlights: PeriodHighlight[] = []
  const highDay = topMetricDay(payload, metric)
  const highValue = dayMetricValue(highDay, metric)

  if (validDay(highDay?.day) && highValue > 0) {
    highlights.push({
      kind: 'high',
      eyebrow: metric === 'peak_viewers' ? 'Highest peak day' : 'Largest observed day',
      title: formatDay(highDay.day),
      detail: `${formatNumber(highValue)} ${metricUnit(metric)}`,
      day: highDay.day,
    })
  }

  const topStreamer = metricTopStreamer(payload, metric)
  if (clean(topStreamer?.displayName)) {
    const value = streamerMetricValue(topStreamer, metric)
    highlights.push({
      kind: 'leader',
      eyebrow: 'Period leader',
      title: clean(topStreamer!.displayName!),
      detail: finite(value)
        ? `${formatNumber(value)} ${metricUnit(metric)} · ${metricLabel(metric)}`
        : metricLabel(metric),
    })
  }

  const rise = payload.summary?.biggestRise
  if (metric === 'viewer_minutes' && clean(rise?.displayName)) {
    highlights.push({
      kind: 'rise',
      eyebrow: 'Biggest rise',
      title: clean(rise!.displayName!),
      detail: riseDetail(rise?.changePct, rise?.changeAbs),
    })
  }

  if (coverage.totalDays > 0) {
    const attention = coverage.attentionDays
    const missing = coverage.missingDays
    highlights.push({
      kind: 'coverage',
      eyebrow: missing || attention ? 'Coverage needs attention' : 'Coverage complete',
      title: `${coverage.observedDays} of ${coverage.totalDays} UTC days observed`,
      detail: missing || attention
        ? `${missing} missing · ${attention} partial or stale`
        : 'No missing or attention-needed day in the selected period.',
    })
  }

  const mount = ensureMount()
  const list = mount.querySelector<HTMLElement>('[data-history-period-highlights-list]')
  const summary = mount.querySelector<HTMLElement>('[data-history-period-highlights-summary]')
  const periodLink = mount.querySelector<HTMLAnchorElement>('[data-history-period-highlights-period-link]')
  if (!list || !summary || !periodLink) return

  mount.dataset.provider = provider
  mount.dataset.metric = metric
  mount.dataset.highlightCount = String(highlights.length)
  summary.textContent = highlights.length
    ? `${highlights.length} retained-period signal${highlights.length === 1 ? '' : 's'}`
    : 'No supported retained-period signals'
  periodLink.href = currentPeriodUrl(provider)

  if (!highlights.length) {
    list.innerHTML = '<div class="notice">No supported History highlights are available for this period. Missing values are not inferred.</div>'
    return
  }

  list.innerHTML = highlights.map((highlight) => highlightCard(highlight, provider)).join('')
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-period-highlights]')
  if (existing) {
    placeBlock(existing.closest<HTMLElement>('.history-period-highlights-block'))
    return existing
  }

  const block = document.createElement('div')
  block.className = 'history-period-highlights-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Period highlights</h2><span>Current provider response</span></div>
    <section class="surface history-period-highlights" data-history-period-highlights>
      <div class="surface__head"><strong>What stands out in this period</strong><small data-history-period-highlights-summary>Loading highlights…</small></div>
      <div class="history-period-highlights__grid" data-history-period-highlights-list><div class="notice">Loading highlights…</div></div>
      <div class="history-period-highlights__foot">
        <span>Derived only from retained observed History data.</span>
        <a data-history-period-highlights-period-link href="./">Link to this period</a>
      </div>
    </section>`
  placeBlock(block)
  return block.querySelector<HTMLElement>('[data-history-period-highlights]')!
}

function placeBlock(block: HTMLElement | null): void {
  if (!block) return
  const peakBlock = document.querySelector<HTMLElement>('.history-peak-events-block')
  if (peakBlock && peakBlock.previousElementSibling !== block) {
    peakBlock.insertAdjacentElement('beforebegin', block)
    return
  }
  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (columns && columns.nextElementSibling !== block) columns.insertAdjacentElement('afterend', block)
  else if (!block.isConnected) document.querySelector<HTMLElement>('.history-page')?.append(block)
}

function highlightCard(highlight: PeriodHighlight, provider: HistoryReportProvider): string {
  const day = validDay(highlight.day) ? highlight.day : ''
  const suffix = day ? `?date=${encodeURIComponent(day)}` : ''
  const links = day
    ? `<div class="history-period-highlight__links"><a href="/${provider}/day-flow/${suffix}">Day Flow</a><a href="/${provider}/battle-lines/${suffix}">Battle Lines</a></div>`
    : ''
  return `
    <article class="history-period-highlight history-period-highlight--${highlight.kind}" data-history-period-highlight="${highlight.kind}"${day ? ` data-history-period-highlight-day="${escapeHtml(day)}"` : ''}>
      <span class="history-period-highlight__eyebrow">${escapeHtml(highlight.eyebrow)}</span>
      <strong>${escapeHtml(highlight.title)}</strong>
      <p>${escapeHtml(highlight.detail)}</p>
      ${links}
    </article>`
}

function currentPeriodUrl(provider: HistoryReportProvider): string {
  const url = new URL(location.href)
  url.pathname = `/${provider}/history/`
  url.hash = ''
  for (const key of [...url.searchParams.keys()]) {
    if (!['period', 'from', 'to', 'metric'].includes(key)) url.searchParams.delete(key)
  }
  return url.toString()
}

function riseDetail(changePct: unknown, changeAbs: unknown): string {
  if (finite(changePct)) return `${signed(changePct)}% versus the comparison period`
  if (finite(changeAbs)) return `${signed(changeAbs)} viewer-minutes versus the comparison period`
  return 'Rise detected; exact change unavailable.'
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

function clean(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
