import '../history-battle-archive.css'
import './history-period-comparison'
import { renderBattleArchive } from './history-battle-archive-render'
import {
  battleArchiveEntries,
  battleArchivePayload,
  installBattleArchivePayloadCapture,
} from './history-battle-archive-state'

let scheduled = false

function render(): void {
  const payload = battleArchivePayload()
  if (!payload) return
  renderBattleArchive(battleArchiveEntries(payload))
}

function schedule(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    render()
  })
}

installBattleArchivePayloadCapture(schedule)
window.addEventListener('viewloom:battle-archive-toggle', schedule)
