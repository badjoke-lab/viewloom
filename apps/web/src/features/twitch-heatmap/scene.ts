import { buildDirectedTreemap } from './layout'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type HeatmapItem,
  type HeatmapSceneNode,
} from './model'

export function buildSceneNodes(
  items: HeatmapItem[],
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
): HeatmapSceneNode[] {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)

  return buildDirectedTreemap(items, 0, 0, safeWidth, safeHeight).map((layout, index) => ({
    ...layout,
    rank: index + 1,
  }))
}
