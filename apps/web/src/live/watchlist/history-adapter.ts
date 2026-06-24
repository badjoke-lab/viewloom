import {
  normalizeStoredChannelId,
  normalizeWatchlistDisplayName,
  type WatchlistPeriod,
  type WatchlistProvider,
} from './model'
import {
  WATCHLIST_HISTORY_SCHEMA,
  createUnavailableHistorySnapshot,
  watchlistHistoryEndpoint,
  type WatchlistHistoryDailyAppearance,
  type WatchlistHistoryProviderState,
  type WatchlistHistorySnapshot,
  type WatchlistRetainedItem,
} from './history-model'

export function normalizeTwitchHistoryResponse(
  period: WatchlistPeriod,
  raw: unknown,
): WatchlistHistorySnapshot {
  return normalizeProviderHistoryResponse('twitch', period, raw)
}

export function normalizeKickHistoryResponse(
  period: WatchlistPeriod,
  raw: unknown,
): WatchlistHistorySnapshot {
  return normalizeProviderHistoryResponse('kick', period, raw)
}

export function normalizeProviderHistoryResponse(
  provider: WatchlistProvider,
  period: WatchlistPeriod,
  raw: unknown,
): WatchlistHistorySnapshot {
  const record = asRecord(raw)
  if (!record) return createUnavailableHistorySnapshot(provider, period, 'unreadable-payload')

  const explicitProvider = providerValue(record.provider ?? record.platform)
  if (explicitProvider && explicitProvider !== provider) {
    return createUnavailableHistorySnapshot(provider, period, 'provider-mismatch')
  }

  const metric = text(record.metric).toLowerCase()
  if (metric && metric !== 'viewer_minutes') {
    return createUnavailableHistorySnapshot(provider, period, 'metric-mismatch')
  }

  const periodRecord = asRecord(record.period)
  const expectedDays = period === '7d' ? 7 : 30
  const payloadDays = integer(periodRecord?.days)
  if (payloadDays !== null && payloadDays !== expectedDays) {
    return createUnavailableHistorySnapshot(provider, period, 'period-mismatch')
  }

  if (!Array.isArray(record.topStreamers) || !Array.isArray(record.daily)) {
    return createUnavailableHistorySnapshot(provider, period, 'unreadable-payload')
  }

  const topRows = normalizeTopRows(record.topStreamers)
  const dailyAppearancesById = normalizeDailyRows(record.daily)
  const retainedById = buildRetainedIndex(topRows, dailyAppearancesById)
  const rawItemCount = record.topStreamers.length + countRawDailyStreamers(record.daily)
  if (rawItemCount > 0 && retainedById.size === 0) {
    return createUnavailableHistorySnapshot(provider, period, 'unreadable-payload')
  }

  const coverage = asRecord(record.coverage)
  const rawState = nullableText(record.state)?.toLowerCase() ?? null
  const coverageState = nullableText(coverage?.state)?.toLowerCase() ?? null
  const state = historyProviderState(rawState, coverageState, record.daily, retainedById.size)

  return {
    schema: WATCHLIST_HISTORY_SCHEMA,
    provider,
    period,
    endpoint: watchlistHistoryEndpoint(provider, period),
    state,
    usableForAbsence: state === 'ready',
    source: nullableText(record.source),
    metric: 'viewer_minutes',
    rawState,
    requestedFrom: calendarDay(periodRecord?.from),
    requestedTo: calendarDay(periodRecord?.to),
    periodLabel: nullableText(periodRecord?.label),
    coverageState,
    coverageNote: coverageNotes(coverage, record.notes),
    observedDays: nonnegativeInteger(coverage?.observedDays),
    missingDays: nonnegativeInteger(coverage?.missingDays),
    partialDays: nonnegativeInteger(coverage?.partialDays),
    inProgressDays: nonnegativeInteger(coverage?.inProgressDays),
    retainedById,
    dailyAppearancesById,
    itemCount: retainedById.size,
    errorCode: null,
    httpStatus: null,
  }
}

type RankedFacts = Omit<WatchlistHistoryDailyAppearance, 'day'> & {
  channelId: string
}

function normalizeTopRows(rawRows: readonly unknown[]): ReadonlyMap<string, RankedFacts> {
  const result = new Map<string, RankedFacts>()
  for (const raw of rawRows) {
    const row = normalizeRankedRow(raw)
    if (!row || result.has(row.channelId)) continue
    result.set(row.channelId, row)
  }
  return result
}

function normalizeDailyRows(
  rawDays: readonly unknown[],
): ReadonlyMap<string, readonly WatchlistHistoryDailyAppearance[]> {
  const mutable = new Map<string, WatchlistHistoryDailyAppearance[]>()

  for (const rawDay of rawDays) {
    const dayRecord = asRecord(rawDay)
    const day = calendarDay(dayRecord?.day)
    if (!day || !Array.isArray(dayRecord?.topStreamers)) continue

    const seenForDay = new Set<string>()
    for (const raw of dayRecord.topStreamers) {
      const row = normalizeRankedRow(raw)
      if (!row || seenForDay.has(row.channelId)) continue
      seenForDay.add(row.channelId)
      const appearances = mutable.get(row.channelId) ?? []
      appearances.push({
        day,
        displayName: row.displayName,
        viewerMinutes: row.viewerMinutes,
        peakViewers: row.peakViewers,
        averageViewers: row.averageViewers,
        observedMinutes: row.observedMinutes,
        rankByViewerMinutes: row.rankByViewerMinutes,
        rankByPeak: row.rankByPeak,
      })
      mutable.set(row.channelId, appearances)
    }
  }

  const result = new Map<string, readonly WatchlistHistoryDailyAppearance[]>()
  for (const [channelId, appearances] of mutable) {
    result.set(channelId, [...appearances].sort((a, b) => b.day.localeCompare(a.day)))
  }
  return result
}

function buildRetainedIndex(
  topRows: ReadonlyMap<string, RankedFacts>,
  dailyAppearancesById: ReadonlyMap<string, readonly WatchlistHistoryDailyAppearance[]>,
): ReadonlyMap<string, WatchlistRetainedItem> {
  const ids = new Set<string>([...topRows.keys(), ...dailyAppearancesById.keys()])
  const result = new Map<string, WatchlistRetainedItem>()

  for (const channelId of ids) {
    const top = topRows.get(channelId) ?? null
    const appearances = dailyAppearancesById.get(channelId) ?? []
    const recent = appearances[0] ?? null
    result.set(channelId, {
      channelId,
      displayName: top?.displayName ?? recent?.displayName ?? channelId,
      viewerMinutes: top?.viewerMinutes ?? recent?.viewerMinutes ?? null,
      peakViewers: top?.peakViewers ?? recent?.peakViewers ?? null,
      averageViewers: top?.averageViewers ?? recent?.averageViewers ?? null,
      observedMinutes: top?.observedMinutes ?? recent?.observedMinutes ?? null,
      rankByViewerMinutes: top?.rankByViewerMinutes ?? recent?.rankByViewerMinutes ?? null,
      rankByPeak: top?.rankByPeak ?? recent?.rankByPeak ?? null,
      dailyAppearanceCount: appearances.length,
      mostRecentAppearance: recent?.day ?? null,
      topSummaryPresent: top !== null,
      dailyAppearancePresent: appearances.length > 0,
    })
  }
  return result
}

function normalizeRankedRow(raw: unknown): RankedFacts | null {
  const record = asRecord(raw)
  if (!record) return null
  const channelId = normalizeStoredChannelId(
    record.streamerId
      ?? record.channelId
      ?? record.channelLogin
      ?? record.id
      ?? record.login
      ?? record.slug,
  )
  if (!channelId) return null
  return {
    channelId,
    displayName: normalizeWatchlistDisplayName(
      record.displayName ?? record.name ?? record.user_name,
      channelId,
    ),
    viewerMinutes: nonnegativeNumber(record.viewerMinutes ?? record.viewer_minutes),
    peakViewers: nonnegativeNumber(record.peakViewers ?? record.peak_viewers),
    averageViewers: nonnegativeNumber(record.avgViewers ?? record.averageViewers ?? record.avg_viewers),
    observedMinutes: nonnegativeNumber(record.observedMinutes ?? record.observed_minutes),
    rankByViewerMinutes: positiveInteger(record.rankByViewerMinutes ?? record.rank_by_viewer_minutes),
    rankByPeak: positiveInteger(record.rankByPeak ?? record.rank_by_peak),
  }
}

function historyProviderState(
  rawState: string | null,
  coverageState: string | null,
  rawDaily: readonly unknown[],
  retainedCount: number,
): WatchlistHistoryProviderState {
  if (rawState === 'error') return 'error'
  if (rawState === 'empty') return 'empty'
  if (rawState === 'partial' || rawState === 'demo') return 'partial'
  if (coverageState === 'partial' || coverageState === 'demo' || coverageState === 'missing') {
    return retainedCount > 0 || hasObservedDay(rawDaily) ? 'partial' : 'empty'
  }
  if (rawState === 'fresh' || coverageState === 'good') return 'ready'
  if (retainedCount > 0 || hasObservedDay(rawDaily)) return 'partial'
  return 'empty'
}

function hasObservedDay(rawDaily: readonly unknown[]): boolean {
  return rawDaily.some((raw) => {
    const record = asRecord(raw)
    const state = nullableText(record?.coverageState)?.toLowerCase()
    return state !== null && state !== 'missing'
  })
}

function countRawDailyStreamers(rawDaily: readonly unknown[]): number {
  let count = 0
  for (const raw of rawDaily) {
    const record = asRecord(raw)
    if (Array.isArray(record?.topStreamers)) count += record.topStreamers.length
  }
  return count
}

function coverageNotes(
  coverage: Record<string, unknown> | null,
  topNotes: unknown,
): string | null {
  const values: string[] = []
  if (Array.isArray(coverage?.notes)) {
    for (const value of coverage.notes) {
      const normalized = text(value)
      if (normalized) values.push(normalized)
    }
  }
  if (values.length === 0 && Array.isArray(topNotes)) {
    for (const value of topNotes) {
      const normalized = text(value)
      if (normalized) values.push(normalized)
    }
  }
  return values.length ? values.join(' ') : null
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
  return text(value) || null
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, ''))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function integer(value: unknown): number | null {
  const parsed = numericValue(value)
  return parsed === null ? null : Math.round(parsed)
}

function nonnegativeNumber(value: unknown): number | null {
  const parsed = numericValue(value)
  return parsed === null || parsed < 0 ? null : Math.round(parsed)
}

function nonnegativeInteger(value: unknown): number | null {
  return nonnegativeNumber(value)
}

function positiveInteger(value: unknown): number | null {
  const parsed = integer(value)
  return parsed === null || parsed <= 0 ? null : parsed
}

function calendarDay(value: unknown): string | null {
  const normalized = text(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null
  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === normalized
    ? normalized
    : null
}
