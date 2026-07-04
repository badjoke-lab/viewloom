export type DayFlowLayoutMode = 'split' | 'wide'

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

export type DayFlowSummaryPayload = {
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

export function normalizeDayFlowLayout(urlValue: string | null, storedValue: string | null): DayFlowLayoutMode {
  if (urlValue === 'wide' || urlValue === 'theater') return 'wide'
  if (urlValue === 'split') return 'split'
  if (storedValue === 'wide' || storedValue === 'theater') return 'wide'
  if (storedValue === 'split') return 'split'
  return 'wide'
}

export function applyDayFlowLayout(requestedLayout: DayFlowLayoutMode): DayFlowLayoutMode {
  const shell = document.querySelector<HTMLElement>('[data-dayflow-layout-shell]')
  if (!shell) return 'wide'
  const effectiveLayout: DayFlowLayoutMode = window.innerWidth <= desktopBreakpoint ? 'wide' : requestedLayout
  shell.classList.toggle('is-split', effectiveLayout === 'split')
  shell.classList.toggle('is-wide', effectiveLayout === 'wide')
  shell.dataset.dayflowLayoutCurrent = effectiveLayout
  shell.dataset.dayflowLayoutRequested = requestedLayout

  document.querySelectorAll<HTMLButtonElement>('[data-dayflow-layout]').forEach((button) => {
    const active = button.dataset.dayflowLayout === requestedLayout
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  return effectiveLayout
}

export function renderEnhancedDayFlowSummary(root: HTMLElement, payload: DayFlowSummaryPayload): boolean {
  const buckets = payload.buckets ?? []
  const bands = (payload.bands ?? []).filter((band) => !isOthers(band))
  const totals = normalizedTotals(payload, buckets.length)
  const observedIndexes = totals.map((value, index) => value > 0 ? index : -1).filter((index) => index >= 0)

  if (buckets.length === 0 || bands.length === 0 || observedIndexes.length === 0) return false

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

  root.innerHTML = `<div class="dayflow-summary-overview"><div class="dayflow-summary-stats">${cards}</div><div class="dayflow-summary-bottom"><div class="dayflow-summary-ranking"><div class="dayflow-summary-subhead"><strong>Top by viewer-minutes</strong><span>Current Top ${payload.topN ?? bands.length}</span></div>${rankingRows || '<div class="notice">No ranked viewer-minute data.</div>'}</div><div class="dayflow-summary-reading"><small>Day reading</small><strong>${escapeHtml(fieldDirection)}</strong><p>${escapeHtml(competition)}</p><p>${escapeHtml(movement)}</p></div></div></div>`
  return true
}

function normalizedTotals(payload: DayFlowSummaryPayload, count: number): number[] {
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
