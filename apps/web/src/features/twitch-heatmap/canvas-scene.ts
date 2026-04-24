import { formatIso } from './format'
import { pickSceneNode } from './hit-test'
import {
  createFitCamera,
  panCamera,
  screenToWorld,
  zoomCameraAroundPoint,
} from './interactions/camera'
import {
  type CameraState,
  type HeatmapItem,
  type HeatmapSceneNode,
  type TwitchHeatmapApiResponse,
} from './model'
import { buildSceneNodes } from './scene'
import { drawTilesLayer } from './tiles-layer'

const SCENE_CSS = '.heatmap-canvas-scene{display:grid;grid-template-rows:auto 1fr;min-height:560px;height:100%}.heatmap-canvas-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01))}.heatmap-canvas-toolbar__group{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.heatmap-canvas-badge{display:inline-flex;align-items:center;min-height:32px;padding:0 10px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:.82rem;color:var(--muted)}.heatmap-canvas-button{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);color:var(--text);cursor:pointer}.heatmap-canvas-button.is-active{background:rgba(var(--accent-rgb),.18);border-color:rgba(var(--accent-rgb),.28);color:var(--text)}.heatmap-canvas-viewport{position:relative;overflow:hidden;min-height:500px;touch-action:pan-y;cursor:grab}.heatmap-canvas-viewport.is-panning{cursor:grabbing}.heatmap-canvas-viewport.is-move-mode{touch-action:none}.heatmap-canvas-layer{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y}.heatmap-canvas-viewport.is-move-mode .heatmap-canvas-layer{touch-action:none}'
const PAN_THRESHOLD = 6
const WHEEL_ZOOM_IN = 1.14
const WHEEL_ZOOM_OUT = 1 / WHEEL_ZOOM_IN
const DOUBLE_CLICK_ZOOM_IN = 1.5
const DOUBLE_CLICK_ZOOM_OUT = 1 / DOUBLE_CLICK_ZOOM_IN

export function shouldUseCanvasRenderer(): boolean {
  const params = new URLSearchParams(window.location.search)
  const query = params.get('heatmapRenderer')
  const saved = window.localStorage.getItem('viewloom.heatmap.renderer')
  return query === 'canvas' || saved === 'canvas'
}

export function renderCanvasScene(input: {
  stage: HTMLElement
  items: HeatmapItem[]
  latest: NonNullable<TwitchHeatmapApiResponse['latest']>
  selectedStreamLogin: string | null
  onSelect: (item: HeatmapItem) => void
}): void {
  ensureCanvasStyles()
  const { stage, items, latest, onSelect } = input
  let selectedStreamLogin = input.selectedStreamLogin

  stage.innerHTML = `<div class="heatmap-canvas-scene"><div class="heatmap-canvas-toolbar"><div><div class="heatmap-live-toolbar__hint">Drag to pan · Ctrl/Alt + wheel to zoom · double-click to zoom</div><div class="heatmap-live-toolbar__stats"><span>${latest.total_viewers.toLocaleString()} viewers</span><span>${items.length} streams</span><span>${formatIso(latest.collected_at)}</span></div></div><div class="heatmap-canvas-toolbar__group"><span id="heatmap-canvas-zoom" class="heatmap-canvas-badge">100%</span><button id="heatmap-canvas-move" class="heatmap-canvas-button" type="button" aria-pressed="false">Move map</button><button id="heatmap-canvas-reset" class="heatmap-canvas-button" type="button">Reset zoom</button></div></div><div id="heatmap-canvas-viewport" class="heatmap-canvas-viewport"><canvas id="heatmap-canvas-tiles" class="heatmap-canvas-layer"></canvas><canvas id="heatmap-canvas-overlay" class="heatmap-canvas-layer"></canvas></div></div>`

  const viewport = stage.querySelector<HTMLElement>('#heatmap-canvas-viewport')
  const zoomLabel = stage.querySelector<HTMLElement>('#heatmap-canvas-zoom')
  const moveButton = stage.querySelector<HTMLButtonElement>('#heatmap-canvas-move')
  const resetButton = stage.querySelector<HTMLButtonElement>('#heatmap-canvas-reset')
  const tilesCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-tiles')
  const overlayCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-overlay')
  if (!viewport || !zoomLabel || !moveButton || !resetButton || !tilesCanvas || !overlayCanvas) return

  let viewportWidth = Math.max(1, viewport.clientWidth)
  let viewportHeight = Math.max(360, viewport.clientHeight)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  let nodes = buildSceneNodes(items, viewportWidth, viewportHeight)
  let selected = nodes.find((node) => node.channelLogin === selectedStreamLogin) ?? nodes[0] ?? null
  let camera = createFitCamera(viewportWidth, viewportHeight, viewportWidth, viewportHeight, 0)
  let resizeFrame = 0
  let pointerId: number | null = null
  let pointerDown = false
  let dragging = false
  let moveMode = false
  let downX = 0
  let downY = 0
  let lastX = 0
  let lastY = 0

  syncCanvasSize(tilesCanvas, viewportWidth, viewportHeight, dpr)
  syncCanvasSize(overlayCanvas, viewportWidth, viewportHeight, dpr)

  const tilesContext = tilesCanvas.getContext('2d')
  const overlayContext = overlayCanvas.getContext('2d')
  if (!tilesContext || !overlayContext) return

  const redraw = (): void => {
    drawTilesLayer(tilesContext, nodes, camera, viewportWidth, viewportHeight, dpr)
    drawSelectionOverlay(overlayContext, selected, camera, viewportWidth, viewportHeight, dpr)
    zoomLabel.textContent = `${Math.round(camera.zoom * 100)}%`
  }

  const resizeAndRelayout = (): void => {
    viewportWidth = Math.max(1, viewport.clientWidth)
    viewportHeight = Math.max(360, viewport.clientHeight)
    syncCanvasSize(tilesCanvas, viewportWidth, viewportHeight, dpr)
    syncCanvasSize(overlayCanvas, viewportWidth, viewportHeight, dpr)
    nodes = buildSceneNodes(items, viewportWidth, viewportHeight)
    selected = nodes.find((node) => node.channelLogin === selectedStreamLogin) ?? nodes[0] ?? null
    camera = createFitCamera(viewportWidth, viewportHeight, viewportWidth, viewportHeight, 0)
    redraw()
  }

  const updateMoveMode = (): void => {
    viewport.classList.toggle('is-move-mode', moveMode)
    moveButton.classList.toggle('is-active', moveMode)
    moveButton.textContent = moveMode ? 'Done' : 'Move map'
    moveButton.setAttribute('aria-pressed', moveMode ? 'true' : 'false')
  }

  const selectNode = (node: HeatmapSceneNode | null): void => {
    if (!node) return
    selected = node
    selectedStreamLogin = node.channelLogin
    redraw()
    onSelect(node)
  }

  redraw()
  updateMoveMode()

  const resizeObserver = new ResizeObserver(() => {
    window.cancelAnimationFrame(resizeFrame)
    resizeFrame = window.requestAnimationFrame(resizeAndRelayout)
  })
  resizeObserver.observe(viewport)

  moveButton.addEventListener('click', () => {
    moveMode = !moveMode
    pointerId = null
    pointerDown = false
    dragging = false
    viewport.classList.remove('is-panning')
    updateMoveMode()
  })

  resetButton.addEventListener('click', () => {
    camera = createFitCamera(viewportWidth, viewportHeight, viewportWidth, viewportHeight, 0)
    viewport.classList.remove('is-panning')
    redraw()
  })

  overlayCanvas.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.altKey && !event.metaKey) return
    event.preventDefault()
    const rect = overlayCanvas.getBoundingClientRect()
    const world = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera)
    camera = zoomCameraAroundPoint(camera, world, camera.zoom * (event.deltaY < 0 ? WHEEL_ZOOM_IN : WHEEL_ZOOM_OUT))
    redraw()
  }, { passive: false })

  overlayCanvas.addEventListener('dblclick', (event) => {
    const rect = overlayCanvas.getBoundingClientRect()
    const world = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera)
    camera = zoomCameraAroundPoint(camera, world, camera.zoom * (event.shiftKey ? DOUBLE_CLICK_ZOOM_OUT : DOUBLE_CLICK_ZOOM_IN))
    redraw()
  })

  overlayCanvas.addEventListener('pointerdown', (event) => {
    pointerId = event.pointerId
    pointerDown = true
    dragging = false
    downX = event.clientX
    downY = event.clientY
    lastX = event.clientX
    lastY = event.clientY
  })

  overlayCanvas.addEventListener('pointermove', (event) => {
    if (!pointerDown || pointerId !== event.pointerId) return
    if (event.pointerType === 'touch' && !moveMode) return
    const dx = event.clientX - downX
    const dy = event.clientY - downY
    if (!dragging && Math.hypot(dx, dy) >= PAN_THRESHOLD) {
      dragging = true
      overlayCanvas.setPointerCapture(event.pointerId)
      viewport.classList.add('is-panning')
    }
    if (!dragging) return
    camera = panCamera(camera, event.clientX - lastX, event.clientY - lastY)
    lastX = event.clientX
    lastY = event.clientY
    redraw()
  })

  const finishPointer = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return
    if (!dragging) {
      const rect = overlayCanvas.getBoundingClientRect()
      const world = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera)
      selectNode(pickSceneNode(world, nodes))
    } else if (overlayCanvas.hasPointerCapture(event.pointerId)) {
      overlayCanvas.releasePointerCapture(event.pointerId)
    }
    pointerId = null
    pointerDown = false
    dragging = false
    viewport.classList.remove('is-panning')
  }

  overlayCanvas.addEventListener('pointerup', finishPointer)
  overlayCanvas.addEventListener('pointercancel', finishPointer)
}

function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  selected: HeatmapSceneNode | null,
  camera: CameraState,
  viewportWidth: number,
  viewportHeight: number,
  dpr: number,
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  if (!selected) return
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fillRect(selected.x + 2 / camera.scale, selected.y + 2 / camera.scale, selected.width - 4 / camera.scale, selected.height - 4 / camera.scale)
  ctx.strokeStyle = 'rgba(255,255,255,0.98)'
  ctx.lineWidth = Math.max(3 / camera.scale, 3)
  ctx.strokeRect(selected.x + 1 / camera.scale, selected.y + 1 / camera.scale, selected.width - 2 / camera.scale, selected.height - 2 / camera.scale)
  ctx.strokeStyle = 'rgba(255,255,255,0.42)'
  ctx.lineWidth = Math.max(7 / camera.scale, 5)
  ctx.strokeRect(selected.x - 2 / camera.scale, selected.y - 2 / camera.scale, selected.width + 4 / camera.scale, selected.height + 4 / camera.scale)
  ctx.restore()
}

function syncCanvasSize(canvas: HTMLCanvasElement, width: number, height: number, dpr: number): void {
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
}

function ensureCanvasStyles(): void {
  if (document.getElementById('twitch-heatmap-canvas-style')) return
  const style = document.createElement('style')
  style.id = 'twitch-heatmap-canvas-style'
  style.textContent = SCENE_CSS
  document.head.appendChild(style)
}
