export function findDirectionalNodeIndex(nodes, currentIndex, direction) {
  if (!Array.isArray(nodes) || nodes.length === 0) return -1
  const safeIndex = Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < nodes.length ? currentIndex : 0
  const current = center(nodes[safeIndex])
  let bestIndex = safeIndex
  let bestScore = Number.POSITIVE_INFINITY

  for (let index = 0; index < nodes.length; index += 1) {
    if (index === safeIndex) continue
    const candidate = center(nodes[index])
    const dx = candidate.x - current.x
    const dy = candidate.y - current.y
    if (!isInDirection(dx, dy, direction)) continue

    const primary = direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy)
    const secondary = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx)
    const score = primary + secondary * 1.75
    if (score < bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return bestIndex
}

export function describeHeatmapNode(node, index, total) {
  if (!node) return 'No stream selected.'
  const name = String(node.displayName || node.channelLogin || 'Unknown stream')
  const viewers = Number.isFinite(node.viewers) ? Math.max(0, Math.round(node.viewers)).toLocaleString() : 'unknown'
  const position = Number.isFinite(index) && Number.isFinite(total) && total > 0
    ? `Tile ${Math.max(1, index + 1)} of ${total}. `
    : ''
  return `${position}${name}, ${viewers} viewers. Press Enter to inspect.`
}

function center(node) {
  return {
    x: finite(node?.x) + positive(node?.width) / 2,
    y: finite(node?.y) + positive(node?.height) / 2,
  }
}

function isInDirection(dx, dy, direction) {
  if (direction === 'left') return dx < -0.5
  if (direction === 'right') return dx > 0.5
  if (direction === 'up') return dy < -0.5
  if (direction === 'down') return dy > 0.5
  return false
}

function finite(value) {
  return Number.isFinite(value) ? value : 0
}

function positive(value) {
  return Number.isFinite(value) && value > 0 ? value : 0
}
