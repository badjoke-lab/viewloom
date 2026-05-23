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

type HeatmapItem = {
  id: string
  name: string
  title: string
  viewers: number
  momentum: number
  activity: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
  url: string
}

type State = 'not_ready' | 'empty' | 'stale' | 'live' | 'error'

type PayloadMeta = {
  bucketMinutes: number | null
  payloadBucketMinute: string | null
}

const STALE_AFTER_MS = 10 * 60 * 1000
const EXPECTED_BUCKET_MINUTES = 5
const ACTIVITY_UNAVAILABLE_REASON = 'chat_sampling_not_connected'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
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

    const meta = latest ? payloadMeta(latest.payload_json) : { bucketMinutes: null, payloadBucketMinute: null }
    const items = latest ? normalizeItems(latest.payload_json) : []
    const updatedAt = latest?.collected_at || latest?.bucket_minute || status?.latest_collected_at || status?.latest_bucket_minute || new Date().toISOString()
    const stale = Date.now() - new Date(updatedAt).getTime() > STALE_AFTER_MS
    const state: State = !latest ? 'empty' : items.length === 0 ? 'empty' : stale ? 'stale' : 'live'
    const hasMore = Boolean(latest?.has_more ?? status?.has_more)
    const coveredPages = latest?.covered_pages ?? status?.covered_pages ?? 0
    const streamCount = latest?.stream_count ?? status?.latest_stream_count ?? items.length
    const totalViewers = latest?.total_viewers ?? status?.latest_total_viewers ?? items.reduce((sum, item) => sum + item.viewers, 0)
    const bucketAligned = latest ? isAligned(latest.bucket_minute, EXPECTED_BUCKET_MINUTES) : false
    const ingestFreshnessWarning = warnings(state, latest, meta, bucketAligned)

    return Response.json({
      ok: true,
      source: 'api',
      provider: 'twitch',
      platform: 'twitch',
      state,
      status: state,
      updatedAt,
      valueMode: 'viewers',
      targetSource: 'twitch-helix-streams',
      coverageMode: hasMore ? 'partial-top-pages' : 'observed-top-pages',
      expectedBucketMinutes: EXPECTED_BUCKET_MINUTES,
      bucketMinutes: meta.bucketMinutes,
      payloadBucketMinute: meta.payloadBucketMinute,
      bucketAligned,
      ingestFreshnessWarning,
      activityAvailable: false,
      activitySampled: false,
      activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
      items,
      coverageNote: latest
        ? `${items.length} normalized Twitch streams from latest observed snapshot. covered_pages=${coveredPages}. has_more=${hasMore ? 1 : 0}.`
        : 'No Twitch snapshots exist in DB_TWITCH_HOT yet.',
      notes: [
        'storage=DB_TWITCH_HOT',
        `source_mode=${latest?.source_mode || 'unknown'}`,
        `bucket_minute=${latest?.bucket_minute || 'none'}`,
        `payload_bucket_minute=${meta.payloadBucketMinute || 'none'}`,
        `bucket_minutes=${meta.bucketMinutes ?? 'unknown'}`,
        `expected_bucket_minutes=${EXPECTED_BUCKET_MINUTES}`,
        `bucket_aligned=${bucketAligned}`,
        ...ingestFreshnessWarning.map((item) => `warning=${item}`),
        `covered_pages=${coveredPages}`,
        `has_more=${hasMore ? 1 : 0}`,
        `stream_count=${streamCount}`,
        `total_viewers=${totalViewers}`,
        'target_source=twitch-helix-streams',
        `coverage_mode=${hasMore ? 'partial-top-pages' : 'observed-top-pages'}`,
        'activity_available=false',
        `activity_unavailable_reason=${ACTIVITY_UNAVAILABLE_REASON}`,
      ],
      latest,
      collectorStatus: status,
      // Backward-compatible alias for older callers.
      statusRecord: status,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return Response.json({
      ok: false,
      source: 'api',
      provider: 'twitch',
      platform: 'twitch',
      state: 'error',
      status: 'error',
      updatedAt: new Date().toISOString(),
      valueMode: 'viewers',
      targetSource: 'twitch-helix-streams',
      coverageMode: 'unknown',
      expectedBucketMinutes: EXPECTED_BUCKET_MINUTES,
      bucketMinutes: null,
      payloadBucketMinute: null,
      bucketAligned: false,
      ingestFreshnessWarning: ['api_read_error'],
      activityAvailable: false,
      activitySampled: false,
      activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
      items: [] as HeatmapItem[],
      coverageNote: 'Twitch Heatmap API could not read DB_TWITCH_HOT snapshots.',
      notes: [error instanceof Error ? error.message : String(error)],
      latest: null,
      collectorStatus: null,
      statusRecord: null,
    }, { status: 500, headers: { 'cache-control': 'no-store' } })
  }
}

function normalizeItems(payloadJson: string): HeatmapItem[] {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(item).filter((value): value is HeatmapItem => value !== null)
}

function payloadMeta(payloadJson: string): PayloadMeta {
  const parsed = safeJson(payloadJson)
  const record = object(parsed)
  const rawBucketMinutes = record?.bucketMinutes
  const bucketMinutes = typeof rawBucketMinutes === 'number' && Number.isFinite(rawBucketMinutes) ? rawBucketMinutes : null
  const payloadBucketMinute = str(record?.bucketMinute) || null
  return { bucketMinutes, payloadBucketMinute }
}

function warnings(state: State, latest: SnapshotRow | null, meta: PayloadMeta, bucketAligned: boolean): string[] {
  const result: string[] = []
  if (!latest) return ['no_twitch_snapshot']
  if (state === 'stale') result.push('twitch_collector_stale')
  if (!bucketAligned) result.push('latest_bucket_not_5m_aligned')
  if (meta.bucketMinutes !== EXPECTED_BUCKET_MINUTES) result.push('payload_bucket_minutes_missing_or_not_5')
  if (meta.payloadBucketMinute && latest.bucket_minute !== meta.payloadBucketMinute) result.push('row_and_payload_bucket_mismatch')
  return result
}

function isAligned(value: string, bucketMinutes: number): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0 && date.getUTCMinutes() % bucketMinutes === 0
}

function item(raw: unknown): HeatmapItem | null {
  const record = object(raw)
  if (!record) return null
  const id = slugify(str(record.channelLogin ?? record.id ?? record.login ?? record.user_login ?? record.name))
  const name = str(record.displayName ?? record.name ?? record.user_name ?? record.channelLogin ?? id)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount)
  if (!id || viewers <= 0) return null
  return {
    id,
    name: name || id,
    title: str(record.title ?? record.streamTitle ?? record.gameName),
    viewers,
    momentum: number(record.momentum),
    activity: 0,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    url: str(record.url) || `https://www.twitch.tv/${id}`,
  }
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function number(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(-9999, Math.min(9999, value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(-9999, Math.min(9999, parsed)) : 0
  }
  return 0
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
