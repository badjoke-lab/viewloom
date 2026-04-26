import '../styles.css'

type RangeMode = 'today' | 'rolling24h' | 'yesterday' | 'date'
type MetricMode = 'volume' | 'share'
type ScopeMode = 'full' | 'topFocus'
type TopN = 10 | 20 | 50
type BucketSize = 5 | 10

type DayFlowBandBucket = {
  viewers: number
  share: number
  activity?: number
  activityAvailable?: boolean
  peak?: boolean
  rise?: boolean
}

type DayFlowBand = {
  streamerId: string
  name: string
  title?: string
  url?: string
  color?: string
  isOthers?: boolean
  totalViewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  peakShare?: number
  biggestRiseBucket?: string | null
  firstSeen?: string | null
  lastSeen?: string | null
  buckets: DayFlowBandBucket[]
}

type DayFlowPayload = {
  ok: true
  source: 'api' | 'demo'
  state: string
  status: string
  note?: string
  coverageNote?: string
  partialNote?: string
  lastUpdated: string
  selectedDate: string
  bucketSize: BucketSize
  topN: TopN
  valueMode?: MetricMode
  rangeMode: RangeMode
  windowStart: string
  windowEnd: string
  isRolling?: boolean
  summary?: {
    peakLeader?: string
    longestDominance?: string
    highestActivity?: string
    biggestRise?: string
  }
  buckets: string[]
  totalViewersByBucket: number[]
  bands: DayFlowBand[]
  focusSnapshot?: {
    highestActivity?: string
  }
  detailPanelSource?: {
    defaultStreamerId: string | null
    streamers: Array<{
      streamerId: string
      name: string
      title: string
      url: string
      peakViewers: number
      avgViewers: number
      viewerMinutes: number
      peakShare: number
      biggestRiseTime: string | null
      firstSeen: string | null
      lastSeen: string | null
    }>
  }
  activity?: {
    available: boolean
    note: string
  }
}

type ViewState = {
  rangeMode: RangeMode
  selectedDate: string
  topN: TopN
  metric: MetricMode
  scope: ScopeMode
  bucketSize: BucketSize
  selectedBucketIndex: number
  selectedStreamerId: string | null
  dimOthers: boolean
  autoUpdate: boolean
}

type ViewModel = {
  payload: DayFlowPayload
  topBands: DayFlowBand[]
  others: DayFlowBand | null
  visibleBands: DayFlowBand[]
  visibleStart: number
  visibleEnd: number
  selectedIndex: number
  observedTotal: number[]
  topTotal: number[]
  yMax: number
  shareBasis: 'global' | 'topN'
}

type Geometry = {
  left: number
  top: number
  width: number
  height: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

const numberFmt = new Intl.NumberFormat('en-US')
const compactFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const pctFmt = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })

const palette = [
  '#7DD3FC', '#A78BFA', '#F0ABFC', '#F9A8D4', '#FDBA74',
  '#BEF264', '#5EEAD4', '#93C5FD', '#C4B5FD', '#FCA5A5',
  '#67E8F9', '#86EFAC', '#FDE68A', '#D8B4FE', '#99F6E4',
  '#BFDBFE', '#FBCFE8', '#FED7AA', '#A7F3D0', '#DDD6FE',
]

let state = readInitialState()
let payload: DayFlowPayload | null = null
let view: ViewModel | null = null
let redrawChart: (() => void) | null = null
let autoTimer = 0

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function isoTimeLabel(iso: string | null | undefined): string {
  return iso ? iso.slice(11, 16) : 'N/A'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeRange(value: unknown): RangeMode {
  return value === 'rolling24h' || value === 'yesterday' || value === 'date' ? value : 'today'
}

function normalizeMetric(value: unknown): MetricMode {
  return value === 'share' ? 'share' : 'volume'
}

function normalizeScope(value: unknown): ScopeMode {
  return value === 'topFocus' || value === 'top-focus' ? 'topFocus' : 'full'
}

function normalizeTop(value: unknown): TopN {
  const n = Number(value)
  if (n === 10 || n === 50) return n
  return 20
}

function normalizeBucket(value: unknown): BucketSize {
  return Number(value) === 10 ? 10 : 5
}

function readInitialState(): ViewState {
  const params = new URL(window.location.href).searchParams
  const storedAuto = window.localStorage.getItem('viewloom.twitch.dayflow.autoUpdate')
  return {
    rangeMode: normalizeRange(params.get('day') ?? params.get('rangeMode')),
    selectedDate: params.get('date') ?? todayIso(),
    topN: normalizeTop(params.get('top')),
    metric: normalizeMetric(params.get('metric') ?? params.get('mode')),
    scope: normalizeScope(params.get('scope')),
    bucketSize: normalizeBucket(params.get('bucket')),
    selectedBucketIndex: -1,
    selectedStreamerId: null,
    dimOthers: false,
    autoUpdate: storedAuto === null ? true : storedAuto === 'true',
  }
}

function updateUrl(): void {
  const url = new URL(window.location.href)
  url.searchParams.set('day', state.rangeMode)
  url.searchParams.set('rangeMode', state.rangeMode)
  if (state.rangeMode === 'date') url.searchParams.set('date', state.selectedDate)
  else url.searchParams.delete('date')
  url.searchParams.set('top', String(state.topN))
  url.searchParams.set('metric', state.metric)
  url.searchParams.set('mode', state.metric)
  url.searchParams.set('scope', state.scope)
  url.searchParams.set('bucket', String(state.bucketSize))
  url.searchParams.set('layout', 'wide')
  window.history.replaceState({}, '', url)
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function colorForBand(band: DayFlowBand, rank: number): string {
  if (band.isOthers) return '#475569'
  const key = band.streamerId || band.name || String(rank)
  return palette[(hashString(key) + rank * 3) % palette.length]
}

function withPalette(bands: DayFlowBand[]): DayFlowBand[] {
  return bands.map((band, index) => ({ ...band, color: colorForBand(band, index) }))
}

function observedEnd(source: DayFlowPayload): number {
  for (let i = source.buckets.length - 1; i >= 0; i -= 1) {
    if ((source.totalViewersByBucket[i] ?? 0) > 0) return i
  }
  return Math.max(0, source.buckets.length - 1)
}

function topTotal(topBands: DayFlowBand[], count: number): number[] {
  return Array.from({ length: count }, (_, bucketIndex) => topBands.reduce((sum, band) => sum + (band.buckets[bucketIndex]?.viewers ?? 0), 0))
}

function buildViewModel(source: DayFlowPayload): ViewModel {
  const colored = withPalette(source.bands ?? [])
  const topBands = colored.filter((band) => !band.isOthers)
  const others = colored.find((band) => band.isOthers) ?? null
  const end = source.rangeMode === 'today' ? observedEnd(source) : Math.max(0, source.buckets.length - 1)
  const top = topTotal(topBands, source.buckets.length)
  const observed = source.totalViewersByBucket.map((value) => Math.max(0, value ?? 0))
  const selected = clamp(state.selectedBucketIndex >= 0 ? state.selectedBucketIndex : end, 0, end)
  let yMax = 1
  let shareBasis: 'global' | 'topN' = 'global'

  if (state.metric === 'volume') {
    yMax = Math.max(1, ...(state.scope === 'topFocus' ? top : observed).slice(0, end + 1))
  } else if (state.scope === 'topFocus') {
    shareBasis = 'topN'
  }

  return {
    payload: source,
    topBands,
    others,
    visibleBands: topBands,
    visibleStart: 0,
    visibleEnd: end,
    selectedIndex: selected,
    observedTotal: observed,
    topTotal: top,
    yMax,
    shareBasis,
  }
}

function valueForBand(band: DayFlowBand, bucketIndex: number, model: ViewModel): number {
  const bucket = band.buckets[bucketIndex]
  if (!bucket) return 0
  if (state.metric === 'volume') return Math.max(0, bucket.viewers)
  if (state.scope === 'topFocus') return Math.max(0, bucket.viewers) / Math.max(1, model.topTotal[bucketIndex] ?? 0)
  return Math.max(0, bucket.share)
}

function renderHeader(): string {
  return `
    <header class="site-header">
      <a class="brand" href="/">ViewLoom</a>
      <nav class="site-nav" aria-label="Primary">
        <a class="nav-link" href="/">Portal</a>
        <a class="nav-link is-current" href="/twitch/">Twitch</a>
        <a class="nav-link" href="/kick/">Kick</a>
      </nav>
      <div class="header-note">Unofficial live observation UI</div>
    </header>
  `
}

function renderHero(statusTitle = 'Waiting for Day Flow API', statusBody = 'The chart will switch to real Twitch day-flow data once the API responds.'): string {
  return `
    <section class="hero hero--site hero--feature">
      <div>
        <div class="eyebrow">Twitch / Today</div>
        <h1>Day Flow</h1>
        <p class="hero-copy">Read the daily audience landscape as a single terrain, with Full context and Top Focus as separate scopes.</p>
      </div>
      <aside class="status-panel">
        <div class="status-panel__label">Live day-flow</div>
        <div class="status-panel__title">${escapeHtml(statusTitle)}</div>
        <p>${escapeHtml(statusBody)}</p>
      </aside>
    </section>
  `
}

function renderSubnav(): string {
  return `
    <div class="site-subnav" aria-label="Site sections">
      <a class="subnav-link" href="/twitch/heatmap/">Heatmap</a>
      <a class="subnav-link is-current" href="/twitch/day-flow/">Day Flow</a>
      <a class="subnav-link" href="/twitch/battle-lines/">Battle Lines</a>
    </div>
  `
}

function renderControls(): string {
  return `
    <form id="dayflow-controls" class="df-controls">
      <label>Range<select name="day"><option value="today" ${state.rangeMode === 'today' ? 'selected' : ''}>Today</option><option value="rolling24h" ${state.rangeMode === 'rolling24h' ? 'selected' : ''}>Rolling 24h</option><option value="yesterday" ${state.rangeMode === 'yesterday' ? 'selected' : ''}>Yesterday</option><option value="date" ${state.rangeMode === 'date' ? 'selected' : ''}>Date</option></select></label>
      <label>Date<input name="date" type="date" value="${escapeHtml(state.selectedDate)}" /></label>
      <label>Top<select name="top"><option value="10" ${state.topN === 10 ? 'selected' : ''}>Top 10</option><option value="20" ${state.topN === 20 ? 'selected' : ''}>Top 20</option><option value="50" ${state.topN === 50 ? 'selected' : ''}>Top 50</option></select></label>
      <label>Metric<select name="metric"><option value="volume" ${state.metric === 'volume' ? 'selected' : ''}>Volume</option><option value="share" ${state.metric === 'share' ? 'selected' : ''}>Share</option></select></label>
      <label>Scope<select name="scope"><option value="full" ${state.scope === 'full' ? 'selected' : ''}>Full</option><option value="topFocus" ${state.scope === 'topFocus' ? 'selected' : ''}>Top Focus</option></select></label>
      <label>Bucket<select name="bucket"><option value="5" ${state.bucketSize === 5 ? 'selected' : ''}>5m</option><option value="10" ${state.bucketSize === 10 ? 'selected' : ''}>10m</option></select></label>
      <label>Layout<select name="layout"><option selected>Wide</option><option disabled>Split later</option></select></label>
      <label class="df-checkbox"><input type="checkbox" name="autoUpdate" ${state.autoUpdate ? 'checked' : ''} /> Auto update</label>
      <button type="submit" class="button button--secondary">Refresh</button>
    </form>
  `
}

function scopeNote(): string {
  if (state.scope === 'topFocus') {
    return state.metric === 'share'
      ? 'Top Focus excludes Others from chart scale. Share is within selected Top N, not global share.'
      : 'Top Focus excludes Others from chart scale to compare top streams. Use Full for observed total context.'
  }
  return 'Full keeps Others as low-emphasis observed context so the full-day total remains visible.'
}

function renderSummary(source: DayFlowPayload, model: ViewModel): string {
  return `
    <section class="summary-grid df-summary">
      <article class="summary-card"><div class="summary-card__label">Source</div><div class="summary-card__value">${escapeHtml(source.source)}</div><p>${escapeHtml(source.status)}</p></article>
      <article class="summary-card"><div class="summary-card__label">Observed peak</div><div class="summary-card__value">${compactFmt.format(Math.max(0, ...model.observedTotal))}</div><p>${escapeHtml(source.coverageNote ?? 'Observed day-flow coverage')}</p></article>
      <article class="summary-card"><div class="summary-card__label">Scope</div><div class="summary-card__value">${state.scope === 'topFocus' ? 'Top Focus' : 'Full'}</div><p>${escapeHtml(scopeNote())}</p></article>
    </section>
  `
}

function renderFrame(source: DayFlowPayload, model: ViewModel): string {
  return `
    ${renderSummary(source, model)}
    <section class="df-layout">
      <article class="chart-stage df-main">
        <div class="df-main-head">
          <div>
            <div class="chart-stage__label">${state.scope === 'topFocus' ? 'Top Focus' : 'Full'} · ${state.metric === 'share' ? 'Share' : 'Volume'}</div>
            <h2>${source.rangeMode === 'rolling24h' ? 'Rolling 24h landscape' : source.rangeMode === 'yesterday' ? 'Yesterday landscape' : source.rangeMode === 'date' ? 'Selected day landscape' : 'Today landscape'}</h2>
            <p>${escapeHtml(scopeNote())}</p>
          </div>
          <div class="df-pills">
            <span><strong>Range</strong> ${source.isRolling ? `${isoTimeLabel(source.windowStart)} → ${isoTimeLabel(source.windowEnd)} UTC` : escapeHtml(source.selectedDate)}</span>
            <span><strong>Top</strong> ${source.topN}</span>
            <span><strong>Bucket</strong> ${source.bucketSize}m</span>
            <span><strong>Updated</strong> ${isoTimeLabel(source.lastUpdated)} UTC</span>
          </div>
        </div>
        <div class="df-chart-wrap"><canvas id="dayflow-canvas" class="df-canvas" aria-label="Twitch Day Flow chart"></canvas><div id="dayflow-loading" class="df-loading" hidden>Updating…</div></div>
        <div class="df-time"><span>Time selection</span><input id="dayflow-time" type="range" min="${model.visibleStart}" max="${model.visibleEnd}" value="${model.selectedIndex}" step="1" /></div>
        <section id="dayflow-focus-mobile" class="rail-card df-mobile-focus"></section>
        <button id="dayflow-open-sheet" type="button" class="button button--secondary df-open-sheet">Open detail</button>
      </article>
      <aside class="rail-stack df-rail">
        <section class="rail-card"><div class="rail-card__label">Time Focus</div><div id="dayflow-focus"></div></section>
        <section class="rail-card"><div id="dayflow-detail"></div></section>
      </aside>
    </section>
    <section class="support-grid support-grid--feature">
      <article class="support-card"><div class="support-card__label">Live coverage</div><h2>What partial means</h2><p>${escapeHtml(source.partialNote ?? source.note ?? 'Today shows the observed collection window, not a synthetic full-day fill.')}</p></article>
      <article class="support-card"><div class="support-card__label">Activity</div><h2>${source.activity?.available ? 'Activity available' : 'Activity unavailable'}</h2><p>${escapeHtml(source.activity?.note ?? 'Activity unavailable is expected in the current MVP feed.')}</p></article>
      <article class="support-card"><div class="support-card__label">Mode</div><h2>${model.shareBasis === 'topN' ? 'Top N share' : 'Global share'}</h2><p>${model.shareBasis === 'topN' ? 'Top Focus Share is relative to selected Top N only.' : 'Full Share is relative to the observed total including Others.'}</p></article>
    </section>
    <dialog id="dayflow-sheet" class="df-sheet"><section class="rail-card"><div id="dayflow-detail-mobile"></div></section></dialog>
  `
}

function renderFocus(model: ViewModel): string {
  const rows = model.topBands
    .map((band) => {
      const bucket = band.buckets[model.selectedIndex]
      const prev = band.buckets[Math.max(0, model.selectedIndex - 1)]
      const viewers = bucket?.viewers ?? 0
      const share = state.scope === 'topFocus'
        ? viewers / Math.max(1, model.topTotal[model.selectedIndex] ?? 0)
        : bucket?.share ?? 0
      return { band, viewers, share, momentum: viewers - (prev?.viewers ?? 0) }
    })
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 5)
  const maxViewers = Math.max(1, ...rows.map((row) => row.viewers))
  const momentum = [...rows].sort((a, b) => b.momentum - a.momentum)[0]
  const activity = model.payload.activity?.available ? model.payload.focusSnapshot?.highestActivity ?? 'N/A' : 'Activity unavailable'

  return `
    <div class="df-focus-head"><span>Selected</span><strong>${isoTimeLabel(model.payload.buckets[model.selectedIndex])} UTC</strong><small>${model.shareBasis === 'topN' ? 'Top N share' : 'Global share'}</small></div>
    <div class="df-focus-list">
      ${rows.map((row, index) => `
        <button type="button" class="df-focus-row" data-streamer-id="${escapeHtml(row.band.streamerId)}">
          <span>#${index + 1}</span><i style="--band:${row.band.color}"></i><b>${escapeHtml(row.band.name)}</b>
          <em><span style="width:${Math.round((row.viewers / maxViewers) * 100)}%"></span></em>
          <strong>${numberFmt.format(row.viewers)}</strong><small>${pctFmt.format(row.share)}${index === 0 && rows[1] ? ` · +${numberFmt.format(row.viewers - rows[1].viewers)} vs #2` : ''}</small>
        </button>
      `).join('')}
    </div>
    <div class="df-focus-meta"><span>Strongest momentum <strong>${escapeHtml(momentum?.band.name ?? 'N/A')}</strong></span><span>Highest activity <strong>${escapeHtml(activity)}</strong></span></div>
  `
}

function renderDetail(model: ViewModel, mobile = false): string {
  const id = state.selectedStreamerId ?? model.payload.detailPanelSource?.defaultStreamerId
  const detail = model.payload.detailPanelSource?.streamers.find((item) => item.streamerId === id)
  if (!detail) return `<h2>Selected Stream</h2><p>Select a band to inspect stream details.</p>`
  const band = model.topBands.find((item) => item.streamerId === detail.streamerId)
  return `
    <div class="df-detail-head"><div class="rail-card__label">Selected Stream</div>${band ? `<i style="--band:${band.color}"></i>` : ''}</div>
    <h2>${escapeHtml(detail.name)}</h2>
    <p class="df-detail-title">${escapeHtml(detail.title || 'No title')}</p>
    <div class="df-kv"><div><span>Window peak viewers</span><strong>${numberFmt.format(detail.peakViewers)}</strong></div><div><span>Avg viewers</span><strong>${numberFmt.format(detail.avgViewers)}</strong></div><div><span>Viewer-minutes</span><strong>${numberFmt.format(detail.viewerMinutes)}</strong></div><div><span>Peak share</span><strong>${pctFmt.format(detail.peakShare)}</strong></div><div><span>Biggest rise time</span><strong>${isoTimeLabel(detail.biggestRiseTime)}</strong></div><div><span>First / Last seen</span><strong>${isoTimeLabel(detail.firstSeen)} / ${isoTimeLabel(detail.lastSeen)}</strong></div></div>
    <div class="hero-actions df-actions">${mobile ? '' : `<button type="button" class="button button--secondary" data-action="dim">${state.dimOthers ? 'Dim others: on' : 'Dim others: off'}</button>`}<a class="button button--secondary" href="${escapeHtml(detail.url)}" target="_blank" rel="noreferrer">Open stream</a>${mobile ? `<button type="button" class="button button--secondary" data-action="close-sheet">Close</button>` : ''}</div>
  `
}

function geom(width: number, height: number): Geometry {
  const mobile = width < 680
  const left = mobile ? 34 : 46
  const top = mobile ? 14 : 18
  return { left, top, width: Math.max(1, width - left - 14), height: Math.max(1, height - top - (mobile ? 28 : 34)) }
}

function yFor(value: number, model: ViewModel, geometry: Geometry): number {
  return geometry.top + geometry.height - (value / Math.max(1, model.yMax)) * geometry.height
}

function valueFor(band: DayFlowBand, bucketIndex: number, model: ViewModel): number {
  return valueForBand(band, bucketIndex, model)
}

function drawChart(): void {
  if (!view) return
  const canvas = document.querySelector<HTMLCanvasElement>('#dayflow-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const geometry = geom(width, height)
  const count = Math.max(1, view.visibleEnd - view.visibleStart + 1)
  const barW = Math.max(1, geometry.width / count + 0.8)

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#07101D'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.10)'
  for (let i = 0; i <= 4; i += 1) {
    const y = geometry.top + (geometry.height / 4) * i
    ctx.beginPath(); ctx.moveTo(geometry.left, y); ctx.lineTo(geometry.left + geometry.width, y); ctx.stroke()
  }
  for (let i = 0; i <= 6; i += 1) {
    const x = geometry.left + (geometry.width / 6) * i
    ctx.beginPath(); ctx.moveTo(x, geometry.top); ctx.lineTo(x, geometry.top + geometry.height); ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.16)'
  ctx.strokeRect(geometry.left, geometry.top, geometry.width, geometry.height)

  if (state.scope === 'full') {
    ctx.save()
    ctx.globalAlpha = 0.22
    ctx.fillStyle = '#475569'
    for (let i = view.visibleStart; i <= view.visibleEnd; i += 1) {
      const local = i - view.visibleStart
      const x = geometry.left + (local / count) * geometry.width
      const v = state.metric === 'share' ? 1 : view.observedTotal[i] ?? 0
      const y = yFor(v, view, geometry)
      ctx.fillRect(x, y, barW, geometry.top + geometry.height - y)
    }
    ctx.restore()
  }

  const cumulative = new Array<number>(view.payload.buckets.length).fill(0)
  view.visibleBands.forEach((band, bandIndex) => {
    const selected = state.selectedStreamerId === band.streamerId
    const dimmed = state.selectedStreamerId && !selected
    ctx.save()
    ctx.globalAlpha = dimmed ? (state.dimOthers ? 0.18 : 0.38) : state.scope === 'topFocus' ? 0.86 : 0.72
    ctx.fillStyle = band.color ?? palette[bandIndex % palette.length]
    for (let i = view!.visibleStart; i <= view!.visibleEnd; i += 1) {
      const local = i - view!.visibleStart
      const x = geometry.left + (local / count) * geometry.width
      const lower = cumulative[i] ?? 0
      const upper = lower + valueFor(band, i, view!)
      const y = yFor(upper, view!, geometry)
      const h = yFor(lower, view!, geometry) - y
      if (h > 0.25) ctx.fillRect(x, y, barW, h)
      cumulative[i] = upper
    }
    ctx.restore()
  })

  const sx = geometry.left + ((view.selectedIndex - view.visibleStart) / Math.max(1, view.visibleEnd - view.visibleStart)) * geometry.width
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.82)'
  ctx.beginPath(); ctx.moveTo(sx, geometry.top); ctx.lineTo(sx, geometry.top + geometry.height); ctx.stroke()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
  ctx.fillRect(sx + 6, geometry.top + 8, 56, 20)
  ctx.fillStyle = '#E2E8F0'
  ctx.font = '12px ui-sans-serif, system-ui'
  ctx.fillText(isoTimeLabel(view.payload.buckets[view.selectedIndex]), sx + 10, geometry.top + 22)
  ctx.fillStyle = 'rgba(203, 213, 225, 0.72)'
  ctx.fillText(state.metric === 'share' ? (view.shareBasis === 'topN' ? 'Top N share' : 'Global share') : 'Volume', 8, 17)
  ctx.fillText(isoTimeLabel(view.payload.buckets[view.visibleStart]), geometry.left, height - 9)
  ctx.fillText(isoTimeLabel(view.payload.buckets[view.visibleEnd]), Math.max(geometry.left, width - 58), height - 9)
}

function pickFromCanvas(event: PointerEvent): void {
  if (!view) return
  const canvas = document.querySelector<HTMLCanvasElement>('#dayflow-canvas')
  const slider = document.querySelector<HTMLInputElement>('#dayflow-time')
  if (!canvas || !slider) return
  const rect = canvas.getBoundingClientRect()
  const geometry = geom(rect.width, rect.height)
  const x = clamp(event.clientX - rect.left, geometry.left, geometry.left + geometry.width)
  const y = clamp(event.clientY - rect.top, geometry.top, geometry.top + geometry.height)
  const ratioX = (x - geometry.left) / Math.max(1, geometry.width)
  const bucketIndex = clamp(Math.round(ratioX * Math.max(1, view.visibleEnd - view.visibleStart)), view.visibleStart, view.visibleEnd)
  const valueAtPointer = ((geometry.top + geometry.height - y) / Math.max(1, geometry.height)) * view.yMax
  let acc = 0
  let picked: DayFlowBand | null = null
  for (const band of view.visibleBands) {
    const next = acc + valueFor(band, bucketIndex, view)
    if (valueAtPointer >= acc && valueAtPointer <= next) {
      picked = band
      break
    }
    acc = next
  }
  state.selectedBucketIndex = bucketIndex
  if (picked) state.selectedStreamerId = picked.streamerId
  slider.value = String(bucketIndex)
  rebuildViewOnly()
}

function renderPanels(): void {
  if (!view) return
  const focus = document.querySelector<HTMLElement>('#dayflow-focus')
  const focusMobile = document.querySelector<HTMLElement>('#dayflow-focus-mobile')
  const detail = document.querySelector<HTMLElement>('#dayflow-detail')
  const detailMobile = document.querySelector<HTMLElement>('#dayflow-detail-mobile')
  const focusHtml = renderFocus(view)
  if (focus) focus.innerHTML = focusHtml
  if (focusMobile) focusMobile.innerHTML = `<div class="rail-card__label">Time Focus</div>${focusHtml}`
  if (detail) detail.innerHTML = renderDetail(view)
  if (detailMobile) detailMobile.innerHTML = renderDetail(view, true)
}

function rebuildViewOnly(): void {
  if (!payload) return
  view = buildViewModel(payload)
  state.selectedBucketIndex = view.selectedIndex
  renderPanels()
  drawChart()
}

function mountInteractions(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('#dayflow-canvas')
  const slider = document.querySelector<HTMLInputElement>('#dayflow-time')
  const sheet = document.querySelector<HTMLDialogElement>('#dayflow-sheet')
  const openSheet = document.querySelector<HTMLButtonElement>('#dayflow-open-sheet')
  canvas?.addEventListener('pointerdown', pickFromCanvas)
  slider?.addEventListener('input', () => {
    state.selectedBucketIndex = Number(slider.value)
    rebuildViewOnly()
  })
  document.querySelectorAll<HTMLElement>('[data-streamer-id]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedStreamerId = row.dataset.streamerId ?? null
      rebuildViewOnly()
    })
  })
  document.querySelectorAll<HTMLElement>('[data-action="dim"]').forEach((button) => button.addEventListener('click', () => {
    state.dimOthers = !state.dimOthers
    rebuildViewOnly()
  }))
  document.querySelectorAll<HTMLElement>('[data-action="close-sheet"]').forEach((button) => button.addEventListener('click', () => sheet?.close()))
  openSheet?.addEventListener('click', () => {
    renderPanels()
    if (sheet && !sheet.open) sheet.showModal()
  })
  window.addEventListener('resize', () => drawChart(), { passive: true })
  redrawChart = drawChart
}

function readControls(form: HTMLFormElement): void {
  const data = new FormData(form)
  state = {
    ...state,
    rangeMode: normalizeRange(data.get('day')),
    selectedDate: String(data.get('date') || todayIso()),
    topN: normalizeTop(data.get('top')),
    metric: normalizeMetric(data.get('metric')),
    scope: normalizeScope(data.get('scope')),
    bucketSize: normalizeBucket(data.get('bucket')),
    autoUpdate: data.get('autoUpdate') === 'on',
  }
  window.localStorage.setItem('viewloom.twitch.dayflow.autoUpdate', String(state.autoUpdate))
}

async function loadData(quiet = false): Promise<void> {
  const loading = document.querySelector<HTMLElement>('#dayflow-loading')
  if (loading && quiet) loading.hidden = false
  const url = new URL('/api/day-flow', window.location.origin)
  url.searchParams.set('day', state.rangeMode)
  url.searchParams.set('rangeMode', state.rangeMode)
  if (state.rangeMode === 'date') url.searchParams.set('date', state.selectedDate)
  url.searchParams.set('top', String(state.topN))
  url.searchParams.set('mode', state.metric)
  url.searchParams.set('metric', state.metric)
  url.searchParams.set('bucket', String(state.bucketSize))

  const response = await fetch(url.toString(), { headers: { accept: 'application/json' }, cache: 'no-store' })
  if (!response.ok) throw new Error(`day-flow api returned ${response.status}`)
  payload = await response.json() as DayFlowPayload
  view = buildViewModel(payload)
  state.selectedBucketIndex = view.selectedIndex
  state.selectedStreamerId ??= payload.detailPanelSource?.defaultStreamerId ?? view.topBands[0]?.streamerId ?? null
  updateUrl()
  renderApp(payload, view)
  if (loading) loading.hidden = true
}

function renderApp(source?: DayFlowPayload, model?: ViewModel): void {
  app.innerHTML = `
    <div class="page-shell page-shell--site theme-twitch">
      ${renderHeader()}
      <main class="page-main">
        ${renderHero(source ? `${source.status} · ${source.source}` : undefined, source ? `${isoTimeLabel(source.lastUpdated)} UTC · ${source.coverageNote ?? 'Twitch Day Flow data loaded.'}` : undefined)}
        ${renderSubnav()}
        ${renderControls()}
        <section id="dayflow-root">${source && model ? renderFrame(source, model) : `<section class="chart-stage"><h2>Loading Day Flow…</h2><p>Waiting for the Twitch day-flow API.</p></section>`}</section>
      </main>
    </div>
  `
  if (source && model) {
    mountInteractions()
    renderPanels()
    drawChart()
  }
}

function wireRoot(): void {
  app.addEventListener('submit', (event) => {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || form.id !== 'dayflow-controls') return
    event.preventDefault()
    readControls(form)
    void loadData(true)
  })

  app.addEventListener('change', (event) => {
    const target = event.target
    const form = target instanceof Element ? target.closest<HTMLFormElement>('#dayflow-controls') : null
    if (!form) return
    readControls(form)
    void loadData(true)
  })

  autoTimer = window.setInterval(() => {
    if (state.autoUpdate && state.rangeMode === 'today' && document.visibilityState === 'visible') void loadData(true)
  }, 60_000)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') redrawChart?.()
  })
}

function installStyles(): void {
  const style = document.createElement('style')
  style.textContent = `
    .df-controls{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0;align-items:end}.df-controls label{display:grid;gap:6px;color:var(--muted);font-size:.78rem}.df-controls select,.df-controls input[type=date]{min-height:38px;border:1px solid rgba(122,162,255,.18);border-radius:14px;background:rgba(7,16,29,.92);color:var(--text);padding:0 10px}.df-checkbox{display:flex!important;align-items:center;grid-auto-flow:column;min-height:38px}.df-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,390px);gap:18px;margin-top:18px}.df-main{padding:22px}.df-main-head{display:flex;justify-content:space-between;gap:16px;margin-bottom:16px}.df-main-head h2{margin:.25rem 0}.df-main-head p{color:var(--muted);line-height:1.6}.df-pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.df-pills span{border:1px solid rgba(122,162,255,.14);background:rgba(7,16,29,.58);border-radius:999px;padding:7px 10px;color:var(--muted);font-size:.76rem}.df-pills strong{color:var(--text);margin-right:4px}.df-chart-wrap{position:relative;min-height:520px;border-radius:18px;overflow:hidden;border:1px solid rgba(122,162,255,.12);background:#07101d}.df-canvas{width:100%;height:520px;display:block;cursor:crosshair;touch-action:pan-y}.df-loading{position:absolute;right:12px;top:12px;z-index:2;border:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.86);border-radius:999px;padding:8px 10px}.df-time{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;margin-top:12px;color:var(--muted)}.df-time input{width:100%}.df-focus-head{display:grid;gap:3px;margin-bottom:12px}.df-focus-head span,.df-focus-head small{color:var(--muted)}.df-focus-list{display:grid;gap:8px}.df-focus-row{display:grid;grid-template-columns:30px 10px minmax(0,1fr) minmax(56px,.42fr) auto;gap:8px;align-items:center;border:1px solid rgba(122,162,255,.12);background:rgba(7,16,29,.42);color:var(--text);border-radius:14px;padding:9px;text-align:left;width:100%}.df-focus-row i,.df-detail-head i{width:10px;height:10px;border-radius:999px;background:var(--band);box-shadow:0 0 16px var(--band)}.df-focus-row b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.df-focus-row em{height:7px;border-radius:999px;background:rgba(148,163,184,.16);overflow:hidden}.df-focus-row em span{display:block;height:100%;border-radius:999px;background:rgba(125,211,252,.72)}.df-focus-row small{grid-column:3/-1;color:var(--muted)}.df-focus-meta{display:grid;gap:6px;margin-top:12px;color:var(--muted);font-size:.86rem}.df-detail-head{display:flex;justify-content:space-between;align-items:center}.df-detail-title{color:var(--muted);line-height:1.6;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.df-kv{display:grid;gap:8px;margin-top:12px}.df-kv div{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(122,162,255,.12);padding-top:8px}.df-kv span{color:var(--muted)}.df-actions{margin-top:14px}.df-mobile-focus,.df-open-sheet{display:none}.df-sheet{width:min(94vw,560px);border:0;padding:0;background:transparent;color:var(--text)}.df-sheet::backdrop{background:rgba(0,0,0,.58)}@media(max-width:980px){.df-layout{grid-template-columns:1fr}.df-main-head{display:grid}.df-pills{justify-content:flex-start}.df-chart-wrap{min-height:380px}.df-canvas{height:380px}}@media(max-width:640px){.df-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.df-controls .button{grid-column:1/-1}.df-chart-wrap{min-height:300px}.df-canvas{height:300px}.df-rail{display:none}.df-mobile-focus,.df-open-sheet{display:block;margin-top:12px}.df-time{grid-template-columns:1fr}.df-focus-row{grid-template-columns:28px 10px minmax(0,1fr) auto}.df-focus-row em{grid-column:3/-1}.summary-grid.df-summary{grid-template-columns:1fr}}
  `
  document.head.appendChild(style)
}

installStyles()
renderApp()
wireRoot()
void loadData().catch((error) => {
  app.innerHTML = `<div class="page-shell page-shell--site theme-twitch">${renderHeader()}<main class="page-main">${renderHero('Day Flow API error', error instanceof Error ? error.message : 'Unknown error')}<section class="chart-stage"><h2>Day Flow unavailable</h2><p>Check the API path and deployed functions.</p></section></main></div>`
})

window.addEventListener('beforeunload', () => window.clearInterval(autoTimer))
