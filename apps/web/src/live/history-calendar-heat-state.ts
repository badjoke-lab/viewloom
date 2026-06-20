export type HistoryCalendarMetric = 'viewer_minutes' | 'peak_viewers'

export type HistoryCalendarDay = {
  day?: string
  totalViewerMinutes?: number
  peakViewers?: number
  coverageState?: string
}

export type HistoryCalendarPayload = {
  metric?: HistoryCalendarMetric | string
  period?: { from?: string; to?: string; days?: number; label?: string }
  daily?: HistoryCalendarDay[]
}

export type HistoryCalendarCell = {
  day: string
  value: number | null
  coverageState: string
  observed: boolean
}

let currentPayload: HistoryCalendarPayload | null = null

export function installHistoryCalendarPayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as HistoryCalendarPayload
      } catch {
        currentPayload = null
      }
      onChange()
    }
    return response
  }) as typeof window.fetch
}

export function historyCalendarPayload(): HistoryCalendarPayload | null {
  return currentPayload
}

export function historyCalendarMetric(payload: HistoryCalendarPayload): HistoryCalendarMetric {
  return payload.metric === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
}

export function historyCalendarCells(payload: HistoryCalendarPayload): HistoryCalendarCell[] {
  const supplied = new Map<string, HistoryCalendarDay>()
  for (const day of payload.daily ?? []) {
    if (validDay(day.day)) supplied.set(day.day, day)
  }

  const suppliedDays = [...supplied.keys()].sort()
  const from = validDay(payload.period?.from) ? payload.period!.from! : suppliedDays[0]
  const to = validDay(payload.period?.to) ? payload.period!.to! : suppliedDays.at(-1)
  if (!from || !to || from > to) return []

  const metric = historyCalendarMetric(payload)
  return utcDays(from, to, 186).map((day): HistoryCalendarCell => {
    const source = supplied.get(day)
    if (!source) return { day, value: null, coverageState: 'missing', observed: false }

    const coverageState = normalizeCoverage(source.coverageState)
    const observed = coverageState !== 'missing'
    return {
      day,
      value: observed
        ? metric === 'peak_viewers'
          ? finite(source.peakViewers)
          : finite(source.totalViewerMinutes)
        : null,
      coverageState,
      observed,
    }
  })
}

function utcDays(from: string, to: string, limit: number): string[] {
  const result: string[] = []
  const cursor = new Date(`${from}T00:00:00.000Z`)
  const end = new Date(`${to}T00:00:00.000Z`)
  while (cursor <= end && result.length < limit) {
    result.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return result
}

function normalizeCoverage(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : 'partial'
}

function validDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function finite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}
