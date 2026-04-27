import './styles.css'
import './battle-lines.css'
import './battle-lines-status.css'

type Metric = 'viewers' | 'indexed'
type DataStatus = 'loading' | 'live' | 'partial' | 'stale' | 'empty' | 'error' | 'demo'
type ObservedState = 'observed' | 'offline' | 'not_observed' | 'missing'
type Point = { value: number | null; state: ObservedState; time: string }
type Line = { id: string; name: string; color: string; points: Point[] }
type Pair = [string, string]
type BattleEvent = { time: string; index: number; label: string; pair: Pair }
type NormalizedPayload = { lines: Line[]; primaryPair?: Pair; secondaryPairs: Pair[]; events: BattleEvent[]; status: DataStatus; sourceText: string }
type BattleState = {
  metric: Metric
  top: 3 | 5 | 10
  bucket: '1m' | '5m' | '10m'
  mode: 'recommended' | 'custom' | 'inspect'
  selected: number
  pair: Pair
  lines: Line[]
  secondaryPairs: Pair[]
  events: BattleEvent[]
  status: DataStatus
  sourceText: string
  statusMessage: string
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const site = document.body.dataset.page?.startsWith('kick') ? 'kick' : 'twitch'
const palette = ['#3b82f6', '#a855f7', '#64748b', '#5eead4', '#94a3b8']
const demoLines = makeDemoLines()

let state: BattleState = {
  metric: 'viewers',
  top: 5,
  bucket: '5m',
  mode: 'recommended',
  selected: 36,
  pair: ['xqc', 'jynxzi'],
  lines: demoLines,
  secondaryPairs: buildSecondaryPairs(demoLines, ['xqc', 'jynxzi']),
  events: fallbackEventsForLines(demoLines, ['xqc', 'jynxzi']),
  status: 'demo',
  sourceText: 'Demo · Partial · Top 5 · Viewers · 5m · Updated fallback',
  statusMessage: 'Using demo fallback until the API returns usable Battle Lines data.',
}

app.innerHTML = renderPage()
bind()
render()
void loadApi()

async function loadApi(): Promise<void> {
  state = { ...state, status: 'loading', statusMessage: 'Loading Battle Lines data…' }
  render()
  try {
    const response = await fetch(`/api/battle-lines?top=${state.top}&bucket=${state.bucket}&metric=${state.metric}`, { cache: 'no-store' })
    if (!response.ok) {
      state = { ...demoState(), status: 'error', sourceText: `Error · HTTP ${response.status} · Demo fallback`, statusMessage: 'The Battle Lines API returned an error. Demo data is clearly marked.' }
      render()
      return
    }
    const normalized = normalizePayload((await response.json()) as unknown)
    if (!normalized || normalized.lines.length < 2) {
      state = { ...state, lines: [], secondaryPairs: [], events: [], status: 'empty', sourceText: 'Empty · No battle-lines series', statusMessage: 'No qualifying Battle Lines series were returned for this range.' }
      render()
      return
    }
    const nextPair = normalized.primaryPair ?? (pairExists(state.pair, normalized.lines) ? state.pair : firstPair(normalized.lines))
    state = {
      ...state,
      lines: normalized.lines,
      pair: nextPair,
      selected: Math.min(state.selected, normalized.lines[0].points.length - 1),
      secondaryPairs: normalized.secondaryPairs.length > 0 ? normalized.secondaryPairs : buildSecondaryPairs(normalized.lines, nextPair),
      events: normalized.events.length > 0 ? normalized.events : fallbackEventsForLines(normalized.lines, nextPair),
      status: normalized.status,
      sourceText: normalized.sourceText,
      statusMessage: statusMessage(normalized.status),
    }
    render()
  } catch {
    state = { ...demoState(), status: 'error', sourceText: 'Error · API unavailable · Demo fallback', statusMessage: 'The Battle Lines API could not be reached. Demo data is clearly marked.' }
    render()
  }
}

function demoState(): BattleState {
  return {
    ...state,
    lines: demoLines,
    pair: ['xqc', 'jynxzi'],
    selected: Math.min(state.selected, demoLines[0].points.length - 1),
    secondaryPairs: buildSecondaryPairs(demoLines, ['xqc', 'jynxzi']),
    events: fallbackEventsForLines(demoLines, ['xqc', 'jynxzi']),
  }
}

function renderPage(): string {
  return `<div class="page-shell page-shell--site theme-${site} bl-page">
    <header class="site-header"><a class="brand" href="/">ViewLoom</a><nav class="site-nav"><a class="nav-link" href="/">Portal</a><a class="nav-link ${site === 'twitch' ? 'is-current' : ''}" href="/twitch/">Twitch</a><a class="nav-link ${site === 'kick' ? 'is-current' : ''}" href="/kick/">Kick</a></nav><div class="header-note">${title(site)} ViewLoom</div></header>
    <main class="page-main bl-main">
      <section class="bl-hero"><div><div class="eyebrow">${site} / Compare</div><h1>Battle Lines</h1><p>Compare live audience lines, reversals, and closing gaps.</p></div><button class="bl-icon" type="button">⇧</button></section>
      <section class="bl-controls">${segment('top', ['Top 3', 'Top 5', 'Top 10'], `Top ${state.top}`)}${segment('metric', ['Viewers', 'Indexed'], title(state.metric))}${segment('bucket', ['1m', '5m', '10m'], state.bucket)}<button class="bl-refresh" data-refresh type="button">Refresh</button></section>
      <div class="bl-status" data-status></div>
      <section class="bl-summary" data-summary></section>
      <section class="bl-chart-card"><div class="bl-chart-head"><h2>Battle Lines</h2><div data-legend></div></div><div class="bl-chart" data-chart></div><section class="bl-inspector" data-inspector></section></section>
      <section class="bl-section" data-reversals></section>
      <section class="bl-section" data-secondary></section>
      <section class="bl-section" data-feed></section>
      <div class="bl-note" data-coverage-note>Partial data · observed channels only.</div>
    </main>
  </div>`
}

function segment(group: string, values: string[], selected: string): string {
  return `<div class="bl-seg" data-group="${group}">${values.map((value) => `<button type="button" class="${value === selected ? 'on' : ''}" data-value="${value}">${value}</button>`).join('')}</div>`
}

function bind(): void {
  document.querySelectorAll<HTMLButtonElement>('.bl-seg button').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.closest<HTMLElement>('[data-group]')?.dataset.group
      const value = button.dataset.value ?? ''
      if (group === 'top') state = { ...state, top: value === 'Top 3' ? 3 : value === 'Top 10' ? 10 : 5 }
      if (group === 'metric') state = { ...state, metric: value === 'Indexed' ? 'indexed' : 'viewers' }
      if (group === 'bucket') state = { ...state, bucket: value === '1m' || value === '10m' ? value : '5m' }
      refreshButtons()
      render()
      void loadApi()
    })
  })
  document.querySelector('[data-refresh]')?.addEventListener('click', () => void loadApi())
}

function refreshButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-group="top"] button').forEach((button) => button.classList.toggle('on', button.dataset.value === `Top ${state.top}`))
  document.querySelectorAll<HTMLElement>('[data-group="metric"] button').forEach((button) => button.classList.toggle('on', button.dataset.value === title(state.metric)))
  document.querySelectorAll<HTMLElement>('[data-group="bucket"] button').forEach((button) => button.classList.toggle('on', button.dataset.value === state.bucket))
}

function render(): void {
  renderStatus()
  const pair = getPair()
  if (!pair) {
    renderNoData()
    return
  }
  const info = pairInfo(pair, state.selected)
  const coverage = coverageSummary()
  setText('[data-coverage-note]', coverage.note)
  const summary = document.querySelector<HTMLElement>('[data-summary]')
  if (summary) summary.innerHTML = `<div><span>${state.mode === 'inspect' ? 'Inspecting' : state.mode === 'custom' ? 'Custom' : 'Recommended'}</span><h2>${pair[0].name} vs ${pair[1].name}</h2><p>${info.trend} gap · ${format(info.gap)}</p></div><strong>Gap ${format(info.gap)}</strong><strong>${info.trend} ${signed(info.delta)}</strong><strong>Latest reversal ${state.events[0]?.time ?? '—'}</strong><strong>Observed ${coverage.short}</strong>`
  const legend = document.querySelector<HTMLElement>('[data-legend]')
  if (legend) legend.innerHTML = `<span style="--c:${pair[0].color}">${pair[0].name}</span><span style="--c:${pair[1].color}">${pair[1].name}</span><span style="--c:#64748b">Other battles</span>`
  renderChart(pair)
  renderInspector(pair, info)
  renderLists()
}

function renderStatus(): void {
  const coverage = state.lines.length > 0 ? coverageSummary().status : 'No line samples'
  const el = document.querySelector<HTMLElement>('[data-status]')
  if (!el) return
  el.dataset.state = state.status
  el.innerHTML = `<strong>${statusLabel(state.status)}</strong><span>${state.sourceText} · ${coverage}</span><small>${state.statusMessage}</small>`
}

function renderNoData(): void {
  const summary = document.querySelector<HTMLElement>('[data-summary]')
  const legend = document.querySelector<HTMLElement>('[data-legend]')
  const chart = document.querySelector<HTMLElement>('[data-chart]')
  const inspector = document.querySelector<HTMLElement>('[data-inspector]')
  if (summary) summary.innerHTML = `<div><span>${statusLabel(state.status)}</span><h2>No Battle Lines data</h2><p>${state.statusMessage}</p></div><strong>Top ${state.top}</strong><strong>${title(state.metric)}</strong><strong>${state.bucket}</strong><strong>No samples</strong>`
  if (legend) legend.innerHTML = ''
  if (chart) chart.innerHTML = `<div class="bl-empty"><strong>${statusLabel(state.status)}</strong><p>${state.statusMessage}</p><button type="button" data-empty-refresh>Retry</button></div>`
  if (inspector) inspector.innerHTML = ''
  setText('[data-coverage-note]', 'No observed Battle Lines samples for this range.')
  renderLists()
  chart?.querySelector('[data-empty-refresh]')?.addEventListener('click', () => void loadApi())
}

function renderChart(pair: [Line, Line]): void {
  const host = document.querySelector<HTMLElement>('[data-chart]')
  if (!host) return
  const lines = state.lines.slice(0, state.top)
  const max = state.metric === 'indexed' ? 100 : nice(Math.max(...lines.flatMap((line) => line.points.map((_, index) => renderValue(line, index))), 1))
  const w = 1200
  const h = 520
  const left = 70
  const right = 122
  const top = 42
  const bottom = 62
  const plotW = w - left - right
  const plotH = h - top - bottom
  const x = (index: number) => left + (plotW * index) / Math.max(1, lines[0].points.length - 1)
  const y = (line: Line, index: number) => top + plotH - (plotH * renderValue(line, index)) / max
  const linePath = (line: Line) => makePath(line, x, y)
  const band = makeGapBand(pair, x, y)
  const nowX = x(lines[0].points.length - 1)
  const selectedX = x(state.selected)
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Battle Lines chart"><rect width="${w}" height="${h}" rx="18" fill="#07101d"/>${missingBands(lines, x, top, h - bottom)}${ticks(max).map((tick) => `<line x1="${left}" x2="${w - right}" y1="${top + plotH - plotH * tick / max}" y2="${top + plotH - plotH * tick / max}" stroke="rgba(148,163,184,.16)"/><text x="${left - 12}" y="${top + plotH - plotH * tick / max + 4}" text-anchor="end" fill="#9fb0ca" font-size="13">${state.metric === 'indexed' ? Math.round(tick) : compact(tick)}</text>`).join('')}${['00:00', '06:00', '12:00', '18:00', '24:00'].map((label, index) => `<text x="${left + plotW * index / 4}" y="${h - 20}" text-anchor="middle" fill="#9fb0ca" font-size="13">${label}</text>`).join('')}${band}${lines.filter((line) => !state.pair.includes(line.id)).map((line) => `<path d="${linePath(line)}" fill="none" stroke="${line.color}" stroke-width="2" opacity=".28"/>`).join('')}<path d="${linePath(pair[0])}" fill="none" stroke="${pair[0].color}" stroke-width="4"/><path d="${linePath(pair[1])}" fill="none" stroke="${pair[1].color}" stroke-width="4"/><line x1="${nowX}" x2="${nowX}" y1="${top}" y2="${h - bottom}" stroke="rgba(255,255,255,.5)" stroke-dasharray="5 6"/><text x="${nowX + 8}" y="${top + 15}" fill="#cbd5e1" font-size="12">Now</text><line x1="${selectedX}" x2="${selectedX}" y1="${top}" y2="${h - bottom}" stroke="rgba(255,255,255,.84)"/><rect x="${selectedX - 28}" y="${top - 34}" width="56" height="24" rx="8" fill="rgba(15,23,42,.94)" stroke="rgba(255,255,255,.18)"/><text x="${selectedX}" y="${top - 17}" text-anchor="middle" fill="#eef4ff" font-size="12">${time(state.selected)}</text>${endpoint(pair[0], x, y)}${endpoint(pair[1], x, y)}</svg>`
  host.querySelector('svg')?.addEventListener('click', (event) => {
    const rect = host.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width - left / w) / (plotW / w)))
    state = { ...state, mode: 'inspect', selected: Math.round(ratio * (lines[0].points.length - 1)) }
    render()
  })
}

function makePath(line: Line, x: (index: number) => number, y: (line: Line, index: number) => number): string {
  let drawing = false
  return line.points.map((point, index) => {
    if (!canDraw(point)) {
      drawing = false
      return ''
    }
    const command = drawing ? 'L' : 'M'
    drawing = true
    return `${command}${x(index).toFixed(1)},${y(line, index).toFixed(1)}`
  }).filter(Boolean).join(' ')
}

function makeGapBand(pair: [Line, Line], x: (index: number) => number, y: (line: Line, index: number) => number): string {
  const valid = pair[0].points.map((point, index) => canDraw(point) && canDraw(pair[1].points[index]) ? index : -1).filter((index) => index >= 0)
  if (valid.length < 2) return ''
  const top = valid.map((index) => `${x(index)},${y(pair[0], index)}`).join(' ')
  const bottom = valid.map((index) => `${x(index)},${y(pair[1], index)}`).reverse().join(' ')
  return `<polygon points="${top} ${bottom}" fill="rgba(96,165,250,.12)"/>`
}

function missingBands(lines: Line[], x: (index: number) => number, top: number, bottom: number): string {
  const first = lines[0]
  if (!first) return ''
  return first.points.map((_, index) => lines.some((line) => line.points[index]?.state === 'missing' || line.points[index]?.state === 'not_observed') ? `<rect x="${x(index) - 4}" y="${top}" width="8" height="${bottom - top}" fill="rgba(251,191,36,.08)"/>` : '').join('')
}

function endpoint(line: Line, x: (index: number) => number, y: (line: Line, index: number) => number): string {
  const index = line.points.length - 1
  if (!canDraw(line.points[index])) return ''
  const px = x(index)
  const py = y(line, index)
  return `<circle cx="${px}" cy="${py}" r="5" fill="${line.color}"/><rect x="${px + 10}" y="${py - 20}" width="96" height="40" rx="8" fill="rgba(15,23,42,.92)" stroke="${line.color}"/><text x="${px + 18}" y="${py - 4}" fill="${line.color}" font-size="12">${line.name}</text><text x="${px + 18}" y="${py + 12}" fill="#eef4ff" font-size="12">${format(line.points[index].value ?? 0)}</text>`
}

function renderInspector(pair: [Line, Line], info: { gap: number; delta: number; trend: string; leader: Line }): void {
  const el = document.querySelector<HTMLElement>('[data-inspector]')
  if (!el) return
  const a = pair[0].points[state.selected]
  const b = pair[1].points[state.selected]
  const prev = Math.max(0, state.selected - 1)
  const aPrev = pair[0].points[prev]
  const bPrev = pair[1].points[prev]
  el.innerHTML = `<div><span>Selected time</span><strong>${time(state.selected)}</strong><small>${state.mode === 'inspect' ? 'Inspecting history' : 'Live mode'}</small><button data-live type="button">Jump to live</button></div><div><span>Pair</span><strong>${pair[0].name} vs ${pair[1].name}</strong><small>Leader · ${info.leader.name}</small></div><div><span>Gap</span><strong>${format(info.gap)}</strong><small>${observedLabel(a)} / ${observedLabel(b)}</small></div><div><span>Trend</span><strong>${info.trend}</strong><small>${signed(info.delta)}</small></div><div><span>Viewers</span><p>${pair[0].name}<b>${pointText(a)}</b></p><p>${pair[1].name}<b>${pointText(b)}</b></p></div><div><span>Change</span><p>${pair[0].name}<b>${signed(renderValue(pair[0], state.selected) - renderValue(pair[0], prev))}</b></p><p>${pair[1].name}<b>${signed(renderValue(pair[1], state.selected) - renderValue(pair[1], prev))}</b></p>${!canDraw(aPrev) || !canDraw(bPrev) ? '<small>Previous bucket was partially unobserved.</small>' : ''}</div>`
  el.querySelector('[data-live]')?.addEventListener('click', () => { state = { ...state, mode: 'recommended', selected: state.lines[0].points.length - 1 }; render() })
}

function renderLists(): void {
  const rev = document.querySelector<HTMLElement>('[data-reversals]')
  if (rev) rev.innerHTML = `<h2>Latest Reversals</h2><div>${state.events.slice(0, 3).map((event, index) => `<button type="button" data-reversal="${index}"><span>${event.time}</span> ${event.label}</button>`).join('')}</div>`
  rev?.querySelectorAll<HTMLButtonElement>('[data-reversal]').forEach((button) => button.addEventListener('click', () => {
    const event = state.events[Number(button.dataset.reversal)]
    state = { ...state, mode: 'inspect', selected: event.index, pair: event.pair }
    render()
  }))
  const sec = document.querySelector<HTMLElement>('[data-secondary]')
  if (sec) sec.innerHTML = `<h2>Secondary Battles</h2><div>${state.secondaryPairs.slice(0, 3).map((pair) => `<button type="button" data-pair="${pair[0]}:${pair[1]}">${pairLabel(pair)}</button>`).join('')}</div>`
  sec?.querySelectorAll<HTMLButtonElement>('[data-pair]').forEach((button) => button.addEventListener('click', () => {
    const [a, b] = String(button.dataset.pair).split(':') as Pair
    state = { ...state, mode: 'custom', pair: [a, b] }
    render()
  }))
  const feed = document.querySelector<HTMLElement>('[data-feed]')
  if (feed) feed.innerHTML = `<h2>Battle Feed</h2>${state.events.length > 0 ? state.events.slice(0, 3).map((event) => `<p>${event.time} ${event.label}</p>`).join('') : '<p>No battle events for this range.</p>'}`
}

function normalizePayload(payload: unknown): NormalizedPayload | null {
  if (!record(payload)) return null
  const lines = normalizeLines(payload)
  if (lines.length < 2) return null
  const primaryPair = normalizePair(payload.primaryBattle ?? payload.primary_battle ?? payload.recommendedBattle ?? payload.recommended_battle, lines)
  const secondaryPairs = normalizePairs(payload.secondaryBattles ?? payload.secondary_battles ?? payload.battles, lines, primaryPair ?? firstPair(lines))
  const events = normalizeEvents(payload.reversals ?? payload.events ?? payload.feed, lines, primaryPair ?? firstPair(lines))
  const status = normalizeStatus(payload.state ?? payload.status)
  return { lines, primaryPair, secondaryPairs, events, status, sourceText: buildSourceText(payload, status) }
}

function normalizeStatus(raw: unknown): DataStatus {
  const value = String(raw ?? 'partial').toLowerCase()
  if (value.includes('stale')) return 'stale'
  if (value.includes('empty')) return 'empty'
  if (value.includes('error')) return 'error'
  if (value.includes('demo')) return 'demo'
  if (value.includes('live')) return 'live'
  return 'partial'
}

function normalizeLines(payload: Record<string, unknown>): Line[] {
  const raw = Array.isArray(payload.lines) ? payload.lines : Array.isArray(payload.series) ? payload.series : []
  return raw.slice(0, 10).map((item, index): Line | null => {
    if (!record(item)) return null
    const rawPoints = Array.isArray(item.points) ? item.points : Array.isArray(item.values) ? item.values : []
    const points = rawPoints.map((point, pointIndex) => normalizePoint(point, pointIndex))
    if (points.length < 2) return null
    const id = resolveRawId(item, index)
    const name = String(item.name ?? item.displayName ?? item.display_name ?? item.login ?? id)
    return { id, name, color: palette[index % palette.length], points }
  }).filter((line): line is Line => line !== null)
}

function normalizePoint(point: unknown, index: number): Point {
  if (typeof point === 'number') return { value: point, state: 'observed', time: defaultTime(index) }
  if (!record(point)) return { value: null, state: 'missing', time: defaultTime(index) }
  const raw = point.viewers ?? point.value ?? point.y ?? point.viewerCount ?? point.viewer_count
  const rawState = point.observedState ?? point.observed_state ?? point.state
  const stateValue: ObservedState = rawState === 'offline' || rawState === 'not_observed' || rawState === 'missing' ? rawState : 'observed'
  const value = typeof raw === 'number' && Number.isFinite(raw) ? raw : stateValue === 'offline' ? 0 : null
  const time = normalizeTimeLabel(point.time ?? point.bucket ?? point.bucket_minute ?? point.x, index)
  return { value, state: value === null && stateValue === 'observed' ? 'missing' : stateValue, time }
}

function normalizePairs(raw: unknown, lines: Line[], primaryPair: Pair): Pair[] {
  const values = Array.isArray(raw) ? raw : []
  const parsed = values.map((item) => normalizePair(item, lines)).filter((pair): pair is Pair => pair !== null)
  return uniquePairs([...parsed, ...buildSecondaryPairs(lines, primaryPair)], primaryPair)
}

function normalizeEvents(raw: unknown, lines: Line[], fallbackPair: Pair): BattleEvent[] {
  const values = Array.isArray(raw) ? raw : []
  const events = values.map((item): BattleEvent | null => {
    if (!record(item)) return null
    const pair = normalizePair(item.pair ?? item.battle ?? item, lines) ?? fallbackPair
    const timeLabel = normalizeTimeLabel(item.time ?? item.bucket ?? item.bucket_minute ?? item.at, 0)
    const index = normalizeEventIndex(item.index, timeLabel, lines)
    const passer = item.passer ?? item.winner ?? item.a ?? item.from ?? item.leader
    const passed = item.passed ?? item.loser ?? item.b ?? item.to ?? item.chaser
    const label = String(item.label ?? item.text ?? (passer && passed ? `${displayName(passer, lines)} passed ${displayName(passed, lines)}` : pairLabel(pair)))
    return { time: timeLabel, index, label, pair }
  }).filter((event): event is BattleEvent => event !== null)
  return events.length > 0 ? events : fallbackEventsForLines(lines, fallbackPair)
}

function normalizeEventIndex(rawIndex: unknown, timeLabel: string, lines: Line[]): number {
  if (typeof rawIndex === 'number' && Number.isFinite(rawIndex)) return clamp(Math.round(rawIndex), 0, lines[0].points.length - 1)
  const target = parseTimeToMinutes(timeLabel)
  if (target === null) return 0
  let best = 0
  let bestDelta = Number.POSITIVE_INFINITY
  lines[0].points.forEach((point, index) => {
    const minutes = parseTimeToMinutes(point.time)
    if (minutes === null) return
    const delta = Math.abs(minutes - target)
    if (delta < bestDelta) {
      best = index
      bestDelta = delta
    }
  })
  return best
}

function normalizePair(raw: unknown, lines: Line[]): Pair | null {
  if (Array.isArray(raw) && raw.length >= 2) return resolvePair(raw[0], raw[1], lines)
  if (!record(raw)) return null
  return resolvePair(raw.a ?? raw.left ?? raw.streamerA ?? raw.streamer_a ?? raw.leader ?? raw.passer ?? raw.from, raw.b ?? raw.right ?? raw.streamerB ?? raw.streamer_b ?? raw.chaser ?? raw.passed ?? raw.to, lines)
}

function resolvePair(a: unknown, b: unknown, lines: Line[]): Pair | null {
  const left = resolveLineId(a, lines)
  const right = resolveLineId(b, lines)
  if (!left || !right || left === right) return null
  return [left, right]
}

function resolveLineId(value: unknown, lines: Line[]): string | null {
  const key = slug(String(value ?? ''))
  if (!key) return null
  return lines.find((line) => line.id === key || slug(line.name) === key)?.id ?? key
}

function buildSourceText(payload: Record<string, unknown>, status: DataStatus): string {
  const source = title(String(payload.source ?? 'api'))
  const updated = String(payload.updatedAt ?? payload.updated_at ?? payload.generatedAt ?? payload.generated_at ?? 'live')
  return `${source} · ${statusLabel(status)} · Top ${state.top} · ${title(state.metric)} · ${state.bucket} · Updated ${updated}`
}

function statusLabel(status: DataStatus): string {
  return status === 'loading' ? 'Loading' : status === 'live' ? 'Live' : status === 'partial' ? 'Partial' : status === 'stale' ? 'Stale' : status === 'empty' ? 'Empty' : status === 'error' ? 'Error' : 'Demo'
}

function statusMessage(status: DataStatus): string {
  if (status === 'live') return 'Live Battle Lines data is loaded.'
  if (status === 'partial') return 'Partial data · observed channels only.'
  if (status === 'stale') return 'Data may be stale; use Refresh to try the latest payload.'
  if (status === 'empty') return 'No qualifying Battle Lines series were returned for this range.'
  if (status === 'error') return 'Battle Lines data could not be loaded.'
  if (status === 'loading') return 'Loading Battle Lines data…'
  return 'Demo fallback is shown and should not be read as live data.'
}

function resolveRawId(item: Record<string, unknown>, index: number): string {
  return slug(String(item.id ?? item.streamerId ?? item.streamer_id ?? item.login ?? item.displayName ?? item.display_name ?? `line-${index}`))
}

function fallbackEventsForLines(lines: Line[], pair: Pair): BattleEvent[] {
  const fallback = lines.length >= 2 ? pair : firstPair(lines)
  return [{ time: lines[0]?.points[0]?.time ?? '00:00', index: 0, label: `${displayName(fallback[0], lines)} vs ${displayName(fallback[1], lines)} started`, pair: fallback }]
}

function buildSecondaryPairs(lines: Line[], primaryPair: Pair): Pair[] {
  const ids = lines.map((line) => line.id)
  return uniquePairs([[ids[0], ids[2]], [ids[1], ids[2]], [ids[3], ids[4]], [ids[0], ids[3]]].filter((pair): pair is Pair => Boolean(pair[0] && pair[1])) as Pair[], primaryPair)
}

function uniquePairs(pairs: Pair[], primaryPair: Pair): Pair[] {
  const seen = new Set<string>()
  return pairs.filter((pair) => {
    if (!pair[0] || !pair[1] || pair[0] === pair[1]) return false
    if (samePair(pair, primaryPair)) return false
    const key = pair.slice().sort().join(':')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function firstPair(lines: Line[]): Pair {
  return [lines[0]?.id ?? 'xqc', lines[1]?.id ?? 'jynxzi']
}

function pairExists(pair: Pair, lines: Line[]): boolean {
  return Boolean(lines.find((line) => line.id === pair[0]) && lines.find((line) => line.id === pair[1]))
}

function samePair(a: Pair, b: Pair): boolean {
  return a.includes(b[0]) && a.includes(b[1])
}

function pairLabel(pair: Pair): string {
  const lines = getPairByIds(pair)
  if (!lines) return pair.join(' vs ')
  const info = pairInfo(lines, state.selected)
  return `${lines[0].name} vs ${lines[1].name} · gap ${format(info.gap)} · ${info.trend}`
}

function getPairByIds(pair: Pair): [Line, Line] | null {
  const a = state.lines.find((line) => line.id === pair[0])
  const b = state.lines.find((line) => line.id === pair[1])
  return a && b ? [a, b] : null
}

function makeDemoLines(): Line[] {
  const ids = [['xqc', 'xQc'], ['jynxzi', 'Jynxzi'], ['burnt', 'TheBurntPeanut'], ['hasan', 'HasanAbi'], ['faux', 'fauxty']] as const
  return ids.map(([id, name], lineIndex) => ({
    id,
    name,
    color: palette[lineIndex],
    points: Array.from({ length: 49 }, (_, index) => {
      const value = Math.max(0, Math.round(30000 + lineIndex * 9000 + Math.sin(index / (3 + lineIndex)) * 16000 + (lineIndex < 2 ? 120000 + index * (lineIndex === 0 ? 1200 : 900) : index * 900)))
      const pointState: ObservedState = lineIndex === 3 && index === 17 ? 'not_observed' : lineIndex === 4 && index === 31 ? 'missing' : lineIndex === 2 && index < 2 ? 'offline' : 'observed'
      return { value: pointState === 'missing' || pointState === 'not_observed' ? null : pointState === 'offline' ? 0 : value, state: pointState, time: defaultTime(index) }
    }),
  }))
}
function getPair(): [Line, Line] | null { return getPairByIds(state.pair) }
function pairInfo(pair: [Line, Line], index: number) { const a = renderValue(pair[0], index); const b = renderValue(pair[1], index); const old = Math.abs(renderValue(pair[0], Math.max(0, index - 1)) - renderValue(pair[1], Math.max(0, index - 1))); const gap = Math.abs(a - b); return { gap, delta: gap - old, trend: gap - old <= 0 ? 'Closing' : 'Widening', leader: a >= b ? pair[0] : pair[1] } }
function renderValue(line: Line, index: number): number { const point = line.points[index]; if (!point || point.value === null || point.state === 'missing' || point.state === 'not_observed') return 0; if (state.metric === 'indexed') return point.value / Math.max(...line.points.map((item) => item.value ?? 0), 1) * 100; return point.value }
function canDraw(point: Point | undefined): boolean { return Boolean(point && point.value !== null && point.state !== 'missing' && point.state !== 'not_observed') }
function pointText(point: Point | undefined): string { if (!point) return 'missing'; if (point.state === 'missing') return 'missing'; if (point.state === 'not_observed') return 'not observed'; if (point.state === 'offline') return 'offline / 0'; return format(point.value ?? 0) }
function observedLabel(point: Point | undefined): string { if (!point) return 'missing'; return point.state === 'observed' ? 'observed' : point.state.replace('_', ' ') }
function coverageSummary(): { status: string; short: string; note: string } { const points = state.lines.flatMap((line) => line.points); const gaps = points.filter((point) => point.state === 'missing' || point.state === 'not_observed').length; const offline = points.filter((point) => point.state === 'offline').length; return { status: gaps > 0 ? `Observed gaps ${gaps}` : 'Observed complete', short: gaps > 0 ? `${gaps} gaps` : 'complete', note: `Partial data · observed channels only.${gaps > 0 ? ` ${gaps} missing/not-observed samples are not connected as real lines.` : ''}${offline > 0 ? ` ${offline} offline samples are treated as 0.` : ''}` } }
function ticks(max: number): number[] { return state.metric === 'indexed' ? [0, 25, 50, 75, 100] : [0, max * .25, max * .5, max * .75, max] }
function title(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1) }
function format(value: number): string { return Math.round(value).toLocaleString('en-US') }
function compact(value: number): string { return Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)) }
function signed(value: number): string { const rounded = Math.round(value); return `${rounded >= 0 ? '+' : ''}${rounded.toLocaleString('en-US')}` }
function nice(value: number): number { const magnitude = 10 ** Math.floor(Math.log10(value)); return Math.ceil(value / magnitude) * magnitude }
function time(index: number): string { return state.lines[0]?.points[index]?.time ?? defaultTime(index) }
function defaultTime(index: number): string { const minute = index * 30; return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}` }
function normalizeTimeLabel(raw: unknown, index: number): string { const value = String(raw ?? defaultTime(index)); const match = /(\d{2}:\d{2})/.exec(value); return match?.[1] ?? value }
function parseTimeToMinutes(value: string): number | null { const match = /(\d{2}):(\d{2})/.exec(value); return match ? Number(match[1]) * 60 + Number(match[2]) : null }
function displayName(value: unknown, lines: Line[]): string { const id = resolveLineId(value, lines); return lines.find((line) => line.id === id)?.name ?? String(value ?? '') }
function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)) }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function setText(selector: string, value: string): void { const el = document.querySelector(selector); if (el) el.textContent = value }
