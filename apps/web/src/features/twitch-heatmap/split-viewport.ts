import {
  captureCameraView,
  getCameraViewportWorldRect,
  setCameraWorldCenter,
  type CameraBounds,
} from './interactions/camera'
import type { CameraState } from './model'

export type HeatmapLayoutMode = 'wide' | 'split'

type SplitViewportControllerInput = {
  stage: HTMLElement
  getCamera: () => CameraState
  setCamera: (camera: CameraState) => void
  getBounds: () => CameraBounds
  getLayoutMode: () => HeatmapLayoutMode
  redraw: () => void
}

const RAIL_MIN_THUMB_PX = 28
const CONTINUATION_EPSILON = 0.5

export const SPLIT_VIEWPORT_MARKUP = `
  <div id="heatmap-fade-left" class="heatmap-split-fade heatmap-split-fade--left" aria-hidden="true"></div>
  <div id="heatmap-fade-right" class="heatmap-split-fade heatmap-split-fade--right" aria-hidden="true"></div>
  <div id="heatmap-fade-top" class="heatmap-split-fade heatmap-split-fade--top" aria-hidden="true"></div>
  <div id="heatmap-fade-bottom" class="heatmap-split-fade heatmap-split-fade--bottom" aria-hidden="true"></div>
  <div id="heatmap-position-rail" class="heatmap-position-rail" role="scrollbar" aria-orientation="horizontal" aria-label="Map position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
    <div id="heatmap-position-track" class="heatmap-position-rail__track">
      <div id="heatmap-position-thumb" class="heatmap-position-rail__thumb"></div>
    </div>
  </div>
`

const SPLIT_VIEWPORT_CSS = `
.heatmap-canvas-viewport{isolation:isolate}
.heatmap-canvas-layer--tiles{z-index:1}
.heatmap-canvas-layer--overlay{z-index:2}
.heatmap-split-fade{position:absolute;z-index:3;pointer-events:none;opacity:0;transition:opacity 120ms ease}
.heatmap-split-fade.is-visible{opacity:1}
.heatmap-split-fade--left,.heatmap-split-fade--right{top:0;bottom:0;width:42px}
.heatmap-split-fade--left{left:0;background:linear-gradient(90deg,rgba(7,16,29,.82),rgba(7,16,29,0))}
.heatmap-split-fade--right{right:0;background:linear-gradient(270deg,rgba(7,16,29,.82),rgba(7,16,29,0))}
.heatmap-split-fade--top,.heatmap-split-fade--bottom{left:0;right:0;height:30px}
.heatmap-split-fade--top{top:0;background:linear-gradient(180deg,rgba(7,16,29,.72),rgba(7,16,29,0))}
.heatmap-split-fade--bottom{bottom:0;background:linear-gradient(0deg,rgba(7,16,29,.72),rgba(7,16,29,0))}
.heatmap-position-rail{position:absolute;z-index:4;left:14px;right:14px;bottom:10px;height:14px;padding:4px 0;opacity:0;pointer-events:none;transition:opacity 120ms ease}
.heatmap-position-rail.is-visible{opacity:1;pointer-events:auto}
.heatmap-position-rail__track{position:relative;height:6px;border-radius:999px;background:rgba(255,255,255,.12);box-shadow:0 0 0 1px rgba(0,0,0,.32);cursor:grab}
.heatmap-position-rail.is-dragging .heatmap-position-rail__track{cursor:grabbing}
.heatmap-position-rail__thumb{position:absolute;top:0;bottom:0;left:0;border-radius:999px;background:rgba(190,164,255,.9);box-shadow:0 0 0 1px rgba(255,255,255,.2) inset,0 1px 6px rgba(0,0,0,.45)}
@media(max-width:760px){.heatmap-position-rail{left:10px;right:10px;bottom:8px}}
`

export function ensureSplitViewportStyles(): void {
  if (document.getElementById('heatmap-split-viewport-style')) return
  const style = document.createElement('style')
  style.id = 'heatmap-split-viewport-style'
  style.textContent = SPLIT_VIEWPORT_CSS
  document.head.appendChild(style)
}

export function readHeatmapLayoutMode(layoutRoot: HTMLElement | null): HeatmapLayoutMode {
  return layoutRoot?.dataset.layout === 'split' ? 'split' : 'wide'
}

export function measureWideReferenceWidth(layoutRoot: HTMLElement | null, fallback: number): number {
  return Math.max(1, layoutRoot?.clientWidth ?? fallback)
}

export function createSplitViewportController(input: SplitViewportControllerInput): {
  update: () => void
  cancel: () => void
  destroy: () => void
} {
  const fadeLeft = input.stage.querySelector<HTMLElement>('#heatmap-fade-left')
  const fadeRight = input.stage.querySelector<HTMLElement>('#heatmap-fade-right')
  const fadeTop = input.stage.querySelector<HTMLElement>('#heatmap-fade-top')
  const fadeBottom = input.stage.querySelector<HTMLElement>('#heatmap-fade-bottom')
  const rail = input.stage.querySelector<HTMLElement>('#heatmap-position-rail')
  const track = input.stage.querySelector<HTMLElement>('#heatmap-position-track')
  const thumb = input.stage.querySelector<HTMLElement>('#heatmap-position-thumb')
  if (!fadeLeft || !fadeRight || !fadeTop || !fadeBottom || !rail || !track || !thumb) {
    return { update: () => undefined, cancel: () => undefined, destroy: () => undefined }
  }

  let pointerId: number | null = null
  let dragOffset = 0

  const update = (): void => {
    const camera = input.getCamera()
    const bounds = input.getBounds()
    const visible = getCameraViewportWorldRect(camera, bounds)
    const split = input.getLayoutMode() === 'split'
    const hasLeft = split && visible.x > CONTINUATION_EPSILON
    const hasRight = split && visible.x + visible.width < bounds.worldWidth - CONTINUATION_EPSILON
    const hasTop = split && visible.y > CONTINUATION_EPSILON
    const hasBottom = split && visible.y + visible.height < bounds.worldHeight - CONTINUATION_EPSILON

    setVisible(fadeLeft, hasLeft)
    setVisible(fadeRight, hasRight)
    setVisible(fadeTop, hasTop)
    setVisible(fadeBottom, hasBottom)

    const horizontalContinuation = hasLeft || hasRight
    rail.classList.toggle('is-visible', horizontalContinuation)
    rail.setAttribute('aria-hidden', horizontalContinuation ? 'false' : 'true')

    const trackWidth = Math.max(0, track.clientWidth)
    if (!horizontalContinuation || trackWidth <= 0 || bounds.worldWidth <= 0) {
      thumb.style.width = '100%'
      thumb.style.left = '0px'
      rail.setAttribute('aria-valuenow', '0')
      return
    }

    const visibleRatio = clamp(visible.width / bounds.worldWidth, 0, 1)
    const thumbWidth = clamp(trackWidth * visibleRatio, RAIL_MIN_THUMB_PX, trackWidth)
    const maxThumbLeft = Math.max(0, trackWidth - thumbWidth)
    const maxWorldLeft = Math.max(0, bounds.worldWidth - visible.width)
    const progress = maxWorldLeft > 0 ? clamp(visible.x / maxWorldLeft, 0, 1) : 0
    thumb.style.width = `${thumbWidth}px`
    thumb.style.left = `${maxThumbLeft * progress}px`
    rail.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
  }

  const moveToPointer = (clientX: number): void => {
    const camera = input.getCamera()
    const bounds = input.getBounds()
    const trackRect = track.getBoundingClientRect()
    const thumbRect = thumb.getBoundingClientRect()
    const thumbWidth = clamp(thumbRect.width, RAIL_MIN_THUMB_PX, trackRect.width)
    const maxThumbLeft = Math.max(0, trackRect.width - thumbWidth)
    const thumbLeft = clamp(clientX - trackRect.left - dragOffset, 0, maxThumbLeft)
    const visible = getCameraViewportWorldRect(camera, bounds)
    const maxWorldLeft = Math.max(0, bounds.worldWidth - visible.width)
    const worldLeft = maxThumbLeft > 0 ? (thumbLeft / maxThumbLeft) * maxWorldLeft : 0
    const currentView = captureCameraView(camera, bounds)
    input.setCamera(setCameraWorldCenter(camera, {
      x: worldLeft + visible.width / 2,
      y: currentView.centerY * bounds.worldHeight,
    }, bounds))
    input.redraw()
  }

  const cancel = (): void => {
    if (pointerId !== null && rail.hasPointerCapture(pointerId)) rail.releasePointerCapture(pointerId)
    pointerId = null
    dragOffset = 0
    rail.classList.remove('is-dragging')
  }

  const onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (!rail.classList.contains('is-visible')) return
    event.preventDefault()
    event.stopPropagation()
    const thumbRect = thumb.getBoundingClientRect()
    const insideThumb = event.clientX >= thumbRect.left && event.clientX <= thumbRect.right
    pointerId = event.pointerId
    dragOffset = insideThumb ? event.clientX - thumbRect.left : thumbRect.width / 2
    rail.classList.add('is-dragging')
    rail.setPointerCapture(event.pointerId)
    moveToPointer(event.clientX)
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return
    event.preventDefault()
    moveToPointer(event.clientX)
  }

  const onPointerEnd = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return
    cancel()
  }

  rail.addEventListener('pointerdown', onPointerDown)
  rail.addEventListener('pointermove', onPointerMove)
  rail.addEventListener('pointerup', onPointerEnd)
  rail.addEventListener('pointercancel', onPointerEnd)

  return {
    update,
    cancel,
    destroy: () => {
      cancel()
      rail.removeEventListener('pointerdown', onPointerDown)
      rail.removeEventListener('pointermove', onPointerMove)
      rail.removeEventListener('pointerup', onPointerEnd)
      rail.removeEventListener('pointercancel', onPointerEnd)
    },
  }
}

function setVisible(element: HTMLElement, visible: boolean): void {
  element.classList.toggle('is-visible', visible)
  element.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
