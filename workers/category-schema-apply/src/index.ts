import {
  applyCategorySchemaControlled,
  inspectCategorySchema,
  type CategorySchemaState,
} from '../../shared/category-schema'

type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
  APPLY_TOKEN: string
}

type QueryMetrics = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

type SnapshotRow = {
  bucket_minute?: string
  collected_at?: string
  stream_count?: number
  total_viewers?: number
  source_mode?: string
}

const CONFIRMATION = 'APPLY_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'
const RESERVED_PROBE_PREFIX = '__viewloom_schema_probe__%'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        provider: env.PROVIDER,
        mode: 'controlled_category_schema_apply',
        confirmationRequired: CONFIRMATION,
        categoryCaptureEnabledByWorker: false,
      })
    }

    if (request.method === 'POST' && url.pathname === '/inspect') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      try {
        return json({
          ok: true,
          provider: env.PROVIDER,
          observedAt: new Date().toISOString(),
          mode: 'controlled_category_schema_apply',
          state: await inspectExecutionState(env.DB, env.PROVIDER),
          boundaries: safetyBoundaries(),
        })
      } catch (error) {
        return json({ ok: false, provider: env.PROVIDER, error: sanitizeError(error), boundaries: safetyBoundaries() }, 500)
      }
    }

    if (request.method === 'POST' && url.pathname === '/apply') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
        return json({ ok: false, error: 'confirmation_mismatch', confirmationRequired: CONFIRMATION }, 409)
      }

      const startedAt = Date.now()
      try {
        const pre = await inspectExecutionState(env.DB, env.PROVIDER)
        if (pre.schema.partial) {
          return json({
            ok: false,
            provider: env.PROVIDER,
            error: 'partial_schema_stop',
            pre,
            workerWallMs: Date.now() - startedAt,
            boundaries: safetyBoundaries(),
          }, 409)
        }

        const apply = await applyCategorySchemaControlled(env.DB, { requireCompletelyAbsent: true })
        const post = await inspectExecutionState(env.DB, env.PROVIDER)
        const ok = post.schema.complete
          && post.categoryDictionaryRows === 0
          && post.reservedProbeRows === 0
          && post.providerLeakageRows === 0

        return json({
          ok,
          provider: env.PROVIDER,
          observedAt: new Date().toISOString(),
          mode: 'controlled_category_schema_apply',
          pre,
          apply,
          post,
          workerWallMs: Date.now() - startedAt,
          boundaries: safetyBoundaries(),
        }, ok ? 200 : 500)
      } catch (error) {
        return json({
          ok: false,
          provider: env.PROVIDER,
          error: sanitizeError(error),
          workerWallMs: Date.now() - startedAt,
          boundaries: safetyBoundaries(),
        }, 500)
      }
    }

    return json({
      ok: false,
      error: 'not_found',
      routes: ['GET /health', 'POST /inspect', 'POST /apply'],
    }, 404)
  },
}

async function inspectExecutionState(db: D1Database, provider: Provider) {
  const schema = await inspectCategorySchema(db)
  const results: D1Result<unknown>[] = []

  const latestResult = await db.prepare(`
    SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 2
  `).bind(provider).all<SnapshotRow>()
  results.push(latestResult)

  const leakageResult = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM minute_snapshots
    WHERE provider != ?
  `).bind(provider).all()
  results.push(leakageResult)

  const collectorTableResult = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM sqlite_master
    WHERE type = 'table' AND name = 'collector_status'
  `).all()
  results.push(collectorTableResult)

  let collectorStatus: Record<string, unknown> | null = null
  if (integer(firstValue(collectorTableResult, 'count')) === 1) {
    const collectorResult = await db.prepare(`
      SELECT status, last_attempt_at, last_success_at, last_failure_at,
             latest_bucket_minute, latest_collected_at, updated_at
      FROM collector_status
      WHERE provider = ?
      LIMIT 1
    `).bind(provider).all()
    results.push(collectorResult)
    collectorStatus = firstRow(collectorResult)
  }

  let categoryDictionaryRows = 0
  let reservedProbeRows = 0
  if (schema.dictionaryTablePresent) {
    const dictionaryResult = await db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN category_id LIKE ? THEN 1 ELSE 0 END) AS reserved
      FROM provider_category_dictionary
      WHERE provider = ?
    `).bind(RESERVED_PROBE_PREFIX, provider).all()
    results.push(dictionaryResult)
    categoryDictionaryRows = integer(firstValue(dictionaryResult, 'total'))
    reservedProbeRows = integer(firstValue(dictionaryResult, 'reserved'))
  }

  const snapshots = rows(latestResult).map((row) => pick(row, [
    'bucket_minute',
    'collected_at',
    'stream_count',
    'total_viewers',
    'source_mode',
  ]))

  const latestSnapshot = snapshots[0] ?? null
  const previousSnapshot = snapshots[1] ?? null
  const healthSource = provider === 'twitch' ? 'collector_status' : 'latest_snapshot'
  const healthEvidenceAvailable = provider === 'twitch'
    ? Boolean(collectorStatus)
    : Boolean(latestSnapshot)
  const query = summarizeMetrics(results)

  return {
    schema,
    operational: {
      healthSource,
      healthEvidenceAvailable,
      latestSnapshot,
      previousSnapshot,
      collectorStatus,
    },
    providerLeakageRows: integer(firstValue(leakageResult, 'count')),
    categoryDictionaryRows,
    reservedProbeRows,
    databaseSizeBytes: query.sizeAfter,
    query,
  }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function safetyBoundaries() {
  return {
    providerSeparated: true,
    categoryCaptureEnabledByWorker: false,
    productionCategoryRowsWrittenByWorker: false,
    collectorRouteAvailable: false,
    scheduledHandlerAvailable: false,
    backfillAvailable: false,
    retentionChanged: false,
    crossProviderOperation: false,
  }
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function firstRow(result: D1Result<unknown>): Record<string, unknown> | null {
  return rows(result)[0] ?? null
}

function firstValue(result: D1Result<unknown>, key: string): unknown {
  return firstRow(result)?.[key]
}

function pick(row: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => [field, row[field] ?? null]))
}

function summarizeMetrics(results: D1Result<unknown>[]): QueryMetrics {
  const metrics: QueryMetrics = {
    statements: results.length,
    durationMs: 0,
    rowsRead: 0,
    rowsWritten: 0,
    changes: 0,
    sizeAfter: null,
  }

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

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function numeric(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
}
