export const PUBLIC_DATA_STATES = [
  'fresh',
  'partial',
  'stale',
  'empty',
  'demo',
  'error',
] as const

export type PublicDataState = (typeof PUBLIC_DATA_STATES)[number]

export const STATUS_ONLY_STATES = [
  'strong_stale',
  'failing',
  'unconfigured',
  'not_ready',
] as const

export type StatusOnlyState = (typeof STATUS_ONLY_STATES)[number]
export type StatusDataState = PublicDataState | StatusOnlyState

export function normalizeFeatureState(state: string | null | undefined, sourceMode?: string | null): PublicDataState {
  const normalizedState = String(state ?? '').trim().toLowerCase()
  const normalizedSource = String(sourceMode ?? '').trim().toLowerCase()

  if (normalizedSource === 'demo' || normalizedSource === 'fixture') return 'demo'

  if (normalizedState === 'fresh' || normalizedState === 'live' || normalizedState === 'ok' || normalizedState === 'good') return 'fresh'
  if (normalizedState === 'partial' || normalizedState === 'poor') return 'partial'
  if (normalizedState === 'stale' || normalizedState === 'strong_stale') return 'stale'
  if (normalizedState === 'empty' || normalizedState === 'not_ready') return 'empty'
  if (normalizedState === 'demo' || normalizedState === 'fixture') return 'demo'
  if (normalizedState === 'error' || normalizedState === 'failing' || normalizedState === 'unconfigured' || normalizedState === 'unavailable' || normalizedState === 'unknown') return 'error'

  return 'error'
}

export function isPublicDataState(value: string): value is PublicDataState {
  return (PUBLIC_DATA_STATES as readonly string[]).includes(value)
}

export function isStatusDataState(value: string): value is StatusDataState {
  return isPublicDataState(value) || (STATUS_ONLY_STATES as readonly string[]).includes(value)
}
