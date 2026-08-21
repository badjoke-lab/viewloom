import collector from './index'
import { auditTwitchLocationEvidence, type TwitchLocationEvidenceInput } from './location-evidence-audit'
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
  data?: Array<TwitchLocationEvidenceInput>
  pagination?: {
    cursor?: string
  }
}

const LOCATION_AUDIT_PATH = '/audit/location-evidence'
const LOCATION_AUDIT_PAGE_SIZE = 100
const LOCATION_AUDIT_MAX_PAGES = 3
const LOCATION_AUDIT_PREVIEW_HOST = /^(?:[a-f0-9]{8}|audit-pr-\d+)-viewloom-collector-twitch\.[a-z0-9-]+\.workers\.dev$/i

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === LOCATION_AUDIT_PATH && request.method === 'POST') {
      const gate = requireAuditToken(request, env)
      if (!gate.ok) return json({ ok: false, error: gate.error }, gate.status)
      try {
        return json({ ok: true, result: await runLocationEvidenceAudit(env) })
      } catch (error) {
        return json({
          ok: false,
          error: sanitizeAuditError(error),
        }, 502)
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

async function runLocationEvidenceAudit(env: Env) {
  const clientId = String(env.TWITCH_CLIENT_ID ?? '').trim()
  const clientSecret = String(env.TWITCH_CLIENT_SECRET ?? '').trim()
  if (!clientId || !clientSecret) throw new Error('twitch_credentials_missing')

  const accessToken = await getAppAccessToken(clientId, clientSecret)
  const streams: TwitchLocationEvidenceInput[] = []
  let cursor = ''
  let coveredPages = 0
  let hasMore = false

  for (let page = 0; page < LOCATION_AUDIT_MAX_PAGES; page += 1) {
    const url = new URL('https://api.twitch.tv/helix/streams')
    url.searchParams.set('first', String(LOCATION_AUDIT_PAGE_SIZE))
    if (cursor) url.searchParams.set('after', cursor)

    const response = await fetch(url.toString(), {
      headers: {
        'Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!response.ok) throw new Error(`twitch_streams_http_${response.status}`)

    const data = await response.json() as TwitchStreamsResponse
    const pageItems = Array.isArray(data.data) ? data.data : []
    streams.push(...pageItems.map((stream) => ({
      title: stream.title,
      tags: stream.tags,
      language: stream.language,
    })))
    coveredPages += 1

    cursor = String(data.pagination?.cursor ?? '').trim()
    if (!cursor) {
      hasMore = false
      break
    }
    hasMore = true
  }

  return {
    provider: 'twitch',
    mode: 'read_only_manual_audit',
    observedAt: new Date().toISOString(),
    coveredPages,
    streamCount: streams.length,
    hasMore,
    apiRequests: {
      token: 1,
      streams: coveredPages,
      users: 0,
    },
    persistence: {
      d1Writes: 0,
      rawTitleStored: false,
      rawTagsStored: false,
      rawLanguageStored: false,
    },
    audit: auditTwitchLocationEvidence(streams),
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
  if (!data.access_token) throw new Error('twitch_token_missing')
  return data.access_token
}

function requireAuditToken(request: Request, env: Env):
  | { ok: true }
  | { ok: false; error: string; status: number } {
  if (isLocationAuditPreviewRequest(request)) return { ok: true }

  const expected = String(env.TWITCH_INGEST_TOKEN ?? '').trim()
  if (!expected) return { ok: false, error: 'audit_token_not_configured', status: 503 }

  const auth = request.headers.get('authorization')
  const token = auth?.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : request.headers.get('x-ingest-token')?.trim()
  if (token && token === expected) return { ok: true }
  return { ok: false, error: 'unauthorized', status: 401 }
}

function isLocationAuditPreviewRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname
  return LOCATION_AUDIT_PREVIEW_HOST.test(hostname)
}

function sanitizeAuditError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 160)
}

function json(payload: unknown, status = 200): Response {
  return Response.json(payload, { status, headers: { 'cache-control': 'no-store' } })
}
