import type { Env } from '../../_db/env'
import {
  floorToBucketMinute,
  markCollectorAttempt,
  markCollectorFailure,
  readLatestSnapshotItems,
  type StoredHeatmapItem,
  writeSnapshot,
} from '../../_lib/twitch-hot-store'

type TwitchTokenResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
}

type TwitchStreamsResponse = {
  data?: Array<{
    user_login?: string
    user_name?: string
    viewer_count?: number
    started_at?: string
  }>
  pagination?: {
    cursor?: string
  }
}

const PROVIDER = 'twitch'
const PAGE_SIZE = 100
const MAX_PAGES = 3

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const token = readToken(request)
  if (!token || token !== env.INGEST_TOKEN) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const attemptedAt = new Date().toISOString()
  await markCollectorAttempt(env, PROVIDER, attemptedAt)

  try {
    const accessToken = await getAppAccessToken(env.TWITCH_CLIENT_ID, env.TWITCH_CLIENT_SECRET)
    const previousItems = await readLatestSnapshotItems(env, PROVIDER)
    const previousMap = new Map(previousItems.map((item) => [item.channelLogin, item]))
    const { items, coveredPages, hasMore } = await collectTopStreams(env.TWITCH_CLIENT_ID, accessToken, previousMap)

    if (!items.length) {
      throw new Error('twitch_streams_empty')
    }

    const collectedAt = new Date().toISOString()
    const bucketMinute = floorToBucketMinute(collectedAt)
    const result = await writeSnapshot(env, {
      provider: PROVIDER,
      bucketMinute,
      collectedAt,
      coveredPages,
      hasMore,
      items,
      sourceMode: 'real',
    })

    return Response.json({
      ok: true,
      provider: PROVIDER,
      sourceMode: 'real',
      bucketMinute,
      collectedAt,
      streamCount: result.streamCount,
      totalViewers: result.totalViewers,
      coveredPages,
      hasMore,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    await markCollectorFailure(env, PROVIDER, attemptedAt, message)
    return Response.json({ ok: false, error: message }, { status: 500 })
  }
}

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (!clientId || !clientSecret) {
    throw new Error('twitch_credentials_missing')
  }

  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')

  const response = await fetch(url.toString(), { method: 'POST' })
  if (!response.ok) {
    throw new Error(`twitch_token_http_${response.status}`)
  }

  const json = (await response.json()) as TwitchTokenResponse
  if (!json.access_token) {
    throw new Error('twitch_token_missing')
  }

  return json.access_token
}

async function collectTopStreams(
  clientId: string,
  accessToken: string,
  previousMap: Map<string, StoredHeatmapItem>,
): Promise<{ items: StoredHeatmapItem[]; coveredPages: number; hasMore: boolean }> {
  const items: StoredHeatmapItem[] = []
  let cursor = ''
  let coveredPages = 0
  let hasMore = false

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL('https://api.twitch.tv/helix/streams')
    url.searchParams.set('first', String(PAGE_SIZE))
    if (cursor) url.searchParams.set('after', cursor)

    const response = await fetch(url.toString(), {
      headers: {
        'Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`twitch_streams_http_${response.status}`)
    }

    const json = (await response.json()) as TwitchStreamsResponse
    const pageItems = Array.isArray(json.data) ? json.data : []
    coveredPages += 1

    for (const stream of pageItems) {
      const channelLogin = String(stream.user_login ?? '').trim()
      const displayName = String(stream.user_name ?? '').trim()
      const viewers = clampInt(stream.viewer_count)
      if (!channelLogin || !displayName || viewers <= 0) continue

      const previous = previousMap.get(channelLogin)
      const previousViewers = previous?.viewers ?? viewers
      const momentumBase = previousViewers > 0 ? (viewers - previousViewers) / previousViewers : 0
      const startedAt = stream.started_at ? new Date(stream.started_at) : null
      const ageHours = startedAt && !Number.isNaN(startedAt.getTime())
        ? Math.max(0, (Date.now() - startedAt.getTime()) / 3_600_000)
        : 0
      const ageActivity = ageHours > 0 ? Math.max(0.04, Math.min(1, 1 / Math.max(1, ageHours))) : 0.12

      items.push({
        channelLogin,
        displayName,
        viewers,
        momentum: clampNumber(momentumBase),
        activity: clampNumber(ageActivity),
      })
    }

    cursor = String(json.pagination?.cursor ?? '').trim()
    if (!cursor) {
      hasMore = false
      break
    }

    hasMore = true
  }

  return { items, coveredPages, hasMore }
}

function readToken(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return request.headers.get('x-ingest-token')?.trim() ?? null
}

function clampInt(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n))
}

function clampNumber(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(-0.99, Math.min(9.99, n))
}
