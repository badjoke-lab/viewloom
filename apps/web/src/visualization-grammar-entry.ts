import {
  installVisualizationGrammar,
  type VisualizationFeature,
} from './visualization-grammar'

const feature = detectFeature()
if (feature) mountFeatureGrammar(feature)

function mountFeatureGrammar(feature: VisualizationFeature): void {
  const controller = installVisualizationGrammar(feature)
  const source = stateSource(feature)
  const stage = document.querySelector<HTMLElement>(stageSelector(feature))

  const sync = () => {
    const { state, detail } = readState(feature, source)
    controller.updateState(state, detail)
  }

  sync()
  window.requestAnimationFrame(sync)

  const observers: MutationObserver[] = []
  for (const target of [source, stage]) {
    if (!target || observers.some((item) => item === target)) continue
    const observer = new MutationObserver(sync)
    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'data-heatmap-state', 'data-state'],
    })
    observers.push(observer)
  }
  window.addEventListener('pagehide', () => observers.forEach((observer) => observer.disconnect()), { once: true })
}

function detectFeature(): VisualizationFeature | null {
  const path = window.location.pathname
  if (path.includes('/heatmap/')) return 'heatmap'
  if (path.includes('/day-flow/')) return 'day-flow'
  if (path.includes('/battle-lines/')) return 'battle-lines'
  if (path.includes('/history/')) return 'history'
  return null
}

function stateSource(feature: VisualizationFeature): HTMLElement | null {
  if (feature === 'heatmap') return document.querySelector<HTMLElement>('.status-inline')
  if (feature === 'day-flow') return document.querySelector<HTMLElement>('.head-facts .fact:first-child')
  if (feature === 'battle-lines') return document.querySelector<HTMLElement>('[data-battle-status]')
  return document.querySelector<HTMLElement>('[data-history-state-pill]')
}

function readState(feature: VisualizationFeature, source: HTMLElement | null): { state: string; detail: string } {
  const stage = document.querySelector<HTMLElement>(stageSelector(feature))
  const stageText = stage?.textContent?.trim() ?? ''
  if (/loading|preparing|reading observed/i.test(stageText)) return { state: 'loading', detail: stageText }
  if (/unavailable|failed|error/i.test(stageText)) return { state: 'error', detail: stageText }
  if (/no observed|no retained|no connected|no comparable/i.test(stageText)) return { state: 'empty', detail: stageText }

  if (feature === 'heatmap') {
    const state = source?.dataset.heatmapState ?? source?.querySelector<HTMLElement>('.dot')?.dataset.heatmapState ?? source?.textContent ?? 'loading'
    return { state, detail: source?.textContent?.trim() ?? 'Reading the latest retained snapshot.' }
  }

  if (feature === 'day-flow') {
    const state = source?.querySelector<HTMLElement>('strong')?.textContent?.trim() ?? 'loading'
    const coverage = labeledValue('.data-strip__cell', 'Coverage')
    return { state, detail: coverage || `${state} Day Flow observations.` }
  }

  if (feature === 'battle-lines') {
    const state = source?.querySelector<HTMLElement>('strong')?.textContent?.trim() ?? source?.className ?? 'loading'
    const detail = source?.querySelector<HTMLElement>('span')?.textContent?.trim() ?? source?.textContent?.trim() ?? ''
    return { state, detail }
  }

  const state = source?.textContent?.trim() ?? 'loading'
  const feedback = document.querySelector<HTMLElement>('[data-history-feedback]')?.textContent?.trim() ?? ''
  return { state, detail: feedback || `${state} retained history.` }
}

function stageSelector(feature: VisualizationFeature): string {
  if (feature === 'heatmap') return '.heatmap-wrap'
  if (feature === 'day-flow') return '.dayflow-stage'
  if (feature === 'battle-lines') return '[data-battle-stage]'
  return '.history-stage'
}

function labeledValue(selector: string, label: string): string {
  const element = Array.from(document.querySelectorAll<HTMLElement>(selector))
    .find((candidate) => candidate.querySelector('small')?.textContent?.trim().toLowerCase() === label.toLowerCase())
  if (!element) return ''
  const labelNode = element.querySelector('small')
  return Array.from(element.childNodes)
    .filter((node) => node !== labelNode)
    .map((node) => node.textContent ?? '')
    .join('')
    .trim()
}

export {}
