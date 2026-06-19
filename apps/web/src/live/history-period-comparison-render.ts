import type { PeriodComparison, PeriodComparisonChange, PeriodComparisonSide } from './history-period-comparison-state'

export function renderPeriodComparison(comparison: PeriodComparison | null): void {
  const mount = ensureMount()
  const body = mount.querySelector<HTMLElement>('[data-history-period-comparison-body]')
  const status = mount.querySelector<HTMLElement>('[data-history-period-comparison-status]')
  if (!body || !status) return

  if (!comparison || comparison.state === 'unavailable' || !comparison.current || !comparison.previous) {
    status.textContent = 'Unavailable'
    status.className = 'history-comparison-status history-comparison-status--unavailable'
    body.innerHTML = `
      <div class="notice history-comparison-notice">
        <strong>Previous period comparison unavailable.</strong>
        <span>${escapeHtml(comparison?.reason ?? 'The immediately preceding period does not have enough retained observations.')}</span>
      </div>`
    return
  }

  const comparable = comparison.state === 'comparable' && comparison.changes
  status.textContent = comparable ? 'Comparable' : 'Partial'
  status.className = `history-comparison-status history-comparison-status--${comparable ? 'comparable' : 'partial'}`
  body.innerHTML = `
    <div class="history-comparison-scopes">
      ${scopeCard('Current period', comparison.current)}
      <div class="history-comparison-vs" aria-hidden="true">vs</div>
      ${scopeCard('Previous period', comparison.previous)}
    </div>
    <div class="history-comparison-grid">
      ${metricCard('Viewer-minutes', comparison.current.totalViewerMinutes, comparison.previous.totalViewerMinutes, comparable ? comparison.changes?.totalViewerMinutes : null, formatNumber)}
      ${metricCard('Peak viewers', comparison.current.peakViewers, comparison.previous.peakViewers, comparable ? comparison.changes?.peakViewers : null, formatNumber)}
      ${metricCard('Average observed viewers', comparison.current.averageViewers, comparison.previous.averageViewers, comparable ? comparison.changes?.averageViewers : null, formatNumber)}
      ${metricCard('Observed time', comparison.current.observedMinutes, comparison.previous.observedMinutes, null, formatDuration)}
    </div>
    <p class="history-comparison-note">${escapeHtml(comparable
      ? 'Equal completed-day scopes with complete coverage. Percentages compare the selected period with the immediately preceding period.'
      : `${comparison.reason ?? 'Coverage is incomplete.'} Percentages withheld.`)}</p>`
}

function ensureMount(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-history-period-comparison]')
  if (existing) return existing

  const block = document.createElement('div')
  block.className = 'history-period-comparison-block'
  block.innerHTML = `
    <div class="rule-title"><h2>Previous period comparison</h2><span>Completed observed scope</span></div>
    <section class="surface history-period-comparison" data-history-period-comparison>
      <div class="surface__head">
        <strong>Current period vs immediately preceding period</strong>
        <span class="history-comparison-status history-comparison-status--loading" data-history-period-comparison-status>Loading</span>
      </div>
      <div class="history-period-comparison__body" data-history-period-comparison-body>
        <div class="notice">Loading period comparison…</div>
      </div>
    </section>`

  const coverageSummary = document.querySelector<HTMLElement>('[data-history-coverage-summary]')
  const columns = document.querySelector<HTMLElement>('[data-history-columns]')
  if (coverageSummary) coverageSummary.insertAdjacentElement('afterend', block)
  else if (columns) columns.insertAdjacentElement('beforebegin', block)
  else document.querySelector<HTMLElement>('.history-page')?.append(block)
  return block.querySelector<HTMLElement>('[data-history-period-comparison]')!
}

function scopeCard(label: string, side: PeriodComparisonSide): string {
  return `
    <div class="history-comparison-scope">
      <small>${escapeHtml(label)}</small>
      <strong>${escapeHtml(formatRange(side.from, side.to))}</strong>
      <span>${formatInteger(side.selectedDays)} selected day${number(side.selectedDays) === 1 ? '' : 's'} · ${escapeHtml(humanLabel(side.coverageState ?? 'unknown'))}</span>
    </div>`
}

function metricCard(
  label: string,
  current: unknown,
  previous: unknown,
  change: PeriodComparisonChange | null | undefined,
  formatter: (value: unknown) => string,
): string {
  return `
    <article class="history-comparison-metric" data-history-comparison-metric="${safeClass(label)}">
      <small>${escapeHtml(label)}</small>
      <div class="history-comparison-metric__values">
        <div><span>Current</span><strong>${formatter(current)}</strong></div>
        <div><span>Previous</span><strong>${formatter(previous)}</strong></div>
      </div>
      <div class="history-comparison-change ${changeClass(change?.pct)}">${change ? formatChange(change) : 'Comparison withheld'}</div>
    </article>`
}

function formatChange(change: PeriodComparisonChange): string {
  if (typeof change.pct !== 'number' || !Number.isFinite(change.pct)) return 'Previous value unavailable'
  const pct = Math.round(change.pct * 1000) / 10
  const prefix = pct > 0 ? '+' : ''
  return `${prefix}${pct}% · ${signedNumber(change.absolute)}`
}

function signedNumber(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const rounded = Math.round(value)
  return `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('en-US')}`
}

function changeClass(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) return 'is-neutral'
  return value > 0 ? 'is-positive' : 'is-negative'
}

function formatRange(from: unknown, to: unknown): string {
  const left = validDay(from) ? shortDate(from) : 'Unknown'
  const right = validDay(to) ? shortDate(to) : 'Unknown'
  return `${left} – ${right}`
}

function shortDate(day: string): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${day}T00:00:00.000Z`))
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function formatNumber(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '—'
}

function formatInteger(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value).toLocaleString('en-US') : '0'
}

function formatDuration(value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—'
  const minutes = Math.max(0, Math.round(value))
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours.toLocaleString('en-US')}h ${remainder}m`
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function humanLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function safeClass(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
