type DayFlowBucket = { viewers?: number; share?: number; peak?: boolean; rise?: boolean }
type DayFlowBand = {
  streamerId?: string
  name?: string
  title?: string
  url?: string
  totalViewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  peakShare?: number
  buckets?: DayFlowBucket[]
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

type DayFlowState = { metric: 'volume' | 'share'; top: number; bucket: number; selectedBucketIndex: number; selectedStreamerId: string | null }

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const state: DayFlowState = { metric: 'volume', top: 20, bucket: 5, selectedBucketIndex: -1, selectedStreamerId: null }
let lastPayload: DayFlowPayload | null = null

void hydrateDayFlow()
wireControls()

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = button.dataset.dayflowMetric === 'share' ? 'share' : 'volume'
      markActive('[data-dayflow-metric]', button)
      if (lastPayload) {
        renderFacts(lastPayload)
        renderChart(lastPayload)
        renderInspector(lastPayload)
      } else {
        void hydrateDayFlow()
      }
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-top]').forEach((button) => {
    button.addEventListener('click', () => {
      const parsed = Number(button.dataset.dayflowTop)
      state.top = Number.isFinite(parsed) ? parsed : 20
      markActive('[data-dayflow-top]', button)
      state.selectedStreamerId = null
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
    lastPayload = payload
    const buckets = payload.buckets ?? []
    if (state.selectedBucketIndex < 0 || state.selectedBucketIndex >= buckets.length) state.selectedBucketIndex = Math.max(0, buckets.length - 1)
    if (!state.selectedStreamerId) state.selectedStreamerId = topStreamAtBucket(payload)?.streamerId ?? null
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
  const bands = visibleBands(payload)
  if (buckets.length === 0 || bands.length === 0) {
    stage.innerHTML = `<div class="notice">${escapeHtml(payload.coverageNote ?? 'No observed Day Flow snapshots for this window.')}</div>`
    return
  }
  const width = 1200
  const height = 560
  const pad = { top: 34, right: 28, bottom: 42, left: 48 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const totals = buckets.map((_, index) => bands.reduce((sum, band) => sum + valueAt(band, index), 0))
  const max = state.metric === 'share' ? Math.max(100, ...totals) : Math.max(1, ...totals)
  const selectedIndex = Math.max(0, Math.min(buckets.length - 1, state.selectedBucketIndex))
  let lower = Array(buckets.length).fill(0)
  const paths = bands.map((band, bandIndex) => {
    const bandId = band.streamerId ?? band.name ?? `band-${bandIndex}`
    const isSelected = state.selectedStreamerId === band.streamerId
    const upper = lower.map((value, index) => value + valueAt(band, index))
    const topLine = upper.map((value, index) => `${x(index, buckets.length, chartW, pad.left).toFixed(1)},${y(value, max, chartH, pad.top).toFixed(1)}`).join(' ')
    const bottomLine = lower.map((value, index) => `${x(index, buckets.length, chartW, pad.left).toFixed(1)},${y(value, max, chartH, pad.top).toFixed(1)}`).reverse().join(' ')
    lower = upper
    return `<polygon data-dayflow-band="${escapeAttr(String(bandId))}" points="${topLine} ${bottomLine}" fill="${fill(bandIndex)}" opacity="${isSelected ? '0.98' : Math.max(0.32, 0.82 - bandIndex * 0.04).toFixed(2)}" stroke="${isSelected ? '#eef4ff' : 'transparent'}" stroke-width="${isSelected ? '2' : '0'}"><title>${escapeHtml(band.name ?? 'Stream')}</title></polygon>`
  }).join('')
  const cursorX = x(selectedIndex, buckets.length, chartW, pad.left)
  const cursor = `<g class="dayflow-cursor"><line x1="${cursorX.toFixed(1)}" x2="${cursorX.toFixed(1)}" y1="${pad.top}" y2="${height - pad.bottom}"/><text x="${Math.min(width - 150, cursorX + 8).toFixed(1)}" y="${pad.top + 16}">${escapeHtml(bucketLabel(buckets, selectedIndex))}</text></g>`
  const axis = [0, 6, 12, 18, 23].map((hour) => `<text class="chart-axis" x="${pad.left + (hour / 23) * chartW}" y="${height - 14}">${String(hour).padStart(2, '0')}:00</text>`).join('')
  stage.innerHTML = `<svg data-dayflow-chart data-bucket-count="${buckets.length}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Day Flow chart"><g class="chart-grid">${grid(width, height, pad)}</g>${paths}${cursor}${axis}</svg>`
  bindChartInteraction(payload, { width, pad, chartW })
}

function bindChartInteraction(payload: DayFlowPayload, geometry: { width: number; pad: { left: number; right: number }; chartW: number }): void {
  const chart = document.querySelector<SVGSVGElement>('[data-dayflow-chart]')
  if (!chart) return
  chart.addEventListener('click', (event) => {
    const buckets = payload.buckets ?? []
    if (buckets.length === 0) return
    const rect = chart.getBoundingClientRect()
    const pointerX = ((event.clientX - rect.left) / Math.max(1, rect.width)) * geometry.width
    const bounded = Math.max(geometry.pad.left, Math.min(geometry.width - geometry.pad.right, pointerX))
    const ratio = (bounded - geometry.pad.left) / Math.max(1, geometry.chartW)
    state.selectedBucketIndex = Math.max(0, Math.min(buckets.length - 1, Math.round(ratio * (buckets.length - 1))))
    state.selectedStreamerId = topStreamAtBucket(payload)?.streamerId ?? state.selectedStreamerId
    renderChart(payload)
    renderInspector(payload)
  })
}

function renderInspector(payload: DayFlowPayload): void {
  const body = document.querySelector<HTMLElement>('[data-dayflow-inspector]')
  if (!body) return
  const buckets = payload.buckets ?? []
  const streams = (payload.detailPanelSource?.streamers ?? payload.bands ?? []).filter((stream) => !stream.name?.toLowerCase().includes('others'))
  const top = streams.slice(0, 6)
  if (top.length === 0) {
    body.innerHTML = `<p>${escapeHtml(payload.coverageNote ?? 'No stream detail is available for this window.')}</p>`
    return
  }
  const selected = selectedStream(payload) ?? top[0]
  const selectedIndex = Math.max(0, Math.min(Math.max(0, buckets.length - 1), state.selectedBucketIndex))
  const selectedValue = selected ? valueAt(selected, selectedIndex) : 0
  const total = top.reduce((sum, stream) => sum + valueAt(stream, selectedIndex), 0)
  body.innerHTML = `<div class="selected-stream"><small>Selected time</small><strong>${escapeHtml(bucketLabel(buckets, selectedIndex))}</strong><small>Selected stream</small><strong title="${escapeAttr(selected?.name ?? 'Stream')}">${escapeHtml(selected?.name ?? 'Stream')}</strong><div>${escapeHtml(metricLabel())}: ${escapeHtml(formatMetric(selectedValue))}</div><div>Share of visible top: ${escapeHtml(total > 0 ? `${Math.round((selectedValue / total) * 100)}%` : '—')}</div></div><div class="focus-table">${top.map((stream, index) => `<div class="focus-row${stream.streamerId === state.selectedStreamerId ? ' active' : ''}" role="button" tabindex="0" data-dayflow-streamer="${escapeAttr(stream.streamerId ?? stream.name ?? '')}"><span class="rank">${index + 1}</span><strong title="${escapeAttr(stream.name ?? 'Stream')}">${escapeHtml(stream.name ?? 'Stream')}</strong><div class="bar"><i style="width:${barWidthAt(stream, top, selectedIndex)}%"></i></div><span>${escapeHtml(formatMetric(valueAt(stream, selectedIndex)))}</span></div>`).join('')}</div><div class="inspector__row"><div><small>State</small><strong>${escapeHtml(label(payload.state ?? payload.status ?? 'unknown'))}</strong></div><span>${escapeHtml(time(payload.lastUpdated ?? payload.updatedAt))}</span></div><p>${escapeHtml(payload.coverageNote ?? '')}</p>`
  bindInspectorInteraction(payload)
}

function bindInspectorInteraction(payload: DayFlowPayload): void {
  document.querySelectorAll<HTMLElement>('[data-dayflow-streamer]').forEach((row) => {
    const select = () => {
      state.selectedStreamerId = row.dataset.dayflowStreamer || null
      renderChart(payload)
      renderInspector(payload)
    }
    row.addEventListener('click', select)
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        select()
      }
    })
  })
}

function renderError(message: string): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (stage) stage.innerHTML = `<div class="notice">Day Flow API unavailable: ${escapeHtml(message)}</div>`
}

function markActive(selector: string, active: HTMLButtonElement): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => button.classList.toggle('active', button === active))
}

function visibleBands(payload: DayFlowPayload): DayFlowBand[] {
  return (payload.bands ?? []).filter((band) => !band.name?.toLowerCase().includes('others')).slice(0, Math.max(1, Math.min(payload.topN ?? state.top, 12)))
}
function selectedStream(payload: DayFlowPayload): DayFlowBand | undefined {
  const streams = payload.detailPanelSource?.streamers ?? payload.bands ?? []
  return streams.find((stream) => stream.streamerId === state.selectedStreamerId)
}
function topStreamAtBucket(payload: DayFlowPayload): DayFlowBand | undefined {
  const bands = visibleBands(payload)
  const index = Math.max(0, state.selectedBucketIndex)
  return bands.reduce<DayFlowBand | undefined>((best, band) => !best || valueAt(band, index) > valueAt(best, index) ? band : best, undefined)
}
function valueAt(band: DayFlowBand, index: number): number { return state.metric === 'share' ? shareAt(band, index) : viewerAt(band, index) }
function viewerAt(band: DayFlowBand, index: number): number {
  const value = band.buckets?.[index]?.viewers ?? 0
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}
function shareAt(band: DayFlowBand, index: number): number {
  const value = band.buckets?.[index]?.share ?? 0
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}
function x(index: number, count: number, chartW: number, left: number): number { return left + (count <= 1 ? 0 : (index / (count - 1)) * chartW) }
function y(value: number, max: number, chartH: number, top: number): number { return top + chartH - (value / max) * chartH }
function fill(index: number): string { return ['#223d50', '#385d4e', '#80653a', '#744740', '#514a72', '#26547c', '#4f6f52', '#8a5a44'][index % 8] }
function grid(width: number, height: number, pad: { top: number; bottom: number; left: number; right: number }): string {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + ratio * (height - pad.top - pad.bottom)}" y2="${pad.top + ratio * (height - pad.top - pad.bottom)}"/>`).join('')
}
function barWidthAt(stream: DayFlowBand, streams: DayFlowBand[], index: number): string {
  const max = Math.max(1, ...streams.map((item) => valueAt(item, index)))
  return String(Math.max(4, Math.min(100, (valueAt(stream, index) / max) * 100)).toFixed(1))
}
function bucketLabel(buckets: string[], index: number): string { return buckets[index] ?? 'Latest bucket' }
function metricLabel(): string { return state.metric === 'share' ? 'Share' : 'Viewers' }
function formatMetric(value: number): string { return state.metric === 'share' ? `${value.toFixed(value >= 10 ? 0 : 1)}%` : formatNumber(value) }
function formatNumber(value: number): string { return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : String(Math.round(value)) }
function time(input: unknown): string {
  if (typeof input !== 'string' || !input) return '—'
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? input : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}
function label(input: string): string { return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) }
function escapeHtml(input: string): string { return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function escapeAttr(input: string): string { return escapeHtml(input).replace(/'/g, '&#39;') }
