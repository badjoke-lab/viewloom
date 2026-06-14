const EPSILON = 1e-9

/**
 * Build a gapless, area-preserving squarified treemap.
 * Structural gaps are deliberately excluded from layout geometry; the renderer
 * owns the one-screen-pixel visual seam so zoom never widens the field.
 *
 * @param {Array<Record<string, unknown> & { viewers: number }>} input
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @returns {Array<Record<string, unknown> & { viewers: number, x: number, y: number, width: number, height: number }>}
 */
export function buildDenseTreemap(input, x, y, width, height) {
  const safeWidth = finitePositive(width)
  const safeHeight = finitePositive(height)
  if (safeWidth <= 0 || safeHeight <= 0) return []

  const items = input
    .filter((item) => item && Number.isFinite(item.viewers) && item.viewers > 0)
  const totalWeight = items.reduce((sum, item) => sum + item.viewers, 0)
  if (!items.length || totalWeight <= 0) return []

  const availableArea = safeWidth * safeHeight
  const weighted = items.map((item) => ({
    item,
    area: (item.viewers / totalWeight) * availableArea,
  }))

  return squarify(weighted, {
    x: finiteNumber(x),
    y: finiteNumber(y),
    width: safeWidth,
    height: safeHeight,
  })
}

function squarify(weighted, initialRect) {
  const layouts = []
  const remaining = [...weighted]
  let rect = { ...initialRect }
  let row = []

  while (remaining.length && rect.width > EPSILON && rect.height > EPSILON) {
    const next = remaining[0]
    const shortSide = Math.max(EPSILON, Math.min(rect.width, rect.height))

    if (!row.length || worstAspect([...row, next], shortSide) <= worstAspect(row, shortSide)) {
      row.push(next)
      remaining.shift()
      continue
    }

    rect = placeRow(row, rect, layouts)
    row = []
  }

  if (row.length && rect.width > EPSILON && rect.height > EPSILON) {
    placeRow(row, rect, layouts)
  }

  return layouts
}

function placeRow(row, rect, layouts) {
  const rowArea = row.reduce((sum, entry) => sum + entry.area, 0)
  if (rowArea <= EPSILON) return rect

  if (rect.width >= rect.height) {
    const stripWidth = clamp(rowArea / Math.max(EPSILON, rect.height), EPSILON, rect.width)
    let cursorY = rect.y

    row.forEach((entry, index) => {
      const isLast = index === row.length - 1
      const itemHeight = isLast
        ? Math.max(EPSILON, rect.y + rect.height - cursorY)
        : Math.max(EPSILON, entry.area / stripWidth)
      layouts.push(toLayout(entry.item, rect.x, cursorY, stripWidth, itemHeight))
      cursorY += itemHeight
    })

    return {
      x: rect.x + stripWidth,
      y: rect.y,
      width: Math.max(0, rect.width - stripWidth),
      height: rect.height,
    }
  }

  const stripHeight = clamp(rowArea / Math.max(EPSILON, rect.width), EPSILON, rect.height)
  let cursorX = rect.x

  row.forEach((entry, index) => {
    const isLast = index === row.length - 1
    const itemWidth = isLast
      ? Math.max(EPSILON, rect.x + rect.width - cursorX)
      : Math.max(EPSILON, entry.area / stripHeight)
    layouts.push(toLayout(entry.item, cursorX, rect.y, itemWidth, stripHeight))
    cursorX += itemWidth
  })

  return {
    x: rect.x,
    y: rect.y + stripHeight,
    width: rect.width,
    height: Math.max(0, rect.height - stripHeight),
  }
}

function worstAspect(row, shortSide) {
  if (!row.length) return Number.POSITIVE_INFINITY
  const areas = row.map((entry) => entry.area)
  const sum = areas.reduce((total, area) => total + area, 0)
  const minArea = Math.max(EPSILON, Math.min(...areas))
  const maxArea = Math.max(EPSILON, Math.max(...areas))
  const sideSquared = shortSide * shortSide
  const sumSquared = sum * sum
  return Math.max(
    (sideSquared * maxArea) / Math.max(EPSILON, sumSquared),
    sumSquared / Math.max(EPSILON, sideSquared * minArea),
  )
}

function toLayout(item, x, y, width, height) {
  return {
    ...item,
    x,
    y,
    width: Math.max(EPSILON, width),
    height: Math.max(EPSILON, height),
  }
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : 0
}

function finitePositive(value) {
  return Number.isFinite(value) && value > 0 ? value : 0
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
