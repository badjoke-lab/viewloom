import {
  normalizeStoredChannelId,
  type WatchlistEntry,
  type WatchlistProvider,
} from './model'

export const WATCHLIST_LATEST_SCHEMA = 'viewloom-watchlist-latest-v1' as const

export type WatchlistLatestProviderState =
  | 'live'
  | 'partial'
  | 'stale'
  | 'empty'
  | 'error'

export type WatchlistLatestFreshness = 'fresh' | 'stale' | 'unavailable'

export type WatchlistLatestEvidenceState =
  | 'present_fresh'
  | 'present_stale'
  | 'absent_usable'
  | 'latest_unavailable'

export type WatchlistLatestErrorCode =
  | 'provider-mismatch'
  | 'unreadable-payload'
  | 'request-failed'
  | 'http-error'
  | 'json-error'
  | null

export interface WatchlistLatestItem {
  channelId: string
  displayName: string
  viewers: number | null
  title: string | null
  momentum: number | null
  url: string | null
  startedAt: string | null
}

export interface WatchlistLatestSnapshot {
  schema: typeof WATCHLIST_LATEST_SCHEMA
  provider: WatchlistProvider
  endpoint: string
  state: WatchlistLatestProviderState
  freshness: WatchlistLatestFreshness
  usableForAbsence: boolean
  source: string | null
  targetSource: string | null
  updatedAt: string | null
  coverageMode: string | null
  coverageNote: string | null
  rawState: string | null
  itemCount: number
  itemsById: ReadonlyMap<string, WatchlistLatestItem>
  errorCode: WatchlistLatestErrorCode
  httpStatus: number | null
}

export interface WatchlistLatestEvidence {
  channelId: string
  state: WatchlistLatestEvidenceState
  item: WatchlistLatestItem | null
}

export function watchlistLatestEndpoint(provider: WatchlistProvider): string {
  return provider === 'kick' ? '/api/kick-heatmap' : '/api/twitch-heatmap'
}

export function createUnavailableLatestSnapshot(
  provider: WatchlistProvider,
  errorCode: Exclude<WatchlistLatestErrorCode, null>,
  httpStatus: number | null = null,
): WatchlistLatestSnapshot {
  return {
    schema: WATCHLIST_LATEST_SCHEMA,
    provider,
    endpoint: watchlistLatestEndpoint(provider),
    state: 'error',
    freshness: 'unavailable',
    usableForAbsence: false,
    source: null,
    targetSource: null,
    updatedAt: null,
    coverageMode: null,
    coverageNote: null,
    rawState: null,
    itemCount: 0,
    itemsById: new Map<string, WatchlistLatestItem>(),
    errorCode,
    httpStatus,
  }
}

export function latestSnapshotIsUsable(snapshot: WatchlistLatestSnapshot): boolean {
  return snapshot.state === 'live'
    || snapshot.state === 'partial'
    || snapshot.state === 'stale'
}

export function latestEvidenceForEntries(
  snapshot: WatchlistLatestSnapshot,
  entries: readonly WatchlistEntry[],
): WatchlistLatestEvidence[] {
  return validEntryIds(entries).map((channelId) => {
    const item = snapshot.itemsById.get(channelId) ?? null

    if (!latestSnapshotIsUsable(snapshot)) {
      return { channelId, state: 'latest_unavailable', item: null }
    }
    if (!item) {
      return { channelId, state: 'absent_usable', item: null }
    }
    return {
      channelId,
      state: snapshot.freshness === 'stale' ? 'present_stale' : 'present_fresh',
      item,
    }
  })
}

export function unavailableLatestEvidence(
  entries: readonly WatchlistEntry[],
): WatchlistLatestEvidence[] {
  return validEntryIds(entries).map((channelId) => ({
    channelId,
    state: 'latest_unavailable',
    item: null,
  }))
}

export function validEntryIds(entries: readonly WatchlistEntry[]): string[] {
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
