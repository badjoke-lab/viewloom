import './visualization-grammar.css'

export type VisualizationFeature = 'heatmap' | 'day-flow' | 'battle-lines' | 'history'
export type VisualizationState = 'loading' | 'fresh' | 'partial' | 'stale' | 'missing' | 'empty' | 'demo' | 'error' | 'unknown'

type MetricDefinition = {
  scale: string
  unit: string
  baseline: string
}

type FeatureDefinition = {
  title: string
  stageSelector: string
  anchorSelector: string
  metricSelector?: string
  defaultMetric: string
  metrics: Record<string, MetricDefinition>
  time: string
  selection: string
  detail: string
}

type VisualizationController = {
  updateMetric: (metric?: string | null) => void
  updateState: (state: string, detail?: string) => void
}

const definitions: Record<VisualizationFeature, FeatureDefinition> = {
  heatmap: {
    title: 'Current field',
    stageSelector: '.heatmap-wrap',
    anchorSelector: '.heatmap-control-dock',
    defaultMetric: 'field',
    metrics: {
      field: {
        scale: 'Area + color',
        unit: 'Tile area = viewers · color = momentum',
        baseline: 'Each tile is compared within the latest retained field.',
      },
    },
    time: 'Latest retained snapshot · five-minute collection cadence',
    selection: 'Select or focus one tile',
    detail: 'Selected stream inspector',
  },
  'day-flow': {
    title: 'Observed day terrain',
    stageSelector: '.dayflow-stage',
    anchorSelector: '.dayflow-toolbar',
    metricSelector: '[data-dayflow-metric]',
    defaultMetric: 'volume',
    metrics: {
      volume: {
        scale: 'Stack height',
        unit: 'Observed viewers',
        baseline: 'Zero baseline across the selected UTC window.',
      },
      share: {
        scale: 'Stack height',
        unit: 'Percent of selected scope',
        baseline: 'Zero to 100% within the selected scope.',
      },
    },
    time: 'UTC buckets across the selected day or rolling window',
    selection: 'Scrub time and select a stream band',
    detail: 'Time Focus + Selected streamer',
  },
  'battle-lines': {
    title: 'Observed rivalry timeline',
    stageSelector: '[data-battle-stage]',
    anchorSelector: '.battle-controls',
    metricSelector: '[data-battle-metric]',
    defaultMetric: 'viewers',
    metrics: {
      viewers: {
        scale: 'Line height',
        unit: 'Observed viewers',
        baseline: 'Zero baseline across the selected UTC range.',
      },
      indexed: {
        scale: 'Line height',
        unit: 'Index from 0 to 100',
        baseline: 'Each stream is indexed to its own window peak = 100.',
      },
    },
    time: 'UTC buckets across the selected range',
    selection: 'Click, drag, tap, or use arrow keys',
    detail: 'Time Inspector',
  },
  history: {
    title: 'Retained daily trend',
    stageSelector: '.history-stage',
    anchorSelector: '.history-controls',
    metricSelector: '[data-history-metric]',
    defaultMetric: 'viewer_minutes',
    metrics: {
      viewer_minutes: {
        scale: 'Bar height',
        unit: 'Viewer-minutes per UTC day',
        baseline: 'Zero baseline for completed-day rollups.',
      },
      peak_viewers: {
        scale: 'Bar height',
        unit: 'Peak observed viewers per UTC day',
        baseline: 'Zero baseline for daily peaks.',
      },
    },
    time: 'Completed UTC days in the selected period',
    selection: 'Select a bar with pointer, touch, Enter, or Space',
    detail: 'Selected day',
  },
}

const stateCopy: Record<VisualizationState, { label: string; detail: string; mark: string }> = {
  loading: { label: 'Loading', detail: 'Reading retained observations.', mark: '…' },
  fresh: { label: 'Observed', detail: 'Observed data is available for this view.', mark: '✓' },
  partial: { label: 'Partial', detail: 'Some expected observations are unavailable.', mark: '!' },
  stale: { label: 'Stale', detail: 'The latest retained data is older than the normal cadence.', mark: '⧖' },
  missing: { label: 'Missing', detail: 'Required observations are unavailable.', mark: '—' },
  empty: { label: 'Empty', detail: 'No observations exist for this window.', mark: '○' },
  demo: { label: 'Demo', detail: 'Demonstration data is separated from observed data.', mark: 'D' },
  error: { label: 'Error', detail: 'The visualization could not be loaded.', mark: '×' },
  unknown: { label: 'Unknown', detail: 'The data state is not classified.', mark: '?' },
}

export function installVisualizationGrammar(feature: VisualizationFeature): VisualizationController {
  const definition = definitions[feature]
  const main = document.querySelector<HTMLElement>('main')
  const stage = document.querySelector<HTMLElement>(definition.stageSelector)
  if (!main || !stage) return noOpController()

  main.dataset.visualizationFeature = feature
  document.body.dataset.visualizationFeature = feature

  const guide = ensureGuide(feature, definition)
  const guideId = guide.id
  const describedBy = new Set((stage.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean))
  describedBy.add(guideId)
  stage.setAttribute('aria-describedby', Array.from(describedBy).join(' '))
  stage.dataset.visualizationSurface = feature
  stage.dataset.visualizationState = 'loading'
  stage.setAttribute('aria-busy', 'true')
  if (!stage.hasAttribute('aria-label')) stage.setAttribute('aria-label', `${definition.title} visualization`)

  const updateMetric = (metric?: string | null) => {
    const key = metric && definition.metrics[metric] ? metric : activeMetric(definition) ?? definition.defaultMetric
    const metricDefinition = definition.metrics[key] ?? definition.metrics[definition.defaultMetric]
    stage.dataset.visualizationMetric = key
    setGuideText(guide, 'scale', metricDefinition.scale, `${metricDefinition.unit}. ${metricDefinition.baseline}`)
  }

  const updateState = (rawState: string, detail?: string) => {
    const state = normalizeVisualizationState(rawState)
    const copy = stateCopy[state]
    stage.dataset.visualizationState = state
    stage.setAttribute('aria-busy', String(state === 'loading'))
    guide.dataset.visualizationState = state
    const stateCell = guide.querySelector<HTMLElement>('[data-visualization-guide-cell="state"]')
    if (stateCell) {
      stateCell.dataset.state = state
      const mark = stateCell.querySelector<HTMLElement>('[data-visualization-state-mark]')
      if (mark) mark.textContent = copy.mark
    }
    setGuideText(guide, 'state', copy.label, detail?.trim() || copy.detail)
  }

  definition.metricSelector && document.querySelectorAll<HTMLButtonElement>(definition.metricSelector).forEach((button) => {
    button.addEventListener('click', () => window.requestAnimationFrame(() => updateMetric(metricValue(button))))
  })

  updateMetric()
  updateState('loading')
  return { updateMetric, updateState }
}

export function updateVisualizationMetric(feature: VisualizationFeature, metric?: string | null): void {
  const guide = document.querySelector<HTMLElement>(`[data-visualization-guide="${feature}"]`)
  const stage = document.querySelector<HTMLElement>(definitions[feature].stageSelector)
  if (!guide || !stage) return
  const definition = definitions[feature]
  const key = metric && definition.metrics[metric] ? metric : definition.defaultMetric
  const value = definition.metrics[key] ?? definition.metrics[definition.defaultMetric]
  stage.dataset.visualizationMetric = key
  setGuideText(guide, 'scale', value.scale, `${value.unit}. ${value.baseline}`)
}

export function updateVisualizationState(feature: VisualizationFeature, rawState: string, detail?: string): void {
  const guide = document.querySelector<HTMLElement>(`[data-visualization-guide="${feature}"]`)
  const stage = document.querySelector<HTMLElement>(definitions[feature].stageSelector)
  if (!guide || !stage) return
  const state = normalizeVisualizationState(rawState)
  const copy = stateCopy[state]
  stage.dataset.visualizationState = state
  stage.setAttribute('aria-busy', String(state === 'loading'))
  guide.dataset.visualizationState = state
  const stateCell = guide.querySelector<HTMLElement>('[data-visualization-guide-cell="state"]')
  if (stateCell) {
    stateCell.dataset.state = state
    const mark = stateCell.querySelector<HTMLElement>('[data-visualization-state-mark]')
    if (mark) mark.textContent = copy.mark
  }
  setGuideText(guide, 'state', copy.label, detail?.trim() || copy.detail)
}

export function normalizeVisualizationState(value: string): VisualizationState {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (['loading', 'pending', 'in_progress', 'refreshing'].includes(normalized)) return 'loading'
  if (['fresh', 'complete', 'completed', 'observed', 'ok', 'live', 'ready', 'available'].includes(normalized)) return 'fresh'
  if (['partial', 'limited', 'degraded'].includes(normalized)) return 'partial'
  if (['stale', 'delayed'].includes(normalized)) return 'stale'
  if (['missing', 'unavailable', 'not_observed', 'not_sampled'].includes(normalized)) return 'missing'
  if (['empty', 'no_data', 'none'].includes(normalized)) return 'empty'
  if (['demo', 'fixture', 'sample'].includes(normalized)) return 'demo'
  if (['error', 'failed', 'failure'].includes(normalized)) return 'error'
  return 'unknown'
}

function ensureGuide(feature: VisualizationFeature, definition: FeatureDefinition): HTMLElement {
  const existing = document.querySelector<HTMLElement>(`[data-visualization-guide="${feature}"]`)
  if (existing) return existing

  const guide = document.createElement('section')
  guide.id = `viewloom-${feature}-visualization-guide`
  guide.className = 'visualization-guide'
  guide.dataset.visualizationGuide = feature
  guide.dataset.visualizationState = 'loading'
  guide.setAttribute('aria-label', 'How to read this visualization')
  guide.innerHTML = `
    <div class="visualization-guide__intro">
      <small>READING GUIDE</small>
      <strong>${escapeHtml(definition.title)}</strong>
      <span>Scale, time, selection, detail, and data state use one shared ViewLoom grammar.</span>
    </div>
    <dl class="visualization-guide__cells">
      ${guideCell('scale', 'Scale', '—', 'Preparing metric and unit.')}
      ${guideCell('time', 'Time', 'UTC context', definition.time)}
      ${guideCell('selection', 'Selection', 'Inspect', definition.selection)}
      ${guideCell('detail', 'Detail', 'Exact values', definition.detail)}
      ${guideCell('state', 'State', 'Loading', stateCopy.loading.detail, true)}
    </dl>`

  const anchor = document.querySelector<HTMLElement>(definition.anchorSelector)
  if (anchor?.parentElement) anchor.insertAdjacentElement('afterend', guide)
  else document.querySelector<HTMLElement>('main')?.prepend(guide)
  return guide
}

function guideCell(key: string, label: string, value: string, detail: string, state = false): string {
  return `<div class="visualization-guide__cell" data-visualization-guide-cell="${key}">
    <dt>${escapeHtml(label)}</dt>
    <dd>${state ? '<i class="visualization-state-mark" data-visualization-state-mark aria-hidden="true">…</i>' : ''}<strong>${escapeHtml(value)}</strong><span>${escapeHtml(detail)}</span></dd>
  </div>`
}

function setGuideText(guide: HTMLElement, key: string, value: string, detail: string): void {
  const cell = guide.querySelector<HTMLElement>(`[data-visualization-guide-cell="${key}"]`)
  const strong = cell?.querySelector<HTMLElement>('strong')
  const span = cell?.querySelector<HTMLElement>('span')
  if (strong) strong.textContent = value
  if (span) span.textContent = detail
}

function activeMetric(definition: FeatureDefinition): string | null {
  if (!definition.metricSelector) return null
  const active = Array.from(document.querySelectorAll<HTMLButtonElement>(definition.metricSelector))
    .find((button) => button.getAttribute('aria-pressed') === 'true' || button.classList.contains('active'))
  return active ? metricValue(active) : null
}

function metricValue(button: HTMLButtonElement): string | null {
  return button.dataset.dayflowMetric ?? button.dataset.battleMetric ?? button.dataset.historyMetric ?? null
}

function noOpController(): VisualizationController {
  return { updateMetric: () => undefined, updateState: () => undefined }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
