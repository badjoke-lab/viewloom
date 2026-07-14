type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
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

const LATEST_SNAPSHOT_FIELDS = [
  'bucket_minute',
  'collected_at',
  'stream_count',
  'total_viewers',
  'source_mode',
] as const

const COLLECTOR_STATUS_FIELDS = [
  'status',
  'last_attempt_at',
  'last_success_at',
  'last_failure_at',
  'latest_bucket_minute',
  'latest_collected_at',
  'updated_at',
] as const

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({
        ok: true,
        provider: env.PROVIDER,
        mode: 'read_only_preflight',
        remoteMigrationApplied: false,
        categoryCaptureEnabled: false,
      }, { headers: { 'cache-control': 'no-store' } })
    }

    if (request.method === 'POST' && url.pathname === '/inspect') {
      if (!authorized(request, env.PROBE_TOKEN)) {
        return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
      }

      try {
        return Response.json(await inspectProvider(env), {
          headers: { 'cache-control': 'no-store' },
        })
      } catch (error) {
        return Response.json({
          ok: false,
          provider: env.PROVIDER,
          error: sanitizeError(error),
          boundaries: planningBoundaries(),
        }, {
          status: 500,
          headers: { 'cache-control': 'no-store' },
        })
      }
    }

    return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
  },
}

async function inspectProvider(env: Env) {
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
      WHERE type = 'table' AND name = 'minute_snapshots'
    `),
    env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = 'collector_status'
    `),
    env.DB.prepare(`
      SELECT name
      FROM pragma_table_info('minute_snapshots')
      ORDER BY cid
    `),
    env.DB.prepare(`
      SELECT name
      FROM pragma_table_info('collector_status')
      ORDER BY cid
    `),
  ])

  const [
    dictionaryResult,
    rollupColumnsResult,
    statusColumnsResult,
    minuteTableResult,
    collectorTableResult,
    minuteColumnsResult,
    collectorColumnsResult,
  ] = schemaResults

  const dictionaryCount = integer(firstValue(dictionaryResult, 'count'))
  const rollupColumns = stringValues(rollupColumnsResult, 'name')
  const statusColumns = stringValues(statusColumnsResult, 'name')
  const minuteSnapshotsTablePresent = integer(firstValue(minuteTableResult, 'count')) === 1
  const collectorStatusTablePresent = integer(firstValue(collectorTableResult, 'count')) === 1
  const minuteSnapshotColumns = stringValues(minuteColumnsResult, 'name')
  const collectorStatusColumns = stringValues(collectorColumnsResult, 'name')

  const detailResults: D1Result<unknown>[] = []
  let latest: Record<string, unknown> | null = null
  let collector: Record<string, unknown> | null = null
  let providerLeakageRows = 0

  if (minuteSnapshotsTablePresent && minuteSnapshotColumns.includes('provider')) {
    const latestResult = await env.DB.prepare(`
      SELECT *
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind(env.PROVIDER).all()
    detailResults.push(latestResult)
    latest = pickRow(firstRow(latestResult), LATEST_SNAPSHOT_FIELDS)

    const providerLeakageResult = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM minute_snapshots
      WHERE provider != ?
    `).bind(env.PROVIDER).all()
    detailResults.push(providerLeakageResult)
    providerLeakageRows = integer(firstValue(providerLeakageResult, 'count'))
  }

  if (collectorStatusTablePresent && collectorStatusColumns.includes('provider')) {
    const collectorResult = await env.DB.prepare(`
      SELECT *
      FROM collector_status
      WHERE provider = ?
      LIMIT 1
    `).bind(env.PROVIDER).all()
    detailResults.push(collectorResult)
    collector = pickRow(firstRow(collectorResult), COLLECTOR_STATUS_FIELDS)
  }

  const healthSource = collector ? 'collector_status' : latest ? 'latest_snapshot' : 'unavailable'
  const meta = summarizeMeta([...schemaResults, ...detailResults])

  return {
    ok: true,
    schemaVersion: 'viewloom-12a4-category-cost-preflight-v2',
    provider: env.PROVIDER,
    observedAt: new Date().toISOString(),
    mode: 'read_only_preflight',
    schema: {
      dictionaryTablePresent: dictionaryCount === 1,
      presentRollupColumns: rollupColumns,
      presentStatusColumns: statusColumns,
      categorySchemaComplete:
        dictionaryCount === 1
        && rollupColumns.length === CATEGORY_ROLLUP_COLUMNS.length
        && statusColumns.length === CATEGORY_STATUS_COLUMNS.length,
      minuteSnapshotsTablePresent,
      collectorStatusTablePresent,
      minuteSnapshotColumns,
      collectorStatusColumns,
    },
    health: {
      source: healthSource,
      evidenceAvailable: healthSource !== 'unavailable',
      collectorStatusAvailable: Boolean(collector),
      latestSnapshotAvailable: Boolean(latest),
    },
    latestSnapshot: latest,
    collectorStatus: collector,
    providerLeakageRows,
    query: meta,
    workerWallMs: round(Date.now() - startedAt, 2),
    boundaries: planningBoundaries(),
  }
}

function planningBoundaries() {
  return {
    readOnly: true,
    remoteMigrationAppliedByWorker: false,
    categoryCaptureEnabledByWorker: false,
    productionRowsWrittenByWorker: false,
    newCron: false,
    backfill: false,
    rawRetentionChanged: false,
    crossProviderOperation: false,
  }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
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

function pickRow<const T extends readonly string[]>(
  row: Record<string, unknown> | null,
  fields: T,
): Record<T[number], unknown> | null {
  if (!row) return null
  const picked = {} as Record<T[number], unknown>
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(row, field)) picked[field] = row[field]
  }
  return picked
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
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 240)
}
