import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  captureCameraView,
  createReferenceCamera,
  getCameraViewportWorldRect,
  restoreReferenceCameraView,
  revealWorldRectMinimally,
  setCameraWorldCenter,
} from '../src/features/twitch-heatmap/interactions/camera-core.mjs'

const wideBounds = {
  worldWidth: 1200,
  worldHeight: 700,
  viewportWidth: 1200,
  viewportHeight: 700,
}
const splitBounds = {
  worldWidth: 1200,
  worldHeight: 700,
  viewportWidth: 800,
  viewportHeight: 700,
}

const wideCamera = createReferenceCamera(wideBounds, 1)
assert.equal(wideCamera.baseScale, 1)
assert.equal(wideCamera.tx, 0)
assert.equal(wideCamera.ty, 0)

const splitInitial = createReferenceCamera(splitBounds, 1)
assert.equal(splitInitial.baseScale, wideCamera.baseScale)
assert.equal(splitInitial.tx, 0, 'initial Split camera must show the left side of the Wide world')
const splitVisible = getCameraViewportWorldRect(splitInitial, splitBounds)
assert.equal(splitVisible.x, 0)
assert.equal(splitVisible.width, 800)
assert.ok(splitVisible.x + splitVisible.width < splitBounds.worldWidth)

const centered = setCameraWorldCenter(splitInitial, { x: 900, y: 350 }, splitBounds)
const centeredVisible = getCameraViewportWorldRect(centered, splitBounds)
assert.equal(centeredVisible.x, 400)
assert.equal(centeredVisible.width, 800)

const snapshot = captureCameraView(centered, splitBounds)
const wideRestored = restoreReferenceCameraView(snapshot, wideBounds, 1)
assert.equal(wideRestored.baseScale, 1)
assert.equal(wideRestored.zoom, centered.zoom)
const splitRestored = restoreReferenceCameraView(captureCameraView(wideRestored, wideBounds), splitBounds, 1)
assert.equal(splitRestored.baseScale, 1)

const hiddenTile = { x: 1080, y: 100, width: 80, height: 120 }
const revealed = revealWorldRectMinimally(splitInitial, hiddenTile, splitBounds, 18)
const revealedRect = getCameraViewportWorldRect(revealed, splitBounds)
assert.ok(revealedRect.x > 0, 'hidden selected tile should cause the minimum camera adjustment')
assert.ok(revealedRect.x + revealedRect.width <= splitBounds.worldWidth)

const read = (relativePath) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
const sceneSource = read('../src/features/twitch-heatmap/canvas-scene.ts')
const splitSource = read('../src/features/twitch-heatmap/split-viewport.ts')
const splitCss = read('../src/features/twitch-heatmap/split-layout.css')
const twitchHtml = read('../twitch/heatmap/index.html')
const kickHtml = read('../kick/heatmap/index.html')

for (const fragment of [
  'measureWideReferenceWidth(layoutRoot, viewportWidth)',
  'restoreReferenceCameraView',
  'createReferenceCamera',
  'pendingLayoutSnapshot',
  'pendingSelectedReveal',
  'revealWorldRectMinimally',
  'SPLIT_VIEWPORT_MARKUP',
  'createSplitViewportController',
  'viewport.dataset.worldWidth',
  'viewport.dataset.viewportWidth',
]) assert.ok(sceneSource.includes(fragment), `missing shared Split scene fragment: ${fragment}`)

for (const fragment of [
  'heatmap-fade-left',
  'heatmap-fade-right',
  'heatmap-position-rail',
  'heatmap-position-thumb',
  'role="scrollbar"',
  'setCameraWorldCenter',
  'cursor:grab',
  'cursor:grabbing',
]) assert.ok(splitSource.includes(fragment), `missing Split affordance fragment: ${fragment}`)

assert.ok(splitCss.includes('height:min(74vh,860px)'))
assert.ok(splitCss.includes('min-height:600px'))
assert.ok(twitchHtml.includes('/src/features/twitch-heatmap/split-layout.css'))
assert.ok(kickHtml.includes('/src/features/twitch-heatmap/split-layout.css'))
assert.ok(!sceneSource.toLowerCase().includes('nudge'))
assert.ok(!splitSource.toLowerCase().includes('nudge'))

console.log('Heatmap Split viewport verification passed.')
