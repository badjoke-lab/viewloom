type DayFlowBand = {
  streamerId?: string
  name?: string
  title?: string
  url?: string
  totalViewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  peakShare?: number
  buckets?: Array<{ viewers?: number; share?: number; peak?: boolean; rise?: boolean }>
}

type DayFlowPayload = {
  source?: string
  platform?: string
  state?: string
  status?: string
  lastUpdated?: string
  updatedAt?: string
  coverageNote?: string
  partialNote?: string
  bucketSize?: number
  topN?: number
  valueMode?: string
  rangeMode?: string
  buckets?: string[]
  totalViewersByBucket?: number[]
  bands?: DayFlowBand[]
  detailPanelSource?: { defaultStreamerId?: string | null; streamers?: DayFlowBand[] }
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const state = { metric: 'volume', top: 20, bucket: 5 }

void hydrateDayFlow()
wireControls()

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = button.dataset.dayflowMetric === 'share' ? 'share' : 'volume'
      markActive('[data-dayflow-metric]', button)
      void hydrateDayFlow()
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-top]').forEach((button) => {
    button.addEventListener('click', () => {
      const parsed = Number(button.dataset.dayflowTop)
      state.top = Number.isFinite(parsed) ? parsed : 20
      markActive('[data-dayflow-top]', button)
      void hydrateDayFlow()
    })
  })
  document.querySelector<HTMLElement>('[data-dayflow-refresh]')?.addEventListener('click', () => { void hydrateDayFlow() })
}

async function hydrateDayFlow(): Promise<void> {
  renderLoading()
  try {
    const url = `${endpoint}?metric=${encodeURIComponent(state.metric)}&top=${state.top}&bucket=${state.bucket}`
    const response = await fetch(url, { headers: { accept: 'application/json' }, cache: 'no-store' })
    if (!response.ok) throw new Error(`day flow api returned ${response.status}`)
    const payload = await response.json() as DayFlowPayload
    renderFacts(payload)
    renderStrip(payload)
    renderChart(payload)
    renderInspector(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function renderLoading(): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (stage) stage.innerHTML = '<div class="notice">Loading Day Flow from observed snapshots…</div>'
}

function renderFacts(payload: DayFlowPayload): void {
  const values = [
    label(payload.state ?? payload.status ?? 'unknown'),
    label(payload.valueMode ?? state.metric),
    label(payload.rangeMode ?? 'today'),
    `${payload.bucketSize ?? state.bucket} minutes`,
  ]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderStrip(payload: DayFlowPayload): void {
  const cells = document.querySelectorAll<HTMLElement>('.data-strip__cell')
  const values = [
    time(payload.lastUpdated ?? payload.updatedAt),
    `${payload.bands?.filter((band) => !band.name?.toLowerCase().includes('others')).length ?? 0} streams`,
    `${payload.buckets?.length ?? 0} buckets`,
    label(payload.source ?? 'api'),
  ]
  cells.forEach((cell, index) => {
    const labelNode = cell.querySelector('small')?.outerHTML ?? ''
    cell.innerHTML = `${labelNode}${escapeHtml(values[index] ?? '—')}`
  })
}

function renderChart(payload: DayFlowPayload): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (!stage) return
  const buckets = payload.buckets ?? []
  const bands = (payload.bands ?? []).slice(0, Math.max(1, Math.min(payload.topN ?? state.top, 12)))
  if (buckets.length === 0 || bands.length === 0) {
    stage.innerHTML = `<div class="notice">${escapeHtml(payload.coverageNote ?? 'No observed Day Flow snapshots for this window.')}</div>`
    return
  }
  const width = 1200
  const height = 560
  const pad = { top: 34, right: 28, bottom: 42, left: 48 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const totals = buckets.map((_, index) => bands.reduce((sum, band) => sum + viewerAt(band, index), 0))
  const max = Math.max(1, ...totals)
  let lower = Array(buckets.length).fill(0)
  const paths = bands.map((band, bandIndex) => {
    const upper = lower.map((value, index) => value + viewerAt(band, index))
    const topLine = upper.map((value, index) => `${x(index, buckets.length, chartW, pad.left).toFixed(1)},${y(value, max, chartH, pad.top).toFixed(1)}`).join(' ')
    const bottomLine = lower.map((value, index) => `${x(index, buckets.length, chartW, pad.left).toFixed(1)},${y(value, max, chartH, pad.top).toFixed(1)}`).reverse().join(' ')
    lower = upper
    return `<polygon points="${topLine} ${bottomLine}" fill="${fill(bandIndex)}" opacity="${Math.max(0.38, 0.9 - bandIndex * 0.04).toFixed(2)}"><title>${escapeHtml(band.name ?? 'Stream')}</title></polygon>`
  }).join('')
  const axis = [0, 6, 12, 18, 23].map((hour) => `<text class="chart-axis" x="${pad.left + (hour / 23) * chartW}" y="${height - 14}">${String(hour).padStart(2, '0')}:00</text>`).join('')
  stage.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Day Flow chart"><g class="chart-grid">${grid(width, height, pad)}</g>${paths}${axis}</svg>`
}

function renderInspector(payload: DayFlowPayload): void {
  const body = document.querySelector<HTMLElement>('[data-dayflow-inspector]')
  if (!body) return
  const streams = payload.detailPanelSource?.streamers ?? payload.bands ?? []
  const top = streams.filter((stream) => !stream.name?.toLowerCase().includes('others')).slice(0, 6)
  if (top.length === 0) {
    body.innerHTML = `<p>${escapeHtml(payload.coverageNote ?? 'No stream detail is available for this window.')}</p>`
    return
  }
  body.innerHTML = `<div class="focus-table">${top.map((stream, index) => `<div class="focus-row"><span class="rank">${index + 1}</span><strong>${escapeHtml(stream.name ?? 'Stream')}</strong><div class="bar"><i style="width:${barWidth(stream, top)}%"></i></div><span>${formatNumber(stream.peakViewers ?? stream.avgViewers ?? 0)}</span></div>`).join('')}</div><div class="inspector__row"><div><small>State</small><strong>${escapeHtml(label(payload.state ?? payload.status ?? 'unknown'))}</strong></div><span>${escapeHtml(time(payload.lastUpdated ?? payload.updatedAt))}</span></div><p>${escapeHtml(payload.coverageNote ?? '')}</p>`
}

function renderError(message: string): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (stage) stage.innerHTML = `<div class="notice">Day Flow API unavailable: ${escapeHtml(message)}</div>`
}

function markActive(selector: string, active: HTMLButtonElement): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => button.classList.toggle('active', button === active))
}

function viewerAt(band: DayFlowBand, index: number): number {
  const value = band.buckets?.[index]?.viewers ?? 0
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function x(index: number, count: number, chartW: number, left: number): number { return left + (count <= 1 ? 0 : (index / (count - 1)) * chartW) }
function y(value: number, max: number, chartH: number, top: number): number { return top + chartH - (value / max) * chartH }
function fill(index: number): string { return ['#223d50', '#385d4e', '#80653a', '#744740', '#514a72', '#26547c', '#4f6f52', '#8a5a44'][index % 8] }
function grid(width: number, height: number, pad: { top: number; bottom: number; left: number; right: number }): string {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + ratio * (height - pad.top - pad.bottom)}" y2="${pad.top + ratio * (height - pad.top - pad.bottom)}"/>`).join('')
}
function barWidth(stream: DayFlowBand, streams: DayFlowBand[]): string {
  const max = Math.max(1, ...streams.map((item) => item.peakViewers ?? item.avgViewers ?? 0))
  return String(Math.max(4, Math.min(100, ((stream.peakViewers ?? stream.avgViewers ?? 0) / max) * 100)).toFixed(1))
}
function formatNumber(value: number): string { return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value)) }
function time(input: unknown): string {
  if (typeof input !== 'string' || !input) return '—'
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? input : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
function label(input: string): string { return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function escapeHtml(input: string): string { return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
