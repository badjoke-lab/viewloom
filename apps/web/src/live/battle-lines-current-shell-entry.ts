type BattleLinePoint = { bucket?: string; minute?: string; timestamp?: string; viewers?: number; value?: number; observed?: boolean; state?: string }
type BattleLine = { id?: string; name?: string; displayName?: string; color?: string; points?: BattleLinePoint[]; buckets?: BattleLinePoint[] }
type BattleEvent = { label?: string; title?: string; summary?: string; at?: string; timestamp?: string; bucket?: string; type?: string }
type BattleSummary = { a?: string; b?: string; leader?: string; gap?: number; state?: string; label?: string; title?: string; summary?: string }
type BattlePayload = {
  platform?: string
  state?: string
  status?: string
  source?: string
  updatedAt?: string
  lastUpdated?: string
  lines?: BattleLine[]
  primaryBattle?: BattleSummary
  recommendedBattle?: BattleSummary
  secondaryBattles?: BattleSummary[]
  events?: BattleEvent[]
  reversals?: BattleEvent[]
  feed?: BattleEvent[]
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'
const state = readInitialState()

wireControls()
syncControls()
void hydrateBattleLines()

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = normalizeMetric(button.dataset.battleMetric)
      syncControls()
      writeDeepLinkState()
      void hydrateBattleLines()
    })
  })
  document.querySelector<HTMLElement>('[data-battle-refresh]')?.addEventListener('click', () => { void hydrateBattleLines() })
}

function readInitialState(): { metric: string } {
  const params = new URLSearchParams(window.location.search)
  return { metric: normalizeMetric(params.get('metric')) }
}

function syncControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]').forEach((button) => {
    button.classList.toggle('active', normalizeMetric(button.dataset.battleMetric) === state.metric)
  })
}

function writeDeepLinkState(): void {
  const params = new URLSearchParams(window.location.search)
  params.set('metric', state.metric)
  history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`)
}

async function hydrateBattleLines(): Promise<void> {
  renderLoading()
  try {
    const response = await fetch(`${endpoint}?metric=${encodeURIComponent(state.metric)}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    if (!response.ok) throw new Error(`battle lines api returned ${response.status}`)
    const payload = await response.json() as BattlePayload
    renderFacts(payload)
    renderStrip(payload)
    renderSummary(payload)
    renderChart(payload)
    renderFeed(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function renderLoading(): void {
  const stage = document.querySelector<HTMLElement>('.battle-stage')
  if (stage) stage.innerHTML = '<div class="notice">Loading Battle Lines from observed snapshots…</div>'
}

function renderFacts(payload: BattlePayload): void {
  const values = [
    label(payload.state ?? payload.status ?? 'unknown'),
    label(state.metric),
    String((payload.lines ?? []).length || '—'),
    time(payload.updatedAt ?? payload.lastUpdated),
  ]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderStrip(payload: BattlePayload): void {
  const cells = document.querySelectorAll<HTMLElement>('.data-strip__cell')
  const points = (payload.lines ?? []).reduce((sum, line) => sum + normalizePoints(line).length, 0)
  const values = [time(payload.updatedAt ?? payload.lastUpdated), `${(payload.lines ?? []).length} lines`, `${points} points`, label(payload.source ?? 'api')]
  cells.forEach((cell, index) => {
    const labelNode = cell.querySelector('small')?.outerHTML ?? ''
    cell.innerHTML = `${labelNode}${escapeHtml(values[index] ?? '—')}`
  })
}

function renderSummary(payload: BattlePayload): void {
  const summary = payload.primaryBattle ?? payload.recommendedBattle
  const target = document.querySelector<HTMLElement>('[data-battle-summary]')
  if (!target) return
  if (!summary) {
    target.innerHTML = '<p>No primary battle is available for this observed window.</p>'
    return
  }
  target.innerHTML = `<div class="kicker">Primary battle</div><h2>${escapeHtml(summary.title ?? summary.label ?? pair(summary))}</h2><div class="inspector__row"><div><small>Leader</small><strong>${escapeHtml(summary.leader ?? '—')}</strong></div><span>${formatNumber(summary.gap ?? 0)} gap</span></div><div class="inspector__row"><div><small>State</small><strong>${escapeHtml(label(summary.state ?? payload.state ?? 'unknown'))}</strong></div><span>${escapeHtml(time(payload.updatedAt ?? payload.lastUpdated))}</span></div><p>${escapeHtml(summary.summary ?? '')}</p>`
}

function renderChart(payload: BattlePayload): void {
  const stage = document.querySelector<HTMLElement>('.battle-stage')
  if (!stage) return
  const lines = (payload.lines ?? []).slice(0, 5).map((line) => ({ ...line, points: normalizePoints(line).filter(isObservedPoint) })).filter((line) => (line.points ?? []).length > 1)
  if (lines.length === 0) {
    stage.innerHTML = `<div class="notice">No connected Battle Lines can be drawn for this observed window.</div>`
    return
  }
  const width = 1200
  const height = 560
  const pad = { top: 34, right: 34, bottom: 44, left: 58 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const allValues = lines.flatMap((line) => (line.points ?? []).map((point) => pointValue(point)))
  const max = Math.max(1, ...allValues)
  const min = Math.min(0, ...allValues)
  const maxLen = Math.max(1, ...lines.map((line) => (line.points ?? []).length))
  const pathMarkup = lines.map((line, index) => {
    const pts = (line.points ?? []).map((point, pointIndex) => `${x(pointIndex, maxLen, chartW, pad.left).toFixed(1)},${y(pointValue(point), min, max, chartH, pad.top).toFixed(1)}`).join(' ')
    return `<polyline points="${pts}" fill="none" stroke="${stroke(index)}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><title>${escapeHtml(line.name ?? line.displayName ?? `Line ${index + 1}`)}</title></polyline>`
  }).join('')
  const legend = lines.map((line, index) => `<span><i style="background:${stroke(index)}"></i>${escapeHtml(line.name ?? line.displayName ?? `Line ${index + 1}`)}</span>`).join('')
  stage.innerHTML = `<div class="battle-legend">${legend}</div><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Battle Lines chart"><g class="chart-grid">${grid(width, height, pad)}</g>${pathMarkup}</svg>`
}

function renderFeed(payload: BattlePayload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-feed]')
  if (!target) return
  const events = [...(payload.events ?? []), ...(payload.reversals ?? []), ...(payload.feed ?? [])].slice(0, 8)
  if (events.length === 0) {
    target.innerHTML = '<p>No reversals or notable deltas were detected in this observed window.</p>'
    return
  }
  target.innerHTML = events.map((event) => `<article class="event-item"><strong>${escapeHtml(event.title ?? event.label ?? label(event.type ?? 'event'))}</strong><span>${escapeHtml(time(event.at ?? event.timestamp ?? event.bucket))}</span><p>${escapeHtml(event.summary ?? '')}</p></article>`).join('')
}

function renderError(message: string): void {
  const stage = document.querySelector<HTMLElement>('.battle-stage')
  if (stage) stage.innerHTML = `<div class="notice">Battle Lines API unavailable: ${escapeHtml(message)}</div>`
}

function normalizeMetric(input: string | null | undefined): string { return input === 'indexed' ? 'indexed' : 'viewers' }
function normalizePoints(line: BattleLine): BattleLinePoint[] { return Array.isArray(line.points) ? line.points : Array.isArray(line.buckets) ? line.buckets : [] }
function isObservedPoint(point: BattleLinePoint): boolean { return point.observed !== false && !['missing', 'offline', 'not_observed'].includes(String(point.state ?? '').toLowerCase()) }
function pointValue(point: BattleLinePoint): number { const value = point.viewers ?? point.value ?? 0; return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function pair(summary: BattleSummary): string { return [summary.a, summary.b].filter(Boolean).join(' vs ') || 'Observed battle' }
function x(index: number, count: number, chartW: number, left: number): number { return left + (count <= 1 ? 0 : (index / (count - 1)) * chartW) }
function y(value: number, min: number, max: number, chartH: number, top: number): number { return top + chartH - ((value - min) / Math.max(1, max - min)) * chartH }
function grid(width: number, height: number, pad: { top: number; bottom: number; left: number; right: number }): string { return [0, .25, .5, .75, 1].map((ratio) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + ratio * (height - pad.top - pad.bottom)}" y2="${pad.top + ratio * (height - pad.top - pad.bottom)}"/>`).join('') }
function stroke(index: number): string { return ['#7dd3fc', '#f472b6', '#facc15', '#22d378', '#a78bfa'][index % 5] }
function formatNumber(value: number): string { return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value)) }
function time(input: unknown): string { if (typeof input !== 'string' || !input) return '—'; const date = new Date(input); return Number.isNaN(date.getTime()) ? input : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC` }
function label(input: string): string { return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function escapeHtml(input: string): string { return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
