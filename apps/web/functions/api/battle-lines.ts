import type { Env } from '../_db/env'
import {
  buildBattleLinesPayload,
  buildBattlePeriod,
  normalizeMetric,
  normalizeRequestedBucket,
  normalizeTop,
  type BattleSourceItem,
  type BattleSourceRow,
} from '../_lib/battle-lines-core'
import {
  BATTLE_MAX_SNAPSHOT_ROWS,
  BATTLE_QUERY_TIMEOUT_MS,
  compactBattleRows,
  withTimeout,
} from '../_lib/battle-lines-request'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const startedAt = Date.now()
  const top = normalizeTop(url.searchParams.get('top'))
  const requestedBucket = normalizeRequestedBucket(url.searchParams.get('bucket'))
  const metric = normalizeMetric(url.searchParams.get('metric'))
  const period = buildBattlePeriod(url, now)
  const options = {
    platform: 'twitch' as const,
    top,
    requestedBucket,
    metric,
    period,
    now,
    sampleIntervalMinutes: 5,
  }

  try {
    const result = await withTimeout(
      env.DB_TWITCH_HOT.prepare(`
        SELECT bucket_minute, collected_at, payload_json, source_mode
        FROM minute_snapshots
        WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
        ORDER BY bucket_minute DESC
        LIMIT ${BATTLE_MAX_SNAPSHOT_ROWS}
      `).bind('twitch', period.from, period.to).all<SnapshotRow>(),
      BATTLE_QUERY_TIMEOUT_MS,
      `Twitch Battle Lines snapshot query exceeded ${BATTLE_QUERY_TIMEOUT_MS}ms.`,
    )

    const parsedRows: BattleSourceRow[] = [...(result.results ?? [])].reverse().map((row) => ({
      bucketMinute: row.bucket_minute,
      collectedAt: row.collected_at,
      sourceMode: row.source_mode,
      items: readItems(row.payload_json),
    }))
    const compacted = compactBattleRows(parsedRows, top)
    const payload = buildBattleLinesPayload(compacted.rows, options)
    const durationMs = Date.now() - startedAt

    return Response.json({
      ...payload,
      diagnostics: {
        durationMs,
        snapshotRows: parsedRows.length,
        candidateStreams: compacted.candidateCount,
        retainedItems: compacted.retainedItemCount,
        maxSnapshotRows: BATTLE_MAX_SNAPSHOT_ROWS,
      },
      notes: [
        ...payload.notes,
        `${parsedRows.length} provider=twitch snapshot rows read from DB_TWITCH_HOT.`,
        `${compacted.candidateCount} candidate streams reduced to the requested Top ${top} before timeline expansion.`,
      ],
    }, {
      headers: {
        'cache-control': 'no-store',
        'server-timing': `battle-lines;dur=${durationMs}`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Battle Lines API failed.'
    const payload = buildBattleLinesPayload([], options)
    const durationMs = Date.now() - startedAt
    return Response.json({
      ...payload,
      state: 'error',
      status: 'error',
      diagnostics: { durationMs, maxSnapshotRows: BATTLE_MAX_SNAPSHOT_ROWS },
      error: { code: 'battle_lines_api_error', message },
      notes: [...payload.notes, 'Twitch Battle Lines could not read or process DB_TWITCH_HOT snapshots.'],
    }, {
      status: 500,
      headers: {
        'cache-control': 'no-store',
        'server-timing': `battle-lines;dur=${durationMs}`,
      },
    })
  }
}

function readItems(payloadJson: string): BattleSourceItem[] {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(readItem).filter((item): item is BattleSourceItem => item !== null)
}

function readItem(raw: unknown): BattleSourceItem | null {
  const record = object(raw)
  if (!record) return null
  const id = slug(str(record.channelLogin ?? record.login ?? record.user_login ?? record.slug ?? record.displayName ?? record.name))
  if (!id) return null
  const name = str(record.displayName ?? record.user_name ?? record.name ?? record.channelLogin ?? id) || id
  const viewers = number(record.viewers ?? record.viewer_count ?? record.viewerCount)
  return {
    id,
    name,
    title: str(record.title),
    url: `https://www.twitch.tv/${id}`,
    viewers,
  }
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
