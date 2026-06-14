import type { HeatmapPageAdapter } from './contracts'

async function hydrateLegacyHeatmap(): Promise<void> {
  const module = await import('../../live/twitch-heatmap')
  await module.hydrateTwitchHeatmap()
}

export const legacyHeatmapPageAdapter: HeatmapPageAdapter = {
  name: 'legacy-heatmap-page',
  boundaries: ['fetch', 'state', 'layout', 'renderer', 'inspector', 'status'],
  mount: hydrateLegacyHeatmap,
  refresh: hydrateLegacyHeatmap,
  destroy: () => {
    // The existing implementation owns viewport and refresh cleanup internally.
    // Later repair PRs replace this compatibility adapter boundary by boundary.
  },
}
