import type { HeatmapSceneNode } from '../model'

export type HeatmapNavigationDirection = 'left' | 'right' | 'up' | 'down'

export function findDirectionalNodeIndex(
  nodes: HeatmapSceneNode[],
  currentIndex: number,
  direction: HeatmapNavigationDirection,
): number

export function describeHeatmapNode(
  node: HeatmapSceneNode | null | undefined,
  index: number,
  total: number,
): string
