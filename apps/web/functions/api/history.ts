import type { Env } from '../_db/env'
import { fromRaw, fromRollups, type ParsedStream } from '../_history/builders'
import { buildPayload, dayCount, errorResponse, getPeriod, nextDayIso, num, previousPeriod, slug, type RollupRow, type SnapshotRow } from '../_history/model'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const metric = url.searchParams.get('metric') === 'peak_viewers' ? 'peak_viewers' : 'viewer_minutes'
  const period = getPeriod(url)
  if (dayCount(period.from, period.to) > 90) return errorResponse('twitch', period, metric, 'range_too_large', 'History custom range is limited to 90 days in v1.', 400)

  try {
    const previous = previousPeriod(period.from, period.to)
    const rollups = await tryRollups(env, period.from, period.to)
    if (rollups.length > 0) {
      const previousRollups = await tryRollups(env, previous.from, previous.to)
      return Response.json(buildPayload('twitch', period, metric, 'daily_rollups', fromRollups(rollups, previousRollups)), { headers: { 'cache-control': 'no-store' } })
    }
    const rows = await fetchRows(env, period.from, period.to)
    const previousRows = await fetchRows(env, previous.from, previous.to)
    return Response.json(buildPayload('twitch', period, metric, 'minute_snapshots', fromRaw(rows, previousRows, parseTwitchStream, ['demo'])), { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return errorResponse('twitch', period, metric, 'history_api_error', error instanceof Error ? error.message : 'History API failed.', 500)
  }
}

async function tryRollups(env: Env, from: string, to: string): Promise<RollupRow[]> {
  try {
    const result = await env.DB_TWITCH_HOT.prepare(`SELECT day,total_viewer_minutes,peak_viewers,peak_streamer_name,observed_snapshots,observed_stream_count,top_streamers_json,coverage_state FROM daily_rollups WHERE provider = ? AND day >= ? AND day <= ? ORDER BY day ASC`).bind('twitch', from, to).all<RollupRow>()
    return result.results ?? []
  } catch {
    return []
  }
}

async function fetchRows(env: Env, from: string, to: string): Promise<SnapshotRow[]> {
  const result = await env.DB_TWITCH_HOT.prepare(`SELECT bucket_minute,total_viewers,stream_count,payload_json,source_mode FROM minute_snapshots WHERE provider = ? AND bucket_minute >= ? AND bucket_minute < ? ORDER BY bucket_minute ASC`).bind('twitch', `${from}T00:00:00.000Z`, nextDayIso(to)).all<SnapshotRow>()
  return result.results ?? []
}

function parseTwitchStream(item: Record<string, unknown>): ParsedStream | null {
  const id = slug(item.channelLogin ?? item.displayName)
  const viewers = num(item.viewers)
  if (!id || viewers <= 0) return null
  return { id, displayName: String(item.displayName ?? item.channelLogin ?? id), viewers }
}
