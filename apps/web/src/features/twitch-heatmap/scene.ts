import { buildTreemap } from './layout'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type HeatmapItem,
  type HeatmapSceneNode,
} from './model'

export function buildSceneNodes(items: HeatmapItem[]): HeatmapSceneNode[] {
  return buildTreemap(items, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).map((layout, index) => ({
    ...layout,
    rank: index + 1,
  }))
}
