import type { HeatmapItem, TileLayout } from './model'

export function buildDenseTreemap(
  input: HeatmapItem[],
  x: number,
  y: number,
  width: number,
  height: number,
): TileLayout[]
