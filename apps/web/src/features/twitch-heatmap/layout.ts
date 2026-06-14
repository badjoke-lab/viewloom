import { buildDenseTreemap } from './dense-treemap-core.mjs'
import type { HeatmapItem, TileLayout } from './model'

export function buildTreemap(items: HeatmapItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const safeItems = items.filter((item) => item.viewers > 0)
  return buildDenseTreemap(safeItems, x, y, width, height) as TileLayout[]
}

export function buildDirectedTreemap(items: HeatmapItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const safeItems = items
    .filter((item) => item.viewers > 0)
    .sort((a, b) => b.viewers - a.viewers || a.channelLogin.localeCompare(b.channelLogin))
  return buildDenseTreemap(safeItems, x, y, width, height) as TileLayout[]
}

export function getDensity(width: number, height: number): 'large' | 'medium' | 'small' {
  const area = width * height
  const minEdge = Math.min(width, height)
  if (area > 145000 && minEdge > 190) return 'large'
  if (area > 52000 && minEdge > 110) return 'medium'
  return 'small'
}
