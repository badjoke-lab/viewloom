import './summary-legend.css'
import {
  buildHeatmapOverview,
  formatActivity,
  formatMomentum,
  type HeatmapOverview,
} from './summary-legend-core.mjs'
import type { HeatmapProviderKey } from './data-state-core.mjs'
import { localeFromPathname, type Locale } from '../../i18n/locale'
import {
  heatmapActivityLegend,
  heatmapMomentumLabel,
  heatmapNumber,
  heatmapReason,
  heatmapText,
} from '../../i18n/heatmap'

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
  const locale = localeFromPathname(window.location.pathname)
  ensureOverviewShell(locale)
  ensureRefreshStatus(locale)
  renderRefreshState(locale)

  const onRequestStart = (): void => {
    refreshState = { ...refreshState, phase: 'refreshing', message: heatmapText(locale, 'overview.refreshReading') }
    renderRefreshState(locale)
  }
  const onResponse = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey; raw?: unknown }>).detail
    if (detail?.provider && detail.provider !== provider) return
    currentOverview = buildHeatmapOverview(detail?.raw, provider)
    renderOverview(currentOverview, locale)
    const now = Date.now()
    refreshState = {
      ...refreshState,
      phase: 'waiting',
      lastRefreshAt: now,
      nextRefreshAt: now + refreshState.intervalMs,
      message: undefined,
    }
    renderRefreshState(locale)
  }
  const onResponseError = (event: Event): void => {
    const detail = (event as CustomEvent<{ provider?: HeatmapProviderKey; message?: string }>).detail
    if (detail?.provider && detail.provider !== provider) return
    refreshState = {
      ...refreshState,
      phase: 'error',
      nextRefreshAt: Date.now() + refreshState.intervalMs,
      message: locale === 'ja' ? heatmapText(locale, 'overview.refreshFailed') : detail?.message || heatmapText(locale, 'overview.refreshFailed'),
    }
    renderRefreshState(locale)
  }

  window.addEventListener('viewloom:heatmap-request-start', onRequestStart)
  window.addEventListener('viewloom:heatmap-response', onResponse)
  window.addEventListener('viewloom:heatmap-response-error', onResponseError)
  countdownTimer = window.setInterval(() => renderRefreshState(locale), 1_000)

  return () => {
    window.removeEventListener('viewloom:heatmap-request-start', onRequestStart)
    window.removeEventListener('viewloom:heatmap-response', onResponse)
    window.removeEventListener('viewloom:heatmap-response-error', onResponseError)
    if (countdownTimer !== null) window.clearInterval(countdownTimer)
    countdownTimer = null
    currentOverview = null
  }
}

function ensureOverviewShell(locale: Locale): void {
  const root = document.querySelector<HTMLElement>('#heatmap-layout-root')
  const support = root?.querySelector<HTMLElement>('.support-grid--feature, [data-heatmap-overview-support]')
  if (!root || !support) return

  if (!root.querySelector('[data-heatmap-overview-summary]')) {
    const summary = document.createElement('section')
    summary.className = 'heatmap-overview-summary'
    summary.dataset.heatmapOverviewSummary = 'true'
    summary.setAttribute('aria-label', heatmapText(locale, 'overview.aria'))
    summary.innerHTML = `
      ${summaryCard(heatmapText(locale, 'overview.active'), 'heatmap-overview-streams', locale)}
      ${summaryCard(heatmapText(locale, 'overview.viewers'), 'heatmap-overview-viewers', locale)}
      ${summaryCard(heatmapText(locale, 'overview.momentum'), 'heatmap-overview-momentum', locale)}
      ${summaryCard(heatmapText(locale, 'overview.activity'), 'heatmap-overview-activity', locale)}
    `
    support.before(summary)
  }

  support.className = 'heatmap-overview-support'
  support.dataset.heatmapOverviewSupport = 'true'
  support.innerHTML = `
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">${escapeHtml(heatmapText(locale, 'overview.legendLabel'))}</div>
      <h2>${escapeHtml(heatmapText(locale, 'overview.legendTitle'))}</h2>
      <div id="heatmap-final-legend">${escapeHtml(heatmapText(locale, 'overview.waiting'))}</div>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">${escapeHtml(heatmapText(locale, 'overview.snapshotLabel'))}</div>
      <h2 id="heatmap-status-title">${escapeHtml(heatmapText(locale, 'common.loading'))}</h2>
      <p id="heatmap-status-body">${escapeHtml(heatmapText(locale, 'overview.refreshReading'))}</p>
    </article>
    <article class="heatmap-overview-support__card">
      <div class="heatmap-overview-support__label">${escapeHtml(heatmapText(locale, 'overview.coverageLabel'))}</div>
      <h2>${escapeHtml(heatmapText(locale, 'overview.coverageTitle'))}</h2>
      <div id="heatmap-final-coverage"><p>${escapeHtml(heatmapText(locale, 'overview.waitingCoverage'))}</p></div>
    </article>
  `
}

function ensureRefreshStatus(locale: Locale): void {
  const dock = document.querySelector<HTMLElement>('.heatmap-control-dock__map')
  if (!dock || dock.querySelector('#heatmap-refresh-state')) return

  const status = document.createElement('div')
  status.id = 'heatmap-refresh-state'
  status.className = 'heatmap-refresh-state'
  status.dataset.phase = 'starting'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.innerHTML = `
    <span class="heatmap-map-control" aria-hidden="true">${escapeHtml(heatmapText(locale, 'overview.refreshOn'))}</span>
    <span id="heatmap-auto-refresh-copy" class="heatmap-refresh-state__copy">${escapeHtml(heatmapText(locale, 'overview.refreshStarting'))}</span>
  `
  dock.appendChild(status)
}

function renderOverview(overview: HeatmapOverview, locale: Locale): void {
  ensureOverviewShell(locale)
  setSummary('heatmap-overview-streams', heatmapNumber(locale, overview.activeRecords), heatmapText(locale, 'overview.activeBody'))
  setSummary('heatmap-overview-viewers', heatmapNumber(locale, overview.totalViewers), heatmapText(locale, 'overview.viewersBody', { count: heatmapNumber(locale, overview.activeRecords) }))

  if (overview.strongestMomentum) {
    const item = overview.strongestMomentum
    setSummary(
      'heatmap-overview-momentum',
      item.displayName,
      heatmapText(locale, 'overview.momentumBody', {
        direction: heatmapMomentumLabel(locale, item.momentum),
        momentum: formatMomentum(item.momentum),
        viewers: heatmapNumber(locale, item.viewers),
      }),
    )
  } else {
    setSummary('heatmap-overview-momentum', heatmapText(locale, 'common.unavailable'), heatmapText(locale, 'overview.momentumUnavailable'))
  }

  if (overview.activityState === 'available' && overview.highestActivity) {
    const item = overview.highestActivity
    setSummary(
      'heatmap-overview-activity',
      item.displayName,
      heatmapText(locale, 'overview.activityBody', { activity: formatActivity(item.activity), viewers: heatmapNumber(locale, item.viewers) }),
    )
  } else if (overview.activityState === 'zero') {
    setSummary('heatmap-overview-activity', heatmapText(locale, 'common.zeroObserved'), heatmapText(locale, 'overview.activityZero'))
  } else if (overview.activityState === 'unavailable') {
    setSummary('heatmap-overview-activity', heatmapText(locale, 'common.unavailable'), heatmapText(locale, 'overview.activityUnavailable'))
  } else {
    setSummary('heatmap-overview-activity', heatmapText(locale, 'common.notSampled'), heatmapText(locale, 'overview.activityNotSampled'))
  }

  setHtml('#heatmap-final-legend', renderLegend(overview, locale))
  setHtml('#heatmap-final-coverage', renderTextList(localizedCoverageLines(overview, locale)))
}

function renderLegend(overview: HeatmapOverview, locale: Locale): string {
  return `<ul class="heatmap-overview-list">
    ${legendItem('area', heatmapText(locale, 'legend.area'))}
    ${legendItem('rising', heatmapText(locale, 'legend.rising'))}
    ${legendItem('falling', heatmapText(locale, 'legend.falling'))}
    ${legendItem('stable', heatmapText(locale, 'legend.stable'))}
    ${legendItem('activity', heatmapActivityLegend(locale, overview.truth.activity.state))}
  </ul>`
}

function localizedCoverageLines(overview: HeatmapOverview, locale: Locale): string[] {
  if (locale === 'en') return overview.coverageLines
  const truth = overview.truth
  const lines = [
    heatmapText(locale, 'overview.coverage.records', { count: heatmapNumber(locale, truth.observedRecords) }),
    heatmapText(locale, 'overview.coverage.limit', { limit: heatmapNumber(locale, truth.configuredLimit) }),
    truth.hasMore === true ? heatmapText(locale, 'overview.coverage.more') : heatmapText(locale, 'overview.coverage.noMore'),
    truth.coveredPages === null
      ? heatmapText(locale, 'overview.coverage.pagesUnavailable')
      : heatmapText(locale, 'overview.coverage.pages', { count: heatmapNumber(locale, truth.coveredPages) }),
    heatmapText(locale, 'overview.coverage.source', { source: localizedSource(truth.sourceMode, truth.sourceLabel) }),
    heatmapText(locale, 'overview.coverage.method', { method: localizedMethod(truth.collectionMethod) }),
  ]
  if (truth.snapshotAgeMinutes !== null) lines.push(heatmapText(locale, 'overview.coverage.age', { age: localizedSnapshotAge(truth.snapshotAgeMinutes) }))
  if (truth.reasons.length) lines.push(...truth.reasons.map((reason) => heatmapReason(locale, reason)))
  return [...new Set(lines.filter(Boolean))]
}

function renderRefreshState(locale: Locale): void {
  const root = document.querySelector<HTMLElement>('#heatmap-refresh-state')
  const copy = document.querySelector<HTMLElement>('#heatmap-auto-refresh-copy')
  if (!root || !copy) return

  root.dataset.phase = refreshState.phase
  if (refreshState.phase === 'refreshing') {
    copy.textContent = refreshState.message || heatmapText(locale, 'overview.refreshReading')
  } else if (refreshState.phase === 'error') {
    copy.textContent = heatmapText(locale, 'overview.refreshRetry', { message: refreshState.message || heatmapText(locale, 'overview.refreshFailed') })
  } else if (refreshState.nextRefreshAt) {
    const seconds = Math.max(0, Math.ceil((refreshState.nextRefreshAt - Date.now()) / 1_000))
    copy.textContent = seconds > 0
      ? heatmapText(locale, 'overview.refreshNext', { seconds })
      : heatmapText(locale, 'overview.refreshVisible')
  } else {
    copy.textContent = heatmapText(locale, 'overview.refreshDefault')
  }
}

function summaryCard(label: string, id: string, locale: Locale): string {
  return `<article id="${id}" class="heatmap-overview-card"><div class="heatmap-overview-card__label">${escapeHtml(label)}</div><div class="heatmap-overview-card__value">—</div><p>${escapeHtml(heatmapText(locale, 'overview.waiting'))}</p></article>`
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

function localizedSource(mode: string, fallback: string): string {
  if (mode === 'real') return '実データ'
  if (mode === 'stale') return '遅延実データ'
  if (mode === 'demo') return 'デモ'
  if (mode === 'official-livestreams') return '公式エンドポイント'
  if (mode === 'registry') return 'レジストリ候補'
  if (mode === 'seed-list') return 'シードリスト'
  if (mode === 'public-channel-fallback') return '候補フォールバック'
  return fallback === 'Unknown' ? '不明' : fallback
}

function localizedMethod(method: string): string {
  if (method === 'Authenticated API') return '認証API'
  if (method === 'Public listing') return '公開リスト'
  return method
}

function localizedSnapshotAge(minutes: number): string {
  if (minutes < 1) return '1分未満'
  if (minutes < 60) return `${Math.floor(minutes)}分`
  const hours = Math.floor(minutes / 60)
  const remainder = Math.floor(minutes % 60)
  return remainder ? `${hours}時間${remainder}分` : `${hours}時間`
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
