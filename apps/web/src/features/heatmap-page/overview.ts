import './summary-legend.css'
import {
  buildHeatmapOverview,
  formatActivity,
  formatMomentum,
  momentumLabel,
  type HeatmapOverview,
} from './summary-legend-core.mjs'
import type { HeatmapProviderKey } from './data-state-core.mjs'

type RefreshPhase = 'starting' | 'waiting' | 'refreshing' | 'error'

type RefreshState = {
  intervalMs: number
  nextRefreshAt: number | null
  lastRefreshAt: number | null
  phase: RefreshPhase
  message?: string
}

const DEFAULT_INTERVAL_MS = 60_000
let currentOverview: HeatmapOverview | null = null
let refreshState: RefreshState = {
  intervalMs: DEFAULT_INTERVAL_MS,
  nextRefreshAt: null,
  lastRefreshAt: null,
  phase: 'starting',
}
let countdownTimer: number | null = null

export function installHeatmapOverview(provider: HeatmapProviderKey): () => void {
  ensureOverviewShell()
  ensureRefreshStatus()
  renderRefreshState()

  const onRequestStart = (): void => {
    refreshState = { ...refreshState, phase: 'refreshing', message: 'Reading latest stored snapshot…' }
    renderRefreshState()
  }
  const onResponse = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey; raw?: unknown }>).detail
    if (detail?.provider && detail.provider !== provider) return
    currentOverview = buildHeatmapOverview(detail?.raw, provider)
    renderOverview(currentOverview)
    const now = Date.now()
    refreshState = {
      ...refreshState,
      phase: 'waiting',
      lastRefreshAt: now,
      nextRefreshAt: now + refreshState.intervalMs,
      message: undefined,
    }
    renderRefreshState()
  }
  const onResponseError = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey; message?: string }>).detail
    if (detail?.provider && detail.provider !== provider) return
    refreshState = {
      ...refreshState,
      phase: 'error',
      nextRefreshAt: Date.now() + refreshState.intervalMs,
      message: detail?.message || 'Latest snapshot check failed.',
    }
    renderRefreshState()
  }

  window.addEventListener('viewloom:heatmap-request-start', onRequestStart)
  window.addEventListener('viewloom:heatmap-response', onResponse)
  window.addEventListener('viewloom:heatmap-response-error', onResponseError)
  countdownTimer = window.setInterval(renderRefreshState, 1_000)

  return () => {
    window.removeEventListener('viewloom:heatmap-request-start', onRequestStart)
    window.removeEventListener('viewloom:heatmap-response', onResponse)
    window.removeEventListener('viewloom:heatmap-response-error', onResponseError)
    if (countdownTimer !== null) window.clearInterval(countdownTimer)
    countdownTimer = null
    currentOverview = null
  }
}

function ensureOverviewShell(): void {
  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const support = root?.querySelector<HTMLElement>('.support-grid--feature, [data-heatmap-overview-support]')
  if (!root || !support) return

  if (!root.querySelector('[data-heatmap-overview-summary]')) {
    const summary = document.createElement('section')
    summary.className = 'heatmap-overview-summary'
    summary.dataset.heatmapOverviewSummary = 'true'
    summary.setAttribute('aria-label', 'Heatmap snapshot summary')
    summary.innerHTML = `
      ${summaryCard('Active observed records', 'heatmap-overview-streams')}
      ${summaryCard('Total observed viewers', 'heatmap-overview-viewers')}
      ${summaryCard('Strongest momentum', 'heatmap-overview-momentum')}
      ${summaryCard('Highest available activity', 'heatmap-overview-activity')}
    `
    support.before(summary)
  }

  support.className = 'heatmap-overview-support'
  support.dataset.heatmapOverviewSupport = 'true'
  support.innerHTML = `
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Legend</div>
      <h2>How to read the field</h2>
      <div id="heatmap-final-legend">Waiting for the latest snapshot.</div>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Snapshot status</div>
      <h2 id="heatmap-status-title">Loading</h2>
      <p id="heatmap-status-body">Reading the latest stored snapshot.</p>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Coverage and limitations</div>
      <h2>What this field represents</h2>
      <div id="heatmap-final-coverage"><p>Waiting for coverage details.</p></div>
    </article>
  `
}

function ensureRefreshStatus(): void {
  const dock = document.querySelector<HTMLElement>('.heatmap-control-dock__map')
  if (!dock || dock.querySelector('#heatmap-refresh-state')) return

  const status = document.createElement('div')
  status.id = 'heatmap-refresh-state'
  status.className = 'heatmap-refresh-state'
  status.dataset.phase = 'starting'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.innerHTML = `
    <span class="heatmap-map-control" aria-hidden="true">Auto refresh: On</span>
    <span id="heatmap-auto-refresh-copy" class="heatmap-refresh-state__copy">Starting automatic refresh…</span>
  `
  dock.appendChild(status)
}

function renderOverview(overview: HeatmapOverview): void {
  ensureOverviewShell()
  setSummary('heatmap-overview-streams', overview.activeRecords.toLocaleString(), 'Every valid record in the current snapshot remains represented in the field.')
  setSummary('heatmap-overview-viewers', overview.totalViewers.toLocaleString(), `Observed across ${overview.activeRecords.toLocaleString()} live records in this snapshot.`)

  if (overview.strongestMomentum) {
    const item = overview.strongestMomentum
    setSummary(
      'heatmap-overview-momentum',
      item.displayName,
      `${momentumLabel(item.momentum)} · ${formatMomentum(item.momentum)} · ${item.viewers.toLocaleString()} viewers.`,
    )
  } else {
    setSummary('heatmap-overview-momentum', 'Unavailable', 'No valid momentum record is present in this snapshot.')
  }

  if (overview.activityState === 'available' && overview.highestActivity) {
    const item = overview.highestActivity
    setSummary('heatmap-overview-activity', item.displayName, `${formatActivity(item.activity)} sampled activity · ${item.viewers.toLocaleString()} viewers.`)
  } else if (overview.activityState === 'zero') {
    setSummary('heatmap-overview-activity', 'Zero observed', 'Activity was sampled, but the current field contains no positive activity value.')
  } else if (overview.activityState === 'unavailable') {
    setSummary('heatmap-overview-activity', 'Unavailable', 'The current snapshot does not provide a usable activity signal.')
  } else {
    setSummary('heatmap-overview-activity', 'Not sampled', 'Activity was not sampled in the current observation window.')
  }

  setHtml('#heatmap-final-legend', renderLegend(overview))
  setHtml('#heatmap-final-coverage', renderTextList(overview.coverageLines))
}

function renderLegend(overview: HeatmapOverview): string {
  return `<ul class="heatmap-overview-list">
    ${legendItem('area', overview.legend.area)}
    ${legendItem('rising', overview.legend.rising)}
    ${legendItem('falling', overview.legend.falling)}
    ${legendItem('stable', overview.legend.stable)}
    ${legendItem('activity', overview.legend.activity)}
  </ul>`
}

function renderRefreshState(): void {
  const root = document.querySelector<HTMLElement>('#heatmap-refresh-state')
  const copy = document.querySelector<HTMLElement>('#heatmap-auto-refresh-copy')
  if (!root || !copy) return

  root.dataset.phase = refreshState.phase
  if (refreshState.phase === 'refreshing') {
    copy.textContent = refreshState.message || 'Reading latest stored snapshot…'
  } else if (refreshState.phase === 'error') {
    copy.textContent = `${refreshState.message || 'Last snapshot check failed'} · automatic retry remains on`
  } else if (refreshState.nextRefreshAt) {
    const seconds = Math.max(0, Math.ceil((refreshState.nextRefreshAt - Date.now()) / 1_000))
    copy.textContent = seconds > 0
      ? `Next stored-snapshot check in ${seconds}s`
      : 'Waiting for the next visible-tab snapshot check'
  } else {
    copy.textContent = 'Automatic stored-snapshot refresh is on · 60s cadence · manual Refresh remains available'
  }
}

function summaryCard(label: string, id: string): string {
  return `<article id="${id}" class="heatmap-overview-card"><div class="heatmap-overview-card__label">${escapeHtml(label)}</div><div class="heatmap-overview-card__value">—</div><p>Waiting for the latest snapshot.</p></article>`
}

function setSummary(id: string, value: string, body: string): void {
  const card = document.getElementById(id)
  const valueNode = card?.querySelector<HTMLElement>('.heatmap-overview-card__value')
  const bodyNode = card?.querySelector<HTMLElement>('p')
  if (valueNode) valueNode.textContent = value
  if (bodyNode) bodyNode.textContent = body
}

function legendItem(kind: string, copy: string): string {
  return `<li><span class="heatmap-overview-swatch heatmap-overview-swatch--${kind}" aria-hidden="true"></span><span>${escapeHtml(copy)}</span></li>`
}

function renderTextList(lines: string[]): string {
  return `<ul class="heatmap-overview-list">${lines.map((line) => `<li><span>${escapeHtml(line)}</span></li>`).join('')}</ul>`
}

function setHtml(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) element.innerHTML = value
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}
