import {
  applyHistoryCategoryV2SchemaControlled,
  inspectHistoryCategoryV1Schema,
  inspectHistoryCategoryV2Schema,
} from './schema'

type Env = {
  DB: D1Database
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

const CONFIRMATION = 'APPLY_KICK_HISTORY_CATEGORY_V2_SCHEMA_ONLY'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return json({
        ok: true,
        provider: 'kick',
        mode: 'controlled_history_category_v2_schema_apply',
        confirmationRequired: CONFIRMATION,
        generatorAvailable: false,
        collectorRouteAvailable: false,
        scheduledHandlerAvailable: false,
      })
    }

    if (request.method === 'POST' && url.pathname === '/inspect') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      try {
        return json({
          ok: true,
          provider: 'kick',
          observedAt: new Date().toISOString(),
          state: await inspectExecutionState(env.DB),
          boundaries: safetyBoundaries(),
        })
      } catch (error) {
        return json({ ok: false, provider: 'kick', error: sanitizeError(error), boundaries: safetyBoundaries() }, 500)
      }
    }

    if (request.method === 'POST' && url.pathname === '/apply') {
      if (!authorized(request, env.APPLY_TOKEN)) return json({ ok: false, error: 'unauthorized' }, 401)
      if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
        return json({ ok: false, error: 'confirmation_mismatch', confirmationRequired: CONFIRMATION }, 409)
      }

      const startedAt = Date.now()
      try {
        const pre = await inspectExecutionState(env.DB)
        if (!pre.v1Schema.complete) {
          return json({ ok: false, provider: 'kick', error: 'v1_schema_not_complete_stop', pre, boundaries: safetyBoundaries() }, 409)
        }
        if (pre.v2Schema.partial) {
          return json({ ok: false, provider: 'kick', error: 'partial_v2_schema_stop', pre, boundaries: safetyBoundaries() }, 409)
        }
        if (pre.v2AggregateRows.total !== 0) {
          return json({ ok: false, provider: 'kick', error: 'preexisting_v2_rows_stop', pre, boundaries: safetyBoundaries() }, 409)
        }

        const apply = await applyHistoryCategoryV2SchemaControlled(env.DB)
        const post = await inspectExecutionState(env.DB)
        const ok = post.v1Schema.complete
          && post.v2Schema.complete
          && post.v2AggregateRows.total === 0
          && post.providerLeakageRows === 0

        return json({
          ok,
          provider: 'kick',
          observedAt: new Date().toISOString(),
          pre,
          apply,
          post,
          workerWallMs: Date.now() - startedAt,
          boundaries: safetyBoundaries(),
        }, ok ? 200 : 500)
      } catch (error) {
        return json({
          ok: false,
          provider: 'kick',
          error: sanitizeError(error),
          workerWallMs: Date.now() - startedAt,
          boundaries: safetyBoundaries(),
        }, 500)
      }
    }

    return json({ ok: false, error: 'not_found', routes: ['GET /health', 'POST /inspect', 'POST /apply'] }, 404)
  },
}

async function inspectExecutionState(db: D1Database) {
  const [v1Schema, v2Schema] = await Promise.all([
    inspectHistoryCategoryV1Schema(db),
    inspectHistoryCategoryV2Schema(db),
  ])
  const results: D1Result<unknown>[] = []

  const latestResult = await db.prepare(`
    SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
    FROM minute_snapshots
    WHERE provider = 'kick'
    ORDER BY bucket_minute DESC
    LIMIT 2
  `).all()
  results.push(latestResult)

  const leakageResult = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM minute_snapshots
    WHERE provider != 'kick'
  `).all()
  results.push(leakageResult)

  let dailyRows = 0
  let chunkRows = 0
  let statusRows = 0
  if (v2Schema.complete) {
    const [dailyResult, chunkResult, statusResult] = await db.batch([
      db.prepare('SELECT COUNT(*) AS count FROM history_category_daily_v2'),
      db.prepare('SELECT COUNT(*) AS count FROM history_category_streamer_daily_chunks_v2'),
      db.prepare('SELECT COUNT(*) AS count FROM history_category_day_status_v2'),
    ])
    results.push(dailyResult, chunkResult, statusResult)
    dailyRows = integer(firstValue(dailyResult, 'count'))
    chunkRows = integer(firstValue(chunkResult, 'count'))
    statusRows = integer(firstValue(statusResult, 'count'))
  }

  const snapshots = rows(latestResult).map((row) => ({
    bucket_minute: row.bucket_minute ?? null,
    collected_at: row.collected_at ?? null,
    stream_count: row.stream_count ?? null,
    total_viewers: row.total_viewers ?? null,
    source_mode: row.source_mode ?? null,
  }))
  const query = summarizeMetrics(results)

  return {
    v1Schema,
    v2Schema,
    v2AggregateRows: {
      daily: dailyRows,
      chunkedContributors: chunkRows,
      dayStatus: statusRows,
      total: dailyRows + chunkRows + statusRows,
    },
    operational: {
      healthSource: 'latest_snapshot',
      latestSnapshot: snapshots[0] ?? null,
      previousSnapshot: snapshots[1] ?? null,
    },
    providerLeakageRows: integer(firstValue(leakageResult, 'count')),
    databaseSizeBytes: query.sizeAfter,
    query,
  }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function safetyBoundaries() {
  return {
    provider: 'kick',
    providerSeparated: true,
    schemaOnly: true,
    v1GeneratorChangedByWorker: false,
    v2GeneratorAvailable: false,
    collectorRouteAvailable: false,
    scheduledHandlerAvailable: false,
    backfillAvailable: false,
    retentionChanged: false,
    twitchOperationAvailable: false,
    crossProviderOperation: false,
  }
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function firstValue(result: D1Result<unknown>, key: string): unknown {
  return rows(result)[0]?.[key]
}

function summarizeMetrics(results: D1Result<unknown>[]): QueryMetrics {
  const metrics: QueryMetrics = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0, sizeAfter: null }
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
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 240)
}
