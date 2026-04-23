import {
  HEATMAP_CAMERA_PADDING,
  type CameraState,
  type WorldPoint,
} from '../model'

export function createFitCamera(
  viewportWidth: number,
  viewportHeight: number,
  worldWidth: number,
  worldHeight: number,
  padding = HEATMAP_CAMERA_PADDING,
): CameraState {
  const safeViewportWidth = Math.max(1, viewportWidth)
  const safeViewportHeight = Math.max(1, viewportHeight)
  const safeWorldWidth = Math.max(1, worldWidth)
  const safeWorldHeight = Math.max(1, worldHeight)
  const availableWidth = Math.max(1, safeViewportWidth - padding * 2)
  const availableHeight = Math.max(1, safeViewportHeight - padding * 2)
  const baseScale = Math.min(availableWidth / safeWorldWidth, availableHeight / safeWorldHeight)
  const tx = (safeViewportWidth - safeWorldWidth * baseScale) / 2
  const ty = (safeViewportHeight - safeWorldHeight * baseScale) / 2

  return {
    zoom: 1,
    baseScale,
    scale: baseScale,
    tx,
    ty,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  }
}

export function worldToScreen(point: WorldPoint, camera: CameraState): WorldPoint {
  return {
    x: point.x * camera.scale + camera.tx,
    y: point.y * camera.scale + camera.ty,
  }
}

export function screenToWorld(point: WorldPoint, camera: CameraState): WorldPoint {
  return {
    x: (point.x - camera.tx) / camera.scale,
    y: (point.y - camera.ty) / camera.scale,
  }
}
