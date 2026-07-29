import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const PROVIDER = 'twitch'
const DATABASE_NAME = 'vl_twitch_hot'
const CONFIG_PATH = 'workers/collector-twitch/wrangler.category-permanent.toml'
const OUTPUT_DIR = process.env.OUTPUT_DIR
  ?? 'artifacts/12a5-twitch-replacement-audit-checkpoint-failure-diagnosis/run'
const GAP_START = '2026-07-29T06:50:00.000Z'
const GAP_END = '2026-07-29T08:00:00.000Z'
const CHECKPOINT_START = '2026-07-29T05:30:00.000Z'
const CHECKPOINT_END = '2026-07-29T18:20:00.000Z'
const MISSING_BUCKETS = [
  '2026-07-29T07:20:00.000Z',
  '2026-07-29T07:25:00.000Z',
  '2026-07-29T07:30:00.000Z',
]

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

const evidence = {
  schemaVersion: 'viewloom-12a5-twitch-replacement-audit-checkpoint-failure-diagnosis-v1',
  status: 'diagnosis_incomplete',
  phase: '12A-5B-R2',
  trackingIssue: 659,
  provider: PROVIDER,
  observedAt: new Date().toISOString(),
  sourceCheckpoint: {
    workflowRunId: 30478338654,
    checkpointJobId: 90665697236,
    artifactId: 8734980337,
    artifactDigest: 'sha256:4f87868471e297b5b6904d9e8ee6c15c8a2e45f4e16edef0647e2ee4d3f0086b',
  },
  windows: {
    gapContextStartAt: GAP_START,
    gapContextEndExclusiveAt: GAP_END,
    checkpointStartAt: CHECKPOINT_START,
    checkpointEndExclusiveAt: CHECKPOINT_END,
    missingBuckets: MISSING_BUCKETS,
    postCheckpointEndExclusiveAt: null,
  },
  exactMissingBucketPresence: [],
  collectorRunsGapContext: [],
  snapshotsGapContext: [],
  nullRefsByBucket: [],
  nullRefsTopChannels: [],
  checkpointNullRefSummary: null,
  postCheckpointNullRefSummary: null,
  currentCollectorStatus: [],
  staticCodeAttribution: {
    collectorPath: 'workers/collector-twitch/src/index-category.ts',
    encoderPath: 'workers/shared/category-capture.ts',
    helixFields: ['game_id', 'game_name'],
    nullReferenceCondition: 'categoryProviderId or categoryName is empty after trim',
    sourceFieldsStrippedBeforePersistence: true,
    persistenceReindexingAfterEncoding: false,
    postPersistenceIdVsNameDistinctionPossible: false,
  },
  diagnosticLimitations: [
    'Stored items omit categoryProviderId and categoryName after categoryRefs are encoded.',
    'A persisted null categoryRef proves at least one required source field was empty, but cannot distinguish empty game_id from empty game_name.',
    'Read-only diagnosis cannot recreate permanently absent minute snapshots or recover source fields that were not persisted.',
    'This diagnosis does not accept Issue #659, authorize a rerun, relax thresholds, reset the stability clock, or authorize public UI.',
  ],
  error: null,
}

try {
  const latestCompletedBoundary = floorToFiveMinutes(new Date())
  const postEnd = latestCompletedBoundary > CHECKPOINT_END ? latestCompletedBoundary : CHECKPOINT_END
  evidence.windows.postCheckpointEndExclusiveAt = postEnd

  evidence.exactMissingBucketPresence = runD1Select(`
    SELECT
      bucket_minute,
      collected_at,
      stream_count,
      total_viewers,
      covered_pages,
      has_more,
      source_mode,
      json_extract(payload_json, '$.categoryContractVersion') AS category_contract_version,
      json_array_length(json_extract(payload_json, '$.categoryRefs')) AS category_ref_count
    FROM minute_snapshots
    WHERE provider = '${PROVIDER}'
      AND bucket_minute IN (${MISSING_BUCKETS.map(sqlString).join(', ')})
    ORDER BY bucket_minute
  `)

  evidence.collectorRunsGapContext = runD1Select(`
    SELECT
      run_at,
      bucket_minute,
      status,
      CASE
        WHEN error_text IS NULL OR TRIM(error_text) = '' THEN NULL
        ELSE SUBSTR(REPLACE(REPLACE(error_text, char(10), ' '), char(13), ' '), 1, 160)
      END AS sanitized_error,
      stream_count,
      total_viewers,
      covered_pages,
      has_more
    FROM collector_runs
    WHERE provider = '${PROVIDER}'
      AND run_at >= '${GAP_START}'
      AND run_at < '${GAP_END}'
    ORDER BY run_at
  `)

  evidence.snapshotsGapContext = runD1Select(`
    SELECT
      m.bucket_minute,
      m.collected_at,
      m.stream_count,
      m.total_viewers,
      m.covered_pages,
      m.has_more,
      m.source_mode,
      json_extract(m.payload_json, '$.categoryContractVersion') AS category_contract_version,
      json_array_length(json_extract(m.payload_json, '$.categoryIds')) AS category_id_count,
      json_array_length(json_extract(m.payload_json, '$.categoryRefs')) AS category_ref_count,
      (
        SELECT COUNT(*)
        FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type = 'null'
      ) AS null_category_refs
    FROM minute_snapshots AS m
    WHERE m.provider = '${PROVIDER}'
      AND m.bucket_minute >= '${GAP_START}'
      AND m.bucket_minute < '${GAP_END}'
    ORDER BY m.bucket_minute
  `)

  evidence.nullRefsByBucket = runD1Select(`
    SELECT
      m.bucket_minute,
      m.collected_at,
      m.stream_count,
      COUNT(*) AS null_category_refs,
      ROUND(CAST(COUNT(*) AS REAL) / NULLIF(json_array_length(json_extract(m.payload_json, '$.categoryRefs')), 0), 6) AS null_ref_ratio
    FROM minute_snapshots AS m,
      json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
    WHERE m.provider = '${PROVIDER}'
      AND m.bucket_minute >= '${CHECKPOINT_START}'
      AND m.bucket_minute < '${CHECKPOINT_END}'
      AND ref.type = 'null'
    GROUP BY m.bucket_minute, m.collected_at, m.stream_count
    ORDER BY null_category_refs DESC, m.bucket_minute
  `)

  evidence.nullRefsTopChannels = runD1Select(`
    WITH null_streams AS (
      SELECT
        m.bucket_minute,
        LOWER(TRIM(CAST(json_extract(m.payload_json, '$.items[' || ref.key || '].channelLogin') AS TEXT))) AS channel_login,
        TRIM(CAST(json_extract(m.payload_json, '$.items[' || ref.key || '].displayName') AS TEXT)) AS display_name,
        CAST(COALESCE(json_extract(m.payload_json, '$.items[' || ref.key || '].viewers'), 0) AS INTEGER) AS viewers
      FROM minute_snapshots AS m,
        json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
      WHERE m.provider = '${PROVIDER}'
        AND m.bucket_minute >= '${CHECKPOINT_START}'
        AND m.bucket_minute < '${CHECKPOINT_END}'
        AND ref.type = 'null'
    )
    SELECT
      channel_login,
      MAX(display_name) AS display_name,
      COUNT(*) AS null_ref_occurrences,
      COUNT(DISTINCT bucket_minute) AS affected_buckets,
      MIN(bucket_minute) AS first_affected_bucket,
      MAX(bucket_minute) AS latest_affected_bucket,
      MAX(viewers) AS peak_viewers,
      SUM(viewers) AS summed_viewers
    FROM null_streams
    WHERE channel_login IS NOT NULL AND channel_login != ''
    GROUP BY channel_login
    ORDER BY null_ref_occurrences DESC, peak_viewers DESC, channel_login
    LIMIT 100
  `)

  evidence.checkpointNullRefSummary = firstRow(runD1Select(summarySql(CHECKPOINT_START, CHECKPOINT_END)))
  evidence.postCheckpointNullRefSummary = firstRow(runD1Select(summarySql(CHECKPOINT_END, postEnd)))

  evidence.currentCollectorStatus = runD1Select(`
    SELECT
      provider,
      status,
      last_attempt_at,
      last_success_at,
      last_failure_at,
      CASE
        WHEN last_error IS NULL OR TRIM(last_error) = '' THEN NULL
        ELSE SUBSTR(REPLACE(REPLACE(last_error, char(10), ' '), char(13), ' '), 1, 160)
      END AS sanitized_last_error,
      latest_bucket_minute,
      latest_collected_at,
      latest_stream_count,
      latest_total_viewers,
      covered_pages,
      has_more,
      updated_at
    FROM collector_status
    WHERE provider = '${PROVIDER}'
  `)

  evidence.status = 'diagnosis_complete'
} catch (error) {
  evidence.status = 'diagnosis_failed'
  evidence.error = safeError(error)
}

const outputPath = path.join(OUTPUT_DIR, 'evidence.json')
fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`)
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=${evidence.status}\noutput_path=${outputPath}\n`)
}
console.log(JSON.stringify({ status: evidence.status, outputPath, error: evidence.error }, null, 2))
if (evidence.status !== 'diagnosis_complete') process.exitCode = 1

function summarySql(startAt, endExclusiveAt) {
  return `
    SELECT
      COUNT(*) AS snapshot_rows,
      COALESCE(SUM(json_array_length(json_extract(m.payload_json, '$.categoryRefs'))), 0) AS total_category_refs,
      COALESCE(SUM((
        SELECT COUNT(*)
        FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type != 'null'
      )), 0) AS present_category_refs,
      COALESCE(SUM((
        SELECT COUNT(*)
        FROM json_each(json_extract(m.payload_json, '$.categoryRefs')) AS ref
        WHERE ref.type = 'null'
      )), 0) AS null_category_refs,
      MIN(m.bucket_minute) AS first_bucket,
      MAX(m.bucket_minute) AS latest_bucket,
      MIN(m.collected_at) AS first_collected_at,
      MAX(m.collected_at) AS latest_collected_at
    FROM minute_snapshots AS m
    WHERE m.provider = '${PROVIDER}'
      AND m.bucket_minute >= '${startAt}'
      AND m.bucket_minute < '${endExclusiveAt}'
  `
}

function runD1Select(sql) {
  const statements = sql.split(';').map((part) => part.trim()).filter(Boolean)
  if (statements.some((part) => !/^(SELECT|WITH)\b/i.test(part))) {
    throw new Error('non_select_statement_rejected')
  }
  const result = spawnSync(
    'pnpm',
    [
      'dlx',
      'wrangler@4',
      'd1',
      'execute',
      DATABASE_NAME,
      '--remote',
      '--json',
      '--config',
      CONFIG_PATH,
      '--command',
      sql,
    ],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 40 * 1024 * 1024,
    },
  )
  if (result.status !== 0) {
    throw new Error(`d1_select_failed:${safeText(result.stderr || result.stdout)}`)
  }
  return flattenRows(parseLastJson(result.stdout || result.stderr))
}

function flattenRows(value) {
  const groups = Array.isArray(value) ? value : [value]
  return groups.flatMap((group) => {
    if (Array.isArray(group?.results)) return group.results
    if (Array.isArray(group?.result?.[0]?.results)) return group.result[0].results
    return []
  })
}

function parseLastJson(value) {
  const source = stripAnsi(String(value ?? ''))
  const parsed = []
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== '[' && source[start] !== '{') continue
    const end = balancedJsonEnd(source, start)
    if (end === null) continue
    try {
      parsed.push(JSON.parse(source.slice(start, end + 1)))
      start = end
    } catch {}
  }
  if (parsed.length === 0) throw new Error('json_output_missing')
  return parsed.at(-1)
}

function balancedJsonEnd(text, start) {
  const stack = []
  let inString = false
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }
    if (char === '"') inString = true
    else if (char === '[' || char === '{') stack.push(char)
    else if (char === ']' || char === '}') {
      const open = stack.pop()
      if ((char === ']' && open !== '[') || (char === '}' && open !== '{')) return null
      if (stack.length === 0) return index
    }
  }
  return null
}

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null
}

function floorToFiveMinutes(date) {
  const copy = new Date(date)
  copy.setUTCMinutes(Math.floor(copy.getUTCMinutes() / 5) * 5, 0, 0)
  return copy.toISOString().replace(/\.\d{3}Z$/, '.000Z')
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function safeError(error) {
  return safeText(error instanceof Error ? error.message : String(error))
}

function safeText(value) {
  return String(value ?? '')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[A-Za-z0-9_-]{32,}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
}

function stripAnsi(value) {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '')
}
