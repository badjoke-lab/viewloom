export const CATEGORY_ROLLUP_COLUMNS = [
  'category_hourly_json',
  'category_observed_samples',
  'category_missing_samples',
  'category_contract_version',
] as const

export const CATEGORY_STATUS_COLUMNS = [
  'category_observed_streamers',
  'category_observed_samples',
  'category_missing_samples',
  'category_coverage_state',
] as const

export const CATEGORY_DICTIONARY_CREATE_STATEMENT = `
CREATE TABLE IF NOT EXISTS provider_category_dictionary (
  provider TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  PRIMARY KEY (provider, category_id)
)
`.trim()

export const CATEGORY_ROLLUP_ALTER_STATEMENTS = {
  category_hourly_json: `ALTER TABLE streamer_intraday_rollups
    ADD COLUMN category_hourly_json TEXT NOT NULL
    DEFAULT '{"v":1,"c":[],"r":[],"s":[],"m":[],"o":0,"x":0}'`,
  category_observed_samples: `ALTER TABLE streamer_intraday_rollups
    ADD COLUMN category_observed_samples INTEGER NOT NULL DEFAULT 0`,
  category_missing_samples: `ALTER TABLE streamer_intraday_rollups
    ADD COLUMN category_missing_samples INTEGER NOT NULL DEFAULT 0`,
  category_contract_version: `ALTER TABLE streamer_intraday_rollups
    ADD COLUMN category_contract_version TEXT NOT NULL DEFAULT 'unavailable'`,
} as const

export const CATEGORY_STATUS_ALTER_STATEMENTS = {
  category_observed_streamers: `ALTER TABLE intraday_rollup_status
    ADD COLUMN category_observed_streamers INTEGER NOT NULL DEFAULT 0`,
  category_observed_samples: `ALTER TABLE intraday_rollup_status
    ADD COLUMN category_observed_samples INTEGER NOT NULL DEFAULT 0`,
  category_missing_samples: `ALTER TABLE intraday_rollup_status
    ADD COLUMN category_missing_samples INTEGER NOT NULL DEFAULT 0`,
  category_coverage_state: `ALTER TABLE intraday_rollup_status
    ADD COLUMN category_coverage_state TEXT NOT NULL DEFAULT 'unavailable'`,
} as const

export const CATEGORY_SCHEMA_STATEMENTS = [
  CATEGORY_DICTIONARY_CREATE_STATEMENT,
  ...CATEGORY_ROLLUP_COLUMNS.map((column) => CATEGORY_ROLLUP_ALTER_STATEMENTS[column]),
  ...CATEGORY_STATUS_COLUMNS.map((column) => CATEGORY_STATUS_ALTER_STATEMENTS[column]),
] as const

export type CategorySchemaState = {
  dictionaryTablePresent: boolean
  presentRollupColumns: string[]
  presentStatusColumns: string[]
  complete: boolean
  absent: boolean
  partial: boolean
}

export type CategorySchemaApplyMetrics = {
  statementCount: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

export type CategorySchemaApplyResult = {
  attempted: boolean
  applied: boolean
  reason: 'applied' | 'already-complete' | 'partial-schema-stop'
  pre: CategorySchemaState
  post: CategorySchemaState
  metrics: CategorySchemaApplyMetrics
}

export async function inspectCategorySchema(db: D1Database): Promise<CategorySchemaState> {
  const [dictionaryResult, rollupResult, statusResult] = await db.batch([
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = 'provider_category_dictionary'
    `),
    db.prepare(`
      SELECT name
      FROM pragma_table_info('streamer_intraday_rollups')
      WHERE name IN (${CATEGORY_ROLLUP_COLUMNS.map(() => '?').join(', ')})
      ORDER BY name
    `).bind(...CATEGORY_ROLLUP_COLUMNS),
    db.prepare(`
      SELECT name
      FROM pragma_table_info('intraday_rollup_status')
      WHERE name IN (${CATEGORY_STATUS_COLUMNS.map(() => '?').join(', ')})
      ORDER BY name
    `).bind(...CATEGORY_STATUS_COLUMNS),
  ])

  const dictionaryTablePresent = Number(firstValue(dictionaryResult, 'count') ?? 0) === 1
  const presentRollupColumns = stringValues(rollupResult, 'name')
  const presentStatusColumns = stringValues(statusResult, 'name')
  const complete = dictionaryTablePresent
    && presentRollupColumns.length === CATEGORY_ROLLUP_COLUMNS.length
    && presentStatusColumns.length === CATEGORY_STATUS_COLUMNS.length
  const absent = !dictionaryTablePresent
    && presentRollupColumns.length === 0
    && presentStatusColumns.length === 0

  return {
    dictionaryTablePresent,
    presentRollupColumns,
    presentStatusColumns,
    complete,
    absent,
    partial: !complete && !absent,
  }
}

export async function applyCategorySchemaControlled(
  db: D1Database,
  options: { requireCompletelyAbsent?: boolean } = {},
): Promise<CategorySchemaApplyResult> {
  const requireCompletelyAbsent = options.requireCompletelyAbsent ?? true
  const pre = await inspectCategorySchema(db)

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

  const statements: string[] = []
  if (!pre.dictionaryTablePresent) statements.push(CATEGORY_DICTIONARY_CREATE_STATEMENT)

  const rollupPresent = new Set(pre.presentRollupColumns)
  for (const column of CATEGORY_ROLLUP_COLUMNS) {
    if (!rollupPresent.has(column)) statements.push(CATEGORY_ROLLUP_ALTER_STATEMENTS[column])
  }

  const statusPresent = new Set(pre.presentStatusColumns)
  for (const column of CATEGORY_STATUS_COLUMNS) {
    if (!statusPresent.has(column)) statements.push(CATEGORY_STATUS_ALTER_STATEMENTS[column])
  }

  const results = statements.length
    ? await db.batch(statements.map((statement) => db.prepare(statement)))
    : []
  const post = await inspectCategorySchema(db)

  if (!post.complete) throw new Error('category_schema_apply_incomplete')

  return {
    attempted: true,
    applied: statements.length > 0,
    reason: statements.length > 0 ? 'applied' : 'already-complete',
    pre,
    post,
    metrics: summarizeMetrics(results),
  }
}

function firstRow(result: D1Result<unknown>): Record<string, unknown> | null {
  const rows = Array.isArray(result.results) ? result.results : []
  return (rows[0] as Record<string, unknown> | undefined) ?? null
}

function firstValue(result: D1Result<unknown>, key: string): unknown {
  return firstRow(result)?.[key]
}

function stringValues(result: D1Result<unknown>, key: string): string[] {
  const rows = Array.isArray(result.results) ? result.results : []
  return rows
    .map((row) => String((row as Record<string, unknown>)[key] ?? '').trim())
    .filter(Boolean)
}

function summarizeMetrics(results: D1Result<unknown>[]): CategorySchemaApplyMetrics {
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

function emptyMetrics(): CategorySchemaApplyMetrics {
  return {
    statementCount: 0,
    durationMs: 0,
    rowsRead: 0,
    rowsWritten: 0,
    changes: 0,
    sizeAfter: null,
  }
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
