export const WATCHLIST_SCHEMA = 'viewloom-watchlist-v1' as const
export const WATCHLIST_REVISION = 1 as const
export const WATCHLIST_MAX_ENTRIES = 50 as const
export const WATCHLIST_INITIAL_VISIBLE_ENTRIES = 12 as const

export type WatchlistProvider = 'twitch' | 'kick'
export type WatchlistPeriod = '7d' | '30d'
export type WatchlistMoveDirection = 'up' | 'down'

export type WatchlistOperationCode =
  | 'ok'
  | 'invalid-id'
  | 'wrong-provider-url'
  | 'already-saved'
  | 'limit-reached'
  | 'not-found'
  | 'storage-unavailable'
  | 'storage-corrupted'
  | 'write-failed'
  | 'confirmation-required'

export interface WatchlistEntry {
  channelId: string
  displayName: string
  addedAt: string
}

export interface WatchlistDocument {
  schema: typeof WATCHLIST_SCHEMA
  provider: WatchlistProvider
  revision: typeof WATCHLIST_REVISION
  updatedAt: string
  entries: WatchlistEntry[]
}

export type WatchlistChannelInputResult =
  | { ok: true; channelId: string }
  | { ok: false; code: 'invalid-id' | 'wrong-provider-url' }

export type WatchlistMutationResult =
  | {
      ok: true
      code: 'ok'
      document: WatchlistDocument
      changed: boolean
      entry?: WatchlistEntry
    }
  | {
      ok: false
      code: Exclude<WatchlistOperationCode, 'ok' | 'storage-unavailable' | 'storage-corrupted' | 'write-failed' | 'confirmation-required'>
      document: WatchlistDocument
      changed: false
    }

const CHANNEL_ID_PATTERN = /^(?=.{1,64}$)[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/g

const PROVIDER_HOSTS: Record<WatchlistProvider, ReadonlySet<string>> = {
  twitch: new Set(['twitch.tv', 'www.twitch.tv']),
  kick: new Set(['kick.com', 'www.kick.com']),
}

export function isWatchlistProvider(value: unknown): value is WatchlistProvider {
  return value === 'twitch' || value === 'kick'
}

export function isWatchlistPeriod(value: unknown): value is WatchlistPeriod {
  return value === '7d' || value === '30d'
}

export function normalizeStoredChannelId(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().toLowerCase()
  return CHANNEL_ID_PATTERN.test(normalized) ? normalized : ''
}

export function normalizeWatchlistChannelInput(
  value: unknown,
  provider: WatchlistProvider,
): WatchlistChannelInputResult {
  if (typeof value !== 'string') return { ok: false, code: 'invalid-id' }
  const raw = value.trim()
  if (!raw) return { ok: false, code: 'invalid-id' }

  if (!looksLikeProviderUrl(raw)) {
    const channelId = normalizeStoredChannelId(raw)
    return channelId
      ? { ok: true, channelId }
      : { ok: false, code: 'invalid-id' }
  }

  let parsed: URL
  try {
    parsed = new URL(hasScheme(raw) ? raw : `https://${raw}`)
  } catch {
    return { ok: false, code: 'invalid-id' }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, code: 'invalid-id' }
  }
  if (parsed.username || parsed.password || parsed.port) {
    return { ok: false, code: 'invalid-id' }
  }

  const hostname = parsed.hostname.toLowerCase()
  const urlProvider = providerForHostname(hostname)
  if (!urlProvider) return { ok: false, code: 'invalid-id' }
  if (urlProvider !== provider) return { ok: false, code: 'wrong-provider-url' }

  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length !== 1) return { ok: false, code: 'invalid-id' }

  let decoded: string
  try {
    decoded = decodeURIComponent(segments[0])
  } catch {
    return { ok: false, code: 'invalid-id' }
  }

  const channelId = normalizeStoredChannelId(decoded)
  return channelId
    ? { ok: true, channelId }
    : { ok: false, code: 'invalid-id' }
}

export function normalizeWatchlistDisplayName(value: unknown, fallback = ''): string {
  const source = typeof value === 'string' ? value : ''
  const cleaned = source.replace(CONTROL_CHARACTERS, '').trim()
  const limited = Array.from(cleaned).slice(0, 100).join('')
  return limited || fallback
}

export function normalizeIsoTimestamp(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  return Number.isFinite(Date.parse(value)) ? value : ''
}

export function currentIsoTimestamp(value: Date | number | string = new Date()): string {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (!Number.isFinite(date.getTime())) throw new TypeError('A valid timestamp is required.')
  return date.toISOString()
}

export function createWatchlistDocument(
  provider: WatchlistProvider,
  entries: readonly WatchlistEntry[] = [],
  now: Date | number | string = new Date(),
): WatchlistDocument {
  return {
    schema: WATCHLIST_SCHEMA,
    provider,
    revision: WATCHLIST_REVISION,
    updatedAt: currentIsoTimestamp(now),
    entries: entries.map(copyEntry),
  }
}

export function addWatchlistEntry(
  document: WatchlistDocument,
  input: unknown,
  displayName: unknown = '',
  now: Date | number | string = new Date(),
): WatchlistMutationResult {
  const normalized = normalizeWatchlistChannelInput(input, document.provider)
  if (normalized.ok === false) {
    return { ok: false, code: normalized.code, document, changed: false }
  }
  if (document.entries.some((entry) => entry.channelId === normalized.channelId)) {
    return { ok: false, code: 'already-saved', document, changed: false }
  }
  if (document.entries.length >= WATCHLIST_MAX_ENTRIES) {
    return { ok: false, code: 'limit-reached', document, changed: false }
  }

  const timestamp = currentIsoTimestamp(now)
  const entry: WatchlistEntry = {
    channelId: normalized.channelId,
    displayName: normalizeWatchlistDisplayName(displayName, normalized.channelId),
    addedAt: timestamp,
  }
  return {
    ok: true,
    code: 'ok',
    changed: true,
    entry,
    document: {
      ...document,
      updatedAt: timestamp,
      entries: [entry, ...document.entries.map(copyEntry)],
    },
  }
}

export function removeWatchlistEntry(
  document: WatchlistDocument,
  channelId: unknown,
  now: Date | number | string = new Date(),
): WatchlistMutationResult {
  const normalized = normalizeStoredChannelId(channelId)
  const index = document.entries.findIndex((entry) => entry.channelId === normalized)
  if (!normalized || index < 0) {
    return { ok: false, code: 'not-found', document, changed: false }
  }

  const timestamp = currentIsoTimestamp(now)
  return {
    ok: true,
    code: 'ok',
    changed: true,
    document: {
      ...document,
      updatedAt: timestamp,
      entries: document.entries.filter((_, entryIndex) => entryIndex !== index).map(copyEntry),
    },
  }
}

export function moveWatchlistEntry(
  document: WatchlistDocument,
  channelId: unknown,
  direction: WatchlistMoveDirection,
  now: Date | number | string = new Date(),
): WatchlistMutationResult {
  const normalized = normalizeStoredChannelId(channelId)
  const index = document.entries.findIndex((entry) => entry.channelId === normalized)
  if (!normalized || index < 0) {
    return { ok: false, code: 'not-found', document, changed: false }
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= document.entries.length) {
    return { ok: true, code: 'ok', document, changed: false }
  }

  const entries = document.entries.map(copyEntry)
  const current = entries[index]
  entries[index] = entries[targetIndex]
  entries[targetIndex] = current

  return {
    ok: true,
    code: 'ok',
    changed: true,
    document: {
      ...document,
      updatedAt: currentIsoTimestamp(now),
      entries,
    },
  }
}

export function clearWatchlistDocument(
  document: WatchlistDocument,
  now: Date | number | string = new Date(),
): WatchlistMutationResult {
  if (document.entries.length === 0) {
    return { ok: true, code: 'ok', document, changed: false }
  }
  return {
    ok: true,
    code: 'ok',
    changed: true,
    document: createWatchlistDocument(document.provider, [], now),
  }
}

export function copyWatchlistDocument(document: WatchlistDocument): WatchlistDocument {
  return {
    ...document,
    entries: document.entries.map(copyEntry),
  }
}

function copyEntry(entry: WatchlistEntry): WatchlistEntry {
  return { ...entry }
}

function hasScheme(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value)
}

function looksLikeProviderUrl(value: string): boolean {
  if (hasScheme(value)) return true
  const lowered = value.toLowerCase()
  return lowered.startsWith('www.')
    || lowered.startsWith('twitch.tv/')
    || lowered.startsWith('kick.com/')
}

function providerForHostname(hostname: string): WatchlistProvider | undefined {
  if (PROVIDER_HOSTS.twitch.has(hostname)) return 'twitch'
  if (PROVIDER_HOSTS.kick.has(hostname)) return 'kick'
  return undefined
}
