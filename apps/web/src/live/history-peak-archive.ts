import '../history-peak-archive.css'
import { renderPeakArchive } from './history-peak-archive-render'
import {
  installPeakArchivePayloadCapture,
  peakArchiveEntries,
  peakArchivePayload,
} from './history-peak-archive-state'

let scheduled = false

function render(): void {
  const payload = peakArchivePayload()
  if (!payload) return
  renderPeakArchive(peakArchiveEntries(payload))
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

installPeakArchivePayloadCapture(schedule)
window.addEventListener('viewloom:peak-archive-toggle', schedule)
