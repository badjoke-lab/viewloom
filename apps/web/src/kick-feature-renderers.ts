type HeatmapItem = {
  id: string
  name: string
  title?: string
  viewers: number
  url?: string
}

type HeatmapPayload = {
  state?: string
  status?: string
  updatedAt?: string
  coverageNote?: string
  notes?: string[]
  items?: HeatmapItem[]
}

type DayFlowBand = {
  streamerId: string
  name: string
  title?: string
  url?: string
  totalViewerMinutes: number
  peakViewers: number
  avgViewers?: number
  peakShare?: number
}

type DayFlowPayload = {
  state?: string
  status?: string
  coverageNote?: string
  partialNote?: string
  lastUpdated?: string
  selectedDate?: string
  bands?: DayFlowBand[]
  buckets?: string[]
  totalViewersByBucket?: number[]
}

type BattleLine = {
  streamerId: string
  name: string
  title?: string
  url?: string
  viewerMinutes: number
  peakViewers: number
}

type Battle = {
  id: string
  streamerAName?: string
  streamerBName?: string
  streamerAId: string
  streamerBId: string
  score: number
  overlapCount: number
  longestRun: number
  reversalCount: number
}

type BattlePayload = {
  state?: string
  status?: string
  updatedAt?: string
  notes?: string[]
  lines?: BattleLine[]
  primaryBattle?: Battle
  recommendedBattle?: Battle
  secondaryBattles?: Battle[]
  events?: Array<{ title?: string; score?: number; overlapCount?: number; reversalCount?: number }>
}

const page = document.body.dataset.page || ''

if (page === 'kick-heatmap') void renderKickHeatmap()
if (page === 'kick-day-flow') void renderKickDayFlow()
if (page === 'kick-battle-lines') void renderKickBattleLines()

async function renderKickHeatmap(): Promise<void> {
  const payload = await readJson<HeatmapPayload>('/api/kick-heatmap')
  const items = (payload.items || []).filter((item) => item.viewers > 0)
  const total = items.reduce((sum, item) => sum + item.viewers, 0)
  replaceSummary([
    ['Streams', String(items.length), 'Normalized Kick streams in the latest observed snapshot.'],
    ['Viewers', formatNumber(total), 'Total viewers from the latest Kick snapshot.'],
    ['State', payload.state || payload.status || 'unknown', payload.coverageNote || 'Kick heatmap API loaded.'],
  ])
  replaceChart('Now', 'Live Kick heatmap', payload.coverageNote || 'Latest observed Kick snapshot.', renderHeatmapTiles(items, total))
  replaceRail([
    ['Selected stream', items[0]?.name || 'No stream selected', items[0] ? `${formatNumber(items[0].viewers)} viewers · ${items[0].title || 'No title'}` : 'No live Kick rows available.'],
    ['Snapshot', payload.updatedAt || 'Unknown update time', (payload.notes || []).join(' · ') || 'No notes returned.'],
  ])
}

async function renderKickDayFlow(): Promise<void> {
  const payload = await readJson<DayFlowPayload>('/api/kick-day-flow')
  const bands = (payload.bands || []).filter((band) => band.totalViewerMinutes > 0)
  const total = bands.reduce((sum, band) => sum + band.totalViewerMinutes, 0)
  const top = bands[0]
  replaceSummary([
    ['Viewer-minutes', formatNumber(total), 'Observed audience volume for the selected Kick window.'],
    ['Top streamer', top?.name || 'None', top ? `${formatNumber(top.totalViewerMinutes)} viewer-minutes.` : 'No observed band yet.'],
    ['Coverage', payload.state || payload.status || 'unknown', payload.partialNote || payload.coverageNote || 'Kick Day Flow API loaded.'],
  ])
  replaceChart('Today', 'Kick Day Flow bands', payload.coverageNote || 'Observed Kick Day Flow window.', renderBandBars(bands, 'totalViewerMinutes'))
  replaceRail([
    ['Time focus', payload.selectedDate || 'Selected date unavailable', payload.partialNote || 'Kick Day Flow detail loaded.'],
    ['Observed buckets', `${observedBucketCount(payload.totalViewersByBucket)} / ${(payload.buckets || []).length}`, 'Only observed buckets are rendered as real values.'],
  ])
}

async function renderKickBattleLines(): Promise<void> {
  const payload = await readJson<BattlePayload>('/api/kick-battle-lines')
  const lines = (payload.lines || []).filter((line) => line.peakViewers > 0)
  const battle = payload.primaryBattle || payload.recommendedBattle
  replaceSummary([
    ['Lines', String(lines.length), 'Kick lines with observed viewer samples.'],
    ['Primary battle', battle ? battleTitle(battle) : 'None', battle ? `Score ${battle.score}, overlap ${battle.overlapCount}.` : 'No recommended battle yet.'],
    ['State', payload.state || payload.status || 'unknown', (payload.notes || [])[0] || 'Kick Battle Lines API loaded.'],
  ])
  replaceChart('Rivalry', 'Kick Battle Lines', (payload.notes || [])[0] || 'Observed Kick rivalry lines.', renderBattlePanel(lines, battle, payload.secondaryBattles || []))
  replaceRail([
    ['Current battle', battle ? battleTitle(battle) : 'No battle', battle ? `Longest run ${battle.longestRun} · reversals ${battle.reversalCount}` : 'No recommended battle returned.'],
    ['Feed', `${(payload.events || []).length} events`, (payload.events || []).slice(0, 2).map((event) => event.title).filter(Boolean).join(' · ') || 'No feed events.'],
  ])
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`${url} failed: ${response.status}`)
  return await response.json() as T
}

function replaceSummary(cards: Array<[string, string, string]>): void {
  const node = document.querySelector<HTMLElement>('.summary-grid')
  if (!node) return
  node.innerHTML = cards.map(([label, value, body]) => `<article class="summary-card"><div class="summary-card__label">${esc(label)}</div><div class="summary-card__value">${esc(value)}</div><p>${esc(body)}</p></article>`).join('')
}

function replaceChart(label: string, title: string, body: string, content: string): void {
  const node = document.querySelector<HTMLElement>('.chart-stage--feature')
  if (!node) return
  node.innerHTML = `<div class="chart-stage__label">${esc(label)}</div><h2>${esc(title)}</h2><p>${esc(body)}</p>${content}`
}

function replaceRail(cards: Array<[string, string, string]>): void {
  const node = document.querySelector<HTMLElement>('.rail-stack')
  if (!node) return
  node.innerHTML = cards.map(([label, title, body]) => `<section class="rail-card rail-card--detail"><div class="rail-card__label">${esc(label)}</div><h2>${esc(title)}</h2><p>${esc(body)}</p></section>`).join('')
}

function renderHeatmapTiles(items: HeatmapItem[], total: number): string {
  if (items.length === 0) return emptyBox('No Kick heatmap items returned.')
  return `<div class="kick-live-heatmap">${items.map((item) => {
    const share = total > 0 ? item.viewers / total : 0
    const size = Math.max(140, Math.round(220 + share * 520))
    return `<a class="kick-live-tile" style="min-height:${size}px;flex-basis:${size}px" href="${escAttr(item.url || '#')}"><span>${esc(item.name)}</span><strong>${formatNumber(item.viewers)}</strong><em>${esc(item.title || '')}</em></a>`
  }).join('')}</div>${styleBlock()}`
}

function renderBandBars(bands: DayFlowBand[], key: 'totalViewerMinutes'): string {
  if (bands.length === 0) return emptyBox('No Kick Day Flow bands returned.')
  const max = Math.max(...bands.map((band) => band[key]), 1)
  return `<div class="kick-live-bars">${bands.map((band) => `<article class="kick-live-bar"><div><strong>${esc(band.name)}</strong><span>${formatNumber(band.totalViewerMinutes)} viewer-minutes · ${formatNumber(band.peakViewers)} peak</span></div><div class="kick-live-bar__track"><i style="width:${Math.max(4, Math.round((band[key] / max) * 100))}%"></i></div></article>`).join('')}</div>${styleBlock()}`
}

function renderBattlePanel(lines: BattleLine[], battle: Battle | undefined, secondary: Battle[]): string {
  if (lines.length === 0) return emptyBox('No Kick Battle Lines returned.')
  return `<div class="kick-battle-live"><section class="kick-battle-live__primary"><span>Recommended battle</span><strong>${esc(battle ? battleTitle(battle) : 'None')}</strong><p>${battle ? `Score ${battle.score} · overlap ${battle.overlapCount} · reversals ${battle.reversalCount}` : 'No battle returned.'}</p></section><div class="kick-live-bars">${lines.map((line) => `<article class="kick-live-bar"><div><strong>${esc(line.name)}</strong><span>${formatNumber(line.viewerMinutes)} viewer-minutes · ${formatNumber(line.peakViewers)} peak</span></div><div class="kick-live-bar__track"><i style="width:${Math.max(4, Math.round((line.peakViewers / Math.max(...lines.map((item) => item.peakViewers), 1)) * 100))}%"></i></div></article>`).join('')}</div><div class="kick-battle-live__secondary">${secondary.slice(0, 3).map((item) => `<span>${esc(battleTitle(item))} · score ${item.score}</span>`).join('')}</div></div>${styleBlock()}`
}

function emptyBox(message: string): string {
  return `<div class="kick-live-empty">${esc(message)}</div>${styleBlock()}`
}

function styleBlock(): string {
  if (document.getElementById('kick-feature-renderer-style')) return ''
  const style = document.createElement('style')
  style.id = 'kick-feature-renderer-style'
  style.textContent = `
    .kick-live-heatmap { display:flex; flex-wrap:wrap; gap:14px; margin-top:22px; min-height:320px; }
    .kick-live-tile { display:flex; flex-direction:column; justify-content:flex-end; gap:8px; flex:1 1 220px; padding:18px; border:1px solid rgba(52,211,153,.28); border-radius:20px; color:var(--text); text-decoration:none; background:linear-gradient(180deg, rgba(34,197,94,.46), rgba(6,95,70,.16)); box-shadow: inset 0 1px 0 rgba(255,255,255,.05); }
    .kick-live-tile span { color:#34d399; font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; }
    .kick-live-tile strong { font-size:clamp(1.5rem,4vw,3.2rem); }
    .kick-live-tile em { color:var(--muted); font-style:normal; line-height:1.4; }
    .kick-live-bars { display:grid; gap:14px; margin-top:22px; }
    .kick-live-bar { padding:14px; border:1px solid rgba(52,211,153,.20); border-radius:16px; background:rgba(15,23,42,.46); }
    .kick-live-bar strong { display:block; margin-bottom:4px; }
    .kick-live-bar span { color:var(--muted); font-size:.92rem; }
    .kick-live-bar__track { height:10px; margin-top:12px; border-radius:999px; background:rgba(148,163,184,.13); overflow:hidden; }
    .kick-live-bar__track i { display:block; height:100%; border-radius:999px; background:linear-gradient(90deg, #22c55e, #a7f3d0); }
    .kick-battle-live { display:grid; gap:18px; margin-top:22px; }
    .kick-battle-live__primary { padding:18px; border:1px solid rgba(52,211,153,.26); border-radius:18px; background:linear-gradient(135deg, rgba(20,83,45,.42), rgba(15,23,42,.48)); }
    .kick-battle-live__primary span { color:#34d399; font-size:.78rem; letter-spacing:.08em; text-transform:uppercase; }
    .kick-battle-live__primary strong { display:block; margin-top:8px; font-size:1.35rem; }
    .kick-battle-live__secondary { display:flex; flex-wrap:wrap; gap:8px; }
    .kick-battle-live__secondary span { padding:7px 10px; border-radius:999px; background:rgba(15,23,42,.7); border:1px solid rgba(148,163,184,.18); color:var(--muted); }
    .kick-live-empty { margin-top:22px; padding:28px; border:1px dashed rgba(148,163,184,.24); border-radius:18px; color:var(--muted); }
  `
  document.head.appendChild(style)
  return ''
}

function observedBucketCount(values?: number[]): number {
  return (values || []).filter((value) => value > 0).length
}

function battleTitle(battle: Battle): string {
  return `${battle.streamerAName || battle.streamerAId} vs ${battle.streamerBName || battle.streamerBId}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: value >= 1000000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}

function esc(value: string): string {
  const span = document.createElement('span')
  span.textContent = value
  return span.innerHTML
}

function escAttr(value: string): string {
  return esc(value).replace(/"/g, '&quot;')
}
