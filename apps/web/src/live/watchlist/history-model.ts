import {
  normalizeStoredChannelId,
  type WatchlistEntry,
  type WatchlistPeriod,
  type WatchlistProvider,
} from './model'

export const WATCHLIST_HISTORY_SCHEMA = 'viewloom-watchlist-history-v1' as const

export type WatchlistHistoryProviderState = 'ready' | 'partial' | 'empty' | 'error'

export type WatchlistRetainedEvidenceState =
  | 'present_retained'
  | 'absent_usable'
  | 'history_partial'
  | 'history_unavailable'

export type WatchlistHistoryErrorCode =
  | 'provider-mismatch'
  | 'period-mismatch'
  | 'metric-mismatch'
  | 'unreadable-payload'
  | 'request-failed'
  | 'http-error'
  | 'json-error'
  | null

export interface WatchlistHistoryDailyAppearance {
  day: string
  displayName: string
  viewerMinutes: number | null
  peakViewers: number | null
  averageViewers: number | null
  observedMinutes: number | null
  rankByViewerMinutes: number | null
  rankByPeak: number | null
}

export interface WatchlistRetainedItem {
  channelId: string
  displayName: string
  viewerMinutes: number | null
  peakViewers: number | null
  averageViewers: number | null
  observedMinutes: number | null
  rankByViewerMinutes: number | null
  rankByPeak: number | null
  dailyAppearanceCount: number
  mostRecentAppearance: string | null
  topSummaryPresent: boolean
  dailyAppearancePresent: boolean
}

export interface WatchlistHistorySnapshot {
  schema: typeof WATCHLIST_HISTORY_SCHEMA
  provider: WatchlistProvider
  period: WatchlistPeriod
  endpoint: string
  state: WatchlistHistoryProviderState
  usableForAbsence: boolean
  source: string | null
  metric: 'viewer_minutes'
  rawState: string | null
  requestedFrom: string | null
  requestedTo: string | null
  periodLabel: string | null
  coverageState: string | null
  coverageNote: string | null
  observedDays: number | null
  missingDays: number | null
  partialDays: number | null
  inProgressDays: number | null
  retainedById: ReadonlyMap<string, WatchlistRetainedItem>
  dailyAppearancesById: ReadonlyMap<string, readonly WatchlistHistoryDailyAppearance[]>
  itemCount: number
  errorCode: WatchlistHistoryErrorCode
  httpStatus: number | null
}

export interface WatchlistRetainedEvidence {
  channelId: string
  state: WatchlistRetainedEvidenceState
  item: WatchlistRetainedItem | null
}

export function watchlistHistoryEndpoint(
  provider: WatchlistProvider,
  period: WatchlistPeriod,
): string {
  const base = provider === 'kick' ? '/api/kick-history' : '/api/history'
  return `${base}?period=${period}&metric=viewer_minutes`
}

export function createUnavailableHistorySnapshot(
  provider: WatchlistProvider,
  period: WatchlistPeriod,
  errorCode: Exclude<WatchlistHistoryErrorCode, null>,
  httpStatus: number | null = null,
): WatchlistHistorySnapshot {
  return {
    schema: WATCHLIST_HISTORY_SCHEMA,
    provider,
    period,
    endpoint: watchlistHistoryEndpoint(provider, period),
    state: 'error',
    usableForAbsence: false,
    source: null,
    metric: 'viewer_minutes',
    rawState: null,
    requestedFrom: null,
    requestedTo: null,
    periodLabel: null,
    coverageState: null,
    coverageNote: null,
    observedDays: null,
    missingDays: null,
    partialDays: null,
    inProgressDays: null,
    retainedById: new Map<string, WatchlistRetainedItem>(),
    dailyAppearancesById: new Map<string, readonly WatchlistHistoryDailyAppearance[]>(),
    itemCount: 0,
    errorCode,
    httpStatus,
  }
}

export function retainedEvidenceForEntries(
  snapshot: WatchlistHistorySnapshot,
  entries: readonly WatchlistEntry[],
): WatchlistRetainedEvidence[] {
  return validHistoryEntryIds(entries).map((channelId): WatchlistRetainedEvidence => {
    const item = snapshot.retainedById.get(channelId) ?? null

    if (snapshot.state === 'partial') {
      return { channelId, state: 'history_partial', item }
    }
    if (snapshot.state !== 'ready') {
      return { channelId, state: 'history_unavailable', item: null }
    }
    return item
      ? { channelId, state: 'present_retained', item }
      : { channelId, state: 'absent_usable', item: null }
  })
}

export function unavailableRetainedEvidence(
  entries: readonly WatchlistEntry[],
): WatchlistRetainedEvidence[] {
  return validHistoryEntryIds(entries).map((channelId): WatchlistRetainedEvidence => ({
    channelId,
    state: 'history_unavailable',
    item: null,
  }))
}

export function validHistoryEntryIds(entries: readonly WatchlistEntry[]): string[] {
  const result: string[] = []
  const seen = new Set<string>()
  for (const entry of entries) {
    const channelId = normalizeStoredChannelId(entry.channelId)
    if (!channelId || seen.has(channelId)) continue
    seen.add(channelId)
    result.push(channelId)
  }
  return result
}
