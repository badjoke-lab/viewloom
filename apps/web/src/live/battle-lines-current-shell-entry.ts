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

type BattleState = { metric: 'viewers' | 'indexed'; selectedLineId: string | null; selectedPointIndex: number }

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-battle-lines' : '/api/battle-lines'
const state: BattleState = { metric: 'viewers', selectedLineId: null, selectedPointIndex: -1 }
let lastPayload: BattlePayload | null = null

wireControls()
void hydrateBattleLines()

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = button.dataset.battleMetric === 'indexed' ? 'indexed' : 'viewers'
      document.querySelectorAll<HTMLButtonElement>('[data-battle-metric]').forEach((node) => node.classList.toggle('active', node === button))
      void hydrateBattleLines()
    })
  })
  document.querySelector<HTMLElement>('[data-battle-refresh]')?.addEventListener('click', () => { void hydrateBattleLines() })
}

async function hydrateBattleLines(): Promise<void> {
  renderLoading()
  try {
    const response = await fetch(`${endpoint}?metric=${encodeURIComponent(state.metric)}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    if (!response.ok) throw new Error(`battle lines api returned ${response.status}`)
    const payload = await response.json() as BattlePayload
    lastPayload = payload
    const lines = visibleLines(payload)
    const maxLen = Math.max(0, ...lines.map((line) => normalizePoints(line).length))
    if (!state.selectedLineId || !lines.some((line) => lineKey(line) === state.selectedLineId)) state.selectedLineId = lines[0] ? lineKey(lines[0]) : null
    if (state.selectedPointIndex < 0 || state.selectedPointIndex >= maxLen) state.selectedPointIndex = Math.max(0, maxLen - 1)
    renderFacts(payload)
    renderStrip(payload)
    renderChart(payload)
    renderSummary(payload)
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
    String(visibleLines(payload).length || '—'),
    time(payload.updatedAt ?? payload.lastUpdated),
  ]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderStrip(payload: BattlePayload): void {
  const lines = visibleLines(payload)
  const cells = document.querySelectorAll<HTMLElement>('.data-strip__cell')
  const points = lines.reduce((sum, line) => sum + normalizePoints(line).length, 0)
  const values = [time(payload.updatedAt ?? payload.lastUpdated), `${lines.length} lines`, `${points} points`, label(payload.source ?? 'api')]
  cells.forEach((cell, index) => {
    const labelNode = cell.querySelector('small')?.outerHTML ?? ''
    cell.innerHTML = `${labelNode}${escapeHtml(values[index] ?? '—')}`
  })
}

function renderChart(payload: BattlePayload): void {
  const stage = document.querySelector<HTMLElement>('.battle-stage')
  if (!stage) return
  const lines = visibleLines(payload)
  if (lines.length === 0) {
    stage.innerHTML = '<div class="notice">No connected Battle Lines can be drawn for this observed window.</div>'
    return
  }

  const width = 1200
  const height = 560
  const pad = { top: 56, right: 34, bottom: 44, left: 58 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const allValues = lines.flatMap((line) => normalizePoints(line).map((point) => pointValue(point)))
  const max = Math.max(1, ...allValues)
  const min = Math.min(0, ...allValues)
  const maxLen = Math.max(1, ...lines.map((line) => normalizePoints(line).length))
  const selectedIndex = Math.max(0, Math.min(maxLen - 1, state.selectedPointIndex))

  const pathMarkup = lines.map((line, index) => {
    const points = normalizePoints(line)
    const id = lineKey(line)
    const selected = id === state.selectedLineId
    const pts = points.map((point, pointIndex) => `${x(pointIndex, maxLen, chartW, pad.left).toFixed(1)},${y(pointValue(point), min, max, chartH, pad.top).toFixed(1)}`).join(' ')
    const selectedPoint = points[Math.min(selectedIndex, points.length - 1)]
    const selectedMarker = selectedPoint ? `<circle cx="${x(Math.min(selectedIndex, points.length - 1), maxLen, chartW, pad.left).toFixed(1)}" cy="${y(pointValue(selectedPoint), min, max, chartH, pad.top).toFixed(1)}" r="6" fill="${stroke(index)}" stroke="#eef4ff" stroke-width="2"/>` : ''
    return `<g data-battle-line="${escapeAttr(id)}" class="battle-line${selected ? ' selected' : ''}"><polyline points="${pts}" fill="none" stroke="${stroke(index)}" stroke-width="${selected ? '6' : '3'}" stroke-linecap="round" stroke-linejoin="round"><title>${escapeHtml(lineLabel(line, index))}</title></polyline>${selectedMarker}</g>`
  }).join('')

  const cursorX = x(selectedIndex, maxLen, chartW, pad.left)
  const selectedLine = currentLine(lines)
  const selectedPoint = selectedLine ? normalizePoints(selectedLine)[Math.min(selectedIndex, normalizePoints(selectedLine).length - 1)] : undefined
  const cursor = `<g class="battle-cursor"><line x1="${cursorX.toFixed(1)}" x2="${cursorX.toFixed(1)}" y1="${pad.top}" y2="${height - pad.bottom}"/><text x="${Math.min(width - 170, cursorX + 8).toFixed(1)}" y="${pad.top + 16}">${escapeHtml(pointTime(selectedPoint))}</text></g>`
  const legend = lines.map((line, index) => `<button type="button" class="battle-legend__item${lineKey(line) === state.selectedLineId ? ' active' : ''}" data-battle-legend="${escapeAttr(lineKey(line))}" title="${escapeAttr(lineLabel(line, index))}"><i style="background:${stroke(index)}"></i><span>${escapeHtml(lineLabel(line, index))}</span></button>`).join('')

  stage.innerHTML = `<div class="battle-legend" aria-label="Battle Lines streams">${legend}</div><svg data-battle-chart data-point-count="${maxLen}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Battle Lines chart"><g class="chart-grid">${grid(width, height, pad)}</g>${pathMarkup}${cursor}</svg>`
  bindChartInteraction(payload, { width, pad, chartW, maxLen })
  bindLegendInteraction(payload)
  bindLineInteraction(payload)
}

function bindChartInteraction(payload: BattlePayload, geometry: { width: number; pad: { left: number; right: number }; chartW: number; maxLen: number }): void {
  const chart = document.querySelector<SVGSVGElement>('[data-battle-chart]')
  if (!chart) return
  chart.addEventListener('click', (event) => {
    const rect = chart.getBoundingClientRect()
    const pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * geometry.width
    const bounded = Math.max(geometry.pad.left, Math.min(geometry.width - geometry.pad.right, pointerX))
    const ratio = (bounded - geometry.pad.left) / Math.max(1, geometry.chartW)
    state.selectedPointIndex = Math.max(0, Math.min(geometry.maxLen - 1, Math.round(ratio * (geometry.maxLen - 1))))
    renderChart(payload)
    renderSummary(payload)
  })
}

function bindLegendInteraction(payload: BattlePayload): void {
  document.querySelectorAll<HTMLButtonElement>('[data-battle-legend]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedLineId = button.dataset.battleLegend || null
      renderChart(payload)
      renderSummary(payload)
    })
  })
}

function bindLineInteraction(payload: BattlePayload): void {
  document.querySelectorAll<SVGGElement>('[data-battle-line]').forEach((group) => {
    group.addEventListener('click', (event) => {
      event.stopPropagation()
      state.selectedLineId = group.dataset.battleLine || null
      renderChart(payload)
      renderSummary(payload)
    })
  })
}

function renderSummary(payload: BattlePayload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-summary]')
  if (!target) return
  const lines = visibleLines(payload)
  const selected = currentLine(lines)
  if (!selected) {
    target.innerHTML = '<p>No selectable stream is available for this observed window.</p>'
    return
  }
  const selectedIndex = Math.max(0, state.selectedPointIndex)
  const point = normalizePoints(selected)[Math.min(selectedIndex, Math.max(0, normalizePoints(selected).length - 1))]
  const competitors = lines.filter((line) => lineKey(line) !== lineKey(selected)).map((line) => ({ line, point: normalizePoints(line)[Math.min(selectedIndex, Math.max(0, normalizePoints(line).length - 1))] })).filter((item) => item.point)
  const nearest = competitors.sort((a, b) => Math.abs(pointValue(a.point) - pointValue(point)) - Math.abs(pointValue(b.point) - pointValue(point)))[0]
  const gap = nearest ? Math.abs(pointValue(point) - pointValue(nearest.point)) : null
  target.innerHTML = `<div class="kicker">Selected stream</div><h2 title="${escapeAttr(lineLabel(selected, 0))}">${escapeHtml(lineLabel(selected, 0))}</h2><div class="inspector__row"><div><small>Selected time</small><strong>${escapeHtml(pointTime(point))}</strong></div><span>${escapeHtml(formatValue(pointValue(point)))}</span></div><div class="inspector__row"><div><small>Nearest line</small><strong title="${escapeAttr(nearest ? lineLabel(nearest.line, 0) : '—')}">${escapeHtml(nearest ? lineLabel(nearest.line, 0) : '—')}</strong></div><span>${gap === null ? '—' : `${escapeHtml(formatValue(gap))} gap`}</span></div><div class="inspector__row"><div><small>State</small><strong>${escapeHtml(label(payload.state ?? payload.status ?? 'unknown'))}</strong></div><span>${escapeHtml(time(payload.updatedAt ?? payload.lastUpdated))}</span></div>`
}

function renderFeed(payload: BattlePayload): void {
  const target = document.querySelector<HTMLElement>('[data-battle-feed]')
  if (!target) return
  const events = dedupeEvents([...(payload.events ?? []), ...(payload.reversals ?? []), ...(payload.feed ?? [])]).slice(0, 6)
  if (events.length === 0) {
    target.innerHTML = '<p>No distinct reversals or notable deltas were detected in this observed window.</p>'
    return
  }
  target.innerHTML = events.map((event) => `<article class="event-item"><strong>${escapeHtml(event.title ?? event.label ?? label(event.type ?? 'event'))}</strong><span>${escapeHtml(time(event.at ?? event.timestamp ?? event.bucket))}</span>${event.summary ? `<p>${escapeHtml(event.summary)}</p>` : ''}</article>`).join('')
}

function renderError(message: string): void {
  const stage = document.querySelector<HTMLElement>('.battle-stage')
  if (stage) stage.innerHTML = `<div class="notice">Battle Lines API unavailable: ${escapeHtml(message)}</div>`
}

function visibleLines(payload: BattlePayload): BattleLine[] {
  return (payload.lines ?? []).slice(0, 5).map((line) => ({ ...line, points: normalizePoints(line).filter(isObservedPoint) })).filter((line) => normalizePoints(line).length > 1)
}
function currentLine(lines: BattleLine[]): BattleLine | undefined { return lines.find((line) => lineKey(line) === state.selectedLineId) ?? lines[0] }
function lineKey(line: BattleLine): string { return line.id ?? line.name ?? line.displayName ?? 'line' }
function lineLabel(line: BattleLine, index: number): string { return line.displayName ?? line.name ?? `Line ${index + 1}` }
function normalizePoints(line: BattleLine): BattleLinePoint[] { return Array.isArray(line.points) ? line.points : Array.isArray(line.buckets) ? line.buckets : [] }
function isObservedPoint(point: BattleLinePoint): boolean { return point.observed !== false && !['missing', 'offline', 'not_observed'].includes(String(point.state ?? '').toLowerCase()) }
function pointValue(point: BattleLinePoint | undefined): number { const value = point?.viewers ?? point?.value ?? 0; return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function pointTime(point: BattleLinePoint | undefined): string { return point?.bucket ?? point?.minute ?? time(point?.timestamp) }
function dedupeEvents(events: BattleEvent[]): BattleEvent[] {
  const seen = new Set<string>()
  return events.filter((event) => {
    const key = [event.title ?? event.label ?? event.type ?? '', event.at ?? event.timestamp ?? event.bucket ?? '', event.summary ?? ''].join('|').trim()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
function x(index: number, count: number, chartW: number, left: number): number { return left + (count <= 1 ? 0 : (index / (count - 1)) * chartW) }
function y(value: number, min: number, max: number, chartH: number, top: number): number { return top + chartH - ((value - min) / Math.max(1, max - min)) * chartH }
function grid(width: number, height: number, pad: { top: number; bottom: number; left: number; right: number }): string { return [0, .25, .5, .75, 1].map((ratio) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + ratio * (height - pad.top - pad.bottom)}" y2="${pad.top + ratio * (height - pad.top - pad.bottom)}"/>`).join('') }
function stroke(index: number): string { return ['#7dd3fc', '#f472b6', '#facc15', '#22d378', '#a78bfa'][index % 5] }
function formatValue(value: number): string { return state.metric === 'indexed' ? value.toFixed(2) : formatNumber(value) }
function formatNumber(value: number): string { return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value)) }
function time(input: unknown): string { if (typeof input !== 'string' || !input) return '—'; const date = new Date(input); return Number.isNaN(date.getTime()) ? input : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC` }
function label(input: string): string { return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function escapeHtml(input: string): string { return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function escapeAttr(input: string): string { return escapeHtml(input).replace(/'/g, '&#39;') }
