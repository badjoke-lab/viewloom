import type {
  HistoryCalendarCell,
  HistoryCalendarMetric,
  HistoryCalendarPayload,
} from './history-calendar-heat-state'
import {
  historyCalendarCells,
  historyCalendarMetric,
} from './history-calendar-heat-state'

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
let lastCells: HistoryCalendarCell[] = []
let lastMetric: HistoryCalendarMetric = 'viewer_minutes'

export function renderHistoryCalendar(payload: HistoryCalendarPayload): void {
  const mount = ensureMount()
  const grid = mount.querySelector<HTMLElement>('[data-history-calendar-grid]')
  const summary = mount.querySelector<HTMLElement>('[data-history-calendar-summary]')
  const metricNode = mount.querySelector<HTMLElement>('[data-history-calendar-metric]')
  if (!grid || !summary || !metricNode) return

  const cells = historyCalendarCells(payload)
  const metric = historyCalendarMetric(payload)
  lastCells = cells
  lastMetric = metric
  metricNode.textContent = metricLabel(metric)

  if (!cells.length) {
    summary.textContent = 'No UTC days are available for this period.'
    grid.innerHTML = '<div class="notice history-calendar__empty">No calendar data is available for this period.</div>'
    renderDetail(null, metric)
    return
  }

  const observed = cells.filter((cell) => cell.observed)
  const missing = cells.length - observed.length
  const attention = observed.filter((cell) => !['good', 'complete', 'fresh'].includes(cell.coverageState)).length
  summary.textContent = `${observed.length} observed · ${missing} missing · ${attention} need attention`

  const maxValue = Math.max(0, ...observed.map((cell) => cell.value ?? 0))
  const selected = selectedDay(cells)
  const offset = mondayOffset(cells[0].day)
  const blanks = Array.from({ length: offset }, () => '<span class="history-calendar__blank" role="presentation"></span>').join('')
  grid.innerHTML = `${blanks}${cells.map((cell, index) => calendarCell(cell, index, maxValue, metric, cell.day === selected)).join('')}`

  grid.querySelectorAll<HTMLButtonElement>('[data-history-calendar-day]').forEach((button) => {
    const cell = cells.find((item) => item.day === button.dataset.historyCalendarDay)
    if (!cell) return
    button.addEventListener('pointerenter', () => renderDetail(cell, metric))
    button.addEventListener('focus', () => renderDetail(cell, metric))
    button.addEventListener('click', () => chooseDay(cell))
  })

  renderDetail(cells.find((cell) => cell.day === selected) ?? observed.at(-1) ?? cells.at(-1) ?? null, metric)
}

export function syncHistoryCalendarSelection(): void {
  if (!lastCells.length) return
  const selected = selectedDay(lastCells)
  document.querySelectorAll<HTMLElement>('[data-history-calendar-day]').forEach((cell) => {
    const active = cell.dataset.historyCalendarDay === selected
    cell.classList.toggle('is-selected', active)
    cell.setAttribute('aria-selected', String(active))
  })
  renderDetail(lastCells.find((cell) => cell.day === selected) ?? null, lastMetric)
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-calendar]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-calendar-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Calendar heat</h2><span>UTC days · coverage-aware</span></div>
    <section class="surface history-calendar" data-history-calendar>
      <div class="surface__head"><strong>Daily intensity</strong><small data-history-calendar-summary>Loading calendar…</small></div>
      <div class="history-calendar__meta">
        <span>Metric: <strong data-history-calendar-metric>Viewer-minutes</strong></span>
        <span class="history-calendar__intensity" aria-label="Relative intensity legend"><i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i><b>Higher in this period</b></span>
        <span class="history-calendar__coverage-key"><i></i>Partial or poor coverage is outlined</span>
      </div>
      <div class="history-calendar__scroll">
        <div class="history-calendar__weekdays" aria-hidden="true">${weekdays.map((day) => `<span>${day}</span>`).join('')}</div>
        <div class="history-calendar__grid" data-history-calendar-grid role="grid" aria-label="History calendar heat"><div class="notice">Loading calendar…</div></div>
      </div>
      <div class="history-calendar__detail" data-history-calendar-detail aria-live="polite"></div>
    </section>`

  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (columns) columns.insertAdjacentElement('afterend', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)
  return block.querySelector<HTMLElement>('[data-history-calendar]')!
}

function calendarCell(cell: HistoryCalendarCell, index: number, maxValue: number, metric: HistoryCalendarMetric, selected: boolean): string {
  const date = new Date(`${cell.day}T00:00:00.000Z`)
  const level = intensityLevel(cell, maxValue)
  const coverage = safeClass(cell.coverageState)
  const month = index === 0 || date.getUTCDate() === 1
    ? new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(date)
    : ''
  const label = calendarAria(cell, metric)
  return `<button class="history-calendar__cell history-calendar__cell--level-${level} history-calendar__cell--${coverage}${selected ? ' is-selected' : ''}" type="button" role="gridcell" data-history-calendar-day="${cell.day}" data-calendar-level="${level}" data-calendar-coverage="${coverage}" aria-label="${escapeHtml(label)}" aria-selected="${selected}" ${cell.observed ? '' : 'disabled'}>
    <span class="history-calendar__month">${escapeHtml(month)}</span>
    <strong>${date.getUTCDate()}</strong>
    <small>${cell.observed ? compact(cell.value) : 'Missing'}</small>
  </button>`
}

function chooseDay(cell: HistoryCalendarCell): void {
  if (!cell.observed) return
  const selector = cssEscape(cell.day)
  const chartDay = document.querySelector<SVGGElement>(`.history-day-column[data-history-day="${selector}"]`)
  if (chartDay) chartDay.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  else document.querySelector<HTMLElement>(`[data-history-day-card="${selector}"]`)?.click()
  requestAnimationFrame(syncHistoryCalendarSelection)
}

function renderDetail(cell: HistoryCalendarCell | null, metric: HistoryCalendarMetric): void {
  const detail = document.querySelector<HTMLElement>('[data-history-calendar-detail]')
  if (!detail) return
  if (!cell) {
    detail.innerHTML = '<span>Select an observed day to inspect its calendar value.</span>'
    return
  }
  detail.innerHTML = `
    <time>${escapeHtml(formatDate(cell.day))}</time>
    <strong>${cell.observed ? formatNumber(cell.value) : 'No observation'}</strong>
    <span>${cell.observed ? escapeHtml(metricLabel(metric)) : 'Missing day'}</span>
    <span class="history-badge history-badge--${safeClass(cell.coverageState)}">${escapeHtml(humanLabel(cell.coverageState))}</span>`
}

function selectedDay(cells: HistoryCalendarCell[]): string {
  const requested = new URL(location.href).searchParams.get('day')
  if (requested && cells.some((cell) => cell.day === requested && cell.observed)) return requested
  return cells.filter((cell) => cell.observed).at(-1)?.day ?? cells.at(-1)?.day ?? ''
}

function mondayOffset(day: string): number {
  return (new Date(`${day}T00:00:00.000Z`).getUTCDay() + 6) % 7
}

function intensityLevel(cell: HistoryCalendarCell, maxValue: number): number {
  if (!cell.observed || maxValue <= 0) return 0
  const ratio = Math.max(0, Math.min(1, (cell.value ?? 0) / maxValue))
  if (ratio >= .8) return 4
  if (ratio >= .6) return 3
  if (ratio >= .4) return 2
  if (ratio > 0) return 1
  return 0
}

function calendarAria(cell: HistoryCalendarCell, metric: HistoryCalendarMetric): string {
  if (!cell.observed) return `${formatDate(cell.day)}. Missing observation.`
  return `${formatDate(cell.day)}. ${formatNumber(cell.value)} ${metricLabel(metric)}. ${humanLabel(cell.coverageState)} coverage.`
}

function metricLabel(metric: HistoryCalendarMetric): string {
  return metric === 'peak_viewers' ? 'Peak viewers' : 'Viewer-minutes'
}

function formatDate(day: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T00:00:00.000Z`))
}

function formatNumber(value: number | null): string {
  return value === null || !Number.isFinite(value) ? '—' : Math.round(value).toLocaleString('en-US')
}

function compact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function safeClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
}

function cssEscape(value: string): string {
  return window.CSS?.escape ? window.CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
