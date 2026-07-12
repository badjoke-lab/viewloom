type Provider = 'twitch' | 'kick'

type Env = {
  DB: D1Database
  PROVIDER: Provider
  STREAMER_CAP: string
  VERIFY_TOKEN: string
  MIN_REFRESHED_AT: string
}

type DayRow = {
  day: string
  candidate_streamers: number
  retained_streamers: number
  retained_streamer_cap: number
  source_snapshots: number
  selection_state: string
  coverage_state: string
  source_mode: string
  contract_version: string
  refreshed_at: string
  rollup_rows: number
  distinct_ranks: number
  minimum_rank: number
  maximum_rank: number
  minimum_updated_at: string
  maximum_updated_at: string
  total_viewer_minutes: number
  total_sample_count: number
  hourly_payload_bytes: number
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!authorized(request, env.VERIFY_TOKEN)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/verify') {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const yesterdayDate = new Date(now)
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
    const yesterday = yesterdayDate.toISOString().slice(0, 10)
    const cap = boundedInt(env.STREAMER_CAP, env.PROVIDER === 'twitch' ? 600 : 200)
    const minimumRefresh = Date.parse(env.MIN_REFRESHED_AT)

    const days = []
    for (const day of [yesterday, today]) {
      const row = await observeDay(env.DB, env.PROVIDER, day)
      if (row) days.push(normalize(row))
    }

    const providerLeakage = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM (
        SELECT DISTINCT provider FROM streamer_intraday_rollups
        UNION
        SELECT DISTINCT provider FROM intraday_rollup_status
      )
      WHERE provider <> ?
    `).bind(env.PROVIDER).first<{ count: number }>()

    const checks = {
      expectedDayCount: days.length === 2,
      rowsMatchStatus: days.length === 2 && days.every((day) => (
        day.rollupRows === day.retainedStreamers
        && day.rollupRows > 0
        && day.rollupRows <= cap
      )),
      capMatches: days.length === 2 && days.every((day) => day.retainedStreamerCap === cap),
      ranksValid: days.length === 2 && days.every((day) => (
        day.distinctRanks === day.rollupRows
        && day.minimumRank === 1
        && day.maximumRank === day.rollupRows
      )),
      aggregatesPositive: days.length === 2 && days.every((day) => (
        day.sourceSnapshots > 0
        && day.totalViewerMinutes > 0
        && day.totalSampleCount > 0
        && day.hourlyPayloadBytes > 0
      )),
      refreshedAfterMainEnablement: Number.isFinite(minimumRefresh) && days.length === 2 && days.every((day) => (
        Date.parse(day.refreshedAt) >= minimumRefresh
        && Date.parse(day.minimumUpdatedAt) >= minimumRefresh
        && Date.parse(day.maximumUpdatedAt) >= minimumRefresh
      )),
      contractVersionCurrent: days.length === 2 && days.every((day) => day.contractVersion === 'analytics-source-v1'),
      providerSeparated: Number(providerLeakage?.count ?? 0) === 0,
    }

    const ok = Object.values(checks).every(Boolean)
    return Response.json({
      ok,
      schemaVersion: 'viewloom-12a3-postmerge-provider-evidence-v1',
      provider: env.PROVIDER,
      observedAt: now.toISOString(),
      minimumRefreshedAt: env.MIN_REFRESHED_AT,
      config: { streamerCap: cap },
      days,
      checks,
      boundaries: {
        readOnly: true,
        streamerIdentitiesIncluded: false,
        crossProviderAggregation: false,
        sourceRowsModified: false,
      },
    }, {
      status: ok ? 200 : 409,
      headers: { 'cache-control': 'no-store' },
    })
  },
}

async function observeDay(db: D1Database, provider: Provider, day: string): Promise<DayRow | null> {
  return db.prepare(`
    SELECT
      s.day,
      s.candidate_streamers,
      s.retained_streamers,
      s.retained_streamer_cap,
      s.source_snapshots,
      s.selection_state,
      s.coverage_state,
      s.source_mode,
      s.contract_version,
      s.refreshed_at,
      COUNT(r.streamer_id) AS rollup_rows,
      COUNT(DISTINCT r.daily_rank) AS distinct_ranks,
      COALESCE(MIN(r.daily_rank), 0) AS minimum_rank,
      COALESCE(MAX(r.daily_rank), 0) AS maximum_rank,
      COALESCE(MIN(r.updated_at), '') AS minimum_updated_at,
      COALESCE(MAX(r.updated_at), '') AS maximum_updated_at,
      COALESCE(SUM(r.total_viewer_minutes), 0) AS total_viewer_minutes,
      COALESCE(SUM(r.sample_count), 0) AS total_sample_count,
      COALESCE(SUM(LENGTH(r.hourly_json)), 0) AS hourly_payload_bytes
    FROM intraday_rollup_status s
    LEFT JOIN streamer_intraday_rollups r
      ON r.provider = s.provider AND r.day = s.day
    WHERE s.provider = ? AND s.day = ?
    GROUP BY
      s.day,
      s.candidate_streamers,
      s.retained_streamers,
      s.retained_streamer_cap,
      s.source_snapshots,
      s.selection_state,
      s.coverage_state,
      s.source_mode,
      s.contract_version,
      s.refreshed_at
  `).bind(provider, day).first<DayRow>()
}

function normalize(row: DayRow) {
  return {
    day: text(row.day),
    candidateStreamers: integer(row.candidate_streamers),
    retainedStreamers: integer(row.retained_streamers),
    retainedStreamerCap: integer(row.retained_streamer_cap),
    sourceSnapshots: integer(row.source_snapshots),
    selectionState: text(row.selection_state),
    coverageState: text(row.coverage_state),
    sourceMode: text(row.source_mode),
    contractVersion: text(row.contract_version),
    refreshedAt: text(row.refreshed_at),
    rollupRows: integer(row.rollup_rows),
    distinctRanks: integer(row.distinct_ranks),
    minimumRank: integer(row.minimum_rank),
    maximumRank: integer(row.maximum_rank),
    minimumUpdatedAt: text(row.minimum_updated_at),
    maximumUpdatedAt: text(row.maximum_updated_at),
    totalViewerMinutes: integer(row.total_viewer_minutes),
    totalSampleCount: integer(row.total_sample_count),
    hourlyPayloadBytes: integer(row.hourly_payload_bytes),
  }
}

function authorized(request: Request, token: string): boolean {
  return Boolean(token) && request.headers.get('authorization') === `Bearer ${token}`
}

function boundedInt(value: string, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

function integer(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
