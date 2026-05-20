type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
}

type StreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
}

type Raw = Record<string, unknown>
type SourceAttempt = {
  sourceMode: 'authenticated' | 'public-channel-fallback' | 'empty-authenticated' | 'empty-public-channel-fallback'
  streams: StreamItem[]
  failures: number
  attemptedFallback: boolean
  reason?: string
}

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
    if (url.pathname === '/insert-fixture' && request.method === 'POST') return out({ ok: true, result: await writeSnapshot(env, fixture, 'fixture') })
    if (url.pathname === '/collect' && request.method === 'POST') {
      const gate = checkToken(request, env)
      if (!gate.ok) return out({ ok: false, error: gate.error }, 401)
      return out({ ok: true, result: await collectKick(env) })
    }
    return out({ ok: false, error: 'not_found', routes: ['GET /health', 'GET /status', 'POST /collect', 'POST /insert-fixture'] }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await collectKick(env)
  },
}


type AuthResult = { mode: 'authenticated'; token: string } | { mode: 'public-channel-fallback'; token: null; reason: string }

async function statusPayload(env: Env) {
  const latest = await latestSnapshot(env)
  const slugs = channelSlugs(env)
  const hasStaticToken = Boolean(env.KICK_ACCESS_TOKEN)
  const hasClientCredentials = Boolean(env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET)
  return {
    ok: true,
    provider: 'kick',
    storage: 'DB_KICK_HOT / vl_kick_hot',
    rows: await countRows(env),
    configuredChannels: slugs.length,
    authMode: hasStaticToken || hasClientCredentials ? 'credential-configured' : 'public-channel-fallback',
    sourceMode: latest?.source_mode ?? (slugs.length ? 'public-channel-fallback' : 'unconfigured'),
    lastCollectionResult: latest,
    writtenStreamCount: latest?.stream_count ?? 0,
    notes: [
      hasClientCredentials ? 'KICK_CLIENT_ID and KICK_CLIENT_SECRET are configured for OAuth app access tokens.' : 'KICK_CLIENT_ID/KICK_CLIENT_SECRET are not both configured; using public channel fallback.',
      'When authenticated channel reads produce no usable viewer rows, collector-kick retries the same slug list through the public channel fallback before writing an empty snapshot.',
      'Public fallback uses https://kick.com/api/v2/channels/{slug} and is not described as official authenticated collection.',
      'KICK_CHANNEL_SLUGS remains the seed-list mechanism until directory/global discovery is implemented.',
    ],
  }
}

async function getAuth(env: Env): Promise<AuthResult> {
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

async function fetchOfficialChannel(slug: string, token: string): Promise<StreamItem | null> {
  const response = await fetch(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json', authorization: `Bearer ${token}`, 'user-agent': 'ViewLoom collector-kick/0.2' },
  })
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

async function latestSnapshot(env: Env): Promise<{ bucket_minute: string; collected_at: string; stream_count: number; total_viewers: number; source_mode: string } | null> {
  return await env.DB_KICK_HOT.prepare('SELECT bucket_minute,collected_at,stream_count,total_viewers,source_mode FROM minute_snapshots WHERE provider = ? ORDER BY bucket_minute DESC LIMIT 1').bind('kick').first()
}

async function collectKick(env: Env) {
  const slugs = channelSlugs(env)
  if (slugs.length === 0) return await writeSnapshot(env, [], 'unconfigured')
  const auth = await getAuth(env)
  const attempt = await collectStreams(slugs, auth)
  const written = await writeSnapshot(env, attempt.streams, attempt.sourceMode)
  return {
    ...written,
    auth_mode: auth.mode,
    source_mode: attempt.sourceMode,
    configured_channels: slugs.length,
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
    reason: 'authenticated_and_public_fallback_empty',
  }
}

async function collectAuthenticated(slugs: string[], token: string): Promise<Pick<SourceAttempt, 'streams' | 'failures'>> {
  const settled = await Promise.allSettled(slugs.map((slug) => fetchOfficialChannel(slug, token)))
  return collectSettled(settled)
}

async function collectPublicFallback(slugs: string[]): Promise<Pick<SourceAttempt, 'streams' | 'failures'>> {
  const settled = await Promise.allSettled(slugs.map((slug) => fetchPublicChannel(slug)))
  return collectSettled(settled)
}

function collectSettled(settled: PromiseSettledResult<StreamItem | null>[]): Pick<SourceAttempt, 'streams' | 'failures'> {
  return {
    streams: settled.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : []),
    failures: settled.filter((result) => result.status === 'rejected').length,
  }
}

async function fetchPublicChannel(slug: string): Promise<StreamItem | null> {
  const response = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
    headers: { accept: 'application/json', 'user-agent': 'ViewLoom collector-kick/0.1' },
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

async function writeSnapshot(env: Env, items: StreamItem[], sourceMode: string) {
  const now = new Date()
  const bucket = floorMinute(now)
  const total = items.reduce((sum, item) => sum + item.viewer_count, 0)
  await env.DB_KICK_HOT.prepare(`
    INSERT OR REPLACE INTO minute_snapshots (provider, bucket_minute, collected_at, total_viewers, stream_count, payload_json, source_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind('kick', bucket, now.toISOString(), total, items.length, JSON.stringify({ items }), sourceMode).run()
  return { bucket_minute: bucket, total_viewers: total, stream_count: items.length, source_mode: sourceMode }
}

async function countRows(env: Env): Promise<number> {
  const row = await env.DB_KICK_HOT.prepare('SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider = ?').bind('kick').first<{ count: number }>()
  return Number(row?.count ?? 0)
}

function channelSlugs(env: Env): string[] {
  return (env.KICK_CHANNEL_SLUGS || '').split(',').map((value) => value.trim()).filter(Boolean).slice(0, 50)
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
