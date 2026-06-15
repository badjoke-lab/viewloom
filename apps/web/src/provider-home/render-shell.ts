import type { ProviderHomePayload } from './types'
import { setText } from './dom'
import { formatAgo, formatCompact, formatInteger, formatTime, titleCase } from './format'

export function renderShell(payload: ProviderHomePayload): void {
  document.body.dataset.homeState = payload.state
  setText('home-live-observed', payload.state === 'error' ? 'Unavailable' : formatInteger(payload.now.observedStreams))
  setText('home-observed-viewers', payload.state === 'error' ? 'Unavailable' : formatCompact(payload.now.observedViewers))
  setText('home-largest-observed', payload.now.largestStream ? formatCompact(payload.now.largestStream.viewers) : unavailable(payload))
  setText('home-updated', payload.updatedAt ? formatAgo(payload.updatedAt) : unavailable(payload))
  setText('home-state', titleCase(payload.state))
  setText('home-strip-updated', payload.updatedAt ? formatAgo(payload.updatedAt) : unavailable(payload))
  setText('home-strip-observed', `${formatInteger(payload.now.observedStreams)} streams`)
  setText('home-strip-coverage', payload.coverage.label)
  setText('home-strip-source', payload.state === 'demo' ? 'Demo' : payload.state === 'error' ? 'Unavailable' : 'Real')
  setText('home-status-note', payload.coverage.note)

  const header = document.querySelector<HTMLElement>('.status-inline')
  if (header) {
    header.dataset.state = payload.state
    const dot = document.createElement('span')
    dot.className = 'dot'
    header.replaceChildren(dot, document.createTextNode(`${titleCase(payload.state)} · ${payload.updatedAt ? formatAgo(payload.updatedAt) : 'Update unavailable'}`))
  }

  setText('home-feature-heatmap', payload.now.largestStream
    ? `Largest now: ${payload.now.largestStream.displayName} · ${formatCompact(payload.now.largestStream.viewers)}`
    : unavailable(payload))
  setText('home-feature-dayflow', payload.today.observedPeak != null
    ? `Observed peak: ${formatCompact(payload.today.observedPeak)} · ${formatTime(payload.today.peakTime)}`
    : unavailable(payload))
  setText('home-feature-battle', payload.today.closestCurrentBattle
    ? `Closest gap: ${payload.today.closestCurrentBattle.left.displayName} / ${payload.today.closestCurrentBattle.right.displayName} · ${formatInteger(payload.today.closestCurrentBattle.gap)}`
    : 'No qualifying current pair')
  setText('home-feature-history', payload.recent.latestCompletedDay
    ? `Latest completed day: ${payload.recent.latestCompletedDay}`
    : 'No completed day available')
}

function unavailable(payload: ProviderHomePayload): string {
  if (payload.state === 'empty') return 'No observed data'
  if (payload.state === 'error') return 'Unavailable'
  return 'Not available'
}
