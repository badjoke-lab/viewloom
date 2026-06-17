import type { Env } from '../_db/env'
import { providerRuntime } from '../_provider-runtime'

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
  momentum: number
  activity: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
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
  expectedBucketMinutes: number
  bucketMinutes: number
  activityAvailable: boolean
  activitySampled: boolean
  activityUnavailableReason: string
  targetSource: string
  coverageMode: string
  items: NormalizedStream[]
  coverageNote: string
  notes: string[]
}

const runtime = providerRuntime('kick')
const ACTIVITY_UNAVAILABLE_REASON = 'chat_sampling_not_connected'

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
      LIMIT 2
    `).bind('kick').all<SnapshotRow>()

    const rows = result.results ?? []
    const latest = rows[0]
    const previous = rows[1]

    if (!latest) {
      return jsonPayload('empty', new Date().toISOString(), [], 'No Kick snapshots exist in DB_KICK_HOT yet.', ['provider=kick returned no rows in vl_kick_hot.'])
    }

    const previousViewers = previous ? viewerMap(previous.payload_json) : new Map<string, number>()
    const items = normalizePayload(latest.payload_json, previousViewers)
    const meta = collectorMeta(latest.payload_json)
    const targetSource = str(meta?.targetSource) || 'unknown'
    const coverageMode = str(meta?.coverageMode) || 'unknown'
    const updatedAt = latest.collected_at || latest.bucket_minute || new Date().toISOString()
    const age = Date.now() - new Date(updatedAt).getTime()
    const state: KickHeatmapState = items.length === 0 ? 'empty' : age > runtime.staleAfterMinutes * 60 * 1000 ? 'stale' : 'live'
    const note = state === 'live'
      ? `${items.length} normalized Kick streams from latest observed snapshot. Activity/comment heat is not connected yet.`
      : state === 'stale'
        ? `${items.length} normalized Kick streams, but latest snapshot is stale. Activity/comment heat is not connected yet.`
        : 'Latest Kick snapshot exists but has no usable normalized streams.'

    return jsonPayload(state, updatedAt, items, note, [
      'storage=DB_KICK_HOT',
      `source_mode=${latest.source_mode || 'unknown'}`,
      `target_source=${targetSource}`,
      `coverage_mode=${coverageMode}`,
      `bucket_minute=${latest.bucket_minute}`,
      `previous_bucket_minute=${previous?.bucket_minute || 'none'}`,
      `bucket_minutes=${runtime.collectionCadenceMinutes}`,
      `expected_bucket_minutes=${runtime.collectionCadenceMinutes}`,
      `top_limit=${runtime.topLimit}`,
      'momentum_source=viewer_delta',
      'activity_available=false',
      `activity_unavailable_reason=${ACTIVITY_UNAVAILABLE_REASON}`,
      `total_viewers=${latest.total_viewers}`,
    ], 200, targetSource, coverageMode)
  } catch (error) {
    return jsonPayload('error', new Date().toISOString(), [], 'Kick Heatmap API could not read DB_KICK_HOT snapshots.', [error instanceof Error ? error.message : String(error)], 500)
  }
}

function jsonPayload(state: KickHeatmapState, updatedAt: string, items: NormalizedStream[], coverageNote: string, notes: string[], status = 200, targetSource = 'unknown', coverageMode = 'unknown'): Response {
  const payload: KickHeatmapPayload = {
    source: 'api',
    platform: 'kick',
    state,
    status: state,
    updatedAt,
    valueMode: 'viewers',
    expectedBucketMinutes: runtime.collectionCadenceMinutes,
    bucketMinutes: runtime.collectionCadenceMinutes,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    targetSource,
    coverageMode,
    items,
    coverageNote,
    notes,
  }
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}

function normalizePayload(payloadJson: string, previousViewers: Map<string, number>): NormalizedStream[] {
  const parsed = safeJson(payloadJson)
  const record = asRecord(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  return rawItems.map((item) => normalizeStream(item, previousViewers)).filter((item): item is NormalizedStream => item !== null)
}

function viewerMap(payloadJson: string): Map<string, number> {
  const map = new Map<string, number>()
  const parsed = safeJson(payloadJson)
  const record = asRecord(parsed)
  const rawItems = Array.isArray(record?.items) ? record.items : Array.isArray(record?.data) ? record.data : []
  for (const raw of rawItems) {
    const stream = normalizeStream(raw, new Map<string, number>())
    if (stream) map.set(stream.id, stream.viewers)
  }
  return map
}

function collectorMeta(payloadJson: string): Record<string, unknown> | null {
  const parsed = safeJson(payloadJson)
  const record = asRecord(parsed)
  return asRecord(record?.collectorMeta)
}

function normalizeStream(raw: unknown, previousViewers: Map<string, number>): NormalizedStream | null {
  const record = asRecord(raw)
  if (!record) return null
  const channel = asRecord(record.channel)
  const livestream = asRecord(record.livestream)
  const slug = str(record.channelLogin ?? record.slug ?? record.username ?? record.user_slug ?? channel?.slug ?? channel?.username ?? channel?.name)
  const name = str(record.displayName ?? record.name ?? record.username ?? channel?.displayName ?? channel?.name ?? channel?.username ?? slug)
  const viewers = num(record.viewers ?? record.viewer_count ?? record.viewerCount ?? livestream?.viewer_count)
  const id = slugify(slug || name)
  if (!id || viewers <= 0) return null
  const previous = previousViewers.get(id) ?? 0
  return {
    id,
    name: name || id,
    title: str(record.title ?? record.session_title ?? record.stream_title ?? livestream?.session_title),
    viewers,
    momentum: momentum(viewers, previous),
    activity: 0,
    activityAvailable: false,
    activitySampled: false,
    activityUnavailableReason: ACTIVITY_UNAVAILABLE_REASON,
    url: str(record.url) || `https://kick.com/${id}`,
    startedAt: str(record.startedAt ?? record.started_at ?? record.start_time ?? livestream?.created_at) || undefined,
  }
}

function momentum(current: number, previous: number): number {
  if (previous <= 0 || current <= 0) return 0
  const raw = (current - previous) / previous
  return Math.max(-3, Math.min(3, raw))
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
