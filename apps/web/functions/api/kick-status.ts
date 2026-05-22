import type { Env } from '../_db/env'

type SnapshotRow = {
  provider: string
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  source_mode: string
  payload_json: string
}

type SourceCountRow = { source_mode: string; rows: number }
type Raw = Record<string, unknown>

const STALE_AFTER_MINUTES = 10
const STRONG_STALE_AFTER_MINUTES = 30
const DEFAULT_COVERAGE_MODE = 'seed-list'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const latest = await env.DB_KICK_HOT.prepare(`
      SELECT provider,bucket_minute,collected_at,stream_count,total_viewers,source_mode,payload_json
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind('kick').first<SnapshotRow>()

    const sourceRows = await env.DB_KICK_HOT.prepare(`
      SELECT source_mode, COUNT(*) AS rows
      FROM minute_snapshots
      WHERE provider = ?
      GROUP BY source_mode
      ORDER BY rows DESC
    `).bind('kick').all<SourceCountRow>()

    const generatedAt = new Date().toISOString()
    const minutesSinceSuccess = minutesBetween(latest?.collected_at ?? null, generatedAt)
    const sourceMode = latest?.source_mode ?? 'empty'
    const latestPayload = parsePayload(latest?.payload_json)
    const latestObservedChannels = normalizeChannels(latestPayload?.items)
    const collectorMeta = normalizeCollectorMeta(latestPayload?.collectorMeta)
    const runtimeCoverageMode = coverageModeFromMeta(collectorMeta)
    const targetSource = str(collectorMeta.targetSource) || runtimeCoverageMode
    const registryFeedback = normalizeRegistryFeedback(collectorMeta.registryFeedback)
    const state = deriveState(sourceMode, minutesSinceSuccess, latest?.stream_count ?? 0)
    const authMode = sourceMode === 'authenticated' ? 'authenticated' : sourceMode === 'fixture' ? 'fixture' : 'public-channel-fallback'

    return Response.json({
      version: 'viewloom-kick-status-v3',
      platform: 'kick',
      source: 'api',
      storage: { binding: 'DB_KICK_HOT', database: 'vl_kick_hot' },
      sourceMode,
      authMode,
      coverageMode: runtimeCoverageMode,
      targetSource,
      registryCandidateCount: nullableNumber(collectorMeta.registryCandidateCount),
      registryError: str(collectorMeta.registryError) || null,
      registryFeedback,
      coverageModel: {
        mode: runtimeCoverageMode,
        label: runtimeCoverageMode === 'registry' ? 'Registry-backed candidate coverage' : 'Seed-list coverage only',
        isTwitchParity: false,
        isDirectoryCoverage: false,
        description: runtimeCoverageMode === 'registry'
          ? 'Kick is selecting attempted channel slugs from kick_channels registry rows. This is still not Twitch-like live directory discovery.'
          : 'Kick currently samples configured and built-in channel slug candidates. It does not yet have Twitch-like live directory discovery.',
        nextRequiredArchitecture: runtimeCoverageMode === 'registry' ? 'candidate expansion plus discovery job' : 'kick_channels registry plus discovery job',
      },
      state,
      generatedAt,
      collector: {
        state: latest ? 'snapshot_available' : 'empty',
        mode: authMode,
        sourceMode,
        coverageMode: runtimeCoverageMode,
        targetSource,
        configuredChannelMechanism: runtimeCoverageMode === 'registry' ? 'kick_channels registry target selection' : 'configured and built-in seed slug list',
        configuredChannels: collectorMeta.configuredChannels ?? null,
        attemptedChannels: collectorMeta.attemptedChannels ?? null,
        registryCandidateCount: nullableNumber(collectorMeta.registryCandidateCount),
        registryError: str(collectorMeta.registryError) || null,
        registryFeedback,
        lastSuccessAt: latest?.collected_at ?? null,
        writtenStreamCount: latest?.stream_count ?? 0,
        observedSlugs: collectorMeta.observedSlugs ?? latestObservedChannels.map((channel) => channel.slug).filter(Boolean),
        missedSlugs: collectorMeta.missedSlugs ?? [],
        attemptedPublicFallback: collectorMeta.attemptedPublicFallback ?? null,
        reason: collectorMeta.reason ?? null,
      },
      freshness: {
        lastSuccessAt: latest?.collected_at ?? null,
        minutesSinceSuccess,
        staleAfterMinutes: STALE_AFTER_MINUTES,
        strongStaleAfterMinutes: STRONG_STALE_AFTER_MINUTES,
        isFresh: state === 'fresh' || state === 'partial',
        isStale: state === 'stale' || state === 'strong_stale',
      },
      latestSnapshot: {
        bucketMinute: latest?.bucket_minute ?? null,
        collectedAt: latest?.collected_at ?? null,
        observedCount: latest?.stream_count ?? 0,
        streamCount: latest?.stream_count ?? 0,
        totalViewers: latest?.total_viewers ?? 0,
        sourceMode,
        coverageMode: runtimeCoverageMode,
        targetSource,
      },
      latestObservedChannels,
      collectorMeta,
      sourceModes: sourceRows.results ?? [],
      coverage: {
        state: latest ? (latest.stream_count > 0 ? `${runtimeCoverageMode}-observed` : 'empty') : 'missing',
        mode: runtimeCoverageMode,
        observedCount: latest?.stream_count ?? 0,
        isTwitchParity: false,
        notes: [
          'Kick reads DB_KICK_HOT / vl_kick_hot only.',
          runtimeCoverageMode === 'registry'
            ? 'Kick is registry-backed candidate coverage, not Twitch-parity directory coverage.'
            : 'Kick coverage is seed-list based and is not Twitch-parity directory coverage.',
          'Fixture, public-channel-fallback, empty-public-channel-fallback, and authenticated source modes are surfaced explicitly.',
          registryFeedback.applied ? `Registry feedback updated ${registryFeedback.observedUpdated} observed and ${registryFeedback.missedUpdated} missed candidates.` : 'Registry feedback was not applied for the latest snapshot.',
          latestObservedChannels.length > 0 ? `Latest snapshot contains ${latestObservedChannels.length} observed Kick channels.` : 'Latest snapshot contains no observed Kick channels.',
        ],
      },
      features: buildFeatures(state, sourceMode, latest?.collected_at ?? null),
      limitations: [
        'ViewLoom is unofficial and independent.',
        'Kick activity signals are unavailable in the current DB_KICK_HOT payload; viewer volume and share remain available.',
        runtimeCoverageMode === 'registry'
          ? 'Kick currently uses registry-backed candidate coverage; it still does not have Twitch-like live directory discovery.'
          : 'Kick currently uses seed-list coverage only; it does not yet have Twitch-like live directory discovery.',
        'Kick should not be described as complete, Twitch-parity, globally discovered, or fully representative while collection is seed-list or registry-candidate based.',
        sourceMode === 'fixture' ? 'Latest rows are fixture rows and must not be interpreted as live production data.' : 'Public-channel fallback rows are sampled from configured, built-in, or registry-selected channel slug candidates unless authenticated source_mode is present.',
      ],
      notes: latest ? [`latest_source_mode=${sourceMode}`, `coverage_mode=${runtimeCoverageMode}`, `target_source=${targetSource}`] : ['No latest Kick snapshot was found in DB_KICK_HOT.'],
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return Response.json({
      version: 'viewloom-kick-status-v3',
      platform: 'kick',
      source: 'api',
      storage: { binding: 'DB_KICK_HOT', database: 'vl_kick_hot' },
      sourceMode: 'unconfigured',
      authMode: 'unknown',
      coverageMode: DEFAULT_COVERAGE_MODE,
      state: 'unconfigured',
      generatedAt: new Date().toISOString(),
      error: { code: 'kick_status_unavailable', message: sanitize(error instanceof Error ? error.message : String(error)) },
      limitations: ['Required Kick D1 binding or query is unavailable.'],
      notes: ['Kick status could not read DB_KICK_HOT.'],
    }, { status: 200, headers: { 'cache-control': 'no-store' } })
  }
}

function deriveState(sourceMode: string, minutes: number | null, count: number): string {
  if (sourceMode === 'fixture') return 'fixture'
  if (minutes == null) return 'empty'
  if (minutes >= STRONG_STALE_AFTER_MINUTES) return 'strong_stale'
  if (minutes >= STALE_AFTER_MINUTES) return 'stale'
  if (count === 0) return 'empty'
  return sourceMode === 'authenticated' ? 'fresh' : 'partial'
}

function buildFeatures(state: string, sourceMode: string, updatedAt: string | null) {
  const featureState = sourceMode === 'fixture' ? 'fixture' : state === 'strong_stale' ? 'stale' : state
  return [
    { key: 'heatmap', label: 'Heatmap', role: 'now', apiPath: '/api/kick-heatmap', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Activity unavailable; source mode and candidate coverage are shown in notes.', pagePath: '/kick/heatmap/' },
    { key: 'day_flow', label: 'Day Flow', role: 'today', apiPath: '/api/kick-day-flow', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Activity unavailable; bands come from observed DB_KICK_HOT candidate snapshots.', pagePath: '/kick/day-flow/' },
    { key: 'battle_lines', label: 'Battle Lines', role: 'rivalry', apiPath: '/api/kick-battle-lines', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Events are derived from observed viewer deltas; coverage is candidate based.', pagePath: '/kick/battle-lines/' },
    { key: 'history', label: 'History', role: 'trends', apiPath: '/api/kick-history', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Depends on retained Kick candidate snapshots.', pagePath: '/kick/history/' },
  ]
}

function normalizeChannels(value: unknown): Array<{ slug: string; displayName: string; title: string; viewers: number; url: string }> {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    const row = object(item)
    if (!row) return null
    const slug = str(row.slug)
    const displayName = str(row.displayName ?? row.name ?? slug)
    const viewers = num(row.viewer_count ?? row.viewers)
    if (!slug && !displayName) return null
    return { slug, displayName: displayName || slug, title: str(row.title), viewers, url: str(row.url) || (slug ? `https://kick.com/${slug}` : '') }
  }).filter((item): item is { slug: string; displayName: string; title: string; viewers: number; url: string } => item !== null)
}

function normalizeCollectorMeta(value: unknown): Raw {
  return object(value) ?? {}
}

function normalizeRegistryFeedback(value: unknown): { applied: boolean; observedUpdated: number; missedUpdated: number; error: string | null } {
  const row = object(value) ?? {}
  return {
    applied: Boolean(row.applied),
    observedUpdated: nullableNumber(row.observedUpdated) ?? 0,
    missedUpdated: nullableNumber(row.missedUpdated) ?? 0,
    error: str(row.error) || null,
  }
}

function coverageModeFromMeta(meta: Raw): string {
  const mode = str(meta.coverageMode)
  if (mode === 'registry') return 'registry'
  return DEFAULT_COVERAGE_MODE
}

function nullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function parsePayload(value: string | undefined): Raw | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return object(parsed)
  } catch {
    return null
  }
}

function minutesBetween(from: string | null, to: string): number | null {
  if (!from) return null
  const ms = Date.parse(to) - Date.parse(from)
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 60000)) : null
}
function sanitize(value: string): string { return value.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]').slice(0, 220) }
function object(value: unknown): Raw | null { return typeof value === 'object' && value !== null ? value as Raw : null }
function str(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function num(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value)); if (typeof value === 'string') { const parsed = Number(value.replace(/,/g, '')); return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0 } return 0 }
