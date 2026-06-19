export type HistoryBattleArchiveEntry = {
  id?: string
  rank?: number
  day?: string
  timestamp?: string | null
  timestampPrecision?: 'minute' | 'day' | string
  type?: 'reversal' | 'close_battle' | 'fastest_challenger' | 'heated_battle' | string
  battleId?: string
  streamerAId?: string
  streamerBId?: string
  streamerA?: string
  streamerB?: string
  title?: string
  summary?: string
  gapBefore?: number | null
  gapAfter?: number | null
  delta?: number | null
  score?: number
  reversalCount?: number
  overlapCount?: number
  coverageState?: string
}

export type HistoryBattleArchiveMeta = {
  state?: string
  provider?: string
  sourcePopulation?: string
  limit?: number
  scopeDays?: number
  from?: string
  to?: string
  queriedRows?: number
  exactTimestampCount?: number
  reversalCount?: number
}

type HistoryBattleArchivePayload = {
  battleArchive?: HistoryBattleArchiveEntry[]
  battleArchiveMeta?: HistoryBattleArchiveMeta
}

let currentPayload: HistoryBattleArchivePayload | null = null

export function installBattleArchivePayloadCapture(onChange: () => void): void {
  const originalFetch = window.fetch.bind(window)
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init)
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin)
    if (url.pathname === '/api/history' || url.pathname === '/api/kick-history') {
      try {
        currentPayload = await response.clone().json() as HistoryBattleArchivePayload
        onChange()
      } catch {
        currentPayload = null
        onChange()
      }
    }
    return response
  }) as typeof window.fetch
}

export function battleArchivePayload(): HistoryBattleArchivePayload | null {
  return currentPayload
}

export function battleArchiveEntries(payload: HistoryBattleArchivePayload): HistoryBattleArchiveEntry[] {
  return Array.isArray(payload.battleArchive) ? payload.battleArchive.slice(0, 30) : []
}
