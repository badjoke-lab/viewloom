import type { Env } from '../_db/env'

export type StoredHeatmapItem = {
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number
}

export type SnapshotWriteInput = {
  provider: 'twitch'
  bucketMinute: string
  collectedAt: string
  coveredPages: number
  hasMore: boolean
  items: StoredHeatmapItem[]
  sourceMode: string
}

export async function writeSnapshot(env: Env, input: SnapshotWriteInput): Promise<{
  streamCount: number
  totalViewers: number
}> {
  const streamCount = input.items.length
  const totalViewers = input.items.reduce((sum, item) => sum + item.viewers, 0)
  const payload = JSON.stringify({
    provider: input.provider,
    bucketMinute: input.bucketMinute,
    items: input.items,
  })

  await env.DB_TWITCH_HOT.batch([
    env.DB_TWITCH_HOT.prepare(
      `
      INSERT INTO minute_snapshots (
        provider,
        bucket_minute,
        collected_at,
        covered_pages,
        has_more,
        stream_count,
        total_viewers,
        payload_json,
        source_mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider, bucket_minute) DO UPDATE SET
        collected_at = excluded.collected_at,
        covered_pages = excluded.covered_pages,
        has_more = excluded.has_more,
        stream_count = excluded.stream_count,
        total_viewers = excluded.total_viewers,
        payload_json = excluded.payload_json,
        source_mode = excluded.source_mode
      `,
    ).bind(
      input.provider,
      input.bucketMinute,
      input.collectedAt,
      input.coveredPages,
      input.hasMore ? 1 : 0,
      streamCount,
      totalViewers,
      payload,
      input.sourceMode,
    ),
    env.DB_TWITCH_HOT.prepare(
      `
      INSERT INTO collector_runs (
        provider,
        run_at,
        bucket_minute,
        status,
        error_text,
        stream_count,
        total_viewers,
        covered_pages,
        has_more
      ) VALUES (?, ?, ?, 'ok', NULL, ?, ?, ?, ?)
      `,
    ).bind(
      input.provider,
      input.collectedAt,
      input.bucketMinute,
      streamCount,
      totalViewers,
      input.coveredPages,
      input.hasMore ? 1 : 0,
    ),
    env.DB_TWITCH_HOT.prepare(
      `
      UPDATE collector_status
      SET
        status = 'ok',
        last_attempt_at = ?,
        last_success_at = ?,
        last_error = NULL,
        latest_bucket_minute = ?,
        latest_collected_at = ?,
        latest_stream_count = ?,
        latest_total_viewers = ?,
        covered_pages = ?,
        has_more = ?,
        updated_at = ?
      WHERE provider = ?
      `,
    ).bind(
      input.collectedAt,
      input.collectedAt,
      input.bucketMinute,
      input.collectedAt,
      streamCount,
      totalViewers,
      input.coveredPages,
      input.hasMore ? 1 : 0,
      input.collectedAt,
      input.provider,
    ),
  ])

  return { streamCount, totalViewers }
}

export async function markCollectorAttempt(env: Env, provider: 'twitch', attemptedAt: string): Promise<void> {
  await env.DB_TWITCH_HOT.prepare(
    `
    UPDATE collector_status
    SET
      status = 'running',
      last_attempt_at = ?,
      updated_at = ?
    WHERE provider = ?
    `,
  )
    .bind(attemptedAt, attemptedAt, provider)
    .run()
}

export async function markCollectorFailure(
  env: Env,
  provider: 'twitch',
  attemptedAt: string,
  errorText: string,
): Promise<void> {
  await env.DB_TWITCH_HOT.batch([
    env.DB_TWITCH_HOT.prepare(
      `
      INSERT INTO collector_runs (
        provider,
        run_at,
        bucket_minute,
        status,
        error_text,
        stream_count,
        total_viewers,
        covered_pages,
        has_more
      ) VALUES (?, ?, NULL, 'error', ?, 0, 0, 0, 0)
      `,
    ).bind(provider, attemptedAt, errorText),
    env.DB_TWITCH_HOT.prepare(
      `
      UPDATE collector_status
      SET
        status = 'error',
        last_attempt_at = ?,
        last_failure_at = ?,
        last_error = ?,
        updated_at = ?
      WHERE provider = ?
      `,
    ).bind(attemptedAt, attemptedAt, errorText, attemptedAt, provider),
  ])
}

export async function readLatestSnapshotItems(env: Env, provider: 'twitch'): Promise<StoredHeatmapItem[]> {
  const row = await env.DB_TWITCH_HOT.prepare(
    `
    SELECT payload_json
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 1
    `,
  )
    .bind(provider)
    .first<{ payload_json: string }>()

  if (!row?.payload_json) return []

  try {
    const parsed = JSON.parse(row.payload_json) as { items?: StoredHeatmapItem[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

export function floorToBucketMinute(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z')
  }
  date.setUTCSeconds(0, 0)
  return date.toISOString().replace(/\.\d{3}Z$/, '.000Z')
}
