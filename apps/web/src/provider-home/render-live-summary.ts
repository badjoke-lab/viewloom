import type { ProviderHomePayload } from './types'
import { setText } from './dom'
import { formatInteger } from './format'

export function renderLiveSummary(payload: ProviderHomePayload): void {
  setText('home-live-caption', payload.now.topStreams.length ? `Showing ${payload.now.topStreams.length} of ${formatInteger(payload.now.observedStreams)} observed streams` : 'No live ranking rows available')
}
