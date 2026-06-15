import './summary-legend.css'
import {
  buildHeatmapOverview,
  formatActivity,
  formatMomentum,
  momentumLabel,
  type HeatmapOverview,
} from './summary-legend-core.mjs'
import type { HeatmapProviderKey } from './data-state-core.mjs'

type RefreshPhase = 'starting' | 'waiting' | 'refreshing' | 'paused' | 'error'

type RefreshState = {
  enabled: boolean
  intervalMs: number
  nextRefreshAt: number | null
  lastRefreshAt: number | null
  phase: RefreshPhase
  message?: string
}

const DEFAULT_INTERVAL_MS = 60_000
let currentOverview: HeatmapOverview | null = null
let refreshState: RefreshState = {
  enabled: true,
  intervalMs: DEFAULT_INTERVAL_MS,
  nextRefreshAt: null,
  lastRefreshAt: null,
  phase: 'starting',
}
let countdownTimer: number | null = null

export function installHeatmapOverview(provider: HeatmapProviderKey): () => void {
  ensureOverviewShell()
  ensureRefreshControl()
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
    refreshState = {
      ...refreshState,
      phase: refreshState.enabled ? 'waiting' : 'paused',
      lastRefreshAt: Date.now(),
      message: undefined,
    }
    renderRefreshState()
  }
  const onResponseError = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey; message?: string }>).detail
    if (detail?.provider && detail.provider !== provider) return
    refreshState = { ...refreshState, phase: 'error', message: detail?.message || 'Latest snapshot check failed.' }
    renderRefreshState()
  }
  const onRefreshState = (event: Event): void => {
    const detail = (event as CustomEvent<Partial<RefreshState>>).detail
    refreshState = {
      ...refreshState,
      ...detail,
      intervalMs: detail?.intervalMs ?? refreshState.intervalMs,
      phase: detail?.phase ?? (detail?.enabled === false ? 'paused' : refreshState.phase),
    }
    renderRefreshState()
  }
  const onToggle = (): void => {
    window.dispatchEvent(new CustomEvent('viewloom:heatmap-auto-refresh-toggle', {
      detail: { enabled: !refreshState.enabled },
    }))
  }

  window.addEventListener('viewloom:heatmap-request-start', onRequestStart)
  window.addEventListener('viewloom:heatmap-response', onResponse)
  window.addEventListener('viewloom:heatmap-response-error', onResponseError)
  window.addEventListener('viewloom:heatmap-auto-refresh-state', onRefreshState)
  document.querySelector<HTMLButtonElement>('#heatmap-auto-refresh-toggle')?.addEventListener('click', onToggle)
  countdownTimer = window.setInterval(renderRefreshState, 1_000)

  return () => {
    window.removeEventListener('viewloom:heatmap-request-start', onRequestStart)
    window.removeEventListener('viewloom:heatmap-response', onResponse)
    window.removeEventListener('viewloom:heatmap-response-error', onResponseError)
    window.removeEventListener('viewloom:heatmap-auto-refresh-state', onRefreshState)
    document.querySelector<HTMLButtonElement>('#heatmap-auto-refresh-toggle')?.removeEventListener('click', onToggle)
    if (countdownTimer !== null) window.clearInterval(countdownTimer)
    countdownTimer = null
    currentOverview = null
  }
}

function ensureOverviewShell(): void {
  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const support = root?.querySelector<HTMLElement>('.support-grid--feature')
  if (!root || !support) return

  if (!root.querySelector('[data-heatmap-overview-summary]')) {
    const summary = document.createElement('section')
    summary.className = 'heatmap-overview-summary'
    summary.dataset.heatmapOverviewSummary = 'true'
    summary.setAttribute('aria-label', 'Heatmap snapshot summary')
    summary.innerHTML = `
      ${summaryCard('Active observed records', 'heatmap-summary-streams')}
      ${summaryCard('Total observed viewers', 'heatmap-summary-viewers')}
      ${summaryCard('Strongest momentum', 'heatmap-summary-momentum')}
      ${summaryCard('Highest available activity', 'heatmap-summary-activity')}
    `
    support.before(summary)
  }

  support.className = 'heatmap-overview-support'
  support.dataset.heatmapOverviewSupport = 'true'
  support.innerHTML = `
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Legend</div>
      <h2>How to read the field</h2>
      <div id="heatmap-legend-body">Waiting for the latest snapshot.</div>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Snapshot status</div>
      <h2 id="heatmap-status-title">Loading</h2>
      <p id="heatmap-status-body">Reading the latest stored snapshot.</p>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">Coverage and limitations</div>
      <h2>What this field represents</h2>
      <div id="heatmap-support-coverage"><p>Waiting for coverage details.</p></div>
    </article>
  `
}

function ensureRefreshControl(): void {
  const dock = document.querySelector<HTMLElement>('.heatmap-control-dock__map')
  if (!dock || dock.querySelector('#heatmap-refresh-state')) return

  const control = document.createElement('div')
  control.id = 'heatmap-refresh-state'
  control.className = 'heatmap-refresh-state'
  control.dataset.phase = 'starting'
  control.innerHTML = `
    <button id="heatmap-auto-refresh-toggle" class="heatmap-map-control" type="button" aria-pressed="true">Auto refresh: On</button>
    <span id="heatmap-auto-refresh-copy" class="heatmap-refresh-state__copy" aria-live="polite">Starting automatic refresh…</span>
  `
  dock.appendChild(control)
}

function renderOverview(overview: HeatmapOverview): void {
  setSummary('heatmap-summary-streams', overview.activeRecords.toLocaleString(), 'Every valid record in the current snapshot remains represented in the field.')
  setSummary('heatmap-summary-viewers', overview.totalViewers.toLocaleString(), `Observed across ${overview.activeRecords.toLocaleString()} live records in this snapshot.`)

  if (overview.strongestMomentum) {
    const item = overview.strongestMomentum
    setSummary(
      'heatmap-summary-momentum',
      item.displayName,
      `${momentumLabel(item.momentum)} · ${formatMomentum(item.momentum)} · ${item.viewers.toLocaleString()} viewers.`,
    )
  } else {
    setSummary('heatmap-summary-momentum', 'Unavailable', 'No valid momentum record is present in this snapshot.')
  }

  if (overview.activityState === 'available' && overview.highestActivity) {
    const item = overview.highestActivity
    setSummary('heatmap-summary-activity', item.displayName, `${formatActivity(item.activity)} sampled activity · ${item.viewers.toLocaleString()} viewers.`)
  } else if (overview.activityState === 'zero') {
    setSummary('heatmap-summary-activity', 'Zero observed', 'Activity was sampled, but the current field contains no positive activity value.')
  } else if (overview.activityState === 'unavailable') {
    setSummary('heatmap-summary-activity', 'Unavailable', 'The current snapshot does not provide a usable activity signal.')
  } else {
    setSummary('heatmap-summary-activity', 'Not sampled', 'Activity was not sampled in the current observation window.')
  }

  setHtml('#heatmap-legend-body', renderLegend(overview))
  setHtml('#heatmap-support-coverage', renderTextList(overview.coverageLines))
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
  const button = document.querySelector<HTMLButtonElement>('#heatmap-auto-refresh-toggle')
  const copy = document.querySelector<HTMLElement>('#heatmap-auto-refresh-copy')
  if (!root || !button || !copy) return

  root.dataset.phase = refreshState.phase
  button.textContent = `Auto refresh: ${refreshState.enabled ? 'On' : 'Off'}`
  button.setAttribute('aria-pressed', refreshState.enabled ? 'true' : 'false')

  if (!refreshState.enabled || refreshState.phase === 'paused') {
    copy.textContent = 'Paused · manual Refresh still reads the latest stored snapshot'
  } else if (refreshState.phase === 'refreshing') {
    copy.textContent = refreshState.message || 'Reading latest stored snapshot…'
  } else if (refreshState.phase === 'error') {
    copy.textContent = refreshState.message || 'Last snapshot check failed'
  } else if (refreshState.nextRefreshAt) {
    const seconds = Math.max(0, Math.ceil((refreshState.nextRefreshAt - Date.now()) / 1_000))
    copy.textContent = `Next stored-snapshot check in ${seconds}s`
  } else {
    copy.textContent = 'Automatic refresh is on'
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
