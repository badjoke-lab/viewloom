const DEFAULT_PADDING = 12

export const MIN_CAMERA_ZOOM = 1
export const MAX_CAMERA_ZOOM = 12

export function createFitCamera(
  viewportWidth,
  viewportHeight,
  worldWidth,
  worldHeight,
  padding = DEFAULT_PADDING,
) {
  const safeViewportWidth = positive(viewportWidth, 1)
  const safeViewportHeight = positive(viewportHeight, 1)
  const safeWorldWidth = positive(worldWidth, 1)
  const safeWorldHeight = positive(worldHeight, 1)
  const safePadding = Math.max(0, finite(padding))
  const availableWidth = Math.max(1, safeViewportWidth - safePadding * 2)
  const availableHeight = Math.max(1, safeViewportHeight - safePadding * 2)

  // Use cover scale rather than contain scale so camera movement can never reveal
  // empty space between the map world and viewport edge.
  const baseScale = Math.max(
    availableWidth / safeWorldWidth,
    availableHeight / safeWorldHeight,
  )

  return clampCameraToWorld({
    zoom: 1,
    baseScale,
    scale: baseScale,
    tx: (safeViewportWidth - safeWorldWidth * baseScale) / 2,
    ty: (safeViewportHeight - safeWorldHeight * baseScale) / 2,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  }, {
    worldWidth: safeWorldWidth,
    worldHeight: safeWorldHeight,
    viewportWidth: safeViewportWidth,
    viewportHeight: safeViewportHeight,
  })
}

export function worldToScreen(point, camera) {
  return {
    x: finite(point?.x) * camera.scale + camera.tx,
    y: finite(point?.y) * camera.scale + camera.ty,
  }
}

export function screenToWorld(point, camera) {
  const safeScale = Math.max(0.000001, positive(camera?.scale, 1))
  return {
    x: (finite(point?.x) - finite(camera?.tx)) / safeScale,
    y: (finite(point?.y) - finite(camera?.ty)) / safeScale,
  }
}

export function panCamera(camera, deltaX, deltaY, bounds) {
  const next = {
    ...camera,
    tx: camera.tx + finite(deltaX),
    ty: camera.ty + finite(deltaY),
  }
  return bounds ? clampCameraToWorld(next, bounds) : next
}

export function zoomCameraAroundPoint(camera, anchor, nextZoom, bounds) {
  const zoom = clamp(
    finite(nextZoom),
    getMinCameraZoom(camera, bounds),
    MAX_CAMERA_ZOOM,
  )
  const scale = camera.baseScale * zoom
  const next = {
    ...camera,
    zoom,
    scale,
    tx: camera.tx + finite(anchor?.x) * (camera.scale - scale),
    ty: camera.ty + finite(anchor?.y) * (camera.scale - scale),
  }
  return bounds ? clampCameraToWorld(next, bounds) : next
}

export function zoomCameraAroundScreenPoint(camera, screenPoint, nextZoom, bounds) {
  return zoomCameraAroundPoint(
    camera,
    screenToWorld(screenPoint, camera),
    nextZoom,
    bounds,
  )
}

export function resetCameraToBaseScale(camera, bounds) {
  const center = {
    x: positive(bounds?.viewportWidth, camera.viewportWidth) / 2,
    y: positive(bounds?.viewportHeight, camera.viewportHeight) / 2,
  }
  return zoomCameraAroundScreenPoint(camera, center, 1, bounds)
}

export function captureCameraView(camera, bounds) {
  const safeWorldWidth = positive(bounds?.worldWidth, 1)
  const safeWorldHeight = positive(bounds?.worldHeight, 1)
  const viewportCenter = {
    x: positive(bounds?.viewportWidth, camera.viewportWidth) / 2,
    y: positive(bounds?.viewportHeight, camera.viewportHeight) / 2,
  }
  const worldCenter = screenToWorld(viewportCenter, camera)
  return {
    zoom: clamp(camera.zoom, MIN_CAMERA_ZOOM, MAX_CAMERA_ZOOM),
    centerX: clamp(worldCenter.x / safeWorldWidth, 0, 1),
    centerY: clamp(worldCenter.y / safeWorldHeight, 0, 1),
  }
}

export function restoreCameraView(snapshot, bounds, padding = 0) {
  const safeBounds = normalizeBounds(bounds)
  const fitted = createFitCamera(
    safeBounds.viewportWidth,
    safeBounds.viewportHeight,
    safeBounds.worldWidth,
    safeBounds.worldHeight,
    padding,
  )
  if (!snapshot) return fitted

  const zoom = clamp(
    finite(snapshot.zoom),
    getMinCameraZoom(fitted, safeBounds),
    MAX_CAMERA_ZOOM,
  )
  const scale = fitted.baseScale * zoom
  const worldCenter = {
    x: clamp(finite(snapshot.centerX), 0, 1) * safeBounds.worldWidth,
    y: clamp(finite(snapshot.centerY), 0, 1) * safeBounds.worldHeight,
  }

  return clampCameraToWorld({
    ...fitted,
    zoom,
    scale,
    tx: safeBounds.viewportWidth / 2 - worldCenter.x * scale,
    ty: safeBounds.viewportHeight / 2 - worldCenter.y * scale,
  }, safeBounds)
}

export function clampCameraToWorld(camera, bounds) {
  const safeBounds = normalizeBounds(bounds)
  const minZoom = getMinCameraZoom(camera, safeBounds)
  const zoom = clamp(camera.zoom, minZoom, MAX_CAMERA_ZOOM)
  const scale = Math.max(0.000001, camera.baseScale * zoom)
  const scaledWidth = safeBounds.worldWidth * scale
  const scaledHeight = safeBounds.worldHeight * scale

  const tx = scaledWidth <= safeBounds.viewportWidth
    ? (safeBounds.viewportWidth - scaledWidth) / 2
    : clamp(camera.tx, safeBounds.viewportWidth - scaledWidth, 0)
  const ty = scaledHeight <= safeBounds.viewportHeight
    ? (safeBounds.viewportHeight - scaledHeight) / 2
    : clamp(camera.ty, safeBounds.viewportHeight - scaledHeight, 0)

  return {
    ...camera,
    zoom,
    scale,
    tx,
    ty,
    viewportWidth: safeBounds.viewportWidth,
    viewportHeight: safeBounds.viewportHeight,
  }
}

export function getCameraViewportWorldRect(camera, bounds) {
  const safeBounds = normalizeBounds(bounds)
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera)
  const bottomRight = screenToWorld({
    x: safeBounds.viewportWidth,
    y: safeBounds.viewportHeight,
  }, camera)
  return {
    x: clamp(topLeft.x, 0, safeBounds.worldWidth),
    y: clamp(topLeft.y, 0, safeBounds.worldHeight),
    width: Math.max(0, Math.min(safeBounds.worldWidth, bottomRight.x) - Math.max(0, topLeft.x)),
    height: Math.max(0, Math.min(safeBounds.worldHeight, bottomRight.y) - Math.max(0, topLeft.y)),
  }
}

function getMinCameraZoom(camera, bounds) {
  if (!bounds) return MIN_CAMERA_ZOOM
  const safeBounds = normalizeBounds(bounds)
  const safeBaseScale = Math.max(0.0001, positive(camera?.baseScale, 1))
  return Math.max(
    MIN_CAMERA_ZOOM,
    safeBounds.viewportWidth / (safeBounds.worldWidth * safeBaseScale),
    safeBounds.viewportHeight / (safeBounds.worldHeight * safeBaseScale),
  )
}

function normalizeBounds(bounds) {
  return {
    worldWidth: positive(bounds?.worldWidth, 1),
    worldHeight: positive(bounds?.worldHeight, 1),
    viewportWidth: positive(bounds?.viewportWidth, 1),
    viewportHeight: positive(bounds?.viewportHeight, 1),
  }
}

function finite(value) {
  return Number.isFinite(value) ? value : 0
}

function positive(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
