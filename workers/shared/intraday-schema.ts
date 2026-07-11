export type IntradaySchemaBootstrapResult = {
  attempted: boolean
  schemaPresent: boolean
  applied: boolean
  observedObjectCount?: number
  reason?: 'startup' | 'maintenance' | 'known-present' | 'startup-attempt-used'
  error?: string
}

export const INTRADAY_SCHEMA_STATEMENTS = [
  `
  CREATE TABLE IF NOT EXISTS streamer_intraday_rollups (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    streamer_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    daily_rank INTEGER NOT NULL,
    total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
    peak_viewers INTEGER NOT NULL DEFAULT 0,
    sample_count INTEGER NOT NULL DEFAULT 0,
    observed_minutes INTEGER NOT NULL DEFAULT 0,
    hourly_json TEXT NOT NULL DEFAULT '[]',
    selection_state TEXT NOT NULL DEFAULT 'complete_within_daily_cap',
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'analytics-source-v1',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day, streamer_id)
  )
  `,
  `
  CREATE INDEX IF NOT EXISTS idx_intraday_streamer_day
    ON streamer_intraday_rollups (provider, streamer_id, day)
  `,
  `
  CREATE TABLE IF NOT EXISTS intraday_rollup_status (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    candidate_streamers INTEGER NOT NULL,
    retained_streamers INTEGER NOT NULL,
    retained_streamer_cap INTEGER NOT NULL,
    source_snapshots INTEGER NOT NULL,
    selection_state TEXT NOT NULL,
    coverage_state TEXT NOT NULL,
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL,
    refreshed_at TEXT NOT NULL,
    PRIMARY KEY (provider, day)
  )
  `,
] as const

const EXPECTED_SCHEMA_OBJECTS = [
  'streamer_intraday_rollups',
  'idx_intraday_streamer_day',
  'intraday_rollup_status',
] as const

let schemaKnownPresent = false
let startupAttemptUsed = false

export async function maybeApplyIntradaySchema(
  db: D1Database,
  now = new Date(),
): Promise<IntradaySchemaBootstrapResult> {
  const maintenanceWindow = shouldRunIntradaySchemaBootstrap(now)

  if (schemaKnownPresent && !maintenanceWindow) {
    return {
      attempted: false,
      schemaPresent: true,
      applied: false,
      reason: 'known-present',
    }
  }

  if (!maintenanceWindow && startupAttemptUsed) {
    return {
      attempted: false,
      schemaPresent: false,
      applied: false,
      reason: 'startup-attempt-used',
    }
  }

  const reason = maintenanceWindow ? 'maintenance' : 'startup'
  if (!maintenanceWindow) startupAttemptUsed = true

  try {
    const probe = await db.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE name IN (?, ?, ?)
    `).bind(...EXPECTED_SCHEMA_OBJECTS).first<{ count: number }>()

    const observedObjectCount = Number(probe?.count ?? 0)
    if (observedObjectCount === EXPECTED_SCHEMA_OBJECTS.length) {
      schemaKnownPresent = true
      return {
        attempted: true,
        schemaPresent: true,
        applied: false,
        observedObjectCount,
        reason,
      }
    }

    await db.batch(INTRADAY_SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)))
    schemaKnownPresent = true
    return {
      attempted: true,
      schemaPresent: true,
      applied: true,
      observedObjectCount,
      reason,
    }
  } catch (error) {
    return {
      attempted: true,
      schemaPresent: false,
      applied: false,
      reason,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function shouldRunIntradaySchemaBootstrap(now: Date): boolean {
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return (hour === 0 || hour === 12) && minute >= 20 && minute < 25
}
