import {
  HEATMAP_CAMERA_PADDING,
  type CameraState,
  type WorldPoint,
} from '../model'

export const MIN_CAMERA_ZOOM = 1
export const MAX_CAMERA_ZOOM = 12

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

export function panCamera(camera: CameraState, deltaX: number, deltaY: number): CameraState {
  return {
    ...camera,
    tx: camera.tx + deltaX,
    ty: camera.ty + deltaY,
  }
}

export function zoomCameraAroundPoint(
  camera: CameraState,
  anchor: WorldPoint,
  nextZoom: number,
): CameraState {
  const zoom = clamp(nextZoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM)
  const scale = camera.baseScale * zoom

  return {
    ...camera,
    zoom,
    scale,
    tx: camera.tx + anchor.x * (camera.scale - scale),
    ty: camera.ty + anchor.y * (camera.scale - scale),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
