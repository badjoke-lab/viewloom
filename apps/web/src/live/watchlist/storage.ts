import {
  WATCHLIST_MAX_ENTRIES,
  WATCHLIST_REVISION,
  WATCHLIST_SCHEMA,
  addWatchlistEntry,
  clearWatchlistDocument,
  copyWatchlistDocument,
  createWatchlistDocument,
  currentIsoTimestamp,
  moveWatchlistEntry,
  normalizeIsoTimestamp,
  normalizeStoredChannelId,
  normalizeWatchlistDisplayName,
  removeWatchlistEntry,
  type WatchlistDocument,
  type WatchlistEntry,
  type WatchlistMoveDirection,
  type WatchlistMutationResult,
  type WatchlistOperationCode,
  type WatchlistProvider,
} from './model'

export type WatchlistStorageState =
  | 'ready'
  | 'repaired'
  | 'empty'
  | 'unavailable'
  | 'corrupted'
  | 'write_error'

export interface WatchlistStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface WatchlistStorageEventLike {
  key: string | null
  newValue: string | null
}

export type WatchlistReadResult =
  | {
      ok: true
      state: 'ready' | 'repaired' | 'empty' | 'write_error'
      document: WatchlistDocument
      repaired: boolean
      persisted: boolean
      code?: 'write-failed'
    }
  | {
      ok: false
      state: 'unavailable' | 'corrupted'
      code: 'storage-unavailable' | 'storage-corrupted'
      repaired: false
      persisted: false
    }

export type WatchlistStoredMutationResult =
  | {
      ok: true
      code: 'ok'
      document: WatchlistDocument
      changed: boolean
      entry?: WatchlistEntry
    }
  | {
      ok: false
      code: Exclude<WatchlistOperationCode, 'ok' | 'storage-corrupted' | 'confirmation-required'>
      document: WatchlistDocument
      changed: false
    }
  | {
      ok: false
      code: 'confirmation-required'
      document: WatchlistDocument
      changed: false
    }

export type WatchlistResetResult =
  | {
      ok: true
      code: 'ok'
      document: WatchlistDocument
      changed: true
    }
  | {
      ok: false
      code: 'confirmation-required' | 'storage-unavailable' | 'write-failed'
      changed: false
    }

export type WatchlistStorageEventResult =
  | { matched: false }
  | { matched: true; result: WatchlistReadResult }

interface ParsedWatchlistDocument {
  ok: true
  document: WatchlistDocument
  repaired: boolean
}

interface CorruptedWatchlistDocument {
  ok: false
  code: 'storage-corrupted'
}

export function watchlistStorageKey(provider: WatchlistProvider): string {
  return `viewloom.watchlist.${provider}.v1`
}

export function serializeWatchlistDocument(document: WatchlistDocument): string {
  return JSON.stringify(document)
}

export function parseWatchlistDocument(
  serialized: string,
  provider: WatchlistProvider,
): ParsedWatchlistDocument | CorruptedWatchlistDocument {
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    return { ok: false, code: 'storage-corrupted' }
  }

  if (!isRecord(parsed)
    || parsed.schema !== WATCHLIST_SCHEMA
    || parsed.provider !== provider
    || parsed.revision !== WATCHLIST_REVISION
    || !normalizeIsoTimestamp(parsed.updatedAt)
    || !Array.isArray(parsed.entries)) {
    return { ok: false, code: 'storage-corrupted' }
  }

  let repaired = false
  const entries: WatchlistEntry[] = []
  const seen = new Set<string>()

  for (const candidate of parsed.entries) {
    if (entries.length >= WATCHLIST_MAX_ENTRIES) {
      repaired = true
      continue
    }
    if (!isRecord(candidate)
      || typeof candidate.channelId !== 'string'
      || typeof candidate.displayName !== 'string'
      || !normalizeIsoTimestamp(candidate.addedAt)) {
      repaired = true
      continue
    }

    const channelId = normalizeStoredChannelId(candidate.channelId)
    if (!channelId || seen.has(channelId)) {
      repaired = true
      continue
    }

    const displayName = normalizeWatchlistDisplayName(candidate.displayName, channelId)
    if (channelId !== candidate.channelId || displayName !== candidate.displayName) {
      repaired = true
    }

    seen.add(channelId)
    entries.push({
      channelId,
      displayName,
      addedAt: candidate.addedAt,
    })
  }

  return {
    ok: true,
    repaired,
    document: {
      schema: WATCHLIST_SCHEMA,
      provider,
      revision: WATCHLIST_REVISION,
      updatedAt: parsed.updatedAt,
      entries,
    },
  }
}

export function readWatchlistStorage(
  storage: WatchlistStorageLike | null | undefined,
  provider: WatchlistProvider,
  now: Date | number | string = new Date(),
): WatchlistReadResult {
  if (!storage) {
    return unavailableReadResult()
  }

  let serialized: string | null
  try {
    serialized = storage.getItem(watchlistStorageKey(provider))
  } catch {
    return unavailableReadResult()
  }

  if (serialized === null) {
    return {
      ok: true,
      state: 'empty',
      document: createWatchlistDocument(provider, [], now),
      repaired: false,
      persisted: false,
    }
  }

  const parsed = parseWatchlistDocument(serialized, provider)
  if (!parsed.ok) {
    return {
      ok: false,
      state: 'corrupted',
      code: 'storage-corrupted',
      repaired: false,
      persisted: false,
    }
  }

  if (!parsed.repaired) {
    return {
      ok: true,
      state: parsed.document.entries.length === 0 ? 'empty' : 'ready',
      document: parsed.document,
      repaired: false,
      persisted: true,
    }
  }

  try {
    storage.setItem(watchlistStorageKey(provider), serializeWatchlistDocument(parsed.document))
    return {
      ok: true,
      state: 'repaired',
      document: parsed.document,
      repaired: true,
      persisted: true,
    }
  } catch {
    return {
      ok: true,
      state: 'write_error',
      code: 'write-failed',
      document: parsed.document,
      repaired: true,
      persisted: false,
    }
  }
}

export function readWatchlistStorageEvent(
  provider: WatchlistProvider,
  event: WatchlistStorageEventLike,
  now: Date | number | string = new Date(),
): WatchlistStorageEventResult {
  if (event.key !== watchlistStorageKey(provider)) return { matched: false }

  if (event.newValue === null) {
    return {
      matched: true,
      result: {
        ok: true,
        state: 'empty',
        document: createWatchlistDocument(provider, [], now),
        repaired: false,
        persisted: false,
      },
    }
  }

  const parsed = parseWatchlistDocument(event.newValue, provider)
  if (!parsed.ok) {
    return {
      matched: true,
      result: {
        ok: false,
        state: 'corrupted',
        code: 'storage-corrupted',
        repaired: false,
        persisted: false,
      },
    }
  }

  return {
    matched: true,
    result: {
      ok: true,
      state: parsed.repaired ? 'repaired' : parsed.document.entries.length === 0 ? 'empty' : 'ready',
      document: parsed.document,
      repaired: parsed.repaired,
      persisted: !parsed.repaired,
    },
  }
}

export function addStoredWatchlistEntry(
  storage: WatchlistStorageLike | null | undefined,
  document: WatchlistDocument,
  input: unknown,
  displayName: unknown = '',
  now: Date | number | string = new Date(),
): WatchlistStoredMutationResult {
  return persistMutation(storage, document, addWatchlistEntry(document, input, displayName, now))
}

export function removeStoredWatchlistEntry(
  storage: WatchlistStorageLike | null | undefined,
  document: WatchlistDocument,
  channelId: unknown,
  now: Date | number | string = new Date(),
): WatchlistStoredMutationResult {
  return persistMutation(storage, document, removeWatchlistEntry(document, channelId, now))
}

export function moveStoredWatchlistEntry(
  storage: WatchlistStorageLike | null | undefined,
  document: WatchlistDocument,
  channelId: unknown,
  direction: WatchlistMoveDirection,
  now: Date | number | string = new Date(),
): WatchlistStoredMutationResult {
  return persistMutation(storage, document, moveWatchlistEntry(document, channelId, direction, now))
}

export function clearStoredWatchlist(
  storage: WatchlistStorageLike | null | undefined,
  document: WatchlistDocument,
  confirmed: boolean,
  now: Date | number | string = new Date(),
): WatchlistStoredMutationResult {
  if (!confirmed) {
    return { ok: false, code: 'confirmation-required', document, changed: false }
  }
  if (!storage) {
    return { ok: false, code: 'storage-unavailable', document, changed: false }
  }

  try {
    storage.removeItem(watchlistStorageKey(document.provider))
  } catch {
    return { ok: false, code: 'write-failed', document, changed: false }
  }

  const cleared = clearWatchlistDocument(document, now)
  return {
    ok: true,
    code: 'ok',
    changed: true,
    document: cleared.changed ? cleared.document : createWatchlistDocument(document.provider, [], now),
  }
}

export function resetStoredWatchlist(
  storage: WatchlistStorageLike | null | undefined,
  provider: WatchlistProvider,
  confirmed: boolean,
  now: Date | number | string = new Date(),
): WatchlistResetResult {
  if (!confirmed) return { ok: false, code: 'confirmation-required', changed: false }
  if (!storage) return { ok: false, code: 'storage-unavailable', changed: false }

  try {
    storage.removeItem(watchlistStorageKey(provider))
  } catch {
    return { ok: false, code: 'write-failed', changed: false }
  }

  return {
    ok: true,
    code: 'ok',
    changed: true,
    document: createWatchlistDocument(provider, [], now),
  }
}

function persistMutation(
  storage: WatchlistStorageLike | null | undefined,
  originalDocument: WatchlistDocument,
  mutation: WatchlistMutationResult,
): WatchlistStoredMutationResult {
  if (!mutation.ok || !mutation.changed) return mutation
  if (!storage) {
    return {
      ok: false,
      code: 'storage-unavailable',
      document: originalDocument,
      changed: false,
    }
  }

  try {
    storage.setItem(
      watchlistStorageKey(mutation.document.provider),
      serializeWatchlistDocument(mutation.document),
    )
  } catch {
    return {
      ok: false,
      code: 'write-failed',
      document: copyWatchlistDocument(originalDocument),
      changed: false,
    }
  }

  return mutation
}

function unavailableReadResult(): WatchlistReadResult {
  return {
    ok: false,
    state: 'unavailable',
    code: 'storage-unavailable',
    repaired: false,
    persisted: false,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
