import type { Env } from '../_db/env'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  total_viewers: number
  payload_json: string
  source_mode: string
}

type NormalizedStream = {
  id: string
  name: string
  title: string
  viewers: number
  url: string
  startedAt?: string
}

type KickHeatmapState = 'not_ready' | 'empty' | 'stale' | 'live' | 'error'

type KickHeatmapPayload = {
  source: 'api'
  platform: 'kick'
  state: KickHeatmapState
  status: KickHeatmapState
  updatedAt: string
  valueMode: 'viewers'
  items: NormalizedStream[]
  coverageNote: string
  notes: string[]
}

const STALE_AFTER_MS = 10 * 60 * 1000

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB_KICK_HOT) {
    return jsonPayload('not_ready', new Date().toISOString(), [], 'Kick storage is not configured. Create D1 `vl_kick_hot` and bind it as `DB_KICK_HOT`.', ['missing_binding=DB_KICK_HOT'], 503)
  }

  try {
    const result = await env.DB_KICK_HOT.prepare(`
      SELECT bucket_minute, collected_at, total_viewers, payload_json, source_mode
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT 1
    `).bind('kick').first<SnapshotRow>()

    if (!result) {
      return jsonPayload('empty', new Date().toISOString(), [], 'No Kick snapshots exist in DB_KICK_HOT yet.', ['provider=kick returned no rows in vl_kick_hot.'])
    }

    const items = normalizePayload(result.payload_json)
    const updatedAt = result.collected_at || result.bucket_minute || new Date().toISOString()
    const age = Date.now() - new Date(updatedAt).getTime()
    const state: KickHeatmapState = items.length === 0 ? 'empty' : age > STALE_AFTER_MS ? 'stale' : 'live'
    const note = state === 'live'
      ? `${items.length} normalized Kick streams from latest observed snapshot.`
      : state === 'stale'
        ? `${items.length} normalized Kick streams, but latest snapshot is stale.`
        : 'Latest Kick snapshot exists but has no usable normalized streams.'

    return jsonPayload(state, updatedAt, items, note, [
      'storage=DB_KICK_HOT',
      `source_mode=${result.source_mode || 'unknown'}`,
      `bucket_minute=${result.bucket_minute}`,
      `total_viewers=${result.total_viewers}`,
    ])
  } catch (error) {
    return jsonPayload('error', new Date().toISOString(), [], 'Kick Heatmap API could not read DB_KICK_HOT snapshots.', [error instanceof Error ? error.message : String(error)], 500)
  }
}

function jsonPayload(state: KickHeatmapState, updatedAt: string, items: NormalizedStream[], coverageNote: string, notes: string[], status = 200): Response {
  const payload: KickHeatmapPayload = {
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    updatedAt,
    valueMode: 'viewers',
    items,
    coverageNote,
    notes,
  }
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

function normalizePayload(payloadJson: string): NormalizedStream[] {
  const parsed = safeJson(payloadJson)
  const record = asRecord(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map(normalizeStream).filter((item): item is NormalizedStream => item !== null)
}

function normalizeStream(raw: unknown): NormalizedStream | null {
  const record = asRecord(raw)
  if (!record) return null
  const channel = asRecord(record.channel)
  const livestream = asRecord(record.livestream)
  const slug = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? slug)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount ?? livestream?.viewer_count)
  const id = slugify(slug || name)
  if (!id || viewers <= 0) return null
  return {
    id,
    name: name || id,
    title: str(record.title ?? record.session_title ?? record.stream_title ?? livestream?.session_title),
    viewers,
    url: str(record.url) || `https://kick.com/${id}`,
    startedAt: str(record.startedAt ?? record.started_at ?? record.start_time ?? livestream?.created_at) || undefined,
  }
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function str(value: unknown): string {
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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '')
}
