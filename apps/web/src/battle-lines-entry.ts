import './styles.css'
import './battle-lines.css'

type Metric = 'viewers' | 'indexed'
type Line = { id: string; name: string; color: string; values: number[] }
type Pair = [string, string]
type BattleEvent = { time: string; index: number; label: string; pair: Pair }
type BattleState = {
  metric: Metric
  top: 3 | 5 | 10
  bucket: '1m' | '5m' | '10m'
  mode: 'recommended' | 'custom' | 'inspect'
  selected: number
  pair: Pair
  lines: Line[]
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const site = document.body.dataset.page?.startsWith('kick') ? 'kick' : 'twitch'
const palette = ['#3b82f6', '#a855f7', '#64748b', '#5eead4', '#94a3b8']
const reversals: BattleEvent[] = [
  { time: '00:40', index: 1, label: 'HasanAbi passed TheBurntPeanut', pair: ['hasan', 'burnt'] },
  { time: '00:35', index: 1, label: 'HasanAbi passed fauxty', pair: ['hasan', 'faux'] },
  { time: '00:10', index: 0, label: 'TheBurntPeanut passed xQc', pair: ['burnt', 'xqc'] },
]
const secondaryPairs: Pair[] = [['burnt', 'xqc'], ['jynxzi', 'burnt'], ['hasan', 'faux']]

let state: BattleState = {
  metric: 'viewers',
  top: 5,
  bucket: '5m',
  mode: 'recommended',
  selected: 36,
  pair: ['xqc', 'jynxzi'],
  lines: makeLines(),
}

app.innerHTML = renderPage()
bind()
render()
void loadApi()

async function loadApi(): Promise<void> {
  try {
    const response = await fetch(`/api/battle-lines?top=${state.top}&bucket=${state.bucket}&metric=${state.metric}`, { cache: 'no-store' })
    if (!response.ok) return
    const lines = normalize((await response.json()) as unknown)
    if (lines.length >= 2) {
      state = { ...state, lines, selected: Math.min(state.selected, lines[0].values.length - 1) }
      render()
    }
  } catch {
    render()
  }
}

function renderPage(): string {
  return `<div class="page-shell page-shell--site theme-${site} bl-page">
    <header class="site-header"><a class="brand" href="/">ViewLoom</a><nav class="site-nav"><a class="nav-link" href="/">Portal</a><a class="nav-link ${site === 'twitch' ? 'is-current' : ''}" href="/twitch/">Twitch</a><a class="nav-link ${site === 'kick' ? 'is-current' : ''}" href="/kick/">Kick</a></nav><div class="header-note">${title(site)} ViewLoom</div></header>
    <main class="page-main bl-main">
      <section class="bl-hero"><div><div class="eyebrow">${site} / Compare</div><h1>Battle Lines</h1><p>Compare live audience lines, reversals, and closing gaps.</p></div><button class="bl-icon" type="button">⇧</button></section>
      <section class="bl-controls">${segment('top', ['Top 3', 'Top 5', 'Top 10'], `Top ${state.top}`)}${segment('metric', ['Viewers', 'Indexed'], title(state.metric))}${segment('bucket', ['1m', '5m', '10m'], state.bucket)}<button class="bl-refresh" data-refresh type="button">Refresh</button></section>
      <div class="bl-status">API · Partial · Top <span data-status-top></span> · <span data-status-metric></span> · <span data-status-bucket></span> · Updated live</div>
      <section class="bl-summary" data-summary></section>
      <section class="bl-chart-card"><div class="bl-chart-head"><h2>Battle Lines</h2><div data-legend></div></div><div class="bl-chart" data-chart></div><section class="bl-inspector" data-inspector></section></section>
      <section class="bl-section" data-reversals></section>
      <section class="bl-section" data-secondary></section>
      <section class="bl-section" data-feed></section>
      <div class="bl-note">Partial data · observed channels only.</div>
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
  const pair = getPair()
  if (!pair) return
  const info = pairInfo(pair, state.selected)
  setText('[data-status-top]', String(state.top))
  setText('[data-status-metric]', title(state.metric))
  setText('[data-status-bucket]', state.bucket)
  const summary = document.querySelector<HTMLElement>('[data-summary]')
  if (summary) summary.innerHTML = `<div><span>${state.mode === 'inspect' ? 'Inspecting' : state.mode === 'custom' ? 'Custom' : 'Recommended'}</span><h2>${pair[0].name} vs ${pair[1].name}</h2><p>${info.trend} gap · ${format(info.gap)}</p></div><strong>Gap ${format(info.gap)}</strong><strong>${info.trend} ${signed(info.delta)}</strong><strong>Latest reversal ${reversals[0].time}</strong><strong>Fastest challenger Jynxzi</strong>`
  const legend = document.querySelector<HTMLElement>('[data-legend]')
  if (legend) legend.innerHTML = `<span style="--c:${pair[0].color}">${pair[0].name}</span><span style="--c:${pair[1].color}">${pair[1].name}</span><span style="--c:#64748b">Other battles</span>`
  renderChart(pair)
  renderInspector(pair, info)
  renderLists()
}

function renderChart(pair: [Line, Line]): void {
  const host = document.querySelector<HTMLElement>('[data-chart]')
  if (!host) return
  const lines = state.lines.slice(0, state.top)
  const max = state.metric === 'indexed' ? 100 : nice(Math.max(...lines.flatMap((line) => line.values), 1))
  const w = 1200
  const h = 520
  const left = 70
  const right = 122
  const top = 42
  const bottom = 62
  const plotW = w - left - right
  const plotH = h - top - bottom
  const x = (index: number) => left + (plotW * index) / Math.max(1, lines[0].values.length - 1)
  const y = (line: Line, index: number) => top + plotH - (plotH * value(line, index)) / max
  const path = (line: Line) => line.values.map((_, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(line, index).toFixed(1)}`).join(' ')
  const band = `${pair[0].values.map((_, index) => `${x(index)},${y(pair[0], index)}`).join(' ')} ${pair[1].values.map((_, index) => `${x(index)},${y(pair[1], index)}`).reverse().join(' ')}`
  const nowX = x(lines[0].values.length - 1)
  const selectedX = x(state.selected)
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Battle Lines chart"><rect width="${w}" height="${h}" rx="18" fill="#07101d"/>${ticks(max).map((tick) => `<line x1="${left}" x2="${w - right}" y1="${top + plotH - plotH * tick / max}" y2="${top + plotH - plotH * tick / max}" stroke="rgba(148,163,184,.16)"/><text x="${left - 12}" y="${top + plotH - plotH * tick / max + 4}" text-anchor="end" fill="#9fb0ca" font-size="13">${state.metric === 'indexed' ? Math.round(tick) : compact(tick)}</text>`).join('')}${['00:00', '06:00', '12:00', '18:00', '24:00'].map((label, index) => `<text x="${left + plotW * index / 4}" y="${h - 20}" text-anchor="middle" fill="#9fb0ca" font-size="13">${label}</text>`).join('')}<polygon points="${band}" fill="rgba(96,165,250,.12)"/>${lines.filter((line) => !state.pair.includes(line.id)).map((line) => `<path d="${path(line)}" fill="none" stroke="${line.color}" stroke-width="2" opacity=".28"/>`).join('')}<path d="${path(pair[0])}" fill="none" stroke="${pair[0].color}" stroke-width="4"/><path d="${path(pair[1])}" fill="none" stroke="${pair[1].color}" stroke-width="4"/><line x1="${nowX}" x2="${nowX}" y1="${top}" y2="${h - bottom}" stroke="rgba(255,255,255,.5)" stroke-dasharray="5 6"/><text x="${nowX + 8}" y="${top + 15}" fill="#cbd5e1" font-size="12">Now</text><line x1="${selectedX}" x2="${selectedX}" y1="${top}" y2="${h - bottom}" stroke="rgba(255,255,255,.84)"/><rect x="${selectedX - 28}" y="${top - 34}" width="56" height="24" rx="8" fill="rgba(15,23,42,.94)" stroke="rgba(255,255,255,.18)"/><text x="${selectedX}" y="${top - 17}" text-anchor="middle" fill="#eef4ff" font-size="12">${time(state.selected)}</text>${endpoint(pair[0], x, y)}${endpoint(pair[1], x, y)}</svg>`
  host.querySelector('svg')?.addEventListener('click', (event) => {
    const rect = host.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width - left / w) / (plotW / w)))
    state = { ...state, mode: 'inspect', selected: Math.round(ratio * (lines[0].values.length - 1)) }
    render()
  })
}

function endpoint(line: Line, x: (index: number) => number, y: (line: Line, index: number) => number): string {
  const index = line.values.length - 1
  const px = x(index)
  const py = y(line, index)
  return `<circle cx="${px}" cy="${py}" r="5" fill="${line.color}"/><rect x="${px + 10}" y="${py - 20}" width="96" height="40" rx="8" fill="rgba(15,23,42,.92)" stroke="${line.color}"/><text x="${px + 18}" y="${py - 4}" fill="${line.color}" font-size="12">${line.name}</text><text x="${px + 18}" y="${py + 12}" fill="#eef4ff" font-size="12">${format(line.values[index])}</text>`
}

function renderInspector(pair: [Line, Line], info: { gap: number; delta: number; trend: string; leader: Line }): void {
  const el = document.querySelector<HTMLElement>('[data-inspector]')
  if (!el) return
  const a = pair[0].values[state.selected]
  const b = pair[1].values[state.selected]
  const prev = Math.max(0, state.selected - 1)
  el.innerHTML = `<div><span>Selected time</span><strong>${time(state.selected)}</strong><small>${state.mode === 'inspect' ? 'Inspecting history' : 'Live mode'}</small><button data-live type="button">Jump to live</button></div><div><span>Pair</span><strong>${pair[0].name} vs ${pair[1].name}</strong><small>Leader · ${info.leader.name}</small></div><div><span>Gap</span><strong>${format(info.gap)}</strong></div><div><span>Trend</span><strong>${info.trend}</strong><small>${signed(info.delta)}</small></div><div><span>Viewers</span><p>${pair[0].name}<b>${format(a)}</b></p><p>${pair[1].name}<b>${format(b)}</b></p></div><div><span>Change</span><p>${pair[0].name}<b>${signed(a - pair[0].values[prev])}</b></p><p>${pair[1].name}<b>${signed(b - pair[1].values[prev])}</b></p></div>`
  el.querySelector('[data-live]')?.addEventListener('click', () => { state = { ...state, mode: 'recommended', selected: state.lines[0].values.length - 1 }; render() })
}

function renderLists(): void {
  const rev = document.querySelector<HTMLElement>('[data-reversals]')
  if (rev) rev.innerHTML = `<h2>Latest Reversals</h2><div>${reversals.map((event, index) => `<button type="button" data-reversal="${index}"><span>${event.time}</span> ${event.label}</button>`).join('')}</div>`
  rev?.querySelectorAll<HTMLButtonElement>('[data-reversal]').forEach((button) => button.addEventListener('click', () => {
    const event = reversals[Number(button.dataset.reversal)]
    state = { ...state, mode: 'inspect', selected: event.index, pair: event.pair }
    render()
  }))
  const sec = document.querySelector<HTMLElement>('[data-secondary]')
  if (sec) sec.innerHTML = `<h2>Secondary Battles</h2><div>${secondaryPairs.map((pair) => `<button type="button" data-pair="${pair[0]}:${pair[1]}">${pairLabel(pair)}</button>`).join('')}</div>`
  sec?.querySelectorAll<HTMLButtonElement>('[data-pair]').forEach((button) => button.addEventListener('click', () => {
    const [a, b] = String(button.dataset.pair).split(':') as Pair
    state = { ...state, mode: 'custom', pair: [a, b] }
    render()
  }))
  const feed = document.querySelector<HTMLElement>('[data-feed]')
  if (feed) feed.innerHTML = `<h2>Battle Feed</h2><p>01:30 Jynxzi gained +9,212 viewers</p><p>01:15 xQc lost -6,231 viewers</p><p>00:40 HasanAbi passed TheBurntPeanut</p>`
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

function normalize(payload: unknown): Line[] {
  if (!record(payload)) return []
  const raw = Array.isArray(payload.lines) ? payload.lines : Array.isArray(payload.series) ? payload.series : []
  return raw.slice(0, 10).map((item, index): Line | null => {
    if (!record(item)) return null
    const values = (Array.isArray(item.points) ? item.points : Array.isArray(item.values) ? item.values : []).map((point) => typeof point === 'number' ? point : record(point) && typeof (point.viewers ?? point.value ?? point.y) === 'number' ? Number(point.viewers ?? point.value ?? point.y) : 0)
    if (values.length < 2) return null
    const id = slug(String(item.id ?? item.streamerId ?? item.login ?? item.displayName ?? `line-${index}`))
    const name = String(item.name ?? item.displayName ?? item.login ?? id)
    return { id, name, color: palette[index % palette.length], values }
  }).filter((line): line is Line => line !== null)
}

function makeLines(): Line[] {
  const ids = [['xqc', 'xQc'], ['jynxzi', 'Jynxzi'], ['burnt', 'TheBurntPeanut'], ['hasan', 'HasanAbi'], ['faux', 'fauxty']] as const
  return ids.map(([id, name], lineIndex) => ({ id, name, color: palette[lineIndex], values: Array.from({ length: 49 }, (_, index) => Math.max(0, Math.round(30000 + lineIndex * 9000 + Math.sin(index / (3 + lineIndex)) * 16000 + (lineIndex < 2 ? 120000 + index * (lineIndex === 0 ? 1200 : 900) : index * 900)))) }))
}
function getPair(): [Line, Line] | null { return getPairByIds(state.pair) }
function pairInfo(pair: [Line, Line], index: number) { const a = pair[0].values[index]; const b = pair[1].values[index]; const old = Math.abs(pair[0].values[Math.max(0, index - 1)] - pair[1].values[Math.max(0, index - 1)]); const gap = Math.abs(a - b); return { gap, delta: gap - old, trend: gap - old <= 0 ? 'Closing' : 'Widening', leader: a >= b ? pair[0] : pair[1] } }
function value(line: Line, index: number): number { return state.metric === 'indexed' ? line.values[index] / Math.max(...line.values, 1) * 100 : line.values[index] }
function ticks(max: number): number[] { return state.metric === 'indexed' ? [0, 25, 50, 75, 100] : [0, max * .25, max * .5, max * .75, max] }
function title(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1) }
function format(value: number): string { return Math.round(value).toLocaleString('en-US') }
function compact(value: number): string { return Math.abs(value) >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)) }
function signed(value: number): string { const rounded = Math.round(value); return `${rounded >= 0 ? '+' : ''}${rounded.toLocaleString('en-US')}` }
function nice(value: number): number { const magnitude = 10 ** Math.floor(Math.log10(value)); return Math.ceil(value / magnitude) * magnitude }
function time(index: number): string { const minute = index * 30; return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}` }
function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function setText(selector: string, value: string): void { const el = document.querySelector(selector); if (el) el.textContent = value }
