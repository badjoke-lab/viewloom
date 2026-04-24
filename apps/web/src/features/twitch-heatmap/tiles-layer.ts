import {
  formatCompactViewers,
  formatPercent,
  formatSignedPercent,
} from './format'
import type { CameraState, HeatmapSceneNode } from './model'

type TileMetrics = {
  screenWidth: number
  screenHeight: number
  screenArea: number
  shortEdge: number
  aspectRatio: number
  isFeatured: boolean
}

type TileProfile =
  | 'tiny'
  | 'name_only'
  | 'compact'
  | 'standard'
  | 'featured_vertical'
  | 'featured_horizontal'

const TINY_AREA = 1200
const NAME_AREA = 2600
const COMPACT_AREA = 6200
const FEATURED_AREA = 12000
const MIN_SHORT_EDGE = 22
const FEATURED_SHORT_EDGE = 58
const VERTICAL_RATIO = 0.72
const HORIZONTAL_RATIO = 1.4

export function drawTilesLayer(
  ctx: CanvasRenderingContext2D,
  nodes: HeatmapSceneNode[],
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  dpr: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)

  for (const node of nodes) {
    const metrics = getTileMetrics(node, camera)
    const profile = getTileProfile(metrics)

    ctx.fillStyle = node.momentum > 0.02 ? 'rgba(16,185,129,0.78)' : node.momentum < -0.02 ? 'rgba(244,63,94,0.78)' : 'rgba(51,65,85,0.92)'
    ctx.strokeStyle = node.momentum > 0.02 ? 'rgba(167,243,208,0.8)' : node.momentum < -0.02 ? 'rgba(254,205,211,0.8)' : 'rgba(148,163,184,0.28)'
    ctx.lineWidth = profile === 'tiny' ? Math.max(0.7 / camera.scale, 0.85) : Math.max(1 / camera.scale, 1.25)
    ctx.fillRect(node.x, node.y, node.width, node.height)
    ctx.strokeRect(node.x, node.y, node.width, node.height)

    drawTileLabel(ctx, node, camera, metrics, profile)
  }

  ctx.restore()
}

function drawTileLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  metrics: TileMetrics,
  profile: TileProfile,
): void {
  if (profile === 'tiny') return

  const padding = clamp(Math.min(metrics.screenWidth, metrics.screenHeight) * 0.08, 8, 18) / camera.scale
  const availableWorldWidth = Math.max(0, node.width - padding * 2)

  ctx.save()
  ctx.beginPath()
  ctx.rect(node.x, node.y, node.width, node.height)
  ctx.clip()

  if (profile === 'name_only') {
    drawSingleLineTitle(ctx, node, camera, padding, availableWorldWidth, clamp(Math.min(metrics.screenWidth * 0.16, metrics.screenHeight * 0.42), 11, 16) / camera.scale)
    ctx.restore()
    return
  }

  if (profile === 'compact') {
    drawCompactLabel(ctx, node, camera, padding, availableWorldWidth, metrics)
    ctx.restore()
    return
  }

  if (profile === 'featured_vertical') {
    drawFeaturedVerticalLabel(ctx, node, camera, padding, availableWorldWidth, metrics)
    ctx.restore()
    return
  }

  if (profile === 'featured_horizontal') {
    drawFeaturedHorizontalLabel(ctx, node, camera, padding, availableWorldWidth, metrics)
    ctx.restore()
    return
  }

  drawStandardLabel(ctx, node, camera, padding, availableWorldWidth, metrics)
  ctx.restore()
}

function drawSingleLineTitle(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  padding: number,
  availableWorldWidth: number,
  titleSize: number,
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  const maxChars = Math.max(4, Math.floor((node.width * camera.scale - padding * camera.scale * 2) / (titleSize * camera.scale * 0.62)))
  ctx.fillText(truncateText(node.displayName, maxChars), node.x + padding, node.y + padding + titleSize, availableWorldWidth)
}

function drawCompactLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.13, metrics.screenHeight * 0.34), 11, 17) / camera.scale
  const bodySize = clamp(titleSize * 0.84, 10, 14) / camera.scale
  const maxChars = Math.max(5, Math.floor((metrics.screenWidth - padding * camera.scale * 2) / (titleSize * camera.scale * 0.62)))

  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  let y = node.y + padding + titleSize
  ctx.fillText(truncateText(node.displayName, maxChars), node.x + padding, y, availableWorldWidth)

  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  y += bodySize + 6 / camera.scale
  ctx.fillText(formatCompactViewers(node.viewers), node.x + padding, y, availableWorldWidth)
}

function drawStandardLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.12, metrics.screenHeight * 0.28), 12, 18) / camera.scale
  const bodySize = clamp(titleSize * 0.78, 10, 15) / camera.scale
  const smallSize = clamp(bodySize * 0.9, 9, 13) / camera.scale
  const maxChars = Math.max(6, Math.floor((metrics.screenWidth - padding * camera.scale * 2) / (titleSize * camera.scale * 0.6)))

  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  let y = node.y + padding + titleSize
  ctx.fillText(truncateText(node.displayName, maxChars), node.x + padding, y, availableWorldWidth)

  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  y += bodySize + 7 / camera.scale
  ctx.fillText(`${formatCompactViewers(node.viewers)} viewers`, node.x + padding, y, availableWorldWidth)

  ctx.fillStyle = 'rgba(241,245,249,0.92)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  y += smallSize + 7 / camera.scale
  ctx.fillText(`${formatSignedPercent(node.momentum)} momentum`, node.x + padding, y, availableWorldWidth)
}

function drawFeaturedVerticalLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.16, metrics.screenHeight * 0.14), 13, 20) / camera.scale
  const bodySize = clamp(titleSize * 0.95, 11, 18) / camera.scale
  const smallSize = clamp(bodySize * 0.82, 9, 13) / camera.scale
  const titleLines = wrapText(ctx, node.displayName, titleSize, availableWorldWidth, 2)

  let y = node.y + padding + titleSize
  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  for (const line of titleLines) {
    ctx.fillText(line, node.x + padding, y, availableWorldWidth)
    y += titleSize + 4 / camera.scale
  }

  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  y += 6 / camera.scale
  ctx.fillText(`${formatCompactViewers(node.viewers)} viewers`, node.x + padding, y, availableWorldWidth)

  ctx.fillStyle = 'rgba(241,245,249,0.92)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  y += smallSize + 8 / camera.scale
  ctx.fillText(`${formatSignedPercent(node.momentum)} momentum`, node.x + padding, y, availableWorldWidth)

  if (metrics.screenHeight >= 170) {
    y += smallSize + 6 / camera.scale
    ctx.fillStyle = 'rgba(226,232,240,0.9)'
    ctx.fillText(`${formatPercent(node.activity)} activity`, node.x + padding, y, availableWorldWidth)
  }
}

function drawFeaturedHorizontalLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.1, metrics.screenHeight * 0.28), 14, 24) / camera.scale
  const bodySize = clamp(titleSize * 0.9, 11, 18) / camera.scale
  const smallSize = clamp(bodySize * 0.82, 9, 13) / camera.scale
  const titleLines = wrapText(ctx, node.displayName, titleSize, availableWorldWidth, 2)

  let y = node.y + padding + titleSize
  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  for (const line of titleLines) {
    ctx.fillText(line, node.x + padding, y, availableWorldWidth)
    y += titleSize + 4 / camera.scale
  }

  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  y += 4 / camera.scale
  ctx.fillText(`${formatCompactViewers(node.viewers)} viewers`, node.x + padding, y, availableWorldWidth)

  ctx.fillStyle = 'rgba(241,245,249,0.92)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  y += smallSize + 8 / camera.scale
  ctx.fillText(`${formatSignedPercent(node.momentum)} momentum`, node.x + padding, y, availableWorldWidth)

  if (metrics.screenWidth >= 300) {
    y += smallSize + 6 / camera.scale
    ctx.fillStyle = 'rgba(226,232,240,0.9)'
    ctx.fillText(`${formatPercent(node.activity)} activity`, node.x + padding, y, availableWorldWidth)
  }
}

function getTileMetrics(node: HeatmapSceneNode, camera: CameraState): TileMetrics {
  const screenWidth = node.width * camera.scale
  const screenHeight = node.height * camera.scale
  const shortEdge = Math.min(screenWidth, screenHeight)

  return {
    screenWidth,
    screenHeight,
    screenArea: screenWidth * screenHeight,
    shortEdge,
    aspectRatio: screenWidth / Math.max(1, screenHeight),
    isFeatured: node.rank <= 12,
  }
}

function getTileProfile(metrics: TileMetrics): TileProfile {
  if (metrics.screenArea < TINY_AREA || metrics.shortEdge < MIN_SHORT_EDGE) {
    return 'tiny'
  }

  if (metrics.screenArea < NAME_AREA) {
    return 'name_only'
  }

  if (metrics.screenArea < COMPACT_AREA) {
    return 'compact'
  }

  if (metrics.isFeatured && metrics.screenArea >= FEATURED_AREA && metrics.shortEdge >= FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
    return 'standard'
  }

  if (metrics.screenArea >= FEATURED_AREA && metrics.shortEdge >= FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
  }

  return 'standard'
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  value: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  ctx.font = `700 ${fontSize}px Inter, system-ui, sans-serif`
  const words = value.split(/[_\s]+/).filter(Boolean)
  if (!words.length) return [truncateText(value, 10)]

  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }

    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }

  if (current && lines.length < maxLines) {
    lines.push(current)
  }

  const consumed = lines.join(' ').split(' ').filter(Boolean).length
  const remaining = words.slice(consumed).join(' ')
  if (remaining && lines.length) {
    lines[lines.length - 1] = truncateToWidth(ctx, `${lines[lines.length - 1]} ${remaining}`.trim(), maxWidth)
  }

  return lines.slice(0, maxLines)
}

function truncateToWidth(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  if (ctx.measureText(value).width <= maxWidth) return value
  let text = value
  while (text.length > 2 && ctx.measureText(`${text}…`).width > maxWidth) {
    text = text.slice(0, -1)
  }
  return `${text}…`
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  if (maxChars <= 1) return value.slice(0, maxChars)
  return `${value.slice(0, maxChars - 1)}…`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
