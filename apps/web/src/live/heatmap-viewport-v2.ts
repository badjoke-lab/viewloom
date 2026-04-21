type HeatmapViewportOptions = {
  viewport: HTMLElement
  canvas: HTMLElement
  zoomLabel: HTMLElement
  resetButton: HTMLButtonElement
}

type ViewState = {
  zoom: number
  tx: number
  ty: number
}

const MAX_ZOOM = 4.5
const DRAG_THRESHOLD = 6
const DOUBLE_CLICK_ZOOM_FACTOR = 1.6

export type HeatmapViewportHandle = {
  destroy: () => void
}

export function createHeatmapViewport(options: HeatmapViewportOptions): HeatmapViewportHandle {
  const { viewport, canvas, zoomLabel, resetButton } = options

  const state: ViewState = {
    zoom: 1,
    tx: 0,
    ty: 0,
  }

  let fitScale = 1
  let pointerId: number | null = null
  let dragStarted = false
  let startX = 0
  let startY = 0
  let startTx = 0
  let startTy = 0

  const resizeObserver = new ResizeObserver(() => {
    preserveViewportCenterOnResize()
  })

  resizeObserver.observe(viewport)

  viewport.addEventListener('wheel', onWheel, { passive: false })
  viewport.addEventListener('pointerdown', onPointerDown)
  viewport.addEventListener('pointermove', onPointerMove)
  viewport.addEventListener('pointerup', onPointerUp)
  viewport.addEventListener('pointercancel', onPointerUp)
  viewport.addEventListener('dblclick', onDoubleClick)
  resetButton.addEventListener('click', onReset)

  preserveViewportCenterOnResize(true)

  return {
    destroy() {
      resizeObserver.disconnect()
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointermove', onPointerMove)
      viewport.removeEventListener('pointerup', onPointerUp)
      viewport.removeEventListener('pointercancel', onPointerUp)
      viewport.removeEventListener('dblclick', onDoubleClick)
      resetButton.removeEventListener('click', onReset)
    },
  }

  function onReset(): void {
    state.zoom = 1
    centerContent(getScale())
    applyTransform()
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault()

    const rect = viewport.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const nextZoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.0016), 1, MAX_ZOOM)

    if (Math.abs(nextZoom - state.zoom) < 0.0001) return

    zoomAroundPoint(pointerX, pointerY, nextZoom)
  }

  function onDoubleClick(event: MouseEvent): void {
    event.preventDefault()

    const rect = viewport.getBoundingClientRect()
    const pointerX = event.clientX - rect.left
    const pointerY = event.clientY - rect.top
    const nextZoom = event.shiftKey
      ? clamp(state.zoom / DOUBLE_CLICK_ZOOM_FACTOR, 1, MAX_ZOOM)
      : clamp(state.zoom * DOUBLE_CLICK_ZOOM_FACTOR, 1, MAX_ZOOM)

    if (Math.abs(nextZoom - state.zoom) < 0.0001) return

    zoomAroundPoint(pointerX, pointerY, nextZoom)
  }

  function zoomAroundPoint(pointerX: number, pointerY: number, nextZoom: number): void {
    const previousScale = getScale()
    const contentX = (pointerX - state.tx) / previousScale
    const contentY = (pointerY - state.ty) / previousScale

    state.zoom = nextZoom

    const nextScale = getScale()
    state.tx = pointerX - contentX * nextScale
    state.ty = pointerY - contentY * nextScale

    clampTranslation(nextScale)
    applyTransform()
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return

    pointerId = event.pointerId
    dragStarted = false
    startX = event.clientX
    startY = event.clientY
    startTx = state.tx
    startTy = state.ty

    viewport.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent): void {
    if (pointerId !== event.pointerId) return

    const deltaX = event.clientX - startX
    const deltaY = event.clientY - startY

    if (!dragStarted) {
      const moved = Math.hypot(deltaX, deltaY)
      if (moved < DRAG_THRESHOLD) return
      dragStarted = true
      viewport.classList.add('is-panning')
    }

    state.tx = startTx + deltaX
    state.ty = startTy + deltaY
    clampTranslation(getScale())
    applyTransform()
  }

  function onPointerUp(event: PointerEvent): void {
    if (pointerId !== event.pointerId) return

    pointerId = null
    dragStarted = false
    viewport.classList.remove('is-panning')

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }
  }

  function preserveViewportCenterOnResize(initial = false): void {
    const viewportWidth = viewport.clientWidth || 1
    const viewportHeight = viewport.clientHeight || 1
    const previousScale = getScale()
    const centerX = initial ? getCanvasWidth() / 2 : (viewportWidth / 2 - state.tx) / previousScale
    const centerY = initial ? getCanvasHeight() / 2 : (viewportHeight / 2 - state.ty) / previousScale

    fitScale = Math.min(viewportWidth / getCanvasWidth(), viewportHeight / getCanvasHeight())

    const nextScale = getScale()
    state.tx = viewportWidth / 2 - centerX * nextScale
    state.ty = viewportHeight / 2 - centerY * nextScale

    clampTranslation(nextScale)
    applyTransform()
  }

  function centerContent(scale: number): void {
    const viewportWidth = viewport.clientWidth || 1
    const viewportHeight = viewport.clientHeight || 1
    const scaledWidth = getCanvasWidth() * scale
    const scaledHeight = getCanvasHeight() * scale

    state.tx = scaledWidth <= viewportWidth ? (viewportWidth - scaledWidth) / 2 : 0
    state.ty = scaledHeight <= viewportHeight ? (viewportHeight - scaledHeight) / 2 : 0
  }

  function clampTranslation(scale: number): void {
    const viewportWidth = viewport.clientWidth || 1
    const viewportHeight = viewport.clientHeight || 1
    const scaledWidth = getCanvasWidth() * scale
    const scaledHeight = getCanvasHeight() * scale

    if (scaledWidth <= viewportWidth) {
      state.tx = (viewportWidth - scaledWidth) / 2
    } else {
      state.tx = clamp(state.tx, viewportWidth - scaledWidth, 0)
    }

    if (scaledHeight <= viewportHeight) {
      state.ty = (viewportHeight - scaledHeight) / 2
    } else {
      state.ty = clamp(state.ty, viewportHeight - scaledHeight, 0)
    }
  }

  function applyTransform(): void {
    const scale = getScale()
    canvas.style.transform = `translate3d(${state.tx}px, ${state.ty}px, 0) scale(${scale})`
    zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`
  }

  function getScale(): number {
    return fitScale * state.zoom
  }

  function getCanvasWidth(): number {
    return canvas.offsetWidth || Number(canvas.dataset.canvasWidth) || 1600
  }

  function getCanvasHeight(): number {
    return canvas.offsetHeight || Number(canvas.dataset.canvasHeight) || 960
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
