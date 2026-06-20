import '../history-report-text.css'
import '../history-share-card.css'
import { renderHistoryReport } from './history-report-text-render'
import { renderHistoryShareCard } from './history-share-card'
import {
  historyReportPayload,
  installHistoryReportPayloadCapture,
} from './history-report-text-state'

let scheduled = false

function render(): void {
  const payload = historyReportPayload()
  if (!payload) return
  renderHistoryReport(payload)
  renderHistoryShareCard(payload)
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

installHistoryReportPayloadCapture(schedule)
