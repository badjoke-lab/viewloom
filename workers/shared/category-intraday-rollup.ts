import type {
  IntradayGenerationConfig,
  IntradayProvider,
} from './intraday-rollup'
import { shouldRunIntradayGeneration } from './intraday-rollup'
import { CATEGORY_CONTRACT_VERSION } from './category-capture'

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

type CategoryDayResult = {
  day: string
  sourceSnapshots: number
  candidateStreamers: number
  retainedStreamers: number
  selectionState: 'complete_within_daily_cap' | 'capped_at_daily_limit'
  coverageState: 'good' | 'partial' | 'poor'
  categoryCoverageState: 'observed' | 'missing_from_source' | 'unavailable'
  sourceMode: string
  precheck: MetaSummary
  writeBatch: MetaSummary
  workerWallMs: number
}

export type CategoryIntradayGenerationResult = {
  provider: IntradayProvider
  enabled: true
  attempted: boolean
  maintenanceWindow: boolean
  reason?: 'outside_maintenance_window'
  categoryContractVersion: typeof CATEGORY_CONTRACT_VERSION
  days?: CategoryDayResult[]
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

const ANALYTICS_CONTRACT_VERSION = 'analytics-source-v1'
const INTRADAY_RETENTION_DAYS = 90
const MAX_GENERATOR_QUERIES = 12

export async function maybeGenerateCategoryIntradayRollups(
  db: D1Database,
  config: IntradayGenerationConfig,
  now = new Date(),
): Promise<CategoryIntradayGenerationResult> {
  if (!shouldRunIntradayGeneration(now)) {
    return {
      provider: config.provider,
      enabled: true,
      attempted: false,
      maintenanceWindow: false,
      reason: 'outside_maintenance_window',
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
    }
  }

  const startedAt = Date.now()
  const days: CategoryDayResult[] = []

  try {
    for (const day of targetDays(now)) {
      const result = await refreshCategoryIntradayDay(db, config, day)
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
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
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
      categoryContractVersion: CATEGORY_CONTRACT_VERSION,
      days,
      error: sanitizeError(error),
    }
  }
}

async function refreshCategoryIntradayDay(
  db: D1Database,
  config: IntradayGenerationConfig,
  day: string,
): Promise<CategoryDayResult | null> {
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
    db.prepare(CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL).bind(
      config.provider,
      day,
      config.bucketMinutes,
      config.bucketMinutes,
      config.streamerCap,
      config.bucketMinutes,
      config.bucketMinutes,
      config.provider,
      day,
      selectionState,
      sourceMode,
      ANALYTICS_CONTRACT_VERSION,
      updatedAt,
      CATEGORY_CONTRACT_VERSION,
    ),
    db.prepare(`
      DELETE FROM streamer_intraday_rollups
      WHERE provider = ? AND day = ? AND selection_state = 'refresh_pending'
    `).bind(config.provider, day),
    db.prepare(CATEGORY_STATUS_UPSERT_SQL).bind(
      config.provider,
      day,
      candidateStreamers,
      retainedStreamers,
      config.streamerCap,
      sourceSnapshots,
      selectionState,
      coverageState,
      sourceMode,
      ANALYTICS_CONTRACT_VERSION,
      updatedAt,
      config.provider,
      day,
    ),
  ])

  const categorySummary = await db.prepare(`
    SELECT
      category_observed_samples,
      category_missing_samples,
      category_coverage_state
    FROM intraday_rollup_status
    WHERE provider = ? AND day = ?
  `).bind(config.provider, day).first<{
    category_observed_samples: number
    category_missing_samples: number
    category_coverage_state: CategoryDayResult['categoryCoverageState']
  }>()

  return {
    day,
    sourceSnapshots,
    candidateStreamers,
    retainedStreamers,
    selectionState,
    coverageState,
    categoryCoverageState: categorySummary?.category_coverage_state ?? 'unavailable',
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
  days: CategoryDayResult[],
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

export const CATEGORY_UPSERT_STREAMER_ROLLUPS_SQL = `
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
  category_hourly_json,
  category_observed_samples,
  category_missing_samples,
  category_contract_version,
  selection_state,
  source_mode,
  contract_version,
  updated_at
)
WITH RECURSIVE
hours(hour) AS (
  SELECT 0
  UNION ALL
  SELECT hour + 1 FROM hours WHERE hour < 23
),
raw_items AS (
  SELECT
    m.payload_json,
    CAST(strftime('%H', m.bucket_minute) AS INTEGER) AS hour,
    ${STREAMER_ID_SQL} AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    ${VIEWERS_SQL} AS viewers,
    CAST(j.key AS INTEGER) AS item_index,
    CAST(json_extract(
      m.payload_json,
      '$.categoryRefs[' || CAST(j.key AS TEXT) || ']'
    ) AS INTEGER) AS category_ref,
    json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version
  FROM minute_snapshots m, json_each(m.payload_json, '$.items') j
  WHERE m.provider = ? AND substr(m.bucket_minute, 1, 10) = ?
),
stream_rows AS (
  SELECT
    r.hour,
    r.streamer_id,
    r.display_name,
    r.viewers,
    CASE
      WHEN r.category_contract_version = '${CATEGORY_CONTRACT_VERSION}'
       AND r.category_ref IS NOT NULL
       AND r.category_ref >= 0
      THEN CAST(json_extract(
        r.payload_json,
        '$.categoryIds[' || CAST(r.category_ref AS TEXT) || ']'
      ) AS TEXT)
      ELSE NULL
    END AS category_id
  FROM raw_items r
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
),
category_stats AS (
  SELECT
    v.streamer_id,
    v.hour,
    v.category_id,
    MAX(d.category_name) AS category_name,
    COUNT(*) AS sample_count,
    SUM(v.viewers * ?) AS viewer_minutes
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  LEFT JOIN provider_category_dictionary d
    ON d.provider = ? AND d.category_id = v.category_id
  WHERE v.category_id IS NOT NULL AND v.category_id != ''
  GROUP BY v.streamer_id, v.hour, v.category_id
),
category_ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY streamer_id, hour
      ORDER BY sample_count DESC, viewer_minutes DESC, category_id ASC
    ) AS category_rank
  FROM category_stats
),
dominant AS (
  SELECT * FROM category_ranked WHERE category_rank = 1
),
used_categories AS (
  SELECT DISTINCT streamer_id, category_id, category_name
  FROM dominant
),
category_indexed AS (
  SELECT
    streamer_id,
    category_id,
    category_name,
    ROW_NUMBER() OVER (
      PARTITION BY streamer_id ORDER BY category_id ASC
    ) - 1 AS category_index
  FROM used_categories
),
category_dictionary_ordered AS (
  SELECT * FROM category_indexed ORDER BY streamer_id, category_index
),
category_dictionary AS (
  SELECT
    streamer_id,
    json_group_array(json_object(
      'id', category_id,
      'name', category_name
    )) AS category_json
  FROM category_dictionary_ordered
  GROUP BY streamer_id
),
category_hours AS (
  SELECT
    s.streamer_id,
    h.hour,
    ci.category_index,
    COALESCE(d.sample_count, 0) AS sample_count,
    COALESCE(d.viewer_minutes, 0) AS viewer_minutes
  FROM selected s
  CROSS JOIN hours h
  LEFT JOIN dominant d
    ON d.streamer_id = s.streamer_id AND d.hour = h.hour
  LEFT JOIN category_indexed ci
    ON ci.streamer_id = d.streamer_id AND ci.category_id = d.category_id
  ORDER BY s.streamer_id, h.hour
),
category_arrays AS (
  SELECT
    streamer_id,
    json_group_array(category_index) AS refs_json,
    json_group_array(sample_count) AS samples_json,
    json_group_array(viewer_minutes) AS minutes_json
  FROM category_hours
  GROUP BY streamer_id
),
category_counts AS (
  SELECT
    v.streamer_id,
    SUM(CASE WHEN v.category_id IS NOT NULL AND v.category_id != '' THEN 1 ELSE 0 END) AS observed_samples,
    SUM(CASE WHEN v.category_id IS NULL OR v.category_id = '' THEN 1 ELSE 0 END) AS missing_samples
  FROM valid v
  INNER JOIN selected s ON s.streamer_id = v.streamer_id
  GROUP BY v.streamer_id
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
  json_object(
    'v', 1,
    'c', json(COALESCE(cd.category_json, '[]')),
    'r', json(COALESCE(ca.refs_json, '[]')),
    's', json(COALESCE(ca.samples_json, '[]')),
    'm', json(COALESCE(ca.minutes_json, '[]')),
    'o', COALESCE(cc.observed_samples, 0),
    'x', COALESCE(cc.missing_samples, 0)
  ),
  COALESCE(cc.observed_samples, 0),
  COALESCE(cc.missing_samples, 0),
  CASE WHEN COALESCE(cc.observed_samples, 0) > 0 THEN ? ELSE 'unavailable' END,
  ?,
  ?,
  ?,
  ?
FROM selected s
LEFT JOIN hourly_json h ON h.streamer_id = s.streamer_id
LEFT JOIN category_dictionary cd ON cd.streamer_id = s.streamer_id
LEFT JOIN category_arrays ca ON ca.streamer_id = s.streamer_id
LEFT JOIN category_counts cc ON cc.streamer_id = s.streamer_id
ON CONFLICT(provider, day, streamer_id) DO UPDATE SET
  display_name = excluded.display_name,
  daily_rank = excluded.daily_rank,
  total_viewer_minutes = excluded.total_viewer_minutes,
  peak_viewers = excluded.peak_viewers,
  sample_count = excluded.sample_count,
  observed_minutes = excluded.observed_minutes,
  hourly_json = excluded.hourly_json,
  category_hourly_json = excluded.category_hourly_json,
  category_observed_samples = excluded.category_observed_samples,
  category_missing_samples = excluded.category_missing_samples,
  category_contract_version = excluded.category_contract_version,
  selection_state = excluded.selection_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  updated_at = excluded.updated_at
`

const CATEGORY_STATUS_UPSERT_SQL = `
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
  refreshed_at,
  category_observed_streamers,
  category_observed_samples,
  category_missing_samples,
  category_coverage_state
)
SELECT
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
  COUNT(CASE WHEN category_observed_samples > 0 THEN 1 END),
  COALESCE(SUM(category_observed_samples), 0),
  COALESCE(SUM(category_missing_samples), 0),
  CASE
    WHEN COALESCE(SUM(category_observed_samples), 0) = 0
     AND COALESCE(SUM(category_missing_samples), 0) = 0 THEN 'unavailable'
    WHEN COALESCE(SUM(category_missing_samples), 0) > 0 THEN 'missing_from_source'
    ELSE 'observed'
  END
FROM streamer_intraday_rollups
WHERE provider = ? AND day = ?
ON CONFLICT(provider, day) DO UPDATE SET
  candidate_streamers = excluded.candidate_streamers,
  retained_streamers = excluded.retained_streamers,
  retained_streamer_cap = excluded.retained_streamer_cap,
  source_snapshots = excluded.source_snapshots,
  selection_state = excluded.selection_state,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  contract_version = excluded.contract_version,
  refreshed_at = excluded.refreshed_at,
  category_observed_streamers = excluded.category_observed_streamers,
  category_observed_samples = excluded.category_observed_samples,
  category_missing_samples = excluded.category_missing_samples,
  category_coverage_state = excluded.category_coverage_state
`
