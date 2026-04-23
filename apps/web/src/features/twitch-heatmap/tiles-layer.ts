import type { CameraState, HeatmapSceneNode } from './model'

const NAME_ONLY_MIN_WIDTH = 56
const NAME_ONLY_MIN_HEIGHT = 26
const VIEWERS_MIN_WIDTH = 120
const VIEWERS_MIN_HEIGHT = 48
const MOMENTUM_MIN_WIDTH = 180
const MOMENTUM_MIN_HEIGHT = 78
const SHARE_MIN_WIDTH = 260
const SHARE_MIN_HEIGHT = 120

export function drawTilesLayer(ctx: CanvasRenderingContext2D, nodes: HeatmapSceneNode[], camera: CameraState, viewportWidth: number, viewportHeight: number, dpr: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)

  for (const node of nodes) {
    ctx.fillStyle = node.momentum > 0.02 ? 'rgba(16,185,129,0.78)' : node.momentum < -0.02 ? 'rgba(244,63,94,0.78)' : 'rgba(51,65,85,0.92)'
    ctx.strokeStyle = node.momentum > 0.02 ? 'rgba(167,243,208,0.8)' : node.momentum < -0.02 ? 'rgba(254,205,211,0.8)' : 'rgba(148,163,184,0.4)'
    ctx.lineWidth = Math.max(1 / camera.scale, 1.25)
    ctx.fillRect(node.x, node.y, node.width, node.height)
    ctx.strokeRect(node.x, node.y, node.width, node.height)
    drawNodeLabel(ctx, node, camera)
  }

  ctx.restore()
}

function drawNodeLabel(ctx: CanvasRenderingContext2D, node: HeatmapSceneNode, camera: CameraState): void {
  const screenWidth = node.width * camera.scale
  const screenHeight = node.height * camera.scale
  const padding = clamp(Math.min(screenWidth, screenHeight) * 0.09, 8, 18) / camera.scale

  if (screenWidth < NAME_ONLY_MIN_WIDTH || screenHeight < NAME_ONLY_MIN_HEIGHT) return

  const mode = getLabelMode(screenWidth, screenHeight)
  const titleSize = clamp(Math.min(screenWidth * 0.14, screenHeight * 0.34), 11, mode === 'share' ? 24 : 18) / camera.scale
  const bodySize = clamp(titleSize * 0.76, 10, 16) / camera.scale
  const smallSize = clamp(bodySize * 0.9, 9, 13) / camera.scale
  const maxTitleChars = Math.max(4, Math.floor((screenWidth - padding * camera.scale * 2) / (titleSize * camera.scale * 0.62)))
  const availableWorldWidth = Math.max(0, node.width - padding * 2)

  ctx.save()
  ctx.beginPath()
  ctx.rect(node.x, node.y, node.width, node.height)
  ctx.clip()

  let currentY = node.y + padding + titleSize
  ctx.fillStyle = 'rgba(255,255,255,0.98)'
  ctx.font = `700 ${titleSize}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(truncateText(node.displayName, maxTitleChars), node.x + padding, currentY, availableWorldWidth)

  if (mode === 'name') {
    ctx.restore()
    return
  }

  currentY += bodySize + 8 / camera.scale
  ctx.fillStyle = 'rgba(255,255,255,0.94)'
  ctx.font = `700 ${bodySize}px Inter, system-ui, sans-serif`
  ctx.fillText(`${node.viewers.toLocaleString()} viewers`, node.x + padding, currentY, availableWorldWidth)

  if (mode === 'viewers') {
    ctx.restore()
    return
  }

  currentY += smallSize + 8 / camera.scale
  ctx.fillStyle = 'rgba(241,245,249,0.92)'
  ctx.font = `600 ${smallSize}px Inter, system-ui, sans-serif`
  ctx.fillText(`${node.momentum > 0 ? '+' : ''}${(node.momentum * 100).toFixed(1)}% momentum`, node.x + padding, currentY, availableWorldWidth)

  if (mode === 'momentum') {
    ctx.restore()
    return
  }

  currentY += smallSize + 6 / camera.scale
  const share = Math.max(0, node.viewers) / 1
  ctx.fillStyle = 'rgba(226,232,240,0.9)'
  ctx.fillText(`#${node.rank} · ${Math.round(share)} viewers node`, node.x + padding, currentY, availableWorldWidth)
  ctx.restore()
}

function getLabelMode(screenWidth: number, screenHeight: number): 'name' | 'viewers' | 'momentum' | 'share' {
  if (screenWidth >= SHARE_MIN_WIDTH && screenHeight >= SHARE_MIN_HEIGHT) return 'share'
  if (screenWidth >= MOMENTUM_MIN_WIDTH && screenHeight >= MOMENTUM_MIN_HEIGHT) return 'momentum'
  if (screenWidth >= VIEWERS_MIN_WIDTH && screenHeight >= VIEWERS_MIN_HEIGHT) return 'viewers'
  return 'name'
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  if (maxChars <= 1) return value.slice(0, maxChars)
  return `${value.slice(0, maxChars - 1)}…`
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
