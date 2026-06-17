import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'

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
type CoverageMode = 'official-livestreams' | 'registry' | 'seed-list'

const runtime = providerRuntime('kick')
const DEFAULT_COVERAGE_MODE: CoverageMode = 'seed-list'

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
    const coverage = coverageDescription(runtimeCoverageMode)

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
        label: coverage.label,
        isTwitchParity: false,
        isDirectoryCoverage: runtimeCoverageMode === 'official-livestreams',
        description: coverage.description,
        nextRequiredArchitecture: coverage.nextRequiredArchitecture,
      },
      state,
      generatedAt,
      collector: {
        state: latest ? 'snapshot_available' : 'empty',
        mode: authMode,
        sourceMode,
        coverageMode: runtimeCoverageMode,
        targetSource,
        runCadenceSeconds: runtime.collectionCadenceSeconds,
        configuredChannelMechanism: coverage.configuredChannelMechanism,
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
        staleAfterMinutes: runtime.staleAfterMinutes,
        strongStaleAfterMinutes: runtime.strongStaleAfterMinutes,
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
        topLimit: runtime.topLimit,
      },
      latestObservedChannels,
      collectorMeta,
      sourceModes: sourceRows.results ?? [],
      coverage: {
        state: latest ? (latest.stream_count > 0 ? `${runtimeCoverageMode}-observed` : 'empty') : 'missing',
        mode: runtimeCoverageMode,
        observedCount: latest?.stream_count ?? 0,
        topLimit: runtime.topLimit,
        isTwitchParity: false,
        notes: [
          'Kick reads DB_KICK_HOT / vl_kick_hot only.',
          coverage.publicNote,
          'Fixture, public-channel-fallback, empty-public-channel-fallback, and authenticated source modes are surfaced explicitly.',
          registryFeedback.applied ? `Registry feedback updated ${registryFeedback.observedUpdated} observed and ${registryFeedback.missedUpdated} missed candidates.` : 'Registry feedback was not applied for the latest snapshot.',
          latestObservedChannels.length > 0 ? `Latest snapshot contains ${latestObservedChannels.length} observed Kick channels.` : 'Latest snapshot contains no observed Kick channels.',
        ],
      },
      features: buildFeatures(state, sourceMode, latest?.collected_at ?? null),
      limitations: [
        'ViewLoom is unofficial and independent.',
        'Kick activity signals are unavailable in the current DB_KICK_HOT payload; viewer volume and share remain available.',
        coverage.limitation,
        sourceMode === 'fixture' ? 'Latest rows are fixture rows and must not be interpreted as live production data.' : coverage.sourceLimitation,
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
  if (minutes >= runtime.strongStaleAfterMinutes) return 'strong_stale'
  if (minutes >= runtime.staleAfterMinutes) return 'stale'
  if (count === 0) return 'empty'
  return sourceMode === 'authenticated' ? 'fresh' : 'partial'
}

function buildFeatures(state: string, sourceMode: string, updatedAt: string | null) {
  const featureState = sourceMode === 'fixture' ? 'fixture' : state === 'strong_stale' ? 'stale' : state
  return [
    { key: 'heatmap', label: 'Heatmap', role: 'now', apiPath: '/api/kick-heatmap', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Activity unavailable; source mode and candidate coverage are shown in notes.', pagePath: '/kick/heatmap/' },
    { key: 'day_flow', label: 'Day Flow', role: 'today', apiPath: '/api/kick-day-flow', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Activity unavailable; bands come from observed DB_KICK_HOT snapshots.', pagePath: '/kick/day-flow/' },
    { key: 'battle_lines', label: 'Battle Lines', role: 'rivalry', apiPath: '/api/kick-battle-lines', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Events are derived from observed viewer deltas; coverage mode is shown explicitly.', pagePath: '/kick/battle-lines/' },
    { key: 'history', label: 'History', role: 'trends', apiPath: '/api/kick-history', state: featureState, source: sourceMode, lastUpdatedAt: updatedAt, knownGap: 'Depends on retained Kick observations.', pagePath: '/kick/history/' },
  ]
}

function coverageDescription(mode: CoverageMode) {
  if (mode === 'official-livestreams') {
    return {
      label: 'Official livestream endpoint coverage',
      description: 'Kick observations were collected from the authenticated official livestreams endpoint with the configured per-run limit. This remains a bounded observed window, not a claim of complete platform coverage.',
      nextRequiredArchitecture: 'pagination and coverage diagnostics beyond the current official endpoint limit',
      configuredChannelMechanism: 'authenticated official livestreams endpoint',
      publicNote: 'Kick used the authenticated official livestreams endpoint for this snapshot. The observed window is still bounded by the configured endpoint limit.',
      limitation: 'Official livestream endpoint observations are bounded by the configured per-run limit and must not be described as complete provider-wide coverage.',
      sourceLimitation: 'Authenticated official-livestream rows come from the bounded official endpoint response for the collection run.',
    }
  }
  if (mode === 'registry') {
    return {
      label: 'Registry-backed candidate coverage',
      description: 'Kick is selecting attempted channel slugs from kick_channels registry rows. This is not Twitch-like live directory discovery.',
      nextRequiredArchitecture: 'candidate expansion plus discovery job',
      configuredChannelMechanism: 'kick_channels registry target selection',
      publicNote: 'Kick is using registry-backed candidate coverage, not provider-wide directory coverage.',
      limitation: 'Kick currently uses registry-backed candidate coverage; it does not have provider-wide live directory discovery.',
      sourceLimitation: 'Registry candidate rows are sampled from the configured candidate registry and may omit live channels outside that set.',
    }
  }
  return {
    label: 'Seed-list coverage only',
    description: 'Kick samples configured and built-in channel slug candidates. It does not have provider-wide live directory discovery.',
    nextRequiredArchitecture: 'kick_channels registry plus discovery job',
    configuredChannelMechanism: 'configured and built-in seed slug list',
    publicNote: 'Kick coverage is seed-list based and is not provider-wide directory coverage.',
    limitation: 'Kick currently uses seed-list coverage only; it does not have provider-wide live directory discovery.',
    sourceLimitation: 'Seed-list and public-channel fallback rows are sampled from configured or built-in channel slug candidates.',
  }
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

function coverageModeFromMeta(meta: Raw): CoverageMode {
  const mode = str(meta.coverageMode)
  const target = str(meta.targetSource)
  const source = str(meta.sourceMode)
  if (mode === 'official-livestreams' || target === 'official-livestreams' || source === 'official-livestreams') return 'official-livestreams'
  if (mode === 'registry' || target === 'registry') return 'registry'
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
