export type HeatmapTreemapItem<T> = {
  item: T
  weight: number
}

export type HeatmapTreemapLayout<T> = T & {
  x: number
  y: number
  width: number
  height: number
}

const OUTER_PADDING = 10
const INNER_GAP = 8

export function buildHeatmapTreemap<T>(
  items: HeatmapTreemapItem<T>[],
  width: number,
  height: number,
): HeatmapTreemapLayout<T>[] {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  const usable = insetRect({ x: 0, y: 0, width: safeWidth, height: safeHeight }, OUTER_PADDING)
  const positive = items.filter((entry) => entry.weight > 0)
  const total = positive.reduce((sum, entry) => sum + entry.weight, 0)

  if (!positive.length || total <= 0) return []

  const scaled = positive
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .map((entry) => ({
      item: entry.item,
      area: (entry.weight / total) * usable.width * usable.height,
    }))

  const out: HeatmapTreemapLayout<T>[] = []
  squarify(scaled, [], usable, out)
  return out
}

type Rect = {
  x: number
  y: number
  width: number
  height: number
}

type AreaNode<T> = {
  item: T
  area: number
}

function squarify<T>(
  remaining: AreaNode<T>[],
  row: AreaNode<T>[],
  rect: Rect,
  out: HeatmapTreemapLayout<T>[],
): void {
  if (!remaining.length) {
    if (row.length) {
      const { placed, nextRect } = layoutRow(row, rect)
      out.push(...placed)
      if (nextRect.width > 1 && nextRect.height > 1) {
        squarify([], [], nextRect, out)
      }
    }
    return
  }

  const next = remaining[0]
  const side = Math.min(rect.width, rect.height)

  if (!row.length || worst(row, side) >= worst([...row, next], side)) {
    squarify(remaining.slice(1), [...row, next], rect, out)
    return
  }

  const { placed, nextRect } = layoutRow(row, rect)
  out.push(...placed)
  squarify(remaining, [], nextRect, out)
}

function layoutRow<T>(row: AreaNode<T>[], rect: Rect): { placed: HeatmapTreemapLayout<T>[]; nextRect: Rect } {
  const totalArea = row.reduce((sum, entry) => sum + entry.area, 0)
  if (rect.width >= rect.height) {
    const rawRowWidth = totalArea / rect.height
    const rowWidth = Math.max(1, Math.min(rect.width, rawRowWidth))
    let cursorY = rect.y
    const placed = row.map((entry, index) => {
      const remainingArea = row.slice(index + 1).reduce((sum, item) => sum + item.area, 0)
      const isLast = index === row.length - 1
      const rawHeight = isLast ? rect.y + rect.height - cursorY : entry.area / rowWidth
      const height = Math.max(1, rawHeight)
      const tileRect = insetRect({ x: rect.x, y: cursorY, width: rowWidth, height }, INNER_GAP / 2)
      cursorY += height
      return {
        ...entry.item,
        x: Math.round(tileRect.x),
        y: Math.round(tileRect.y),
        width: Math.max(1, Math.round(tileRect.width)),
        height: Math.max(1, Math.round(tileRect.height)),
      }
    })
    return {
      placed,
      nextRect: { x: rect.x + rowWidth, y: rect.y, width: Math.max(1, rect.width - rowWidth), height: rect.height },
    }
  }

  const rawRowHeight = totalArea / rect.width
  const rowHeight = Math.max(1, Math.min(rect.height, rawRowHeight))
  let cursorX = rect.x
  const placed = row.map((entry, index) => {
    const isLast = index === row.length - 1
    const rawWidth = isLast ? rect.x + rect.width - cursorX : entry.area / rowHeight
    const width = Math.max(1, rawWidth)
    const tileRect = insetRect({ x: cursorX, y: rect.y, width, height: rowHeight }, INNER_GAP / 2)
    cursorX += width
    return {
      ...entry.item,
      x: Math.round(tileRect.x),
      y: Math.round(tileRect.y),
      width: Math.max(1, Math.round(tileRect.width)),
      height: Math.max(1, Math.round(tileRect.height)),
    }
  })
  return {
    placed,
    nextRect: { x: rect.x, y: rect.y + rowHeight, width: rect.width, height: Math.max(1, rect.height - rowHeight) },
  }
}

function worst<T>(row: AreaNode<T>[], side: number): number {
  const sum = row.reduce((acc, entry) => acc + entry.area, 0)
  if (!row.length || sum <= 0 || side <= 0) return Number.POSITIVE_INFINITY
  const max = Math.max(...row.map((entry) => entry.area))
  const min = Math.min(...row.map((entry) => entry.area))
  const sideSquared = side * side
  return Math.max((sideSquared * max) / (sum * sum), (sum * sum) / (sideSquared * min))
}

function insetRect(rect: Rect, inset: number): Rect {
  const x = rect.x + inset
  const y = rect.y + inset
  const width = Math.max(1, rect.width - inset * 2)
  const height = Math.max(1, rect.height - inset * 2)
  return { x, y, width, height }
}
