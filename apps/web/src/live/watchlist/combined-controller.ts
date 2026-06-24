import type {
  WatchlistEntry,
  WatchlistPeriod,
  WatchlistProvider,
} from './model'
import {
  createWatchlistLatestController,
  type WatchlistLatestLoadSource,
  type WatchlistLatestRequest,
} from './latest-controller'
import {
  createWatchlistHistoryController,
  type WatchlistHistoryLoadSource,
  type WatchlistHistoryRequest,
} from './history-controller'
import { combineWatchlistEvidence, type WatchlistCombinedEvidence } from './combined-model'

export type WatchlistCombinedAction =
  | 'initial_load'
  | 'period_change'
  | 'refresh'
  | 'task_local'

export type WatchlistCombinedMemorySource = 'memory_only'

export interface WatchlistCombinedLoadResult {
  action: WatchlistCombinedAction
  evidence: WatchlistCombinedEvidence
  latestSource: WatchlistLatestLoadSource | WatchlistCombinedMemorySource
  historySource: WatchlistHistoryLoadSource | WatchlistCombinedMemorySource
  latestRequested: boolean
  historyRequested: boolean
}

export interface WatchlistCombinedController {
  initialLoad(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): Promise<WatchlistCombinedLoadResult>
  changePeriod(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): Promise<WatchlistCombinedLoadResult>
  refresh(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): Promise<WatchlistCombinedLoadResult>
  taskLocal(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): WatchlistCombinedLoadResult
}

export function createWatchlistCombinedController(options: {
  provider: WatchlistProvider
  latestRequest: WatchlistLatestRequest
  historyRequest: WatchlistHistoryRequest
}): WatchlistCombinedController {
  const latest = createWatchlistLatestController({
    provider: options.provider,
    request: options.latestRequest,
  })
  const history = createWatchlistHistoryController({
    provider: options.provider,
    request: options.historyRequest,
  })

  return {
    async initialLoad(entries, period) {
      const [latestResult, historyResult] = await Promise.all([
        latest.load(entries),
        history.load(entries, period),
      ])
      return result(
        'initial_load',
        entries,
        period,
        latestResult.source,
        historyResult.source,
        latestResult.requested,
        historyResult.requested,
      )
    },

    async changePeriod(entries, period) {
      const historyResult = await history.load(entries, period)
      return result(
        'period_change',
        entries,
        period,
        latest.getSnapshot() ? 'cache' : 'memory_only',
        historyResult.source,
        false,
        historyResult.requested,
      )
    },

    async refresh(entries, period) {
      const [latestResult, historyResult] = await Promise.all([
        latest.refresh(entries),
        history.refresh(entries, period),
      ])
      return result(
        'refresh',
        entries,
        period,
        latestResult.source,
        historyResult.source,
        latestResult.requested,
        historyResult.requested,
      )
    },

    taskLocal(entries, period) {
      return result(
        'task_local',
        entries,
        period,
        'memory_only',
        'memory_only',
        false,
        false,
      )
    },
  }

  function result(
    action: WatchlistCombinedAction,
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
    latestSource: WatchlistCombinedLoadResult['latestSource'],
    historySource: WatchlistCombinedLoadResult['historySource'],
    latestRequested: boolean,
    historyRequested: boolean,
  ): WatchlistCombinedLoadResult {
    return {
      action,
      latestSource,
      historySource,
      latestRequested,
      historyRequested,
      evidence: combineWatchlistEvidence({
        provider: options.provider,
        period,
        entries,
        latestEvidence: latest.evidence(entries),
        retainedEvidence: history.evidence(entries, period),
        latestSnapshot: latest.getSnapshot(),
        historySnapshot: history.getSnapshot(period),
      }),
    }
  }
}
