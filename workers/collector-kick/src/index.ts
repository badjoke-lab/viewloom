type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
}

type StreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
}

type Raw = Record<string, unknown>

const fixture: StreamItem[] = [
  { slug: 'sample-kick-alpha', displayName: 'sample-kick-alpha', title: 'Fixture stream alpha', viewer_count: 2400, url: 'https://kick.com/sample-kick-alpha' },
  { slug: 'sample-kick-beta', displayName: 'sample-kick-beta', title: 'Fixture stream beta', viewer_count: 1850, url: 'https://kick.com/sample-kick-beta' },
  { slug: 'sample-kick-gamma', displayName: 'sample-kick-gamma', title: 'Fixture stream gamma', viewer_count: 1400, url: 'https://kick.com/sample-kick-gamma' },
]

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/health') return out({ ok: true, provider: 'kick', storage: 'DB_KICK_HOT' })
    if (url.pathname === '/status') return out({ ok: true, provider: 'kick', rows: await countRows(env), configuredChannels: channelSlugs(env).length })
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

async function collectKick(env: Env) {
  const slugs = channelSlugs(env)
  if (slugs.length === 0) return await writeSnapshot(env, [], 'unconfigured')
  const settled = await Promise.allSettled(slugs.map((slug) => fetchChannel(slug)))
  const streams = settled.flatMap((result) => result.status === 'fulfilled' && result.value ? [result.value] : [])
  return await writeSnapshot(env, streams, streams.length > 0 ? 'real' : 'empty-real')
}

async function fetchChannel(slug: string): Promise<StreamItem | null> {
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
  const displayName = text(raw.user?.['username'] ?? raw.username ?? raw.name ?? slug) || slug
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
