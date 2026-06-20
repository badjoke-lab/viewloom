import '../history-calendar-heat.css'
import {
  renderHistoryCalendar,
  syncHistoryCalendarSelection,
} from './history-calendar-heat-render'
import {
  historyCalendarPayload,
  installHistoryCalendarPayloadCapture,
} from './history-calendar-heat-state'

let scheduled = false
let summaryGuardInstalled = false

function render(): void {
  const payload = historyCalendarPayload()
  if (!payload) return
  renderHistoryCalendar(payload)
  installSummaryGuard()
  syncCalendarSummary()
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

function installSummaryGuard(): void {
  if (summaryGuardInstalled) return
  const head = document.querySelector<HTMLElement>('[data-history-calendar] > .surface__head')
  if (!head) return
  summaryGuardInstalled = true
  const observer = new MutationObserver(syncCalendarSummary)
  observer.observe(head, { childList: true, subtree: true, characterData: true })
}

function syncCalendarSummary(): void {
  const summary = document.querySelector<HTMLElement>('[data-history-calendar] > .surface__head > small')
  if (!summary) return
  const cells = Array.from(document.querySelectorAll<HTMLElement>('[data-history-calendar-day]'))
  const missing = cells.filter((cell) => cell.dataset.calendarCoverage === 'missing').length
  const observed = cells.length - missing
  const attention = cells.filter((cell) => {
    const state = cell.dataset.calendarCoverage ?? 'partial'
    return state !== 'missing' && !['good', 'complete', 'fresh'].includes(state)
  }).length
  const expected = `${observed} observed · ${missing} missing · ${attention} need attention`
  summary.dataset.historyCalendarSummary = ''
  if (summary.textContent !== expected) summary.textContent = expected
}

installHistoryCalendarPayloadCapture(schedule)

window.addEventListener('popstate', () => requestAnimationFrame(syncHistoryCalendarSelection))
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null
  if (!target) return
  if (target.closest('.history-day-column,[data-history-day-card],[data-history-calendar-day]')) {
    requestAnimationFrame(syncHistoryCalendarSelection)
  }
})
