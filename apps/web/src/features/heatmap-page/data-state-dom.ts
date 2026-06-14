import type {
  HeatmapActivityState,
  HeatmapActivityValue,
  HeatmapDataTruth,
} from './data-state-core.mjs'

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

function updateHeaderStatus(truth: HeatmapDataTruth): void {
  const status = document.querySelector<HTMLElement>('.status-inline')
  if (!status) return

  const dot = status.querySelector<HTMLElement>('.dot') ?? document.createElement('span')
  dot.classList.add('dot')
  dot.dataset.heatmapState = truth.state
  dot.setAttribute('aria-hidden', 'true')

  const copy = `${truth.providerLabel} data ${truth.stateLabel} · 5m cadence`
  const currentCopy = Array.from(status.childNodes)
    .filter((node) => node !== dot)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim()

  if (currentCopy !== copy || status.firstElementChild !== dot) {
    status.replaceChildren(dot, document.createTextNode(copy))
  }
  status.dataset.heatmapState = truth.state
  status.setAttribute('aria-label', `${truth.providerLabel} data state: ${truth.stateLabel}`)
}

function updateHeroFacts(truth: HeatmapDataTruth): void {
  setLabeledValue('.head-facts .fact', 'Observed', truth.state === 'loading' ? '—' : truth.observedRecords.toLocaleString())
  setLabeledValue('.head-facts .fact', 'State', truth.stateLabel)
}

function updateDataStrip(truth: HeatmapDataTruth): void {
  setLabeledCell('Updated', truth.updatedAt ? formatLocalTime(truth.updatedAt) : truth.state === 'loading' ? 'Loading' : 'Unavailable')
  setLabeledCell('Observed', `${truth.observedRecords.toLocaleString()} streams`)

  const coverage = truth.coverageState === 'partial'
    ? `Partial · ${truth.observedRecords.toLocaleString()} observed${truth.hasMore ? ' · more available' : ''}`
    : truth.coverageState === 'observed'
      ? `${truth.observedRecords.toLocaleString()} observed · limit ${truth.configuredLimit.toLocaleString()}`
      : 'Unavailable'
  setLabeledCell('Coverage', coverage)

  const sourceCell = findLabeledElement('.data-strip__cell', 'Source')
  if (sourceCell) {
    setCellValue(sourceCell, truth.sourceLabel)
    sourceCell.title = `Collection method: ${truth.collectionMethod}`
  }
}

function updateStatusCards(truth: HeatmapDataTruth): void {
  const title = `Data: ${truth.stateLabel} · Source: ${truth.sourceLabel}`
  const body = statusBody(truth)

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
    `${truth.observedRecords.toLocaleString()} observed records rendered from the latest snapshot.`,
    truth.hasMore === true
      ? `Collector limit ${truth.configuredLimit.toLocaleString()}; more platform records were reported outside this snapshot.`
      : `Collector limit ${truth.configuredLimit.toLocaleString()}; every record present in this snapshot is rendered.`,
    truth.coveredPages === null ? 'Covered pages: unavailable.' : `Covered pages: ${truth.coveredPages.toLocaleString()}.`,
    `Collection method: ${truth.collectionMethod}.`,
  ]
  if (truth.reasons.length) coverageLines.push(...truth.reasons)
  setHtml('#heatmap-support-coverage', renderList(coverageLines))
}

function updateActivitySurfaces(truth: HeatmapDataTruth): void {
  const summaryValue = activitySummaryValue(truth.activity.state)
  const summaryBody = activitySummaryBody(truth)
  setText('#heatmap-summary-activity .summary-card__value', summaryValue)
  setText('#heatmap-summary-activity p', summaryBody)
  setHtml('#heatmap-support-activity', renderList(activitySupportLines(truth)))

  setText(
    '#heatmap-legend-body',
    `Area tracks viewers. Tile color tracks momentum. Activity is ${activityLegendCopy(truth.activity.state)}.`,
  )

  const selected = selectedActivity(truth)
  if (selected) setText('#heatmap-detail-activity', formatActivityValue(selected))
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

function statusBody(truth: HeatmapDataTruth): string {
  if (truth.state === 'loading') return `Loading the latest ${truth.providerLabel} snapshot.`
  if (truth.state === 'error') return truth.reasons[0] ?? `${truth.providerLabel} Heatmap data could not be loaded.`

  const updated = truth.updatedAt ? formatLocalTime(truth.updatedAt) : 'Update time unavailable'
  const age = truth.snapshotAgeMinutes === null ? '' : ` · ${formatAge(truth.snapshotAgeMinutes)}`
  const coverage = truth.coverageState === 'partial' ? 'Partial coverage' : truth.coverageState === 'observed' ? 'Observed coverage' : 'Coverage unavailable'
  return `${updated}${age} · ${truth.observedRecords.toLocaleString()} observed streams · ${coverage}.`
}

function activitySummaryValue(state: HeatmapActivityState): string {
  if (state === 'available') return 'Available'
  if (state === 'zero') return 'Zero observed'
  if (state === 'unavailable') return 'Unavailable'
  return 'Not sampled'
}

function activitySummaryBody(truth: HeatmapDataTruth): string {
  const counts = truth.activity.counts
  if (truth.activity.state === 'available') {
    return `${counts.available.toLocaleString()} streams have a sampled activity value; ${counts.zero.toLocaleString()} sampled zero.`
  }
  if (truth.activity.state === 'zero') return `${counts.zero.toLocaleString()} streams were sampled with zero activity.`
  if (truth.activity.state === 'unavailable') return 'The current snapshot does not provide a usable activity signal.'
  return 'Activity was not sampled for this snapshot window.'
}

function activitySupportLines(truth: HeatmapDataTruth): string[] {
  const counts = truth.activity.counts
  return [
    `Available: ${counts.available.toLocaleString()}`,
    `Sampled zero: ${counts.zero.toLocaleString()}`,
    `Unavailable: ${counts.unavailable.toLocaleString()}`,
    `Not sampled: ${counts.not_sampled.toLocaleString()}`,
  ]
}

function activityLegendCopy(state: HeatmapActivityState): string {
  if (state === 'available') return 'a sampled secondary signal when present'
  if (state === 'zero') return 'sampled, with zero observed in this field'
  if (state === 'unavailable') return 'unavailable in this snapshot'
  return 'not sampled in this window'
}

function formatActivityValue(activity: HeatmapActivityValue): string {
  if (activity.state === 'unavailable') return 'Unavailable'
  if (activity.state === 'not_sampled') return 'Not sampled'
  if (activity.state === 'zero') return '0.0% · sampled zero'
  if (activity.value === null) return 'Available'
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

function formatLocalTime(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Unavailable'
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date)
}

function formatAge(minutes: number): string {
  if (minutes < 1) return 'updated less than 1m ago'
  if (minutes < 60) return `updated ${Math.floor(minutes)}m ago`
  return `updated ${Math.floor(minutes / 60)}h ago`
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
