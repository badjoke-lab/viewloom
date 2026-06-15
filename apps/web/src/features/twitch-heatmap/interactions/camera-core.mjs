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

export function createReferenceCamera(bounds, baseScale = 1) {
  const safeBounds = normalizeBounds(bounds)
  const safeBaseScale = positive(baseScale, 1)
  return clampCameraToWorld({
    zoom: 1,
    baseScale: safeBaseScale,
    scale: safeBaseScale,
    tx: 0,
    ty: 0,
    viewportWidth: safeBounds.viewportWidth,
    viewportHeight: safeBounds.viewportHeight,
  }, safeBounds)
}

export function worldToScreen(point, camera) {
  return {
    x: finite(point?.x) * camera.scale + finite(camera?.tx),
    y: finite(point?.y) * camera.scale + finite(camera?.ty),
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
    tx: finite(camera?.tx) + finite(deltaX),
    ty: finite(camera?.ty) + finite(deltaY),
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
  return restoreFromBase(snapshot, safeBounds, fitted)
}

export function restoreReferenceCameraView(snapshot, bounds, baseScale = 1) {
  const safeBounds = normalizeBounds(bounds)
  const reference = createReferenceCamera(safeBounds, baseScale)
  return restoreFromBase(snapshot, safeBounds, reference)
}

export function setCameraWorldCenter(camera, worldCenter, bounds) {
  const safeBounds = normalizeBounds(bounds)
  const centerX = clamp(finite(worldCenter?.x), 0, safeBounds.worldWidth)
  const centerY = clamp(finite(worldCenter?.y), 0, safeBounds.worldHeight)
  return clampCameraToWorld({
    ...camera,
    tx: safeBounds.viewportWidth / 2 - centerX * camera.scale,
    ty: safeBounds.viewportHeight / 2 - centerY * camera.scale,
  }, safeBounds)
}

export function setCameraNormalizedCenter(camera, center, bounds) {
  const safeBounds = normalizeBounds(bounds)
  return setCameraWorldCenter(camera, {
    x: clamp(finite(center?.x), 0, 1) * safeBounds.worldWidth,
    y: clamp(finite(center?.y), 0, 1) * safeBounds.worldHeight,
  }, safeBounds)
}

export function revealWorldRectMinimally(camera, rect, bounds, marginPx = 12) {
  const safeBounds = normalizeBounds(bounds)
  const safeMargin = Math.max(0, finite(marginPx))
  const left = finite(rect?.x) * camera.scale + camera.tx
  const top = finite(rect?.y) * camera.scale + camera.ty
  const right = (finite(rect?.x) + positive(rect?.width, 0)) * camera.scale + camera.tx
  const bottom = (finite(rect?.y) + positive(rect?.height, 0)) * camera.scale + camera.ty
  let deltaX = 0
  let deltaY = 0

  if (right <= safeMargin) deltaX = safeMargin - right
  else if (left >= safeBounds.viewportWidth - safeMargin) {
    deltaX = safeBounds.viewportWidth - safeMargin - left
  }

  if (bottom <= safeMargin) deltaY = safeMargin - bottom
  else if (top >= safeBounds.viewportHeight - safeMargin) {
    deltaY = safeBounds.viewportHeight - safeMargin - top
  }

  return deltaX || deltaY
    ? panCamera(camera, deltaX, deltaY, safeBounds)
    : clampCameraToWorld(camera, safeBounds)
}

export function clampCameraToWorld(camera, bounds) {
  const safeBounds = normalizeBounds(bounds)
  const safeBaseScale = positive(camera?.baseScale, 1)
  const minZoom = getMinCameraZoom({ ...camera, baseScale: safeBaseScale }, safeBounds)
  const zoom = clamp(positive(camera?.zoom, 1), minZoom, MAX_CAMERA_ZOOM)
  const scale = Math.max(0.000001, safeBaseScale * zoom)
  const scaledWidth = safeBounds.worldWidth * scale
  const scaledHeight = safeBounds.worldHeight * scale

  const tx = scaledWidth <= safeBounds.viewportWidth
    ? (safeBounds.viewportWidth - scaledWidth) / 2
    : clamp(finite(camera?.tx), safeBounds.viewportWidth - scaledWidth, 0)
  const ty = scaledHeight <= safeBounds.viewportHeight
    ? (safeBounds.viewportHeight - scaledHeight) / 2
    : clamp(finite(camera?.ty), safeBounds.viewportHeight - scaledHeight, 0)

  return {
    ...camera,
    baseScale: safeBaseScale,
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

function restoreFromBase(snapshot, safeBounds, baseCamera) {
  if (!snapshot) return baseCamera

  const zoom = clamp(
    positive(snapshot.zoom, 1),
    getMinCameraZoom(baseCamera, safeBounds),
    MAX_CAMERA_ZOOM,
  )
  const scale = baseCamera.baseScale * zoom
  const worldCenter = {
    x: clamp(finite(snapshot.centerX), 0, 1) * safeBounds.worldWidth,
    y: clamp(finite(snapshot.centerY), 0, 1) * safeBounds.worldHeight,
  }

  return clampCameraToWorld({
    ...baseCamera,
    zoom,
    scale,
    tx: safeBounds.viewportWidth / 2 - worldCenter.x * scale,
    ty: safeBounds.viewportHeight / 2 - worldCenter.y * scale,
  }, safeBounds)
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
