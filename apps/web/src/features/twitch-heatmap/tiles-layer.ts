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

type TileBounds = {
  x: number
  y: number
  width: number
  height: number
}

type TileProfile =
  | 'tiny'
  | 'name_only'
  | 'compact'
  | 'standard'
  | 'featured_vertical'
  | 'featured_horizontal'

const TILE_INSET_PX = 0.5
const TILE_STROKE_PX = 0.6
const FLAT_MOMENTUM_THRESHOLD = 0.015
const MOMENTUM_SCALE = 0.18
const ACTIVITY_SCALE = 0.25
const TINY_AREA = 1600
const NAME_AREA = 3800
const COMPACT_AREA = 8200
const FEATURED_AREA = 19000
const PRIORITY_FEATURED_AREA = 10800
const MIN_SHORT_EDGE = 20
const COMPACT_SHORT_EDGE = 32
const FEATURED_SHORT_EDGE = 58
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
    const bounds = insetBounds(node, TILE_INSET_PX / camera.scale)
    if (bounds.width <= 0 || bounds.height <= 0) continue

    ctx.fillStyle = getTileFillStyle(node)
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    if (metrics.screenWidth >= 2 && metrics.screenHeight >= 2) {
      ctx.strokeStyle = getTileStrokeStyle(profile)
      ctx.lineWidth = TILE_STROKE_PX / camera.scale
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    }

    drawTileLabel(ctx, node, camera, metrics, profile, bounds)
  }

  ctx.restore()
}

function getTileFillStyle(node: HeatmapSceneNode): string {
  const strength = momentumStrength(node.momentum)
  const activity = activityStrength(node.activity)
  const lift = activity * 1.8

  if (node.momentum > FLAT_MOMENTUM_THRESHOLD) {
    const saturation = 44 + strength * 22
    const lightness = 20 + strength * 9 + lift
    return `hsl(157 ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`
  }

  if (node.momentum < -FLAT_MOMENTUM_THRESHOLD) {
    const saturation = 42 + strength * 22
    const lightness = 22 + strength * 8 + lift
    return `hsl(344 ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`
  }

  const saturation = 22 + activity * 3
  const lightness = 20.5 + activity * 2
  return `hsl(216 ${saturation.toFixed(1)}% ${lightness.toFixed(1)}%)`
}

function getTileStrokeStyle(profile: TileProfile): string {
  return profile === 'tiny'
    ? 'rgba(255,255,255,0.035)'
    : 'rgba(255,255,255,0.075)'
}

function drawTileLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  metrics: TileMetrics,
  profile: TileProfile,
  bounds: TileBounds,
): void {
  if (profile === 'tiny') return

  const padding = clamp(Math.min(metrics.screenWidth, metrics.screenHeight) * 0.075, 6, 16) / camera.scale
  const availableWorldWidth = Math.max(0, bounds.width - padding * 2)
  if (availableWorldWidth <= 0) return

  ctx.save()
  ctx.beginPath()
  ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height)
  ctx.clip()
  ctx.shadowColor = 'rgba(0,0,0,0.44)'
  ctx.shadowBlur = 2 / camera.scale
  ctx.shadowOffsetY = 1 / camera.scale

  if (profile === 'name_only') {
    drawSingleLineTitle(
      ctx,
      node,
      camera,
      bounds,
      padding,
      availableWorldWidth,
      clamp(Math.min(metrics.screenWidth * 0.15, metrics.screenHeight * 0.4), 10, 14) / camera.scale,
    )
    ctx.restore()
    return
  }

  if (profile === 'compact') {
    drawCompactLabel(ctx, node, camera, bounds, padding, availableWorldWidth, metrics)
    ctx.restore()
    return
  }

  if (profile === 'featured_vertical') {
    drawFeaturedLabel(ctx, node, camera, bounds, padding, availableWorldWidth, metrics, 'vertical')
    ctx.restore()
    return
  }

  if (profile === 'featured_horizontal') {
    drawFeaturedLabel(ctx, node, camera, bounds, padding, availableWorldWidth, metrics, 'horizontal')
    ctx.restore()
    return
  }

  drawStandardLabel(ctx, node, camera, bounds, padding, availableWorldWidth, metrics)
  ctx.restore()
}

function drawSingleLineTitle(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  availableWorldWidth: number,
  titleSize: number,
): void {
  ctx.fillStyle = 'rgba(255,255,255,0.97)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  const title = truncateToWidth(ctx, node.displayName, availableWorldWidth)
  ctx.fillText(title, bounds.x + padding, bounds.y + padding + titleSize, availableWorldWidth)
}

function drawCompactLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.12, metrics.screenHeight * 0.3), 10, 15) / camera.scale
  const metricSize = clamp(titleSize * 0.76, 9, 12) / camera.scale

  drawSingleLineTitle(ctx, node, camera, bounds, padding, availableWorldWidth, titleSize)

  if (metrics.shortEdge < COMPACT_SHORT_EDGE) return
  ctx.fillStyle = 'rgba(255,255,255,0.93)'
  ctx.font = `650 ${metricSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(
    formatCompactViewers(node.viewers),
    bounds.x + padding,
    bounds.y + bounds.height - padding,
    availableWorldWidth,
  )
}

function drawStandardLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
): void {
  const titleSize = clamp(Math.min(metrics.screenWidth * 0.11, metrics.screenHeight * 0.23), 11, 17) / camera.scale
  const metricSize = clamp(titleSize * 0.74, 9, 13) / camera.scale

  drawSingleLineTitle(ctx, node, camera, bounds, padding, availableWorldWidth, titleSize)
  drawBottomMetrics(ctx, node, camera, bounds, padding, availableWorldWidth, metricSize, false)
}

function drawFeaturedLabel(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  availableWorldWidth: number,
  metrics: TileMetrics,
  orientation: 'vertical' | 'horizontal',
): void {
  const titleSize = orientation === 'vertical'
    ? clamp(Math.min(metrics.screenWidth * 0.15, metrics.screenHeight * 0.13), 12, 20) / camera.scale
    : clamp(Math.min(metrics.screenWidth * 0.085, metrics.screenHeight * 0.23), 13, 22) / camera.scale
  const metricSize = clamp(titleSize * 0.72, 10, 15) / camera.scale
  const titleLines = wrapText(ctx, node.displayName, titleSize, availableWorldWidth, metrics.isPriority ? 2 : 1)

  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  let y = bounds.y + padding + titleSize
  for (const line of titleLines) {
    ctx.fillText(line, bounds.x + padding, y, availableWorldWidth)
    y += titleSize + 3 / camera.scale
  }

  const showActivity = metrics.screenHeight >= 165 && metrics.screenWidth >= 145
  drawBottomMetrics(ctx, node, camera, bounds, padding, availableWorldWidth, metricSize, showActivity)
}

function drawBottomMetrics(
  ctx: CanvasRenderingContext2D,
  node: HeatmapSceneNode,
  camera: CameraState,
  bounds: TileBounds,
  padding: number,
  availableWorldWidth: number,
  metricSize: number,
  showActivity: boolean,
): void {
  const viewerText = formatCompactViewers(node.viewers)
  const momentumText = formatSignedPercent(node.momentum)
  const lineGap = 5 / camera.scale
  const baseline = bounds.y + bounds.height - padding

  ctx.font = `650 ${metricSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  const viewerWidth = ctx.measureText(viewerText).width
  const momentumWidth = ctx.measureText(momentumText).width
  const inlineWidth = viewerWidth + lineGap + momentumWidth

  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  ctx.fillText(viewerText, bounds.x + padding, baseline, availableWorldWidth)

  if (inlineWidth <= availableWorldWidth) {
    ctx.fillStyle = momentumColor(node.momentum)
    ctx.fillText(momentumText, bounds.x + padding + viewerWidth + lineGap, baseline, momentumWidth)
  } else {
    const upperBaseline = baseline - metricSize - 4 / camera.scale
    ctx.fillStyle = momentumColor(node.momentum)
    ctx.fillText(momentumText, bounds.x + padding, upperBaseline, availableWorldWidth)
  }

  if (showActivity) {
    const activitySize = clamp(metricSize * 0.82, 9 / camera.scale, 12 / camera.scale)
    const activityBaseline = baseline - metricSize - 7 / camera.scale
    ctx.fillStyle = 'rgba(226,232,240,0.78)'
    ctx.font = `600 ${activitySize}px Inter, system-ui, sans-serif`
    ctx.fillText(`${formatPercent(node.activity)} activity`, bounds.x + padding, activityBaseline, availableWorldWidth)
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
  if (metrics.screenArea < TINY_AREA || metrics.shortEdge < MIN_SHORT_EDGE) return 'tiny'

  if (metrics.isPriority && metrics.screenArea >= PRIORITY_FEATURED_AREA && metrics.shortEdge >= PRIORITY_FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
    return 'standard'
  }

  if (metrics.screenArea < NAME_AREA) return 'name_only'
  if (metrics.screenArea < COMPACT_AREA || metrics.shortEdge < COMPACT_SHORT_EDGE) return 'compact'

  if (metrics.isFeatured && metrics.screenArea >= FEATURED_AREA && metrics.shortEdge >= FEATURED_SHORT_EDGE) {
    if (metrics.aspectRatio <= VERTICAL_RATIO) return 'featured_vertical'
    if (metrics.aspectRatio >= HORIZONTAL_RATIO) return 'featured_horizontal'
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
  if (!words.length) return [truncateToWidth(ctx, value, maxWidth)]

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

  if (current && lines.length < maxLines) lines.push(current)
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
  while (text.length > 2 && ctx.measureText(`${text}…`).width > maxWidth) text = text.slice(0, -1)
  return `${text}…`
}

function insetBounds(node: HeatmapSceneNode, inset: number): TileBounds {
  return {
    x: node.x + inset,
    y: node.y + inset,
    width: Math.max(0, node.width - inset * 2),
    height: Math.max(0, node.height - inset * 2),
  }
}

function momentumStrength(momentum: number): number {
  return clamp(Math.sqrt(Math.abs(momentum) / MOMENTUM_SCALE), 0, 1)
}

function activityStrength(activity: number): number {
  return clamp(Math.sqrt(Math.max(0, activity) / ACTIVITY_SCALE), 0, 1)
}

function momentumColor(momentum: number): string {
  if (momentum > FLAT_MOMENTUM_THRESHOLD) return 'rgba(167,243,208,0.92)'
  if (momentum < -FLAT_MOMENTUM_THRESHOLD) return 'rgba(254,205,211,0.92)'
  return 'rgba(226,232,240,0.78)'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
