import {
  normalizeIsoTimestamp,
  normalizeStoredChannelId,
  normalizeWatchlistDisplayName,
  type WatchlistProvider,
} from './model'
import {
  WATCHLIST_LATEST_SCHEMA,
  createUnavailableLatestSnapshot,
  watchlistLatestEndpoint,
  type WatchlistLatestFreshness,
  type WatchlistLatestItem,
  type WatchlistLatestProviderState,
  type WatchlistLatestSnapshot,
} from './latest-model'

export function normalizeTwitchHeatmapResponse(raw: unknown): WatchlistLatestSnapshot {
  return normalizeProviderHeatmapResponse('twitch', raw)
}

export function normalizeKickHeatmapResponse(raw: unknown): WatchlistLatestSnapshot {
  return normalizeProviderHeatmapResponse('kick', raw)
}

export function normalizeProviderHeatmapResponse(
  provider: WatchlistProvider,
  raw: unknown,
): WatchlistLatestSnapshot {
  const record = asRecord(raw)
  if (!record) return createUnavailableLatestSnapshot(provider, 'unreadable-payload')

  const explicitProvider = providerValue(record.provider ?? record.platform)
  if (explicitProvider && explicitProvider !== provider) {
    return createUnavailableLatestSnapshot(provider, 'provider-mismatch')
  }

  const latest = asRecord(record.latest)
  const itemSource = heatmapItems(record, latest)
  if (itemSource === null) {
    return createUnavailableLatestSnapshot(provider, 'unreadable-payload')
  }

  const itemsById = normalizeItems(itemSource)
  const rawState = text(record.state ?? record.status).toLowerCase() || null
  const coverageMode = nullableText(record.coverageMode ?? record.coverage_mode)
    ?? nullableText(latest?.coverage_mode)
    ?? noteValue(record.notes, 'coverage_mode')
  const partial = rawState === 'partial'
    || Boolean(coverageMode?.toLowerCase().includes('partial'))
    || truthyNumber(record.hasMore ?? record.has_more ?? latest?.has_more)
    || noteValue(record.notes, 'has_more') === '1'

  const state = providerState(record, rawState, partial, itemSource.length, itemsById.size)
  const freshness: WatchlistLatestFreshness = state === 'stale'
    ? 'stale'
    : state === 'live' || state === 'partial'
      ? 'fresh'
      : 'unavailable'

  const updatedAt = firstTimestamp(
    record.updatedAt,
    record.updated_at,
    latest?.collected_at,
    latest?.bucket_minute,
  )
  const source = nullableText(record.source)
    ?? nullableText(latest?.source_mode)
    ?? noteValue(record.notes, 'source_mode')
  const targetSource = nullableText(record.targetSource ?? record.target_source)
    ?? noteValue(record.notes, 'target_source')
  const coverageNote = nullableText(record.coverageNote ?? record.coverage_note)

  return {
    schema: WATCHLIST_LATEST_SCHEMA,
    provider,
    endpoint: watchlistLatestEndpoint(provider),
    state,
    freshness,
    usableForAbsence: state === 'live' || state === 'partial' || state === 'stale',
    source,
    targetSource,
    updatedAt,
    coverageMode,
    coverageNote,
    rawState,
    itemCount: itemsById.size,
    itemsById,
    errorCode: null,
    httpStatus: null,
  }
}

function providerState(
  record: Record<string, unknown>,
  rawState: string | null,
  partial: boolean,
  rawItemCount: number,
  normalizedItemCount: number,
): WatchlistLatestProviderState {
  if (record.ok === false || rawState === 'error') return 'error'
  if (rawState === 'not_ready' || rawState === 'empty') return 'empty'
  if (rawItemCount > 0 && normalizedItemCount === 0) return 'error'
  if (normalizedItemCount === 0) return 'empty'
  if (rawState === 'stale') return 'stale'
  if (partial) return 'partial'
  return 'live'
}

function heatmapItems(
  record: Record<string, unknown>,
  latest: Record<string, unknown> | null,
): unknown[] | null {
  if (Array.isArray(record.items)) return record.items
  if (!latest) return null

  const payloadJson = latest.payload_json
  if (typeof payloadJson !== 'string') return null

  let payload: unknown
  try {
    payload = JSON.parse(payloadJson)
  } catch {
    return null
  }

  const payloadRecord = asRecord(payload)
  if (!payloadRecord) return null
  if (Array.isArray(payloadRecord.items)) return payloadRecord.items
  if (Array.isArray(payloadRecord.data)) return payloadRecord.data
  return null
}

function normalizeItems(rawItems: readonly unknown[]): ReadonlyMap<string, WatchlistLatestItem> {
  const items = new Map<string, WatchlistLatestItem>()
  for (const raw of rawItems) {
    const item = normalizeItem(raw)
    if (!item || items.has(item.channelId)) continue
    items.set(item.channelId, item)
  }
  return items
}

function normalizeItem(raw: unknown): WatchlistLatestItem | null {
  const record = asRecord(raw)
  if (!record) return null
  const channel = asRecord(record.channel)
  const livestream = asRecord(record.livestream)
  const channelId = normalizeStoredChannelId(
    record.channelLogin
      ?? record.id
      ?? record.login
      ?? record.slug
      ?? record.username
      ?? record.user_login
      ?? record.user_slug
      ?? channel?.slug
      ?? channel?.username
      ?? channel?.name,
  )
  if (!channelId) return null

  const displayName = normalizeWatchlistDisplayName(
    record.displayName
      ?? record.name
      ?? record.user_name
      ?? record.username
      ?? channel?.displayName
      ?? channel?.name
      ?? channel?.username,
    channelId,
  )

  return {
    channelId,
    displayName,
    viewers: nonnegativeNumber(record.viewers ?? record.viewer_count ?? record.viewerCount ?? livestream?.viewer_count),
    title: nullableText(record.title ?? record.streamTitle ?? record.gameName ?? record.session_title ?? record.stream_title ?? livestream?.session_title),
    momentum: finiteNumber(record.momentum),
    url: nullableText(record.url),
    startedAt: firstTimestamp(record.startedAt, record.started_at, record.start_time, livestream?.created_at),
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function providerValue(value: unknown): WatchlistProvider | null {
  const normalized = text(value).toLowerCase()
  if (normalized === 'twitch' || normalized === 'kick') return normalized
  return null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown): string | null {
  const normalized = text(value)
  return normalized || null
}

function firstTimestamp(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeIsoTimestamp(value)
    if (normalized) return normalized
  }
  return null
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function nonnegativeNumber(value: unknown): number | null {
  const parsed = numericValue(value)
  return parsed === null || parsed < 0 ? null : Math.round(parsed)
}

function finiteNumber(value: unknown): number | null {
  return numericValue(value)
}

function truthyNumber(value: unknown): boolean {
  const parsed = numericValue(value)
  return parsed !== null && parsed > 0
}

function noteValue(notes: unknown, key: string): string | null {
  if (!Array.isArray(notes)) return null
  const prefix = `${key}=`
  for (const note of notes) {
    const normalized = text(note)
    if (normalized.startsWith(prefix)) return normalized.slice(prefix.length) || null
  }
  return null
}
