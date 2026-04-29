import './styles.css'
import './history.css'

type HistoryPayload = {
  source: string
  state: string
  period: { label: string }
  summary: {
    totalViewerMinutes: number
    peakViewers: number
    peakDay: string | null
    topStreamer: { displayName: string; viewerMinutes: number } | null
    coverageState: string
  } | null
  daily: Array<{ day: string; totalViewerMinutes: number; peakViewers: number; coverageState: string }>
  topStreamers: Array<{ displayName: string; viewerMinutes: number; peakViewers: number }>
  coverage: { state: string; notes: string[] }
  notes: string[]
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

app.innerHTML = `
  <div class="page-shell page-shell--site theme-twitch history-page">
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link" href="/">Portal</a>
        <a class="nav-link is-current" href="/twitch/">Twitch</a>
        <a class="nav-link" href="/kick/">Kick</a>
      </nav>
      <div class="header-note">Unofficial live observation UI</div>
    </header>
    <main class="page-main history-main">
      <section class="hero hero--site history-hero">
        <div>
          <div class="eyebrow">Twitch / Trends</div>
          <h1>History & Trends</h1>
          <p class="hero-copy">Review observed Twitch days, top streamers, and daily trend changes.</p>
          <div class="hero-actions">
            <a class="button button--secondary" href="/twitch/heatmap/">Heatmap</a>
            <a class="button button--secondary" href="/twitch/day-flow/">Day Flow</a>
            <a class="button button--secondary" href="/twitch/battle-lines/">Battle Lines</a>
            <a class="button button--primary" href="/twitch/history/">History</a>
          </div>
        </div>
        <aside class="status-panel"><div class="status-panel__label">Data state</div><div class="status-panel__title" id="history-state">Loading history</div><p id="history-state-note">Waiting for observed Twitch history.</p></aside>
      </section>
      <section class="history-controls">
        <button type="button" data-period="7d">Last 7 days</button>
        <button type="button" data-period="30d">Last 30 days</button>
        <button type="button" data-metric="viewer_minutes">Viewer-minutes</button>
        <button type="button" data-metric="peak_viewers">Peak viewers</button>
      </section>
      <section class="summary-grid history-summary" id="history-summary"></section>
      <section class="history-card"><div class="history-head"><div><div class="eyebrow">Daily trend</div><h2>Observed days</h2></div></div><div id="history-chart" class="history-chart"></div></section>
      <section class="history-two-col"><article class="history-card"><div class="history-head"><div><div class="eyebrow">Ranking</div><h2>Top streamers</h2></div></div><div id="history-ranking"></div></article><article class="history-card"><div class="history-head"><div><div class="eyebrow">Archive</div><h2>Daily cards</h2></div></div><div id="history-days"></div></article></section>
      <section class="history-coverage" id="history-coverage"></section>
    </main>
  </div>
`

let period = new URLSearchParams(location.search).get('period') === '7d' ? '7d' : '30d'
let metric = new URLSearchParams(location.search).get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'

bindControls()
void loadHistory()

function bindControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-period]').forEach((button) => {
    button.addEventListener('click', () => {
      period = button.dataset.period === '7d' ? '7d' : '30d'
      void loadHistory()
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      metric = button.dataset.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
      void loadHistory()
    })
  })
}

async function loadHistory(): Promise<void> {
  setText('history-state', 'Loading history')
  setText('history-state-note', 'Fetching observed Twitch history.')
  try {
    const response = await fetch(`/api/history?period=${period}&metric=${metric}`, { cache: 'no-store' })
    const payload = await response.json() as HistoryPayload
    renderPayload(payload)
  } catch (error) {
    setText('history-state', 'History unavailable')
    setText('history-state-note', error instanceof Error ? error.message : 'History request failed.')
  }
}

function renderPayload(payload: HistoryPayload): void {
  const summary = payload.summary
  setText('history-state', `${payload.state} · ${payload.coverage.state}`)
  setText('history-state-note', `${payload.period.label} · ${payload.source}`)
  const summaryHost = document.getElementById('history-summary')
  if (summaryHost) {
    summaryHost.innerHTML = [
      card('Total observed', compact(summary?.totalViewerMinutes ?? 0), 'Viewer-minutes across the selected range.'),
      card('Peak day', summary?.peakDay ?? '—', `${format(summary?.peakViewers ?? 0)} peak viewers.`),
      card('Top streamer', summary?.topStreamer?.displayName ?? '—', summary?.topStreamer ? `${compact(summary.topStreamer.viewerMinutes)} viewer-minutes.` : 'No ranking yet.'),
      card('Coverage', summary?.coverageState ?? 'unknown', payload.coverage.notes.join(' ')),
    ].join('')
  }
  renderChart(payload)
  renderRanking(payload)
  renderDays(payload)
  const coverage = document.getElementById('history-coverage')
  if (coverage) coverage.innerHTML = `<div class="rail-card"><div class="rail-card__label">Coverage</div><h2>${text(payload.coverage.state)}</h2><p>${text(payload.notes.concat(payload.coverage.notes).join(' '))}</p></div>`
}

function renderChart(payload: HistoryPayload): void {
  const host = document.getElementById('history-chart')
  if (!host) return
  if (payload.daily.length === 0) {
    host.innerHTML = '<div class="history-empty">No observed history for this period.</div>'
    return
  }
  const values = payload.daily.map((day) => metric === 'viewer_minutes' ? day.totalViewerMinutes : day.peakViewers)
  const max = Math.max(...values, 1)
  host.innerHTML = `<div class="history-bars">${payload.daily.map((day, index) => `<a class="history-bar" href="/twitch/day-flow/?date=${day.day}" style="--bar-height:${Math.max(4, Math.round(values[index] / max * 180))}px"><span>${compact(values[index])}</span><i></i><small>${day.day.slice(5)}</small></a>`).join('')}</div>`
}

function renderRanking(payload: HistoryPayload): void {
  const host = document.getElementById('history-ranking')
  if (!host) return
  host.innerHTML = `<div class="history-ranking">${payload.topStreamers.slice(0, 12).map((item, index) => `<article><strong>#${index + 1} ${text(item.displayName)}</strong><span>${compact(item.viewerMinutes)} viewer-minutes</span><span>${format(item.peakViewers)} peak</span></article>`).join('')}</div>`
}

function renderDays(payload: HistoryPayload): void {
  const host = document.getElementById('history-days')
  if (!host) return
  host.innerHTML = `<div class="history-day-list">${payload.daily.slice().reverse().map((day) => `<article class="history-day"><strong>${day.day}</strong><span>${compact(day.totalViewerMinutes)} viewer-minutes</span><span>${format(day.peakViewers)} peak</span><div><a href="/twitch/day-flow/?date=${day.day}">Day Flow</a><a href="/twitch/battle-lines/?date=${day.day}">Battle Lines</a></div></article>`).join('')}</div>`
}

function card(label: string, value: string, body: string): string {
  return `<article class="summary-card"><div class="summary-card__label">${text(label)}</div><div class="summary-card__value">${text(value)}</div><p>${text(body)}</p></article>`
}

function setText(id: string, value: string): void {
  const node = document.getElementById(id)
  if (node) node.textContent = value
}
function format(value: number): string { return Math.round(value).toLocaleString('en-US') }
function compact(value: number): string { if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`; if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}K`; return String(Math.round(value)) }
function text(value: string): string { const node = document.createElement('span'); node.textContent = value; return node.innerHTML }
