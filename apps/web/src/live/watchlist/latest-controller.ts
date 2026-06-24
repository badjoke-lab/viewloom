import type { WatchlistEntry, WatchlistProvider } from './model'
import {
  createUnavailableLatestSnapshot,
  latestEvidenceForEntries,
  unavailableLatestEvidence,
  validEntryIds,
  watchlistLatestEndpoint,
  type WatchlistLatestEvidence,
  type WatchlistLatestSnapshot,
} from './latest-model'
import { normalizeProviderHeatmapResponse } from './latest-adapter'

export interface WatchlistLatestResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export interface WatchlistLatestRequestInit {
  headers: Readonly<Record<string, string>>
  cache: 'no-store'
}

export type WatchlistLatestRequest = (
  endpoint: string,
  init: WatchlistLatestRequestInit,
) => Promise<WatchlistLatestResponseLike>

export type WatchlistLatestLoadSource =
  | 'skipped_empty'
  | 'network'
  | 'cache'
  | 'in_flight'

export interface WatchlistLatestLoadResult {
  provider: WatchlistProvider
  endpoint: string
  source: WatchlistLatestLoadSource
  requested: boolean
  snapshot: WatchlistLatestSnapshot | null
  evidence: WatchlistLatestEvidence[]
}

export interface WatchlistLatestController {
  load(entries: readonly WatchlistEntry[]): Promise<WatchlistLatestLoadResult>
  refresh(entries: readonly WatchlistEntry[]): Promise<WatchlistLatestLoadResult>
  evidence(entries: readonly WatchlistEntry[]): WatchlistLatestEvidence[]
  getSnapshot(): WatchlistLatestSnapshot | null
}

export function createWatchlistLatestController(options: {
  provider: WatchlistProvider
  request: WatchlistLatestRequest
}): WatchlistLatestController {
  const endpoint = watchlistLatestEndpoint(options.provider)
  let snapshot: WatchlistLatestSnapshot | null = null
  let inFlight: Promise<WatchlistLatestSnapshot> | null = null

  async function resolve(
    entries: readonly WatchlistEntry[],
    force: boolean,
  ): Promise<WatchlistLatestLoadResult> {
    if (validEntryIds(entries).length === 0) {
      return {
        provider: options.provider,
        endpoint,
        source: 'skipped_empty',
        requested: false,
        snapshot: null,
        evidence: [],
      }
    }

    const resolved = await ensureSnapshot(force)
    return {
      provider: options.provider,
      endpoint,
      source: resolved.source,
      requested: resolved.source === 'network',
      snapshot: resolved.snapshot,
      evidence: latestEvidenceForEntries(resolved.snapshot, entries),
    }
  }

  async function ensureSnapshot(force: boolean): Promise<{
    snapshot: WatchlistLatestSnapshot
    source: Exclude<WatchlistLatestLoadSource, 'skipped_empty'>
  }> {
    if (!force && snapshot) {
      return { snapshot, source: 'cache' }
    }
    if (inFlight) {
      return { snapshot: await inFlight, source: 'in_flight' }
    }

    const active = requestSnapshot(options.provider, endpoint, options.request)
    inFlight = active
    try {
      snapshot = await active
      return { snapshot, source: 'network' }
    } finally {
      if (inFlight === active) inFlight = null
    }
  }

  return {
    load(entries) {
      return resolve(entries, false)
    },
    refresh(entries) {
      return resolve(entries, true)
    },
    evidence(entries) {
      return snapshot
        ? latestEvidenceForEntries(snapshot, entries)
        : unavailableLatestEvidence(entries)
    },
    getSnapshot() {
      return snapshot
    },
  }
}

async function requestSnapshot(
  provider: WatchlistProvider,
  endpoint: string,
  request: WatchlistLatestRequest,
): Promise<WatchlistLatestSnapshot> {
  let response: WatchlistLatestResponseLike
  try {
    response = await request(endpoint, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
  } catch {
    return createUnavailableLatestSnapshot(provider, 'request-failed')
  }

  if (!response.ok) {
    return createUnavailableLatestSnapshot(provider, 'http-error', finiteStatus(response.status))
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    return createUnavailableLatestSnapshot(provider, 'json-error', finiteStatus(response.status))
  }

  const normalized = normalizeProviderHeatmapResponse(provider, payload)
  return normalized.httpStatus === null
    ? { ...normalized, httpStatus: finiteStatus(response.status) }
    : normalized
}

function finiteStatus(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null
}
