import {
  normalizeStoredChannelId,
  type WatchlistEntry,
  type WatchlistPeriod,
  type WatchlistProvider,
} from './model'
import type {
  WatchlistLatestEvidence,
  WatchlistLatestSnapshot,
} from './latest-model'
import type {
  WatchlistHistorySnapshot,
  WatchlistRetainedEvidence,
} from './history-model'

export interface WatchlistCombinedEntry {
  stored: WatchlistEntry
  latest: WatchlistLatestEvidence
  retained: WatchlistRetainedEvidence
}

export interface WatchlistCombinedEvidence {
  provider: WatchlistProvider
  period: WatchlistPeriod
  latestSnapshot: WatchlistLatestSnapshot | null
  historySnapshot: WatchlistHistorySnapshot | null
  entries: WatchlistCombinedEntry[]
}

export function combineWatchlistEvidence(options: {
  provider: WatchlistProvider
  period: WatchlistPeriod
  entries: readonly WatchlistEntry[]
  latestEvidence: readonly WatchlistLatestEvidence[]
  retainedEvidence: readonly WatchlistRetainedEvidence[]
  latestSnapshot: WatchlistLatestSnapshot | null
  historySnapshot: WatchlistHistorySnapshot | null
}): WatchlistCombinedEvidence {
  const latestById = new Map(
    options.latestEvidence.map((evidence) => [evidence.channelId, evidence]),
  )
  const retainedById = new Map(
    options.retainedEvidence.map((evidence) => [evidence.channelId, evidence]),
  )
  const seen = new Set<string>()
  const entries: WatchlistCombinedEntry[] = []

  for (const stored of options.entries) {
    const channelId = normalizeStoredChannelId(stored.channelId)
    if (!channelId || seen.has(channelId)) continue
    seen.add(channelId)
    entries.push({
      stored: { ...stored, channelId },
      latest: latestById.get(channelId) ?? {
        channelId,
        state: 'latest_unavailable',
        item: null,
      },
      retained: retainedById.get(channelId) ?? {
        channelId,
        state: 'history_unavailable',
        item: null,
      },
    })
  }

  return {
    provider: options.provider,
    period: options.period,
    latestSnapshot: options.latestSnapshot,
    historySnapshot: options.historySnapshot,
    entries,
  }
}
