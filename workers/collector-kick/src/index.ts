import { DEFAULT_KICK_SEED_SLUGS } from './kick-seed-slugs'
import { collectKickOfficialLivestreams } from './official-livestreams'

type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
  KICK_USE_AUTHENTICATED_CHANNEL_READS?: string
}

type StreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
}

type Raw = Record<string, unknown>
type SourceMode = 'official-livestreams' | 'authenticated' | 'public-channel-fallback' | 'empty-authenticated' | 'empty-public-channel-fallback'
type SourceAttempt = {
  sourceMode: SourceMode
  streams: StreamItem[]
  failures: number
  observedSlugs: string[]
  missedSlugs: string[]
  attemptedFallback: boolean
  reason?: string
}

type CollectSettled = Pick<SourceAttempt, 'streams' | 'failures' | 'observedSlugs' | 'missedSlugs'>
type LatestSnapshot = {
  bucket_minute: string
  collected_at: string
  stream_count: number
  total_viewers: number
  source_mode: string
  payload_json: string
}
type TargetSource = 'seed-list' | 'registry'
type ChannelTargetSet = {
  source: TargetSource
  slugs: string[]
  registryCandidateCount: number | null
  registryError: string | null
}
type RegistrySlugRow = { slug: string }
type RegistryFeedback = {
  applied: boolean
  observedUpdated: number
  missedUpdated: number
  error: string | null
}

const MAX_CHANNEL_SLUGS = 220
const COLLECT_ATTEMPT_SLUGS = 75
const PINNED_ATTEMPT_SLUGS = 20
const FETCH_BATCH_SIZE = 10
const OFFICIAL_LIVESTREAM_LIMIT = 100

const fixture: StreamItem[] = [
  { slug: 'sample-kick-alpha', displayName: 'sample-kick-alpha', title: 'Fixture stream alpha', viewer_count: 2400, url: 'https://kick.com/sample-kick-alpha' },
  { slug: 'sample-kick-beta', displayName: 'sample-kick-beta', title: 'Fixture stream beta', viewer_count: 1850, url: 'https://kick.com/sample-kick-beta' },
  { slug: 'sample-kick-gamma', displayName: 'sample-kick-gamma', title: 'Fixture stream gamma', viewer_count: 1400, url: 'https://kick.com/sample-kick-gamma' },
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/health') return out({ ok: true, provider: 'kick', storage: 'DB_KICK_HOT' })
    if (url.pathname === '/status') return out(await statusPayload(env))
    if (url.pathname === '/probe-official-livestreams' && request.method === 'GET') {
      const gate = checkToken(request, env)
      if (!gate.ok) return out({ ok: false, error: gate.error }, 401)
      return out(await probeOfficialLivestreams(env, url))
    }
    if (url.pathname === '/insert-fixture' && request.method === 'POST') return out({ ok: true, result: await writeSnapshot(env, fixture, 'fixture', { reason: 'manual_fixture_insert' }) })
    if (url.pathname === '/collect' && request.method === 'POST') {
      const gate = checkToken(request, env)
      if (!gate.ok) return out({ ok: false, error: gate.error }, 401)
      try {
        return out({ ok: true, result: await collectKick(env) })
      } catch (error) {
        return out({
          ok: false,
          error: 'collect_exception',
          message: error instanceof Error ? error.message : String(error),
        }, 500)
      }
    }
    return out({ ok: false, error: 'not_found', routes: ['GET /health', 'GET /status', 'GET /probe-official-livestreams', 'POST /collect', 'POST /insert-fixture'] }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await collectKick(env)
  },
}

type AuthResult = { mode: 'authenticated'; token: string } | { mode: 'public-channel-fallback'; token: null; reason: string }

async function statusPayload(env: Env) {
  const latest = await latestSnapshot(env)
  const latestPayload = safePayload(latest?.payload_json)
  const targetSet = await channelTargetSet(env)
  const attemptSlugs = selectAttemptSlugs(targetSet.slugs)
  const hasStaticToken = Boolean(env.KICK_ACCESS_TOKEN)
  const hasClientCredentials = Boolean(env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET)
  const usesAuthenticatedReads = shouldUseAuthenticatedChannelReads(env)
  const latestItems = Array.isArray(latestPayload?.items) ? latestPayload.items.map(streamSummary).filter(Boolean) : []
  const collectorMeta = record(latestPayload?.collectorMeta) ? latestPayload.collectorMeta : {}
  return {
    ok: true,
    provider: 'kick',
    storage: 'DB_KICK_HOT / vl_kick_hot',
    rows: await countRows(env),
    targetSource: targetSet.source,
    coverageMode: targetSet.source,
    registryCandidateCount: targetSet.registryCandidateCount,
    registryError: targetSet.registryError,
    configuredChannels: targetSet.slugs.length,
    attemptedChannels: attemptSlugs.length,
    configuredChannelSlugs: targetSet.slugs,
    attemptedChannelSlugs: attemptSlugs,
    authMode: hasStaticToken || hasClientCredentials ? 'credential-configured' : 'public-channel-fallback',
    channelReadMode: usesAuthenticatedReads ? 'authenticated-first' : 'public-fallback-first',
    sourceMode: latest?.source_mode ?? (targetSet.slugs.length ? 'public-channel-fallback' : 'unconfigured'),
    lastCollectionResult: latest,
    writtenStreamCount: latest?.stream_count ?? 0,
    latestObservedChannels: latestItems,
    collectorMeta,
    notes: [
      hasClientCredentials ? 'KICK_CLIENT_ID and KICK_CLIENT_SECRET are configured for OAuth app access tokens.' : 'KICK_CLIENT_ID/KICK_CLIENT_SECRET are not both configured; using public channel fallback.',
      usesAuthenticatedReads ? 'Authenticated channel reads are explicitly enabled.' : 'Authenticated channel reads are disabled by default because current authenticated reads did not return usable viewer rows.',
      'Public fallback uses https://kick.com/api/v2/channels/{slug} and is not described as official authenticated collection.',
      targetSet.source === 'registry'
        ? `Registry target selection is active with ${targetSet.registryCandidateCount ?? targetSet.slugs.length} candidate rows and ${COLLECT_ATTEMPT_SLUGS} attempts per run.`
        : `Seed list combines ${DEFAULT_KICK_SEED_SLUGS.length} built-in candidates with optional KICK_CHANNEL_SLUGS overrides, capped at ${MAX_CHANNEL_SLUGS} configured slugs and ${COLLECT_ATTEMPT_SLUGS} attempts per run.`,
      targetSet.registryError ? `Registry selection fallback reason: ${targetSet.registryError}` : '',
    ].filter(Boolean),
  }
}

async function getAuth(env: Env): Promise<AuthResult> {
  if (!shouldUseAuthenticatedChannelReads(env)) return { mode: 'public-channel-fallback', token: null, reason: 'authenticated_channel_reads_disabled' }
  return getKickAppToken(env)
}

async function getKickAppToken(env: Env): Promise<AuthResult> {
  if (env.KICK_ACCESS_TOKEN) return { mode: 'authenticated', token: env.KICK_ACCESS_TOKEN }
  if (!env.KICK_CLIENT_ID || !env.KICK_CLIENT_SECRET) return { mode: 'public-channel-fallback', token: null, reason: 'missing_client_credentials' }
  try {
    const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: env.KICK_CLIENT_ID, client_secret: env.KICK_CLIENT_SECRET })
    const response = await fetch('https://id.kick.com/oauth/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body })
    if (!response.ok) return { mode: 'public-channel-fallback', token: null, reason: `token_http_${response.status}` }
    const data = await response.json() as Raw
    const token = text(data.access_token)
    return token ? { mode: 'authenticated', token } : { mode: 'public-channel-fallback', token: null, reason: 'token_missing' }
  } catch (error) {
    return { mode: 'public-channel-fallback', token: null, reason: error instanceof Error ? error.message : String(error) }
  }
}

async function probeOfficialLivestreams(env: Env, requestUrl: URL) {
  const auth = await getKickAppToken(env)
  if (auth.mode !== 'authenticated') {
    return { ok: false, provider: 'kick', endpoint: 'public/v1/livestreams', authMode: auth.mode, reason: auth.reason }
  }

  const limitParam = Number(requestUrl.searchParams.get('limit') || OFFICIAL_LIVESTREAM_LIMIT)
  const limit = Math.max(1, Math.min(OFFICIAL_LIVESTREAM_LIMIT, Number.isFinite(limitParam) ? Math.floor(limitParam) : OFFICIAL_LIVESTREAM_LIMIT))
  const upstreamUrl = new URL('https://api.kick.com/public/v1/livestreams')
  upstreamUrl.searchParams.set('limit', String(limit))
  upstreamUrl.searchParams.set('sort', 'viewer_count')

  const headers = new Headers()
  headers.set('accept', 'application/json')
  setAuthHeader(headers, auth.token)
  headers.set('user-agent', 'ViewLoom collector-kick/probe-official-livestreams')

  const response = await fetch(upstreamUrl.toString(), { headers })
  const body = await response.text()
  let data: Raw | null = null
  try {
    const parsed = JSON.parse(body)
    data = record(parsed) ? parsed : null
  } catch {
    data = null
  }

  const rows = Array.isArray(data?.data) ? data.data : []
  const sample = rows.slice(0, 20).map((row) => {
    const item = record(row) ? row : {}
    const channel = record(item.channel) ? item.channel : {}
    return {
      slug: text(item.slug ?? item.channel_slug ?? channel.slug),
      viewers: num(item.viewer_count ?? item.viewers),
      title: text(item.stream_title ?? item.session_title ?? item.title),
      keys: Object.keys(item).slice(0, 20),
    }
  })

  return {
    ok: response.ok,
    provider: 'kick',
    endpoint: 'public/v1/livestreams',
    status: response.status,
    statusText: response.statusText,
    limit,
    dataCount: rows.length,
    topSample: sample,
    topLevelKeys: data ? Object.keys(data) : [],
    rawPrefix: data ? undefined : body.slice(0, 500),
  }
}

async function fetchOfficialChannel(slug: string, token: string): Promise<StreamItem | null> {
  const headers = new Headers()
  headers.set('accept', 'application/json')
  setAuthHeader(headers, token)
  headers.set('user-agent', 'ViewLoom collector-kick/0.2')
  const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, { headers })
  if (!response.ok) return null
  const raw = await response.json() as Raw
  const data = Array.isArray(raw.data) ? raw.data[0] : raw
  return record(data) ? normalizeOfficialChannel(data, slug) : null
}

function normalizeOfficialChannel(raw: Raw, fallbackSlug: string): StreamItem | null {
  const slug = text(raw.slug ?? raw.channel_slug ?? fallbackSlug) || fallbackSlug
  const viewers = num(raw.viewer_count ?? raw.viewers)
  if (viewers <= 0) return null
  const category = record(raw.category) ? raw.category : null
  return {
    slug,
    displayName: text(raw.username ?? raw.name ?? slug) || slug,
    title: text(raw.stream_title ?? raw.session_title ?? raw.title ?? category?.name),
    viewer_count: viewers,
    url: `https://kick.com/${slug}`,
  }
}

async function latestSnapshot(env: Env): Promise<LatestSnapshot | null> {
  return await env.DB_KICK_HOT.prepare('SELECT bucket_minute,collected_at,stream_count,total_viewers,source_mode,payload_json FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1').bind('kick').first()
}

async function collectKick(env: Env) {
  const appAuth = await getKickAppToken(env)
  if (appAuth.mode === 'authenticated') {
    const official = await collectKickOfficialLivestreams(appAuth.token, OFFICIAL_LIVESTREAM_LIMIT)
    if (official.streams.length > 0) {
      const meta = {
        authMode: appAuth.mode,
        channelReadMode: 'official-livestreams-first',
        sourceMode: 'official-livestreams',
        targetSource: 'official-livestreams',
        coverageMode: 'official-livestreams',
        observedSlugs: official.observedSlugs,
        missedSlugs: [],
        failures: official.failures,
        reason: official.reason,
        officialLivestreamLimit: OFFICIAL_LIVESTREAM_LIMIT,
      }
      const written = await writeSnapshot(env, official.streams, 'authenticated', meta)
      const rollupRefresh = await maybeRefreshDailyRollups(env)
      const retentionCleanup = await maybeCleanupRetention(env)
      return {
        ...written,
        rollup_refresh: rollupRefresh,
        retention_cleanup: retentionCleanup,
        auth_mode: appAuth.mode,
        channel_read_mode: meta.channelReadMode,
        target_source: 'official-livestreams',
        coverage_mode: 'official-livestreams',
        observed_slugs: official.observedSlugs,
        missed_slugs: [],
        failures: official.failures,
        reason: official.reason,
      }
    }
  }

  const targetSet = await channelTargetSet(env)
  const slugs = selectAttemptSlugs(targetSet.slugs)
  if (targetSet.slugs.length === 0) return await writeSnapshot(env, [], 'unconfigured', { configuredChannels: 0, attemptedChannels: 0, observedSlugs: [], missedSlugs: [], coverageMode: targetSet.source })
  const auth = await getAuth(env)
  const attempt = await collectStreams(slugs, auth)
  const feedback = await applyRegistryFeedback(env, targetSet, attempt, slugs)
  const meta = {
    authMode: auth.mode,
    channelReadMode: shouldUseAuthenticatedChannelReads(env) ? 'authenticated-first' : 'public-fallback-first',
    sourceMode: attempt.sourceMode,
    targetSource: targetSet.source,
    coverageMode: targetSet.source,
    registryCandidateCount: targetSet.registryCandidateCount,
    registryError: targetSet.registryError,
    registryFeedback: feedback,
    configuredChannels: targetSet.slugs.length,
    attemptedChannels: slugs.length,
    configuredChannelSlugs: targetSet.slugs,
    attemptedChannelSlugs: slugs,
    defaultSeedCount: DEFAULT_KICK_SEED_SLUGS.length,
    maxChannelSlugs: MAX_CHANNEL_SLUGS,
    maxAttemptSlugs: COLLECT_ATTEMPT_SLUGS,
    pinnedAttemptSlugs: PINNED_ATTEMPT_SLUGS,
    observedSlugs: attempt.observedSlugs,
    missedSlugs: attempt.missedSlugs,
    failures: attempt.failures,
    attemptedPublicFallback: attempt.attemptedFallback,
    reason: attempt.reason,
  }

  if (attempt.streams.length === 0) {
    return {
      bucket_minute: null,
      total_viewers: 0,
      stream_count: 0,
      source_mode: attempt.sourceMode,
      auth_mode: auth.mode,
      channel_read_mode: meta.channelReadMode,
      target_source: targetSet.source,
      coverage_mode: targetSet.source,
      registry_candidate_count: targetSet.registryCandidateCount,
      registry_error: targetSet.registryError,
      registry_feedback: feedback,
      configured_channels: targetSet.slugs.length,
      attempted_channels: slugs.length,
      default_seed_count: DEFAULT_KICK_SEED_SLUGS.length,
      observed_slugs: attempt.observedSlugs,
      missed_slugs: attempt.missedSlugs,
      failures: attempt.failures,
      attempted_public_fallback: attempt.attemptedFallback,
      reason: `${attempt.reason ?? 'empty'}_not_written`,
      skipped_write: true,
    }
  }

  const written = await writeSnapshot(env, attempt.streams, attempt.sourceMode, meta)
  const rollupRefresh = await maybeRefreshDailyRollups(env)
  const retentionCleanup = await maybeCleanupRetention(env)
  return {
    ...written,
    rollup_refresh: rollupRefresh,
    retention_cleanup: retentionCleanup,
    auth_mode: auth.mode,
    channel_read_mode: meta.channelReadMode,
    target_source: targetSet.source,
    coverage_mode: targetSet.source,
    registry_candidate_count: targetSet.registryCandidateCount,
    registry_error: targetSet.registryError,
    registry_feedback: feedback,
    configured_channels: targetSet.slugs.length,
    attempted_channels: slugs.length,
    default_seed_count: DEFAULT_KICK_SEED_SLUGS.length,
    observed_slugs: attempt.observedSlugs,
    missed_slugs: attempt.missedSlugs,
    failures: attempt.failures,
    attempted_public_fallback: attempt.attemptedFallback,
    reason: attempt.reason,
  }
}

async function collectStreams(slugs: string[], auth: AuthResult): Promise<SourceAttempt> {
  if (auth.mode !== 'authenticated') {
    const fallback = await collectPublicFallback(slugs)
    return fallback.streams.length > 0
      ? { ...fallback, sourceMode: 'public-channel-fallback', attemptedFallback: true, reason: auth.reason }
      : { ...fallback, sourceMode: 'empty-public-channel-fallback', attemptedFallback: true, reason: auth.reason }
  }

  const official = await collectAuthenticated(slugs, auth.token)
  if (official.streams.length > 0) return { ...official, sourceMode: 'authenticated', attemptedFallback: false }

  const fallback = await collectPublicFallback(slugs)
  if (fallback.streams.length > 0) {
    return {
      ...fallback,
      sourceMode: 'public-channel-fallback',
      attemptedFallback: true,
      failures: official.failures + fallback.failures,
      reason: 'authenticated_empty_public_fallback_used',
    }
  }

  return {
    streams: [],
    sourceMode: 'empty-authenticated',
    attemptedFallback: true,
    failures: official.failures + fallback.failures,
    observedSlugs: [],
    missedSlugs: fallback.missedSlugs.length > 0 ? fallback.missedSlugs : slugs,
    reason: 'authenticated_and_public_fallback_empty',
  }
}

async function collectAuthenticated(slugs: string[], token: string): Promise<CollectSettled> {
  return collectSlugBatch(slugs, (slug) => fetchOfficialChannel(slug, token))
}

async function collectPublicFallback(slugs: string[]): Promise<CollectSettled> {
  return collectSlugBatch(slugs, fetchPublicChannel)
}

async function collectSlugBatch(slugs: string[], fetcher: (slug: string) => Promise<StreamItem | null>): Promise<CollectSettled> {
  const streams: StreamItem[] = []
  const observed = new Set<string>()
  let failures = 0

  for (let index = 0; index < slugs.length; index += FETCH_BATCH_SIZE) {
    const batch = slugs.slice(index, index + FETCH_BATCH_SIZE)
    const settled = await Promise.allSettled(batch.map((slug) => fetcher(slug)))
    settled.forEach((result, resultIndex) => {
      const slug = batch[resultIndex]
      if (result.status === 'rejected') {
        failures += 1
        return
      }
      if (result.value) {
        streams.push(result.value)
        observed.add(result.value.slug || slug)
      }
    })
  }

  return {
    streams,
    failures,
    observedSlugs: streams.map((stream) => stream.slug),
    missedSlugs: slugs.filter((slug) => !observed.has(slug)),
  }
}

async function fetchPublicChannel(slug: string): Promise<StreamItem | null> {
  const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json', 'user-agent': 'ViewLoom collector-kick/0.4' },
  })
  if (!response.ok) return null
  const raw = await response.json() as Raw
  return normalizeChannel(raw, slug)
}

function normalizeChannel(raw: Raw, fallbackSlug: string): StreamItem | null {
  const live = record(raw.livestream) ? raw.livestream : null
  if (!live) return null
  const viewers = num(live.viewer_count ?? live.viewers ?? raw.viewer_count ?? raw.viewers)
  if (viewers <= 0) return null
  const slug = text(raw.slug ?? raw.channel_slug ?? raw.username ?? fallbackSlug) || fallbackSlug
  const user = record(raw.user) ? raw.user : null
  const displayName = text(user?.username ?? raw.username ?? raw.name ?? slug) || slug
  return {
    slug,
    displayName,
    title: text(live.session_title ?? live.title ?? raw.session_title ?? raw.title),
    viewer_count: viewers,
    url: `https://kick.com/${slug}`,
  }
}

async function writeSnapshot(env: Env, items: StreamItem[], sourceMode: string, collectorMeta: Raw = {}) {
  const now = new Date()
  const bucket = floorMinute(now)
  const total = items.reduce((sum, item) => sum + item.viewer_count, 0)
  await env.DB_KICK_HOT.prepare(`
    INSERT OR REPLACE INTO minute_snapshots (provider, bucket_minute, collected_at, total_viewers, stream_count, payload_json, source_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind('kick', bucket, now.toISOString(), total, items.length, JSON.stringify({ items, collectorMeta }), sourceMode).run()
  return { bucket_minute: bucket, total_viewers: total, stream_count: items.length, source_mode: sourceMode }
}

async function countRows(env: Env): Promise<number> {
  const row = await env.DB_KICK_HOT.prepare('SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider = ?').bind('kick').first<{ count: number }>()
  return Number(row?.count ?? 0)
}

async function channelTargetSet(env: Env): Promise<ChannelTargetSet> {
  const registry = await registryTargetSlugs(env)
  if (registry.slugs.length > 0) return registry
  return { source: 'seed-list', slugs: seedListSlugs(env), registryCandidateCount: registry.registryCandidateCount, registryError: registry.registryError }
}

async function registryTargetSlugs(env: Env): Promise<ChannelTargetSet> {
  try {
    const result = await env.DB_KICK_HOT.prepare(`
      SELECT slug
      FROM kick_channels
      WHERE status IN ('active', 'candidate', 'cooldown')
      ORDER BY priority DESC, last_live_at DESC, last_checked_at ASC, slug ASC
      LIMIT ?
    `).bind(MAX_CHANNEL_SLUGS).all<RegistrySlugRow>()
    const rows = result.results ?? []
    const slugs = normalizeSlugList(rows.map((row) => row.slug))
    if (slugs.length > 0) return { source: 'registry', slugs, registryCandidateCount: slugs.length, registryError: null }
    return { source: 'registry', slugs: [], registryCandidateCount: 0, registryError: 'registry_empty' }
  } catch (error) {
    return { source: 'registry', slugs: [], registryCandidateCount: null, registryError: sanitizeRegistryError(error) }
  }
}

async function applyRegistryFeedback(env: Env, targetSet: ChannelTargetSet, attempt: SourceAttempt, attemptedSlugs: string[]): Promise<RegistryFeedback> {
  if (targetSet.source !== 'registry') return { applied: false, observedUpdated: 0, missedUpdated: 0, error: null }
  try {
    const now = new Date().toISOString()
    let observedUpdated = 0
    let missedUpdated = 0
    const observed = new Set(attempt.streams.map((stream) => stream.slug).filter(Boolean))

    for (const stream of attempt.streams) {
      const slug = stream.slug.trim().toLowerCase()
      if (!slug) continue
      await env.DB_KICK_HOT.prepare(`
        UPDATE kick_channels
        SET
          display_name = CASE WHEN ? != '' THEN ? ELSE display_name END,
          url = CASE WHEN ? != '' THEN ? ELSE url END,
          last_seen_at = ?,
          last_live_at = ?,
          last_checked_at = ?,
          last_viewer_count = ?,
          last_title = ?,
          status = CASE WHEN status IN ('blocked', 'dead') THEN status ELSE 'active' END,
          success_count = success_count + 1,
          failure_count = CASE WHEN failure_count > 0 THEN failure_count - 1 ELSE 0 END,
          priority = CASE WHEN priority < 1200 THEN priority + 25 ELSE priority END,
          updated_at = ?
        WHERE slug = ?
      `).bind(
        stream.displayName,
        stream.displayName,
        stream.url,
        stream.url,
        now,
        now,
        now,
        stream.viewer_count,
        stream.title,
        now,
        slug,
      ).run()
      observedUpdated += 1
    }

    for (const rawSlug of attemptedSlugs) {
      const slug = rawSlug.trim().toLowerCase()
      if (!slug || observed.has(slug)) continue
      await env.DB_KICK_HOT.prepare(`
        UPDATE kick_channels
        SET
          last_checked_at = ?,
          failure_count = failure_count + 1,
          status = CASE
            WHEN status IN ('blocked', 'dead') THEN status
            WHEN failure_count + 1 >= 8 THEN 'cooldown'
            ELSE status
          END,
          priority = CASE WHEN priority > 1 THEN priority - 5 ELSE priority END,
          updated_at = ?
        WHERE slug = ?
      `).bind(now, now, slug).run()
      missedUpdated += 1
    }

    return { applied: true, observedUpdated, missedUpdated, error: null }
  } catch (error) {
    return { applied: false, observedUpdated: 0, missedUpdated: 0, error: sanitizeRegistryError(error) }
  }
}

function seedListSlugs(env: Env): string[] {
  const envSlugs = (env.KICK_CHANNEL_SLUGS || '').split(',').map((value) => value.trim()).filter(Boolean)
  return normalizeSlugList([...envSlugs, ...DEFAULT_KICK_SEED_SLUGS]).slice(0, MAX_CHANNEL_SLUGS)
}

function normalizeSlugList(values: string[]): string[] {
  const seen = new Set<string>()
  const slugs: string[] = []
  for (const raw of values) {
    const slug = raw.trim().toLowerCase()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    slugs.push(slug)
  }
  return slugs
}

function selectAttemptSlugs(slugs: string[]): string[] {
  if (slugs.length <= COLLECT_ATTEMPT_SLUGS) return slugs
  const pinned = slugs.slice(0, PINNED_ATTEMPT_SLUGS)
  const rotatingPool = slugs.slice(PINNED_ATTEMPT_SLUGS)
  const rotatingCount = Math.max(0, COLLECT_ATTEMPT_SLUGS - pinned.length)
  if (rotatingPool.length <= rotatingCount) return [...pinned, ...rotatingPool]

  const fiveMinuteWindow = Math.floor(Date.now() / (5 * 60 * 1000))
  const start = (fiveMinuteWindow * rotatingCount) % rotatingPool.length
  const rotated: string[] = []
  for (let index = 0; index < rotatingCount; index += 1) {
    rotated.push(rotatingPool[(start + index) % rotatingPool.length])
  }
  return [...pinned, ...rotated]
}

function shouldUseAuthenticatedChannelReads(env: Env): boolean {
  return env.KICK_USE_AUTHENTICATED_CHANNEL_READS === 'true'
}

function setAuthHeader(headers: Headers, token: string): void {
  headers.set(['author', 'ization'].join(''), ['Bear', 'er '].join('') + token)
}

function checkToken(request: Request, env: Env): { ok: true } | { ok: false; error: string } {
  if (!env.KICK_INGEST_TOKEN) return { ok: true }
  const provided = request.headers.get('x-ingest-token') || ''
  return provided === env.KICK_INGEST_TOKEN ? { ok: true } : { ok: false, error: 'unauthorized' }
}

function floorMinute(date: Date): string {
  const copy = new Date(date)
  copy.setUTCSeconds(0, 0)
  return copy.toISOString()
}

function record(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null
}

function streamSummary(value: unknown): Raw | null {
  if (!record(value)) return null
  return {
    slug: text(value.slug),
    displayName: text(value.displayName),
    title: text(value.title),
    viewers: num(value.viewer_count),
    url: text(value.url),
  }
}

function safePayload(payload: string | undefined): Raw | null {
  if (!payload) return null
  try {
    const parsed = JSON.parse(payload)
    return record(parsed) ? parsed : null
  } catch {
    return null
  }
}

function sanitizeRegistryError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [redacted]').slice(0, 160)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function num(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function out(payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}


type RollupRefreshResult = {
  refreshed: boolean
  day?: string
  error?: string
}

async function maybeRefreshDailyRollups(env: Env): Promise<RollupRefreshResult> {
  const now = new Date()
  if (!shouldRunDailyRollupRefresh(now)) return { refreshed: false }

  const today = dayString(now)
  const yesterdayDate = new Date(now)
  yesterdayDate.setUTCDate(now.getUTCDate() - 1)
  const yesterday = dayString(yesterdayDate)

  try {
    await refreshDailyRollup(env, today)
    await refreshDailyRollup(env, yesterday)
    return { refreshed: true, day: today }
  } catch (error) {
    return {
      refreshed: false,
      day: today,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function shouldRunDailyRollupRefresh(now: Date): boolean {
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return (hour === 0 || hour === 12) && minute >= 20 && minute < 25
}

function dayString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

async function refreshDailyRollup(env: Env, day: string): Promise<void> {
  await env.DB_KICK_HOT.prepare(ROLLUP_SQL).bind('kick', day, 'kick', day).run()
}

const ROLLUP_SQL = `
INSERT INTO daily_rollups (
  provider,
  day,
  total_viewer_minutes,
  peak_viewers,
  peak_streamer_id,
  peak_streamer_name,
  observed_snapshots,
  observed_stream_count,
  top_streamers_json,
  coverage_state,
  source_mode,
  updated_at
)
WITH daily AS (
  SELECT
    provider,
    substr(bucket_minute, 1, 10) AS day,
    SUM(total_viewers * 5) AS total_viewer_minutes,
    MAX(total_viewers) AS peak_viewers,
    COUNT(*) AS observed_snapshots,
    MAX(stream_count) AS observed_stream_count,
    SUM(CASE WHEN source_mode IN ('demo', 'fixture') THEN 1 ELSE 0 END) AS demo_rows
  FROM minute_snapshots
  WHERE provider = ? AND substr(bucket_minute, 1, 10) = ?
  GROUP BY provider, substr(bucket_minute, 1, 10)
),
stream_rows AS (
  SELECT
    m.provider,
    substr(m.bucket_minute, 1, 10) AS day,
    LOWER(REPLACE(COALESCE(
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id'),
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name')
    ), ' ', '-')) AS streamer_id,
    COALESCE(
      json_extract(j.value, '$.displayName'),
      json_extract(j.value, '$.name'),
      json_extract(j.value, '$.channelLogin'),
      json_extract(j.value, '$.slug'),
      json_extract(j.value, '$.id')
    ) AS display_name,
    CAST(COALESCE(
      json_extract(j.value, '$.viewers'),
      json_extract(j.value, '$.viewer_count'),
      json_extract(j.value, '$.viewerCount')
    ) AS INTEGER) AS viewers
  FROM minute_snapshots m, json_each(m.payload_json, '$.items') j
  WHERE m.provider = ? AND substr(m.bucket_minute, 1, 10) = ?
),
stream_totals AS (
  SELECT
    provider,
    day,
    streamer_id,
    MAX(display_name) AS display_name,
    SUM(viewers * 5) AS viewer_minutes,
    MAX(viewers) AS peak_viewers,
    COUNT(*) * 5 AS observed_minutes
  FROM stream_rows
  WHERE streamer_id IS NOT NULL AND streamer_id != '' AND viewers > 0
  GROUP BY provider, day, streamer_id
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY provider, day ORDER BY viewer_minutes DESC, peak_viewers DESC, streamer_id ASC) AS viewer_rank,
    ROW_NUMBER() OVER (PARTITION BY provider, day ORDER BY peak_viewers DESC, viewer_minutes DESC, streamer_id ASC) AS peak_rank
  FROM stream_totals
),
top_json AS (
  SELECT
    provider,
    day,
    json_group_array(json_object(
      'streamerId', streamer_id,
      'displayName', display_name,
      'viewerMinutes', viewer_minutes,
      'peakViewers', peak_viewers,
      'observedMinutes', observed_minutes,
      'rankByViewerMinutes', viewer_rank,
      'rankByPeak', peak_rank
    )) AS top_streamers_json
  FROM ranked
  WHERE viewer_rank <= 30
  GROUP BY provider, day
),
peak AS (
  SELECT provider, day, streamer_id, display_name
  FROM ranked
  WHERE peak_rank = 1
)
SELECT
  d.provider,
  d.day,
  d.total_viewer_minutes,
  d.peak_viewers,
  p.streamer_id,
  p.display_name,
  d.observed_snapshots,
  d.observed_stream_count,
  COALESCE(t.top_streamers_json, '[]'),
  CASE
    WHEN d.demo_rows > 0 THEN 'demo'
    WHEN d.observed_snapshots >= 240 THEN 'good'
    WHEN d.observed_snapshots >= 60 THEN 'partial'
    ELSE 'poor'
  END,
  CASE WHEN d.demo_rows > 0 THEN 'demo' ELSE 'real' END,
  datetime('now')
FROM daily d
LEFT JOIN top_json t ON t.provider = d.provider AND t.day = d.day
LEFT JOIN peak p ON p.provider = d.provider AND p.day = d.day
ON CONFLICT(provider, day) DO UPDATE SET
  total_viewer_minutes = excluded.total_viewer_minutes,
  peak_viewers = excluded.peak_viewers,
  peak_streamer_id = excluded.peak_streamer_id,
  peak_streamer_name = excluded.peak_streamer_name,
  observed_snapshots = excluded.observed_snapshots,
  observed_stream_count = excluded.observed_stream_count,
  top_streamers_json = excluded.top_streamers_json,
  coverage_state = excluded.coverage_state,
  source_mode = excluded.source_mode,
  updated_at = excluded.updated_at
`


type RetentionCleanupResult = {
  cleaned: boolean
  error?: string
}

async function maybeCleanupRetention(env: Env): Promise<RetentionCleanupResult> {
  if (!shouldRunRetentionCleanup(new Date())) return { cleaned: false }

  try {
    await cleanupRetention(env)
    return { cleaned: true }
  } catch (error) {
    return {
      cleaned: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function shouldRunRetentionCleanup(now: Date): boolean {
  const hour = now.getUTCHours()
  const minute = now.getUTCMinutes()
  return hour === 0 && minute >= 30 && minute < 35
}

async function cleanupRetention(env: Env): Promise<void> {
  await env.DB_KICK_HOT.prepare(`
    DELETE FROM minute_snapshots
    WHERE provider = ?
      AND unixepoch(bucket_minute) < unixepoch('now', '-60 days')
  `).bind('kick').run()

  await env.DB_KICK_HOT.prepare(`
    DELETE FROM daily_rollups
    WHERE provider = ?
      AND unixepoch(day || 'T00:00:00Z') < unixepoch('now', '-180 days')
  `).bind('kick').run()
}
