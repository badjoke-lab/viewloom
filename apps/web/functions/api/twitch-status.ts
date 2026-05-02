import type { Env } from '../_db/env'

type SnapshotRow = {
  provider: string
  bucket_minute: string
  collected_at: string
  covered_pages: number
  has_more: number
  stream_count: number
  total_viewers: number
  source_mode: string
}

type StatusRow = {
  provider: string
  status: string
  last_attempt_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_error: string | null
  latest_bucket_minute: string | null
  latest_collected_at: string | null
  latest_stream_count: number
  latest_total_viewers: number
  covered_pages: number
  has_more: number
  updated_at: string
}

const STALE_AFTER_MINUTES = 3
const STRONG_STALE_AFTER_MINUTES = 10

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const latest = await env.DB_TWITCH_HOT.prepare(
      `SELECT provider,bucket_minute,collected_at,covered_pages,has_more,stream_count,total_viewers,source_mode FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1`
    ).bind('twitch').first<SnapshotRow>()

    const collector = await env.DB_TWITCH_HOT.prepare(
      `SELECT provider,status,last_attempt_at,last_success_at,last_failure_at,last_error,latest_bucket_minute,latest_collected_at,latest_stream_count,latest_total_viewers,covered_pages,has_more,updated_at FROM collector_status WHERE provider = ? LIMIT 1`
    ).bind('twitch').first<StatusRow>()

    const generatedAt = new Date().toISOString()
    const minutesSinceSuccess = minutesBetween(collector?.last_success_at ?? latest?.collected_at ?? null, generatedAt)
    const observedCount = latest?.stream_count ?? collector?.latest_stream_count ?? 0
    const hasMore = Boolean(latest?.has_more ?? collector?.has_more ?? 0)
    const sourceMode = minutesSinceSuccess != null && minutesSinceSuccess >= STALE_AFTER_MINUTES ? 'stale' : 'real'
    const state = deriveState({ collectorStatus: collector?.status ?? null, minutesSinceSuccess, observedCount, hasMore })

    return Response.json({
      version: 'viewloom-status-v1',
      platform: 'twitch',
      source: 'api',
      sourceMode,
      state,
      generatedAt,
      collector: {
        state: collector?.status ?? 'unconfigured',
        runCadenceSeconds: 60,
        lastAttemptAt: collector?.last_attempt_at ?? null,
        lastSuccessAt: collector?.last_success_at ?? latest?.collected_at ?? null,
        lastFailureAt: collector?.last_failure_at ?? null,
        lastErrorCode: collector?.last_error ? 'collector_error' : null,
        lastErrorMessage: sanitizeError(collector?.last_error),
      },
      freshness: {
        lastSuccessAt: collector?.last_success_at ?? latest?.collected_at ?? null,
        minutesSinceSuccess,
        staleAfterMinutes: STALE_AFTER_MINUTES,
        strongStaleAfterMinutes: STRONG_STALE_AFTER_MINUTES,
        isFresh: state === 'fresh' || state === 'partial',
        isStale: state === 'stale' || state === 'strong_stale',
        isStrongStale: state === 'strong_stale',
      },
      latestSnapshot: {
        bucketMinute: latest?.bucket_minute ?? collector?.latest_bucket_minute ?? null,
        observedCount,
        coveredPages: latest?.covered_pages ?? collector?.covered_pages ?? null,
        hasMore,
        topLimit: 50,
      },
      coverage: {
        state: hasMore ? 'partial' : observedCount > 0 ? 'good' : 'missing',
        observedCount,
        coveredPages: latest?.covered_pages ?? collector?.covered_pages ?? null,
        hasMore,
        notes: hasMore ? ['More streams may exist beyond the current collection window.'] : [],
      },
      features: buildFeatures(state, sourceMode, collector?.last_success_at ?? latest?.collected_at ?? null),
      limitations: [
        'ViewLoom is unofficial and independent.',
        'Observed data is not a full official platform ranking.',
        'Viewer counts and activity signals may be approximate or sampled.',
      ],
      notes: latest ? [] : ['No latest Twitch snapshot was found.'],
    })
  } catch (error) {
    return Response.json({
      version: 'viewloom-status-v1',
      platform: 'twitch',
      source: 'api',
      sourceMode: 'demo',
      state: 'unconfigured',
      generatedAt: new Date().toISOString(),
      error: { code: 'status_unavailable', message: sanitizeError(error instanceof Error ? error.message : String(error)) ?? 'Status unavailable' },
      notes: ['Required data binding or query is unavailable.'],
    }, { status: 200 })
  }
}

function minutesBetween(from: string | null, to: string): number | null {
  if (!from) return null
  const ms = Date.parse(to) - Date.parse(from)
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 60000)) : null
}

function deriveState(input: { collectorStatus: string | null; minutesSinceSuccess: number | null; observedCount: number; hasMore: boolean }): string {
  const collector = String(input.collectorStatus ?? '').toLowerCase()
  if (collector === 'failing' || collector === 'error') return 'failing'
  if (input.minutesSinceSuccess == null) return 'empty'
  if (input.minutesSinceSuccess >= STRONG_STALE_AFTER_MINUTES) return 'strong_stale'
  if (input.minutesSinceSuccess >= STALE_AFTER_MINUTES) return 'stale'
  if (input.hasMore) return 'partial'
  if (input.observedCount === 0) return 'empty'
  return 'fresh'
}

function buildFeatures(state: string, sourceMode: string, updatedAt: string | null) {
  const commonState = state === 'fresh' || state === 'stale' || state === 'strong_stale' || state === 'empty' ? state : state === 'partial' ? 'partial' : 'partial'
  return [
    { key: 'heatmap', label: 'Heatmap', role: 'now', apiPath: '/api/twitch-heatmap', state: commonState, source: 'api', lastUpdatedAt: updatedAt, knownGap: 'Activity may be sampled or unavailable.', pagePath: '/twitch/heatmap/' },
    { key: 'day_flow', label: 'Day Flow', role: 'today', apiPath: '/api/day-flow', state: commonState, source: 'api', lastUpdatedAt: updatedAt, knownGap: 'Share is derived from observed buckets.', pagePath: '/twitch/day-flow/' },
    { key: 'battle_lines', label: 'Battle Lines', role: 'rivalry', apiPath: '/api/battle-lines', state: commonState, source: 'api', lastUpdatedAt: updatedAt, knownGap: 'Events are derived from viewer deltas.', pagePath: '/twitch/battle-lines/' },
    { key: 'history', label: 'History', role: 'trends', apiPath: '/api/history', state: commonState, source: 'api', lastUpdatedAt: updatedAt, knownGap: 'Depends on retained observed snapshots.', pagePath: '/twitch/history/' },
  ]
}

function sanitizeError(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]').slice(0, 220)
}
