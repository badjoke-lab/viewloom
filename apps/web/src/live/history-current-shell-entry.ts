type Day = { day?: string; totalViewerMinutes?: number; peakViewers?: number; observedStreamCount?: number; coverageState?: string }
type Streamer = { displayName?: string; viewerMinutes?: number; peakViewers?: number; avgViewers?: number; changePct?: number | null }
type HistoryPayload = {
  source?: string
  state?: string
  metric?: string
  period?: { label?: string; days?: number }
  summary?: { totalViewerMinutes?: number; peakViewers?: number; peakDay?: string; coverageState?: string; topStreamer?: Streamer | null }
  daily?: Day[]
  topStreamers?: Streamer[]
  coverage?: { state?: string; observedDays?: number; missingDays?: number; partialDays?: number; notes?: string[] }
  readPath?: string
  error?: { message?: string }
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-history' : '/api/history'

void hydrateHistory()

async function hydrateHistory(): Promise<void> {
  try {
    const response = await fetch(`${endpoint}?period=30d`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    const payload = await response.json() as HistoryPayload
    if (!response.ok) throw new Error(payload.error?.message ?? `history api returned ${response.status}`)
    render(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function render(payload: HistoryPayload): void {
  const daily = payload.daily ?? []
  const top = payload.topStreamers ?? []
  setFacts([
    payload.period?.label ?? 'Last 30 days',
    label(payload.metric ?? 'viewer_minutes'),
    label(payload.state ?? 'unknown'),
    `${payload.coverage?.observedDays ?? daily.length} days`,
  ])
  setStrip([
    payload.period?.label ?? 'Last 30 days',
    `${top.length} streams`,
    `${daily.length} days`,
    label(payload.source ?? 'api'),
  ])
  renderSummary(payload, daily, top)
  renderChart(payload, daily)
  renderTable(payload, top)
  renderNotes(payload)
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

function renderSummary(payload: HistoryPayload, daily: Day[], top: Streamer[]): void {
  const root = document.querySelector<HTMLElement>('[data-history-summary]')
  if (!root) return
  const summary = payload.summary
  root.innerHTML = `<div class="fact"><small>Total viewer-minutes</small><strong>${format(summary?.totalViewerMinutes ?? sum(daily, 'totalViewerMinutes'))}</strong></div><div class="fact"><small>Peak viewers</small><strong>${format(summary?.peakViewers ?? max(daily, 'peakViewers'))}</strong></div><div class="fact"><small>Peak day</small><strong>${escapeHtml(summary?.peakDay ?? daily.at(-1)?.day ?? '—')}</strong></div><div class="fact"><small>Top streamer</small><strong>${escapeHtml(summary?.topStreamer?.displayName ?? top[0]?.displayName ?? '—')}</strong></div>`
}

function renderChart(payload: HistoryPayload, daily: Day[]): void {
  const stage = document.querySelector<HTMLElement>('.history-stage')
  if (!stage) return
  if (daily.length === 0) {
    stage.innerHTML = `<div class="notice">${escapeHtml(payload.coverage?.notes?.[0] ?? 'No retained history rollup is available yet.')}</div>`
    return
  }
  const width = 1210, height = 560, left = 52, right = 28, top = 34, bottom = 44
  const chartW = width - left - right, chartH = height - top - bottom
  const highest = Math.max(1, ...daily.map((day) => num(day.totalViewerMinutes)))
  const barW = Math.max(8, (chartW / Math.max(1, daily.length)) * 0.58)
  const bars = daily.map((day, index) => {
    const x = left + (index / Math.max(1, daily.length - 1)) * chartW - barW / 2
    const h = Math.max(2, num(day.totalViewerMinutes) / highest * chartH)
    const y = top + chartH - h
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}"><title>${escapeHtml(day.day ?? '')}</title></rect>`
  }).join('')
  stage.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="History trend chart"><g class="chart-grid">${grid(width, height, left, right, top, bottom)}</g><g class="history-bars">${bars}</g><text class="chart-axis" x="${left}" y="${height - 12}">${escapeHtml(daily[0]?.day ?? '')}</text><text class="chart-axis" x="${width - 180}" y="${height - 12}">${escapeHtml(daily.at(-1)?.day ?? '')}</text></svg>`
}

function renderTable(payload: HistoryPayload, top: Streamer[]): void {
  const body = document.querySelector<HTMLTableSectionElement>('.metric-ledger tbody')
  if (!body) return
  if (top.length === 0) {
    body.innerHTML = '<tr><td colspan="5">No retained streamer rollup is available yet.</td></tr>'
    return
  }
  body.innerHTML = top.slice(0, 10).map((streamer, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(streamer.displayName ?? '—')}</td><td>${format(streamer.viewerMinutes)}</td><td>${format(streamer.peakViewers)}</td><td>${formatPct(streamer.changePct)}</td></tr>`).join('')
}

function renderNotes(payload: HistoryPayload): void {
  const target = document.querySelector<HTMLElement>('[data-history-notes]')
  if (target) target.textContent = payload.coverage?.notes?.[0] ?? `Read path: ${payload.readPath ?? 'api'}`
}

function renderError(message: string): void {
  setFacts(['Error', 'Viewer-minutes', 'Unavailable', '—'])
  const stage = document.querySelector<HTMLElement>('.history-stage')
  if (stage) stage.innerHTML = `<div class="notice">History API unavailable: ${escapeHtml(message)}</div>`
}

function grid(width: number, height: number, left: number, right: number, top: number, bottom: number): string {
  return [0, .25, .5, .75, 1].map((ratio) => `<line x1="${left}" x2="${width - right}" y1="${top + ratio * (height - top - bottom)}" y2="${top + ratio * (height - top - bottom)}"/>`).join('')
}
function sum(days: Day[], key: keyof Day): number { return days.reduce((acc, day) => acc + num(day[key]), 0) }
function max(days: Day[], key: keyof Day): number { return Math.max(0, ...days.map((day) => num(day[key]))) }
function num(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function format(value: unknown): string { return num(value).toLocaleString('en-US') }
function formatPct(value: unknown): string { return typeof value === 'number' && Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%` : '—' }
function label(value: string): string { return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function escapeHtml(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
