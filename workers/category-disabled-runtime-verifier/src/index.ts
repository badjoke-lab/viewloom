type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
  VERIFY_TOKEN: string
  MIN_COLLECTED_AT: string
}

type LatestSnapshotRow = {
  bucket_minute: string
  collected_at: string
  source_mode: string
  category_contract_type: string | null
  category_ids_type: string | null
  category_refs_type: string | null
}

type CountRow = { count: number }
type TableInfoRow = { name: string }

const EXPECTED_ROLLUP_COLUMNS = [
  'category_hourly_json',
  'category_observed_samples',
  'category_missing_samples',
  'category_contract_version',
]

const EXPECTED_STATUS_COLUMNS = [
  'category_observed_streamers',
  'category_observed_samples',
  'category_missing_samples',
  'category_coverage_state',
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!authorized(request, env.VERIFY_TOKEN)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/verify') {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    const latest = await env.DB.prepare(`
      SELECT
        bucket_minute,
        collected_at,
        source_mode,
        json_type(payload_json, '$.categoryContractVersion') AS category_contract_type,
        json_type(payload_json, '$.categoryIds') AS category_ids_type,
        json_type(payload_json, '$.categoryRefs') AS category_refs_type
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind(env.PROVIDER).first<LatestSnapshotRow>()

    const dictionary = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM sqlite_master
      WHERE type = 'table' AND name = 'provider_category_dictionary'
    `).first<CountRow>()

    const rollupColumns = await tableColumns(env.DB, 'streamer_intraday_rollups')
    const statusColumns = await tableColumns(env.DB, 'intraday_rollup_status')
    const foreignProviders = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT DISTINCT provider FROM minute_snapshots
        UNION
        SELECT DISTINCT provider FROM streamer_intraday_rollups
        UNION
        SELECT DISTINCT provider FROM intraday_rollup_status
      )
      WHERE provider <> ?
    `).bind(env.PROVIDER).first<CountRow>()

    const minimumCollectedAtMs = Date.parse(env.MIN_COLLECTED_AT)
    const latestCollectedAt = text(latest?.collected_at)
    const latestAfterDeployment = Number.isFinite(minimumCollectedAtMs)
      && Date.parse(latestCollectedAt) >= minimumCollectedAtMs
    const presentRollupColumns = EXPECTED_ROLLUP_COLUMNS.filter((column) => rollupColumns.includes(column))
    const presentStatusColumns = EXPECTED_STATUS_COLUMNS.filter((column) => statusColumns.includes(column))
    const categoryPayloadFieldsAbsent = latest?.category_contract_type == null
      && latest?.category_ids_type == null
      && latest?.category_refs_type == null
    const categorySchemaAbsent = Number(dictionary?.count ?? 0) === 0
      && presentRollupColumns.length === 0
      && presentStatusColumns.length === 0
    const checks = {
      latestSnapshotPresent: Boolean(latest),
      latestAfterDeployment,
      categoryPayloadFieldsAbsent,
      categorySchemaAbsent,
      providerSeparated: Number(foreignProviders?.count ?? 0) === 0,
    }
    const ok = Object.values(checks).every(Boolean)

    return Response.json({
      ok,
      schemaVersion: 'viewloom-12a4-disabled-runtime-provider-evidence-v1',
      provider: env.PROVIDER,
      observedAt: new Date().toISOString(),
      minimumCollectedAt: env.MIN_COLLECTED_AT,
      latest: latest ? {
        bucketMinute: text(latest.bucket_minute),
        collectedAt: latestCollectedAt,
        sourceMode: text(latest.source_mode),
        categoryContractType: latest.category_contract_type,
        categoryIdsType: latest.category_ids_type,
        categoryRefsType: latest.category_refs_type,
      } : null,
      schema: {
        dictionaryTableCount: integer(dictionary?.count),
        presentRollupColumns,
        presentStatusColumns,
      },
      checks,
      boundaries: {
        readOnly: true,
        channelIdentitiesIncluded: false,
        rawPayloadIncluded: false,
        sourceRowsModified: false,
        crossProviderAggregation: false,
      },
    }, {
      status: ok ? 200 : 409,
      headers: { 'cache-control': 'no-store' },
    })
  },
}

async function tableColumns(db: D1Database, table: string): Promise<string[]> {
  const result = await db.prepare(`PRAGMA table_info(${table})`).all<TableInfoRow>()
  return (result.results ?? []).map((row) => text(row.name)).filter(Boolean).sort()
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
