import type { CameraState, WorldPoint } from '../model'

export type CameraBounds = {
  worldWidth: number
  worldHeight: number
  viewportWidth: number
  viewportHeight: number
}

export type CameraViewSnapshot = {
  zoom: number
  centerX: number
  centerY: number
}

export type CameraViewportWorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export type WorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export const MIN_CAMERA_ZOOM: 1
export const MAX_CAMERA_ZOOM: 12

export function createFitCamera(
  viewportWidth: number,
  viewportHeight: number,
  worldWidth: number,
  worldHeight: number,
  padding?: number,
): CameraState

export function createReferenceCamera(
  bounds: CameraBounds,
  baseScale?: number,
): CameraState

export function worldToScreen(point: WorldPoint, camera: CameraState): WorldPoint
export function screenToWorld(point: WorldPoint, camera: CameraState): WorldPoint

export function panCamera(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
  bounds?: CameraBounds,
): CameraState

export function zoomCameraAroundPoint(
  camera: CameraState,
  anchor: WorldPoint,
  nextZoom: number,
  bounds?: CameraBounds,
): CameraState

export function zoomCameraAroundScreenPoint(
  camera: CameraState,
  screenPoint: WorldPoint,
  nextZoom: number,
  bounds?: CameraBounds,
): CameraState

export function resetCameraToBaseScale(
  camera: CameraState,
  bounds: CameraBounds,
): CameraState

export function captureCameraView(
  camera: CameraState,
  bounds: CameraBounds,
): CameraViewSnapshot

export function restoreCameraView(
  snapshot: CameraViewSnapshot | null | undefined,
  bounds: CameraBounds,
  padding?: number,
): CameraState

export function restoreReferenceCameraView(
  snapshot: CameraViewSnapshot | null | undefined,
  bounds: CameraBounds,
  baseScale?: number,
): CameraState

export function setCameraWorldCenter(
  camera: CameraState,
  worldCenter: WorldPoint,
  bounds: CameraBounds,
): CameraState

export function setCameraNormalizedCenter(
  camera: CameraState,
  center: WorldPoint,
  bounds: CameraBounds,
): CameraState

export function revealWorldRectMinimally(
  camera: CameraState,
  rect: WorldRect,
  bounds: CameraBounds,
  marginPx?: number,
): CameraState

export function clampCameraToWorld(
  camera: CameraState,
  bounds: CameraBounds,
): CameraState

export function getCameraViewportWorldRect(
  camera: CameraState,
  bounds: CameraBounds,
): CameraViewportWorldRect
