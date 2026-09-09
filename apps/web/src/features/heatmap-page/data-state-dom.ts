import type {
  HeatmapActivityState,
  HeatmapActivityValue,
  HeatmapDataTruth,
} from './data-state-core.mjs'
import { localeFromPathname, type Locale } from '../../i18n/locale'
import {
  heatmapDateTime,
  heatmapNumber,
  heatmapReason,
  heatmapStateLabel,
  heatmapText,
} from '../../i18n/heatmap'

let currentTruth: HeatmapDataTruth | null = null
let observer: MutationObserver | null = null
let renderQueued = false

export function installHeatmapDataTruthDom(): () => void {
  ensureTruthStyles()
  if (!observer && document.body) {
    observer = new MutationObserver(() => queueRender())
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['href', 'class', 'data-state'],
    })
  }

  return () => {
    observer?.disconnect()
    observer = null
    currentTruth = null
    renderQueued = false
  }
}

export function renderHeatmapDataTruth(truth: HeatmapDataTruth): void {
  currentTruth = truth
  applyTruth(truth)
}

function queueRender(): void {
  if (!currentTruth || renderQueued) return
  renderQueued = true
  window.requestAnimationFrame(() => {
    renderQueued = false
    if (currentTruth) applyTruth(currentTruth)
  })
}

function applyTruth(truth: HeatmapDataTruth): void {
  updateHeaderStatus(truth)
  updateHeroFacts(truth)
  updateDataStrip(truth)
  updateStatusCards(truth)
  updateActivitySurfaces(truth)
}

function activeLocale(): Locale {
  return localeFromPathname(window.location.pathname)
}

function updateHeaderStatus(truth: HeatmapDataTruth): void {
  const status = document.querySelector<HTMLElement>('.status-inline')
  if (!status) return
  const locale = activeLocale()
  const stateLabel = heatmapStateLabel(locale, truth.state)

  const dot = status.querySelector<HTMLElement>('.dot') ?? document.createElement('span')
  dot.classList.add('dot')
  dot.dataset.heatmapState = truth.state
  dot.setAttribute('aria-hidden', 'true')

  const copy = heatmapText(locale, 'header.status', { provider: truth.providerLabel, state: stateLabel })
  const currentCopy = Array.from(status.childNodes)
    .filter((node) => node !== dot)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim()

  if (currentCopy !== copy || status.firstElementChild !== dot) {
    status.replaceChildren(dot, document.createTextNode(copy))
  }
  status.dataset.heatmapState = truth.state
  status.setAttribute('aria-label', heatmapText(locale, 'header.statusAria', { provider: truth.providerLabel, state: stateLabel }))
}

function updateHeroFacts(truth: HeatmapDataTruth): void {
  const locale = activeLocale()
  setLabeledValue('.head-facts .fact', heatmapText(locale, 'label.observed'), truth.state === 'loading' ? '—' : heatmapNumber(locale, truth.observedRecords))
  setLabeledValue('.head-facts .fact', heatmapText(locale, 'label.state'), heatmapStateLabel(locale, truth.state))
}

function updateDataStrip(truth: HeatmapDataTruth): void {
  const locale = activeLocale()
  setLabeledCell(
    heatmapText(locale, 'label.updated'),
    truth.updatedAt ? heatmapDateTime(locale, truth.updatedAt) : truth.state === 'loading' ? heatmapText(locale, 'common.loading') : heatmapText(locale, 'common.unavailable'),
  )
  setLabeledCell(heatmapText(locale, 'label.observed'), heatmapText(locale, 'common.streams', { value: heatmapNumber(locale, truth.observedRecords) }))

  const more = truth.hasMore ? ` · ${heatmapText(locale, 'coverage.moreAvailable')}` : ''
  const coverage = truth.coverageState === 'partial'
    ? heatmapText(locale, 'coverage.partial', { count: heatmapNumber(locale, truth.observedRecords), more })
    : truth.coverageState === 'observed'
      ? heatmapText(locale, 'coverage.observed', { count: heatmapNumber(locale, truth.observedRecords), limit: heatmapNumber(locale, truth.configuredLimit) })
      : heatmapText(locale, 'common.unavailable')
  setLabeledCell(heatmapText(locale, 'label.coverage'), coverage)

  const sourceCell = findLabeledElement('.data-strip__cell', heatmapText(locale, 'label.source'))
  if (sourceCell) {
    setCellValue(sourceCell, displaySource(locale, truth.sourceMode, truth.sourceLabel))
    sourceCell.title = heatmapText(locale, 'coverage.method', { method: displayMethod(locale, truth.collectionMethod) })
  }
}

function updateStatusCards(truth: HeatmapDataTruth): void {
  const locale = activeLocale()
  const stateLabel = heatmapStateLabel(locale, truth.state)
  const sourceLabel = displaySource(locale, truth.sourceMode, truth.sourceLabel)
  const title = heatmapText(locale, 'status.title', { state: stateLabel, source: sourceLabel })
  const body = statusBody(truth, locale)

  setText('#heatmap-status-title', title)
  setText('#heatmap-status-body', body)
  setText('#heatmap-hero-status-title', title)
  setText('#heatmap-hero-status-body', body)

  const statusTargets = [
    document.querySelector<HTMLElement>('#heatmap-status-title')?.closest<HTMLElement>('.rail-card'),
    document.querySelector<HTMLElement>('#heatmap-hero-status-title')?.closest<HTMLElement>('.rail-card'),
  ]
  for (const target of statusTargets) {
    if (target) target.dataset.heatmapState = truth.state
  }

  const coverageLines = [
    heatmapText(locale, 'coverage.rendered', { count: heatmapNumber(locale, truth.observedRecords) }),
    truth.hasMore === true
      ? heatmapText(locale, 'coverage.more', { limit: heatmapNumber(locale, truth.configuredLimit) })
      : heatmapText(locale, 'coverage.complete', { limit: heatmapNumber(locale, truth.configuredLimit) }),
    truth.coveredPages === null
      ? heatmapText(locale, 'coverage.pagesUnavailable')
      : heatmapText(locale, 'coverage.pages', { count: heatmapNumber(locale, truth.coveredPages) }),
    heatmapText(locale, 'coverage.method', { method: displayMethod(locale, truth.collectionMethod) }),
  ]
  if (truth.reasons.length) coverageLines.push(...truth.reasons.map((reason) => heatmapReason(locale, reason)))
  setHtml('#heatmap-support-coverage', renderList(coverageLines))
}

function updateActivitySurfaces(truth: HeatmapDataTruth): void {
  const locale = activeLocale()
  const summaryValue = activitySummaryValue(truth.activity.state, locale)
  const summaryBody = activitySummaryBody(truth, locale)
  setText('#heatmap-summary-activity .summary-card__value', summaryValue)
  setText('#heatmap-summary-activity p', summaryBody)
  setHtml('#heatmap-support-activity', renderList(activitySupportLines(truth, locale)))

  setText(
    '#heatmap-legend-body',
    heatmapText(locale, 'activity.legendSentence', { activity: activityLegendCopy(truth.activity.state, locale) }),
  )

  const selected = selectedActivity(truth)
  if (selected) setText('#heatmap-detail-activity', formatActivityValue(selected, locale))
}

function selectedActivity(truth: HeatmapDataTruth): HeatmapActivityValue | null {
  const link = document.querySelector<HTMLAnchorElement>('#heatmap-detail-link')
  if (!link) return null
  const href = link.getAttribute('href')
  if (!href) return null

  try {
    const url = new URL(href, window.location.href)
    const login = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '')
    return truth.activityByLogin[login] ?? null
  } catch {
    return null
  }
}

function statusBody(truth: HeatmapDataTruth, locale: Locale): string {
  if (truth.state === 'loading') return heatmapText(locale, 'status.loading', { provider: truth.providerLabel })
  if (truth.state === 'error') {
    const reason = truth.reasons[0]
    const localized = reason ? heatmapReason(locale, reason) : ''
    return locale === 'ja' && localized === reason
      ? heatmapText(locale, 'status.error', { provider: truth.providerLabel })
      : localized || heatmapText(locale, 'status.error', { provider: truth.providerLabel })
  }

  const updated = truth.updatedAt ? heatmapDateTime(locale, truth.updatedAt) : heatmapText(locale, 'status.updateUnavailable')
  const age = truth.snapshotAgeMinutes === null ? '' : ` · ${formatAge(truth.snapshotAgeMinutes, locale)}`
  const coverage = truth.coverageState === 'partial'
    ? heatmapText(locale, 'status.coveragePartial')
    : truth.coverageState === 'observed'
      ? heatmapText(locale, 'status.coverageObserved')
      : heatmapText(locale, 'status.coverageUnavailable')
  return heatmapText(locale, 'status.body', { updated, age, count: heatmapNumber(locale, truth.observedRecords), coverage })
}

function activitySummaryValue(state: HeatmapActivityState, locale: Locale): string {
  if (state === 'available') return heatmapText(locale, 'common.available')
  if (state === 'zero') return heatmapText(locale, 'common.zeroObserved')
  if (state === 'unavailable') return heatmapText(locale, 'common.unavailable')
  return heatmapText(locale, 'common.notSampled')
}

function activitySummaryBody(truth: HeatmapDataTruth, locale: Locale): string {
  const counts = truth.activity.counts
  if (truth.activity.state === 'available') {
    return heatmapText(locale, 'activity.summary.available', { available: heatmapNumber(locale, counts.available), zero: heatmapNumber(locale, counts.zero) })
  }
  if (truth.activity.state === 'zero') return heatmapText(locale, 'activity.summary.zero', { zero: heatmapNumber(locale, counts.zero) })
  if (truth.activity.state === 'unavailable') return heatmapText(locale, 'activity.summary.unavailable')
  return heatmapText(locale, 'activity.summary.notSampled')
}

function activitySupportLines(truth: HeatmapDataTruth, locale: Locale): string[] {
  const counts = truth.activity.counts
  return [
    heatmapText(locale, 'activity.support.available', { value: heatmapNumber(locale, counts.available) }),
    heatmapText(locale, 'activity.support.zero', { value: heatmapNumber(locale, counts.zero) }),
    heatmapText(locale, 'activity.support.unavailable', { value: heatmapNumber(locale, counts.unavailable) }),
    heatmapText(locale, 'activity.support.notSampled', { value: heatmapNumber(locale, counts.not_sampled) }),
  ]
}

function activityLegendCopy(state: HeatmapActivityState, locale: Locale): string {
  if (state === 'available') return heatmapText(locale, 'activity.legend.available')
  if (state === 'zero') return heatmapText(locale, 'activity.legend.zero')
  if (state === 'unavailable') return heatmapText(locale, 'activity.legend.unavailable')
  return heatmapText(locale, 'activity.legend.notSampled')
}

function formatActivityValue(activity: HeatmapActivityValue, locale: Locale): string {
  if (activity.state === 'unavailable') return heatmapText(locale, 'common.unavailable')
  if (activity.state === 'not_sampled') return heatmapText(locale, 'common.notSampled')
  if (activity.state === 'zero') return heatmapText(locale, 'activity.value.zero')
  if (activity.value === null) return heatmapText(locale, 'common.available')
  return `${(activity.value * 100).toFixed(1)}%`
}

function setLabeledValue(selector: string, label: string, value: string): void {
  const element = findLabeledElement(selector, label)
  const target = element?.querySelector<HTMLElement>('strong')
  if (target) setElementText(target, value)
}

function setLabeledCell(label: string, value: string): void {
  const cell = findLabeledElement('.data-strip__cell', label)
  if (cell) setCellValue(cell, value)
}

function findLabeledElement(selector: string, label: string): HTMLElement | null {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(selector))
  return elements.find((element) => element.querySelector('small')?.textContent?.trim().toLowerCase() === label.toLowerCase()) ?? null
}

function setCellValue(cell: HTMLElement, value: string): void {
  const label = cell.querySelector('small')
  if (!label) return
  const current = Array.from(cell.childNodes)
    .filter((node) => node !== label)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim()
  if (current === value) return
  cell.replaceChildren(label, document.createTextNode(value))
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) setElementText(element, value)
}

function setElementText(element: HTMLElement, value: string): void {
  if (element.textContent !== value) element.textContent = value
}

function setHtml(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element && element.innerHTML !== value) element.innerHTML = value
}

function renderList(items: string[]): string {
  return `<ul class="heatmap-live-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function formatAge(minutes: number, locale: Locale): string {
  if (minutes < 1) return heatmapText(locale, 'age.lessMinute')
  if (minutes < 60) return heatmapText(locale, 'age.minutes', { value: Math.floor(minutes) })
  return heatmapText(locale, 'age.hours', { value: Math.floor(minutes / 60) })
}

function displaySource(locale: Locale, mode: string, fallback: string): string {
  if (locale === 'en') return fallback
  if (mode === 'real') return '実データ'
  if (mode === 'stale') return '遅延実データ'
  if (mode === 'demo') return 'デモ'
  if (mode === 'official-livestreams') return '公式エンドポイント'
  if (mode === 'registry') return 'レジストリ候補'
  if (mode === 'seed-list') return 'シードリスト'
  if (mode === 'public-channel-fallback') return '候補フォールバック'
  return '不明'
}

function displayMethod(locale: Locale, method: string): string {
  if (locale === 'en') return method
  if (method === 'Authenticated API') return '認証API'
  if (method === 'Public listing') return '公開リスト'
  return method
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

function ensureTruthStyles(): void {
  if (document.getElementById('heatmap-data-truth-style')) return
  const style = document.createElement('style')
  style.id = 'heatmap-data-truth-style'
  style.textContent = `
    .status-inline .dot[data-heatmap-state='loading'],
    .status-inline .dot[data-heatmap-state='empty'] {
      background:#94a3b8;
      box-shadow:none;
    }
    .status-inline .dot[data-heatmap-state='fresh'] {
      background:#22c55e;
      box-shadow:0 0 0 4px rgba(34,197,94,.12);
    }
    .status-inline .dot[data-heatmap-state='partial'],
    .status-inline .dot[data-heatmap-state='stale'] {
      background:#f59e0b;
      box-shadow:0 0 0 4px rgba(245,158,11,.12);
    }
    .status-inline .dot[data-heatmap-state='demo'] {
      background:#a78bfa;
      box-shadow:0 0 0 4px rgba(167,139,250,.12);
    }
    .status-inline .dot[data-heatmap-state='error'] {
      background:#ef4444;
      box-shadow:0 0 0 4px rgba(239,68,68,.12);
    }
  `
  document.head.appendChild(style)
}
