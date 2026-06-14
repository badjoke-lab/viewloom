import type { Env } from '../_db/env'
import { fromRaw, fromRollups, type ParsedStream } from '../_history/builders'
import { buildPayload, dayCount, errorResponse, getPeriod, nextDayIso, num, previousPeriod, record, slug, type RollupRow, type SnapshotRow } from '../_history/model'

const kickMeta = { targetSource: 'unknown', coverageMode: 'unknown' }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)
  const rangeError = validateRequestedRange(url)
  if (rangeError) return errorResponse('kick', period, metric, 'invalid_range', rangeError, 400, { ...kickMeta, sampleWeightMode: 'observed_interval_capped_5m' })
  if (dayCount(period.from, period.to) > 90) return errorResponse('kick', period, metric, 'range_too_large', 'History custom range is limited to 90 days in v1.', 400, { ...kickMeta, sampleWeightMode: 'observed_interval_capped_5m' })

  try {
    const previous = previousPeriod(period.from, period.to)
    const rollups = await tryRollups(env, period.from, period.to)
    if (rollups.length > 0) {
      const previousRollups = await tryRollups(env, previous.from, previous.to)
      return Response.json(buildPayload('kick', period, metric, 'daily_rollups', fromRollups(rollups, previousRollups), { ...kickMeta, sampleWeightMode: 'daily_rollups_5m' }), { headers: { 'cache-control': 'no-store' } })
    }
    const rows = await fetchRows(env, period.from, period.to)
    const previousRows = await fetchRows(env, previous.from, previous.to)
    return Response.json(buildPayload('kick', period, metric, 'minute_snapshots', fromRaw(rows, previousRows, parseKickStream, ['demo', 'fixture']), { ...kickMeta, sampleWeightMode: 'observed_interval_capped_5m' }), { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return errorResponse('kick', period, metric, 'history_api_error', error instanceof Error ? error.message : 'History API failed.', 500, { ...kickMeta, sampleWeightMode: 'observed_interval_capped_5m' })
  }
}

async function tryRollups(env: Env, from: string, to: string): Promise<RollupRow[]> {
  try {
    const result = await env.DB_KICK_HOT.prepare(`SELECT day,total_viewer_minutes,peak_viewers,peak_streamer_name,observed_snapshots,observed_stream_count,top_streamers_json,coverage_state FROM daily_rollups WHERE provider = ? AND day >= ? AND day <= ? ORDER BY day ASC`).bind('kick', from, to).all<RollupRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

async function fetchRows(env: Env, from: string, to: string): Promise<SnapshotRow[]> {
  const result = await env.DB_KICK_HOT.prepare(`SELECT bucket_minute,total_viewers,stream_count,payload_json,source_mode FROM minute_snapshots WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ? ORDER BY bucket_minute ASC`).bind('kick', `${from}T00:00:00.000Z`, nextDayIso(to)).all<SnapshotRow>()
  return result.results ?? []
}

function parseKickStream(item: Record<string, unknown>): ParsedStream | null {
  const channel = record(item.channel) ? item.channel : null
  const live = record(item.livestream) ? item.livestream : null
  const rawId = item.channelLogin ?? item.slug ?? item.username ?? item.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name
  const rawName = item.displayName ?? item.name ?? item.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? rawId
  const viewers = num(item.viewers ?? item.viewer_count ?? item.viewerCount ?? live?.viewer_count)
  const id = slug(rawId ?? rawName ?? '')
  if (!id || viewers <= 0) return null
  return { id, displayName: String(rawName ?? id), viewers }
}

function validateRequestedRange(url: URL): string | null {
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  if (!from && !to) return null
  if (!from || !to) return 'Both dates are required for a custom History range.'
  if (!isCalendarDay(from) || !isCalendarDay(to)) return 'History range dates must use valid YYYY-MM-DD calendar dates.'
  if (from > to) return 'History range start must be on or before the end date.'
  if (to > new Date().toISOString().slice(0, 10)) return 'History range cannot extend beyond today.'
  return null
}

function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}
