const MODES = new Set(['country', 'city'])

export function normalizeStreamMapGeographyMode(value) {
  const mode = String(value ?? '').trim().toLowerCase()
  return MODES.has(mode) ? mode : 'country'
}

export function applyStreamMapGeographyMode(url, mode) {
  const next = new URL(String(url), 'https://viewloom.invalid')
  const normalized = normalizeStreamMapGeographyMode(mode)
  if (normalized === 'city') next.searchParams.set('geography', 'city')
  else next.searchParams.delete('geography')
  return `${next.pathname}${next.search}`
}

export function geographyModeLabel(mode) {
  return normalizeStreamMapGeographyMode(mode) === 'city' ? 'City' : 'Country'
}

export const STREAM_MAP_PUBLIC_GEOGRAPHY_MODES = Object.freeze(['country', 'city'])
export const STREAM_MAP_CURRENT_IRL_UI_ACTIVE = false
