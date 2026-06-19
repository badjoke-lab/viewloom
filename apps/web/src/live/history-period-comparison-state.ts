export type PeriodComparisonChange = {
  absolute?: number
  pct?: number | null
}

export type PeriodComparisonSide = {
  requestedFrom?: string
  requestedTo?: string
  from?: string | null
  to?: string | null
  selectedDays?: number
  totalViewerMinutes?: number
  peakViewers?: number
  averageViewers?: number
  observedMinutes?: number
  coverageState?: string
}

export type PeriodComparison = {
  state?: 'comparable' | 'partial' | 'unavailable' | string
  scope?: string
  provider?: string
  providerSeparated?: boolean
  inProgressDayExcluded?: boolean
  alignedDayCount?: boolean
  reason?: string
  current?: PeriodComparisonSide
  previous?: PeriodComparisonSide
  changes?: {
    totalViewerMinutes?: PeriodComparisonChange
    peakViewers?: PeriodComparisonChange
    averageViewers?: PeriodComparisonChange
  } | null
}

export type PeriodComparisonPayload = {
  periodComparison?: PeriodComparison | null
  comparison?: { period?: PeriodComparison | null }
}

let currentPayload: PeriodComparisonPayload | null = null

export function installPeriodComparisonPayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as PeriodComparisonPayload
        onChange()
      } catch {
        currentPayload = null
        onChange()
      }
    }
    return response
  }) as typeof window.fetch
}

export function periodComparisonPayload(): PeriodComparisonPayload | null {
  return currentPayload
}

export function periodComparisonFromPayload(payload: PeriodComparisonPayload): PeriodComparison | null {
  return payload.periodComparison ?? payload.comparison?.period ?? null
}
