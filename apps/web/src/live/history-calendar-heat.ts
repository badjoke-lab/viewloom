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

function render(): void {
  const payload = historyCalendarPayload()
  if (!payload) return
  renderHistoryCalendar(payload)
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
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
