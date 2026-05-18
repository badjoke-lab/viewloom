type Env = { DB_KICK_HOT: D1Database }

type StreamItem = {
  slug: string
  displayName: string
  title: string
  viewer_count: number
  url: string
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
    if (url.pathname === '/status') return out({ ok: true, provider: 'kick', rows: await countRows(env) })
    if (url.pathname === '/insert-fixture' && request.method === 'POST') return out({ ok: true, result: await writeSnapshot(env) })
    return out({ ok: false, error: 'not_found' }, 404)
  },
}

async function writeSnapshot(env: Env) {
  const now = new Date()
  const bucket = floorMinute(now)
  const total = fixture.reduce((sum, item) => sum + item.viewer_count, 0)
  await env.DB_KICK_HOT.prepare(`
    INSERT OR REPLACE INTO minute_snapshots (provider, bucket_minute, collected_at, total_viewers, stream_count, payload_json, source_mode)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind('kick', bucket, now.toISOString(), total, fixture.length, JSON.stringify({ items: fixture }), 'fixture').run()
  return { bucket_minute: bucket, total_viewers: total, stream_count: fixture.length }
}

async function countRows(env: Env): Promise<number> {
  const row = await env.DB_KICK_HOT.prepare('SELECT COUNT(*) AS count FROM minute_snapshots WHERE provider = ?').bind('kick').first<{ count: number }>()
  return Number(row?.count ?? 0)
}

function floorMinute(date: Date): string {
  const copy = new Date(date)
  copy.setUTCSeconds(0, 0)
  return copy.toISOString()
}

function out(payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}
