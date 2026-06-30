type DayFlowBucket = {
  viewers?: number
  share?: number
  activity?: number
  activityAvailable?: boolean
  peak?: boolean
  rise?: boolean
}

type DayFlowBand = {
  streamerId?: string
  name?: string
  title?: string
  url?: string
  isOthers?: boolean
  totalViewerMinutes?: number
  viewerMinutes?: number
  peakViewers?: number
  avgViewers?: number
  peakShare?: number
  biggestRiseBucket?: string | null
  biggestRiseTime?: string | null
  biggestRiseValue?: number
  firstSeen?: string | null
  lastSeen?: string | null
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
  selectedDate?: string
  bucketSize?: number
  topN?: number
  valueMode?: string
  rangeMode?: string
  windowStart?: string
  windowEnd?: string
  isRolling?: boolean
  buckets?: string[]
  totalViewersByBucket?: number[]
  bands?: DayFlowBand[]
  summary?: {
    peakLeader?: string | null
    longestDominance?: string | null
    biggestRise?: string | null
    highestActivity?: string | null
  }
  detailPanelSource?: { defaultStreamerId?: string | null; streamers?: DayFlowBand[] }
  activity?: { available?: boolean; note?: string }
}

type RangeMode = 'today' | 'rolling24h' | 'yesterday' | 'date'
type MetricMode = 'volume' | 'share'
type ScopeMode = 'full' | 'topFocus'

type DayFlowState = {
  metric: MetricMode
  scope: ScopeMode
  top: 10 | 20 | 50
  bucket: 5 | 10
  rangeMode: RangeMode
  date: string
  selectedBucketIndex: number
  selectedStreamerId: string | null
  autoUpdate: boolean
  highlightOnly: boolean
}

type ChartGeometry = {
  width: number
  height: number
  pad: { top: number; right: number; bottom: number; left: number }
  chartW: number
  chartH: number
  startMs: number
  endMs: number
}

const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const providerBase = provider === 'kick' ? '/kick' : '/twitch'
const state: DayFlowState = readInitialState()
let lastPayload: DayFlowPayload | null = null
let autoTimer: number | null = null
let pointerActive = false

wireControls()
syncControls()
configureAutoUpdate()
void hydrateDayFlow()

function readInitialState(): DayFlowState {
  const params = new URLSearchParams(window.location.search)
  const topValue = Number(params.get('top'))
  const bucketValue = Number(params.get('bucket'))
  const range = params.get('rangeMode')
  const metric = params.get('metric')
  const scope = params.get('scope')
  return {
    metric: metric === 'share' ? 'share' : 'volume',
    scope: scope === 'topFocus' ? 'topFocus' : 'full',
    top: topValue === 10 || topValue === 50 ? topValue : 20,
    bucket: bucketValue === 10 ? 10 : 5,
    rangeMode: range === 'rolling24h' || range === 'yesterday' || range === 'date' ? range : 'today',
    date: validDate(params.get('date')) ?? utcDate(new Date()),
    selectedBucketIndex: -1,
    selectedStreamerId: params.get('streamer'),
    autoUpdate: params.get('auto') !== 'off',
    highlightOnly: false,
  }
}

function wireControls(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-metric]').forEach((button) => {
    button.addEventListener('click', () => {
      state.metric = button.dataset.dayflowMetric === 'share' ? 'share' : 'volume'
      state.selectedBucketIndex = nearestIndexForUrlTime(lastPayload)
      syncControls()
      syncUrl()
      void hydrateDayFlow()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-scope]').forEach((button) => {
    button.addEventListener('click', () => {
      state.scope = button.dataset.dayflowScope === 'topFocus' ? 'topFocus' : 'full'
      state.selectedStreamerId = ensureSelectedStreamer(lastPayload)
      syncControls()
      syncUrl()
      renderAll(lastPayload)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-top]').forEach((button) => {
    button.addEventListener('click', () => {
      const parsed = Number(button.dataset.dayflowTop)
      state.top = parsed === 10 || parsed === 50 ? parsed : 20
      state.selectedStreamerId = null
      state.highlightOnly = false
      syncControls()
      syncUrl()
      void hydrateDayFlow()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-bucket]').forEach((button) => {
    button.addEventListener('click', () => {
      state.bucket = Number(button.dataset.dayflowBucket) === 10 ? 10 : 5
      state.selectedBucketIndex = -1
      syncControls()
      syncUrl()
      void hydrateDayFlow()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-range]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.dataset.dayflowRange
      state.rangeMode = value === 'rolling24h' || value === 'yesterday' || value === 'date' ? value : 'today'
      state.selectedBucketIndex = -1
      state.selectedStreamerId = null
      state.highlightOnly = false
      syncControls()
      syncUrl()
      configureAutoUpdate()
      void hydrateDayFlow()
    })
  })

  document.querySelector<HTMLInputElement>('[data-dayflow-date]')?.addEventListener('change', (event) => {
    const input = event.currentTarget
    const date = validDate(input.value)
    if (!date) return
    state.date = date
    state.rangeMode = 'date'
    state.selectedBucketIndex = -1
    state.selectedStreamerId = null
    state.highlightOnly = false
    syncControls()
    syncUrl()
    configureAutoUpdate()
    void hydrateDayFlow()
  })

  document.querySelector<HTMLButtonElement>('[data-dayflow-auto]')?.addEventListener('click', () => {
    if (!isLiveRange()) return
    state.autoUpdate = !state.autoUpdate
    syncControls()
    syncUrl()
    configureAutoUpdate()
  })

  document.querySelector<HTMLElement>('[data-dayflow-refresh]')?.addEventListener('click', () => { void hydrateDayFlow() })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.autoUpdate && isLiveRange()) void hydrateDayFlow()
  })
}

function syncControls(): void {
  markActive('[data-dayflow-metric]', 'dayflowMetric', state.metric)
  markActive('[data-dayflow-scope]', 'dayflowScope', state.scope)
  markActive('[data-dayflow-top]', 'dayflowTop', String(state.top))
  markActive('[data-dayflow-bucket]', 'dayflowBucket', String(state.bucket))
  markActive('[data-dayflow-range]', 'dayflowRange', state.rangeMode)

  const dateInput = document.querySelector<HTMLInputElement>('[data-dayflow-date]')
  if (dateInput) {
    dateInput.value = state.date
    dateInput.max = utcDate(new Date())
  }

  const autoButton = document.querySelector<HTMLButtonElement>('[data-dayflow-auto]')
  if (autoButton) {
    autoButton.disabled = !isLiveRange()
    autoButton.classList.toggle('active', state.autoUpdate && isLiveRange())
    autoButton.textContent = isLiveRange() ? `Auto ${state.autoUpdate ? 'on' : 'off'}` : 'Auto off'
    autoButton.setAttribute('aria-pressed', String(state.autoUpdate && isLiveRange()))
  }
}

function markActive(selector: string, datasetKey: string, expected: string): void {
  document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
    button.classList.toggle('active', button.dataset[datasetKey] === expected)
  })
}

function configureAutoUpdate(): void {
  if (autoTimer !== null) {
    window.clearInterval(autoTimer)
    autoTimer = null
  }
  if (!state.autoUpdate || !isLiveRange()) return
  autoTimer = window.setInterval(() => {
    if (!document.hidden) void hydrateDayFlow()
  }, 60_000)
}

function isLiveRange(): boolean {
  return state.rangeMode === 'today' || state.rangeMode === 'rolling24h'
}

async function hydrateDayFlow(): Promise<void> {
  renderLoading()
  try {
    const params = new URLSearchParams({
      metric: state.metric,
      top: String(state.top),
      bucket: String(state.bucket),
      rangeMode: state.rangeMode,
    })
    if (state.rangeMode === 'date') params.set('date', state.date)
    const response = await fetch(`${endpoint}?${params.toString()}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
    if (!response.ok) throw new Error(`day flow api returned ${response.status}`)
    const payload = await response.json() as DayFlowPayload
    lastPayload = payload
    state.date = validDate(payload.selectedDate) ?? state.date
    state.selectedBucketIndex = resolveSelectedIndex(payload)
    state.selectedStreamerId = ensureSelectedStreamer(payload)
    syncControls()
    syncUrl(payload)
    renderAll(payload)
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error))
  }
}

function renderAll(payload: DayFlowPayload | null): void {
  if (!payload) return
  renderFacts(payload)
  renderStrip(payload)
  renderChart(payload)
  renderInspector(payload)
  renderSummary(payload)
  renderCoverage(payload)
}

function renderLoading(): void {
  setHtml('.dayflow-stage', '<div class="notice">Loading Day Flow from observed snapshots…</div>')
  setHtml('[data-dayflow-time-focus]', '<div class="notice">Loading selected-time ranking…</div>')
  setHtml('[data-dayflow-detail]', '<div class="notice">Loading selected streamer details…</div>')
  setHtml('[data-dayflow-summary]', '<div class="notice">Loading Day Flow summary…</div>')
  setHtml('[data-dayflow-coverage]', '')
}

function renderFacts(payload: DayFlowPayload): void {
  const values = [
    displayState(payload),
    state.metric === 'share' ? 'Share' : 'Volume',
    rangeLabel(payload),
    `${payload.bucketSize ?? state.bucket} minutes`,
  ]
  document.querySelectorAll<HTMLElement>('.head-facts .fact strong').forEach((node, index) => { node.textContent = values[index] ?? '—' })
}

function renderStrip(payload: DayFlowPayload): void {
  const buckets = payload.buckets ?? []
  const observed = observedBucketCount(payload)
  const streamCount = nonOthers(payload).slice(0, state.top).length
  const values = [
    formatDateTime(payload.lastUpdated ?? payload.updatedAt),
    `${streamCount} streams + Others`,
    `${observed}/${buckets.length} buckets`,
    label(payload.source ?? 'api'),
  ]
  document.querySelectorAll<HTMLElement>('.data-strip__cell').forEach((cell, index) => {
    const labelNode = cell.querySelector('small')?.outerHTML ?? ''
    cell.innerHTML = `${labelNode}${escapeHtml(values[index] ?? '—')}`
  })
}

function renderChart(payload: DayFlowPayload): void {
  const stage = document.querySelector<HTMLElement>('.dayflow-stage')
  if (!stage) return
  const buckets = payload.buckets ?? []
  const bands = bandsForScope(payload)
  if (buckets.length === 0 || bands.length === 0) {
    stage.innerHTML = '<div class="notice">No observed Day Flow snapshots for this window.</div>'
    return
  }

  const width = 1280
  const height = 600
  const pad = { top: 42, right: 30, bottom: 54, left: 76 }
  const chartW = width - pad.left - pad.right
  const chartH = height - pad.top - pad.bottom
  const timeExtent = payloadTimeExtent(payload)
  const geometry: ChartGeometry = { width, height, pad, chartW, chartH, ...timeExtent }
  const totals = buckets.map((_, index) => bands.reduce((sum, band) => sum + chartValueAt(payload, band, index), 0))
  const max = state.metric === 'share' ? 100 : Math.max(1, ...totals)
  const selectedIndex = clamp(state.selectedBucketIndex, 0, buckets.length - 1)
  let lower = Array<number>(buckets.length).fill(0)

  const paths = bands.map((band, bandIndex) => {
    const bandId = bandKey(band, bandIndex)
    const selected = bandId === state.selectedStreamerId
    const upper = lower.map((value, index) => value + chartValueAt(payload, band, index))
    const topLine = upper.map((value, index) => `${xForBucket(buckets[index], geometry).toFixed(1)},${y(value, max, geometry).toFixed(1)}`).join(' ')
    const bottomLine = lower.map((value, index) => `${xForBucket(buckets[index], geometry).toFixed(1)},${y(value, max, geometry).toFixed(1)}`).reverse().join(' ')
    lower = upper
    const opacity = state.highlightOnly && !selected ? 0.06 : selected ? 0.98 : band.isOthers || bandId === 'others' ? 0.32 : Math.max(0.38, 0.86 - bandIndex * 0.018)
    const stroke = selected ? '#eef4ff' : 'rgba(255,255,255,.08)'
    return `<polygon class="dayflow-band${selected ? ' selected' : ''}${band.isOthers ? ' others' : ''}" data-dayflow-band="${escapeAttr(bandId)}" points="${topLine} ${bottomLine}" fill="${bandColor(bandId, bandIndex, Boolean(band.isOthers))}" opacity="${opacity.toFixed(2)}" stroke="${stroke}" stroke-width="${selected ? 2.4 : 0.6}" tabindex="0" role="button" aria-label="Select ${escapeAttr(band.name ?? 'stream')}"><title>${escapeHtml(band.name ?? 'Stream')}</title></polygon>`
  }).join('')

  const cursorX = xForBucket(buckets[selectedIndex], geometry)
  const cursor = `<g class="dayflow-cursor"><line x1="${cursorX.toFixed(1)}" x2="${cursorX.toFixed(1)}" y1="${pad.top}" y2="${height - pad.bottom}"/><text x="${Math.min(width - 210, cursorX + 9).toFixed(1)}" y="${pad.top + 17}">${escapeHtml(formatBucket(buckets[selectedIndex], true))}</text></g>`
  const axes = renderAxes(payload, geometry, max)
  const markers = renderSelectedMarkers(payload, geometry, max)
  stage.innerHTML = `<svg data-dayflow-chart viewBox="0 0 ${width} ${height}" role="img" aria-label="Day Flow stacked audience terrain" tabindex="0"><g class="chart-grid">${axes.grid}</g>${paths}${markers}${cursor}<g class="dayflow-axes">${axes.labels}</g></svg>`
  bindChartInteraction(payload, geometry)
}

function renderAxes(payload: DayFlowPayload, geometry: ChartGeometry, max: number): { grid: string; labels: string } {
  const horizontal = [0, 0.25, 0.5, 0.75, 1]
  const grid = horizontal.map((ratio) => {
    const py = geometry.pad.top + ratio * geometry.chartH
    return `<line x1="${geometry.pad.left}" x2="${geometry.width - geometry.pad.right}" y1="${py}" y2="${py}"/>`
  }).join('')
  const yLabels = horizontal.map((ratio) => {
    const value = max * (1 - ratio)
    const py = geometry.pad.top + ratio * geometry.chartH
    return `<text class="chart-axis chart-axis--y" x="${geometry.pad.left - 10}" y="${py + 4}" text-anchor="end">${escapeHtml(state.metric === 'share' ? `${Math.round(value)}%` : compactNumber(value))}</text>`
  }).join('')
  const xRatios = [0, 0.25, 0.5, 0.75, 1]
  const xLabels = xRatios.map((ratio) => {
    const ms = geometry.startMs + (geometry.endMs - geometry.startMs) * ratio
    const px = geometry.pad.left + geometry.chartW * ratio
    return `<text class="chart-axis" x="${px}" y="${geometry.height - 18}" text-anchor="${ratio === 0 ? 'start' : ratio === 1 ? 'end' : 'middle'}">${escapeHtml(formatAxisTime(ms, payload))}</text>`
  }).join('')
  return { grid, labels: yLabels + xLabels }
}

function renderSelectedMarkers(payload: DayFlowPayload, geometry: ChartGeometry, max: number): string {
  const selected = selectedBand(payload)
  const buckets = payload.buckets ?? []
  if (!selected || buckets.length === 0) return ''
  const values = selected.buckets ?? []
  const nonZero = values.map((bucket, index) => viewerValue(bucket) > 0 ? index : -1).filter((index) => index >= 0)
  const markerIndexes = new Map<number, string>()
  if (nonZero.length > 0) {
    markerIndexes.set(nonZero[0], 'Start')
    markerIndexes.set(nonZero[nonZero.length - 1], 'End')
  }
  values.forEach((bucket, index) => {
    if (bucket.peak) markerIndexes.set(index, 'Peak')
    else if (bucket.rise) markerIndexes.set(index, 'Rise')
    else if (bucket.activityAvailable && safeNumber(bucket.activity) > 0) markerIndexes.set(index, 'Heat')
  })

  return [...markerIndexes.entries()].map(([index, marker]) => {
    const stack = stackTopForBand(payload, selected, index)
    const px = xForBucket(buckets[index], geometry)
    const py = y(stack, max, geometry)
    return `<g class="dayflow-marker"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4"/><text x="${(px + 6).toFixed(1)}" y="${(py - 7).toFixed(1)}">${marker}</text></g>`
  }).join('')
}

function stackTopForBand(payload: DayFlowPayload, target: DayFlowBand, index: number): number {
  let value = 0
  for (const band of bandsForScope(payload)) {
    value += chartValueAt(payload, band, index)
    if (band === target || bandKey(band, 0) === bandKey(target, 0)) break
  }
  return value
}

function bindChartInteraction(payload: DayFlowPayload, geometry: ChartGeometry): void {
  const chart = document.querySelector<SVGSVGElement>('[data-dayflow-chart]')
  if (!chart) return

  const updateFromPointer = (clientX: number): void => {
    const rect = chart.getBoundingClientRect()
    const svgX = ((clientX - rect.left) / Math.max(1, rect.width)) * geometry.width
    const bounded = clamp(svgX, geometry.pad.left, geometry.width - geometry.pad.right)
    const ratio = (bounded - geometry.pad.left) / Math.max(1, geometry.chartW)
    const targetMs = geometry.startMs + ratio * (geometry.endMs - geometry.startMs)
    state.selectedBucketIndex = nearestBucketIndex(payload.buckets ?? [], targetMs)
    syncUrl(payload)
    renderChart(payload)
    renderInspector(payload)
  }

  chart.addEventListener('pointerdown', (event) => {
    pointerActive = true
    const element = event.target instanceof Element ? event.target.closest<SVGElement>('[data-dayflow-band]') : null
    const streamerId = element?.dataset.dayflowBand
    if (streamerId) {
      state.selectedStreamerId = streamerId
      state.highlightOnly = false
    }
    chart.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX)
    event.preventDefault()
  })
  chart.addEventListener('pointermove', (event) => {
    if (!pointerActive) return
    updateFromPointer(event.clientX)
    event.preventDefault()
  })
  const stopPointer = (event: PointerEvent): void => {
    pointerActive = false
    if (chart.hasPointerCapture(event.pointerId)) chart.releasePointerCapture(event.pointerId)
  }
  chart.addEventListener('pointerup', stopPointer)
  chart.addEventListener('pointercancel', stopPointer)
  chart.addEventListener('keydown', (event) => {
    const buckets = payload.buckets ?? []
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    state.selectedBucketIndex = clamp(state.selectedBucketIndex + (event.key === 'ArrowRight' ? 1 : -1), 0, Math.max(0, buckets.length - 1))
    syncUrl(payload)
    renderChart(payload)
    renderInspector(payload)
  })
}

function renderInspector(payload: DayFlowPayload): void {
  renderTimeFocus(payload)
  renderDetail(payload)
}

function renderTimeFocus(payload: DayFlowPayload): void {
  const target = document.querySelector<HTMLElement>('[data-dayflow-time-focus]')
  if (!target) return
  const buckets = payload.buckets ?? []
  if (buckets.length === 0) {
    target.innerHTML = '<div class="notice">No observed Day Flow snapshots for this window.</div>'
    return
  }
  const index = clamp(state.selectedBucketIndex, 0, buckets.length - 1)
  const ranking = rankAt(payload, index).slice(0, 5)
  const previousRanking = rankAt(payload, Math.max(0, index - 1))
  const previousRank = new Map(previousRanking.map((band, rank) => [bandKey(band, rank), rank + 1]))
  const maxViewers = Math.max(1, ...ranking.map((band) => viewerAt(band, index)))

  if (ranking.length === 0) {
    target.innerHTML = '<div class="notice">No stream detail is available for this window.</div>'
    return
  }

  target.innerHTML = `<div class="time-focus-head"><div><small>Selected time</small><strong>${escapeHtml(formatBucket(buckets[index], true))}</strong></div><span>${state.scope === 'topFocus' ? 'Top N share' : 'Global share'}</span></div><div class="time-focus-list">${ranking.map((band, rank) => {
    const viewers = viewerAt(band, index)
    const priorBand = rank > 0 ? ranking[rank - 1] : null
    const gap = priorBand ? viewerAt(priorBand, index) - viewers : 0
    const delta = viewers - viewerAt(band, Math.max(0, index - 1))
    const key = bandKey(band, rank)
    const oldRank = previousRank.get(key)
    const rankDelta = oldRank == null ? 'new' : oldRank === rank + 1 ? '—' : oldRank > rank + 1 ? `↑${oldRank - rank - 1}` : `↓${rank + 1 - oldRank}`
    return `<button class="time-focus-row${key === state.selectedStreamerId ? ' active' : ''}" data-dayflow-streamer="${escapeAttr(key)}"><span class="rank">${rank + 1}</span><strong title="${escapeAttr(band.name ?? 'Stream')}">${escapeHtml(band.name ?? 'Stream')}</strong><span class="time-focus-value">${compactNumber(viewers)}</span><span>${globalShareAt(band, index).toFixed(1)}%</span><span>${rank === 0 ? 'Leader' : `−${compactNumber(gap)}`}</span><span class="${delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'}">${signedNumber(delta)}</span><span>${rankDelta}</span><i style="width:${Math.max(2, viewers / maxViewers * 100).toFixed(1)}%"></i></button>`
  }).join('')}</div>`

  target.querySelectorAll<HTMLButtonElement>('[data-dayflow-streamer]').forEach((row) => {
    row.addEventListener('click', () => {
      state.selectedStreamerId = row.dataset.dayflowStreamer ?? null
      state.highlightOnly = false
      syncUrl(payload)
      renderChart(payload)
      renderInspector(payload)
    })
  })
}

function renderDetail(payload: DayFlowPayload): void {
  const target = document.querySelector<HTMLElement>('[data-dayflow-detail]')
  if (!target) return
  const buckets = payload.buckets ?? []
  const band = selectedBand(payload)
  if (!band || buckets.length === 0) {
    target.innerHTML = '<div class="notice">No stream detail is available for this window.</div>'
    return
  }
  const index = clamp(state.selectedBucketIndex, 0, buckets.length - 1)
  const metadata = detailMetadata(payload, band)
  const viewers = viewerAt(band, index)
  const streamUrl = metadata.url || band.url || ''
  const battleUrl = `${providerBase}/battle-lines/?date=${encodeURIComponent(payload.selectedDate ?? state.date)}&focus=${encodeURIComponent(bandKey(band, 0))}&t=${encodeURIComponent(buckets[index] ?? '')}`
  const activityAvailable = Boolean(band.buckets?.[index]?.activityAvailable)

  target.innerHTML = `<div class="stream-detail-head"><div><small>Selected streamer</small><h2 title="${escapeAttr(band.name ?? 'Stream')}">${escapeHtml(band.name ?? 'Stream')}</h2><p>${escapeHtml(metadata.title || band.title || 'No observed title')}</p></div><div class="stream-detail-now"><strong>${compactNumber(viewers)}</strong><span>viewers · ${globalShareAt(band, index).toFixed(1)}% global share</span></div></div><dl class="stream-detail-grid"><div><dt>Peak viewers</dt><dd>${compactNumber(safeNumber(metadata.peakViewers ?? band.peakViewers))}</dd></div><div><dt>Average viewers</dt><dd>${compactNumber(safeNumber(metadata.avgViewers ?? band.avgViewers))}</dd></div><div><dt>Viewer-minutes</dt><dd>${compactNumber(safeNumber(metadata.viewerMinutes ?? metadata.totalViewerMinutes ?? band.totalViewerMinutes))}</dd></div><div><dt>Peak share</dt><dd>${(safeNumber(metadata.peakShare ?? band.peakShare) * 100).toFixed(1)}%</dd></div><div><dt>Biggest rise</dt><dd>${signedNumber(safeNumber(metadata.biggestRiseValue ?? band.biggestRiseValue))}</dd></div><div><dt>First seen</dt><dd>${formatBucket(String(metadata.firstSeen ?? band.firstSeen ?? ''), false)}</dd></div><div><dt>Last seen</dt><dd>${formatBucket(String(metadata.lastSeen ?? band.lastSeen ?? ''), false)}</dd></div><div><dt>Activity</dt><dd>${activityAvailable ? compactNumber(safeNumber(band.buckets?.[index]?.activity)) : 'Activity unavailable'}</dd></div></dl><div class="stream-detail-actions">${streamUrl ? `<a class="button" href="${escapeAttr(streamUrl)}" target="_blank" rel="noreferrer">Open stream</a>` : ''}<a class="button button--quiet" href="${escapeAttr(battleUrl)}">Open in Battle Lines</a><button class="button button--quiet" data-dayflow-highlight>${state.highlightOnly ? 'Show all bands' : 'Highlight only'}</button></div>`

  target.querySelector<HTMLButtonElement>('[data-dayflow-highlight]')?.addEventListener('click', () => {
    state.highlightOnly = !state.highlightOnly
    renderChart(payload)
    renderDetail(payload)
  })
}

function renderSummary(payload: DayFlowPayload): void {
  const target = document.querySelector<HTMLElement>('[data-dayflow-summary]')
  if (!target) return
  const summary = payload.summary ?? {}
  target.innerHTML = `<div class="dayflow-summary-grid"><div><small>Peak leader</small><strong>${escapeHtml(summary.peakLeader || 'Unavailable')}</strong></div><div><small>Longest dominance</small><strong>${escapeHtml(summary.longestDominance || 'Unavailable')}</strong></div><div><small>Biggest rise</small><strong>${escapeHtml(summary.biggestRise || 'Unavailable')}</strong></div><div><small>Highest activity</small><strong>${escapeHtml(summary.highestActivity || 'Activity unavailable')}</strong></div></div>`
}

function renderCoverage(payload: DayFlowPayload): void {
  const target = document.querySelector<HTMLElement>('[data-dayflow-coverage]')
  if (!target) return
  const total = payload.buckets?.length ?? 0
  const observed = observedBucketCount(payload)
  const stateText = displayState(payload)
  const note = payload.partialNote ? `<span>${escapeHtml(payload.partialNote)}</span>` : ''
  target.innerHTML = `<strong>Coverage: ${escapeHtml(stateText)}</strong><span>${observed}/${total} buckets · ${escapeHtml(provider === 'kick' ? 'Kick data' : 'Twitch data')}</span>${note}`
}

function renderError(message: string): void {
  const safe = escapeHtml(message)
  setHtml('.dayflow-stage', `<div class="notice notice--error">Day Flow API unavailable: ${safe}</div>`)
  setHtml('[data-dayflow-time-focus]', '<div class="notice notice--error">Selected-time ranking is unavailable.</div>')
  setHtml('[data-dayflow-detail]', '<div class="notice notice--error">Selected streamer detail is unavailable.</div>')
  setHtml('[data-dayflow-summary]', '<div class="notice notice--error">Day Flow summary is unavailable.</div>')
  setHtml('[data-dayflow-coverage]', '<strong>Coverage unavailable</strong>')
}

function bandsForScope(payload: DayFlowPayload): DayFlowBand[] {
  const topBands = nonOthers(payload).slice(0, state.top)
  if (state.scope === 'topFocus') return topBands
  const others = (payload.bands ?? []).find(isOthersBand)
  return others ? [...topBands, others] : topBands
}

function nonOthers(payload: DayFlowPayload): DayFlowBand[] {
  return (payload.bands ?? []).filter((band) => !isOthersBand(band))
}

function isOthersBand(band: DayFlowBand): boolean {
  return Boolean(band.isOthers) || band.streamerId === 'others' || band.name?.toLowerCase() === 'others'
}

function chartValueAt(payload: DayFlowPayload, band: DayFlowBand, index: number): number {
  if (state.metric === 'volume') return viewerAt(band, index)
  if (state.scope === 'full') return globalShareAt(band, index)
  const denominator = nonOthers(payload).slice(0, state.top).reduce((sum, item) => sum + viewerAt(item, index), 0)
  return denominator > 0 ? viewerAt(band, index) / denominator * 100 : 0
}

function viewerAt(band: DayFlowBand, index: number): number {
  return viewerValue(band.buckets?.[index])
}

function viewerValue(bucket: DayFlowBucket | undefined): number {
  return Math.max(0, safeNumber(bucket?.viewers))
}

function globalShareAt(band: DayFlowBand, index: number): number {
  return Math.max(0, safeNumber(band.buckets?.[index]?.share)) * 100
}

function rankAt(payload: DayFlowPayload, index: number): DayFlowBand[] {
  return nonOthers(payload).slice(0, state.top).filter((band) => viewerAt(band, index) > 0).sort((a, b) => viewerAt(b, index) - viewerAt(a, index))
}

function selectedBand(payload: DayFlowPayload): DayFlowBand | undefined {
  const bands = bandsForScope(payload)
  return bands.find((band, index) => bandKey(band, index) === state.selectedStreamerId) ?? bands.find((band) => !isOthersBand(band))
}

function detailMetadata(payload: DayFlowPayload, band: DayFlowBand): DayFlowBand {
  const key = bandKey(band, 0)
  return payload.detailPanelSource?.streamers?.find((item, index) => bandKey(item, index) === key) ?? band
}

function ensureSelectedStreamer(payload: DayFlowPayload | null): string | null {
  if (!payload) return state.selectedStreamerId
  const bands = bandsForScope(payload)
  if (state.selectedStreamerId && bands.some((band, index) => bandKey(band, index) === state.selectedStreamerId)) return state.selectedStreamerId
  const top = rankAt(payload, clamp(state.selectedBucketIndex, 0, Math.max(0, (payload.buckets?.length ?? 1) - 1)))[0] ?? bands.find((band) => !isOthersBand(band))
  return top ? bandKey(top, 0) : null
}

function resolveSelectedIndex(payload: DayFlowPayload): number {
  const buckets = payload.buckets ?? []
  if (buckets.length === 0) return -1
  const params = new URLSearchParams(window.location.search)
  const time = params.get('time')
  if (time) {
    const parsed = Date.parse(time)
    if (Number.isFinite(parsed)) return nearestBucketIndex(buckets, parsed)
  }
  if (state.selectedBucketIndex >= 0 && state.selectedBucketIndex < buckets.length) return state.selectedBucketIndex
  return buckets.length - 1
}

function nearestIndexForUrlTime(payload: DayFlowPayload | null): number {
  if (!payload) return state.selectedBucketIndex
  const params = new URLSearchParams(window.location.search)
  const parsed = Date.parse(params.get('time') ?? '')
  return Number.isFinite(parsed) ? nearestBucketIndex(payload.buckets ?? [], parsed) : state.selectedBucketIndex
}

function nearestBucketIndex(buckets: string[], targetMs: number): number {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  buckets.forEach((bucket, index) => {
    const distance = Math.abs(Date.parse(bucket) - targetMs)
    if (distance < bestDistance) {
      bestIndex = index
      bestDistance = distance
    }
  })
  return bestIndex
}

function payloadTimeExtent(payload: DayFlowPayload): { startMs: number; endMs: number } {
  const buckets = payload.buckets ?? []
  const fallbackStart = Date.parse(buckets[0] ?? '')
  const fallbackEnd = Date.parse(buckets[buckets.length - 1] ?? '')
  const startMs = validTime(payload.windowStart) ?? (Number.isFinite(fallbackStart) ? fallbackStart : Date.now())
  const endMsRaw = validTime(payload.windowEnd) ?? (Number.isFinite(fallbackEnd) ? fallbackEnd : startMs + 1)
  return { startMs, endMs: Math.max(startMs + 1, endMsRaw) }
}

function xForBucket(bucket: string | undefined, geometry: ChartGeometry): number {
  const ms = Date.parse(bucket ?? '')
  const ratio = Number.isFinite(ms) ? (ms - geometry.startMs) / Math.max(1, geometry.endMs - geometry.startMs) : 0
  return geometry.pad.left + clamp(ratio, 0, 1) * geometry.chartW
}

function y(value: number, max: number, geometry: ChartGeometry): number {
  return geometry.pad.top + geometry.chartH - clamp(value / Math.max(1, max), 0, 1) * geometry.chartH
}

function bandKey(band: DayFlowBand, index: number): string {
  return String(band.streamerId ?? band.name ?? `band-${index}`)
}

function bandColor(key: string, index: number, others: boolean): string {
  if (others) return '#536175'
  const palette = ['#7c6ee6', '#3aa982', '#d49a45', '#d36c78', '#548fc5', '#9d6db7', '#62a65a', '#c67b50', '#4ba1a1', '#b887c5', '#8a9d4a', '#d184ad']
  let hash = 0
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0
  return palette[Math.abs(hash + index) % palette.length]
}

function observedBucketCount(payload: DayFlowPayload): number {
  return (payload.totalViewersByBucket ?? []).filter((value) => safeNumber(value) > 0).length
}

function displayState(payload: DayFlowPayload): string {
  const raw = String(payload.state ?? payload.status ?? 'unknown').toLowerCase()
  if (raw === 'ok' || raw === 'live' || raw === 'fresh') return observedBucketCount(payload) === (payload.buckets?.length ?? 0) ? 'Complete' : 'Observed'
  if (raw === 'partial') return 'Partial'
  if (raw === 'stale') return 'Stale'
  if (raw === 'empty') return 'Empty'
  if (raw === 'error') return 'Error'
  return label(raw)
}

function rangeLabel(payload: DayFlowPayload): string {
  const mode = payload.rangeMode ?? state.rangeMode
  if (mode === 'rolling24h') return 'Rolling 24h'
  if (mode === 'yesterday') return 'Yesterday'
  if (mode === 'date') return payload.selectedDate ?? state.date
  return 'Today'
}

function syncUrl(payload?: DayFlowPayload): void {
  const current = new URLSearchParams(window.location.search)
  const params = new URLSearchParams()
  const layout = current.get('layout')
  if (layout === 'split' || layout === 'wide') params.set('layout', layout)
  else if (layout === 'theater') params.set('layout', 'wide')
  params.set('metric', state.metric)
  params.set('scope', state.scope)
  params.set('top', String(state.top))
  params.set('bucket', String(state.bucket))
  params.set('rangeMode', state.rangeMode)
  if (state.rangeMode === 'date') params.set('date', state.date)
  const bucket = payload?.buckets?.[state.selectedBucketIndex]
  if (bucket) params.set('time', bucket)
  if (state.selectedStreamerId) params.set('streamer', state.selectedStreamerId)
  params.set('auto', state.autoUpdate && isLiveRange() ? 'on' : 'off')
  window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
}

function formatAxisTime(ms: number, payload: DayFlowPayload): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return '—'
  const time = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
  return payload.rangeMode === 'rolling24h' ? `${date.toISOString().slice(5, 10)} ${time}` : time
}

function formatBucket(input: string | undefined, includeDate: boolean): string {
  if (!input) return '—'
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return '—'
  const time = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`
  return includeDate ? `${date.toISOString().slice(0, 10)} ${time}` : time
}

function formatDateTime(input: unknown): string {
  if (typeof input !== 'string' || !input) return '—'
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? '—' : `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

function compactNumber(value: number): string {
  const safe = safeNumber(value)
  if (Math.abs(safe) >= 1_000_000) return `${(safe / 1_000_000).toFixed(1)}M`
  if (Math.abs(safe) >= 1_000) return `${(safe / 1_000).toFixed(1)}K`
  return String(Math.round(safe))
}

function signedNumber(value: number): string {
  const safe = Math.round(safeNumber(value))
  return safe > 0 ? `+${compactNumber(safe)}` : safe < 0 ? `−${compactNumber(Math.abs(safe))}` : '—'
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function validTime(input: unknown): number | null {
  if (typeof input !== 'string') return null
  const value = Date.parse(input)
  return Number.isFinite(value) ? value : null
}

function validDate(input: unknown): string | null {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null
  const value = new Date(`${input}T00:00:00.000Z`)
  return Number.isNaN(value.getTime()) ? null : input
}

function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function label(input: string): string {
  return input.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function setHtml(selector: string, html: string): void {
  const target = document.querySelector<HTMLElement>(selector)
  if (target) target.innerHTML = html
}

function escapeHtml(input: string): string {
  return String(input).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function escapeAttr(input: string): string {
  return escapeHtml(input).replace(/'/g, '&#39;')
}
