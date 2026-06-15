import type { Env } from '../_db/env'

type Provider = 'twitch' | 'kick'

type SnapshotRow = {
  bucket_minute: string
  collected_at: string
  payload_json: string
}

type Observation = {
  time: string
  viewers: number
}

const SNAPSHOT_LIMIT = 288
const EXPECTED_BUCKET_MINUTES = 5

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider') === 'kick' ? 'kick' : url.searchParams.get('provider') === 'twitch' ? 'twitch' : null
  const requestedStream = normalizeId(url.searchParams.get('stream') ?? '')

  if (!provider || !requestedStream) {
    return Response.json({
      ok: false,
      error: 'provider=twitch|kick and a valid stream are required',
    }, { status: 400, headers: { 'cache-control': 'no-store' } })
  }

  const database = provider === 'kick' ? env.DB_KICK_HOT : env.DB_TWITCH_HOT
  if (!database) {
    return Response.json({
      ok: false,
      provider,
      stream: requestedStream,
      error: `${provider} hot snapshot storage is not configured`,
    }, { status: 503, headers: { 'cache-control': 'no-store' } })
  }

  try {
    const result = await database.prepare(`
      SELECT bucket_minute, collected_at, payload_json
      FROM minute_snapshots
      WHERE provider = ?
      ORDER BY bucket_minute DESC
      LIMIT ?
    `).bind(provider, SNAPSHOT_LIMIT).all<SnapshotRow>()

    const rows = result.results ?? []
    const observations: Observation[] = []
    let runStarted = false
    let stoppedAtGap = false

    for (const row of rows) {
      const viewers = viewersForStream(row.payload_json, requestedStream)
      if (viewers === null) {
        if (runStarted) {
          stoppedAtGap = true
          break
        }
        continue
      }

      runStarted = true
      observations.push({
        time: row.collected_at || row.bucket_minute,
        viewers,
      })
    }

    if (observations.length === 0) {
      return Response.json({
        ok: true,
        provider,
        stream: requestedStream,
        state: 'not_observed',
        observationBasis: 'contiguous-current-run',
        expectedBucketMinutes: EXPECTED_BUCKET_MINUTES,
        snapshotLimit: SNAPSHOT_LIMIT,
        observedSince: null,
        lastObservedAt: null,
        observedDurationMinutes: null,
        peakViewers: null,
        peakAt: null,
        sampleCount: 0,
        windowTruncated: false,
      }, { headers: { 'cache-control': 'no-store' } })
    }

    const lastObserved = observations[0]
    const firstObserved = observations.at(-1) ?? lastObserved
    const peak = observations.reduce((best, current) => current.viewers > best.viewers ? current : best, observations[0])
    const firstTime = Date.parse(firstObserved.time)
    const lastTime = Date.parse(lastObserved.time)
    const spanMinutes = Number.isFinite(firstTime) && Number.isFinite(lastTime)
      ? Math.max(0, Math.round((lastTime - firstTime) / 60_000))
      : null
    const reachedWindowBoundary = observations.length === rows.length && rows.length === SNAPSHOT_LIMIT

    return Response.json({
      ok: true,
      provider,
      stream: requestedStream,
      state: 'observed',
      observationBasis: 'contiguous-current-run',
      expectedBucketMinutes: EXPECTED_BUCKET_MINUTES,
      snapshotLimit: SNAPSHOT_LIMIT,
      observedSince: firstObserved.time,
      lastObservedAt: lastObserved.time,
      observedDurationMinutes: spanMinutes,
      peakViewers: peak.viewers,
      peakAt: peak.time,
      sampleCount: observations.length,
      windowTruncated: reachedWindowBoundary && !stoppedAtGap,
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (error) {
    return Response.json({
      ok: false,
      provider,
      stream: requestedStream,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500, headers: { 'cache-control': 'no-store' } })
  }
}

function viewersForStream(payloadJson: string, target: string): number | null {
  const parsed = safeJson(payloadJson)
  const payload = asRecord(parsed)
  const rawItems = Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.data) ? payload.data : []

  for (const raw of rawItems) {
    const record = asRecord(raw)
    if (!record) continue
    const channel = asRecord(record.channel)
    const livestream = asRecord(record.livestream)
    const id = normalizeId(stringValue(
      record.channelLogin
      ?? record.id
      ?? record.login
      ?? record.user_login
      ?? record.slug
      ?? record.username
      ?? record.user_slug
      ?? channel?.slug
      ?? channel?.username
      ?? channel?.name,
    ))
    if (!id || id !== target) continue

    const viewers = numberValue(
      record.viewers
      ?? record.viewer_count
      ?? record.viewerCount
      ?? livestream?.viewer_count,
    )
    return viewers > 0 ? viewers : null
  }

  return null
}

function safeJson(value: string): unknown {
  try { return JSON.parse(value) } catch { return null }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function numberValue(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''))
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0
  }
  return 0
}

function normalizeId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100)
}
