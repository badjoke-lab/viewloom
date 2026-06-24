import type {
  WatchlistEntry,
  WatchlistPeriod,
  WatchlistProvider,
} from './model'
import {
  createUnavailableHistorySnapshot,
  retainedEvidenceForEntries,
  unavailableRetainedEvidence,
  validHistoryEntryIds,
  watchlistHistoryEndpoint,
  type WatchlistHistorySnapshot,
  type WatchlistRetainedEvidence,
} from './history-model'
import { normalizeProviderHistoryResponse } from './history-adapter'

export interface WatchlistHistoryResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface WatchlistHistoryRequestInit {
  headers: Readonly<Record<string, string>>
  cache: 'no-store'
}

export type WatchlistHistoryRequest = (
  endpoint: string,
  init: WatchlistHistoryRequestInit,
) => Promise<WatchlistHistoryResponseLike>

export type WatchlistHistoryLoadSource =
  | 'skipped_empty'
  | 'network'
  | 'cache'
  | 'in_flight'

export interface WatchlistHistoryLoadResult {
  provider: WatchlistProvider
  period: WatchlistPeriod
  endpoint: string
  source: WatchlistHistoryLoadSource
  requested: boolean
  snapshot: WatchlistHistorySnapshot | null
  evidence: WatchlistRetainedEvidence[]
}

export interface WatchlistHistoryController {
  load(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): Promise<WatchlistHistoryLoadResult>
  refresh(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): Promise<WatchlistHistoryLoadResult>
  evidence(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
  ): WatchlistRetainedEvidence[]
  getSnapshot(period: WatchlistPeriod): WatchlistHistorySnapshot | null
  hasSnapshot(period: WatchlistPeriod): boolean
}

export function createWatchlistHistoryController(options: {
  provider: WatchlistProvider
  request: WatchlistHistoryRequest
}): WatchlistHistoryController {
  const snapshots = new Map<WatchlistPeriod, WatchlistHistorySnapshot>()
  const inFlight = new Map<WatchlistPeriod, Promise<WatchlistHistorySnapshot>>()

  async function resolve(
    entries: readonly WatchlistEntry[],
    period: WatchlistPeriod,
    force: boolean,
  ): Promise<WatchlistHistoryLoadResult> {
    const endpoint = watchlistHistoryEndpoint(options.provider, period)
    if (validHistoryEntryIds(entries).length === 0) {
      return {
        provider: options.provider,
        period,
        endpoint,
        source: 'skipped_empty',
        requested: false,
        snapshot: null,
        evidence: [],
      }
    }

    const resolved = await ensureSnapshot(period, force)
    return {
      provider: options.provider,
      period,
      endpoint,
      source: resolved.source,
      requested: resolved.source === 'network',
      snapshot: resolved.snapshot,
      evidence: retainedEvidenceForEntries(resolved.snapshot, entries),
    }
  }

  async function ensureSnapshot(
    period: WatchlistPeriod,
    force: boolean,
  ): Promise<{
    snapshot: WatchlistHistorySnapshot
    source: Exclude<WatchlistHistoryLoadSource, 'skipped_empty'>
  }> {
    const cached = snapshots.get(period)
    if (!force && cached) return { snapshot: cached, source: 'cache' }

    const active = inFlight.get(period)
    if (active) return { snapshot: await active, source: 'in_flight' }

    const request = requestSnapshot(options.provider, period, options.request)
    inFlight.set(period, request)
    try {
      const snapshot = await request
      snapshots.set(period, snapshot)
      return { snapshot, source: 'network' }
    } finally {
      if (inFlight.get(period) === request) inFlight.delete(period)
    }
  }

  return {
    load(entries, period) {
      return resolve(entries, period, false)
    },
    refresh(entries, period) {
      return resolve(entries, period, true)
    },
    evidence(entries, period) {
      const snapshot = snapshots.get(period)
      return snapshot
        ? retainedEvidenceForEntries(snapshot, entries)
        : unavailableRetainedEvidence(entries)
    },
    getSnapshot(period) {
      return snapshots.get(period) ?? null
    },
    hasSnapshot(period) {
      return snapshots.has(period)
    },
  }
}

async function requestSnapshot(
  provider: WatchlistProvider,
  period: WatchlistPeriod,
  request: WatchlistHistoryRequest,
): Promise<WatchlistHistorySnapshot> {
  const endpoint = watchlistHistoryEndpoint(provider, period)
  let response: WatchlistHistoryResponseLike
  try {
    response = await request(endpoint, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return createUnavailableHistorySnapshot(provider, period, 'request-failed')
  }

  if (!response.ok) {
    return createUnavailableHistorySnapshot(
      provider,
      period,
      'http-error',
      finiteStatus(response.status),
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return createUnavailableHistorySnapshot(
      provider,
      period,
      'json-error',
      finiteStatus(response.status),
    )
  }

  const normalized = normalizeProviderHistoryResponse(provider, period, payload)
  return normalized.httpStatus === null
    ? { ...normalized, httpStatus: finiteStatus(response.status) }
    : normalized
}

function finiteStatus(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null
}
