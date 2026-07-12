import {
  maybeGenerateIntradayRollups,
  type IntradayProvider,
} from '../../shared/intraday-rollup'

type Env = {
  DB: D1Database
  PROVIDER: IntradayProvider
  STREAMER_CAP: string
  BUCKET_MINUTES: string
  ACCEPTANCE_TOKEN: string
}

type DayObservation = {
  day: string
  candidateStreamers: number
  retainedStreamers: number
  retainedStreamerCap: number
  sourceSnapshots: number
  selectionState: string
  coverageState: string
  sourceMode: string
  rollupRows: number
  distinctRanks: number
  minimumRank: number
  maximumRank: number
  totalViewerMinutes: number
  totalSampleCount: number
  hourlyPayloadBytes: number
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!authorized(request, env.ACCEPTANCE_TOKEN)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    if (request.method !== 'POST' || url.pathname !== '/run') {
      return Response.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    const now = acceptanceMaintenanceTime(new Date())
    const streamerCap = boundedInt(env.STREAMER_CAP, env.PROVIDER === 'twitch' ? 600 : 200)
    const bucketMinutes = boundedInt(env.BUCKET_MINUTES, 5)

    const first = await maybeGenerateIntradayRollups(env.DB, {
      provider: env.PROVIDER,
      streamerCap,
      bucketMinutes,
      enabled: true,
    }, now)
    if (first.error || !first.attempted || !first.days?.length) {
      return Response.json({
        ok: false,
        provider: env.PROVIDER,
        error: first.error ?? 'first_generation_incomplete',
        first: sanitizeGeneration(first),
      }, { status: 500 })
    }
    const firstObservation = await observeDays(env.DB, env.PROVIDER, first.days.map((day) => day.day))

    const second = await maybeGenerateIntradayRollups(env.DB, {
      provider: env.PROVIDER,
      streamerCap,
      bucketMinutes,
      enabled: true,
    }, now)
    if (second.error || !second.attempted || !second.days?.length) {
      return Response.json({
        ok: false,
        provider: env.PROVIDER,
        error: second.error ?? 'second_generation_incomplete',
        first: sanitizeGeneration(first),
        second: sanitizeGeneration(second),
      }, { status: 500 })
    }
    const secondObservation = await observeDays(env.DB, env.PROVIDER, second.days.map((day) => day.day))

    const checks = {
      expectedDayCount: firstObservation.length === 2 && secondObservation.length === 2,
      firstRowsMatchStatus: observationsValid(firstObservation),
      secondRowsMatchStatus: observationsValid(secondObservation),
      idempotentObservations: JSON.stringify(firstObservation) === JSON.stringify(secondObservation),
      providerSeparated: first.provider === env.PROVIDER && second.provider === env.PROVIDER,
      queryBudgetBounded:
        Number(first.totals?.maximumQueries ?? 0) <= 12
        && Number(second.totals?.maximumQueries ?? 0) <= 12,
      retentionCleanupObserved:
        first.retentionCleanup?.attempted === true
        && second.retentionCleanup?.attempted === true,
    }
    const ok = Object.values(checks).every(Boolean)

    return Response.json({
      ok,
      schemaVersion: 'viewloom-12a3-generator-acceptance-probe-v1',
      provider: env.PROVIDER,
      observedAt: new Date().toISOString(),
      forcedMaintenanceTimeUtc: now.toISOString(),
      config: { streamerCap, bucketMinutes },
      first: sanitizeGeneration(first),
      second: sanitizeGeneration(second),
      firstObservation,
      secondObservation,
      checks,
      boundaries: {
        streamerIdentitiesIncluded: false,
        sourceRowsModified: false,
        backfillPerformed: false,
        newCronAdded: false,
        crossProviderOperation: false,
      },
    }, {
      status: ok ? 200 : 500,
      headers: { 'cache-control': 'no-store' },
    })
  },
}

async function observeDays(
  db: D1Database,
  provider: IntradayProvider,
  days: string[],
): Promise<DayObservation[]> {
  const observations: DayObservation[] = []
  for (const day of [...new Set(days)].sort()) {
    const result = await db.prepare(`
      SELECT
        s.day,
        s.candidate_streamers,
        s.retained_streamers,
        s.retained_streamer_cap,
        s.source_snapshots,
        s.selection_state,
        s.coverage_state,
        s.source_mode,
        (SELECT COUNT(*) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS rollup_rows,
        (SELECT COUNT(DISTINCT daily_rank) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS distinct_ranks,
        (SELECT COALESCE(MIN(daily_rank), 0) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS minimum_rank,
        (SELECT COALESCE(MAX(daily_rank), 0) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS maximum_rank,
        (SELECT COALESCE(SUM(total_viewer_minutes), 0) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS total_viewer_minutes,
        (SELECT COALESCE(SUM(sample_count), 0) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS total_sample_count,
        (SELECT COALESCE(SUM(LENGTH(hourly_json)), 0) FROM streamer_intraday_rollups r WHERE r.provider = s.provider AND r.day = s.day) AS hourly_payload_bytes
      FROM intraday_rollup_status s
      WHERE s.provider = ? AND s.day = ?
    `).bind(provider, day).first<Record<string, unknown>>()

    if (!result) continue
    observations.push({
      day: text(result.day),
      candidateStreamers: integer(result.candidate_streamers),
      retainedStreamers: integer(result.retained_streamers),
      retainedStreamerCap: integer(result.retained_streamer_cap),
      sourceSnapshots: integer(result.source_snapshots),
      selectionState: text(result.selection_state),
      coverageState: text(result.coverage_state),
      sourceMode: text(result.source_mode),
      rollupRows: integer(result.rollup_rows),
      distinctRanks: integer(result.distinct_ranks),
      minimumRank: integer(result.minimum_rank),
      maximumRank: integer(result.maximum_rank),
      totalViewerMinutes: integer(result.total_viewer_minutes),
      totalSampleCount: integer(result.total_sample_count),
      hourlyPayloadBytes: integer(result.hourly_payload_bytes),
    })
  }
  return observations
}

function observationsValid(rows: DayObservation[]): boolean {
  return rows.length === 2 && rows.every((row) => (
    row.sourceSnapshots > 0
    && row.retainedStreamers > 0
    && row.retainedStreamers <= row.retainedStreamerCap
    && row.rollupRows === row.retainedStreamers
    && row.distinctRanks === row.rollupRows
    && row.minimumRank === 1
    && row.maximumRank === row.rollupRows
    && row.totalViewerMinutes > 0
    && row.totalSampleCount > 0
    && row.hourlyPayloadBytes > 0
  ))
}

function sanitizeGeneration(result: Awaited<ReturnType<typeof maybeGenerateIntradayRollups>>) {
  return {
    provider: result.provider,
    enabled: result.enabled,
    attempted: result.attempted,
    maintenanceWindow: result.maintenanceWindow,
    days: result.days,
    retentionCleanup: result.retentionCleanup,
    totals: result.totals,
    error: result.error,
  }
}

function acceptanceMaintenanceTime(now: Date): Date {
  const forced = new Date(now)
  forced.setUTCHours(0, 20, 0, 0)
  return forced
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
