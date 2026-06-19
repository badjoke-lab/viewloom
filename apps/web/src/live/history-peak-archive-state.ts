export type PeakArchiveEntry = {
  rank?: number
  day?: string
  timestamp?: string | null
  timestampPrecision?: 'minute' | 'day' | string
  peakViewers?: number
  streamerId?: string | null
  streamer?: string | null
  category?: string | null
  coverageState?: string
}

export type PeakArchiveDay = {
  day?: string
  peakTime?: string | null
  peakViewers?: number
  peakStreamerId?: string | null
  peakStreamerName?: string | null
  peakCategory?: string | null
  coverageState?: string
}

export type PeakArchivePayload = {
  peakArchive?: PeakArchiveEntry[]
  daily?: PeakArchiveDay[]
}

let currentPayload: PeakArchivePayload | null = null

export function installPeakArchivePayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as PeakArchivePayload
        onChange()
      } catch {
        currentPayload = null
        onChange()
      }
    }
    return response
  }) as typeof window.fetch
}

export function peakArchivePayload(): PeakArchivePayload | null {
  return currentPayload
}

export function peakArchiveEntries(payload: PeakArchivePayload): PeakArchiveEntry[] {
  const supplied = Array.isArray(payload.peakArchive) ? payload.peakArchive : []
  if (supplied.length) return supplied.slice(0, 30)

  const today = new Date().toISOString().slice(0, 10)
  return [...(payload.daily ?? [])]
    .filter((day) => validDay(day.day)
      && day.day! < today
      && day.coverageState !== 'missing'
      && number(day.peakViewers) > 0)
    .map((day) => ({
      day: day.day,
      timestamp: validTimestamp(day.peakTime, day.day) ? new Date(day.peakTime!).toISOString() : null,
      timestampPrecision: validTimestamp(day.peakTime, day.day) ? 'minute' : 'day',
      peakViewers: number(day.peakViewers),
      streamerId: day.peakStreamerId ?? null,
      streamer: day.peakStreamerName ?? null,
      category: day.peakCategory ?? null,
      coverageState: day.coverageState ?? 'partial',
    }))
    .sort((a, b) => number(b.peakViewers) - number(a.peakViewers) || String(b.day).localeCompare(String(a.day)))
    .slice(0, 30)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))
}

function validDay(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function validTimestamp(value: unknown, day: unknown): value is string {
  if (typeof value !== 'string' || !validDay(day)) return false
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}
