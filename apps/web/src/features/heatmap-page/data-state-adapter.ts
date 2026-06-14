import type { HeatmapPageAdapter } from './contracts'
import { createHeatmapLoadingTruth, type HeatmapProviderKey } from './data-state-core.mjs'
import { installHeatmapDataTruthDom, renderHeatmapDataTruth } from './data-state-dom'

let removeDomObserver: (() => void) | null = null

function providerKey(): HeatmapProviderKey {
  return document.body.dataset.page === 'kick-heatmap' ? 'kick' : 'twitch'
}

async function hydrateHeatmap(): Promise<void> {
  const provider = providerKey()
  if (!removeDomObserver) removeDomObserver = installHeatmapDataTruthDom()
  renderHeatmapDataTruth(createHeatmapLoadingTruth(provider))
  const module = await import('../../live/twitch-heatmap')
  await module.hydrateTwitchHeatmap()
}

export const heatmapDataStateAdapter: HeatmapPageAdapter = {
  name: 'heatmap-data-state-adapter',
  boundaries: ['fetch', 'state', 'layout', 'renderer', 'inspector', 'status'],
  mount: hydrateHeatmap,
  refresh: hydrateHeatmap,
  destroy: () => {
    removeDomObserver?.()
    removeDomObserver = null
  },
}
