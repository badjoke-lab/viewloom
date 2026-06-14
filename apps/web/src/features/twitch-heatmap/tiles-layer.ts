import type { CameraState, HeatmapSceneNode } from './model'

type TileBounds = {
  x: number
  y: number
  width: number
  height: number
}

const TILE_INSET_PX = 0.5
const TILE_STROKE_PX = 0.6
const FLAT_MOMENTUM_THRESHOLD = 0.015
const MOMENTUM_SCALE = 0.18
const ACTIVITY_SCALE = 0.25

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
    const screenWidth = node.width * camera.scale
    const screenHeight = node.height * camera.scale
    const bounds = insetBounds(node, TILE_INSET_PX / camera.scale)
    if (bounds.width <= 0 || bounds.height <= 0) continue

    ctx.fillStyle = getTileFillStyle(node)
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)

    if (screenWidth >= 2 && screenHeight >= 2) {
      ctx.strokeStyle = screenWidth < 12 || screenHeight < 10
        ? 'rgba(255,255,255,0.035)'
        : 'rgba(255,255,255,0.075)'
      ctx.lineWidth = TILE_STROKE_PX / camera.scale
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
    }
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
