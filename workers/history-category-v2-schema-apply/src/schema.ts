export const HISTORY_CATEGORY_V2_SCHEMA_STATEMENTS = [
  `CREATE TABLE history_category_daily_v2 (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    category_id TEXT NOT NULL,
    total_viewer_minutes INTEGER NOT NULL DEFAULT 0,
    peak_viewers INTEGER NOT NULL DEFAULT 0,
    observed_snapshots INTEGER NOT NULL DEFAULT 0,
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day, category_id)
  )`,
  `CREATE TABLE history_category_streamer_daily_chunks_v2 (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    category_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    contributor_count INTEGER NOT NULL,
    contributors_json TEXT NOT NULL,
    encoded_bytes INTEGER NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day, category_id, chunk_index)
  )`,
  `CREATE TABLE history_category_day_status_v2 (
    provider TEXT NOT NULL,
    day TEXT NOT NULL,
    candidate_category_rows INTEGER NOT NULL DEFAULT 0,
    logical_streamer_category_contributors INTEGER NOT NULL DEFAULT 0,
    physical_contributor_chunk_rows INTEGER NOT NULL DEFAULT 0,
    contributor_encoded_bytes INTEGER NOT NULL DEFAULT 0,
    category_row_cap INTEGER NOT NULL,
    physical_contributor_row_budget INTEGER NOT NULL,
    contributor_encoded_bytes_cap INTEGER NOT NULL,
    source_snapshots INTEGER NOT NULL DEFAULT 0,
    observed_category_items INTEGER NOT NULL DEFAULT 0,
    missing_category_items INTEGER NOT NULL DEFAULT 0,
    coverage_state TEXT NOT NULL,
    source_mode TEXT NOT NULL,
    contract_version TEXT NOT NULL DEFAULT 'category-source-v2-chunked',
    updated_at TEXT NOT NULL,
    PRIMARY KEY (provider, day)
  )`,
  `CREATE INDEX idx_history_category_daily_v2_category_day
    ON history_category_daily_v2 (provider, category_id, day)`,
  `CREATE INDEX idx_history_category_streamer_chunks_v2_category_day
    ON history_category_streamer_daily_chunks_v2 (provider, category_id, day, chunk_index)`,
] as const

export const HISTORY_CATEGORY_V2_SCHEMA_OBJECTS = [
  'history_category_daily_v2',
  'history_category_streamer_daily_chunks_v2',
  'history_category_day_status_v2',
  'idx_history_category_daily_v2_category_day',
  'idx_history_category_streamer_chunks_v2_category_day',
] as const

export const HISTORY_CATEGORY_V1_SCHEMA_OBJECTS = [
  'history_category_daily',
  'history_category_streamer_daily',
  'history_category_day_status',
  'idx_history_category_daily_category_day',
  'idx_history_category_streamer_category_day',
] as const

const V2_TABLE_OBJECTS = [
  'history_category_daily_v2',
  'history_category_streamer_daily_chunks_v2',
  'history_category_day_status_v2',
] as const

export type SchemaState = {
  presentObjects: string[]
  complete: boolean
  absent: boolean
  partial: boolean
}

export type SchemaApplyMetrics = {
  statementCount: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

export type V2SchemaApplyResult = {
  attempted: boolean
  applied: boolean
  reason: 'applied' | 'already-complete' | 'partial-schema-stop'
  pre: SchemaState
  afterTables?: SchemaState
  post: SchemaState
  tableStageStatementCount?: number
  indexStageStatementCount?: number
  metrics: SchemaApplyMetrics
}

export async function inspectHistoryCategoryV2Schema(db: D1Database): Promise<SchemaState> {
  return inspectObjects(db, HISTORY_CATEGORY_V2_SCHEMA_OBJECTS)
}

export async function inspectHistoryCategoryV1Schema(db: D1Database): Promise<SchemaState> {
  return inspectObjects(db, HISTORY_CATEGORY_V1_SCHEMA_OBJECTS)
}

export async function applyHistoryCategoryV2SchemaControlled(db: D1Database): Promise<V2SchemaApplyResult> {
  const pre = await inspectHistoryCategoryV2Schema(db)
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
  if (pre.partial) {
    return {
      attempted: false,
      applied: false,
      reason: 'partial-schema-stop',
      pre,
      post: pre,
      metrics: emptyMetrics(),
    }
  }

  const tableStatements = HISTORY_CATEGORY_V2_SCHEMA_STATEMENTS.slice(0, 3)
  const indexStatements = HISTORY_CATEGORY_V2_SCHEMA_STATEMENTS.slice(3)
  if (tableStatements.length !== 3 || indexStatements.length !== 2) {
    throw new Error('history_category_v2_schema_statement_partition_invalid')
  }

  const tableResults = await db.batch(tableStatements.map((statement) => db.prepare(statement)))
  const afterTables = await inspectHistoryCategoryV2Schema(db)
  const presentAfterTables = new Set(afterTables.presentObjects)
  if (
    V2_TABLE_OBJECTS.some((name) => !presentAfterTables.has(name))
    || afterTables.presentObjects.some((name) => name.startsWith('idx_history_category_'))
  ) {
    throw new Error('history_category_v2_schema_table_stage_incomplete')
  }

  const indexResults = await db.batch(indexStatements.map((statement) => db.prepare(statement)))
  const post = await inspectHistoryCategoryV2Schema(db)
  if (!post.complete) throw new Error('history_category_v2_schema_apply_incomplete')

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

async function inspectObjects(
  db: D1Database,
  names: readonly string[],
): Promise<SchemaState> {
  const placeholders = names.map(() => '?').join(', ')
  const result = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE name IN (${placeholders})
    ORDER BY name
  `).bind(...names).all()
  const presentObjects = rows(result)
    .map((row) => String(row.name ?? '').trim())
    .filter(Boolean)
  const complete = presentObjects.length === names.length
  const absent = presentObjects.length === 0
  return { presentObjects, complete, absent, partial: !complete && !absent }
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function summarizeMetrics(results: D1Result<unknown>[]): SchemaApplyMetrics {
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

function emptyMetrics(): SchemaApplyMetrics {
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
