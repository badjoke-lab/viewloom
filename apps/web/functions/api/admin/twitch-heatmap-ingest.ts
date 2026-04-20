import type { Env } from '../../_db/env'

type IngestItem = {
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number
}

type IngestBody = {
  provider?: string
  bucketMinute?: string
  collectedAt?: string
  coveredPages?: number
  hasMore?: boolean
  items?: IngestItem[]
  sourceMode?: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = readToken(request)
  if (!token || token !== env.INGEST_TOKEN) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: IngestBody
  try {
    body = (await request.json()) as IngestBody
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const provider = body.provider ?? 'twitch'
  if (provider !== 'twitch') {
    return Response.json({ ok: false, error: 'provider_must_be_twitch' }, { status: 400 })
  }

  const items = Array.isArray(body.items) ? sanitizeItems(body.items) : []
  if (!items.length) {
    return Response.json({ ok: false, error: 'items_required' }, { status: 400 })
  }

  const collectedAt = normalizeIso(body.collectedAt) ?? new Date().toISOString()
  const bucketMinute = normalizeBucketMinute(body.bucketMinute, collectedAt)
  const coveredPages = clampInt(body.coveredPages ?? 1)
  const hasMore = body.hasMore ? 1 : 0
  const totalViewers = items.reduce((sum, item) => sum + item.viewers, 0)
  const sourceMode = body.sourceMode?.trim() || 'manual'
  const payload = JSON.stringify({
    provider,
    bucketMinute,
    items,
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
      provider,
      bucketMinute,
      collectedAt,
      coveredPages,
      hasMore,
      items.length,
      totalViewers,
      payload,
      sourceMode,
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
    ).bind(provider, collectedAt, bucketMinute, items.length, totalViewers, coveredPages, hasMore),
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
      collectedAt,
      collectedAt,
      bucketMinute,
      collectedAt,
      items.length,
      totalViewers,
      coveredPages,
      hasMore,
      collectedAt,
      provider,
    ),
  ])

  return Response.json({
    ok: true,
    provider,
    bucketMinute,
    collectedAt,
    streamCount: items.length,
    totalViewers,
    sourceMode,
  })
}

function readToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return request.headers.get('x-ingest-token')?.trim() ?? null
}

function sanitizeItems(items: IngestItem[]): IngestItem[] {
  return items
    .map((item) => ({
      channelLogin: String(item.channelLogin ?? '').trim(),
      displayName: String(item.displayName ?? '').trim(),
      viewers: clampInt(item.viewers),
      momentum: clampNumber(item.momentum),
      activity: clampNumber(item.activity),
    }))
    .filter((item) => item.channelLogin && item.displayName && item.viewers >= 0)
}

function normalizeIso(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function normalizeBucketMinute(value: string | undefined, fallbackIso: string): string {
  const date = value ? new Date(value) : new Date(fallbackIso)
  if (Number.isNaN(date.getTime())) {
    return new Date(fallbackIso).toISOString().replace(/:\d{2}\.\d{3}Z$/, ':00.000Z')
  }
  date.setUTCSeconds(0, 0)
  return date.toISOString().replace(/\.\d{3}Z$/, '.000Z')
}

function clampInt(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n))
}

function clampNumber(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(-9999, Math.min(9999, n))
}
