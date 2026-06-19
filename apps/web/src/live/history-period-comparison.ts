import '../history-period-comparison.css'
import { renderPeriodComparison } from './history-period-comparison-render'
import {
  installPeriodComparisonPayloadCapture,
  periodComparisonFromPayload,
  periodComparisonPayload,
} from './history-period-comparison-state'

let scheduled = false

function render(): void {
  const payload = periodComparisonPayload()
  if (!payload) return
  renderPeriodComparison(periodComparisonFromPayload(payload))
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

installPeriodComparisonPayloadCapture(schedule)
