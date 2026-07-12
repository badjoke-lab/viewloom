import productionCollector from '../collector-kick/src/entry'
import { categoryFieldInventory, isRecord, text, type Raw } from './shared'

const AUDIT_TOKEN = '__CATEGORY_AUDIT_TOKEN__'
const AUDIT_PATH = '/__viewloom_category_source_audit__'
const SAMPLE_CHANNELS = 5

type Env = {
  DB_KICK_HOT: D1Database
  KICK_CHANNEL_SLUGS?: string
  KICK_INGEST_TOKEN?: string
  KICK_CLIENT_ID?: string
  KICK_CLIENT_SECRET?: string
  KICK_ACCESS_TOKEN?: string
  KICK_USE_AUTHENTICATED_CHANNEL_READS?: string
  INTRADAY_GENERATION_ENABLED?: string
}

type ProductionCollector = {
  fetch(request: Request, env: Env): Promise<Response>
  scheduled(event: ScheduledEvent, env: Env): Promise<void>
}

const production = productionCollector as ProductionCollector

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname !== AUDIT_PATH) return production.fetch(request, env)
    if (request.method !== 'POST' || request.headers.get('authorization') !== `Bearer ${AUDIT_TOKEN}`) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    try {
      const evidence = await auditKickCategorySources(env)
      return Response.json(evidence, { headers: { 'cache-control': 'no-store' } })
    } catch (error) {
      return Response.json({
        ok: false,
        provider: 'kick',
        error: sanitizeError(error),
      }, { status: 500, headers: { 'cache-control': 'no-store' } })
    }
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    await production.scheduled(event, env)
  },
}

async function auditKickCategorySources(env: Env) {
  const token = await getAppAccessToken(env)
  const primary = await fetchJson('https://api.kick.com/public/v1/livestreams?limit=100&sort=viewer_count', token)
  const primaryRows = Array.isArray(primary.data?.data) ? primary.data.data.filter(isRecord) : []
  const sampleSlugs = primaryRows.map(extractSlug).filter(Boolean).slice(0, SAMPLE_CHANNELS)

  const officialChannelRows: Raw[] = []
  const publicFallbackRows: Raw[] = []
  const officialStatuses: number[] = []
  const fallbackStatuses: number[] = []

  for (const slug of sampleSlugs) {
    const official = await fetchJson(`https://api.kick.com/public/v1/channels?slug=${encodeURIComponent(slug)}`, token)
    officialStatuses.push(official.status)
    const officialData = Array.isArray(official.data?.data) ? official.data?.data[0] : official.data
    if (isRecord(officialData)) officialChannelRows.push(officialData)

    const fallback = await fetchJson(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, null)
    fallbackStatuses.push(fallback.status)
    if (isRecord(fallback.data)) publicFallbackRows.push(fallback.data)
  }

  return {
    ok: primary.ok && primaryRows.length > 0,
    schemaVersion: 'viewloom-12a4-category-source-probe-v1',
    provider: 'kick',
    observedAt: new Date().toISOString(),
    sources: {
      primaryOfficialLivestreams: {
        endpoint: 'https://api.kick.com/public/v1/livestreams',
        sourceMode: 'official-livestreams',
        requestedLimit: 100,
        httpStatus: primary.status,
        inventory: categoryFieldInventory(primaryRows),
      },
      alternateOfficialChannels: {
        endpoint: 'https://api.kick.com/public/v1/channels?slug={slug}',
        sourceMode: 'authenticated',
        attemptedRows: sampleSlugs.length,
        successfulRows: officialChannelRows.length,
        httpStatuses: [...new Set(officialStatuses)].sort((a, b) => a - b),
        inventory: categoryFieldInventory(officialChannelRows),
      },
      publicChannelFallback: {
        endpoint: 'https://kick.com/api/v2/channels/{slug}',
        sourceMode: 'public-channel-fallback',
        attemptedRows: sampleSlugs.length,
        successfulRows: publicFallbackRows.length,
        httpStatuses: [...new Set(fallbackStatuses)].sort((a, b) => a - b),
        inventory: categoryFieldInventory(publicFallbackRows),
      },
    },
    privacy: {
      channelIdentitiesIncluded: false,
      streamTitlesIncluded: false,
      rawRowsIncluded: false,
      credentialsIncluded: false,
    },
    boundaries: {
      readOnlyUpstreamProbe: true,
      d1ReadPerformed: false,
      d1WritePerformed: false,
      collectorScheduledBehaviorDelegated: true,
      providerSeparated: true,
    },
  }
}

async function getAppAccessToken(env: Env): Promise<string> {
  if (env.KICK_ACCESS_TOKEN) return env.KICK_ACCESS_TOKEN
  if (!env.KICK_CLIENT_ID || !env.KICK_CLIENT_SECRET) throw new Error('kick_credentials_missing')
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.KICK_CLIENT_ID,
    client_secret: env.KICK_CLIENT_SECRET,
  })
  const response = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  })
  if (!response.ok) throw new Error(`kick_token_http_${response.status}`)
  const data = await response.json() as Raw
  const token = text(data.access_token)
  if (!token) throw new Error('kick_token_missing')
  return token
}

async function fetchJson(url: string, token: string | null): Promise<{ ok: boolean; status: number; data: Raw | null }> {
  const headers = new Headers({ accept: 'application/json', 'user-agent': 'ViewLoom/12A-4-category-source-audit' })
  if (token) headers.set('authorization', `Bearer ${token}`)
  const response = await fetch(url, { headers })
  const body = await response.text()
  let data: Raw | null = null
  try {
    const parsed = JSON.parse(body)
    data = isRecord(parsed) ? parsed : null
  } catch {
    data = null
  }
  return { ok: response.ok, status: response.status, data }
}

function extractSlug(row: Raw): string {
  const channel = isRecord(row.channel) ? row.channel : null
  return text(row.slug ?? row.channel_slug ?? channel?.slug)
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]').slice(0, 200)
}
