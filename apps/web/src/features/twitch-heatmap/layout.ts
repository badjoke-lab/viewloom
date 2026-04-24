import type { HeatmapItem, TileLayout } from './model'

type WeightedItem = HeatmapItem & {
  area: number
}

export function buildTreemap(items: HeatmapItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const safeItems = items.filter((item) => item.viewers > 0)
  const layouts: TileLayout[] = []
  layoutGroup(safeItems, x, y, width, height, layouts)
  return layouts
}

export function buildDirectedTreemap(items: HeatmapItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const safeItems = items.filter((item) => item.viewers > 0).sort((a, b) => b.viewers - a.viewers)
  const total = safeItems.reduce((sum, item) => sum + item.viewers, 0)
  if (!safeItems.length || total <= 0 || width <= 0 || height <= 0) return []

  const availableArea = Math.max(1, width * height)
  const weightedItems = safeItems.map((item) => ({
    ...item,
    area: (item.viewers / total) * availableArea,
  }))

  return layoutSquarified(weightedItems, x, y, width, height)
}

export function getDensity(width: number, height: number): 'large' | 'medium' | 'small' {
  const area = width * height
  const minEdge = Math.min(width, height)
  if (area > 145000 && minEdge > 190) return 'large'
  if (area > 52000 && minEdge > 110) return 'medium'
  return 'small'
}

function layoutSquarified(items: WeightedItem[], x: number, y: number, width: number, height: number): TileLayout[] {
  const layouts: TileLayout[] = []
  let remaining = [...items]
  let cursorX = x
  let cursorY = y
  let remainingWidth = width
  let remainingHeight = height

  while (remaining.length && remainingWidth > 0 && remainingHeight > 0) {
    const shortSide = Math.max(1, Math.min(remainingWidth, remainingHeight))
    const row: WeightedItem[] = []

    while (remaining.length) {
      const next = remaining[0]
      if (!row.length) {
        row.push(next)
        remaining = remaining.slice(1)
        continue
      }

      const currentScore = worstAspect(row.map((item) => item.area), shortSide)
      const nextScore = worstAspect([...row.map((item) => item.area), next.area], shortSide)
      if (nextScore > currentScore) break

      row.push(next)
      remaining = remaining.slice(1)
    }

    const rowArea = row.reduce((sum, item) => sum + item.area, 0)
    const gap = Math.min(8, Math.max(3, Math.min(remainingWidth, remainingHeight) * 0.01))

    if (remainingWidth >= remainingHeight) {
      const stripWidth = Math.min(remainingWidth, Math.max(1, rowArea / Math.max(1, remainingHeight)))
      layoutVerticalStrip(row, cursorX, cursorY, stripWidth, remainingHeight, gap, layouts)
      cursorX += stripWidth + gap
      remainingWidth = Math.max(1, width - (cursorX - x))
    } else {
      const stripHeight = Math.min(remainingHeight, Math.max(1, rowArea / Math.max(1, remainingWidth)))
      layoutHorizontalStrip(row, cursorX, cursorY, remainingWidth, stripHeight, gap, layouts)
      cursorY += stripHeight + gap
      remainingHeight = Math.max(1, height - (cursorY - y))
    }
  }

  return layouts
}

function layoutVerticalStrip(row: WeightedItem[], x: number, y: number, width: number, height: number, gap: number, out: TileLayout[]): void {
  const totalArea = row.reduce((sum, item) => sum + item.area, 0)
  const totalGap = gap * Math.max(0, row.length - 1)
  const availableHeight = Math.max(1, height - totalGap)
  let cursorY = y

  row.forEach((item, index) => {
    const isLast = index === row.length - 1
    const itemHeight = isLast ? Math.max(1, y + height - cursorY) : Math.max(1, (item.area / totalArea) * availableHeight)
    out.push(toLayout(item, x, cursorY, width, itemHeight))
    cursorY += itemHeight + gap
  })
}

function layoutHorizontalStrip(row: WeightedItem[], x: number, y: number, width: number, height: number, gap: number, out: TileLayout[]): void {
  const totalArea = row.reduce((sum, item) => sum + item.area, 0)
  const totalGap = gap * Math.max(0, row.length - 1)
  const availableWidth = Math.max(1, width - totalGap)
  let cursorX = x

  row.forEach((item, index) => {
    const isLast = index === row.length - 1
    const itemWidth = isLast ? Math.max(1, x + width - cursorX) : Math.max(1, (item.area / totalArea) * availableWidth)
    out.push(toLayout(item, cursorX, y, itemWidth, height))
    cursorX += itemWidth + gap
  })
}

function worstAspect(areas: number[], side: number): number {
  const sum = areas.reduce((total, area) => total + area, 0)
  const minArea = Math.max(1, Math.min(...areas))
  const maxArea = Math.max(1, Math.max(...areas))
  const sideSquared = side * side
  const sumSquared = sum * sum
  return Math.max((sideSquared * maxArea) / sumSquared, sumSquared / (sideSquared * minArea))
}

function toLayout(item: HeatmapItem, x: number, y: number, width: number, height: number): TileLayout {
  return {
    ...item,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}

function layoutGroup(items: HeatmapItem[], x: number, y: number, width: number, height: number, out: TileLayout[]): void {
  if (!items.length || width <= 0 || height <= 0) return

  if (items.length === 1) {
    out.push(toLayout(items[0], x, y, width, height))
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
    out.push(toLayout(items[0], x, y, width, height))
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
