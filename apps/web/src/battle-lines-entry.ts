import './styles.css'
import './battle-lines.css'

type Metric = 'viewers' | 'indexed'
type Line = { id: string; name: string; color: string; values: number[] }
type Pair = [string, string]

type State = {
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
let state: State = { metric: 'viewers', top: 5, bucket: '5m', mode: 'recommended', selected: 36, pair: ['xqc', 'jynxzi'], lines: makeLines() }

app.innerHTML = renderPage()
bind()
render()
void loadApi()

async function loadApi(): Promise<void> {
  try {
    const response = await fetch(`/api/battle-lines?top=${state.top}&bucket=${state.bucket}&metric=${state.metric}`, { cache: 'no-store' })
    if (!response.ok) return
    const payload = await response.json() as unknown
    const lines = normalize(payload)
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
      <section class="bl-hero"><div><div class="eyebrow">${site} / Compare</div><h1>Battle Lines</h1><p>Compare live audience lines, reversals, and closing gaps.</p></div><button class="bl-icon">⇧</button></section>
      <section class="bl-controls">${segment('top', ['Top 3', 'Top 5', 'Top 10'], `Top ${state.top}`)}${segment('metric', ['Viewers', 'Indexed'], title(state.metric))}${segment('bucket', ['1m', '5m', '10m'], state.bucket)}<button class="bl-refresh" data-refresh>Refresh</button></section>
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

function render(): void {
  const pair = getPair()
  if (!pair) return
  const info = pairInfo(pair)
  setText('[data-status-top]', String(state.top))
  setText('[data-status-metric]', title(state.metric))
  setText('[data-status-bucket]', state.bucket)
  const summary = document.querySelector<HTMLElement>('[data-summary]')
  if (summary) summary.innerHTML = `<div><span>Recommended</span><h2>${pair[0].name} vs ${pair[1].name}</h2><p>${info.trend} gap · ${format(info.gap)}</p></div><strong>Gap ${format(info.gap)}</strong><strong>${info.trend} ${signed(info.delta)}</strong><strong>Latest reversal 00:40</strong><strong>Fastest challenger Jynxzi</strong>`
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
  const w = 1200, h = 520, left = 70, right = 110, top = 38, bottom = 54
  const plotW = w - left - right, plotH = h - top - bottom
  const x = (i: number) => left + (plotW * i) / Math.max(1, lines[0].values.length - 1)
  const y = (line: Line, i: number) => top + plotH - (plotH * value(line, i)) / max
  const path = (line: Line) => line.values.map((_, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(line, i).toFixed(1)}`).join(' ')
  const band = `${pair[0].values.map((_, i) => `${x(i)},${y(pair[0], i)}`).join(' ')} ${pair[1].values.map((_, i) => `${x(i)},${y(pair[1], i)}`).reverse().join(' ')}`
  host.innerHTML = `<svg viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="18" fill="#07101d"/>${ticks(max).map((t) => `<line x1="${left}" x2="${w - right}" y1="${top + plotH - plotH * t / max}" y2="${top + plotH - plotH * t / max}" stroke="rgba(148,163,184,.16)"/><text x="${left - 12}" y="${top + plotH - plotH * t / max + 4}" text-anchor="end" fill="#9fb0ca" font-size="13">${state.metric === 'indexed' ? Math.round(t) : compact(t)}</text>`).join('')}<polygon points="${band}" fill="rgba(96,165,250,.12)"/>${lines.filter((l) => !state.pair.includes(l.id)).map((l) => `<path d="${path(l)}" fill="none" stroke="${l.color}" stroke-width="2" opacity=".28"/>`).join('')}<path d="${path(pair[0])}" fill="none" stroke="${pair[0].color}" stroke-width="4"/><path d="${path(pair[1])}" fill="none" stroke="${pair[1].color}" stroke-width="4"/><line x1="${x(state.selected)}" x2="${x(state.selected)}" y1="${top}" y2="${h - bottom}" stroke="rgba(255,255,255,.84)"/><text x="${x(state.selected)}" y="${top - 12}" text-anchor="middle" fill="#eef4ff">${time(state.selected)}</text></svg>`
  host.querySelector('svg')?.addEventListener('click', (event) => {
    const rect = host.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, ((event.clientX - rect.left) / rect.width - left / w) / (plotW / w)))
    state = { ...state, mode: 'inspect', selected: Math.round(ratio * (lines[0].values.length - 1)) }
    render()
  })
}

function renderInspector(pair: [Line, Line], info: { gap: number; delta: number; trend: string; leader: Line }): void {
  const el = document.querySelector<HTMLElement>('[data-inspector]')
  if (!el) return
  const a = pair[0].values[state.selected]
  const b = pair[1].values[state.selected]
  const prev = Math.max(0, state.selected - 1)
  el.innerHTML = `<div><span>Selected time</span><strong>${time(state.selected)}</strong><button data-live>Jump to live</button></div><div><span>Pair</span><strong>${pair[0].name} vs ${pair[1].name}</strong><small>Leader · ${info.leader.name}</small></div><div><span>Gap</span><strong>${format(info.gap)}</strong></div><div><span>Trend</span><strong>${info.trend}</strong><small>${signed(info.delta)}</small></div><div><span>Viewers</span><p>${pair[0].name}<b>${format(a)}</b></p><p>${pair[1].name}<b>${format(b)}</b></p></div><div><span>Change</span><p>${pair[0].name}<b>${signed(a - pair[0].values[prev])}</b></p><p>${pair[1].name}<b>${signed(b - pair[1].values[prev])}</b></p></div>`
  el.querySelector('[data-live]')?.addEventListener('click', () => { state = { ...state, mode: 'recommended', selected: state.lines[0].values.length - 1 }; render() })
}

function renderLists(): void {
  const rev = document.querySelector<HTMLElement>('[data-reversals]')
  if (rev) rev.innerHTML = `<h2>Latest Reversals</h2><div><button>00:40 HasanAbi passed TheBurntPeanut</button><button>00:35 HasanAbi passed fauxty</button><button>00:10 TheBurntPeanut passed xQc</button></div>`
  const sec = document.querySelector<HTMLElement>('[data-secondary]')
  if (sec) sec.innerHTML = `<h2>Secondary Battles</h2><div><button data-pair="burnt:xqc">TheBurntPeanut vs xQc</button><button data-pair="jynxzi:burnt">Jynxzi vs TheBurntPeanut</button></div>`
  sec?.querySelectorAll<HTMLButtonElement>('[data-pair]').forEach((b) => b.addEventListener('click', () => { const [a, c] = String(b.dataset.pair).split(':') as Pair; state = { ...state, mode: 'custom', pair: [a, c] }; render() }))
  const feed = document.querySelector<HTMLElement>('[data-feed]')
  if (feed) feed.innerHTML = `<h2>Battle Feed</h2><p>01:30 Jynxzi gained +9,212 viewers</p><p>01:15 xQc lost -6,231 viewers</p><p>00:40 HasanAbi passed TheBurntPeanut</p>`
}

function normalize(payload: unknown): Line[] {
  if (!record(payload)) return []
  const raw = Array.isArray(payload.lines) ? payload.lines : Array.isArray(payload.series) ? payload.series : []
  return raw.slice(0, 10).map((item, i): Line | null => {
    if (!record(item)) return null
    const values = (Array.isArray(item.points) ? item.points : Array.isArray(item.values) ? item.values : []).map((p) => typeof p === 'number' ? p : record(p) && typeof (p.viewers ?? p.value ?? p.y) === 'number' ? Number(p.viewers ?? p.value ?? p.y) : 0)
    if (values.length < 2) return null
    const id = slug(String(item.id ?? item.streamerId ?? item.login ?? item.displayName ?? `line-${i}`))
    const name = String(item.name ?? item.displayName ?? item.login ?? id)
    return { id, name, color: palette[i % palette.length], values }
  }).filter((line): line is Line => line !== null)
}

function makeLines(): Line[] {
  const ids = [['xqc', 'xQc'], ['jynxzi', 'Jynxzi'], ['burnt', 'TheBurntPeanut'], ['hasan', 'HasanAbi'], ['faux', 'fauxty']] as const
  return ids.map(([id, name], lineIndex) => ({ id, name, color: palette[lineIndex], values: Array.from({ length: 49 }, (_, i) => Math.max(0, Math.round(30000 + lineIndex * 9000 + Math.sin(i / (3 + lineIndex)) * 16000 + (lineIndex < 2 ? 120000 + i * (lineIndex === 0 ? 1200 : 900) : i * 900)))) }))
}
function segment(group: string, values: string[], selected: string): string { return `<div class="bl-seg" data-group="${group}">${values.map((v) => `<button class="${v === selected ? 'on' : ''}" data-value="${v}">${v}</button>`).join('')}</div>` }
function getPair(): [Line, Line] | null { const a = state.lines.find((l) => l.id === state.pair[0]); const b = state.lines.find((l) => l.id === state.pair[1]); return a && b ? [a, b] : null }
function pairInfo(pair: [Line, Line]) { const a = pair[0].values[state.selected]; const b = pair[1].values[state.selected]; const old = Math.abs(pair[0].values[Math.max(0, state.selected - 1)] - pair[1].values[Math.max(0, state.selected - 1)]); const gap = Math.abs(a - b); return { gap, delta: gap - old, trend: gap - old <= 0 ? 'Closing' : 'Widening', leader: a >= b ? pair[0] : pair[1] } }
function value(line: Line, index: number): number { return state.metric === 'indexed' ? line.values[index] / Math.max(...line.values, 1) * 100 : line.values[index] }
function ticks(max: number): number[] { return state.metric === 'indexed' ? [0, 25, 50, 75, 100] : [0, max * .25, max * .5, max * .75, max] }
function title(v: string): string { return v.charAt(0).toUpperCase() + v.slice(1) }
function format(v: number): string { return Math.round(v).toLocaleString('en-US') }
function compact(v: number): string { return Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)) }
function signed(v: number): string { const n = Math.round(v); return `${n >= 0 ? '+' : ''}${n.toLocaleString('en-US')}` }
function nice(v: number): number { const m = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / m) * m }
function time(i: number): string { const m = i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` }
function slug(v: string): string { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function record(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null }
function setText(selector: string, value: string): void { const el = document.querySelector(selector); if (el) el.textContent = value }
