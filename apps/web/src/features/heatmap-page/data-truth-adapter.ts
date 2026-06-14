import type { HeatmapPageAdapter } from './contracts'
import { createHeatmapLoadingTruth, type HeatmapProviderKey } from './data-state-core.mjs'
import { installHeatmapDataTruthDom, renderHeatmapDataTruth } from './data-state-dom'
import { installHeatmapResponseObserver } from './data-state-source'
import { installHeatmapLayoutMode } from './layout-mode'

let stopDom: (() => void) | null = null
let stopSource: (() => void) | null = null
let stopLayout: (() => void) | null = null

function providerKey(): HeatmapProviderKey {
  return document.body.dataset.page === 'kick-heatmap' ? 'kick' : 'twitch'
}

async function hydrateHeatmap(): Promise<void> {
  const provider = providerKey()
  if (!stopLayout) stopLayout = installHeatmapLayoutMode()
  if (!stopDom) stopDom = installHeatmapDataTruthDom()
  if (!stopSource) stopSource = installHeatmapResponseObserver(provider)
  renderHeatmapDataTruth(createHeatmapLoadingTruth(provider))
  const module = await import('../../live/twitch-heatmap')
  await module.hydrateTwitchHeatmap()
}

export const heatmapDataTruthAdapter: HeatmapPageAdapter = {
  name: 'heatmap-data-truth-adapter',
  boundaries: ['fetch', 'state', 'layout', 'renderer', 'inspector', 'status'],
  mount: hydrateHeatmap,
  refresh: hydrateHeatmap,
  destroy: () => {
    stopSource?.()
    stopSource = null
    stopDom?.()
    stopDom = null
    stopLayout?.()
    stopLayout = null
  },
}
