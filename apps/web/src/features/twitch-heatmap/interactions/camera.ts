import {
  HEATMAP_CAMERA_PADDING,
  type CameraState,
  type WorldPoint,
} from '../model'

export const MIN_CAMERA_ZOOM = 1
export const MAX_CAMERA_ZOOM = 12

export type CameraBounds = {
  worldWidth: number
  worldHeight: number
  viewportWidth: number
  viewportHeight: number
}

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
  const baseScale = Math.max(availableWidth / safeWorldWidth, availableHeight / safeWorldHeight)
  const camera = {
    zoom: 1,
    baseScale,
    scale: baseScale,
    tx: (safeViewportWidth - safeWorldWidth * baseScale) / 2,
    ty: (safeViewportHeight - safeWorldHeight * baseScale) / 2,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  }

  return clampCameraToWorld(camera, {
    worldWidth: safeWorldWidth,
    worldHeight: safeWorldHeight,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  })
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

export function panCamera(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
  bounds?: CameraBounds,
): CameraState {
  const nextCamera = {
    ...camera,
    tx: camera.tx + deltaX,
    ty: camera.ty + deltaY,
  }

  return bounds ? clampCameraToWorld(nextCamera, bounds) : nextCamera
}

export function zoomCameraAroundPoint(
  camera: CameraState,
  anchor: WorldPoint,
  nextZoom: number,
  bounds?: CameraBounds,
): CameraState {
  const zoom = clamp(nextZoom, getMinCameraZoom(camera, bounds), MAX_CAMERA_ZOOM)
  const scale = camera.baseScale * zoom
  const nextCamera = {
    ...camera,
    zoom,
    scale,
    tx: camera.tx + anchor.x * (camera.scale - scale),
    ty: camera.ty + anchor.y * (camera.scale - scale),
  }

  return bounds ? clampCameraToWorld(nextCamera, bounds) : nextCamera
}

export function clampCameraToWorld(camera: CameraState, bounds: CameraBounds): CameraState {
  const safeWorldWidth = Math.max(1, bounds.worldWidth)
  const safeWorldHeight = Math.max(1, bounds.worldHeight)
  const safeViewportWidth = Math.max(1, bounds.viewportWidth)
  const safeViewportHeight = Math.max(1, bounds.viewportHeight)
  const minZoom = getMinCameraZoom(camera, {
    worldWidth: safeWorldWidth,
    worldHeight: safeWorldHeight,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  })
  const zoom = clamp(camera.zoom, minZoom, MAX_CAMERA_ZOOM)
  const scale = camera.baseScale * zoom
  const scaledWidth = safeWorldWidth * scale
  const scaledHeight = safeWorldHeight * scale
  const tx = scaledWidth <= safeViewportWidth
    ? (safeViewportWidth - scaledWidth) / 2
    : clamp(camera.tx, safeViewportWidth - scaledWidth, 0)
  const ty = scaledHeight <= safeViewportHeight
    ? (safeViewportHeight - scaledHeight) / 2
    : clamp(camera.ty, safeViewportHeight - scaledHeight, 0)

  return {
    ...camera,
    zoom,
    scale,
    tx,
    ty,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  }
}

function getMinCameraZoom(camera: CameraState, bounds?: CameraBounds): number {
  if (!bounds) return MIN_CAMERA_ZOOM

  const safeBaseScale = Math.max(0.0001, camera.baseScale)
  const safeWorldWidth = Math.max(1, bounds.worldWidth)
  const safeWorldHeight = Math.max(1, bounds.worldHeight)
  const safeViewportWidth = Math.max(1, bounds.viewportWidth)
  const safeViewportHeight = Math.max(1, bounds.viewportHeight)
  return Math.max(
    MIN_CAMERA_ZOOM,
    safeViewportWidth / (safeWorldWidth * safeBaseScale),
    safeViewportHeight / (safeWorldHeight * safeBaseScale),
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
