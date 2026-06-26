type HistoryMetric = 'viewer_minutes' | 'peak_viewers'
type Change = { absolute?: number; pct?: number | null }
type Streamer = {
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  changePct?: number | null
  changeAbs?: number | null
  comparisonState?: string
}
type Day = {
  day?: string
  totalViewerMinutes?: number
  peakViewers?: number
  peakStreamerName?: string | null
  observedStreamCount?: number
  observedMinutes?: number
  coverageState?: string
  topStreamers?: Streamer[]
}
type Payload = {
  metric?: string
  summary?: {
    totalViewerMinutes?: number
    peakViewers?: number
    peakDay?: string
    peakDayViewerMinutes?: number
    topStreamer?: Streamer | null
    biggestRise?: Streamer | null
    coverageState?: string
  } | null
  daily?: Day[]
  topStreamers?: Streamer[]
  coverage?: {
    state?: string
    observedDays?: number
    partialDays?: number
    missingDays?: number
  }
  periodComparison?: {
    state?: string
    reason?: string
    changes?: {
      totalViewerMinutes?: Change
      peakViewers?: Change
    } | null
  } | null
  comparison?: {
    period?: {
      state?: string
      reason?: string
      changes?: {
        totalViewerMinutes?: Change
        peakViewers?: Change
      } | null
    } | null
  }
}

let currentPayload: Payload | null = null
let scheduled = false

installPayloadCapture()
const observer = new MutationObserver(schedule)
observer.observe(document.documentElement, { childList: true, subtree: true })
schedule()

function installPayloadCapture(): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as Payload
      } catch {
        currentPayload = null
      }
      schedule()
    }
    return response
  }) as typeof window.fetch
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    enhanceOverview()
  })
}

function enhanceOverview(): void {
  const panel = document.querySelector<HTMLElement>('[data-history-view-panel="overview"]')
  if (!panel) return
  markSectionTitles(panel)
  const insights = ensureInsights(panel)
  if (currentPayload) {
    const metric = metricFrom(currentPayload)
    renderMetricSummary(currentPayload, metric)
    renderMetricSelectedDay(currentPayload, metric)
    renderMetricRanking(panel, currentPayload, metric)
    renderMetricDailyArchive(currentPayload, metric)
    renderMetricStrip(currentPayload, metric)
    renderInsights(insights, currentPayload, metric)
  }
  const ready = Boolean(
    panel.querySelector('[data-history-summary]')
    && panel.querySelector('[data-history-coverage-summary]')
    && panel.querySelector('[data-history-columns]')
    && panel.querySelector('[data-history-period-comparison]')
    && panel.querySelector('[data-history-calendar]')
    && panel.querySelector('.history-ranking-toolbar')
    && panel.querySelector('.history-coverage-detail'),
  )
  panel.dataset.historyOverviewReady = String(ready)
}

function markSectionTitles(panel: HTMLElement): void {
  const ranking = panel.querySelector<HTMLElement>('.history-ranking-toolbar')
  const rankingTitle = ranking?.previousElementSibling
  if (rankingTitle instanceof HTMLElement && rankingTitle.classList.contains('rule-title')) {
    rankingTitle.classList.add('history-overview-ranking-title')
  }
  const coverage = panel.querySelector<HTMLElement>('.history-coverage-detail')
  const coverageTitle = coverage?.previousElementSibling
  if (coverageTitle instanceof HTMLElement && coverageTitle.classList.contains('rule-title')) {
    coverageTitle.classList.add('history-overview-coverage-title')
  }
}

function ensureInsights(panel: HTMLElement): HTMLElement {
  const existing = panel.querySelector<HTMLElement>('[data-history-overview-insights]')
  if (existing) return existing
  const aside = document.createElement('aside')
  aside.className = 'surface history-overview-insights'
  aside.dataset.historyOverviewInsights = ''
  aside.setAttribute('aria-live', 'polite')
  aside.innerHTML = `
    <div class="surface__head"><strong>Key changes</strong><small data-history-overview-insights-status>Loading</small></div>
    <div class="history-overview-insights__body" data-history-overview-insights-body>
      <div class="notice">Loading supported period changes…</div>
    </div>
    <p class="history-overview-insights__note">Only changes supported by the loaded provider response are shown.</p>`
  const coverageTitle = panel.querySelector('.history-overview-coverage-title')
  if (coverageTitle) coverageTitle.insertAdjacentElement('beforebegin', aside)
  else panel.append(aside)
  return aside
}

function renderMetricSummary(payload: Payload, metric: HistoryMetric): void {
  const root = document.querySelector<HTMLElement>('[data-history-summary]')
  if (!root) return
  const daily = payload.daily ?? []
  const summary = payload.summary
  const metricDay = maxDay(daily, metric)
  const top = topStreamer(payload.topStreamers ?? [], metric) ?? summary?.topStreamer ?? null
  const comparison = payload.periodComparison ?? payload.comparison?.period ?? null
  const change = metric === 'peak_viewers'
    ? comparison?.changes?.peakViewers
    : comparison?.changes?.totalViewerMinutes
  const primaryValue = metric === 'peak_viewers'
    ? finite(summary?.peakViewers) ? summary!.peakViewers! : metricValue(metricDay, metric)
    : finite(summary?.totalViewerMinutes) ? summary!.totalViewerMinutes! : daily.reduce((sum, day) => sum + metricValue(day, metric), 0)
  const dayValue = metricValue(metricDay, metric)
  const html = `
    <div class="lead-stat" data-history-summary-primary="${metric}">
      <small>${metric === 'peak_viewers' ? 'Highest peak' : 'Total observed'}</small>
      <strong title="${formatNumber(primaryValue)}">${formatCompact(primaryValue)}</strong>
      <span>${metricUnit(metric)}</span>
    </div>
    <div>
      <small>${metric === 'peak_viewers' ? 'Highest-peak day' : 'Peak day'}</small>
      <strong>${formatDate(metricDay?.day)}</strong>
      <span>${formatNumber(dayValue)} ${metricUnit(metric)}</span>
    </div>
    <div>
      <small>Top streamer by ${metricLabel(metric)}</small>
      <strong>${escapeHtml(top?.displayName ?? '—')}</strong>
      <span>${formatNumber(streamerMetricValue(top, metric))} ${metricUnit(metric)}</span>
    </div>
    <div>
      <small>${metricLabel(metric)} change</small>
      <strong class="${changeClass(change?.pct)}">${formatChangeValue(change, comparison?.reason)}</strong>
      <span>${formatChangeDetail(change, comparison?.reason)}</span>
    </div>
    <div>
      <small>Coverage quality</small>
      <strong>${humanLabel(payload.coverage?.state ?? summary?.coverageState ?? 'unknown')}</strong>
      <span>${coverageSummary(payload)}</span>
    </div>`
  setHtmlIfChanged(root, html)
  root.dataset.historyMetric = metric
}

function renderMetricSelectedDay(payload: Payload, metric: HistoryMetric): void {
  const root = document.querySelector<HTMLElement>('[data-history-selected-day]')
  if (!root) return
  const daily = payload.daily ?? []
  const requested = new URLSearchParams(location.search).get('day')
  const day = daily.find((item) => item.day === requested) ?? daily.at(-1)
  if (!day?.day) return
  const otherMetric: HistoryMetric = metric === 'peak_viewers' ? 'viewer_minutes' : 'peak_viewers'
  const top = [...(day.topStreamers ?? [])]
    .sort((a, b) => streamerMetricValue(b, metric) - streamerMetricValue(a, metric))
    .slice(0, 5)
  const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
  const html = `
    <div class="surface__head"><strong>Selected day</strong><small>${escapeHtml(formatDate(day.day))}</small></div>
    <div class="surface__body history-selected-body" data-history-selected-metric="${metric}">
      <div class="history-selected-metrics">
        <div data-history-selected-primary="${metric}"><small>${metricLabel(metric)}</small><strong>${formatNumber(metricValue(day, metric))}</strong></div>
        <div><small>${metricLabel(otherMetric)}</small><strong>${formatNumber(metricValue(day, otherMetric))}</strong></div>
        <div><small>Peak streamer</small><strong>${escapeHtml(day.peakStreamerName ?? '—')}</strong></div>
        <div><small>Observed streams</small><strong>${formatNumber(day.observedStreamCount)}</strong></div>
        <div><small>Observed time</small><strong>${formatDuration(day.observedMinutes)}</strong></div>
        <div><small>Coverage</small><strong>${humanLabel(day.coverageState ?? 'unknown')}</strong></div>
      </div>
      <div class="history-selected-top">
        <small>Top streamers by ${metricLabel(metric)}</small>
        ${top.length ? `<ol>${top.map((streamer, index) => `<li><span>#${index + 1} ${escapeHtml(streamer.displayName ?? '—')}</span><strong>${formatNumber(streamerMetricValue(streamer, metric))} ${metricUnit(metric)}</strong></li>`).join('')}</ol>` : '<p>Daily streamer breakdown unavailable.</p>'}
      </div>
      <div class="history-selected-actions">
        <a class="button" href="/${provider}/day-flow/?date=${encodeURIComponent(day.day)}">Open Day Flow</a>
        <a class="button button--paper" href="/${provider}/battle-lines/?date=${encodeURIComponent(day.day)}">Open Battle Lines</a>
      </div>
    </div>`
  setHtmlIfChanged(root, html)
  root.dataset.historyMetric = metric
}

function renderMetricRanking(panel: HTMLElement, payload: Payload, metric: HistoryMetric): void {
  const toolbar = panel.querySelector<HTMLElement>('.history-ranking-toolbar')
  if (!toolbar) return
  let context = toolbar.querySelector<HTMLElement>('[data-history-ranking-context]')
  if (!context) {
    context = document.createElement('span')
    context.dataset.historyRankingContext = ''
    context.className = 'history-ranking-context'
    toolbar.append(context)
  }
  const value = `Ranked by ${metricLabel(metric)}`
  if (context.textContent !== value) context.textContent = value
  toolbar.dataset.historyMetric = metric

  const title = panel.querySelector<HTMLElement>('.history-overview-ranking-title span')
  const titleValue = `Completed-day ranking · ${metricLabel(metric)}`
  if (title && title.textContent !== titleValue) title.textContent = titleValue

  const table = panel.querySelector<HTMLTableElement>('.metric-ledger')
  if (table) {
    table.dataset.historyMetric = metric
    table.setAttribute('aria-label', `Top streamers ranked by ${metricLabel(metric)}`)
  }
  const cards = panel.querySelector<HTMLElement>('[data-history-streamer-cards]')
  if (cards) cards.dataset.historyMetric = metric

  const first = topStreamer(payload.topStreamers ?? [], metric)
  panel.dataset.historyRankingLeader = first?.displayName ?? ''
}

function renderMetricDailyArchive(payload: Payload, metric: HistoryMetric): void {
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  if (!root) return
  for (const card of root.querySelectorAll<HTMLElement>('[data-history-day-card]')) {
    const day = (payload.daily ?? []).find((item) => item.day === card.dataset.historyDayCard)
    if (!day) continue
    const value = card.querySelector<HTMLElement>(':scope > strong')
    const unit = card.querySelector<HTMLElement>(':scope > span')
    const formatted = formatNumber(metricValue(day, metric))
    if (value && value.textContent !== formatted) value.textContent = formatted
    if (unit && unit.textContent !== metricUnit(metric)) unit.textContent = metricUnit(metric)
    card.dataset.historyMetric = metric
    card.setAttribute('aria-label', `${formatDate(day.day)}, ${metricLabel(metric)} ${formatted}`)
  }
  root.dataset.historyMetric = metric
}

function renderMetricStrip(payload: Payload, metric: HistoryMetric): void {
  const cell = document.querySelectorAll<HTMLElement>('.data-strip__cell')[2]
  if (!cell) return
  const label = cell.querySelector<HTMLElement>('small')
  const daily = payload.daily ?? []
  const value = metric === 'peak_viewers'
    ? payload.summary?.peakViewers ?? Math.max(0, ...daily.map((day) => metricValue(day, metric)))
    : payload.summary?.totalViewerMinutes ?? daily.reduce((sum, day) => sum + metricValue(day, metric), 0)
  if (label && label.textContent !== metricLabel(metric)) label.textContent = metricLabel(metric)
  const expected = `${label?.outerHTML ?? `<small>${metricLabel(metric)}</small>`}${escapeHtml(formatNumber(value))}`
  if (cell.innerHTML !== expected) cell.innerHTML = expected
  cell.dataset.historyMetric = metric
}

function renderInsights(root: HTMLElement, payload: Payload, metric: HistoryMetric): void {
  const body = root.querySelector<HTMLElement>('[data-history-overview-insights-body]')
  const status = root.querySelector<HTMLElement>('[data-history-overview-insights-status]')
  if (!body || !status) return
  const comparison = payload.periodComparison ?? payload.comparison?.period ?? null
  const comparable = comparison?.state === 'comparable' && comparison.changes
  status.textContent = comparable ? 'Comparable' : comparison?.state === 'partial' ? 'Partial' : 'Available fields'

  const selectedChange = metric === 'peak_viewers'
    ? comparison?.changes?.peakViewers
    : comparison?.changes?.totalViewerMinutes
  const strongest = strongestComparable(payload.topStreamers ?? [])
  const rise = payload.summary?.biggestRise ?? strongest
  const html = [
    changeInsight(`${metricLabel(metric)} vs previous`, comparable ? selectedChange : null, comparison?.reason),
    streamerInsight(rise),
  ].join('')
  setHtmlIfChanged(body, html)
  root.dataset.historyOverviewInsightsReady = 'true'
  root.dataset.historyMetric = metric
}

function changeInsight(label: string, change: Change | null | undefined, reason?: string): string {
  if (!change || typeof change.pct !== 'number' || !Number.isFinite(change.pct)) {
    return insight(label, 'Withheld', reason ?? 'Comparable previous-period coverage is unavailable.', 'is-neutral')
  }
  const pct = Math.round(change.pct * 1000) / 10
  const absolute = typeof change.absolute === 'number' && Number.isFinite(change.absolute)
    ? `${change.absolute > 0 ? '+' : ''}${Math.round(change.absolute).toLocaleString('en-US')}`
    : 'Absolute change unavailable'
  return insight(label, `${pct > 0 ? '+' : ''}${pct}%`, absolute, pct > 0 ? 'is-positive' : pct < 0 ? 'is-negative' : 'is-neutral')
}

function streamerInsight(streamer: Streamer | null | undefined): string {
  if (!streamer?.displayName) return insight('Biggest supported viewer-minutes rise', 'Unavailable', 'Previous-period streamer baseline is unavailable.', 'is-neutral')
  const comparable = streamer.comparisonState === 'comparable' && typeof streamer.changePct === 'number' && Number.isFinite(streamer.changePct) && Math.abs(streamer.changePct) <= 3
  const detail = comparable
    ? `${streamer.changePct! > 0 ? '+' : ''}${Math.round(streamer.changePct! * 100)}% vs previous period`
    : streamer.comparisonState === 'new' ? 'New in the comparable ranking' : 'Low or unavailable comparison baseline'
  return insight('Biggest supported viewer-minutes rise', streamer.displayName, detail, 'is-neutral')
}

function strongestComparable(streamers: Streamer[]): Streamer | null {
  return streamers
    .filter((streamer) => streamer.comparisonState === 'comparable' && typeof streamer.changePct === 'number' && Number.isFinite(streamer.changePct) && Math.abs(streamer.changePct) <= 3)
    .sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity))[0] ?? null
}

function metricFrom(payload: Payload): HistoryMetric {
  return payload.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
}

function metricLabel(metric: HistoryMetric): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}

function metricUnit(metric: HistoryMetric): string {
  return metric === 'peak_viewers' ? 'viewers' : 'viewer-minutes'
}

function metricValue(day: Day | null | undefined, metric: HistoryMetric): number {
  return metric === 'peak_viewers' ? number(day?.peakViewers) : number(day?.totalViewerMinutes)
}

function streamerMetricValue(streamer: Streamer | null | undefined, metric: HistoryMetric): number {
  return metric === 'peak_viewers' ? number(streamer?.peakViewers) : number(streamer?.viewerMinutes)
}

function maxDay(daily: Day[], metric: HistoryMetric): Day | null {
  return daily.reduce<Day | null>((best, day) => !best || metricValue(day, metric) > metricValue(best, metric) ? day : best, null)
}

function topStreamer(streamers: Streamer[], metric: HistoryMetric): Streamer | null {
  return streamers.reduce<Streamer | null>((best, streamer) => !best || streamerMetricValue(streamer, metric) > streamerMetricValue(best, metric) ? streamer : best, null)
}

function formatChangeValue(change: Change | null | undefined, reason?: string): string {
  if (!change || typeof change.pct !== 'number' || !Number.isFinite(change.pct)) return 'Withheld'
  const pct = Math.round(change.pct * 1000) / 10
  return `${pct > 0 ? '+' : ''}${pct}%`
}

function formatChangeDetail(change: Change | null | undefined, reason?: string): string {
  if (!change || typeof change.absolute !== 'number' || !Number.isFinite(change.absolute)) {
    return reason ?? 'Comparable previous-period coverage is unavailable.'
  }
  return `${change.absolute > 0 ? '+' : ''}${Math.round(change.absolute).toLocaleString('en-US')} vs previous period`
}

function coverageSummary(payload: Payload): string {
  return `${formatNumber(payload.coverage?.observedDays)} observed · ${formatNumber(payload.coverage?.partialDays)} partial · ${formatNumber(payload.coverage?.missingDays)} missing`
}

function formatDuration(minutes: unknown): string {
  const value = number(minutes)
  if (!value) return '0m'
  const hours = Math.floor(value / 60)
  const rest = value % 60
  if (!hours) return `${rest}m`
  if (!rest) return `${hours}h`
  return `${hours}h ${rest}m`
}

function formatDate(value?: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function formatCompact(value: unknown): string {
  return finite(value)
    ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : '—'
}

function formatNumber(value: unknown): string {
  return finite(value) ? Math.round(value).toLocaleString('en-US') : '—'
}

function changeClass(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return 'is-neutral'
  return value > 0 ? 'is-positive' : 'is-negative'
}

function number(value: unknown): number {
  return finite(value) ? Math.max(0, Math.round(value)) : 0
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function setHtmlIfChanged(node: HTMLElement, html: string): void {
  const normalized = html.trim()
  if (node.innerHTML.trim() !== normalized) node.innerHTML = normalized
}

function insight(label: string, value: string, detail: string, className: string): string {
  return `<article class="history-overview-insight"><small>${escapeHtml(label)}</small><strong class="${className}">${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></article>`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export {}
