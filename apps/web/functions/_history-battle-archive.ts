import type { Env } from './_db/env'
import {
  buildBattleLinesPayload,
  type BattleEvent,
  type BattleModel,
  type BattleSourceItem,
  type BattleSourceRow,
} from './_lib/battle-lines-core'
import { compactBattleRows, withTimeout } from './_lib/battle-lines-request'

type Provider = 'twitch' | 'kick'
type JsonRecord = Record<string, unknown>

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

type ArchiveType = 'reversal' | 'close_battle' | 'fastest_challenger' | 'heated_battle'

type BattleArchiveEntry = {
  id: string
  rank?: number
  day: string
  timestamp: string | null
  timestampPrecision: 'minute' | 'day'
  type: ArchiveType
  battleId: string
  streamerAId: string
  streamerBId: string
  streamerA: string
  streamerB: string
  title: string
  summary: string
  gapBefore: number | null
  gapAfter: number | null
  delta: number | null
  score: number
  reversalCount: number
  overlapCount: number
  coverageState: string
}

export const HISTORY_BATTLE_ARCHIVE_LIMIT = 30
export const HISTORY_BATTLE_ARCHIVE_SCOPE_DAYS = 14
export const HISTORY_BATTLE_ARCHIVE_MAX_ROWS = HISTORY_BATTLE_ARCHIVE_SCOPE_DAYS * 24 * 12
const HISTORY_BATTLE_ARCHIVE_QUERY_TIMEOUT_MS = 8_000

export async function enrichHistoryBattleArchive(
  env: Env,
  provider: Provider,
  response: Response,
): Promise<Response> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json') || !response.ok) return response

  try {
    const payload = await response.clone().json<JsonRecord>()
    const period = record(payload.period)
    const requestedFrom = day(period?.from)
    const requestedTo = day(period?.to)
    const today = new Date().toISOString().slice(0, 10)
    const latestCompletedDay = shiftDay(today, -1)
    const archiveTo = requestedTo && requestedTo < today ? requestedTo : latestCompletedDay
    const boundedFrom = archiveTo ? shiftDay(archiveTo, -(HISTORY_BATTLE_ARCHIVE_SCOPE_DAYS - 1)) : ''
    const archiveFrom = requestedFrom && boundedFrom ? maxDay(requestedFrom, boundedFrom) : ''

    if (!archiveFrom || !archiveTo || archiveFrom > archiveTo) {
      return jsonResponse(response, {
        ...payload,
        ...emptyResult(provider, requestedFrom, requestedTo, 'empty'),
      })
    }

    const rows = await fetchRows(env, provider, archiveFrom, archiveTo)
    const result = historyBattleArchiveFromRows(rows, provider, archiveFrom, archiveTo)
    const dailyCounts = record(result.dailyBattleEventCounts) ?? {}
    const dailyScores = record(result.dailyTopBattleScores) ?? {}
    const daily = records(payload.daily).map((entry) => {
      const value = text(entry.day)
      return {
        ...entry,
        battleEventCount: number(dailyCounts[value]),
        topBattleScore: nullableNumber(dailyScores[value]),
      }
    })

    return jsonResponse(response, { ...payload, daily, ...result })
  } catch {
    try {
      const payload = await response.clone().json<JsonRecord>()
      return jsonResponse(response, {
        ...payload,
        ...emptyResult(provider, text(record(payload.period)?.from), text(record(payload.period)?.to), 'unavailable'),
      })
    } catch {
      return response
    }
  }
}

export function historyBattleArchiveFromRows(
  sourceRows: SnapshotRow[],
  provider: Provider,
  from: string,
  to: string,
): JsonRecord {
  const grouped = new Map<string, BattleSourceRow[]>()
  for (const row of sourceRows) {
    const rowDay = day(row.bucket_minute)
    if (!rowDay || rowDay < from || rowDay > to) continue
    const current = grouped.get(rowDay) ?? []
    current.push({
      bucketMinute: row.bucket_minute,
      collectedAt: row.collected_at,
      sourceMode: row.source_mode,
      items: readItems(row.payload_json, provider),
    })
    grouped.set(rowDay, current)
  }

  const entries: BattleArchiveEntry[] = []
  const dailyBattleEventCounts: Record<string, number> = {}
  const dailyTopBattleScores: Record<string, number | null> = {}

  for (const [archiveDay, rows] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const compacted = compactBattleRows(rows, 5)
    const payload = buildBattleLinesPayload(compacted.rows, {
      platform: provider,
      top: 5,
      requestedBucket: '5m',
      metric: 'viewers',
      period: {
        mode: 'date',
        selectedDate: archiveDay,
        from: `${archiveDay}T00:00:00.000Z`,
        to: `${shiftDay(archiveDay, 1)}T00:00:00.000Z`,
        isLive: false,
      },
      now: new Date(`${shiftDay(archiveDay, 1)}T00:00:00.000Z`),
      sampleIntervalMinutes: 5,
    })
    const primary = payload.primaryBattle as BattleModel | null
    const events = payload.events as BattleEvent[]
    const dayEntries = primary ? archiveEntriesForDay(archiveDay, primary, events, payload.state) : []
    dailyBattleEventCounts[archiveDay] = dayEntries.length
    dailyTopBattleScores[archiveDay] = primary?.score ?? null
    entries.push(...dayEntries)
  }

  const ranked = entries
    .sort((left, right) => {
      const priority = eventPriority(right.type) - eventPriority(left.type)
      if (priority !== 0) return priority
      if (right.score !== left.score) return right.score - left.score
      return String(right.timestamp ?? right.day).localeCompare(String(left.timestamp ?? left.day))
    })
    .slice(0, HISTORY_BATTLE_ARCHIVE_LIMIT)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

  return {
    battleArchive: ranked,
    dailyBattleEventCounts,
    dailyTopBattleScores,
    battleArchiveMeta: {
      state: sourceRows.length ? 'available' : 'empty',
      sourcePopulation: 'minute_snapshots',
      provider,
      providerSeparated: true,
      bounded: true,
      limit: HISTORY_BATTLE_ARCHIVE_LIMIT,
      scopeDays: HISTORY_BATTLE_ARCHIVE_SCOPE_DAYS,
      from,
      to,
      queriedRows: sourceRows.length,
      currentDayExcluded: true,
      exactTimestampCount: ranked.filter((entry) => entry.timestamp !== null).length,
      reversalCount: ranked.filter((entry) => entry.type === 'reversal').length,
    },
  }
}

function archiveEntriesForDay(
  archiveDay: string,
  battle: BattleModel,
  events: BattleEvent[],
  coverageState: string,
): BattleArchiveEntry[] {
  const mapped: BattleArchiveEntry[] = []
  const selected = [
    ...events.filter((event) => event.type === 'reversal').slice(0, 2),
    ...events.filter((event) => event.type === 'gap_collapse').slice(0, 1),
    ...events.filter((event) => event.type === 'rapid_rise').slice(0, 1),
  ]

  for (const event of selected) mapped.push(fromBattleEvent(archiveDay, battle, event, coverageState))

  const heatedTimestamp = exactTimestamp(battle.currentBucket, archiveDay)
  mapped.push({
    id: `heated:${battle.id}:${archiveDay}`,
    day: archiveDay,
    timestamp: heatedTimestamp,
    timestampPrecision: heatedTimestamp ? 'minute' : 'day',
    type: 'heated_battle',
    battleId: battle.id,
    streamerAId: battle.streamerAId,
    streamerBId: battle.streamerBId,
    streamerA: battle.streamerAName,
    streamerB: battle.streamerBName,
    title: `${battle.streamerAName} vs ${battle.streamerBName} was the strongest observed battle`,
    summary: `Battle score ${formatNumber(battle.score)} · ${battle.reversalCount} reversals · ${battle.overlapCount} shared buckets`,
    gapBefore: battle.previousGap,
    gapAfter: battle.currentGap,
    delta: null,
    score: battle.score,
    reversalCount: battle.reversalCount,
    overlapCount: battle.overlapCount,
    coverageState,
  })

  return mapped
    .sort((left, right) => eventPriority(right.type) - eventPriority(left.type) || right.score - left.score)
    .slice(0, 3)
}

function fromBattleEvent(
  archiveDay: string,
  battle: BattleModel,
  event: BattleEvent,
  coverageState: string,
): BattleArchiveEntry {
  const timestamp = exactTimestamp(event.time, archiveDay)
  return {
    id: event.id,
    day: archiveDay,
    timestamp,
    timestampPrecision: timestamp ? 'minute' : 'day',
    type: mapEventType(event.type),
    battleId: battle.id,
    streamerAId: battle.streamerAId,
    streamerBId: battle.streamerBId,
    streamerA: battle.streamerAName,
    streamerB: battle.streamerBName,
    title: event.title,
    summary: event.summary,
    gapBefore: nullableNumber(event.gapBefore),
    gapAfter: nullableNumber(event.gapAfter),
    delta: nullableNumber(event.delta),
    score: battle.score,
    reversalCount: battle.reversalCount,
    overlapCount: battle.overlapCount,
    coverageState,
  }
}

async function fetchRows(env: Env, provider: Provider, from: string, to: string): Promise<SnapshotRow[]> {
  const db = provider === 'kick' ? env.DB_KICK_HOT : env.DB_TWITCH_HOT
  const result = await withTimeout(
    db.prepare(`
      SELECT bucket_minute, collected_at, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      ORDER BY bucket_minute ASC
      LIMIT ${HISTORY_BATTLE_ARCHIVE_MAX_ROWS}
    `).bind(provider, `${from}T00:00:00.000Z`, `${shiftDay(to, 1)}T00:00:00.000Z`).all<SnapshotRow>(),
    HISTORY_BATTLE_ARCHIVE_QUERY_TIMEOUT_MS,
    `${provider} History Battle Archive query exceeded ${HISTORY_BATTLE_ARCHIVE_QUERY_TIMEOUT_MS}ms.`,
  )
  return result.results ?? []
}

function emptyResult(provider: Provider, from: string, to: string, state: 'empty' | 'unavailable'): JsonRecord {
  return {
    battleArchive: [],
    dailyBattleEventCounts: {},
    dailyTopBattleScores: {},
    battleArchiveMeta: {
      state,
      sourcePopulation: 'minute_snapshots',
      provider,
      providerSeparated: true,
      bounded: true,
      limit: HISTORY_BATTLE_ARCHIVE_LIMIT,
      scopeDays: HISTORY_BATTLE_ARCHIVE_SCOPE_DAYS,
      from: day(from),
      to: day(to),
      queriedRows: 0,
      currentDayExcluded: true,
      exactTimestampCount: 0,
      reversalCount: 0,
    },
  }
}

function readItems(payloadJson: string, provider: Provider): BattleSourceItem[] {
  const payload = record(safeJson(payloadJson))
  const rawItems = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []
  return rawItems.map((raw) => readItem(raw, provider)).filter((item): item is BattleSourceItem => item !== null)
}

function readItem(raw: unknown, provider: Provider): BattleSourceItem | null {
  const item = record(raw)
  if (!item) return null
  const channel = record(item.channel)
  const live = record(item.livestream)
  const rawId = provider === 'kick'
    ? text(item.channelLogin ?? item.slug ?? item.username ?? item.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
    : text(item.channelLogin ?? item.login ?? item.user_login ?? item.slug ?? item.displayName ?? item.name)
  const id = slug(rawId || text(item.displayName ?? item.name))
  if (!id) return null
  const name = provider === 'kick'
    ? text(item.displayName ?? item.name ?? item.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? id)
    : text(item.displayName ?? item.user_name ?? item.name ?? item.channelLogin ?? id)
  const viewers = provider === 'kick'
    ? number(item.viewers ?? item.viewer_count ?? item.viewerCount ?? live?.viewer_count)
    : number(item.viewers ?? item.viewer_count ?? item.viewerCount)
  return {
    id,
    name: name || id,
    title: text(item.title ?? item.session_title ?? item.stream_title ?? live?.session_title),
    url: provider === 'kick' ? text(item.url) || `https://kick.com/${id}` : `https://www.twitch.tv/${id}`,
    viewers,
  }
}

function mapEventType(value: BattleEvent['type']): ArchiveType {
  if (value === 'reversal') return 'reversal'
  if (value === 'gap_collapse') return 'close_battle'
  if (value === 'rapid_rise') return 'fastest_challenger'
  return 'heated_battle'
}

function eventPriority(value: ArchiveType): number {
  if (value === 'reversal') return 4
  if (value === 'close_battle') return 3
  if (value === 'heated_battle') return 2
  return 1
}

function jsonResponse(original: Response, payload: JsonRecord): Response {
  const headers = new Headers(original.headers)
  headers.delete('content-length')
  headers.set('cache-control', 'no-store')
  return Response.json(payload, {
    status: original.status,
    statusText: original.statusText,
    headers,
  })
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => typeof item === 'object' && item !== null && !Array.isArray(item))
    : []
}

function record(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function day(value: unknown): string {
  const raw = text(value).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return ''
  const parsed = new Date(`${raw}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw ? raw : ''
}

function exactTimestamp(value: unknown, expectedDay: string): string | null {
  const raw = text(value)
  if (!raw) return null
  const parsed = new Date(raw)
  if (!Number.isFinite(parsed.getTime())) return null
  const iso = parsed.toISOString()
  return iso.slice(0, 10) === expectedDay ? iso : null
}

function shiftDay(value: string, offset: number): string {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  parsed.setUTCDate(parsed.getUTCDate() + offset)
  return parsed.toISOString().slice(0, 10)
}

function maxDay(left: string, right: string): string {
  return left > right ? left : right
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}
