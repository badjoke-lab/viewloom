export type IntradayProvider = 'twitch' | 'kick'

export type IntradayGenerationConfig = {
  provider: IntradayProvider
  streamerCap: number
  bucketMinutes: number
  enabled: boolean
}

type PrecheckRow = {
  source_snapshots: number
  candidate_streamers: number
  source_mode: string
}

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
}

export type IntradayGenerationDayResult = {
  day: string
  sourceSnapshots: number
  candidateStreamers: number
  retainedStreamers: number
  selectionState: 'complete_within_daily_cap' | 'capped_at_daily_limit'
  coverageState: 'good' | 'partial' | 'poor'
  sourceMode: string
  precheck: MetaSummary
  writeBatch: MetaSummary
  workerWallMs: number
}

export type IntradayGenerationResult = {
  provider: IntradayProvider
  enabled: boolean
  attempted: boolean
  maintenanceWindow: boolean
  reason?: 'disabled' | 'outside_maintenance_window'
  days?: IntradayGenerationDayResult[]
  retentionCleanup?: MetaSummary & { attempted: boolean }
  totals?: MetaSummary & {
    sourceSnapshots: number
    candidateStreamers: number
    retainedStreamers: number
    workerWallMs: number
    maximumQueries: number
  }
  error?: string
}

const CONTRACT_VERSION = 'analytics-source-v1'
const INTRADAY_RETENTION_DAYS = 90
const MAX_GENERATOR_QUERIES = 12

export async function maybeGenerateIntradayRollups(
  db: D1Database,
  config: IntradayGenerationConfig,
  now = new Date(),
): Promise<IntradayGenerationResult> {
  if (!config.enabled) {
    return {
      provider: config.provider,
      enabled: false,
      attempted: false,
      maintenanceWindow: shouldRunIntradayGeneration(now),
      reason: 'disabled',
    }
  }

  if (!shouldRunIntradayGeneration(now)) {
    return {
      provider: config.provider,
      enabled: true,
      attempted: false,
      maintenanceWindow: false,
      reason: 'outside_maintenance_window',
    }
  }

  const startedAt = Date.now()
  const days: IntradayGenerationDayResult[] = []

  try {
    for (const day of targetDays(now)) {
      const result = await refreshIntradayDay(db, config, day)
      if (result) days.push(result)
    }

    const retentionCleanup = shouldRunIntradayRetentionCleanup(now)
      ? await cleanupIntradayRetention(db, config.provider)
      : { attempted: false, statements: 0, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }

    const totals = summarizeDayResults(days, retentionCleanup, Date.now() - startedAt)
    return {
      provider: config.provider,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      days,
      retentionCleanup,
      totals: {
        ...totals,
        maximumQueries: MAX_GENERATOR_QUERIES,
      },
    }
  } catch (error) {
    return {
      provider: config.provider,
      enabled: true,
      attempted: true,
      maintenanceWindow: true,
      days,
      error: sanitizeError(error),
    }
  }
}

export function shouldRunIntradayGeneration(now: Date): boolean {
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return (hour === 0 || hour === 12) && minute >= 20 && minute < 25
}

export function intradayGenerationEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true'
}

async function refreshIntradayDay(
  db: D1Database,
  config: IntradayGenerationConfig,
  day: string,
): Promise<IntradayGenerationDayResult | null> {
  const startedAt = Date.now()
  const precheckResult = await db.prepare(PRECHECK_SQL)
    .bind(config.provider, day)
    .all<PrecheckRow>()
  const precheck = summarizeMeta([precheckResult])
  const row = precheckResult.results?.[0]
  const sourceSnapshots = integer(row?.source_snapshots)

  if (sourceSnapshots <= 0) return null

  const candidateStreamers = integer(row?.candidate_streamers)
  const retainedStreamers = Math.min(candidateStreamers, config.streamerCap)
  const selectionState = candidateStreamers > config.streamerCap
    ? 'capped_at_daily_limit'
    : 'complete_within_daily_cap'
  const coverageState = sourceSnapshots >= 240
    ? 'good'
    : sourceSnapshots >= 60
      ? 'partial'
      : 'poor'
  const sourceMode = normalizeSourceMode(row?.source_mode)
  const updatedAt = new Date().toISOString()

  const writeResults = await db.batch([
    db.prepare(`
      UPDATE streamer_intraday_rollups
      SET selection_state = 'refresh_pending'
      WHERE provider = ? AND day = ?
    `).bind(config.provider, day),
    db.prepare(UPSERT_STREAMER_ROLLUPS_SQL).bind(
      config.provider,
      day,
      config.bucketMinutes,
      config.bucketMinutes,
      config.streamerCap,
      config.bucketMinutes,
      config.provider,
      day,
      selectionState,
      sourceMode,
      CONTRACT_VERSION,
      updatedAt,
    ),
    db.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day = ? AND selection_state = 'refresh_pending'
    `).bind(config.provider, day),
    db.prepare(`
      INSERT INTO intraday_rollup_status (
        provider,
        day,
        candidate_streamers,
        retained_streamers,
        retained_streamer_cap,
        source_snapshots,
        selection_state,
        coverage_state,
        source_mode,
        contract_version,
        refreshed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      config.provider,
      day,
      candidateStreamers,
      retainedStreamers,
      config.streamerCap,
      sourceSnapshots,
      selectionState,
      coverageState,
      sourceMode,
      CONTRACT_VERSION,
      updatedAt,
    ),
  ])

  return {
    day,
    sourceSnapshots,
    candidateStreamers,
    retainedStreamers,
    selectionState,
    coverageState,
    sourceMode,
    precheck,
    writeBatch: summarizeMeta(writeResults),
    workerWallMs: round(Date.now() - startedAt, 2),
  }
}

async function cleanupIntradayRetention(
  db: D1Database,
  provider: IntradayProvider,
): Promise<MetaSummary & { attempted: boolean }> {
  const results = await db.batch([
    db.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day < date('now', ?)
    `).bind(provider, `-${INTRADAY_RETENTION_DAYS} days`),
    db.prepare(`
      DELETE FROM intraday_rollup_status
      WHERE provider = ? AND day < date('now', ?)
    `).bind(provider, `-${INTRADAY_RETENTION_DAYS} days`),
  ])
  return { attempted: true, ...summarizeMeta(results) }
}

function shouldRunIntradayRetentionCleanup(now: Date): boolean {
  return now.getUTCHours() === 0 && now.getUTCMinutes() >= 20 && now.getUTCMinutes() < 25
}

function targetDays(now: Date): [string, string] {
  const today = dayString(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  return [today, dayString(yesterdayDate)]
}

function summarizeDayResults(
  days: IntradayGenerationDayResult[],
  retention: MetaSummary,
  workerWallMs: number,
): MetaSummary & {
  sourceSnapshots: number
  candidateStreamers: number
  retainedStreamers: number
  workerWallMs: number
} {
  const summary = {
    statements: retention.statements,
    durationMs: retention.durationMs,
    rowsRead: retention.rowsRead,
    rowsWritten: retention.rowsWritten,
    changes: retention.changes,
    sourceSnapshots: 0,
    candidateStreamers: 0,
    retainedStreamers: 0,
    workerWallMs: round(workerWallMs, 2),
  }

  for (const day of days) {
    summary.statements += day.precheck.statements + day.writeBatch.statements
    summary.durationMs += day.precheck.durationMs + day.writeBatch.durationMs
    summary.rowsRead += day.precheck.rowsRead + day.writeBatch.rowsRead
    summary.rowsWritten += day.precheck.rowsWritten + day.writeBatch.rowsWritten
    summary.changes += day.precheck.changes + day.writeBatch.changes
    summary.sourceSnapshots += day.sourceSnapshots
    summary.candidateStreamers += day.candidateStreamers
    summary.retainedStreamers += day.retainedStreamers
  }

  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function summarizeMeta(results: Array<{ meta?: unknown }>): MetaSummary {
  const summary = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0 }
  for (const result of results) {
    const meta = (result?.meta ?? {}) as Record<string, unknown>
    summary.durationMs += numeric(meta.duration)
    summary.rowsRead += integer(meta.rows_read)
    summary.rowsWritten += integer(meta.rows_written)
    summary.changes += integer(meta.changes)
  }
  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function normalizeSourceMode(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || 'unknown'
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

const STREAMER_ID_SQL = `LOWER(REPLACE(COALESCE(
  json_extract(j.value, '$.channelLogin'),
  json_extract(j.value, '$.slug'),
  json_extract(j.value, '$.id'),
  json_extract(j.value, '$.displayName'),
  json_extract(j.value, '$.name')
), ' ', '-'))`

const VIEWERS_SQL = `CAST(COALESCE(
  json_extract(j.value, '$.viewers'),
  json_extract(j.value, '$.viewer_count'),
  json_extract(j.value, '$.viewerCount')
) AS INTEGER)`

const PRECHECK_SQL = `
WITH source AS (
  SELECT payload_json, source_mode
  FROM minute_snapshots
  WHERE provider = ? AND substr(bucket_minute, 1, 10) = ?
),
streamers AS (
  SELECT ${STREAMER_ID_SQL} AS streamer_id, ${VIEWERS_SQL} AS viewers
  FROM source s, json_each(s.payload_json, '$.items') j
),
valid AS (
  SELECT streamer_id
  FROM streamers
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
)
SELECT
  (SELECT COUNT(*) FROM source) AS source_snapshots,
  (SELECT COUNT(DISTINCT streamer_id) FROM valid) AS candidate_streamers,
  CASE
    WHEN (SELECT COUNT(DISTINCT source_mode) FROM source) = 1
      THEN COALESCE((SELECT MIN(source_mode) FROM source), 'unknown')
    WHEN (SELECT COUNT(*) FROM source) > 0 THEN 'mixed'
    ELSE 'unknown'
  END AS source_mode
`

const UPSERT_STREAMER_ROLLUPS_SQL = `
INSERT INTO streamer_intraday_rollups (
  provider,
  day,
  streamer_id,
  display_name,
  daily_rank,
  total_viewer_minutes,
  peak_viewers,
  sample_count,
  observed_minutes,
  hourly_json,
  selection_state,
  source_mode,
  contract_version,
  updated_at
)
WITH stream_rows AS (
  SELECT
    CAST(strftime('%H', m.bucket_minute) AS INTEGER) AS hour,
    ${STREAMER_ID_SQL} AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    ${VIEWERS_SQL} AS viewers
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
    ) AS daily_rank
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
  ?,
  ?,
  s.streamer_id,
  s.display_name,
  s.daily_rank,
  s.total_viewer_minutes,
  s.peak_viewers,
  s.sample_count,
  s.observed_minutes,
  COALESCE(h.hourly_json, '[]'),
  ?,
  ?,
  ?,
  ?
FROM selected s
LEFT JOIN hourly_json h ON h.streamer_id = s.streamer_id
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
`
