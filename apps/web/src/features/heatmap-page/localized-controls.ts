import { localeFromPathname } from '../../i18n/locale'
import { heatmapCanvasJa } from '../../i18n/heatmap-canvas'

export function installHeatmapLocalizedControls(): () => void {
  if (localeFromPathname(window.location.pathname) !== 'ja') return () => undefined

  let queued = false
  const render = (): void => {
    queued = false
    localizeCanvasControls()
  }
  const queue = (): void => {
    if (queued) return
    queued = true
    window.requestAnimationFrame(render)
  }

  const observer = new MutationObserver(queue)
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-roledescription', 'title'],
  })
  localizeCanvasControls()

  return () => {
    observer.disconnect()
    queued = false
  }
}

function localizeCanvasControls(): void {
  setText('#heatmap-canvas-hint', (current) => {
    if (current.includes('Move map enabled')) return heatmapCanvasJa.moveHint
    if (current.includes('Drag to pan')) return heatmapCanvasJa.hint
    return current
  })

  setAria('#heatmap-canvas-zoom-out', heatmapCanvasJa.zoomOut)
  setAria('#heatmap-canvas-zoom-in', heatmapCanvasJa.zoomIn)
  const zoomBase = document.querySelector<HTMLButtonElement>('#heatmap-canvas-zoom-base')
  if (zoomBase) {
    const percent = zoomBase.textContent?.replace('%', '').trim() || '100'
    const current = zoomBase.getAttribute('aria-label') ?? ''
    const next = current.includes('100 percent') && !current.startsWith('Map is')
      ? heatmapCanvasJa.zoomToBase(percent)
      : heatmapCanvasJa.zoomAtBase
    if (zoomBase.getAttribute('aria-label') !== next) zoomBase.setAttribute('aria-label', next)
  }

  setText('#heatmap-canvas-reset', () => heatmapCanvasJa.reset)
  setText('#heatmap-canvas-refresh', (current) => current.toLowerCase().includes('refreshing') ? heatmapCanvasJa.refreshing : heatmapCanvasJa.refresh)
  const refresh = document.querySelector<HTMLElement>('#heatmap-canvas-refresh')
  if (refresh?.getAttribute('title')?.includes('latest stored snapshot')) refresh.setAttribute('title', '最新の保存済みスナップショットを読み込む')
  setText('#heatmap-canvas-move', (current) => current === 'Done' || current === heatmapCanvasJa.done ? heatmapCanvasJa.done : heatmapCanvasJa.move)

  const viewport = document.querySelector<HTMLElement>('#heatmap-canvas-viewport')
  if (viewport) {
    if (viewport.getAttribute('aria-roledescription') !== heatmapCanvasJa.roleDescription) viewport.setAttribute('aria-roledescription', heatmapCanvasJa.roleDescription)
    if (viewport.getAttribute('aria-label') !== heatmapCanvasJa.ariaLabel) viewport.setAttribute('aria-label', heatmapCanvasJa.ariaLabel)
  }
  setText('#heatmap-canvas-instructions', () => heatmapCanvasJa.instructions)
  setText('#heatmap-canvas-status', localizeSelectionAnnouncement)

  const stats = document.querySelectorAll<HTMLElement>('.heatmap-map-controls__stats span')
  if (stats[0]) {
    const match = stats[0].textContent?.match(/^([\d,.]+) viewers$/)
    if (match) stats[0].textContent = heatmapCanvasJa.viewers(match[1])
  }
  if (stats[1]) {
    const match = stats[1].textContent?.match(/^(\d+) streams$/)
    if (match) stats[1].textContent = heatmapCanvasJa.streams(match[1])
  }
}

function localizeSelectionAnnouncement(current: string): string {
  if (current === 'No stream selected.') return heatmapCanvasJa.noSelection
  const match = current.match(/^Tile (\d+) of (\d+)\. (.*), ([\d,.]+) viewers\. Press Enter to inspect\.$/)
  return match ? heatmapCanvasJa.selection(match[1], match[2], match[3], match[4]) : current
}

function setText(selector: string, transform: (current: string) => string): void {
  const node = document.querySelector<HTMLElement>(selector)
  if (!node) return
  const current = node.textContent ?? ''
  const next = transform(current)
  if (next !== current) node.textContent = next
}

function setAria(selector: string, value: string): void {
  const node = document.querySelector<HTMLElement>(selector)
  if (node && node.getAttribute('aria-label') !== value) node.setAttribute('aria-label', value)
}
