import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  MAX_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  captureCameraView,
  clampCameraToWorld,
  createFitCamera,
  getCameraViewportWorldRect,
  panCamera,
  resetCameraToBaseScale,
  restoreCameraView,
  zoomCameraAroundScreenPoint,
} from '../src/features/twitch-heatmap/interactions/camera-core.mjs'

const baseBounds = {
  worldWidth: 1200,
  worldHeight: 700,
  viewportWidth: 1200,
  viewportHeight: 700,
}

const fitted = createFitCamera(1200, 700, 1200, 700, 0)
assert.equal(fitted.zoom, 1)
assert.equal(fitted.scale, 1)
assert.equal(fitted.tx, 0)
assert.equal(fitted.ty, 0)

const covered = createFitCamera(1000, 600, 500, 500, 0)
assert.ok(covered.scale * 500 >= 1000)
assert.ok(covered.scale * 500 >= 600)

const zoomed = zoomCameraAroundScreenPoint(
  fitted,
  { x: 600, y: 350 },
  2,
  baseBounds,
)
assert.equal(zoomed.zoom, 2)

const pannedPastEdge = panCamera(zoomed, 5000, -5000, baseBounds)
assert.ok(pannedPastEdge.tx <= 0)
assert.ok(pannedPastEdge.tx >= baseBounds.viewportWidth - baseBounds.worldWidth * pannedPastEdge.scale)
assert.ok(pannedPastEdge.ty <= 0)
assert.ok(pannedPastEdge.ty >= baseBounds.viewportHeight - baseBounds.worldHeight * pannedPastEdge.scale)

const clampedLow = zoomCameraAroundScreenPoint(zoomed, { x: 600, y: 350 }, 0.01, baseBounds)
assert.equal(clampedLow.zoom, MIN_CAMERA_ZOOM)
const clampedHigh = zoomCameraAroundScreenPoint(zoomed, { x: 600, y: 350 }, 100, baseBounds)
assert.equal(clampedHigh.zoom, MAX_CAMERA_ZOOM)

const moved = panCamera(zoomed, -180, -90, baseBounds)
const snapshot = captureCameraView(moved, baseBounds)
const resizedBounds = {
  worldWidth: 900,
  worldHeight: 600,
  viewportWidth: 900,
  viewportHeight: 600,
}
const restored = restoreCameraView(snapshot, resizedBounds, 0)
const restoredSnapshot = captureCameraView(restored, resizedBounds)
assert.equal(restored.zoom, snapshot.zoom)
assert.ok(Math.abs(restoredSnapshot.centerX - snapshot.centerX) < 0.000001)
assert.ok(Math.abs(restoredSnapshot.centerY - snapshot.centerY) < 0.000001)

const baseAgain = resetCameraToBaseScale(restored, resizedBounds)
assert.equal(baseAgain.zoom, 1)
const reset = createFitCamera(
  resizedBounds.viewportWidth,
  resizedBounds.viewportHeight,
  resizedBounds.worldWidth,
  resizedBounds.worldHeight,
  0,
)
assert.deepEqual(baseAgain, reset)

const malformed = clampCameraToWorld({
  ...zoomed,
  tx: Number.POSITIVE_INFINITY,
  ty: Number.NEGATIVE_INFINITY,
}, baseBounds)
assert.ok(Number.isFinite(malformed.tx))
assert.ok(Number.isFinite(malformed.ty))

const visibleRect = getCameraViewportWorldRect(moved, baseBounds)
assert.ok(visibleRect.x >= 0 && visibleRect.y >= 0)
assert.ok(visibleRect.x + visibleRect.width <= baseBounds.worldWidth + 0.000001)
assert.ok(visibleRect.y + visibleRect.height <= baseBounds.worldHeight + 0.000001)

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const sceneSource = read('../src/features/twitch-heatmap/canvas-scene.ts')
const coreSource = read('../src/features/twitch-heatmap/interactions/camera-core.mjs')

for (const fragment of [
  'heatmap-canvas-zoom-out',
  'heatmap-canvas-zoom-base',
  'heatmap-canvas-zoom-in',
  'Reset view',
  'heatmap-canvas-refresh',
  'Load the latest stored snapshot',
  'captureCameraView',
  'restoreCameraView',
  'viewloom:heatmap-layout-change',
  'if (!event.ctrlKey && !event.altKey && !event.metaKey) return',
  'Math.hypot(dx, dy) >= PAN_THRESHOLD',
  'finishPointer(event, true)',
  'selectedStreamLogin',
]) assert.ok(sceneSource.includes(fragment), `missing camera-control fragment: ${fragment}`)

assert.ok(!sceneSource.includes("event.pointerType === 'mouse' && !overlayCanvas.hasPointerCapture"))
assert.ok(coreSource.includes('Use cover scale rather than contain scale'))
assert.ok(coreSource.includes('scaledWidth <= safeBounds.viewportWidth'))
assert.ok(coreSource.includes('scaledHeight <= safeBounds.viewportHeight'))

console.log('Heatmap camera-control verification passed.')
