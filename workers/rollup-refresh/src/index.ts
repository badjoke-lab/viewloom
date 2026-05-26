type Env = {
  DB_TWITCH_HOT: D1Database
  DB_KICK_HOT: D1Database
}

type Provider = 'twitch' | 'kick'

type RefreshResult = {
  provider: Provider
  day: string
  ok: boolean
  error?: string
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshAll(env))
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        ok: true,
        service: 'viewloom-rollup-refresh',
        mode: 'free-strong',
        schedules: ['20 0 * * *', '20 12 * * *'],
      })
    }

    if (request.method === 'POST' && url.pathname === '/refresh') {
      const results = await refreshAll(env)
      return Response.json({
        ok: results.every((result) => result.ok),
        generatedAt: new Date().toISOString(),
        results,
      })
    }

    return Response.json({
      ok: false,
      error: 'not_found',
      routes: ['GET /health', 'POST /refresh'],
    }, { status: 404 })
  },
}

async function refreshAll(env: Env): Promise<RefreshResult[]> {
  const days = targetDays()
  const jobs: Array<Promise<RefreshResult>> = []

  for (const day of days) {
    jobs.push(refreshDay(env.DB_TWITCH_HOT, 'twitch', day))
    jobs.push(refreshDay(env.DB_KICK_HOT, 'kick', day))
  }

  return Promise.all(jobs)
}

function targetDays(): string[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setUTCDate(today.getUTCDate() - 1)
  return [dayString(today), dayString(yesterday)]
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function refreshDay(db: D1Database, provider: Provider, day: string): Promise<RefreshResult> {
  try {
    await db.prepare(ROLLUP_SQL).bind(provider, day, provider, day).run()
    return { provider, day, ok: true }
  } catch (error) {
    return {
      provider,
      day,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
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
