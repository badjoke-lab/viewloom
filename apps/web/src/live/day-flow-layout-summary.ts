const summaryRoot = document.querySelector<HTMLElement>('[data-dayflow-summary]')
const chartRoot = document.querySelector<HTMLElement>('[data-dayflow-stage]')
const detailRoot = document.querySelector<HTMLElement>('[data-dayflow-detail]')
const layoutButtons = document.querySelectorAll<HTMLButtonElement>('[data-dayflow-layout]')
const page = document.querySelector<HTMLElement>('main.page')
const summaryApi = document.body.dataset.provider === 'kick' ? '/api/kick-day-flow' : '/api/day-flow'
const summaryFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

type SummaryPayload = {
  state?: string
  status?: string
  source?: string
  updatedAt?: string
  granularity?: string
  coverage?: { observedBuckets?: number; totalBuckets?: number }
  lines?: Array<{
    id?: string
    name?: string
    title?: string
    latestViewers?: number
    peakViewers?: number
    observedMinutes?: number
  }>
}

let summaryTimer: number | null = null
let summaryPayload: SummaryPayload | null = null
let summaryKey = ''
let summaryWriting = false

setupLayout()
setupSummary()

function setupLayout(): void {
  const requested = new URL(window.location.href).searchParams.get('layout')
  const initialLayout = requested === 'split' ? 'split' : 'wide'
  applyLayout(false, initialLayout)

  layoutButtons.forEach((button) => button.addEventListener('click', () => {
    const nextLayout = button.dataset.dayflowLayout === 'split' ? 'split' : 'wide'
    applyLayout(true, nextLayout)
  }))
}

function applyLayout(updateUrl: boolean, explicitLayout?: 'wide' | 'split'): void {
  const requestedLayout = explicitLayout ?? (document.querySelector<HTMLButtonElement>('[data-dayflow-layout].active')?.dataset.dayflowLayout === 'split' ? 'split' : 'wide')
  const canSplit = window.matchMedia('(min-width: 1180px)').matches
  const layout = requestedLayout === 'split' && canSplit ? 'split' : 'wide'

  page?.classList.toggle('dayflow-layout-wide', layout === 'wide')
  page?.classList.toggle('dayflow-layout-split', layout === 'split')
  layoutButtons.forEach((button) => {
    const active = button.dataset.dayflowLayout === layout
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
    button.disabled = button.dataset.dayflowLayout === 'split' && !canSplit
  })

  if (chartRoot && detailRoot) {
    chartRoot.classList.toggle('dayflow-chart--split', layout === 'split')
    detailRoot.classList.toggle('dayflow-detail--split', layout === 'split')
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

  document.querySelector<HTMLInputElement>('[data-dayflow-date]')?.addEventListener('change', () => scheduleSummaryRefresh())
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
  if (!summaryRoot) return
  const key = currentRequestKey()
  const response = await fetch(`${summaryApi}?${key}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
  const payload = await response.json() as SummaryPayload
  summaryPayload = payload
  summaryKey = key
  renderEnhancedSummary(payload)
}

function renderEnhancedSummary(payload: SummaryPayload): void {
  if (!summaryRoot) return
  summaryWriting = true
  const lines = payload.lines ?? []
  const leader = lines.slice().sort((left, right) => (right.latestViewers ?? 0) - (left.latestViewers ?? 0))[0]
  const fastest = lines.slice().sort((left, right) => (right.peakViewers ?? 0) - (left.peakViewers ?? 0))[0]
  const observed = payload.coverage?.observedBuckets ?? 0
  const total = payload.coverage?.totalBuckets ?? observed

  summaryRoot.innerHTML = `<div class="dayflow-summary-overview"><div><small>State</small><strong>${escapeHtml(label(payload.state ?? payload.status ?? 'unknown'))}</strong></div><div><small>Coverage</small><strong>${observed}/${total}</strong></div><div><small>Current leader</small><strong>${escapeHtml(leader?.name ?? '—')}</strong><span>${formatNumber(leader?.latestViewers)}</span></div><div><small>Largest peak</small><strong>${escapeHtml(fastest?.name ?? '—')}</strong><span>${formatNumber(fastest?.peakViewers)}</span></div><div><small>Updated</small><strong>${formatTime(payload.updatedAt)}</strong></div></div>`
  summaryWriting = false
}

function currentRequestKey(): string {
  const params = new URLSearchParams()
  const date = document.querySelector<HTMLInputElement>('[data-dayflow-date]')?.value
  const bucket = document.querySelector<HTMLButtonElement>('[data-dayflow-bucket].active')?.dataset.dayflowBucket
  const metric = document.querySelector<HTMLButtonElement>('[data-dayflow-metric].active')?.dataset.dayflowMetric
  const top = document.querySelector<HTMLButtonElement>('[data-dayflow-top].active')?.dataset.dayflowTop
  if (date) params.set('date', date)
  if (bucket) params.set('bucket', bucket)
  if (metric) params.set('metric', metric)
  if (top) params.set('top', top)
  return params.toString()
}

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatNumber(value: number | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? summaryFormatter.format(value) : '—'
}

function formatTime(value: string | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : `${date.toISOString().slice(11, 16)} UTC`
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
