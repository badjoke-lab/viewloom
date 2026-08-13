import {
  HISTORY_CATEGORY_ROW_CAP,
  HISTORY_CATEGORY_STREAMER_ROW_CAP,
  cleanupKickHistoryCategoryProbeDay,
  precheckKickHistoryCategoryDay,
  refreshKickHistoryCategoryAggregateDay,
} from '../../shared/history-category-aggregate'

type Env = {
  DB: D1Database
  PROBE_TOKEN: string
}

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

const CONFIRMATION = 'RUN_KICK_HISTORY_CATEGORY_AGGREGATE_COST_PROBE'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname === '/health') {
      return out({
        ok: true,
        provider: 'kick',
        mode: 'dormant_history_category_aggregate_cost_probe',
        productionExecutionAuthorizedByPackage: false,
        permanentGeneratorEnabled: false,
        confirmationRequired: CONFIRMATION,
      })
    }
    if (!authorized(request, env.PROBE_TOKEN)) return out({ ok: false, error: 'unauthorized' }, 401)

    if (request.method === 'POST' && url.pathname === '/inspect') {
      try {
        const body = await optionalJson(request)
        const day = normalizeProbeDay(body?.day)
        return out({ ok: true, ...(await inspect(env.DB, day)), boundaries: boundaries() })
      } catch (error) {
        return out({ ok: false, error: sanitizeError(error), boundaries: boundaries() }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/probe') {
      if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
        return out({ ok: false, error: 'confirmation_required' }, 409)
      }
      try {
        const body = await requiredJson(request)
        const day = normalizeProbeDay(body.day)
        if (day !== new Date().toISOString().slice(0, 10)) {
          return out({ ok: false, error: 'probe_day_must_equal_current_utc_day', day }, 409)
        }
        const result = await runProbe(env.DB, day)
        return out(result, result.ok ? 200 : 409)
      } catch (error) {
        return out({ ok: false, error: sanitizeError(error), boundaries: boundaries() }, 400)
      }
    }

    return out({ ok: false, error: 'not_found', routes: ['GET /health', 'POST /inspect', 'POST /probe'] }, 404)
  },
}

async function runProbe(db: D1Database, day: string) {
  const startedAt = Date.now()
  const pre = await inspect(db, day)
  const preconditions = {
    schemaComplete: pre.schema.complete,
    targetAggregateRowsZero: pre.aggregateRows.total === 0,
    providerLeakageZero: pre.providerLeakageRows === 0,
    sourceSnapshotsPresent: pre.precheck.sourceSnapshots > 0,
    categoryMetadataComplete: pre.precheck.categoryMissingItems === 0 && pre.precheck.categoryObservedItems > 0,
    categoryRowsWithinCap: pre.precheck.candidateCategoryRows <= HISTORY_CATEGORY_ROW_CAP,
    streamerCategoryRowsWithinCap: pre.precheck.candidateStreamerCategoryRows <= HISTORY_CATEGORY_STREAMER_ROW_CAP,
    latestSnapshotPresent: Boolean(pre.latestSnapshot?.collected_at),
  }
  if (!Object.values(preconditions).every(Boolean)) {
    return {
      ok: false,
      schemaVersion: 'viewloom-12a15-kick-history-category-aggregate-cost-probe-result-v1',
      provider: 'kick',
      day,
      stage: 'precondition',
      preconditions,
      pre,
      operation: null,
      post: pre,
      boundaries: boundaries(),
      workerWallMs: round(Date.now() - startedAt, 2),
    }
  }

  let operation: Awaited<ReturnType<typeof refreshKickHistoryCategoryAggregateDay>> | null = null
  let operationError: string | null = null
  let cleanup: Awaited<ReturnType<typeof cleanupKickHistoryCategoryProbeDay>> | null = null
  let cleanupError: string | null = null
  let during: Awaited<ReturnType<typeof inspect>> | null = null

  try {
    operation = await refreshKickHistoryCategoryAggregateDay(db, day, { startDay: day })
    during = await inspect(db, day)
  } catch (error) {
    operationError = sanitizeError(error)
  } finally {
    try {
      cleanup = await cleanupKickHistoryCategoryProbeDay(db, day)
    } catch (error) {
      cleanupError = sanitizeError(error)
    }
  }

  const post = await inspect(db, day)
  const checks = {
    preconditionsPassed: Object.values(preconditions).every(Boolean),
    operationSucceeded: operationError === null,
    aggregateRowsAuthoritative: operation?.aggregateRowsAuthoritative === true,
    generatedCategoryRowsMatchPrecheck: operation?.generatedCategoryRows === pre.precheck.candidateCategoryRows,
    generatedStreamerRowsMatchPrecheck: operation?.generatedStreamerCategoryRows === pre.precheck.candidateStreamerCategoryRows,
    duringDailyRowsMatch: during?.aggregateRows.daily === pre.precheck.candidateCategoryRows,
    duringStreamerRowsMatch: during?.aggregateRows.streamerDaily === pre.precheck.candidateStreamerCategoryRows,
    duringStatusRowPresent: during?.aggregateRows.dayStatus === 1,
    cleanupSucceeded: cleanupError === null,
    postTargetRowsZero: post.aggregateRows.total === 0,
    providerLeakageZero: post.providerLeakageRows === 0,
    permanentGeneratorStillDisabled: true,
  }
  const ok = Object.values(checks).every(Boolean)
  return {
    ok,
    schemaVersion: 'viewloom-12a15-kick-history-category-aggregate-cost-probe-result-v1',
    provider: 'kick',
    day,
    stage: ok ? 'complete' : 'operation_or_cleanup',
    preconditions,
    checks,
    pre,
    operation,
    operationError,
    during,
    cleanup,
    cleanupError,
    post,
    operationDatabaseSizeDeltaBytes: sizeDelta(pre.query.sizeAfter, during?.query.sizeAfter ?? null),
    cleanupDatabaseSizeDeltaBytes: sizeDelta(during?.query.sizeAfter ?? null, post.query.sizeAfter),
    boundaries: boundaries(),
    workerWallMs: round(Date.now() - startedAt, 2),
  }
}

async function inspect(db: D1Database, day: string) {
  const precheck = await precheckKickHistoryCategoryDay(db, day)
  const schemaResult = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE name IN (
      'history_category_daily',
      'history_category_streamer_daily',
      'history_category_day_status',
      'idx_history_category_daily_category_day',
      'idx_history_category_streamer_category_day'
    )
    ORDER BY name
  `).all()
  const presentObjects = rows(schemaResult).map((row) => String(row.name ?? '')).filter(Boolean)
  const schema = { presentObjects, complete: presentObjects.length === 5 }

  let daily = 0
  let streamerDaily = 0
  let dayStatus = 0
  const results: D1Result<unknown>[] = [schemaResult]
  if (schema.complete) {
    const [dailyResult, streamerResult, statusResult] = await db.batch([
      db.prepare('SELECT COUNT(*) AS count FROM history_category_daily WHERE provider = ? AND day = ?').bind('kick', day),
      db.prepare('SELECT COUNT(*) AS count FROM history_category_streamer_daily WHERE provider = ? AND day = ?').bind('kick', day),
      db.prepare('SELECT COUNT(*) AS count FROM history_category_day_status WHERE provider = ? AND day = ?').bind('kick', day),
    ])
    results.push(dailyResult, streamerResult, statusResult)
    daily = integer(firstValue(dailyResult, 'count'))
    streamerDaily = integer(firstValue(streamerResult, 'count'))
    dayStatus = integer(firstValue(statusResult, 'count'))
  }

  const latestResult = await db.prepare(`
    SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
    FROM minute_snapshots
    WHERE provider = 'kick'
    ORDER BY bucket_minute DESC
    LIMIT 1
  `).all()
  const leakageResult = await db.prepare("SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider != 'kick'").all()
  results.push(latestResult, leakageResult)

  return {
    provider: 'kick',
    day,
    schema,
    precheck,
    aggregateRows: { daily, streamerDaily, dayStatus, total: daily + streamerDaily + dayStatus },
    latestSnapshot: rows(latestResult)[0] ?? null,
    providerLeakageRows: integer(firstValue(leakageResult, 'count')),
    query: summarizeMeta(results),
  }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

async function optionalJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text()
  if (!text.trim()) return null
  const value = JSON.parse(text)
  return record(value) ? value : null
}

async function requiredJson(request: Request): Promise<Record<string, unknown>> {
  const value = await request.json()
  if (!record(value)) throw new Error('object_body_required')
  return value
}

function normalizeProbeDay(value: unknown): string {
  const day = typeof value === 'string' && value.trim() ? value.trim() : new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('invalid_probe_day')
  const parsed = new Date(`${day}T00:00:00.000Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== day) throw new Error('invalid_probe_day')
  return day
}

function rows(result: D1Result<unknown>): Record<string, unknown>[] {
  return Array.isArray(result.results) ? result.results as Record<string, unknown>[] : []
}

function firstValue(result: D1Result<unknown>, key: string): unknown {
  return rows(result)[0]?.[key]
}

function summarizeMeta(results: D1Result<unknown>[]): MetaSummary {
  const summary: MetaSummary = { statements: results.length, durationMs: 0, rowsRead: 0, rowsWritten: 0, changes: 0, sizeAfter: null }
  for (const result of results) {
    const meta = (result.meta ?? {}) as Record<string, unknown>
    summary.durationMs += numeric(meta.duration)
    summary.rowsRead += integer(meta.rows_read)
    summary.rowsWritten += integer(meta.rows_written)
    summary.changes += integer(meta.changes)
    const sizeAfter = Number(meta.size_after)
    if (Number.isFinite(sizeAfter)) summary.sizeAfter = sizeAfter
  }
  summary.durationMs = round(summary.durationMs, 3)
  return summary
}

function sizeDelta(before: number | null, after: number | null): number | null {
  return before === null || after === null ? null : after - before
}

function boundaries() {
  return {
    provider: 'kick',
    probeDayMustBeCurrentUtcDay: true,
    productionExecutionAuthorizedByPackage: false,
    permanentGeneratorEnabled: false,
    temporaryProbeRowsCleaned: true,
    newCron: false,
    backfill: false,
    rawRetentionChanged: false,
    historyApiCategoryEnabled: false,
    historyCategoryUiEnabled: false,
    twitchOperationAvailable: false,
    crossProviderOperation: false,
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 240)
}

function out(payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}
