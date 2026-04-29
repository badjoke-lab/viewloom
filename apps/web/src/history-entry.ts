import './styles.css'
import './history.css'

type PeriodMode = '7d' | '30d' | 'custom'
type Metric = 'viewer_minutes' | 'peak_viewers'

type Day = {
  day: string
  totalViewerMinutes: number
  peakViewers: number
  peakStreamerName?: string | null
  coverageState: string
}

type Streamer = {
  displayName: string
  viewerMinutes: number
  peakViewers: number
  changePct?: number | null
}

type Payload = {
  source: string
  state: string
  period: { label: string; from?: string; to?: string }
  summary: {
    totalViewerMinutes: number
    peakViewers: number
    peakDay: string | null
    topStreamer: { displayName: string; viewerMinutes: number } | null
    biggestRise?: { displayName: string; changePct: number } | null
    coverageState: string
  } | null
  daily: Day[]
  topStreamers: Streamer[]
  coverage: { state: string; notes: string[] }
  notes: string[]
}

type State = {
  period: PeriodMode
  metric: Metric
  from: string
  to: string
  selectedDay: string | null
  payload: Payload | null
}

type ChartSlot = {
  day: string
  data: Day | null
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const today = new Date()
const state = initialState()

app.innerHTML = renderShell()
bindControls()
void loadHistory()

function initialState(): State {
  const params = new URLSearchParams(location.search)
  const metric: Metric = params.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const from = params.get('from')
  const to = params.get('to')
  if (from && to) return { period: 'custom', metric, from, to, selectedDay: params.get('day'), payload: null }
  const period: PeriodMode = params.get('period') === '7d' ? '7d' : '30d'
  const range = rangeFor(period === '7d' ? 7 : 30)
  return { period, metric, from: range.from, to: range.to, selectedDay: params.get('day'), payload: null }
}

function renderShell(): string {
  return `
  <div class="page-shell page-shell--site theme-twitch history-page">
    <header class="site-header"><a class="brand" href="/">ViewLoom</a><nav class="site-nav" aria-label="Primary"><a class="nav-link" href="/">Portal</a><a class="nav-link is-current" href="/twitch/">Twitch</a><a class="nav-link" href="/kick/">Kick</a></nav><div class="header-note">Unofficial live observation UI</div></header>
    <main class="page-main history-main">
      <section class="hero hero--site history-hero"><div><div class="eyebrow">Twitch / Trends</div><h1>History & Trends</h1><p class="hero-copy">Review observed Twitch days, top streamers, and daily trend changes.</p><div class="hero-actions"><a class="button button--secondary" href="/twitch/heatmap/">Heatmap</a><a class="button button--secondary" href="/twitch/day-flow/">Day Flow</a><a class="button button--secondary" href="/twitch/battle-lines/">Battle Lines</a><a class="button button--primary" href="/twitch/history/">History</a></div></div><aside class="status-panel"><div class="status-panel__label">Data state</div><div class="status-panel__title" id="history-state">Loading history</div><p id="history-state-note">Waiting for observed Twitch history.</p></aside></section>
      <section class="history-controls"><div class="history-seg"><button type="button" data-period="7d">Last 7 days</button><button type="button" data-period="30d">Last 30 days</button><button type="button" data-period="custom">Custom</button></div><div class="history-date-controls"><label>From <input type="date" id="history-from"></label><label>To <input type="date" id="history-to"></label><button type="button" id="history-apply">Apply</button></div><div class="history-seg"><button type="button" data-metric="viewer_minutes">Viewer-minutes</button><button type="button" data-metric="peak_viewers">Peak viewers</button></div></section>
      <section class="summary-grid history-summary" id="history-summary"></section>
      <section class="history-card history-trend-card"><div class="history-head"><div><div class="eyebrow">Daily trend</div><h2 id="history-chart-title">Viewer-minutes by day</h2></div><span id="history-chart-note"></span></div><div id="history-chart" class="history-chart"></div><div id="history-selected" class="history-selected"></div></section>
      <section class="history-card history-peak-archive"><div class="history-head"><div><div class="eyebrow">Peaks</div><h2>Peak archive</h2></div><span id="history-peaks-note"></span></div><div id="history-peaks"></div></section>
      <section class="history-two-col"><article class="history-card"><div class="history-head"><div><div class="eyebrow">Ranking</div><h2>Top streamers</h2></div><span id="history-ranking-note"></span></div><div id="history-ranking"></div></article><article class="history-card"><div class="history-head"><div><div class="eyebrow">Archive</div><h2>Daily cards</h2></div><span id="history-days-note"></span></div><div id="history-days"></div></article></section>
      <section class="history-coverage" id="history-coverage"></section>
      ${renderMethodNotes()}
    </main>
  </div>`
}

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-period]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.period
      state.period = value === '7d' ? '7d' : value === 'custom' ? 'custom' : '30d'
      if (state.period !== 'custom') Object.assign(state, rangeFor(state.period === '7d' ? 7 : 30))
      state.selectedDay = null
      updateUrl()
      void loadHistory()
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = button.dataset.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
      updateUrl()
      void loadHistory()
    })
  })
  document.getElementById('history-apply')?.addEventListener('click', () => {
    const from = document.querySelector<HTMLInputElement>('#history-from')?.value
    const to = document.querySelector<HTMLInputElement>('#history-to')?.value
    if (from) state.from = from
    if (to) state.to = to
    state.period = 'custom'
    state.selectedDay = null
    updateUrl()
    void loadHistory()
  })
}

async function loadHistory(): Promise<void> {
  syncControls()
  renderLoading()
  const rangeError = validateRange()
  if (rangeError) {
    renderError(rangeError)
    return
  }
  try {
    const query = new URLSearchParams()
    if (state.period === 'custom') {
      query.set('from', state.from)
      query.set('to', state.to)
    } else {
      query.set('period', state.period)
    }
    query.set('metric', state.metric)
    const response = await fetch(`/api/history?${query.toString()}`, { cache: 'no-store' })
    const payload = await response.json() as Payload
    state.payload = payload
    state.selectedDay = state.selectedDay ?? payload.daily[payload.daily.length - 1]?.day ?? null
    renderPayload(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : 'History request failed.')
  }
}

function renderLoading(): void {
  setText('history-state', 'Loading history')
  setText('history-state-note', 'Fetching observed Twitch history.')
  setHtml('history-summary', ['Total observed', 'Peak day', 'Top streamer', 'Biggest rise', 'Coverage'].map((item) => card(item, '—', 'Loading…')).join(''))
  setText('history-chart-title', chartTitle())
  setText('history-chart-note', 'Loading daily trend')
  setHtml('history-chart', '<div class="history-empty">Loading daily trend…</div>')
  setHtml('history-selected', '')
  setText('history-peaks-note', '')
  setHtml('history-peaks', '<div class="history-empty">Loading peak archive…</div>')
  setHtml('history-ranking', '<div class="history-empty">Loading ranking…</div>')
  setHtml('history-days', '<div class="history-empty">Loading daily archive…</div>')
  setHtml('history-coverage', '')
}

function renderPayload(payload: Payload): void {
  syncControls()
  const summary = payload.summary
  setText('history-state', `${label(payload.state)} · ${label(payload.coverage.state)}`)
  setText('history-state-note', `${payload.period.label} · ${payload.source === 'api' ? 'observed snapshots' : payload.source}`)
  const biggest = summary?.biggestRise
  setHtml('history-summary', [
    card('Total observed', compact(summary?.totalViewerMinutes ?? 0), 'Viewer-minutes across the selected range.'),
    card('Peak day', summary?.peakDay ?? '—', `${format(summary?.peakViewers ?? 0)} peak viewers.`),
    card('Top streamer', summary?.topStreamer?.displayName ?? '—', summary?.topStreamer ? `${compact(summary.topStreamer.viewerMinutes)} viewer-minutes.` : 'No ranking yet.'),
    card('Biggest rise', biggest?.displayName ?? '—', biggest ? `${signed(biggest.changePct)} vs previous period.` : 'Not enough previous data.'),
    card('Coverage', label(summary?.coverageState ?? 'unknown'), payload.coverage.notes.join(' ')),
  ].join(''))
  renderChart(payload)
  renderSelected(payload)
  renderPeaks(payload)
  renderRanking(payload)
  renderDays(payload)
  renderCoverage(payload)
}

function renderChart(payload: Payload): void {
  const totalDays = daySpan(state.from, state.to)
  const observedDays = payload.daily.length
  setText('history-chart-title', chartTitle())
  setText('history-chart-note', `${observedDays} / ${totalDays} days observed`)
  if (payload.daily.length === 0) {
    setHtml('history-chart', '<div class="history-empty">No observed history for this period. Try Last 30 days or a different custom range.</div>')
    return
  }

  const slots = buildChartSlots(payload.daily)
  const values = slots.map((slot) => slot.data ? chartValue(slot.data) : 0)
  const max = Math.max(...values, 1)
  const coverageHint = observedDays < totalDays ? `<p class="history-chart-help">Muted slots mark selected days without observed snapshots.</p>` : ''
  setHtml('history-chart', `${coverageHint}<div class="history-bars history-bars--slots">${slots.map((slot) => renderChartSlot(slot, max)).join('')}</div>`)
  document.querySelectorAll<HTMLButtonElement>('[data-day]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDay = button.dataset.day ?? null
      updateUrl()
      renderChart(payload)
      renderSelected(payload)
      renderPeaks(payload)
      renderDays(payload)
    })
  })
}

function renderChartSlot(slot: ChartSlot, max: number): string {
  if (!slot.data) {
    return `<div class="history-bar history-bar--missing" title="${slot.day}: no observed snapshots"><span>—</span><i></i><small>${slot.day.slice(5)}</small></div>`
  }
  const value = chartValue(slot.data)
  const height = Math.max(4, Math.round(value / max * 156))
  return `<button type="button" class="history-bar ${state.selectedDay === slot.day ? 'is-selected' : ''}" data-day="${slot.day}" style="--bar-height:${height}px"><span>${compact(value)}</span><i></i><small>${slot.day.slice(5)}</small></button>`
}

function renderSelected(payload: Payload): void {
  const day = payload.daily.find((item) => item.day === state.selectedDay) ?? payload.daily[payload.daily.length - 1]
  if (!day) {
    setHtml('history-selected', '<div class="history-empty">Select a day to inspect it.</div>')
    return
  }
  setHtml('history-selected', `<div><div class="eyebrow">Selected day</div><h2>${day.day}</h2><p>${compact(day.totalViewerMinutes)} viewer-minutes · ${format(day.peakViewers)} peak · ${text(day.peakStreamerName ?? 'unknown peak streamer')} · ${label(day.coverageState)} coverage.</p></div><div class="history-actions"><a class="button button--secondary" href="/twitch/day-flow/?date=${day.day}">Open Day Flow</a><a class="button button--secondary" href="/twitch/battle-lines/?date=${day.day}">Open Battle Lines</a></div>`)
}

function renderPeaks(payload: Payload): void {
  const peaks = payload.daily.slice().sort((a, b) => b.peakViewers - a.peakViewers).slice(0, 6)
  setText('history-peaks-note', peaks.length ? `Top ${peaks.length} daily peaks` : '')
  if (peaks.length === 0) {
    setHtml('history-peaks', '<div class="history-empty">No peak archive is available for this period.</div>')
    return
  }
  setHtml('history-peaks', `<div class="history-peak-list">${peaks.map((day, index) => `<article class="history-peak-card ${state.selectedDay === day.day ? 'is-selected' : ''}"><button type="button" data-peak-day="${day.day}"><strong>#${index + 1} ${day.day}</strong><span>${format(day.peakViewers)} peak viewers</span><small>${text(day.peakStreamerName ?? 'unknown peak streamer')}</small></button><div><a href="/twitch/day-flow/?date=${day.day}">Day Flow</a><a href="/twitch/battle-lines/?date=${day.day}">Battle Lines</a></div></article>`).join('')}</div>`)
  document.querySelectorAll<HTMLButtonElement>('[data-peak-day]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDay = button.dataset.peakDay ?? null
      updateUrl()
      renderChart(payload)
      renderSelected(payload)
      renderPeaks(payload)
      renderDays(payload)
    })
  })
}

function renderRanking(payload: Payload): void {
  const sorted = [...payload.topStreamers].sort((a, b) => state.metric === 'viewer_minutes' ? b.viewerMinutes - a.viewerMinutes : b.peakViewers - a.peakViewers)
  setText('history-ranking-note', sorted.length ? `Top ${Math.min(sorted.length, 12)} by ${state.metric === 'viewer_minutes' ? 'viewer-minutes' : 'peak viewers'}` : '')
  if (sorted.length === 0) {
    setHtml('history-ranking', '<div class="history-empty">No streamer ranking is available for this period. This usually means the selected range has no payload-level stream data.</div>')
    return
  }
  setHtml('history-ranking', `<div class="history-ranking">${sorted.slice(0, 12).map((item, index) => `<article><strong>#${index + 1} ${text(item.displayName)}</strong><span>${compact(item.viewerMinutes)} viewer-minutes</span><span>${format(item.peakViewers)} peak</span><span>${item.changePct == null ? '—' : signed(item.changePct)}</span></article>`).join('')}</div>`)
}

function renderDays(payload: Payload): void {
  setText('history-days-note', payload.daily.length ? `${payload.daily.length} observed day${payload.daily.length === 1 ? '' : 's'}` : '')
  if (payload.daily.length === 0) {
    setHtml('history-days', '<div class="history-empty">No daily cards are available for this period.</div>')
    return
  }
  setHtml('history-days', `<div class="history-day-list">${payload.daily.slice().reverse().map((day) => `<article class="history-day ${state.selectedDay === day.day ? 'is-selected' : ''}"><button type="button" data-select-day="${day.day}"><strong>${day.day}</strong><span>${compact(day.totalViewerMinutes)} viewer-minutes</span><span>${format(day.peakViewers)} peak · ${text(day.peakStreamerName ?? 'unknown')}</span><small>${label(day.coverageState)} coverage</small></button><div><a href="/twitch/day-flow/?date=${day.day}">Day Flow</a><a href="/twitch/battle-lines/?date=${day.day}">Battle Lines</a></div></article>`).join('')}</div>`)
  document.querySelectorAll<HTMLButtonElement>('[data-select-day]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedDay = button.dataset.selectDay ?? null
      updateUrl()
      renderChart(payload)
      renderSelected(payload)
      renderPeaks(payload)
      renderDays(payload)
    })
  })
}

function renderCoverage(payload: Payload): void {
  const notes = payload.notes.concat(payload.coverage.notes).filter(Boolean)
  setHtml('history-coverage', `<div class="rail-card"><div class="rail-card__label">Coverage / Data quality</div><h2>${label(payload.coverage.state)}</h2><p>${text(notes.join(' '))}</p></div>`)
}

function renderMethodNotes(): string {
  return `<section class="history-method-grid" data-history-method-notes="true"><article class="history-method-card"><div class="history-method-card__label">Metric</div><h2>Viewer-minutes</h2><p>Approximate observed audience volume across the selected period. A stream with more viewers for longer time ranks higher.</p></article><article class="history-method-card"><div class="history-method-card__label">Metric</div><h2>Peak viewers</h2><p>The highest observed viewer value in the selected period. It highlights spikes, but not necessarily sustained strength.</p></article><article class="history-method-card"><div class="history-method-card__label">Quality</div><h2>Coverage</h2><p>Coverage shows whether the selected days had enough observed snapshots. Partial or missing days can make rankings incomplete.</p></article></section>`
}

function renderError(message: string): void {
  setText('history-state', 'History unavailable')
  setText('history-state-note', message)
  setHtml('history-summary', card('State', 'Error', message))
  setHtml('history-chart', `<div class="history-empty">${text(message)}</div>`)
  setHtml('history-selected', '')
  setText('history-peaks-note', '')
  setHtml('history-peaks', '')
  setHtml('history-ranking', '')
  setHtml('history-days', '')
  setHtml('history-coverage', '')
}

function syncControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-period]').forEach((button) => button.classList.toggle('is-active', button.dataset.period === state.period))
  document.querySelectorAll<HTMLButtonElement>('[data-metric]').forEach((button) => button.classList.toggle('is-active', button.dataset.metric === state.metric))
  const from = document.querySelector<HTMLInputElement>('#history-from')
  const to = document.querySelector<HTMLInputElement>('#history-to')
  if (from) { from.value = state.from; from.max = dateString(today) }
  if (to) { to.value = state.to; to.max = dateString(today) }
}

function updateUrl(): void {
  const query = new URLSearchParams()
  if (state.period === 'custom') { query.set('from', state.from); query.set('to', state.to) } else { query.set('period', state.period) }
  query.set('metric', state.metric)
  if (state.selectedDay) query.set('day', state.selectedDay)
  history.replaceState(null, '', `/twitch/history/?${query.toString()}`)
}

function validateRange(): string | null {
  if (!state.from || !state.to) return 'Select both start and end dates.'
  if (state.from > state.to) return 'The start date must be before the end date.'
  if (state.to > dateString(today)) return 'Future dates are not available.'
  if (daySpan(state.from, state.to) > 90) return 'Custom range is limited to 90 days in v1.'
  return null
}

function buildChartSlots(days: Day[]): ChartSlot[] {
  const byDay = new Map(days.map((item) => [item.day, item]))
  return dayRange(state.from, state.to).map((day) => ({ day, data: byDay.get(day) ?? null }))
}

function chartValue(day: Day): number {
  return state.metric === 'viewer_minutes' ? day.totalViewerMinutes : day.peakViewers
}

function chartTitle(): string {
  return state.metric === 'viewer_minutes' ? 'Viewer-minutes by day' : 'Peak viewers by day'
}

function rangeFor(days: number): { from: string; to: string } { const to = new Date(today); const from = new Date(today); from.setDate(to.getDate() - days + 1); return { from: dateString(from), to: dateString(to) } }
function dayRange(from: string, to: string): string[] { const days: string[] = []; const cursor = new Date(`${from}T00:00:00Z`); const end = new Date(`${to}T00:00:00Z`); while (cursor <= end && days.length < 91) { days.push(dateString(cursor)); cursor.setUTCDate(cursor.getUTCDate() + 1) } return days }
function daySpan(from: string, to: string): number { return Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000) + 1) }
function card(labelText: string, value: string, body: string): string { return `<article class="summary-card"><div class="summary-card__label">${text(labelText)}</div><div class="summary-card__value">${text(value)}</div><p>${text(body)}</p></article>` }
function setText(id: string, value: string): void { const node = document.getElementById(id); if (node) node.textContent = value }
function setHtml(id: string, value: string): void { const node = document.getElementById(id); if (node) node.innerHTML = value }
function dateString(date: Date): string { return date.toISOString().slice(0, 10) }
function format(value: number): string { return Math.round(value).toLocaleString('en-US') }
function compact(value: number): string { if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(Math.round(value)) }
function signed(value: number): string { const pct = value * 100; return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` }
function label(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function text(value: string): string { const node = document.createElement('span'); node.textContent = value; return node.innerHTML }
