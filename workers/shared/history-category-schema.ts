export const HISTORY_CATEGORY_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS history_category_daily (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    category_id TEXT NOT NULL,
    total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
    peak_viewers INTEGER NOT NULL DEFAULT 0,
    observed_snapshots INTEGER NOT NULL DEFAULT 0,
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day, category_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_history_category_daily_category_day
    ON history_category_daily (provider, category_id, day)`,
  `CREATE TABLE IF NOT EXISTS history_category_streamer_daily (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    category_id TEXT NOT NULL,
    streamer_id TEXT NOT NULL,
    display_name TEXT NOT NULL,
    viewer_minutes INTEGER NOT NULL DEFAULT 0,
    peak_viewers INTEGER NOT NULL DEFAULT 0,
    observed_minutes INTEGER NOT NULL DEFAULT 0,
    sample_count INTEGER NOT NULL DEFAULT 0,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day, category_id, streamer_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_history_category_streamer_category_day
    ON history_category_streamer_daily (provider, category_id, day, streamer_id)`,
  `CREATE TABLE IF NOT EXISTS history_category_day_status (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    candidate_category_rows INTEGER NOT NULL DEFAULT 0,
    candidate_streamer_category_rows INTEGER NOT NULL DEFAULT 0,
    category_row_cap INTEGER NOT NULL,
    streamer_category_row_cap INTEGER NOT NULL,
    source_snapshots INTEGER NOT NULL DEFAULT 0,
    observed_category_items INTEGER NOT NULL DEFAULT 0,
    missing_category_items INTEGER NOT NULL DEFAULT 0,
    coverage_state TEXT NOT NULL,
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v1',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day)
  )`,
] as const

export const HISTORY_CATEGORY_SCHEMA_OBJECTS = [
  'history_category_daily',
  'idx_history_category_daily_category_day',
  'history_category_streamer_daily',
  'idx_history_category_streamer_category_day',
  'history_category_day_status',
] as const

const HISTORY_CATEGORY_TABLE_OBJECTS = [
  'history_category_daily',
  'history_category_streamer_daily',
  'history_category_day_status',
] as const

export type HistoryCategorySchemaState = {
  presentObjects: string[]
  complete: boolean
  absent: boolean
  partial: boolean
}

export type HistoryCategorySchemaApplyMetrics = {
  statementCount: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

export type HistoryCategorySchemaApplyResult = {
  attempted: boolean
  applied: boolean
  reason: 'applied' | 'already-complete' | 'partial-schema-stop'
  pre: HistoryCategorySchemaState
  afterTables?: HistoryCategorySchemaState
  post: HistoryCategorySchemaState
  tableStageStatementCount?: number
  indexStageStatementCount?: number
  metrics: HistoryCategorySchemaApplyMetrics
}

export async function inspectHistoryCategorySchema(db: D1Database): Promise<HistoryCategorySchemaState> {
  const placeholders = HISTORY_CATEGORY_SCHEMA_OBJECTS.map(() => '?').join(', ')
  const result = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE name IN (${placeholders})
    ORDER BY name
  `).bind(...HISTORY_CATEGORY_SCHEMA_OBJECTS).all()
  const presentObjects = rows(result)
    .map((row) => String(row.name ?? '').trim())
    .filter(Boolean)
  const complete = presentObjects.length === HISTORY_CATEGORY_SCHEMA_OBJECTS.length
  const absent = presentObjects.length === 0
  return { presentObjects, complete, absent, partial: !complete && !absent }
}

export async function applyHistoryCategorySchemaControlled(
  db: D1Database,
  options: { requireCompletelyAbsent?: boolean } = {},
): Promise<HistoryCategorySchemaApplyResult> {
  const requireCompletelyAbsent = options.requireCompletelyAbsent ?? true
  const pre = await inspectHistoryCategorySchema(db)

  if (pre.complete) {
    return {
      attempted: true,
      applied: false,
      reason: 'already-complete',
      pre,
      post: pre,
      metrics: emptyMetrics(),
    }
  }

  if (requireCompletelyAbsent && pre.partial) {
    return {
      attempted: false,
      applied: false,
      reason: 'partial-schema-stop',
      pre,
      post: pre,
      metrics: emptyMetrics(),
    }
  }

  const tableStatements = HISTORY_CATEGORY_SCHEMA_STATEMENTS.filter((statement) => /^CREATE TABLE\b/.test(statement.trim()))
  const indexStatements = HISTORY_CATEGORY_SCHEMA_STATEMENTS.filter((statement) => /^CREATE INDEX\b/.test(statement.trim()))
  if (tableStatements.length !== 3 || indexStatements.length !== 2) {
    throw new Error('history_category_schema_statement_partition_invalid')
  }

  // D1 may validate dependent statements before an entire batch is committed.
  // Create all independent tables first, verify them, then create their indexes.
  const tableResults = await db.batch(tableStatements.map((statement) => db.prepare(statement)))
  const afterTables = await inspectHistoryCategorySchema(db)
  const presentAfterTables = new Set(afterTables.presentObjects)
  if (
    afterTables.complete
    || HISTORY_CATEGORY_TABLE_OBJECTS.some((name) => !presentAfterTables.has(name))
    || afterTables.presentObjects.some((name) => name.startsWith('idx_history_category_'))
  ) {
    throw new Error('history_category_schema_table_stage_incomplete')
  }

  const indexResults = await db.batch(indexStatements.map((statement) => db.prepare(statement)))
  const post = await inspectHistoryCategorySchema(db)
  if (!post.complete) throw new Error('history_category_schema_apply_incomplete')

  const results = [...tableResults, ...indexResults]
  return {
    attempted: true,
    applied: true,
    reason: 'applied',
    pre,
    afterTables,
    post,
    tableStageStatementCount: tableResults.length,
    indexStageStatementCount: indexResults.length,
    metrics: summarizeMetrics(results),
  }
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function summarizeMetrics(results: D1Result<unknown>[]): HistoryCategorySchemaApplyMetrics {
  const metrics = emptyMetrics()
  metrics.statementCount = results.length
  for (const result of results) {
    const meta = (result.meta ?? {}) as Record<string, unknown>
    metrics.durationMs += numeric(meta.duration)
    metrics.rowsRead += integer(meta.rows_read)
    metrics.rowsWritten += integer(meta.rows_written)
    metrics.changes += integer(meta.changes)
    const sizeAfter = Number(meta.size_after)
    if (Number.isFinite(sizeAfter)) metrics.sizeAfter = sizeAfter
  }
  metrics.durationMs = Math.round(metrics.durationMs * 1000) / 1000
  return metrics
}

function emptyMetrics(): HistoryCategorySchemaApplyMetrics {
  return { statementCount: 0, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0, sizeAfter: null }
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
