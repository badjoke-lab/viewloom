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

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
  source_mode: string
}

const MAX_ROWS = 1800

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const now = new Date()
  const top = normalizeTop(url.searchParams.get('top'))
  const requestedBucket = normalizeRequestedBucket(url.searchParams.get('bucket'))
  const metric = normalizeMetric(url.searchParams.get('metric'))
  const period = buildBattlePeriod(url, now)
  const options = {
    platform: 'kick' as const,
    top,
    requestedBucket,
    metric,
    period,
    now,
    sampleIntervalMinutes: 5,
  }

  try {
    const rows = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ?
      ORDER BY bucket_minute ASC
      LIMIT ${MAX_ROWS}
    `).bind('kick', period.from, period.to).all<SnapshotRow>()

    const sourceRows: BattleSourceRow[] = (rows.results ?? []).map((row) => ({
      bucketMinute: row.bucket_minute,
      collectedAt: row.collected_at,
      sourceMode: row.source_mode,
      items: readItems(row.payload_json),
    }))
    const latestPayload = rows.results?.at(-1)?.payload_json ?? ''
    const meta = collectorMeta(latestPayload)
    const payload = buildBattleLinesPayload(sourceRows, options)
    return Response.json({
      ...payload,
      targetSource: str(meta?.targetSource) || 'unknown',
      coverageMode: str(meta?.coverageMode) || 'unknown',
      notes: [
        ...payload.notes,
        `${sourceRows.length} provider=kick snapshot rows read from DB_KICK_HOT.`,
        `target_source=${str(meta?.targetSource) || 'unknown'}`,
        `coverage_mode=${str(meta?.coverageMode) || 'unknown'}`,
      ],
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kick Battle Lines API failed.'
    const payload = buildBattleLinesPayload([], options)
    return Response.json({
      ...payload,
      state: 'error',
      status: 'error',
      targetSource: 'unknown',
      coverageMode: 'unknown',
      error: { code: 'kick_battle_lines_api_error', message },
      notes: [...payload.notes, 'Kick Battle Lines could not read DB_KICK_HOT snapshots.'],
    }, { status: 500, headers: { 'cache-control': 'no-store' } })
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
  const channel = object(record.channel)
  const live = object(record.livestream)
  const rawId = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const id = slug(rawId || str(record.displayName ?? record.name))
  if (!id) return null
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? id) || id
  const viewers = number(record.viewers ?? record.viewer_count ?? record.viewerCount ?? live?.viewer_count)
  return {
    id,
    name,
    title: str(record.title ?? record.session_title ?? record.stream_title ?? live?.session_title),
    url: str(record.url) || `https://kick.com/${id}`,
    viewers,
  }
}

function collectorMeta(payloadJson: string): Record<string, unknown> | null {
  const parsed = safeJson(payloadJson)
  return object(object(parsed)?.collectorMeta)
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
