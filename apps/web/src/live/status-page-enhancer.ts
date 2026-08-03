import '../status-page.css'
import { absoluteTime, field, label, plain, relativeTime, sanitizePayload, tone, type StatusPayload } from './status-page-model'
import { renderStatusFeatures, renderStatusLimitations } from './status-page-features'
import { prepareStatusPage, setStatusText } from './status-page-setup'
import { renderStatusBoard, renderStatusDetails, renderStatusSummary } from './status-page-summary'

prepareStatusPage()

const refreshButton = document.querySelector<HTMLButtonElement>('[data-status-refresh]')
refreshButton?.addEventListener('click', () => {
  window.dispatchEvent(new CustomEvent('viewloom:status-refresh'))
})

window.addEventListener('viewloom:status-loading', (event) => {
  const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason
  setBusy(true)
  setStatusText('[data-status-feedback]', reason === 'manual' ? 'Refreshing Data Status…' : 'Loading Data Status…')
})

window.addEventListener('viewloom:status', (event) => render((event as CustomEvent<StatusPayload>).detail))

window.addEventListener('viewloom:status-refreshed', (event) => {
  const reason = (event as CustomEvent<{ reason?: string }>).detail?.reason
  setBusy(false)
  if (reason === 'manual') {
    const feedback = document.querySelector<HTMLElement>('[data-status-feedback]')
    if (feedback) feedback.dataset.refreshResult = 'success'
  }
})

window.addEventListener('viewloom:status-error', (event) => {
  const detail = (event as CustomEvent<{ message?: string }>).detail
  setBusy(false)
  const feedback = document.querySelector<HTMLElement>('[data-status-feedback]')
  if (feedback) feedback.dataset.refreshResult = 'error'
  setStatusText('[data-status-feedback]', `Data Status refresh failed · ${plain(detail?.message)}`)
})

function render(payload: StatusPayload): void {
  const state = payload.state ?? payload.sourceMode ?? 'unknown'
  const last = field(payload.freshness, 'lastSuccessAt') ?? field(payload.latestSnapshot, 'collectedAt') ?? field(payload.latestSnapshot, 'bucketMinute')
  const observed = field(payload.latestSnapshot, 'observedCount') ?? field(payload.latestSnapshot, 'streamCount') ?? field(payload.coverage, 'observedCount')
  const pill = document.querySelector<HTMLElement>('[data-status-pill]')
  if (pill) {
    pill.textContent = label(state)
    pill.dataset.tone = tone(state)
  }
  const feedback = document.querySelector<HTMLElement>('[data-status-feedback]')
  if (feedback) feedback.dataset.refreshResult = 'success'
  setStatusText('[data-status-feedback]', `Status generated ${relativeTime(payload.generatedAt)} · ${absoluteTime(payload.generatedAt)} · ${plain(payload.platform)}`)
  renderStatusSummary(payload, state, last, observed)
  renderStatusBoard(payload)
  renderStatusDetails(payload)
  renderStatusFeatures(payload)
  renderStatusLimitations(payload)
  setStatusText('[data-status-debug]', sanitizePayload(payload))
}

function setBusy(busy: boolean): void {
  const summary = document.querySelector<HTMLElement>('[data-status-summary]')
  if (summary) summary.setAttribute('aria-busy', String(busy))
  if (!refreshButton) return
  refreshButton.disabled = busy
  refreshButton.setAttribute('aria-busy', String(busy))
  refreshButton.textContent = busy ? 'Refreshing status…' : 'Refresh status'
}
