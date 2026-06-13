type LayoutMode = 'split' | 'wide'

type DayFlowBucket = {
  viewers?: number
  share?: number
}

type DayFlowBand = {
  streamerId?: string
  name?: string
  isOthers?: boolean
  totalViewerMinutes?: number
  viewerMinutes?: number
  buckets?: DayFlowBucket[]
}

type DayFlowPayload = {
  buckets?: string[]
  bucketSize?: number
  topN?: number
  totalViewersByBucket?: number[]
  bands?: DayFlowBand[]
}

type DeltaPoint = {
  band: DayFlowBand
  delta: number
  index: number
}

type LeaderRun = {
  band: DayFlowBand
  start: number
  end: number
  count: number
}

const desktopBreakpoint = 1000
const shell = document.querySelector<HTMLElement>('[data-dayflow-layout-shell]')
const layoutButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-dayflow-layout]')]
const summaryRoot = document.querySelector<HTMLElement>('[data-dayflow-summary]')
const provider = document.body.dataset.provider === 'kick' ? 'kick' : 'twitch'
const endpoint = provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const storageKey = `viewloom:${provider}:dayflow-layout`
let requestedLayout = readInitialLayout()
let summaryPayload: DayFlowPayload | null = null
let summaryKey = ''
let summaryWriting = false
let summaryTimer: number | null = null

setupLayout()
setupSummary()

function setupLayout(): void {
  if (!shell) return

  for (const button of layoutButtons) {
    button.addEventListener('click', () => {
      requestedLayout = button.dataset.dayflowLayout === 'wide' ? 'wide' : 'split'
      window.localStorage.setItem(storageKey, requestedLayout)
      applyLayout(true)
    })
  }

  window.addEventListener('resize', () => applyLayout(false))
  window.addEventListener('popstate', () => {
    requestedLayout = readInitialLayout()
    applyLayout(false)
  })

  applyLayout(true)
}

function readInitialLayout(): LayoutMode {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('layout')
  if (fromUrl === 'wide' || fromUrl === 'theater') return 'wide'
  if (fromUrl === 'split') return 'split'

  const saved = window.localStorage.getItem(storageKey)
  if (saved === 'wide' || saved === 'theater') return 'wide'
  if (saved === 'split') return 'split'

  return 'split'
}

function applyLayout(updateUrl: boolean): void {
  if (!shell) return
  const effectiveLayout: LayoutMode = window.innerWidth <= desktopBreakpoint ? 'wide' : requestedLayout
  shell.classList.toggle('is-split', effectiveLayout === 'split')
  shell.classList.toggle('is-wide', effectiveLayout === 'wide')
  shell.dataset.dayflowLayoutCurrent = effectiveLayout

  for (const button of layoutButtons) {
    const active = button.dataset.dayflowLayout === requestedLayout
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  }

  if (!updateUrl) return
  const url = new URL(window.location.href)
  url.searchParams.set('layout', requestedLayout)
  window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`)
}

function setupSummary(): void {
  if (!summaryRoot) return

  const observer = new MutationObserver(() => {
    if (summaryWriting || !summaryPayload || summaryKey !== currentRequestKey()) return
    if (!summaryRoot.querySelector('.dayflow-summary-overview')) renderEnhancedSummary(summaryPayload)
  })
  observer.observe(summaryRoot, { childList: true, subtree: true })

  const toolbar = document.querySelector<HTMLElement>('.dayflow-toolbar')
  toolbar?.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target || target.hasAttribute('data-dayflow-layout')) return
    scheduleSummaryRefresh()
    window.setTimeout(() => applyLayout(true), 0)
  })

  document.querySelector<HTMLInputElement>('[data-dayflow-date]')?.addEventListener('change', scheduleSummaryRefresh)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleSummaryRefresh(0)
  })

  window.setInterval(() => {
    const auto = document.querySelector<HTMLButtonElement>('[data-dayflow-auto]')
    if (!document.hidden && auto?.classList.contains('active')) scheduleSummaryRefresh(0)
  }, 60_000)

  scheduleSummaryRefresh(0)
}

function scheduleSummaryRefresh(delay = 120): void {
  if (summaryTimer !== null) window.clearTimeout(summaryTimer)
  summaryTimer = window.setTimeout(() => {
    summaryTimer = null
    void refreshSummary()
  }, delay)
}

async function refreshSummary(): Promise<void> {
  const key = currentRequestKey()
  try {
    const response = await fetch(`${endpoint}?${key}`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return
    const payload = await response.json() as DayFlowPayload
    summaryPayload = payload
    summaryKey = key
    renderEnhancedSummary(payload)
  } catch {
    // The primary Day Flow renderer owns the visible error state.
  }
}

function currentRequestKey(): string {
  const metric = activeValue('dayflowMetric', 'volume')
  const top = activeValue('dayflowTop', '20')
  const bucket = activeValue('dayflowBucket', '5')
  const rangeMode = activeValue('dayflowRange', 'today')
  const params = new URLSearchParams({ metric, top, bucket, rangeMode })
  if (rangeMode === 'date') {
    const date = document.querySelector<HTMLInputElement>('[data-dayflow-date]')?.value
    if (date) params.set('date', date)
  }
  return params.toString()
}

function activeValue(datasetKey: string, fallback: string): string {
  const selector = `[data-${datasetKey.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}].active`
  const active = document.querySelector<HTMLButtonElement>(selector)
  return active?.dataset[datasetKey] ?? fallback
}

function renderEnhancedSummary(payload: DayFlowPayload): void {
  if (!summaryRoot) return
  const buckets = payload.buckets ?? []
  const bands = (payload.bands ?? []).filter((band) => !isOthers(band))
  const totals = normalizedTotals(payload, buckets.length)
  const observedIndexes = totals.map((value, index) => value > 0 ? index : -1).filter((index) => index >= 0)

  if (buckets.length === 0 || bands.length === 0 || observedIndexes.length === 0) return

  const bucketSize = Number(payload.bucketSize) === 10 ? 10 : 5
  const peakIndex = observedIndexes.reduce((best, index) => totals[index] > totals[best] ? index : best, observedIndexes[0])
  const peakTotal = totals[peakIndex] ?? 0
  const averageTotal = Math.round(observedIndexes.reduce((sum, index) => sum + (totals[index] ?? 0), 0) / observedIndexes.length)
  const viewerMinutes = observedIndexes.reduce((sum, index) => sum + (totals[index] ?? 0) * bucketSize, 0)
  const leaderStats = calculateLeaderStats(bands, observedIndexes)
  const biggestRise = calculateDelta(bands, observedIndexes, 'rise')
  const biggestDrop = calculateDelta(bands, observedIndexes, 'drop')
  const peakShare = calculatePeakShare(bands, observedIndexes)
  const ranked = [...bands]
    .map((band) => ({ band, value: bandViewerMinutes(band, bucketSize) }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
  const maxRankValue = Math.max(1, ...ranked.map((entry) => entry.value))
  const denominator = Math.max(1, viewerMinutes)
  const longest = leaderStats.longest
  const leadChanges = leaderStats.changes

  const cards = [
    summaryCard('Peak field', formatCompact(peakTotal), formatTime(buckets[peakIndex])),
    summaryCard('Average field', formatCompact(averageTotal), `${observedIndexes.length} observed buckets`),
    summaryCard('Viewer-minutes', formatLarge(viewerMinutes), `${bucketSize}m bucket integration`),
    summaryCard('Longest lead', longest ? bandName(longest.band) : '—', longest ? `${formatDuration(longest.count * bucketSize)} · ${formatTimeRange(buckets, longest.start, longest.end)}` : 'No leader run'),
    summaryCard('Lead changes', formatInteger(leadChanges), `${leaderStats.uniqueLeaders} unique leaders`),
    summaryCard('Biggest rise', biggestRise ? bandName(biggestRise.band) : '—', biggestRise ? `${formatSigned(biggestRise.delta)} · ${formatTime(buckets[biggestRise.index])}` : 'No positive move'),
    summaryCard('Biggest drop', biggestDrop ? bandName(biggestDrop.band) : '—', biggestDrop ? `${formatSigned(biggestDrop.delta)} · ${formatTime(buckets[biggestDrop.index])}` : 'No negative move'),
    summaryCard('Peak global share', peakShare ? bandName(peakShare.band) : '—', peakShare ? `${formatPercent(peakShare.share)} · ${formatTime(buckets[peakShare.index])}` : 'Unavailable'),
  ].join('')

  const rankingRows = ranked.map((entry, index) => {
    const width = Math.max(2, Math.min(100, entry.value / maxRankValue * 100))
    return `<div class="dayflow-summary-rank" title="${escapeHtml(bandName(entry.band))}"><b>${index + 1}</b><strong>${escapeHtml(bandName(entry.band))}</strong><span>${formatLarge(entry.value)}</span><span>${formatPercent(entry.value / denominator)}</span><i style="width:${width.toFixed(2)}%"></i></div>`
  }).join('')

  const fieldDirection = peakIndex > observedIndexes[Math.floor(observedIndexes.length / 2)] ? 'The field peaked in the later part of the selected window.' : 'The field peaked in the earlier part of the selected window.'
  const competition = leadChanges === 0 ? 'The same stream held the observed lead throughout the usable window.' : `${leadChanges} lead changes show how often the top position changed hands.`
  const movement = biggestRise && biggestDrop ? `${bandName(biggestRise.band)} produced the largest positive bucket move; ${bandName(biggestDrop.band)} produced the largest negative move.` : 'Bucket-to-bucket movement is limited in this window.'

  summaryWriting = true
  summaryRoot.innerHTML = `<div class="dayflow-summary-overview"><div class="dayflow-summary-stats">${cards}</div><div class="dayflow-summary-bottom"><div class="dayflow-summary-ranking"><div class="dayflow-summary-subhead"><strong>Top by viewer-minutes</strong><span>Current Top ${payload.topN ?? bands.length}</span></div>${rankingRows || '<div class="notice">No ranked viewer-minute data.</div>'}</div><div class="dayflow-summary-reading"><small>Day reading</small><strong>${escapeHtml(fieldDirection)}</strong><p>${escapeHtml(competition)}</p><p>${escapeHtml(movement)}</p></div></div></div>`
  summaryWriting = false
}

function normalizedTotals(payload: DayFlowPayload, count: number): number[] {
  const given = payload.totalViewersByBucket ?? []
  if (given.some((value) => safeNumber(value) > 0)) return Array.from({ length: count }, (_, index) => safeNumber(given[index]))
  const bands = payload.bands ?? []
  return Array.from({ length: count }, (_, index) => bands.reduce((sum, band) => sum + safeNumber(band.buckets?.[index]?.viewers), 0))
}

function calculateLeaderStats(bands: DayFlowBand[], indexes: number[]): { longest: LeaderRun | null; changes: number; uniqueLeaders: number } {
  let longest: LeaderRun | null = null
  let current: LeaderRun | null = null
  let previousId = ''
  let changes = 0
  const unique = new Set<string>()

  for (const index of indexes) {
    const leader = bands.reduce<DayFlowBand | null>((best, band) => viewerAt(band, index) > viewerAt(best, index) ? band : best, null)
    if (!leader || viewerAt(leader, index) <= 0) {
      current = null
      previousId = ''
      continue
    }

    const id = bandId(leader)
    unique.add(id)
    if (previousId && previousId !== id) changes += 1

    if (current && bandId(current.band) === id && index === current.end + 1) {
      current.end = index
      current.count += 1
    } else {
      current = { band: leader, start: index, end: index, count: 1 }
    }

    if (!longest || current.count > longest.count) longest = { ...current }
    previousId = id
  }

  return { longest, changes, uniqueLeaders: unique.size }
}

function calculateDelta(bands: DayFlowBand[], indexes: number[], mode: 'rise' | 'drop'): DeltaPoint | null {
  let best: DeltaPoint | null = null
  const indexSet = new Set(indexes)
  for (const band of bands) {
    for (const index of indexes) {
      if (index <= 0 || !indexSet.has(index - 1)) continue
      const delta = viewerAt(band, index) - viewerAt(band, index - 1)
      if (mode === 'rise' && delta <= 0) continue
      if (mode === 'drop' && delta >= 0) continue
      if (!best || (mode === 'rise' ? delta > best.delta : delta < best.delta)) best = { band, delta, index }
    }
  }
  return best
}

function calculatePeakShare(bands: DayFlowBand[], indexes: number[]): { band: DayFlowBand; share: number; index: number } | null {
  let best: { band: DayFlowBand; share: number; index: number } | null = null
  for (const band of bands) {
    for (const index of indexes) {
      const share = safeNumber(band.buckets?.[index]?.share)
      if (!best || share > best.share) best = { band, share, index }
    }
  }
  return best
}

function bandViewerMinutes(band: DayFlowBand, bucketSize: number): number {
  const direct = safeNumber(band.totalViewerMinutes ?? band.viewerMinutes)
  if (direct > 0) return direct
  return (band.buckets ?? []).reduce((sum, bucket) => sum + safeNumber(bucket.viewers) * bucketSize, 0)
}

function viewerAt(band: DayFlowBand | null, index: number): number {
  return safeNumber(band?.buckets?.[index]?.viewers)
}

function isOthers(band: DayFlowBand): boolean {
  return band.isOthers === true || bandId(band) === 'others' || bandName(band).toLowerCase() === 'others'
}

function bandId(band: DayFlowBand): string {
  return String(band.streamerId ?? band.name ?? '')
}

function bandName(band: DayFlowBand): string {
  return String(band.name ?? band.streamerId ?? 'Unknown')
}

function summaryCard(label: string, value: string, detail: string): string {
  return `<div class="dayflow-summary-stat"><small>${escapeHtml(label)}</small><strong title="${escapeHtml(value)}">${escapeHtml(value)}</strong><span title="${escapeHtml(detail)}">${escapeHtml(detail)}</span></div>`
}

function formatTime(value: string | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} UTC`
}

function formatTimeRange(buckets: string[], start: number, end: number): string {
  return `${formatTime(buckets[start]).replace(' UTC', '')}–${formatTime(buckets[end])}`
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours <= 0) return `${rest}m`
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.round(value))
}

function formatLarge(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}K`
  return formatInteger(value)
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en').format(Math.round(value))
}

function formatSigned(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatCompact(Math.abs(value))}`
}

function formatPercent(value: number): string {
  const percent = value <= 1 ? value * 100 : value
  return `${percent.toFixed(percent >= 10 ? 1 : 2)}%`
}

function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character)
}
