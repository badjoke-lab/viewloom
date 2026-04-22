import type { HeatmapItem, TileLayout } from './model'

export function buildTreemap(items: HeatmapItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const safeItems = items.filter((item) => item.viewers > 0)
  const layouts: TileLayout[] = []
  layoutGroup(safeItems, x, y, width, height, layouts)
  return layouts
}

export function getDensity(width: number, height: number): 'large' | 'medium' | 'small' {
  const area = width * height
  const minEdge = Math.min(width, height)
  if (area > 145000 && minEdge > 190) return 'large'
  if (area > 52000 && minEdge > 110) return 'medium'
  return 'small'
}

function layoutGroup(items: HeatmapItem[], x: number, y: number, width: number, height: number, out: TileLayout[]): void {
  if (!items.length || width <= 0 || height <= 0) return

  if (items.length === 1) {
    out.push({
      ...items[0],
      x: Math.round(x),
      y: Math.round(y),
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    })
    return
  }

  const total = items.reduce((sum, item) => sum + item.viewers, 0)
  let firstWeight = 0
  let splitIndex = 1

  for (let index = 0; index < items.length; index += 1) {
    firstWeight += items[index].viewers
    splitIndex = index + 1
    if (firstWeight >= total / 2) break
  }

  const primary = items.slice(0, splitIndex)
  const secondary = items.slice(splitIndex)
  if (!secondary.length) {
    out.push({
      ...items[0],
      x: Math.round(x),
      y: Math.round(y),
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height)),
    })
    return
  }

  const ratio = primary.reduce((sum, item) => sum + item.viewers, 0) / total
  const gap = Math.min(10, Math.max(4, Math.min(width, height) * 0.015))

  if (width >= height) {
    const primaryWidth = Math.max(1, width * ratio - gap / 2)
    const secondaryWidth = Math.max(1, width - primaryWidth - gap)
    layoutGroup(primary, x, y, primaryWidth, height, out)
    layoutGroup(secondary, x + primaryWidth + gap, y, secondaryWidth, height, out)
    return
  }

  const primaryHeight = Math.max(1, height * ratio - gap / 2)
  const secondaryHeight = Math.max(1, height - primaryHeight - gap)
  layoutGroup(primary, x, y, width, primaryHeight, out)
  layoutGroup(secondary, x, y + primaryHeight + gap, width, secondaryHeight, out)
}
