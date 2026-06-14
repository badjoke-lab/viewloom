import {
  formatCompactViewers,
  formatPercent,
  formatSignedPercent,
} from './format'
import {
  makeShortLabel,
  normalizeLabel,
  resolveHeatmapLod,
  segmentGraphemes,
  type HeatmapLodDecision,
} from './lod-core.mjs'
import type { CameraState, HeatmapSceneNode } from './model'

type TileBounds = {
  x: number
  y: number
  width: number
  height: number
}

const LABEL_INSET_PX = 1
const TITLE_COLOR = 'rgba(255,255,255,0.97)'
const META_COLOR = 'rgba(226,232,240,0.74)'

export function drawLabelsLayer(
  ctx: CanvasRenderingContext2D,
  nodes: HeatmapSceneNode[],
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  dpr: number,
  selectedStreamLogin: string | null,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)

  for (const node of nodes) {
    const decision = resolveHeatmapLod({
      screenWidth: node.width * camera.scale,
      screenHeight: node.height * camera.scale,
      isSelected: node.channelLogin === selectedStreamLogin,
    })
    if (decision.titleMode === 'none') continue

    const bounds = insetBounds(node, LABEL_INSET_PX / camera.scale)
    if (bounds.width <= 0 || bounds.height <= 0) continue
    drawNodeLabel(ctx, node, camera, bounds, decision)
  }

  ctx.restore()
}

function drawNodeLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  decision: HeatmapLodDecision,
): void {
  const padding = decision.paddingPx / camera.scale
  const titleSize = decision.titleFontPx / camera.scale
  const metricSize = decision.metricFontPx / camera.scale
  const detailSize = decision.detailFontPx / camera.scale
  const innerWidth = Math.max(0, bounds.width - padding * 2)
  const innerHeight = Math.max(0, bounds.height - padding * 2)
  if (innerWidth <= 0 || innerHeight <= 0) return

  ctx.save()
  ctx.beginPath()
  ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
  ctx.clip()
  ctx.shadowColor = 'rgba(0,0,0,0.48)'
  ctx.shadowBlur = 2 / camera.scale
  ctx.shadowOffsetY = 1 / camera.scale
  ctx.textBaseline = 'top'

  const titleLines = resolveTitleLines(ctx, node.displayName, decision, titleSize, innerWidth)
  ctx.fillStyle = TITLE_COLOR
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`

  const lineGap = 2 / camera.scale
  let cursorY = bounds.y + padding
  for (const line of titleLines) {
    ctx.fillText(line, bounds.x + padding, cursorY)
    cursorY += titleSize + lineGap
  }

  if (decision.showLogin && shouldShowLogin(node)) {
    const loginY = cursorY + 1 / camera.scale
    const reservedBottom = bottomReservedHeight(decision, metricSize, detailSize, camera.scale)
    if (loginY + detailSize <= bounds.y + bounds.height - padding - reservedBottom) {
      ctx.fillStyle = META_COLOR
      ctx.font = `600 ${detailSize}px Inter, system-ui, sans-serif`
      ctx.fillText(fitText(ctx, `@${node.channelLogin}`, innerWidth), bounds.x + padding, loginY)
    }
  }

  drawBottomRows(ctx, node, camera, bounds, padding, innerWidth, metricSize, detailSize, decision)
  ctx.restore()
}

function resolveTitleLines(
  ctx: CanvasRenderingContext2D,
  displayName: string,
  decision: HeatmapLodDecision,
  titleSize: number,
  maxWidth: number,
): string[] {
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  if (decision.titleMode === 'short') {
    const capacity = Math.max(1, Math.min(6, Math.floor(maxWidth / Math.max(1, titleSize * 0.62))))
    return [fitText(ctx, makeShortLabel(displayName, capacity), maxWidth)]
  }
  return wrapLabel(ctx, displayName, maxWidth, Math.max(1, decision.titleLines))
}

function drawBottomRows(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  innerWidth: number,
  metricSize: number,
  detailSize: number,
  decision: HeatmapLodDecision,
): void {
  if (!decision.showViewers) return

  const lineGap = 4 / camera.scale
  let baseline = bounds.y + bounds.height - padding
  ctx.textBaseline = 'bottom'

  if (decision.showActivity || decision.showRank) {
    ctx.font = `600 ${detailSize}px Inter, system-ui, sans-serif`
    ctx.fillStyle = META_COLOR
    const left = decision.showRank ? `#${node.rank}` : ''
    const right = decision.showActivity ? `${formatPercent(node.activity)} activity` : ''
    drawLeftRight(ctx, left, right, bounds.x + padding, baseline, innerWidth)
    baseline -= detailSize + lineGap
  }

  ctx.font = `700 ${metricSize}px Inter, system-ui, sans-serif`
  const viewers = formatCompactViewers(node.viewers)
  if (!decision.showMomentum) {
    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.fillText(fitText(ctx, viewers, innerWidth), bounds.x + padding, baseline)
    return
  }

  const momentum = formatSignedPercent(node.momentum)
  const viewerWidth = ctx.measureText(viewers).width
  const momentumWidth = ctx.measureText(momentum).width
  const availableGap = 7 / camera.scale

  if (viewerWidth + momentumWidth + availableGap <= innerWidth) {
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    ctx.fillText(viewers, bounds.x + padding, baseline)
    ctx.fillStyle = momentumColor(node.momentum)
    ctx.fillText(momentum, bounds.x + padding + innerWidth - momentumWidth, baseline)
    return
  }

  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.fillText(fitText(ctx, viewers, innerWidth), bounds.x + padding, baseline)
  const upperBaseline = baseline - metricSize - lineGap
  ctx.fillStyle = momentumColor(node.momentum)
  ctx.fillText(fitText(ctx, momentum, innerWidth), bounds.x + padding, upperBaseline)
}

function drawLeftRight(
  ctx: CanvasRenderingContext2D,
  left: string,
  right: string,
  x: number,
  baseline: number,
  maxWidth: number,
): void {
  const leftWidth = left ? ctx.measureText(left).width : 0
  const rightWidth = right ? ctx.measureText(right).width : 0
  const gap = left && right ? 6 : 0

  if (leftWidth + rightWidth + gap <= maxWidth) {
    if (left) ctx.fillText(left, x, baseline)
    if (right) ctx.fillText(right, x + maxWidth - rightWidth, baseline)
    return
  }

  const combined = [left, right].filter(Boolean).join(' · ')
  ctx.fillText(fitText(ctx, combined, maxWidth), x, baseline)
}

function bottomReservedHeight(
  decision: HeatmapLodDecision,
  metricSize: number,
  detailSize: number,
  scale: number,
): number {
  if (!decision.showViewers) return 0
  const gap = 4 / scale
  let height = metricSize
  if (decision.showMomentum) height += metricSize + gap
  if (decision.showActivity || decision.showRank) height += detailSize + gap
  return height
}

function shouldShowLogin(node: HeatmapSceneNode): boolean {
  const display = normalizeLabel(node.displayName).toLocaleLowerCase()
  const login = normalizeLabel(node.channelLogin).toLocaleLowerCase()
  return Boolean(login) && display !== login && display !== `@${login}`
}

function wrapLabel(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const normalized = normalizeLabel(value)
  if (!normalized || maxLines <= 0) return []
  if (ctx.measureText(normalized).width <= maxWidth) return [normalized]

  let remaining = segmentGraphemes(normalized)
  const lines: string[] = []

  while (remaining.length && lines.length < maxLines) {
    const isLastLine = lines.length === maxLines - 1
    if (isLastLine) {
      lines.push(fitGraphemes(ctx, remaining, maxWidth, true))
      break
    }

    const count = fittingCount(ctx, remaining, maxWidth)
    if (count <= 0) break
    let breakAt = preferredBreak(remaining, count)
    if (breakAt <= 0) breakAt = count

    const line = trimSeparators(remaining.slice(0, breakAt).join(''))
    if (line) lines.push(line)
    remaining = remaining.slice(breakAt)
    while (remaining.length && isSeparator(remaining[0])) remaining.shift()
  }

  return lines.length ? lines : [fitText(ctx, normalized, maxWidth)]
}

function fitText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  const graphemes = segmentGraphemes(normalizeLabel(value))
  return fitGraphemes(ctx, graphemes, maxWidth, true)
}

function fitGraphemes(
  ctx: CanvasRenderingContext2D,
  graphemes: string[],
  maxWidth: number,
  ellipsis: boolean,
): string {
  const value = graphemes.join('')
  if (ctx.measureText(value).width <= maxWidth) return value
  const ellipsisText = ellipsis ? '…' : ''
  let low = 0
  let high = graphemes.length

  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    const candidate = `${graphemes.slice(0, mid).join('')}${ellipsisText}`
    if (ctx.measureText(candidate).width <= maxWidth) low = mid
    else high = mid - 1
  }

  if (low <= 0) return ctx.measureText(ellipsisText).width <= maxWidth ? ellipsisText : ''
  return `${graphemes.slice(0, low).join('')}${ellipsisText}`
}

function fittingCount(ctx: CanvasRenderingContext2D, graphemes: string[], maxWidth: number): number {
  let low = 0
  let high = graphemes.length
  while (low < high) {
    const mid = Math.ceil((low + high) / 2)
    if (ctx.measureText(graphemes.slice(0, mid).join('')).width <= maxWidth) low = mid
    else high = mid - 1
  }
  return low
}

function preferredBreak(graphemes: string[], limit: number): number {
  for (let index = Math.min(limit, graphemes.length) - 1; index >= 1; index -= 1) {
    if (isSeparator(graphemes[index])) return index
  }
  return limit
}

function isSeparator(value: string): boolean {
  return /^[\s_\-–—]$/u.test(value)
}

function trimSeparators(value: string): string {
  return value.replace(/^[\s_\-–—]+|[\s_\-–—]+$/gu, '')
}

function insetBounds(node: HeatmapSceneNode, inset: number): TileBounds {
  return {
    x: node.x + inset,
    y: node.y + inset,
    width: Math.max(0, node.width - inset * 2),
    height: Math.max(0, node.height - inset * 2),
  }
}

function momentumColor(momentum: number): string {
  if (momentum > 0.015) return 'rgba(167,243,208,0.94)'
  if (momentum < -0.015) return 'rgba(254,205,211,0.94)'
  return 'rgba(226,232,240,0.8)'
}
