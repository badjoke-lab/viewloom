import collector from './index'
import { categoryCaptureEnabled } from '../../shared/category-capture'
import { maybeGenerateCategoryIntradayRollups } from '../../shared/category-intraday-rollup'
import { maybeApplyIntradaySchema } from '../../shared/intraday-schema'
import {
  intradayGenerationEnabled,
  maybeGenerateIntradayRollups,
} from '../../shared/intraday-rollup'

type Env = {
  DB_TWITCH_HOT: D1Database
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
  TWITCH_INGEST_TOKEN?: string
  INTRADAY_GENERATION_ENABLED?: string
  CATEGORY_CAPTURE_ENABLED?: string
}

type TwitchTokenResponse = {
  access_token?: string
}

type TwitchStreamsResponse = {
  data?: Array<{
    user_id?: string
    user_login?: string
    user_name?: string
    viewer_count?: number
  }>
}

const TOP20_REPLICATION_AUDIT_PATH = '/audit/top20-replication-sample'
const TOP20_REPLICATION_PREVIEW_HOST = /^(?:[a-f0-9]{8}|top20-r2-pr-\d+)-viewloom-collector-twitch\.[a-z0-9-]+\.workers\.dev$/i

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === TOP20_REPLICATION_AUDIT_PATH && request.method === 'POST') {
      if (!TOP20_REPLICATION_PREVIEW_HOST.test(url.hostname)) {
        return Response.json({ ok: false, error: 'preview_only' }, { status: 404 })
      }
      try {
        return Response.json({ ok: true, result: await runTop20ReplicationSample(env) }, {
          headers: { 'cache-control': 'no-store' },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return Response.json({ ok: false, error: message.slice(0, 160) }, {
          status: 502,
          headers: { 'cache-control': 'no-store' },
        })
      }
    }

    return collector.fetch(request, env)
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await collector.scheduled(event, env)
    } finally {
      const schemaBootstrap = await maybeApplyIntradaySchema(env.DB_TWITCH_HOT)
      if (schemaBootstrap.attempted) {
        console.log(JSON.stringify({
          event: 'intraday_schema_bootstrap',
          provider: 'twitch',
          ...schemaBootstrap,
        }))
      }

      const generationConfig = {
        provider: 'twitch' as const,
        streamerCap: 600,
        bucketMinutes: 5,
        enabled: intradayGenerationEnabled(env.INTRADAY_GENERATION_ENABLED),
      }
      const categoryEnabled = categoryCaptureEnabled(env.CATEGORY_CAPTURE_ENABLED)
      const intradayGeneration = categoryEnabled && generationConfig.enabled
        ? await maybeGenerateCategoryIntradayRollups(env.DB_TWITCH_HOT, generationConfig)
        : await maybeGenerateIntradayRollups(env.DB_TWITCH_HOT, generationConfig)
      if (intradayGeneration.attempted) {
        console.log(JSON.stringify({
          event: categoryEnabled ? 'category_intraday_rollup_generation' : 'intraday_rollup_generation',
          worker: 'viewloom-collector-twitch',
          ...intradayGeneration,
        }))
      }
    }
  },
}

async function runTop20ReplicationSample(env: Env) {
  const clientId = String(env.TWITCH_CLIENT_ID ?? '').trim()
  const clientSecret = String(env.TWITCH_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('twitch_credentials_missing')

  const accessToken = await getAppAccessToken(clientId, clientSecret)
  const url = new URL('https://api.twitch.tv/helix/streams')
  url.searchParams.set('first', '20')

  const response = await fetch(url.toString(), {
    headers: {
      'Client-Id': clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  })
  if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

  const payload = await response.json() as TwitchStreamsResponse
  const rows = Array.isArray(payload.data) ? payload.data.slice(0, 20) : []
  const identities = rows.map((row, index) => ({
    rank: index + 1,
    userId: String(row.user_id ?? '').trim(),
    login: String(row.user_login ?? '').trim(),
    displayName: String(row.user_name ?? '').trim(),
    viewers: Number(row.viewer_count ?? 0),
  }))

  return {
    provider: 'twitch',
    mode: 'read_only_fixed_top20_replication_sample',
    observedAt: new Date().toISOString(),
    sampleSize: identities.length,
    requestedSize: 20,
    apiRequests: {
      token: 1,
      streams: 1,
      users: 0,
    },
    persistence: {
      d1Writes: 0,
      productionDeployment: false,
      rawTitleStored: false,
      rawTagsStored: false,
      rawLanguageStored: false,
      rawProfileDescriptionStored: false,
      identitySampleArtifactOnly: true,
    },
    fieldsIncluded: ['rank', 'userId', 'login', 'displayName', 'viewers'],
    identities,
  }
}

async function getAppAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const url = new URL('https://id.twitch.tv/oauth2/token')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('client_secret', clientSecret)
  url.searchParams.set('grant_type', 'client_credentials')

  const response = await fetch(url.toString(), { method: 'POST' })
  if (!response.ok) throw new Error(`twitch_token_http_${response.status}`)

  const data = await response.json() as TwitchTokenResponse
  const token = String(data.access_token ?? '').trim()
  if (!token) throw new Error('twitch_token_missing')
  return token
}
