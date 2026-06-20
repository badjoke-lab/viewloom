import '../history-report-text.css'
import { renderHistoryReport } from './history-report-text-render'
import {
  historyReportPayload,
  installHistoryReportPayloadCapture,
} from './history-report-text-state'

let scheduled = false

function render(): void {
  const payload = historyReportPayload()
  if (!payload) return
  renderHistoryReport(payload)
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
