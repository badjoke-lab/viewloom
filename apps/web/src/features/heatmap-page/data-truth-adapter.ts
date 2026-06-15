import './layout-support.css'
import type { HeatmapPageAdapter } from './contracts'
import { createHeatmapLoadingTruth, type HeatmapProviderKey } from './data-state-core.mjs'
import { installHeatmapDataTruthDom, renderHeatmapDataTruth } from './data-state-dom'
import { installHeatmapResponseObserver } from './data-state-source'
import { installHeatmapLayoutMode } from './layout-mode'
import { installHeatmapOverview } from './overview'
import { installHeatmapSelectedInspector } from './selected-inspector-controller'

let stopDom: (() => void) | null = null
let stopSource: (() => void) | null = null
let stopLayout: (() => void) | null = null
let stopInspector: (() => void) | null = null
let stopOverview: (() => void) | null = null

function providerKey(): HeatmapProviderKey {
  return document.body.dataset.page === 'kick-heatmap' ? 'kick' : 'twitch'
}

async function hydrateHeatmap(): Promise<void> {
  const provider = providerKey()
  if (!stopLayout) stopLayout = installHeatmapLayoutMode()
  if (!stopOverview) stopOverview = installHeatmapOverview(provider)
  if (!stopDom) stopDom = installHeatmapDataTruthDom()
  if (!stopInspector) stopInspector = installHeatmapSelectedInspector(provider)
  if (!stopSource) stopSource = installHeatmapResponseObserver(provider)
  renderHeatmapDataTruth(createHeatmapLoadingTruth(provider))
  const module = await import('../../live/twitch-heatmap')
  await module.hydrateTwitchHeatmap()
}

export const heatmapDataTruthAdapter: HeatmapPageAdapter = {
  name: 'heatmap-data-truth-adapter',
  boundaries: ['fetch', 'state', 'layout', 'renderer', 'inspector', 'summary', 'status'],
  mount: hydrateHeatmap,
  refresh: hydrateHeatmap,
  destroy: () => {
    stopSource?.()
    stopSource = null
    stopInspector?.()
    stopInspector = null
    stopDom?.()
    stopDom = null
    stopOverview?.()
    stopOverview = null
    stopLayout?.()
    stopLayout = null
  },
}
