import '../shared-data-state.css'

export type DataState =
  | 'loading'
  | 'fresh'
  | 'partial'
  | 'stale'
  | 'strong_stale'
  | 'empty'
  | 'demo'
  | 'error'
  | 'unconfigured'

const LABELS: Record<DataState, string> = {
  loading: 'Loading',
  fresh: 'Fresh',
  partial: 'Partial',
  stale: 'Stale',
  strong_stale: 'Strong stale',
  empty: 'Empty',
  demo: 'Demo',
  error: 'Error',
  unconfigured: 'Unconfigured',
}

const NOTES: Record<DataState, string> = {
  loading: 'The current data state is being checked.',
  fresh: 'Recent real observation data is available.',
  partial: 'The data is real, but the observed coverage is limited.',
  stale: 'Real data is available, but collection is delayed.',
  strong_stale: 'The latest successful collection is substantially delayed.',
  empty: 'The real pipeline is available, but no qualifying streams were observed.',
  demo: 'Demonstration data is shown instead of current observed data.',
  error: 'The current data request or collection path failed.',
  unconfigured: 'A required data binding or provider configuration is unavailable.',
}

export function normalizeDataState(value: unknown): DataState {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

  if (normalized === 'live' || normalized === 'ok' || normalized === 'real' || normalized === 'healthy') {
    return 'fresh'
  }

  if (normalized === 'strongstale' || normalized === 'strong_stale') return 'strong_stale'
  if (normalized === 'failing' || normalized === 'failed' || normalized === 'failure') return 'error'
  if (normalized === 'config_missing' || normalized === 'not_configured') return 'unconfigured'

  if (isDataState(normalized)) return normalized
  return 'loading'
}

export function getDataStateLabel(value: unknown): string {
  return LABELS[normalizeDataState(value)]
}

export function getDataStateNote(value: unknown): string {
  return NOTES[normalizeDataState(value)]
}

export function getDataStateAttribute(value: unknown): string {
  return normalizeDataState(value).replace('_', '-')
}

export function isObservedDataState(value: unknown): boolean {
  const state = normalizeDataState(value)
  return state === 'fresh' || state === 'partial' || state === 'stale' || state === 'strong_stale' || state === 'empty'
}

export function applyDataState(element: HTMLElement | null, value: unknown): DataState {
  const state = normalizeDataState(value)
  if (!element) return state

  element.dataset.state = getDataStateAttribute(state)
  element.setAttribute('aria-label', `Data state: ${LABELS[state]}`)
  return state
}

function isDataState(value: string): value is DataState {
  return value in LABELS
}
