import type { HeatmapItem } from './model'

const byMomentumDesc = (left: HeatmapItem, right: HeatmapItem): number => right.momentum - left.momentum
const byActivityDesc = (left: HeatmapItem, right: HeatmapItem): number => right.activity - left.activity

export function getStrongestMomentum(items: HeatmapItem[]): HeatmapItem | undefined {
  return [...items].sort(byMomentumDesc)[0]
}

export function getHighestActivity(items: HeatmapItem[]): HeatmapItem | undefined {
  return [...items].sort(byActivityDesc)[0]
}

export function getTopMomentumLeaders(items: HeatmapItem[], limit = 3): HeatmapItem[] {
  return [...items].sort(byMomentumDesc).slice(0, limit)
}

export function getTopActivityLeaders(items: HeatmapItem[], limit = 3): HeatmapItem[] {
  return [...items].sort(byActivityDesc).slice(0, limit)
}
