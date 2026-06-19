import '../history-peak-archive.css'
import { renderPeakArchive } from './history-peak-archive-render'
import {
  installPeakArchivePayloadCapture,
  peakArchiveEntries,
  peakArchivePayload,
  type PeakArchiveEntry,
} from './history-peak-archive-state'

let scheduled = false
let currentEntries: PeakArchiveEntry[] = []

function render(): void {
  const payload = peakArchivePayload()
  if (payload) currentEntries = peakArchiveEntries(payload)
  renderPeakArchive(currentEntries)
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
schedule()
