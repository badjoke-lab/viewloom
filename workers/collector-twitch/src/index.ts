type Env = {
  DB_TWITCH_HOT: D1Database
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
  TWITCH_INGEST_TOKEN?: string
}

type StoredHeatmapItem = {
  channelLogin: string
  displayName: string
  viewers: number
  momentum: number
  activity: number
}

type TwitchTokenResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
}

type TwitchStreamsResponse = {
  data?: Array<{
    user_login?: string
    user_name?: string
    viewer_count?: number
    started_at?: string
  }>
  pagination?: {
    cursor?: string
  }
}

type LatestSnapshot = {
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  covered_pages: number
  has_more: number
  source_mode: string
  payload_json: string
}

const PROVIDER = 'twitch'
const PAGE_SIZE = 100
const MAX_PAGES = 3
const TWITCH_BUCKET_MINUTES = 5

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return json({ ok: true, provider: PROVIDER, storage: 'DB_TWITCH_HOT / vl_twitch_hot' })
    }

    if (url.pathname === '/status') {
      return json(await statusPayload(env))
    }

    if (url.pathname === '/collect' && request.method === 'POST') {
      const gate = checkToken(request, env)
      if (!gate.ok) return json({ ok: false, error: gate.error }, 401)
      return json(await collectWithFailureMarking(env))
    }

    return json({
      ok: false,
      error: 'not_found',
      routes: ['GET /health', 'GET /status', 'POST /collect'],
    }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await collectWithFailureMarking(env)
  },
}

async function collectWithFailureMarking(env: Env) {
  const attemptedAt = new Date().toISOString()
  await markCollectorAttempt(env, attemptedAt)

  try {
    const result = await collectTwitch(env)
    return { ok: true, result }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await markCollectorFailure(env, attemptedAt, message)
    return { ok: false, error: message }
  }
}

async function collectTwitch(env: Env) {
  const accessToken = await getAppAccessToken(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET)
  const previousItems = await readLatestSnapshotItems(env)
  const previousMap = new Map(previousItems.map((item) => [item.channelLogin, item]))
  const { items, coveredPages, hasMore } = await collectTopStreams(env.TWITCH_CLIENT_ID || '', accessToken, previousMap)

  if (!items.length) throw new Error('twitch_streams_empty')

  const collectedAt = new Date().toISOString()
  const bucketMinute = floorToBucketMinute(collectedAt)
  const written = await writeSnapshot(env, {
    bucketMinute,
    collectedAt,
    coveredPages,
    hasMore,
    items,
    sourceMode: 'real',
  })
  const rollupRefresh = await maybeRefreshDailyRollups(env)

  return {
    provider: PROVIDER,
    sourceMode: 'real',
    bucketMinute,
    bucketMinutes: TWITCH_BUCKET_MINUTES,
    collectedAt,
    streamCount: written.streamCount,
    totalViewers: written.totalViewers,
    coveredPages,
    hasMore,
    rollupRefresh,
  }
}

async function statusPayload(env: Env) {
  const latest = await latestSnapshot(env)
  const payload = safePayload(latest?.payload_json)
  return {
    ok: true,
    provider: PROVIDER,
    storage: 'DB_TWITCH_HOT / vl_twitch_hot',
    expectedBucketMinutes: TWITCH_BUCKET_MINUTES,
    latest,
    payloadBucketMinute: text(payload?.bucketMinute),
    payloadBucketMinutes: numOrNull(payload?.bucketMinutes),
    bucketAligned: latest ? isAligned(latest.bucket_minute, TWITCH_BUCKET_MINUTES) : false,
    rows: await countRows(env),
    notes: [
      'Cloudflare Worker collector for Twitch.',
      'This replaces the old GitHub Actions collector after manual collect and cron verification.',
      latest ? `latest_bucket_minute=${latest.bucket_minute}` : 'latest_bucket_minute=none',
    ],
  }
}

async function getAppAccessToken(clientId: string | undefined, clientSecret: string | undefined): Promise<string> {
  if (!clientId || !clientSecret) throw new Error('twitch_credentials_missing')

  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')

  const response = await fetch(url.toString(), { method: 'POST' })
  if (!response.ok) throw new Error(`twitch_token_http_${response.status}`)

  const data = await response.json() as TwitchTokenResponse
  if (!data.access_token) throw new Error('twitch_token_missing')
  return data.access_token
}

async function collectTopStreams(
  clientId: string,
  accessToken: string,
  previousMap: Map<string, StoredHeatmapItem>,
): Promise<{ items: StoredHeatmapItem[]; coveredPages: number; hasMore: boolean }> {
  const items: StoredHeatmapItem[] = []
  let cursor = ''
  let coveredPages = 0
  let hasMore = false

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('https://api.twitch.tv/helix/streams')
    url.searchParams.set('first', String(PAGE_SIZE))
    if (cursor) url.searchParams.set('after', cursor)

    const response = await fetch(url.toString(), {
      headers: {
        'Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

    const data = await response.json() as TwitchStreamsResponse
    const pageItems = Array.isArray(data.data) ? data.data : []
    coveredPages += 1

    for (const stream of pageItems) {
      const channelLogin = String(stream.user_login ?? '').trim()
      const displayName = String(stream.user_name ?? '').trim()
      const viewers = clampInt(stream.viewer_count)
      if (!channelLogin || !displayName || viewers <= 0) continue

      const previous = previousMap.get(channelLogin)
      const previousViewers = previous?.viewers ?? viewers
      const momentumBase = previousViewers > 0 ? (viewers - previousViewers) / previousViewers : 0
      const startedAt = stream.started_at ? new Date(stream.started_at) : null
      const ageHours = startedAt && !Number.isNaN(startedAt.getTime())
        ? Math.max(0, (Date.now() - startedAt.getTime()) / 3_600_000)
        : 0
      const ageActivity = ageHours > 0 ? Math.max(0.04, Math.min(1, 1 / Math.max(1, ageHours))) : 0.12

      items.push({
        channelLogin,
        displayName,
        viewers,
        momentum: clampNumber(momentumBase),
        activity: clampNumber(ageActivity),
      })
    }

    cursor = String(data.pagination?.cursor ?? '').trim()
    if (!cursor) {
      hasMore = false
      break
    }

    hasMore = true
  }

  return { items, coveredPages, hasMore }
}

async function writeSnapshot(
  env: Env,
  input: {
    bucketMinute: string
    collectedAt: string
    coveredPages: number
    hasMore: boolean
    items: StoredHeatmapItem[]
    sourceMode: string
  },
): Promise<{ streamCount: number; totalViewers: number }> {
  const streamCount = input.items.length
  const totalViewers = input.items.reduce((sum, item) => sum + item.viewers, 0)
  const payload = JSON.stringify({
    provider: PROVIDER,
    bucketMinute: input.bucketMinute,
    bucketMinutes: TWITCH_BUCKET_MINUTES,
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
      PROVIDER,
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
      PROVIDER,
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
      PROVIDER,
    ),
  ])

  return { streamCount, totalViewers }
}

async function markCollectorAttempt(env: Env, attemptedAt: string): Promise<void> {
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
    .bind(attemptedAt, attemptedAt, PROVIDER)
    .run()
}

async function markCollectorFailure(env: Env, attemptedAt: string, errorText: string): Promise<void> {
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
    ).bind(PROVIDER, attemptedAt, errorText),
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
    ).bind(attemptedAt, attemptedAt, errorText, attemptedAt, PROVIDER),
  ])
}

async function readLatestSnapshotItems(env: Env): Promise<StoredHeatmapItem[]> {
  const row = await env.DB_TWITCH_HOT.prepare(
    `
    SELECT payload_json
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 1
    `,
  )
    .bind(PROVIDER)
    .first<{ payload_json: string }>()

  if (!row?.payload_json) return []

  try {
    const parsed = JSON.parse(row.payload_json) as { items?: StoredHeatmapItem[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

async function latestSnapshot(env: Env): Promise<LatestSnapshot | null> {
  return await env.DB_TWITCH_HOT.prepare(
    'SELECT bucket_minute,collected_at,stream_count,total_viewers,covered_pages,has_more,source_mode,payload_json FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1',
  ).bind(PROVIDER).first()
}

async function countRows(env: Env): Promise<number> {
  const row = await env.DB_TWITCH_HOT.prepare(
    'SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider = ?',
  ).bind(PROVIDER).first<{ count: number }>()
  return Number(row?.count ?? 0)
}

function floorToBucketMinute(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return floorDateToBucketMinute(new Date())
  return floorDateToBucketMinute(date)
}

function floorDateToBucketMinute(date: Date): string {
  const copy = new Date(date)
  copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / TWITCH_BUCKET_MINUTES) * TWITCH_BUCKET_MINUTES, 0, 0)
  return copy.toISOString().replace(/\.\d{3}Z$/, '.000Z')
}

function checkToken(request: Request, env: Env): { ok: true } | { ok: false; error: string } {
  if (!env.TWITCH_INGEST_TOKEN) return { ok: true }
  const auth = request.headers.get('authorization')
  const token = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : request.headers.get('x-ingest-token')?.trim()
  if (token && token === env.TWITCH_INGEST_TOKEN) return { ok: true }
  return { ok: false, error: 'unauthorized' }
}

function safePayload(value: string | undefined): Record<string, unknown> | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function isAligned(value: string, bucketMinutes: number): boolean {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0 && date.getUTCMinutes() % bucketMinutes === 0
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function numOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function clampInt(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n))
}

function clampNumber(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(-0.99, Math.min(9.99, n))
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}


type RollupRefreshResult = {
  refreshed: boolean
  day?: string
  error?: string
}

async function maybeRefreshDailyRollups(env: Env): Promise<RollupRefreshResult> {
  const now = new Date()
  if (!shouldRunDailyRollupRefresh(now)) return { refreshed: false }

  const today = dayString(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(now.getUTCDate() - 1)
  const yesterday = dayString(yesterdayDate)

  try {
    await refreshDailyRollup(env, today)
    await refreshDailyRollup(env, yesterday)
    return { refreshed: true, day: today }
  } catch (error) {
    return {
      refreshed: false,
      day: today,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function shouldRunDailyRollupRefresh(now: Date): boolean {
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return (hour === 0 || hour === 12) && minute >= 20 && minute < 25
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function refreshDailyRollup(env: Env, day: string): Promise<void> {
  await env.DB_TWITCH_HOT.prepare(ROLLUP_SQL).bind(PROVIDER, day, PROVIDER, day).run()
}

const ROLLUP_SQL = `
INSERT INTO daily_rollups (
  provider,
  day,
  total_viewer_minutes,
  peak_viewers,
  peak_streamer_id,
  peak_streamer_name,
  observed_snapshots,
  observed_stream_count,
  top_streamers_json,
  coverage_state,
  source_mode,
  updated_at
)
WITH daily AS (
  SELECT
    provider,
    substr(bucket_minute, 1, 10) AS day,
    SUM(total_viewers * 5) AS total_viewer_minutes,
    MAX(total_viewers) AS peak_viewers,
    COUNT(*) AS observed_snapshots,
    MAX(stream_count) AS observed_stream_count,
    SUM(CASE WHEN source_mode IN ('demo', 'fixture') THEN 1 ELSE 0 END) AS demo_rows
  FROM minute_snapshots
  WHERE provider = ? AND substr(bucket_minute, 1, 10) = ?
  GROUP BY provider, substr(bucket_minute, 1, 10)
),
stream_rows AS (
  SELECT
    m.provider,
    substr(m.bucket_minute, 1, 10) AS day,
    LOWER(REPLACE(COALESCE(
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id'),
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name')
    ), ' ', '-')) AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    CAST(COALESCE(
      json_extract(j.value, '$.viewers'),
      json_extract(j.value, '$.viewer_count'),
      json_extract(j.value, '$.viewerCount')
    ) AS INTEGER) AS viewers
  FROM minute_snapshots m, json_each(m.payload_json, '$.items') j
  WHERE m.provider = ? AND substr(m.bucket_minute, 1, 10) = ?
),
stream_totals AS (
  SELECT
    provider,
    day,
    streamer_id,
    MAX(display_name) AS display_name,
    SUM(viewers * 5) AS viewer_minutes,
    MAX(viewers) AS peak_viewers,
    COUNT(*) * 5 AS observed_minutes
  FROM stream_rows
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
  GROUP BY provider, day, streamer_id
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY provider, day ORDER BY viewer_minutes DESC, peak_viewers DESC, streamer_id ASC) AS viewer_rank,
    ROW_NUMBER() OVER (PARTITION BY provider, day ORDER BY peak_viewers DESC, viewer_minutes DESC, streamer_id ASC) AS peak_rank
  FROM stream_totals
),
top_json AS (
  SELECT
    provider,
    day,
    json_group_array(json_object(
      'streamerId', streamer_id,
      'displayName', display_name,
      'viewerMinutes', viewer_minutes,
      'peakViewers', peak_viewers,
      'observedMinutes', observed_minutes,
      'rankByViewerMinutes', viewer_rank,
      'rankByPeak', peak_rank
    )) AS top_streamers_json
  FROM ranked
  WHERE viewer_rank <= 30
  GROUP BY provider, day
),
peak AS (
  SELECT provider, day, streamer_id, display_name
  FROM ranked
  WHERE peak_rank = 1
)
SELECT
  d.provider,
  d.day,
  d.total_viewer_minutes,
  d.peak_viewers,
  p.streamer_id,
  p.display_name,
  d.observed_snapshots,
  d.observed_stream_count,
  COALESCE(t.top_streamers_json, '[]'),
  CASE
    WHEN d.demo_rows > 0 THEN 'demo'
    WHEN d.observed_snapshots >= 240 THEN 'good'
    WHEN d.observed_snapshots >= 60 THEN 'partial'
    ELSE 'poor'
  END,
  CASE WHEN d.demo_rows > 0 THEN 'demo' ELSE 'real' END,
  datetime('now')
FROM daily d
LEFT JOIN top_json t ON t.provider = d.provider AND t.day = d.day
LEFT JOIN peak p ON p.provider = d.provider AND p.day = d.day
ON CONFLICT(provider, day) DO UPDATE SET
  total_viewer_minutes = excluded.total_viewer_minutes,
  peak_viewers = excluded.peak_viewers,
  peak_streamer_id = excluded.peak_streamer_id,
  peak_streamer_name = excluded.peak_streamer_name,
  observed_snapshots = excluded.observed_snapshots,
  observed_stream_count = excluded.observed_stream_count,
  top_streamers_json = excluded.top_streamers_json,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  updated_at = excluded.updated_at
`
