import type { Env } from '../_db/env'

type SnapshotRow = {
  provider: string
  bucket_minute: string
  collected_at: string
  covered_pages: number
  has_more: number
  stream_count: number
  total_viewers: number
  payload_json: string
  source_mode: string
}

type StatusRow = {
  provider: string
  status: string
  last_attempt_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_error: string | null
  latest_bucket_minute: string | null
  latest_collected_at: string | null
  latest_stream_count: number
  latest_total_viewers: number
  covered_pages: number
  has_more: number
  updated_at: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const latest = await env.DB_TWITCH_HOT.prepare(
    `
    SELECT
      provider,
      bucket_minute,
      collected_at,
      covered_pages,
      has_more,
      stream_count,
      total_viewers,
      payload_json,
      source_mode
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 1
    `
  )
    .bind('twitch')
    .first<SnapshotRow>()

  const status = await env.DB_TWITCH_HOT.prepare(
    `
    SELECT
      provider,
      status,
      last_attempt_at,
      last_success_at,
      last_failure_at,
      last_error,
      latest_bucket_minute,
      latest_collected_at,
      latest_stream_count,
      latest_total_viewers,
      covered_pages,
      has_more,
      updated_at
    FROM collector_status
    WHERE provider = ?
    LIMIT 1
    `
  )
    .bind('twitch')
    .first<StatusRow>()

  return Response.json({
    ok: true,
    provider: 'twitch',
    latest,
    status,
  })
}
