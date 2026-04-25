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
  rank: number
  isFeatured: boolean
  isPriority: boolean
}

type TileProfile =
  | 'tiny'
  | 'name_only'
  | 'compact'
  | 'standard'
  | 'featured_vertical'
  | 'featured_horizontal'

const TINY_AREA = 1800
const NAME_AREA = 4200
const COMPACT_AREA = 9000
const FEATURED_AREA = 18000
const PRIORITY_FEATURED_AREA = 10500
const MIN_SHORT_EDGE = 24
const COMPACT_SHORT_EDGE = 34
const FEATURED_SHORT_EDGE = 62
const PRIORITY_FEATURED_SHORT_EDGE = 42
const VERTICAL_RATIO = 0.72
const HORIZONTAL_RATIO = 1.38
const PRIORITY_RANK_LIMIT = 6
const FEATURED_RANK_LIMIT = 14

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

    ctx.fillStyle = getTileFillStyle(node)
    ctx.strokeStyle = getTileStrokeStyle(node, profile)
    ctx.lineWidth = profile === 'tiny' ? Math.max(0.28 / camera.scale, 0.36) : Math.max(0.9 / camera.scale, 1)
    ctx.fillRect(node.x, node.y, node.width, node.height)
    ctx.strokeRect(node.x, node.y, node.width, node.height)

    drawTileLabel(ctx, node, camera, metrics, profile)
  }

  ctx.restore()
}

function getTileFillStyle(node: HeatmapSceneNode): string {
  const strength = Math.min(1, Math.abs(node.momentum) / 1.6)
  const alpha = 0.58 + strength * 0.32

  if (node.momentum > 0.02) {
    const green = Math.round(140 + strength * 60)
    return `rgba(6, ${green}, 106, ${alpha})`
  }

  if (node.momentum < -0.02) {
    const red = Math.round(170 + strength * 70)
    return `rgba(${red}, 52, 82, ${alpha})`
  }

  return 'rgba(45, 58, 78, 0.9)'
}

function getTileStrokeStyle(node: HeatmapSceneNode, profile: TileProfile): string {
  const strength = Math.min(1, Math.abs(node.momentum) / 1.6)
  const tinyAlpha = 0.1 + strength * 0.12

  if (profile === 'tiny') {
    if (node.momentum > 0.02) return `rgba(167,243,208,${tinyAlpha})`
    if (node.momentum < -0.02) return `rgba(254,205,211,${tinyAlpha})`
    return 'rgba(148,163,184,0.08)'
  }

  const alpha = 0.36 + strength * 0.32
  if (node.momentum > 0.02) return `rgba(167,243,208,${alpha})`
  if (node.momentum < -0.02) return `rgba(254,205,211,${alpha})`
  return 'rgba(148,163,184,0.22)'
}

function drawTileLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  metrics: TileMetrics,
  profile: TileProfile,
): void {
  if (profile === 'tiny') return

  const padding = clamp(Math.min(metrics.screenWidth, metrics.screenHeight) * 0.08, 7, 18) / camera.scale
  const availableWorldWidth = Math.max(0, node.width - padding * 2)

  ctx.save()
  ctx.beginPath()
  ctx.rect(node.x, node.y, node.width, node.height)
  ctx.clip()

  if (profile === 'name_only') {
    drawSingleLineTitle(ctx, node, camera, padding, availableWorldWidth, clamp(Math.min(metrics.screenWidth * 0.15, metrics.screenHeight * 0.4), 10, 15) / camera.scale)
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
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.12, metrics.screenHeight * 0.32), 10, 16) / camera.scale
  const bodySize = clamp(titleSize * 0.78, 9, 13) / camera.scale
  const maxChars = Math.max(5, Math.floor((metrics.screenWidth - padding * camera.scale * 2) / (titleSize * camera.scale * 0.62)))

  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  let y = node.y + padding + titleSize
  ctx.fillText(truncateText(node.displayName, maxChars), node.x + padding, y, availableWorldWidth)

  if (metrics.shortEdge < COMPACT_SHORT_EDGE) return

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  y += bodySize + 5 / camera.scale
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
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.11, metrics.screenHeight * 0.26), 11, 17) / camera.scale
  const bodySize = clamp(titleSize * 0.76, 10, 14) / camera.scale
  const smallSize = clamp(bodySize * 0.86, 9, 12) / camera.scale
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

  if (metrics.screenHeight < 92 && !metrics.isPriority) return

  ctx.fillStyle = 'rgba(241,245,249,0.9)'
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
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.15, metrics.screenHeight * 0.13), 12, 20) / camera.scale
  const bodySize = clamp(titleSize * 0.9, 11, 17) / camera.scale
  const smallSize = clamp(bodySize * 0.8, 9, 13) / camera.scale
  const titleLines = wrapText(ctx, node.displayName, titleSize, availableWorldWidth, metrics.isPriority ? 2 : 1)

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

  if (metrics.screenHeight < 118 && !metrics.isPriority) return

  ctx.fillStyle = 'rgba(241,245,249,0.9)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  y += smallSize + 8 / camera.scale
  ctx.fillText(`${formatSignedPercent(node.momentum)} momentum`, node.x + padding, y, availableWorldWidth)

  if (metrics.screenHeight >= 190) {
    y += smallSize + 6 / camera.scale
    ctx.fillStyle = 'rgba(226,232,240,0.86)'
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
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.085, metrics.screenHeight * 0.25), 13, 22) / camera.scale
  const bodySize = clamp(titleSize * 0.84, 11, 17) / camera.scale
  const smallSize = clamp(bodySize * 0.8, 9, 13) / camera.scale
  const titleLines = wrapText(ctx, node.displayName, titleSize, availableWorldWidth, metrics.isPriority ? 2 : 1)

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
  y += 3 / camera.scale
  ctx.fillText(`${formatCompactViewers(node.viewers)} viewers`, node.x + padding, y, availableWorldWidth)

  if (metrics.screenHeight < 104 && !metrics.isPriority) return

  ctx.fillStyle = 'rgba(241,245,249,0.9)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  y += smallSize + 8 / camera.scale
  ctx.fillText(`${formatSignedPercent(node.momentum)} momentum`, node.x + padding, y, availableWorldWidth)

  if (metrics.screenWidth >= 340 && metrics.screenHeight >= 150) {
    y += smallSize + 6 / camera.scale
    ctx.fillStyle = 'rgba(226,232,240,0.86)'
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
    rank: node.rank,
    isFeatured: node.rank <= FEATURED_RANK_LIMIT,
    isPriority: node.rank <= PRIORITY_RANK_LIMIT,
  }
}

function getTileProfile(metrics: TileMetrics): TileProfile {
  if (metrics.screenArea < TINY_AREA || metrics.shortEdge < MIN_SHORT_EDGE) {
    return 'tiny'
  }

  if (metrics.isPriority && metrics.screenArea >= PRIORITY_FEATURED_AREA && metrics.shortEdge >= PRIORITY_FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
    return 'standard'
  }

  if (metrics.screenArea < NAME_AREA) {
    return 'name_only'
  }

  if (metrics.screenArea < COMPACT_AREA || metrics.shortEdge < COMPACT_SHORT_EDGE) {
    return 'compact'
  }

  if (metrics.isFeatured && metrics.screenArea >= FEATURED_AREA && metrics.shortEdge >= FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
    return 'standard'
  }

  if (metrics.screenArea >= FEATURED_AREA * 1.35 && metrics.shortEdge >= FEATURED_SHORT_EDGE) {
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
