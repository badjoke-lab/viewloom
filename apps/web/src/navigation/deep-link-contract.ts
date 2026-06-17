export type DeepLinkFeature = 'dayFlow' | 'battleLines'

export const DEEP_LINK_PARAMETER_ORDER = {
  dayFlow: ['metric', 'scope', 'top', 'bucket', 'rangeMode', 'date', 'time', 'streamer', 'auto'],
  battleLines: ['metric', 'top', 'bucket', 'range', 'date', 'battle', 'stream', 'time'],
} as const

export const LEGACY_DEEP_LINK_PARAMETERS = {
  dayFlow: [] as readonly string[],
  battleLines: ['point'] as const,
} as const

export function normalizeDeepLinkParams(feature: DeepLinkFeature, input: URLSearchParams | Record<string, unknown>): URLSearchParams {
  const source = input instanceof URLSearchParams ? input : recordToParams(input)
  const output = new URLSearchParams()
  for (const key of DEEP_LINK_PARAMETER_ORDER[feature]) {
    const value = normalizeValue(feature, key, source.get(key))
    if (value !== null) output.set(key, value)
  }
  return output
}

export function buildDeepLink(pathname: string, feature: DeepLinkFeature, input: URLSearchParams | Record<string, unknown>): string {
  const normalizedPath = normalizePathname(pathname)
  const params = normalizeDeepLinkParams(feature, input)
  return `${normalizedPath}${params.size > 0 ? `?${params.toString()}` : ''}`
}

export function readLegacyBattlePoint(input: URLSearchParams): number | null {
  const value = input.get('point')
  if (value === null || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function normalizeValue(feature: DeepLinkFeature, key: string, value: string | null): string | null {
  if (value === null || value === '') return null

  if (feature === 'dayFlow') {
    if (key === 'metric') return oneOf(value, ['volume', 'share'])
    if (key === 'scope') return oneOf(value, ['full', 'topFocus'])
    if (key === 'top') return oneOf(value, ['10', '20', '50'])
    if (key === 'bucket') return oneOf(value, ['5', '10'])
    if (key === 'rangeMode') return oneOf(value, ['today', 'rolling24h', 'yesterday', 'date'])
    if (key === 'date') return validDate(value)
    if (key === 'time') return validInstant(value)
    if (key === 'streamer') return safeIdentifier(value)
    if (key === 'auto') return oneOf(value, ['on', 'off'])
  }

  if (feature === 'battleLines') {
    if (key === 'metric') return oneOf(value, ['viewers', 'indexed'])
    if (key === 'top') return oneOf(value, ['3', '5', '10'])
    if (key === 'bucket') return oneOf(value, ['5m', '10m'])
    if (key === 'range') return oneOf(value, ['today', 'yesterday', 'date'])
    if (key === 'date') return validDate(value)
    if (key === 'battle' || key === 'stream') return safeIdentifier(value)
    if (key === 'time') return validInstant(value)
  }

  return null
}

function normalizePathname(pathname: string): string {
  const raw = String(pathname || '/').split(/[?#]/, 1)[0] || '/'
  const leading = raw.startsWith('/') ? raw : `/${raw}`
  const collapsed = leading.replace(/\/{2,}/g, '/')
  return collapsed === '/' || collapsed.endsWith('/') ? collapsed : `${collapsed}/`
}

function recordToParams(input: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) if (value !== null && value !== undefined) params.set(key, String(value))
  return params
}

function oneOf<T extends string>(value: string, allowed: readonly T[]): T | null {
  return allowed.includes(value as T) ? value as T : null
}

function validDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value
}

function validInstant(value: string): string | null {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function safeIdentifier(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 180 && /^[A-Za-z0-9_.:@-]+$/.test(trimmed) ? trimmed : null
}
