import { formatIso } from './format'
import { pickSceneNode } from './hit-test'
import { createFitCamera, screenToWorld } from './interactions/camera'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type HeatmapItem,
  type HeatmapSceneNode,
  type TwitchHeatmapApiResponse,
} from './model'
import { buildSceneNodes } from './scene'
import { drawTilesLayer } from './tiles-layer'

const SCENE_CSS = '.heatmap-canvas-scene{display:grid;grid-template-rows:auto 1fr;min-height:560px;height:100%}.heatmap-canvas-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.01))}.heatmap-canvas-badge{display:inline-flex;align-items:center;gap:8px;padding:0 10px;min-height:32px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);font-size:.82rem;color:var(--muted)}.heatmap-canvas-viewport{position:relative;overflow:hidden;min-height:500px}.heatmap-canvas-layer{position:absolute;inset:0;width:100%;height:100%;display:block}'

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
  const { stage, items, latest, selectedStreamLogin, onSelect } = input
  const nodes = buildSceneNodes(items)
  const selected = nodes.find((node) => node.channelLogin === selectedStreamLogin) ?? nodes[0] ?? null

  stage.innerHTML = `<div class="heatmap-canvas-scene"><div class="heatmap-canvas-toolbar"><div><div class="heatmap-live-toolbar__hint">Experimental canvas scene · static fit render</div><div class="heatmap-live-toolbar__stats"><span>${latest.total_viewers.toLocaleString()} viewers</span><span>${nodes.length} streams</span><span>${formatIso(latest.collected_at)}</span></div></div><span class="heatmap-canvas-badge">Canvas scene preview</span></div><div id="heatmap-canvas-viewport" class="heatmap-canvas-viewport"><canvas id="heatmap-canvas-tiles" class="heatmap-canvas-layer"></canvas><canvas id="heatmap-canvas-overlay" class="heatmap-canvas-layer"></canvas></div></div>`

  const viewport = stage.querySelector<HTMLElement>('#heatmap-canvas-viewport')
  const tilesCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-tiles')
  const overlayCanvas = stage.querySelector<HTMLCanvasElement>('#heatmap-canvas-overlay')
  if (!viewport || !tilesCanvas || !overlayCanvas) return

  const viewportWidth = Math.max(1, viewport.clientWidth)
  const viewportHeight = Math.max(360, viewport.clientHeight)
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const camera = createFitCamera(viewportWidth, viewportHeight, CANVAS_WIDTH, CANVAS_HEIGHT)

  syncCanvasSize(tilesCanvas, viewportWidth, viewportHeight, dpr)
  syncCanvasSize(overlayCanvas, viewportWidth, viewportHeight, dpr)

  const tilesContext = tilesCanvas.getContext('2d')
  const overlayContext = overlayCanvas.getContext('2d')
  if (!tilesContext || !overlayContext) return

  drawTilesLayer(tilesContext, nodes, camera, viewportWidth, viewportHeight, dpr)
  drawSelectionOverlay(overlayContext, selected, camera, viewportWidth, viewportHeight, dpr)

  overlayCanvas.addEventListener('click', (event) => {
    const rect = overlayCanvas.getBoundingClientRect()
    const world = screenToWorld({ x: event.clientX - rect.left, y: event.clientY - rect.top }, camera)
    const picked = pickSceneNode(world, nodes)
    if (!picked) return
    drawSelectionOverlay(overlayContext, picked, camera, viewportWidth, viewportHeight, dpr)
    onSelect(picked)
  })
}

function drawSelectionOverlay(ctx: CanvasRenderingContext2D, selected: HeatmapSceneNode | null, camera: ReturnType<typeof createFitCamera>, viewportWidth: number, viewportHeight: number, dpr: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, viewportWidth * dpr, viewportHeight * dpr)
  if (!selected) return
  ctx.save()
  ctx.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.tx * dpr, camera.ty * dpr)
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = Math.max(3 / camera.scale, 3)
  ctx.strokeRect(selected.x + 1 / camera.scale, selected.y + 1 / camera.scale, selected.width - 2 / camera.scale, selected.height - 2 / camera.scale)
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
