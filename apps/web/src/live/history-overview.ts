type Change = { absolute?: number; pct?: number | null }
type Streamer = {
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  changePct?: number | null
  changeAbs?: number | null
  comparisonState?: string
}
type Payload = {
  summary?: {
    topStreamer?: Streamer | null
    biggestRise?: Streamer | null
  } | null
  topStreamers?: Streamer[]
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
  if (currentPayload) renderInsights(insights, currentPayload)
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

function renderInsights(root: HTMLElement, payload: Payload): void {
  const body = root.querySelector<HTMLElement>('[data-history-overview-insights-body]')
  const status = root.querySelector<HTMLElement>('[data-history-overview-insights-status]')
  if (!body || !status) return
  const comparison = payload.periodComparison ?? payload.comparison?.period ?? null
  const comparable = comparison?.state === 'comparable' && comparison.changes
  status.textContent = comparable ? 'Comparable' : comparison?.state === 'partial' ? 'Partial' : 'Available fields'

  const strongest = strongestComparable(payload.topStreamers ?? [])
  const rise = payload.summary?.biggestRise ?? strongest
  body.innerHTML = [
    changeInsight('Audience vs previous', comparable ? comparison?.changes?.totalViewerMinutes : null, comparison?.reason),
    changeInsight('Peak vs previous', comparable ? comparison?.changes?.peakViewers : null, comparison?.reason),
    streamerInsight(rise),
  ].join('')
  root.dataset.historyOverviewInsightsReady = 'true'
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
  if (!streamer?.displayName) return insight('Biggest supported rise', 'Unavailable', 'Previous-period streamer baseline is unavailable.', 'is-neutral')
  const comparable = streamer.comparisonState === 'comparable' && typeof streamer.changePct === 'number' && Number.isFinite(streamer.changePct) && Math.abs(streamer.changePct) <= 3
  const detail = comparable
    ? `${streamer.changePct! > 0 ? '+' : ''}${Math.round(streamer.changePct! * 100)}% vs previous period`
    : streamer.comparisonState === 'new' ? 'New in the comparable ranking' : 'Low or unavailable comparison baseline'
  return insight('Biggest supported rise', streamer.displayName, detail, 'is-neutral')
}

function strongestComparable(streamers: Streamer[]): Streamer | null {
  return streamers
    .filter((streamer) => streamer.comparisonState === 'comparable' && typeof streamer.changePct === 'number' && Number.isFinite(streamer.changePct) && Math.abs(streamer.changePct) <= 3)
    .sort((a, b) => (b.changePct ?? -Infinity) - (a.changePct ?? -Infinity))[0] ?? null
}

function insight(label: string, value: string, detail: string, className: string): string {
  return `<article class="history-overview-insight"><small>${escapeHtml(label)}</small><strong class="${className}">${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></article>`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export {}
