import './mobile-inspector-sheet.css'

const MOBILE_QUERY = '(max-width: 760px)'

export function installHeatmapMobileInspectorSheet(): () => void {
  const inspector = document.querySelector<HTMLElement>('#heatmap-inspector')
  if (!inspector) return () => undefined
  const inspectorElement: HTMLElement = inspector

  const media = window.matchMedia(MOBILE_QUERY)
  const backdrop = ensureBackdrop()
  const bar = ensureSheetBar(inspectorElement)
  const closeButton = bar.querySelector<HTMLButtonElement>('[data-heatmap-sheet-close]')
  let returnFocus: HTMLElement | null = null
  let open = false

  const applyMode = (): void => {
    if (media.matches) {
      inspectorElement.setAttribute('role', 'dialog')
      inspectorElement.setAttribute('aria-modal', 'true')
      inspectorElement.setAttribute('aria-labelledby', 'heatmap-inspector-title')
      inspectorElement.setAttribute('aria-hidden', open ? 'false' : 'true')
    } else {
      closeSheet(false)
      inspectorElement.removeAttribute('role')
      inspectorElement.removeAttribute('aria-modal')
      inspectorElement.removeAttribute('aria-labelledby')
      inspectorElement.removeAttribute('aria-hidden')
    }
  }

  const openSheet = (trigger?: HTMLElement | null): void => {
    if (!media.matches) return
    returnFocus = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    open = true
    inspectorElement.classList.add('is-mobile-sheet-open')
    backdrop.classList.add('is-visible')
    backdrop.setAttribute('aria-hidden', 'false')
    inspectorElement.setAttribute('aria-hidden', 'false')
    document.body.classList.add('is-heatmap-sheet-open')
    window.requestAnimationFrame(() => closeButton?.focus({ preventScroll: true }))
  }

  function closeSheet(restoreFocus = true): void {
    if (!open && media.matches) {
      inspectorElement.setAttribute('aria-hidden', 'true')
      return
    }
    open = false
    inspectorElement.classList.remove('is-mobile-sheet-open')
    backdrop.classList.remove('is-visible')
    backdrop.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('is-heatmap-sheet-open')
    if (media.matches) inspectorElement.setAttribute('aria-hidden', 'true')
    if (restoreFocus) {
      const target = returnFocus?.isConnected ? returnFocus : document.querySelector<HTMLElement>('#heatmap-canvas-viewport')
      target?.focus({ preventScroll: true })
    }
    returnFocus = null
  }

  const onSelection = (event: Event): void => {
    const detail = (event as CustomEvent<{ trigger?: HTMLElement | null }>).detail
    openSheet(detail?.trigger ?? null)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!open || !media.matches) return
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSheet(true)
      return
    }
    if (event.key !== 'Tab') return
    const focusable = focusableElements(inspectorElement)
    if (focusable.length === 0) {
      event.preventDefault()
      closeButton?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const onBackdrop = (): void => closeSheet(true)
  const onClose = (): void => closeSheet(true)
  const onMediaChange = (): void => applyMode()

  window.addEventListener('viewloom:heatmap-selection-change', onSelection)
  document.addEventListener('keydown', onKeyDown)
  backdrop.addEventListener('click', onBackdrop)
  closeButton?.addEventListener('click', onClose)
  media.addEventListener('change', onMediaChange)
  applyMode()

  return () => {
    closeSheet(false)
    window.removeEventListener('viewloom:heatmap-selection-change', onSelection)
    document.removeEventListener('keydown', onKeyDown)
    backdrop.removeEventListener('click', onBackdrop)
    closeButton?.removeEventListener('click', onClose)
    media.removeEventListener('change', onMediaChange)
    backdrop.remove()
    bar.remove()
    inspectorElement.removeAttribute('role')
    inspectorElement.removeAttribute('aria-modal')
    inspectorElement.removeAttribute('aria-labelledby')
    inspectorElement.removeAttribute('aria-hidden')
  }
}

function ensureBackdrop(): HTMLButtonElement {
  const existing = document.querySelector<HTMLButtonElement>('[data-heatmap-sheet-backdrop]')
  if (existing) return existing
  const backdrop = document.createElement('button')
  backdrop.type = 'button'
  backdrop.className = 'heatmap-mobile-sheet-backdrop'
  backdrop.dataset.heatmapSheetBackdrop = 'true'
  backdrop.setAttribute('aria-label', 'Close selected stream details')
  backdrop.setAttribute('aria-hidden', 'true')
  document.body.appendChild(backdrop)
  return backdrop
}

function ensureSheetBar(inspector: HTMLElement): HTMLElement {
  const existing = inspector.querySelector<HTMLElement>('[data-heatmap-mobile-sheet-bar]')
  if (existing) return existing
  const bar = document.createElement('div')
  bar.className = 'heatmap-mobile-sheet__bar'
  bar.dataset.heatmapMobileSheetBar = 'true'
  bar.innerHTML = '<span class="heatmap-mobile-sheet__handle" aria-hidden="true"></span><button class="heatmap-mobile-sheet__close" type="button" data-heatmap-sheet-close aria-label="Close selected stream details">×</button>'
  inspector.prepend(bar)
  return bar
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'))
    .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
}
