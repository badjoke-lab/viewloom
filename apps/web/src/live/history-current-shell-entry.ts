type HistoryMetric = 'viewer_minutes' | 'peak_viewers'
type HistoryPeriodMode = '7d' | '30d' | 'custom'
type CoverageState = 'good' | 'partial' | 'poor' | 'missing' | 'demo' | string

type Streamer = {
  streamerId?: string
  displayName?: string
  viewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  observedMinutes?: number
  rankByViewerMinutes?: number
  rankByPeak?: number
  changePct?: number | null
  changeAbs?: number | null
  comparisonState?: 'comparable' | 'new' | 'insufficient' | string
}

type Rise = {
  streamerId?: string
  id?: string
  displayName?: string
  changePct?: number | null
  changeAbs?: number | null
}

type Day = {
  day?: string
  totalViewerMinutes?: number
  peakViewers?: number
  peakStreamerName?: string | null
  observedStreamCount?: number
  observedMinutes?: number
  coverageState?: CoverageState
  topStreamers?: Streamer[]
  biggestRise?: Rise | null
}

type HistoryPayload = {
  source?: string
  state?: string
  metric?: HistoryMetric | string
  platform?: string
  period?: { from?: string; to?: string; label?: string; days?: number }
  summary?: {
    totalViewerMinutes?: number
    peakViewers?: number
    peakDay?: string
    peakDayViewerMinutes?: number
    coverageState?: CoverageState
    topStreamer?: Streamer | null
    biggestRise?: Rise | null
  } | null
  daily?: Day[]
  topStreamers?: Streamer[]
  coverage?: {
    state?: CoverageState
    observedDays?: number
    missingDays?: number
    partialDays?: number
    observedMinutes?: number
    expectedMinutes?: number
    affectedDays?: string[]
    notes?: string[]
  }
  readPath?: string
  notes?: string[]
  error?: { message?: string }
}

type PageState = {
  periodMode: HistoryPeriodMode
  metric: HistoryMetric
  from?: string
  to?: string
  selectedDay?: string
  rankingSort: HistoryMetric
  rankingLimit: 10 | 20 | 50
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'
const providerBase = `/${provider}`
let pageState = readState()
let currentPayload: HistoryPayload | null = null
let currentController: AbortController | null = null

bindControls()
syncControlState()
void loadHistory()

function readState(): PageState {
  const params = new URLSearchParams(window.location.search)
  const from = validDay(params.get('from')) ? params.get('from') ?? undefined : undefined
  const to = validDay(params.get('to')) ? params.get('to') ?? undefined : undefined
  const periodMode: HistoryPeriodMode = from && to ? 'custom' : params.get('period') === '7d' ? '7d' : '30d'
  const metric: HistoryMetric = params.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const rankingSort: HistoryMetric = params.get('sort') === 'peak_viewers' ? 'peak_viewers' : metric
  const requestedLimit = Number(params.get('limit'))
  const rankingLimit: 10 | 20 | 50 = requestedLimit === 10 || requestedLimit === 50 ? requestedLimit : 20
  const selectedDay = validDay(params.get('day')) ? params.get('day') ?? undefined : undefined
  return { periodMode, metric, from, to, selectedDay, rankingSort, rankingLimit }
}

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-history-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.dataset.historyPeriod
      if (next !== '7d' && next !== '30d' && next !== 'custom') return
      pageState.periodMode = next
      if (next !== 'custom') {
        pageState.from = undefined
        pageState.to = undefined
        pageState.selectedDay = undefined
        updateUrl()
        syncControlState()
        void loadHistory()
        return
      }
      syncControlState()
      document.querySelector<HTMLInputElement>('[data-history-from]')?.focus()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-history-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      const metric = button.dataset.historyMetric
      if (metric !== 'viewer_minutes' && metric !== 'peak_viewers') return
      pageState.metric = metric
      pageState.rankingSort = metric
      pageState.selectedDay = undefined
      updateUrl()
      syncControlState()
      void loadHistory()
    })
  })

  document.querySelector<HTMLButtonElement>('[data-history-apply-range]')?.addEventListener('click', () => {
    const from = document.querySelector<HTMLInputElement>('[data-history-from]')?.value ?? ''
    const to = document.querySelector<HTMLInputElement>('[data-history-to]')?.value ?? ''
    const error = validateRange(from, to)
    if (error) {
      setFeedback(error, 'error')
      return
    }
    pageState.periodMode = 'custom'
    pageState.from = from
    pageState.to = to
    pageState.selectedDay = undefined
    updateUrl()
    syncControlState()
    void loadHistory()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-history-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      const sort = button.dataset.historySort
      if (sort !== 'viewer_minutes' && sort !== 'peak_viewers') return
      pageState.rankingSort = sort
      updateUrl()
      syncControlState()
      if (currentPayload) renderRanking(currentPayload.topStreamers ?? [])
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-history-limit]').forEach((button) => {
    button.addEventListener('click', () => {
      const limit = Number(button.dataset.historyLimit)
      if (limit !== 10 && limit !== 20 && limit !== 50) return
      pageState.rankingLimit = limit
      updateUrl()
      syncControlState()
      if (currentPayload) renderRanking(currentPayload.topStreamers ?? [])
    })
  })
}

function syncControlState(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-history-period]').forEach((button) => {
    const active = button.dataset.historyPeriod === pageState.periodMode
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  document.querySelectorAll<HTMLButtonElement>('[data-history-metric]').forEach((button) => {
    const active = button.dataset.historyMetric === pageState.metric
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  document.querySelectorAll<HTMLButtonElement>('[data-history-sort]').forEach((button) => {
    const active = button.dataset.historySort === pageState.rankingSort
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  document.querySelectorAll<HTMLButtonElement>('[data-history-limit]').forEach((button) => {
    const active = Number(button.dataset.historyLimit) === pageState.rankingLimit
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })

  document.querySelector<HTMLElement>('[data-history-custom-range]')?.classList.toggle('is-visible', pageState.periodMode === 'custom')
  if (pageState.from) setInputValue('[data-history-from]', pageState.from)
  if (pageState.to) setInputValue('[data-history-to]', pageState.to)
}

async function loadHistory(): Promise<void> {
  currentController?.abort()
  currentController = new AbortController()
  setLoading()

  try {
    const response = await fetch(buildRequestUrl(), {
      headers: { accept: 'application/json' },
      cache: 'no-store',
      signal: currentController.signal,
    })
    const payload = await response.json() as HistoryPayload
    if (!response.ok) throw new Error(payload.error?.message ?? `History API returned ${response.status}.`)
    currentPayload = payload
    const days = payload.daily ?? []
    if (!pageState.selectedDay || !days.some((day) => day.day === pageState.selectedDay)) {
      pageState.selectedDay = days.at(-1)?.day
      updateUrl()
    }
    render(payload)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function buildRequestUrl(): string {
  const params = new URLSearchParams()
  if (pageState.periodMode === 'custom' && pageState.from && pageState.to) {
    params.set('from', pageState.from)
    params.set('to', pageState.to)
  } else {
    params.set('period', pageState.periodMode === '7d' ? '7d' : '30d')
  }
  params.set('metric', pageState.metric)
  return `${endpoint}?${params.toString()}`
}

function updateUrl(): void {
  const params = new URLSearchParams()
  if (pageState.periodMode === 'custom' && pageState.from && pageState.to) {
    params.set('from', pageState.from)
    params.set('to', pageState.to)
  } else {
    params.set('period', pageState.periodMode)
  }
  params.set('metric', pageState.metric)
  params.set('sort', pageState.rankingSort)
  params.set('limit', String(pageState.rankingLimit))
  if (pageState.selectedDay) params.set('day', pageState.selectedDay)
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
}

function render(payload: HistoryPayload): void {
  const daily = payload.daily ?? []
  const top = payload.topStreamers ?? []
  const periodLabel = payload.period?.label ?? (pageState.periodMode === '7d' ? 'Last 7 days' : 'Last 30 days')
  const state = payload.state ?? 'unknown'
  const metric = payload.metric === 'peak_viewers' ? 'peak_viewers' : pageState.metric

  setFacts([
    periodLabel,
    metricLabel(metric),
    humanLabel(state),
    `${payload.coverage?.observedDays ?? daily.length} / ${payload.period?.days ?? daily.length} days`,
  ])
  setStrip([
    periodLabel,
    `${daily.length} days`,
    formatNumber(payload.summary?.peakViewers),
    humanLabel(payload.readPath ?? payload.source ?? 'api'),
  ])
  setStatePill(state)
  setText('[data-history-period-label]', periodLabel)
  setFeedback(payload.coverage?.notes?.[0] ?? '', state === 'error' ? 'error' : 'quiet')

  renderSummary(payload, daily, top)
  renderChart(payload, daily, metric)
  renderSelectedDay(daily)
  renderRanking(top)
  renderDailyArchive(daily)
  renderCoverage(payload)
}

function renderSummary(payload: HistoryPayload, daily: Day[], top: Streamer[]): void {
  const root = document.querySelector<HTMLElement>('[data-history-summary]')
  if (!root) return
  const summary = payload.summary
  const peakDay = summary?.peakDay ? daily.find((day) => day.day === summary.peakDay) : null
  const biggestRise = summary?.biggestRise
  root.innerHTML = `
    <div class="lead-stat">
      <small>Total observed</small>
      <strong>${formatNumber(summary?.totalViewerMinutes ?? sum(daily, 'totalViewerMinutes'))}</strong>
      <span>viewer-minutes</span>
    </div>
    <div>
      <small>Peak day</small>
      <strong>${formatDate(summary?.peakDay ?? '—')}</strong>
      <span>${formatNumber(summary?.peakDayViewerMinutes ?? peakDay?.totalViewerMinutes)} viewer-minutes</span>
    </div>
    <div>
      <small>Top streamer</small>
      <strong>${escapeHtml(summary?.topStreamer?.displayName ?? top[0]?.displayName ?? '—')}</strong>
      <span>${formatNumber(summary?.topStreamer?.viewerMinutes ?? top[0]?.viewerMinutes)} viewer-minutes</span>
    </div>
    <div>
      <small>Biggest rise</small>
      <strong>${escapeHtml(biggestRise?.displayName ?? 'Not enough previous data')}</strong>
      <span>${biggestRise ? formatChange(biggestRise.changePct, 'comparable', biggestRise.changeAbs) : 'Previous-period baseline unavailable'}</span>
    </div>
    <div>
      <small>Coverage quality</small>
      <strong>${humanLabel(payload.coverage?.state ?? summary?.coverageState ?? 'unknown')}</strong>
      <span>${coverageSummary(payload)}</span>
    </div>`
}

function renderChart(payload: HistoryPayload, daily: Day[], metric: HistoryMetric): void {
  const stage = document.querySelector<HTMLElement>('.history-stage')
  if (!stage) return
  if (daily.length === 0) {
    stage.innerHTML = `<div class="notice history-empty">${escapeHtml(payload.coverage?.notes?.[0] ?? 'No retained history rollup is available yet.')}</div>`
    return
  }

  const width = 1240
  const height = 520
  const left = 94
  const right = 28
  const top = 34
  const bottom = 64
  const chartW = width - left - right
  const chartH = height - top - bottom
  const values = daily.map((day) => metricValue(day, metric))
  const highest = niceMax(Math.max(1, ...values))
  const slot = chartW / Math.max(1, daily.length)
  const barW = Math.max(8, Math.min(34, slot * 0.64))
  const tickCount = 5
  const yGrid = Array.from({ length: tickCount + 1 }, (_, index) => {
    const ratio = index / tickCount
    const value = highest * (1 - ratio)
    const y = top + ratio * chartH
    return `<line x1="${left}" x2="${width - right}" y1="${y}" y2="${y}"/><text class="history-y-label" x="${left - 12}" y="${y + 4}" text-anchor="end">${escapeHtml(formatCompact(value))}</text>`
  }).join('')

  const labelEvery = daily.length <= 8 ? 1 : daily.length <= 35 ? 5 : 10
  const bars = daily.map((day, index) => {
    const value = values[index]
    const x = left + slot * index + (slot - barW) / 2
    const h = Math.max(2, value / highest * chartH)
    const y = top + chartH - h
    const selected = day.day === pageState.selectedDay
    const coverage = safeClass(day.coverageState ?? 'partial')
    const labelVisible = index === 0 || index === daily.length - 1 || index % labelEvery === 0
    return `<g class="history-day-column${selected ? ' is-selected' : ''}" data-history-day="${escapeHtml(day.day ?? '')}" role="button" tabindex="0" aria-label="${escapeHtml(chartAria(day, metric))}">
      <rect class="history-bar history-bar--${coverage}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="2"/>
      <rect class="history-bar-hit" x="${(left + slot * index).toFixed(1)}" y="${top}" width="${slot.toFixed(1)}" height="${chartH}"/>
      ${labelVisible ? `<text class="history-x-label" x="${(left + slot * index + slot / 2).toFixed(1)}" y="${height - 24}" text-anchor="middle">${escapeHtml(shortDate(day.day))}</text>` : ''}
    </g>`
  }).join('')

  stage.innerHTML = `
    <div class="history-chart-caption"><strong>${escapeHtml(metricLabel(metric))}</strong><span>Click or tap a day to inspect it.</span></div>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="History trend chart for ${escapeHtml(metricLabel(metric))}">
      <g class="chart-grid history-grid">${yGrid}</g>
      <text class="history-axis-title" x="${left}" y="18">${escapeHtml(metricLabel(metric))}</text>
      <g class="history-bars">${bars}</g>
    </svg>
    <div class="history-tooltip" data-history-tooltip hidden></div>`

  stage.querySelectorAll<SVGGElement>('[data-history-day]').forEach((node) => {
    const dayKey = node.dataset.historyDay
    const day = daily.find((item) => item.day === dayKey)
    if (!day) return
    node.addEventListener('click', () => selectDay(day.day))
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectDay(day.day)
      }
    })
    node.addEventListener('pointerenter', (event) => showTooltip(event, day, metric))
    node.addEventListener('pointermove', (event) => showTooltip(event, day, metric))
    node.addEventListener('pointerleave', hideTooltip)
  })
}

function renderSelectedDay(daily: Day[]): void {
  const root = document.querySelector<HTMLElement>('[data-history-selected-day]')
  if (!root) return
  const day = daily.find((item) => item.day === pageState.selectedDay) ?? daily.at(-1)
  if (!day?.day) {
    root.innerHTML = '<div class="notice">Select an observed day to inspect it.</div>'
    return
  }
  const top = day.topStreamers ?? []
  root.innerHTML = `
    <div class="surface__head"><strong>Selected day</strong><small>${escapeHtml(formatDate(day.day))}</small></div>
    <div class="surface__body history-selected-body">
      <div class="history-selected-metrics">
        <div><small>Viewer-minutes</small><strong>${formatNumber(day.totalViewerMinutes)}</strong></div>
        <div><small>Peak viewers</small><strong>${formatNumber(day.peakViewers)}</strong></div>
        <div><small>Peak streamer</small><strong>${escapeHtml(day.peakStreamerName ?? '—')}</strong></div>
        <div><small>Observed streams</small><strong>${formatNumber(day.observedStreamCount)}</strong></div>
        <div><small>Observed time</small><strong>${formatDuration(day.observedMinutes)}</strong></div>
        <div><small>Coverage</small><strong>${humanLabel(day.coverageState ?? 'unknown')}</strong></div>
      </div>
      <div class="history-selected-top">
        <small>Top streamers that day</small>
        ${top.length ? `<ol>${top.slice(0, 5).map((streamer) => `<li><span>${escapeHtml(streamer.displayName ?? '—')}</span><strong>${formatNumber(streamer.viewerMinutes)}</strong></li>`).join('')}</ol>` : '<p>Daily streamer breakdown unavailable.</p>'}
      </div>
      <div class="history-selected-actions">
        <a class="button" href="${providerBase}/day-flow/?date=${encodeURIComponent(day.day)}">Open Day Flow</a>
        <a class="button button--paper" href="${providerBase}/battle-lines/?date=${encodeURIComponent(day.day)}">Open Battle Lines</a>
      </div>
    </div>`
}

function renderRanking(streamers: Streamer[]): void {
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  const cards = document.querySelector<HTMLElement>('[data-history-streamer-cards]')
  if (!body || !cards) return
  const sorted = [...streamers].sort((a, b) => pageState.rankingSort === 'peak_viewers'
    ? number(b.peakViewers) - number(a.peakViewers)
    : number(b.viewerMinutes) - number(a.viewerMinutes))
    .slice(0, pageState.rankingLimit)

  if (sorted.length === 0) {
    body.innerHTML = '<tr><td colspan="7">No retained streamer rollup is available yet.</td></tr>'
    cards.innerHTML = '<div class="notice">No retained streamer rollup is available yet.</div>'
    return
  }

  body.innerHTML = sorted.map((streamer, index) => `
    <tr>
      <td class="rank">${index + 1}</td>
      <td><strong>${escapeHtml(streamer.displayName ?? '—')}</strong></td>
      <td class="num">${formatNumber(streamer.viewerMinutes)}</td>
      <td class="num">${formatNumber(streamer.peakViewers)}</td>
      <td class="num">${formatNumber(streamer.avgViewers)}</td>
      <td class="num">${formatDuration(streamer.observedMinutes)}</td>
      <td class="num ${changeClass(streamer.changePct)}">${escapeHtml(formatChange(streamer.changePct, streamer.comparisonState, streamer.changeAbs))}</td>
    </tr>`).join('')

  cards.innerHTML = sorted.map((streamer, index) => `
    <article class="history-streamer-card">
      <div class="history-streamer-card__head"><span class="rank">#${index + 1}</span><strong>${escapeHtml(streamer.displayName ?? '—')}</strong></div>
      <dl>
        <div><dt>Viewer-minutes</dt><dd>${formatNumber(streamer.viewerMinutes)}</dd></div>
        <div><dt>Peak viewers</dt><dd>${formatNumber(streamer.peakViewers)}</dd></div>
        <div><dt>Average viewers</dt><dd>${formatNumber(streamer.avgViewers)}</dd></div>
        <div><dt>Observed time</dt><dd>${formatDuration(streamer.observedMinutes)}</dd></div>
        <div><dt>Change</dt><dd class="${changeClass(streamer.changePct)}">${escapeHtml(formatChange(streamer.changePct, streamer.comparisonState, streamer.changeAbs))}</dd></div>
      </dl>
    </article>`).join('')
}

function renderDailyArchive(daily: Day[]): void {
  const root = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  if (!root) return
  if (daily.length === 0) {
    root.innerHTML = '<div class="notice">No observed days are available for this range.</div>'
    return
  }

  root.innerHTML = [...daily].reverse().map((day) => `
    <article class="day-card${day.day === pageState.selectedDay ? ' is-selected' : ''}" data-history-day-card="${escapeHtml(day.day ?? '')}" tabindex="0">
      <div class="day-card__head"><time>${escapeHtml(formatDate(day.day))}</time><span class="history-badge history-badge--${safeClass(day.coverageState ?? 'partial')}">${escapeHtml(humanLabel(day.coverageState ?? 'partial'))}</span></div>
      <strong>${formatNumber(day.totalViewerMinutes)}</strong>
      <span>viewer-minutes</span>
      <dl>
        <div><dt>Peak viewers</dt><dd>${formatNumber(day.peakViewers)}</dd></div>
        <div><dt>Peak streamer</dt><dd>${escapeHtml(day.peakStreamerName ?? '—')}</dd></div>
        <div><dt>Observed streams</dt><dd>${formatNumber(day.observedStreamCount)}</dd></div>
      </dl>
      <div class="day-card__actions">
        <a href="${providerBase}/day-flow/?date=${encodeURIComponent(day.day ?? '')}">Day Flow</a>
        <a href="${providerBase}/battle-lines/?date=${encodeURIComponent(day.day ?? '')}">Battle Lines</a>
      </div>
    </article>`).join('')

  root.querySelectorAll<HTMLElement>('[data-history-day-card]').forEach((card) => {
    const choose = (event: Event) => {
      if ((event.target as HTMLElement | null)?.closest('a')) return
      selectDay(card.dataset.historyDay)
    }
    card.addEventListener('click', choose)
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        selectDay(card.dataset.historyDay)
      }
    })
  })
}

function renderCoverage(payload: HistoryPayload): void {
  const root = document.querySelector<HTMLElement>('[data-history-notes]')
  if (!root) return
  const coverage = payload.coverage
  const affected = coverage?.affectedDays ?? []
  const notes = coverage?.notes ?? payload.notes ?? []
  root.innerHTML = `
    <div class="history-coverage-grid">
      <div><small>Observed days</small><strong>${formatNumber(coverage?.observedDays)} / ${formatNumber(payload.period?.days)}</strong></div>
      <div><small>Partial days</small><strong>${formatNumber(coverage?.partialDays)}</strong></div>
      <div><small>Missing days</small><strong>${formatNumber(coverage?.missingDays)}</strong></div>
      <div><small>Observed time</small><strong>${formatDuration(coverage?.observedMinutes)} / ${formatDuration(coverage?.expectedMinutes)}</strong></div>
    </div>
    ${affected.length ? `<p><strong>Affected dates:</strong> ${escapeHtml(affected.slice(0, 12).map(formatDate).join(', '))}${affected.length > 12 ? ` and ${affected.length - 12} more` : ''}.</p>` : '<p>No affected dates were reported for this range.</p>'}
    ${notes.length ? `<ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}</ul>` : ''}
    <p class="history-coverage-impact">Partial or missing observation can make totals and rankings lower than actual platform activity.</p>`
}

function selectDay(day?: string): void {
  if (!day || !currentPayload) return
  pageState.selectedDay = day
  updateUrl()
  renderChart(currentPayload, currentPayload.daily ?? [], pageState.metric)
  renderSelectedDay(currentPayload.daily ?? [])
  renderDailyArchive(currentPayload.daily ?? [])
  document.querySelector<HTMLElement>('[data-history-selected-day]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function setLoading(): void {
  setStatePill('loading')
  setFeedback('Loading retained history…', 'quiet')
  const stage = document.querySelector<HTMLElement>('.history-stage')
  if (stage) stage.innerHTML = '<div class="notice history-loading">Loading retained history…</div>'
}

function renderError(message: string): void {
  currentPayload = null
  setFacts(['Error', metricLabel(pageState.metric), 'Unavailable', '—'])
  setStatePill('error')
  setFeedback(message, 'error')
  const stage = document.querySelector<HTMLElement>('.history-stage')
  if (stage) stage.innerHTML = `<div class="notice history-error">History API unavailable: ${escapeHtml(message)}</div>`
  const selected = document.querySelector<HTMLElement>('[data-history-selected-day]')
  if (selected) selected.innerHTML = '<div class="notice">Selected-day details are unavailable.</div>'
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  if (body) body.innerHTML = '<tr><td colspan="7">History ranking unavailable.</td></tr>'
  const cards = document.querySelector<HTMLElement>('[data-history-streamer-cards]')
  if (cards) cards.innerHTML = '<div class="notice">History ranking unavailable.</div>'
  const daily = document.querySelector<HTMLElement>('[data-history-daily-archive]')
  if (daily) daily.innerHTML = '<div class="notice">Daily archive unavailable.</div>'
}

function showTooltip(event: PointerEvent, day: Day, metric: HistoryMetric): void {
  const stage = document.querySelector<HTMLElement>('.history-stage')
  const tooltip = stage?.querySelector<HTMLElement>('[data-history-tooltip]')
  if (!stage || !tooltip) return
  const rect = stage.getBoundingClientRect()
  const x = Math.min(rect.width - 220, Math.max(12, event.clientX - rect.left + 12))
  const y = Math.min(rect.height - 128, Math.max(48, event.clientY - rect.top + 12))
  tooltip.hidden = false
  tooltip.style.transform = `translate(${x}px, ${y}px)`
  tooltip.innerHTML = `<strong>${escapeHtml(formatDate(day.day))}</strong><span>${escapeHtml(metricLabel(metric))}: ${formatNumber(metricValue(day, metric))}</span><span>Peak: ${formatNumber(day.peakViewers)}</span><span>Coverage: ${escapeHtml(humanLabel(day.coverageState ?? 'unknown'))}</span>`
}

function hideTooltip(): void {
  const tooltip = document.querySelector<HTMLElement>('[data-history-tooltip]')
  if (tooltip) tooltip.hidden = true
}

function setFacts(values: string[]): void {
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function setStrip(values: string[]): void {
  document.querySelectorAll<HTMLElement>('.data-strip__cell').forEach((cell, index) => {
    const small = cell.querySelector('small')?.outerHTML ?? ''
    cell.innerHTML = `${small}${escapeHtml(values[index] ?? '—')}`
  })
}

function setStatePill(state: string): void {
  const node = document.querySelector<HTMLElement>('[data-history-state-pill]')
  if (!node) return
  node.textContent = humanLabel(state)
  node.className = `history-state-pill history-state-pill--${safeClass(state)}`
}

function setFeedback(message: string, tone: 'quiet' | 'error'): void {
  const node = document.querySelector<HTMLElement>('[data-history-feedback]')
  if (!node) return
  node.textContent = message
  node.classList.toggle('is-error', tone === 'error')
}

function setText(selector: string, value: string): void {
  const node = document.querySelector<HTMLElement>(selector)
  if (node) node.textContent = value
}

function setInputValue(selector: string, value: string): void {
  const input = document.querySelector<HTMLInputElement>(selector)
  if (input && input.value !== value) input.value = value
}

function validateRange(from: string, to: string): string | null {
  if (!validDay(from) || !validDay(to)) return 'Choose a valid start and end date.'
  const fromTime = Date.parse(`${from}T00:00:00Z`)
  const toTime = Date.parse(`${to}T00:00:00Z`)
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`)
  if (fromTime > toTime) return 'The start date must be on or before the end date.'
  if (toTime > today) return 'Future dates cannot be selected.'
  const days = Math.round((toTime - fromTime) / 86400000) + 1
  if (days > 90) return 'Custom ranges are limited to 90 days.'
  return null
}

function metricValue(day: Day, metric: HistoryMetric): number {
  return metric === 'peak_viewers' ? number(day.peakViewers) : number(day.totalViewerMinutes)
}

function metricLabel(metric: string): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}

function chartAria(day: Day, metric: HistoryMetric): string {
  return `${formatDate(day.day)}, ${metricLabel(metric)} ${formatNumber(metricValue(day, metric))}, coverage ${humanLabel(day.coverageState ?? 'unknown')}`
}

function coverageSummary(payload: HistoryPayload): string {
  const coverage = payload.coverage
  return `${formatNumber(coverage?.observedDays)} observed · ${formatNumber(coverage?.partialDays)} partial · ${formatNumber(coverage?.missingDays)} missing`
}

function formatChange(changePct: unknown, comparisonState?: string, changeAbs?: unknown): string {
  if (comparisonState === 'new') return 'New'
  if (comparisonState === 'insufficient') return 'Not enough data'
  if (typeof changePct !== 'number' || !Number.isFinite(changePct)) return '—'
  const percentage = Math.round(changePct * 100)
  if (Math.abs(percentage) > 999) return `${percentage > 0 ? '>' : '<'}${percentage > 0 ? '+' : '-'}999% (${formatSigned(changeAbs)})`
  return `${percentage >= 0 ? '+' : ''}${percentage}%`
}

function formatSigned(value: unknown): string {
  const parsed = numberSigned(value)
  return `${parsed >= 0 ? '+' : ''}${formatCompact(parsed)}`
}

function changeClass(changePct: unknown): string {
  if (typeof changePct !== 'number' || !Number.isFinite(changePct) || changePct === 0) return 'flat'
  return changePct > 0 ? 'up' : 'down'
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

function formatNumber(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  return Math.round(value).toLocaleString('en-US')
}

function formatCompact(value: unknown): string {
  const parsed = numberSigned(value)
  const absolute = Math.abs(parsed)
  const sign = parsed < 0 ? '-' : ''
  if (absolute >= 1_000_000_000) return `${sign}${trim(absolute / 1_000_000_000)}B`
  if (absolute >= 1_000_000) return `${sign}${trim(absolute / 1_000_000)}M`
  if (absolute >= 1_000) return `${sign}${trim(absolute / 1_000)}K`
  return `${Math.round(parsed)}`
}

function trim(value: number): string {
  return value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1).replace(/\.0$/, '') : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

function niceMax(value: number): number {
  const exponent = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / exponent) * exponent
}

function sum(days: Day[], key: keyof Day): number {
  return days.reduce((acc, day) => acc + number(day[key]), 0)
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function numberSigned(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatDate(value?: string): string {
  if (!validDay(value)) return value || '—'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function shortDate(value?: string): string {
  if (!validDay(value)) return value || ''
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function safeClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

export {}
