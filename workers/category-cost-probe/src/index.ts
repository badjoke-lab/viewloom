type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
  PROBE_TOKEN: string
}

type ProbeIdentity = {
  runId: string
  day: string
  streamerId: string
  categoryId: string
  categoryName: string
}

type MetaSummary = {
  statements: number
  durationMs: number
  rowsRead: number
  rowsWritten: number
  changes: number
  sizeAfter: number | null
}

const CONFIRMATION = 'RUN_RESERVED_CATEGORY_COST_PROBE'
const PROBE_DAY = '1900-01-02'
const PROBE_PREFIX = '__viewloom_category_cost_probe__:'
const MAX_GENERATOR_QUERIES = 12
const CATEGORY_CONTRACT_VERSION = 'category-source-v1'
const ANALYTICS_CONTRACT_VERSION = 'analytics-source-v1'

const CATEGORY_ROLLUP_COLUMNS = [
  'category_hourly_json',
  'category_observed_samples',
  'category_missing_samples',
  'category_contract_version',
] as const

const CATEGORY_STATUS_COLUMNS = [
  'category_observed_streamers',
  'category_observed_samples',
  'category_missing_samples',
  'category_coverage_state',
] as const

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        provider: env.PROVIDER,
        mode: 'bounded_execution_cost_probe',
        probeDay: PROBE_DAY,
        reservedPrefix: PROBE_PREFIX,
        productionExecutionAuthorizedByPackage: false,
        categoryCaptureEnabled: false,
      })
    }

    if (!authorized(request, env.PROBE_TOKEN)) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401)
    }

    if (request.method === 'POST' && url.pathname === '/inspect') {
      try {
        const body = await optionalJson(request)
        const identity = body?.runId ? buildIdentity(env.PROVIDER, body.runId) : null
        return jsonResponse(await inspectProvider(env, identity))
      } catch (error) {
        return jsonResponse({
          ok: false,
          provider: env.PROVIDER,
          error: sanitizeError(error),
          boundaries: probeBoundaries(),
        }, 400)
      }
    }

    if (request.method === 'POST' && url.pathname === '/probe') {
      if (request.headers.get('x-viewloom-confirm') !== CONFIRMATION) {
        return jsonResponse({ ok: false, error: 'confirmation_required' }, 409)
      }

      try {
        const body = await requiredJson(request)
        const identity = buildIdentity(env.PROVIDER, body.runId)
        const result = await runBoundedProbe(env, identity)
        return jsonResponse(result, result.ok ? 200 : 409)
      } catch (error) {
        return jsonResponse({
          ok: false,
          provider: env.PROVIDER,
          error: sanitizeError(error),
          boundaries: probeBoundaries(),
        }, 400)
      }
    }

    return jsonResponse({ ok: false, error: 'not_found' }, 404)
  },
}

async function runBoundedProbe(env: Env, identity: ProbeIdentity) {
  const startedAt = Date.now()
  const pre = await inspectProvider(env, identity)
  const preconditions = {
    providerValid: env.PROVIDER === 'twitch' || env.PROVIDER === 'kick',
    schemaComplete: pre.schema.categorySchemaComplete,
    healthEvidenceAvailable: pre.health.evidenceAvailable,
    reservedRowsAbsent: pre.reserved.totalRows === 0,
    providerLeakageZero: pre.providerLeakageRows === 0,
  }

  if (!Object.values(preconditions).every(Boolean)) {
    return {
      ok: false,
      schemaVersion: 'viewloom-12a4-category-execution-cost-probe-result-v1',
      provider: env.PROVIDER,
      runId: identity.runId,
      stage: 'precondition',
      preconditions,
      pre,
      operation: null,
      post: pre,
      boundaries: probeBoundaries(),
      workerWallMs: round(Date.now() - startedAt, 2),
    }
  }

  const operationResults: D1Result<unknown>[] = []
  let operationError: string | null = null
  let cleanupError: string | null = null
  let dictionaryFirstPassChanges = 0
  let dictionarySecondPassChanges = 0
  let probeRowsAfterWrite = 0
  let categoryGeneratorQueries = 0
  let operationStage = 'dictionary_first_pass'
  const observedAt = new Date().toISOString()

  try {
    const firstDictionary = await dictionaryUpsert(env, identity, observedAt)
    operationResults.push(firstDictionary)
    categoryGeneratorQueries += 1
    dictionaryFirstPassChanges = metaInteger(firstDictionary, 'changes')

    operationStage = 'dictionary_second_pass'
    const secondDictionary = await dictionaryUpsert(env, identity, observedAt)
    operationResults.push(secondDictionary)
    categoryGeneratorQueries += 1
    dictionarySecondPassChanges = metaInteger(secondDictionary, 'changes')

    operationStage = 'rollup_probe_row'
    const rollup = await env.DB.prepare(`
      INSERT INTO streamer_intraday_rollups (
        provider, day, streamer_id, display_name, daily_rank,
        total_viewer_minutes, peak_viewers, sample_count, observed_minutes,
        hourly_json, selection_state, source_mode, contract_version, updated_at,
        category_hourly_json, category_observed_samples,
        category_missing_samples, category_contract_version
      ) VALUES (?, ?, ?, ?, 2147483647, 0, 0, 1, 1, '[]',
                'category_cost_probe', 'cost-probe', ?, ?, ?, 1, 0, ?)
      ON CONFLICT(provider, day, streamer_id) DO UPDATE SET
        category_hourly_json = excluded.category_hourly_json,
        category_observed_samples = excluded.category_observed_samples,
        category_missing_samples = excluded.category_missing_samples,
        category_contract_version = excluded.category_contract_version,
        updated_at = excluded.updated_at
    `).bind(
      env.PROVIDER,
      identity.day,
      identity.streamerId,
      `ViewLoom ${env.PROVIDER} category cost probe`,
      ANALYTICS_CONTRACT_VERSION,
      observedAt,
      categoryHourlyJson(identity.categoryId),
      CATEGORY_CONTRACT_VERSION,
    ).run()
    operationResults.push(rollup)
    categoryGeneratorQueries += 1

    operationStage = 'status_probe_row'
    const status = await env.DB.prepare(`
      INSERT INTO intraday_rollup_status (
        provider, day, candidate_streamers, retained_streamers,
        retained_streamer_cap, source_snapshots, selection_state,
        coverage_state, source_mode, contract_version, refreshed_at,
        category_observed_streamers, category_observed_samples,
        category_missing_samples, category_coverage_state
      ) VALUES (?, ?, 1, 1, 1, 1, 'category_cost_probe',
                'good', 'cost-probe', ?, ?, 1, 1, 0, 'observed')
      ON CONFLICT(provider, day) DO UPDATE SET
        category_observed_streamers = excluded.category_observed_streamers,
        category_observed_samples = excluded.category_observed_samples,
        category_missing_samples = excluded.category_missing_samples,
        category_coverage_state = excluded.category_coverage_state,
        refreshed_at = excluded.refreshed_at
    `).bind(
      env.PROVIDER,
      identity.day,
      ANALYTICS_CONTRACT_VERSION,
      observedAt,
    ).run()
    operationResults.push(status)
    categoryGeneratorQueries += 1

    operationStage = 'verify_probe_rows'
    const during = await inspectReserved(env, identity)
    operationResults.push(...during.results)
    probeRowsAfterWrite = during.counts.totalRows
  } catch (error) {
    operationError = sanitizeError(error)
  } finally {
    operationStage = 'cleanup'
    try {
      const cleanup = await env.DB.batch([
        env.DB.prepare(`
          DELETE FROM streamer_intraday_rollups
          WHERE provider = ? AND day = ? AND streamer_id = ?
        `).bind(env.PROVIDER, identity.day, identity.streamerId),
        env.DB.prepare(`
          DELETE FROM intraday_rollup_status
          WHERE provider = ? AND day = ? AND selection_state = 'category_cost_probe'
        `).bind(env.PROVIDER, identity.day),
        env.DB.prepare(`
          DELETE FROM provider_category_dictionary
          WHERE provider = ? AND category_id = ?
        `).bind(env.PROVIDER, identity.categoryId),
      ])
      operationResults.push(...cleanup)
    } catch (error) {
      cleanupError = sanitizeError(error)
    }
  }

  const post = await inspectProvider(env, identity)
  const operationMeta = summarizeMeta(operationResults)
  const databaseSizeBefore = pre.query.sizeAfter
  const databaseSizeAfter = post.query.sizeAfter
  const databaseSizeDeltaBytes = databaseSizeBefore === null || databaseSizeAfter === null
    ? null
    : databaseSizeAfter - databaseSizeBefore

  const checks = {
    preconditionsPassed: Object.values(preconditions).every(Boolean),
    dictionaryFirstPassChangedOnce: dictionaryFirstPassChanges === 1,
    dictionarySecondPassNoOp: dictionarySecondPassChanges === 0,
    probeRowsCreated: probeRowsAfterWrite === 3,
    generatorQueryCountWithinLimit: categoryGeneratorQueries <= MAX_GENERATOR_QUERIES,
    cleanupSucceeded: cleanupError === null,
    cleanupRemainingRowsZero: post.reserved.totalRows === 0,
    providerLeakageZero: post.providerLeakageRows === 0,
    collectorStatePreserved: stableJson(pre.collectorStatus) === stableJson(post.collectorStatus),
    categoryCaptureStillDisabled: true,
  }

  const ok = operationError === null && Object.values(checks).every(Boolean)

  return {
    ok,
    schemaVersion: 'viewloom-12a4-category-execution-cost-probe-result-v1',
    provider: env.PROVIDER,
    runId: identity.runId,
    stage: ok ? 'complete' : operationStage,
    observedAt,
    identity: {
      day: identity.day,
      streamerId: identity.streamerId,
      categoryId: identity.categoryId,
    },
    preconditions,
    measurements: {
      categoryGeneratorQueries,
      dictionaryFirstPassChanges,
      dictionarySecondPassChanges,
      probeRowsAfterWrite,
      probeCleanupRemainingRows: post.reserved.totalRows,
      providerLeakageRows: post.providerLeakageRows,
      databaseSizeBefore,
      databaseSizeAfter,
      databaseSizeDeltaBytes,
      operation: operationMeta,
      workerWallMs: round(Date.now() - startedAt, 2),
    },
    checks,
    errors: {
      operation: operationError,
      cleanup: cleanupError,
    },
    pre,
    post,
    boundaries: probeBoundaries(),
  }
}

async function dictionaryUpsert(env: Env, identity: ProbeIdentity, observedAt: string) {
  return env.DB.prepare(`
    INSERT INTO provider_category_dictionary (
      provider, category_id, category_name,
      first_observed_at, last_observed_at, contract_version
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider, category_id) DO UPDATE SET
      category_name = excluded.category_name,
      last_observed_at = excluded.last_observed_at,
      contract_version = excluded.contract_version
    WHERE provider_category_dictionary.category_name != excluded.category_name
       OR provider_category_dictionary.contract_version != excluded.contract_version
  `).bind(
    env.PROVIDER,
    identity.categoryId,
    identity.categoryName,
    observedAt,
    observedAt,
    CATEGORY_CONTRACT_VERSION,
  ).run()
}

async function inspectProvider(env: Env, identity: ProbeIdentity | null) {
  const startedAt = Date.now()
  const schemaResults = await env.DB.batch([
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = 'provider_category_dictionary'
    `),
    env.DB.prepare(`
      SELECT name
      FROM pragma_table_info('streamer_intraday_rollups')
      WHERE name IN (${CATEGORY_ROLLUP_COLUMNS.map(() => '?').join(', ')})
      ORDER BY name
    `).bind(...CATEGORY_ROLLUP_COLUMNS),
    env.DB.prepare(`
      SELECT name
      FROM pragma_table_info('intraday_rollup_status')
      WHERE name IN (${CATEGORY_STATUS_COLUMNS.map(() => '?').join(', ')})
      ORDER BY name
    `).bind(...CATEGORY_STATUS_COLUMNS),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = 'collector_status'
    `),
  ])

  const dictionaryCount = integer(firstValue(schemaResults[0], 'count'))
  const rollupColumns = stringValues(schemaResults[1], 'name')
  const statusColumns = stringValues(schemaResults[2], 'name')
  const collectorStatusTablePresent = integer(firstValue(schemaResults[3], 'count')) === 1
  const detailResults: D1Result<unknown>[] = []

  const latestResult = await env.DB.prepare(`
    SELECT bucket_minute, collected_at, stream_count, total_viewers, source_mode
    FROM minute_snapshots
    WHERE provider = ?
    ORDER BY bucket_minute DESC
    LIMIT 1
  `).bind(env.PROVIDER).all()
  detailResults.push(latestResult)
  const latestSnapshot = firstRow(latestResult)

  let collectorStatus: Record<string, unknown> | null = null
  if (collectorStatusTablePresent) {
    const collectorResult = await env.DB.prepare(`
      SELECT status, last_attempt_at, last_success_at, last_failure_at,
             latest_bucket_minute, latest_collected_at, updated_at
      FROM collector_status
      WHERE provider = ?
      LIMIT 1
    `).bind(env.PROVIDER).all()
    detailResults.push(collectorResult)
    collectorStatus = firstRow(collectorResult)
  }

  const reserved = identity
    ? await inspectReserved(env, identity)
    : { counts: emptyReservedCounts(), results: [] as D1Result<unknown>[] }
  detailResults.push(...reserved.results)

  const leakage = identity
    ? await inspectLeakage(env, identity)
    : { count: 0, results: [] as D1Result<unknown>[] }
  detailResults.push(...leakage.results)

  const healthSource = collectorStatus ? 'collector_status' : latestSnapshot ? 'latest_snapshot' : 'unavailable'

  return {
    ok: true,
    schemaVersion: 'viewloom-12a4-category-execution-cost-inspect-v1',
    provider: env.PROVIDER,
    observedAt: new Date().toISOString(),
    mode: 'bounded_execution_cost_probe_inspect',
    schema: {
      dictionaryTablePresent: dictionaryCount === 1,
      presentRollupColumns: rollupColumns,
      presentStatusColumns: statusColumns,
      categorySchemaComplete:
        dictionaryCount === 1
        && rollupColumns.length === CATEGORY_ROLLUP_COLUMNS.length
        && statusColumns.length === CATEGORY_STATUS_COLUMNS.length,
    },
    health: {
      source: healthSource,
      evidenceAvailable: healthSource !== 'unavailable',
      collectorStatusAvailable: Boolean(collectorStatus),
      latestSnapshotAvailable: Boolean(latestSnapshot),
    },
    latestSnapshot,
    collectorStatus,
    reserved: reserved.counts,
    providerLeakageRows: leakage.count,
    query: summarizeMeta([...schemaResults, ...detailResults]),
    workerWallMs: round(Date.now() - startedAt, 2),
    boundaries: probeBoundaries(),
  }
}

async function inspectReserved(env: Env, identity: ProbeIdentity) {
  const results = await env.DB.batch([
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM streamer_intraday_rollups
      WHERE provider = ? AND day = ? AND streamer_id = ?
    `).bind(env.PROVIDER, identity.day, identity.streamerId),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM intraday_rollup_status
      WHERE provider = ? AND day = ? AND selection_state = 'category_cost_probe'
    `).bind(env.PROVIDER, identity.day),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM provider_category_dictionary
      WHERE provider = ? AND category_id = ?
    `).bind(env.PROVIDER, identity.categoryId),
  ])
  const counts = {
    rollupRows: integer(firstValue(results[0], 'count')),
    statusRows: integer(firstValue(results[1], 'count')),
    dictionaryRows: integer(firstValue(results[2], 'count')),
    totalRows: 0,
  }
  counts.totalRows = counts.rollupRows + counts.statusRows + counts.dictionaryRows
  return { counts, results }
}

async function inspectLeakage(env: Env, identity: ProbeIdentity) {
  const results = await env.DB.batch([
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM streamer_intraday_rollups
      WHERE day = ? AND streamer_id = ? AND provider != ?
    `).bind(identity.day, identity.streamerId, env.PROVIDER),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM intraday_rollup_status
      WHERE day = ? AND selection_state = 'category_cost_probe' AND provider != ?
    `).bind(identity.day, env.PROVIDER),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM provider_category_dictionary
      WHERE category_id = ? AND provider != ?
    `).bind(identity.categoryId, env.PROVIDER),
  ])
  const count = results.reduce((total, result) => total + integer(firstValue(result, 'count')), 0)
  return { count, results }
}

function buildIdentity(provider: Provider, runIdValue: unknown): ProbeIdentity {
  const runId = String(runIdValue ?? '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9-]{7,63}$/.test(runId)) throw new Error('invalid_reserved_probe_run_id')
  const base = `${PROBE_PREFIX}${provider}:${runId}`
  return {
    runId,
    day: PROBE_DAY,
    streamerId: `${base}:streamer`,
    categoryId: `${base}:category`,
    categoryName: `ViewLoom ${provider} category cost probe`,
  }
}

function categoryHourlyJson(categoryId: string): string {
  return JSON.stringify({
    v: 1,
    c: [categoryId],
    r: [0],
    s: [1],
    m: [0],
    o: 1,
    x: 0,
  })
}

function probeBoundaries() {
  return {
    reservedIdentifiersOnly: true,
    fixedHistoricalProbeDay: PROBE_DAY,
    providerSeparated: true,
    remoteSchemaApply: false,
    categoryCaptureEnablement: false,
    collectorStatusWrites: false,
    newCron: false,
    backfill: false,
    rawRetentionChange: false,
    categoryAnalyticsUi: false,
    crossProviderCategoryIdentity: false,
    combinedProviderCategoryRanking: false,
  }
}

function emptyReservedCounts() {
  return { rollupRows: 0, statusRows: 0, dictionaryRows: 0, totalRows: 0 }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

async function optionalJson(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text()
  if (!text.trim()) return null
  const value = JSON.parse(text)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_json_body')
  return value as Record<string, unknown>
}

async function requiredJson(request: Request): Promise<Record<string, unknown>> {
  const value = await optionalJson(request)
  if (!value) throw new Error('json_body_required')
  return value
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

function summarizeMeta(results: D1Result<unknown>[]): MetaSummary {
  const summary: MetaSummary = {
    statements: results.length,
    durationMs: 0,
    rowsRead: 0,
    rowsWritten: 0,
    changes: 0,
    sizeAfter: null,
  }
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

function metaInteger(result: D1Result<unknown>, key: string): number {
  return integer((result.meta as Record<string, unknown> | undefined)?.[key])
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

function stableJson(value: unknown): string {
  return JSON.stringify(value ?? null)
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/[0-9a-f]{32,}/gi, '[redacted-id]')
    .slice(0, 240)
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}
