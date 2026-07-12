type Env = {
  DB: D1Database
  PROVIDER: 'twitch' | 'kick'
  STREAMER_CAP: string
  PROBE_WRITE_ROWS: string
  BUCKET_MINUTES: string
  PROBE_TOKEN: string
}

type RollupRow = {
  streamer_id: string
  display_name: string
  daily_rank: number
  total_viewer_minutes: number
  peak_viewers: number
  sample_count: number
  observed_minutes: number
  hourly_json: string
  candidate_streamers: number
}

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
}

const PROBE_DAY = '1900-01-01'
const PROBE_PREFIX = '__viewloom_cost_probe__:'
const CONTRACT_VERSION = 'analytics-source-v1'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!authorized(request, env.PROBE_TOKEN)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/run') {
      const result = await runProbe(env)
      return Response.json(result, {
        status: result.ok ? 200 : 500,
        headers: { 'cache-control': 'no-store' },
      })
    }

    if (request.method === 'POST' && url.pathname === '/cleanup') {
      const cleanup = await cleanupProbeRows(env)
      const ok = cleanup.remainingRows === 0
      return Response.json({ ok, provider: env.PROVIDER, cleanup }, {
        status: ok ? 200 : 500,
        headers: { 'cache-control': 'no-store' },
      })
    }

    return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  },
}

async function runProbe(env: Env) {
  const startedAt = Date.now()
  let cleanup: Awaited<ReturnType<typeof cleanupProbeRows>> | null = null

  try {
    const streamerCap = boundedInt(env.STREAMER_CAP, env.PROVIDER === 'twitch' ? 600 : 200, 1, 1000)
    const probeWriteRows = boundedInt(env.PROBE_WRITE_ROWS, 25, 1, 40)
    const bucketMinutes = boundedInt(env.BUCKET_MINUTES, 5, 1, 60)

    const initialCleanup = await cleanupProbeRows(env)
    if (initialCleanup.remainingRows !== 0) throw new Error('initial_probe_cleanup_incomplete')

    const dayResult = await env.DB.prepare(`
      SELECT substr(bucket_minute, 1, 10) AS day, COUNT(*) AS source_snapshots
      FROM minute_snapshots
      WHERE provider = ?
        AND substr(bucket_minute, 1, 10) < substr(datetime('now'), 1, 10)
      GROUP BY substr(bucket_minute, 1, 10)
      ORDER BY day DESC
      LIMIT 1
    `).bind(env.PROVIDER).all<{ day: string; source_snapshots: number }>()

    const target = dayResult.results?.[0]
    if (!target?.day || Number(target.source_snapshots) <= 0) throw new Error('complete_source_day_unavailable')

    const aggregateStartedAt = Date.now()
    const aggregateResult = await env.DB.prepare(INTRADAY_AGGREGATE_SQL)
      .bind(
        env.PROVIDER,
        target.day,
        bucketMinutes,
        bucketMinutes,
        streamerCap,
        bucketMinutes,
      )
      .all<RollupRow>()
    const aggregateWallMs = round(Date.now() - aggregateStartedAt, 2)
    const rows = Array.isArray(aggregateResult.results) ? aggregateResult.results : []
    if (!rows.length) throw new Error('intraday_aggregate_empty')

    const sampleRows = rows.slice(0, Math.min(probeWriteRows, rows.length))
    const expectedProbeRows = sampleRows.length + 1
    const updatedAt = new Date().toISOString()
    const writeBatch = buildWriteBatch(
      env,
      sampleRows,
      target.day,
      streamerCap,
      Number(target.source_snapshots),
      updatedAt,
    )

    const firstStartedAt = Date.now()
    const firstResults = await env.DB.batch(writeBatch)
    const firstWallMs = round(Date.now() - firstStartedAt, 2)
    const countAfterFirst = await countProbeRows(env)

    const secondStartedAt = Date.now()
    const secondResults = await env.DB.batch(writeBatch)
    const secondWallMs = round(Date.now() - secondStartedAt, 2)
    const countAfterSecond = await countProbeRows(env)

    cleanup = await cleanupProbeRows(env)

    const firstMeta = summarizeMeta(firstResults)
    const secondMeta = summarizeMeta(secondResults)
    const candidateStreamers = Number(rows[0]?.candidate_streamers ?? rows.length)

    return {
      ok: true,
      schemaVersion: 'viewloom-12a3-execution-cost-probe-v1',
      provider: env.PROVIDER,
      observedAt: new Date().toISOString(),
      source: {
        day: target.day,
        sourceSnapshots: Number(target.source_snapshots),
        bucketMinutes,
        streamerCap,
        candidateStreamers,
        retainedCandidateRows: rows.length,
      },
      query: {
        dayResolution: summarizeMeta([dayResult]),
        aggregate: summarizeMeta([aggregateResult]),
        aggregateWallMs,
        resultRows: rows.length,
        serializedResultBytes: new TextEncoder().encode(JSON.stringify(rows)).byteLength,
      },
      writeProbe: {
        reservedDay: PROBE_DAY,
        requestedRows: probeWriteRows,
        sampledRows: sampleRows.length,
        expectedRetainedRows: expectedProbeRows,
        firstPass: { ...firstMeta, wallMs: firstWallMs, retainedRows: countAfterFirst },
        secondPass: { ...secondMeta, wallMs: secondWallMs, retainedRows: countAfterSecond },
        idempotentRowCount:
          countAfterFirst === expectedProbeRows
          && countAfterSecond === countAfterFirst,
        cleanup,
      },
      projections: {
        fullCapRows: streamerCap,
        projectedFirstPassRowsRead: project(firstMeta.rowsRead, sampleRows.length, streamerCap),
        projectedFirstPassRowsWritten: project(firstMeta.rowsWritten, sampleRows.length, streamerCap),
        projectedFirstPassDurationMs: project(firstMeta.durationMs, sampleRows.length, streamerCap),
        projectedFirstPassWallMs: project(firstWallMs, sampleRows.length, streamerCap),
      },
      totalWorkerWallMs: round(Date.now() - startedAt, 2),
      boundaries: {
        productionGenerationStarted: false,
        probeRowsRetained: cleanup.remainingRows,
        sourceRowsModified: false,
        rawRetentionChanged: false,
        newCronAdded: false,
        crossProviderOperation: false,
      },
    }
  } catch (error) {
    try {
      cleanup = await cleanupProbeRows(env)
    } catch {
      cleanup = null
    }
    return {
      ok: false,
      schemaVersion: 'viewloom-12a3-execution-cost-probe-v1',
      provider: env.PROVIDER,
      observedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      cleanup,
      totalWorkerWallMs: round(Date.now() - startedAt, 2),
      boundaries: {
        productionGenerationStarted: false,
        sourceRowsModified: false,
        rawRetentionChanged: false,
        newCronAdded: false,
        crossProviderOperation: false,
      },
    }
  }
}

function buildWriteBatch(
  env: Env,
  rows: RollupRow[],
  sourceDay: string,
  streamerCap: number,
  sourceSnapshots: number,
  updatedAt: string,
): D1PreparedStatement[] {
  const statements = rows.map((row) => env.DB.prepare(`
    INSERT INTO streamer_intraday_rollups (
      provider, day, streamer_id, display_name, daily_rank,
      total_viewer_minutes, peak_viewers, sample_count, observed_minutes,
      hourly_json, selection_state, source_mode, contract_version, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cost_probe', 'cost-probe', ?, ?)
    ON CONFLICT(provider, day, streamer_id) DO UPDATE SET
      display_name = excluded.display_name,
      daily_rank = excluded.daily_rank,
      total_viewer_minutes = excluded.total_viewer_minutes,
      peak_viewers = excluded.peak_viewers,
      sample_count = excluded.sample_count,
      observed_minutes = excluded.observed_minutes,
      hourly_json = excluded.hourly_json,
      selection_state = excluded.selection_state,
      source_mode = excluded.source_mode,
      contract_version = excluded.contract_version,
      updated_at = excluded.updated_at
  `).bind(
    env.PROVIDER,
    PROBE_DAY,
    `${PROBE_PREFIX}${row.streamer_id}`,
    row.display_name,
    Number(row.daily_rank),
    Number(row.total_viewer_minutes),
    Number(row.peak_viewers),
    Number(row.sample_count),
    Number(row.observed_minutes),
    row.hourly_json,
    CONTRACT_VERSION,
    updatedAt,
  ))

  statements.push(env.DB.prepare(`
    INSERT INTO intraday_rollup_status (
      provider, day, candidate_streamers, retained_streamers,
      retained_streamer_cap, source_snapshots, selection_state,
      coverage_state, source_mode, contract_version, refreshed_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'cost_probe', ?, 'cost-probe', ?, ?)
    ON CONFLICT(provider, day) DO UPDATE SET
      candidate_streamers = excluded.candidate_streamers,
      retained_streamers = excluded.retained_streamers,
      retained_streamer_cap = excluded.retained_streamer_cap,
      source_snapshots = excluded.source_snapshots,
      selection_state = excluded.selection_state,
      coverage_state = excluded.coverage_state,
      source_mode = excluded.source_mode,
      contract_version = excluded.contract_version,
      refreshed_at = excluded.refreshed_at
  `).bind(
    env.PROVIDER,
    PROBE_DAY,
    Number(rows[0]?.candidate_streamers ?? rows.length),
    rows.length,
    streamerCap,
    sourceSnapshots,
    `cost_probe_from_${sourceDay}`,
    CONTRACT_VERSION,
    updatedAt,
  ))

  return statements
}

async function cleanupProbeRows(env: Env) {
  const startedAt = Date.now()
  const results = await env.DB.batch([
    env.DB.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day = ? AND selection_state = 'cost_probe'
    `).bind(env.PROVIDER, PROBE_DAY),
    env.DB.prepare(`
      DELETE FROM intraday_rollup_status
      WHERE provider = ? AND day = ? AND selection_state = 'cost_probe'
    `).bind(env.PROVIDER, PROBE_DAY),
  ])
  return {
    ...summarizeMeta(results),
    wallMs: round(Date.now() - startedAt, 2),
    remainingRows: await countProbeRows(env),
  }
}

async function countProbeRows(env: Env): Promise<number> {
  const row = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM streamer_intraday_rollups WHERE provider = ? AND day = ? AND selection_state = 'cost_probe')
      +
      (SELECT COUNT(*) FROM intraday_rollup_status WHERE provider = ? AND day = ? AND selection_state = 'cost_probe')
      AS count
  `).bind(env.PROVIDER, PROBE_DAY, env.PROVIDER, PROBE_DAY).first<{ count: number }>()
  return Number(row?.count ?? 0)
}

function summarizeMeta(results: Array<{ meta?: unknown }>): MetaSummary {
  const summary = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
  for (const result of results) {
    const meta = (result?.meta ?? {}) as Record<string, unknown>
    summary.durationMs += numeric(meta.duration)
    summary.rowsRead += numeric(meta.rows_read)
    summary.rowsWritten += numeric(meta.rows_written)
    summary.changes += numeric(meta.changes)
  }
  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function project(value: number, sampledRows: number, fullRows: number): number | null {
  if (!Number.isFinite(value) || sampledRows <= 0 || fullRows <= 0) return null
  return round((value / sampledRows) * fullRows, 2)
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function boundedInt(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, Math.floor(parsed)))
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const INTRADAY_AGGREGATE_SQL = `
WITH stream_rows AS (
  SELECT
    CAST(strftime('%H', m.bucket_minute) AS INTEGER) AS hour,
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
valid AS (
  SELECT * FROM stream_rows
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
),
totals AS (
  SELECT
    streamer_id,
    MAX(display_name) AS display_name,
    SUM(viewers * ?) AS total_viewer_minutes,
    MAX(viewers) AS peak_viewers,
    COUNT(*) AS sample_count,
    COUNT(*) * ? AS observed_minutes
  FROM valid
  GROUP BY streamer_id
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      ORDER BY total_viewer_minutes DESC, peak_viewers DESC, streamer_id ASC
    ) AS daily_rank,
    COUNT(*) OVER () AS candidate_streamers
  FROM totals
),
selected AS (
  SELECT * FROM ranked WHERE daily_rank <= ?
),
hourly AS (
  SELECT
    v.streamer_id,
    v.hour,
    SUM(v.viewers * ?) AS viewer_minutes,
    MAX(v.viewers) AS peak_viewers,
    COUNT(*) AS sample_count
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  GROUP BY v.streamer_id, v.hour
),
hourly_ordered AS (
  SELECT * FROM hourly ORDER BY streamer_id, hour
),
hourly_json AS (
  SELECT
    streamer_id,
    json_group_array(json_object(
      'hour', hour,
      'viewerMinutes', viewer_minutes,
      'peakViewers', peak_viewers,
      'sampleCount', sample_count
    )) AS hourly_json
  FROM hourly_ordered
  GROUP BY streamer_id
)
SELECT
  s.streamer_id,
  s.display_name,
  s.daily_rank,
  s.total_viewer_minutes,
  s.peak_viewers,
  s.sample_count,
  s.observed_minutes,
  COALESCE(h.hourly_json, '[]') AS hourly_json,
  s.candidate_streamers
FROM selected s
LEFT JOIN hourly_json h ON h.streamer_id = s.streamer_id
ORDER BY s.daily_rank
`
