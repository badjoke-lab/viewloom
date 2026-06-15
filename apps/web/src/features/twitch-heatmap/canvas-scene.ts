import { formatIso } from './format'
import { pickSceneNode } from './hit-test'
import {
  MAX_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  captureCameraView,
  clampCameraToWorld,
  createReferenceCamera,
  panCamera,
  resetCameraToBaseScale,
  restoreReferenceCameraView,
  revealWorldRectMinimally,
  screenToWorld,
  zoomCameraAroundScreenPoint,
  type CameraViewSnapshot,
} from './interactions/camera'
import {
  SPLIT_VIEWPORT_MARKUP,
  createSplitViewportController,
  ensureSplitViewportStyles,
  measureWideReferenceWidth,
  readHeatmapLayoutMode,
  type HeatmapLayoutMode,
} from './split-viewport'
import {
  type CameraState,
  type HeatmapItem,
  type HeatmapSceneNode,
  type TwitchHeatmapApiResponse,
} from './model'
import { buildSceneNodes } from './scene'
import { drawTilesLayer } from './tiles-layer'

const SCENE_CSS = '.heatmap-canvas-scene{min-height:560px;height:100%;background:#07101d}.heatmap-canvas-viewport{position:relative;overflow:hidden;min-height:500px;height:100%;touch-action:pan-y;cursor:grab;background:#07101d;user-select:none}.heatmap-canvas-viewport.is-panning{cursor:grabbing}.heatmap-canvas-viewport.is-move-mode{touch-action:none}.heatmap-canvas-layer{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y}.heatmap-canvas-layer--tiles{pointer-events:none}.heatmap-canvas-viewport.is-move-mode .heatmap-canvas-layer{touch-action:none}.heatmap-map-control--icon{min-width:34px;padding:0;font-size:18px;line-height:1}.heatmap-map-control--zoom{min-width:64px;font-variant-numeric:tabular-nums}.heatmap-map-control--touch{display:none}button.heatmap-map-control[aria-busy=true]{cursor:progress;opacity:.72}@media(max-width:760px){.heatmap-canvas-scene{min-height:430px}.heatmap-canvas-viewport{min-height:430px}.heatmap-map-control--touch{display:inline-flex}}'
const PAN_THRESHOLD = 6
const CONTROL_ZOOM_STEP = 1.25
const WHEEL_ZOOM_IN = 1.14
const WHEEL_ZOOM_OUT = 1 / WHEEL_ZOOM_IN
const DOUBLE_CLICK_ZOOM_IN = 1.5
const DOUBLE_CLICK_ZOOM_OUT = 1 / DOUBLE_CLICK_ZOOM_IN
const SELECTED_INSET_PX = 1.5
const SELECTED_STROKE_PX = 2
const SELECTED_INNER_STROKE_PX = 0.75
const REFERENCE_BASE_SCALE = 1
const EPSILON = 0.001

type ActivePointer = { x: number; y: number }
type CanvasSceneInput = {
  stage: HTMLElement
  items: HeatmapItem[]
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>
  selectedStreamLogin: string | null
  sceneKey?: string
  onSelect: (item: HeatmapItem) => void
  onRefresh?: () => void | Promise<void>
}

const cameraMemory = new Map<string, CameraViewSnapshot>()
let activeSceneDestroy: (() => void) | null = null

export function shouldUseCanvasRenderer(): boolean {
  const params = new URLSearchParams(window.location.search)
  const query = params.get('heatmapRenderer')
  const saved = window.localStorage.getItem('viewloom.heatmap.renderer')
  return query !== 'dom' && query !== 'legacy' && saved !== 'dom' && saved !== 'legacy'
}

export function destroyCanvasScene(): void {
  const destroy = activeSceneDestroy
  activeSceneDestroy = null
  destroy?.()
}

export function renderCanvasScene(input: CanvasSceneInput): void {
  destroyCanvasScene()
  ensureCanvasStyles()
  ensureSplitViewportStyles()

  const { stage, items, latest, onSelect, onRefresh } = input
  const sceneKey = input.sceneKey ?? document.body.dataset.page ?? 'heatmap'
  const layoutRoot = stage.closest<HTMLElement>('#heatmap-layout-root')
  let layoutMode: HeatmapLayoutMode = readHeatmapLayoutMode(layoutRoot)
  let selectedStreamLogin = input.selectedStreamLogin
  const controlsHost = ensureMapControlsHost(stage)

  controlsHost.innerHTML = `
    <span id="heatmap-canvas-hint" class="heatmap-map-controls__hint">Drag to pan · Ctrl/Alt/⌘ + wheel to zoom · select a tile to inspect</span>
    <div class="heatmap-map-controls__stats">
      <span>${latest.total_viewers.toLocaleString()} viewers</span>
      <span>${items.length} streams</span>
      <span>${formatIso(latest.collected_at)}</span>
    </div>
    <button id="heatmap-canvas-zoom-out" class="heatmap-map-control heatmap-map-control--icon" type="button" aria-label="Zoom out">−</button>
    <button id="heatmap-canvas-zoom-base" class="heatmap-map-control heatmap-map-control--zoom" type="button" aria-label="Return map to 100 percent">100%</button>
    <button id="heatmap-canvas-zoom-in" class="heatmap-map-control heatmap-map-control--icon" type="button" aria-label="Zoom in">+</button>
    <button id="heatmap-canvas-reset" class="heatmap-map-control" type="button">Reset view</button>
    <button id="heatmap-canvas-refresh" class="heatmap-map-control" type="button" title="Load the latest stored snapshot">Refresh</button>
    <button id="heatmap-canvas-move" class="heatmap-map-control heatmap-map-control--touch" type="button" aria-pressed="false">Move map</button>
  `

  stage.innerHTML = `<div class="heatmap-canvas-scene"><div id="heatmap-canvas-viewport" class="heatmap-canvas-viewport" aria-label="Interactive stream heatmap"><canvas id="heatmap-canvas-tiles" class="heatmap-canvas-layer heatmap-canvas-layer--tiles"></canvas><canvas id="heatmap-canvas-overlay" class="heatmap-canvas-layer heatmap-canvas-layer--overlay"></canvas>${SPLIT_VIEWPORT_MARKUP}</div></div>`

  const viewport = stage.querySelector<HTMLElement>('#heatmap-canvas-viewport')
  const hintLabel = controlsHost.querySelector<HTMLElement>('#heatmap-canvas-hint')
  const zoomOutButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-zoom-out')
  const zoomBaseButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-zoom-base')
  const zoomInButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-zoom-in')
  const resetButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-reset')
  const refreshButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-refresh')
  const moveButton = controlsHost.querySelector<HTMLButtonElement>('#heatmap-canvas-move')
  const tilesCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-tiles')
  const overlayCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-overlay')
  if (!viewport || !hintLabel || !zoomOutButton || !zoomBaseButton || !zoomInButton || !resetButton || !refreshButton || !moveButton || !tilesCanvas || !overlayCanvas) return

  let viewportWidth = Math.max(1, viewport.clientWidth)
  let viewportHeight = Math.max(360, viewport.clientHeight)
  let worldWidth = measureWideReferenceWidth(layoutRoot, viewportWidth)
  let worldHeight = viewportHeight
  let dpr = currentDpr()
  let nodes = buildSceneNodes(items, worldWidth, worldHeight)
  let selected = nodes.find((node) => node.channelLogin === selectedStreamLogin) ?? nodes[0] ?? null
  if (selected && !selectedStreamLogin) selectedStreamLogin = selected.channelLogin
  let camera = cameraMemory.has(sceneKey)
    ? restoreReferenceCameraView(cameraMemory.get(sceneKey), getCameraBounds(), REFERENCE_BASE_SCALE)
    : createReferenceCamera(getCameraBounds(), REFERENCE_BASE_SCALE)
  let resizeFrame = 0
  let pointerId: number | null = null
  let pointerDown = false
  let dragging = false
  let moveMode = false
  let refreshing = false
  let downX = 0
  let downY = 0
  let lastX = 0
  let lastY = 0
  let gestureActive = false
  let gestureStartDistance = 0
  let gestureStartZoom = 1
  let pendingLayoutSnapshot: CameraViewSnapshot | null = null
  let pendingSelectedReveal = false
  let destroyed = false
  const activePointers = new Map<number, ActivePointer>()

  syncCanvasSize(tilesCanvas, viewportWidth, viewportHeight, dpr)
  syncCanvasSize(overlayCanvas, viewportWidth, viewportHeight, dpr)
  const tilesContext = tilesCanvas.getContext('2d')
  const overlayContext = overlayCanvas.getContext('2d')
  if (!tilesContext || !overlayContext) return

  function getCameraBounds() {
    return { worldWidth, worldHeight, viewportWidth, viewportHeight }
  }

  let splitController: ReturnType<typeof createSplitViewportController>

  const redraw = (): void => {
    camera = clampCameraToWorld(camera, getCameraBounds())
    drawTilesLayer(tilesContext, nodes, camera, viewportWidth, viewportHeight, dpr, selectedStreamLogin)
    drawSelectionOverlay(overlayContext, selected, camera, viewportWidth, viewportHeight, dpr)
    updateCameraControls()
    splitController?.update()
  }

  splitController = createSplitViewportController({
    stage,
    getCamera: () => camera,
    setCamera: (next) => { camera = next },
    getBounds: getCameraBounds,
    getLayoutMode: () => layoutMode,
    redraw,
  })

  const updateCameraControls = (): void => {
    const percent = Math.round(camera.zoom * 100)
    zoomBaseButton.textContent = `${percent}%`
    zoomBaseButton.setAttribute('aria-label', percent === 100 ? 'Map is at 100 percent' : `Return map from ${percent} percent to 100 percent`)
    zoomOutButton.disabled = camera.zoom <= MIN_CAMERA_ZOOM + EPSILON
    zoomBaseButton.disabled = Math.abs(camera.zoom - 1) <= EPSILON
    zoomInButton.disabled = camera.zoom >= MAX_CAMERA_ZOOM - EPSILON
    viewport.dataset.zoom = String(camera.zoom)
    viewport.dataset.layout = layoutMode
    viewport.dataset.worldWidth = String(Math.round(worldWidth))
    viewport.dataset.viewportWidth = String(Math.round(viewportWidth))
  }

  const resizeAndRelayout = (): void => {
    if (destroyed || !viewport.isConnected) return
    const preserved = pendingLayoutSnapshot ?? captureCameraView(camera, getCameraBounds())
    const nextViewportWidth = Math.max(1, viewport.clientWidth)
    const nextViewportHeight = Math.max(360, viewport.clientHeight)
    const nextWorldWidth = measureWideReferenceWidth(layoutRoot, nextViewportWidth)
    const nextWorldHeight = nextViewportHeight
    const nextDpr = currentDpr()
    const viewportChanged = Math.abs(nextViewportWidth - viewportWidth) >= 1 || Math.abs(nextViewportHeight - viewportHeight) >= 1
    const worldChanged = Math.abs(nextWorldWidth - worldWidth) >= 1 || Math.abs(nextWorldHeight - worldHeight) >= 1
    if (!viewportChanged && !worldChanged && nextDpr === dpr && !pendingLayoutSnapshot) return

    viewportWidth = nextViewportWidth
    viewportHeight = nextViewportHeight
    dpr = nextDpr
    if (worldChanged) {
      worldWidth = nextWorldWidth
      worldHeight = nextWorldHeight
      nodes = buildSceneNodes(items, worldWidth, worldHeight)
      selected = nodes.find((node) => node.channelLogin === selectedStreamLogin) ?? nodes[0] ?? null
      if (selected && !selectedStreamLogin) selectedStreamLogin = selected.channelLogin
    }
    syncCanvasSize(tilesCanvas, viewportWidth, viewportHeight, dpr)
    syncCanvasSize(overlayCanvas, viewportWidth, viewportHeight, dpr)
    camera = restoreReferenceCameraView(preserved, getCameraBounds(), REFERENCE_BASE_SCALE)
    if (pendingSelectedReveal && layoutMode === 'split' && selected) {
      camera = revealWorldRectMinimally(camera, selected, getCameraBounds(), 18)
    }
    pendingLayoutSnapshot = null
    pendingSelectedReveal = false
    redraw()
  }

  const scheduleResizeAndRelayout = (): void => {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(resizeAndRelayout)
  }

  const updateMoveMode = (): void => {
    viewport.classList.toggle('is-move-mode', moveMode)
    moveButton.classList.toggle('is-active', moveMode)
    hintLabel.textContent = moveMode
      ? 'Move map enabled · drag to pan · pinch to zoom · tap a tile to inspect'
      : 'Drag to pan · Ctrl/Alt/⌘ + wheel to zoom · select a tile to inspect'
    moveButton.textContent = moveMode ? 'Done' : 'Move map'
    moveButton.setAttribute('aria-pressed', moveMode ? 'true' : 'false')
  }

  const resetPointerState = (): void => {
    if (pointerId !== null && overlayCanvas.hasPointerCapture(pointerId)) overlayCanvas.releasePointerCapture(pointerId)
    pointerId = null
    pointerDown = false
    dragging = false
    gestureActive = false
    gestureStartDistance = 0
    gestureStartZoom = camera.zoom
    activePointers.clear()
    viewport.classList.remove('is-panning')
  }

  const selectNode = (node: HeatmapSceneNode | null): void => {
    if (!node) return
    selected = node
    selectedStreamLogin = node.channelLogin
    redraw()
    onSelect(node)
  }

  const zoomAtViewportCenter = (nextZoom: number): void => {
    camera = zoomCameraAroundScreenPoint(camera, { x: viewportWidth / 2, y: viewportHeight / 2 }, nextZoom, getCameraBounds())
    redraw()
  }

  const refreshAction = onRefresh ?? (async (): Promise<void> => {
    destroyCanvasScene()
    const module = await import('../../live/twitch-heatmap')
    await module.hydrateTwitchHeatmap()
  })

  const resizeObserver = new ResizeObserver(scheduleResizeAndRelayout)
  resizeObserver.observe(viewport)
  if (layoutRoot) resizeObserver.observe(layoutRoot)

  const onLayoutChange = (event: Event): void => {
    pendingLayoutSnapshot = captureCameraView(camera, getCameraBounds())
    pendingSelectedReveal = true
    const detail = (event as CustomEvent<{ mode?: HeatmapLayoutMode }>).detail
    layoutMode = detail?.mode === 'split' ? 'split' : readHeatmapLayoutMode(layoutRoot)
    window.requestAnimationFrame(scheduleResizeAndRelayout)
  }
  const onWindowBlur = (): void => {
    resetPointerState()
    splitController.cancel()
  }
  window.addEventListener('viewloom:heatmap-layout-change', onLayoutChange)
  window.addEventListener('blur', onWindowBlur)

  zoomOutButton.addEventListener('click', () => zoomAtViewportCenter(camera.zoom / CONTROL_ZOOM_STEP))
  zoomBaseButton.addEventListener('click', () => {
    camera = resetCameraToBaseScale(camera, getCameraBounds())
    redraw()
  })
  zoomInButton.addEventListener('click', () => zoomAtViewportCenter(camera.zoom * CONTROL_ZOOM_STEP))
  resetButton.addEventListener('click', () => {
    camera = createReferenceCamera(getCameraBounds(), REFERENCE_BASE_SCALE)
    resetPointerState()
    redraw()
  })
  refreshButton.addEventListener('click', async () => {
    if (refreshing) return
    refreshing = true
    refreshButton.disabled = true
    refreshButton.textContent = 'Refreshing…'
    refreshButton.setAttribute('aria-busy', 'true')
    cameraMemory.set(sceneKey, captureCameraView(camera, getCameraBounds()))
    try { await refreshAction() } finally {
      refreshing = false
      if (refreshButton.isConnected) {
        refreshButton.disabled = false
        refreshButton.textContent = 'Refresh'
        refreshButton.removeAttribute('aria-busy')
      }
    }
  })
  moveButton.addEventListener('click', () => {
    moveMode = !moveMode
    resetPointerState()
    updateMoveMode()
  })

  overlayCanvas.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.altKey && !event.metaKey) return
    event.preventDefault()
    const rect = overlayCanvas.getBoundingClientRect()
    camera = zoomCameraAroundScreenPoint(camera, { x: event.clientX - rect.left, y: event.clientY - rect.top }, camera.zoom * (event.deltaY < 0 ? WHEEL_ZOOM_IN : WHEEL_ZOOM_OUT), getCameraBounds())
    redraw()
  }, { passive: false })

  overlayCanvas.addEventListener('dblclick', (event) => {
    event.preventDefault()
    const rect = overlayCanvas.getBoundingClientRect()
    camera = zoomCameraAroundScreenPoint(camera, { x: event.clientX - rect.left, y: event.clientY - rect.top }, camera.zoom * (event.shiftKey ? DOUBLE_CLICK_ZOOM_OUT : DOUBLE_CLICK_ZOOM_IN), getCameraBounds())
    redraw()
  })

  overlayCanvas.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.pointerType !== 'mouse') {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (moveMode && activePointers.size >= 2) {
        startGesture()
        pointerDown = false
        dragging = false
        viewport.classList.add('is-panning')
        for (const activeId of activePointers.keys()) {
          if (!overlayCanvas.hasPointerCapture(activeId)) overlayCanvas.setPointerCapture(activeId)
        }
        return
      }
    }
    pointerId = event.pointerId
    pointerDown = true
    dragging = false
    downX = event.clientX
    downY = event.clientY
    lastX = event.clientX
    lastY = event.clientY
  })

  overlayCanvas.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (moveMode && activePointers.size >= 2) {
        if (!gestureActive) startGesture()
        applyGesture()
        return
      }
    }
    if (!pointerDown || pointerId !== event.pointerId) return
    if (event.pointerType !== 'mouse' && !moveMode) return
    const dx = event.clientX - downX
    const dy = event.clientY - downY
    if (!dragging && Math.hypot(dx, dy) >= PAN_THRESHOLD) {
      dragging = true
      if (!overlayCanvas.hasPointerCapture(event.pointerId)) overlayCanvas.setPointerCapture(event.pointerId)
      viewport.classList.add('is-panning')
    }
    if (!dragging) return
    camera = panCamera(camera, event.clientX - lastX, event.clientY - lastY, getCameraBounds())
    lastX = event.clientX
    lastY = event.clientY
    redraw()
  })

  const finishPointer = (event: PointerEvent, canceled: boolean): void => {
    const gestureWasActive = gestureActive || activePointers.size > 1
    if (event.pointerType !== 'mouse') activePointers.delete(event.pointerId)
    if (gestureWasActive && event.pointerType !== 'mouse') {
      if (overlayCanvas.hasPointerCapture(event.pointerId)) overlayCanvas.releasePointerCapture(event.pointerId)
      pointerId = null
      pointerDown = false
      dragging = false
      if (activePointers.size < 2) {
        gestureActive = false
        gestureStartDistance = 0
        gestureStartZoom = camera.zoom
        viewport.classList.remove('is-panning')
      }
      return
    }
    if (pointerId !== event.pointerId) return
    if (!canceled && !dragging) {
      const rect = overlayCanvas.getBoundingClientRect()
      selectNode(pickSceneNode(screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera), nodes))
    }
    if (overlayCanvas.hasPointerCapture(event.pointerId)) overlayCanvas.releasePointerCapture(event.pointerId)
    pointerId = null
    pointerDown = false
    dragging = false
    viewport.classList.remove('is-panning')
  }

  overlayCanvas.addEventListener('pointerup', (event) => finishPointer(event, false))
  overlayCanvas.addEventListener('pointercancel', (event) => finishPointer(event, true))
  overlayCanvas.addEventListener('lostpointercapture', () => {
    if (pointerDown || gestureActive) resetPointerState()
  })

  function startGesture(): void {
    const gesture = getGestureState(overlayCanvas, activePointers)
    if (!gesture) return
    gestureStartDistance = gesture.distance
    gestureStartZoom = camera.zoom
    gestureActive = true
  }

  function applyGesture(): void {
    const gesture = getGestureState(overlayCanvas, activePointers)
    if (!gesture || gestureStartDistance <= 0) return
    camera = zoomCameraAroundScreenPoint(camera, gesture.center, gestureStartZoom * (gesture.distance / gestureStartDistance), getCameraBounds())
    redraw()
  }

  redraw()
  updateMoveMode()

  activeSceneDestroy = () => {
    if (destroyed) return
    destroyed = true
    cameraMemory.set(sceneKey, captureCameraView(camera, getCameraBounds()))
    window.cancelAnimationFrame(resizeFrame)
    resizeObserver.disconnect()
    splitController.destroy()
    window.removeEventListener('viewloom:heatmap-layout-change', onLayoutChange)
    window.removeEventListener('blur', onWindowBlur)
    resetPointerState()
  }
}

function ensureMapControlsHost(stage: HTMLElement): HTMLElement {
  const existing = document.querySelector<HTMLElement>('#heatmap-map-controls')
  if (existing) return existing
  const host = document.createElement('div')
  host.id = 'heatmap-map-controls'
  host.className = 'heatmap-map-controls'
  stage.before(host)
  return host
}

function getGestureState(canvas: HTMLCanvasElement, points: Map<number, ActivePointer>): { center: { x: number; y: number }; distance: number } | null {
  const active = Array.from(points.values()).slice(0, 2)
  if (active.length < 2) return null
  const [first, second] = active
  const rect = canvas.getBoundingClientRect()
  return {
    center: { x: (first.x + second.x) / 2 - rect.left, y: (first.y + second.y) / 2 - rect.top },
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  }
}

function drawSelectionOverlay(ctx: CanvasRenderingContext2D, selected: HeatmapSceneNode | null, camera: CameraState, viewportWidth: number, viewportHeight: number, dpr: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  if (!selected) return
  const inset = SELECTED_INSET_PX / camera.scale
  const width = Math.max(0, selected.width - inset * 2)
  const height = Math.max(0, selected.height - inset * 2)
  if (width <= 0 || height <= 0) return
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)
  ctx.fillStyle = 'rgba(144,90,255,0.075)'
  ctx.fillRect(selected.x + inset, selected.y + inset, width, height)
  ctx.strokeStyle = 'rgba(174,125,255,0.98)'
  ctx.lineWidth = SELECTED_STROKE_PX / camera.scale
  ctx.strokeRect(selected.x + inset, selected.y + inset, width, height)
  const innerInset = inset + 2 / camera.scale
  const innerWidth = Math.max(0, selected.width - innerInset * 2)
  const innerHeight = Math.max(0, selected.height - innerInset * 2)
  if (innerWidth > 0 && innerHeight > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.24)'
    ctx.lineWidth = SELECTED_INNER_STROKE_PX / camera.scale
    ctx.strokeRect(selected.x + innerInset, selected.y + innerInset, innerWidth, innerHeight)
  }
  ctx.restore()
}

function syncCanvasSize(canvas: HTMLCanvasElement, width: number, height: number, dpr: number): void {
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}

function currentDpr(): number { return Math.min(window.devicePixelRatio || 1, 2) }
function ensureCanvasStyles(): void {
  if (document.getElementById('twitch-heatmap-canvas-style')) return
  const style = document.createElement('style')
  style.id = 'twitch-heatmap-canvas-style'
  style.textContent = SCENE_CSS
  document.head.appendChild(style)
}
