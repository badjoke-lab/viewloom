import {
  applyCategorySchemaControlled,
  inspectCategorySchema,
  type CategorySchemaApplyResult,
} from '../../shared/category-schema'

interface Env {
  DB: D1Database
  APPLY_TOKEN?: string
}

const PROVIDER = 'kick'
const CONFIRMATION = 'APPLY_KICK_CATEGORY_SCHEMA_WITH_CAPTURE_DISABLED'

type QueryMetrics = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const started = Date.now()
    try {
      const url = new URL(request.url)
      if (request.method === 'GET' && url.pathname === '/health') {
        return response({ ok: true, provider: PROVIDER, mode: 'kick_only_schema_recovery' })
      }
      if (request.method !== 'POST') return response({ ok: false, error: 'method_not_allowed' }, 405)
      if (!authorized(request, env.APPLY_TOKEN)) return response({ ok: false, error: 'unauthorized' }, 401)

      if (url.pathname === '/inspect') {
        const state = await inspectExecutionState(env.DB)
        return response({ ok: true, provider: PROVIDER, mode: 'kick_only_schema_recovery', state, workerWallMs: Date.now() - started })
      }

      if (url.pathname === '/apply') {
        if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
          return response({ ok: false, error: 'confirmation_required' }, 409)
        }
        const pre = await inspectExecutionState(env.DB)
        const apply = await applyCategorySchemaControlled(env.DB, { requireCompletelyAbsent: true })
        const post = await inspectExecutionState(env.DB)
        return response({
          ok: apply.applied || apply.reason === 'already-complete',
          provider: PROVIDER,
          confirmation: CONFIRMATION,
          pre,
          apply: sanitizeApply(apply),
          post,
          workerWallMs: Date.now() - started,
          boundaries: {
            twitchSchemaTouched: false,
            categoryCaptureEnabled: false,
            productionCategoryRowsWrittenByWorker: false,
          },
        })
      }

      return response({ ok: false, error: 'not_found' }, 404)
    } catch (error) {
      return response({
        ok: false,
        provider: PROVIDER,
        error: error instanceof Error ? error.message.slice(0, 180) : 'unknown_error',
        workerWallMs: Date.now() - started,
      }, 500)
    }
  },
}

async function inspectExecutionState(db: D1Database) {
  const schema = await inspectCategorySchema(db)
  const statements: D1PreparedStatement[] = [
    db.prepare(`
      SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 2
    `).bind(PROVIDER),
    db.prepare('SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider <> ?').bind(PROVIDER),
  ]
  if (schema.dictionaryTablePresent) {
    statements.push(
      db.prepare('SELECT COUNT(*) AS count FROM provider_category_dictionary WHERE provider = ?').bind(PROVIDER),
      db.prepare("SELECT COUNT(*) AS count FROM provider_category_dictionary WHERE provider = ? AND category_id LIKE '__viewloom_probe__%'").bind(PROVIDER),
    )
  }
  const results = await db.batch(statements)
  const latestRows = rows(results[0])
  const query = summarize(results)
  return {
    schema,
    operational: {
      healthSource: 'latest_snapshot',
      healthEvidenceAvailable: latestRows.length > 0,
      latestSnapshot: latestRows[0] ?? null,
      previousSnapshot: latestRows[1] ?? null,
    },
    providerLeakageRows: number(first(results[1])?.count),
    categoryDictionaryRows: schema.dictionaryTablePresent ? number(first(results[2])?.count) : 0,
    reservedProbeRows: schema.dictionaryTablePresent ? number(first(results[3])?.count) : 0,
    databaseSizeBytes: query.sizeAfter,
    query,
  }
}

function sanitizeApply(result: CategorySchemaApplyResult) {
  return {
    attempted: result.attempted,
    applied: result.applied,
    reason: result.reason,
    pre: result.pre,
    post: result.post,
    metrics: result.metrics,
  }
}

function authorized(request: Request, token?: string): boolean {
  if (!token) return false
  return request.headers.get('authorization') === `Bearer ${token}`
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function first(result: D1Result<unknown>): Record<string, unknown> | null {
  return rows(result)[0] ?? null
}

function number(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function summarize(results: D1Result<unknown>[]): QueryMetrics {
  const metrics: QueryMetrics = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0, sizeAfter: null }
  for (const result of results) {
    const meta = (result.meta ?? {}) as Record<string, unknown>
    metrics.durationMs += number(meta.duration)
    metrics.rowsRead += number(meta.rows_read)
    metrics.rowsWritten += number(meta.rows_written)
    metrics.changes += number(meta.changes)
    const size = Number(meta.size_after)
    if (Number.isFinite(size)) metrics.sizeAfter = size
  }
  metrics.durationMs = Math.round(metrics.durationMs * 1000) / 1000
  return metrics
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}
